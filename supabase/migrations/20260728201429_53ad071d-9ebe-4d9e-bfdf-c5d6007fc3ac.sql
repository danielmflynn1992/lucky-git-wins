-- 1. Question bank
CREATE TABLE public.question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  answer_format text NOT NULL DEFAULT 'integer' CHECK (answer_format IN ('integer','time_24h')),
  correct_answer bigint NOT NULL,
  category text NOT NULL DEFAULT 'arithmetic',
  is_active boolean NOT NULL DEFAULT true,
  times_served integer NOT NULL DEFAULT 0,
  times_correct integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No client role may read this table at all (correct_answer must never leak).
GRANT ALL ON public.question_bank TO service_role;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: all access goes through SECURITY DEFINER functions.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER question_bank_updated_at BEFORE UPDATE ON public.question_bank
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Migrate existing skill_questions into the bank (best effort; old answers were a/b/c/d)
INSERT INTO public.question_bank (question_text, answer_format, correct_answer, category, is_active)
SELECT question_text, 'integer', 0, 'legacy', false FROM public.skill_questions;

-- 3. Competition -> question assignment
ALTER TABLE public.competitions
  ADD COLUMN question_id uuid REFERENCES public.question_bank(id);

DROP FUNCTION IF EXISTS public.ensure_skill_question_for_live() CASCADE;
DROP FUNCTION IF EXISTS public.skill_question_immutable() CASCADE;

ALTER TABLE public.competitions
  ADD CONSTRAINT competitions_live_needs_question
  CHECK (status <> 'live' OR question_id IS NOT NULL) NOT VALID;

-- 4. entry_answers rework (append-only evidence)
DELETE FROM public.entry_answers;
ALTER TABLE public.entry_answers
  DROP COLUMN IF EXISTS selected_option,
  DROP COLUMN IF EXISTS skill_question_id,
  ADD COLUMN question_id uuid REFERENCES public.question_bank(id),
  ADD COLUMN raw_answer text NOT NULL DEFAULT '',
  ADD COLUMN normalised_answer bigint;

CREATE UNIQUE INDEX IF NOT EXISTS entry_answers_order_ref_key ON public.entry_answers(order_ref);

DROP TABLE IF EXISTS public.skill_questions CASCADE;
DROP VIEW IF EXISTS public.skill_questions_public CASCADE;

-- 5. Normalisation helper
CREATE OR REPLACE FUNCTION public.normalise_numeric_answer(p_raw text)
RETURNS bigint LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE s text;
BEGIN
  IF p_raw IS NULL THEN RETURN NULL; END IF;
  s := regexp_replace(btrim(p_raw), '[,\s£$:]', '', 'g');
  s := regexp_replace(s, '\.0+$', '');
  IF s ~ '^-?[0-9]+$' THEN RETURN s::bigint; END IF;
  RETURN NULL;
END $$;

-- 6. Public question fetch (never returns correct_answer)
CREATE OR REPLACE FUNCTION public.get_competition_question(p_slug text)
RETURNS TABLE(id uuid, question_text text, answer_format text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id, q.question_text, q.answer_format
  FROM public.competitions c
  JOIN public.question_bank q ON q.id = c.question_id
  WHERE c.slug = p_slug AND c.status = 'live';
$$;
GRANT EXECUTE ON FUNCTION public.get_competition_question(text) TO anon, authenticated;

-- 7. Answer submission
DROP FUNCTION IF EXISTS public.submit_skill_answer(uuid, uuid, skill_option, uuid);

CREATE OR REPLACE FUNCTION public.submit_skill_answer(
  p_reservation_token uuid, p_question_id uuid, p_raw_answer text, p_order_ref uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_q public.question_bank;
  v_norm bigint;
  v_correct boolean;
  v_order uuid := coalesce(p_order_ref, gen_random_uuid());
  v_count int;
BEGIN
  SELECT * INTO v_q FROM public.question_bank WHERE id = p_question_id;
  IF v_q.id IS NULL THEN RAISE EXCEPTION 'question not found'; END IF;

  SELECT count(*) INTO v_count FROM public.tickets
    WHERE reservation_token = p_reservation_token AND status = 'reserved';
  IF v_count = 0 THEN RAISE EXCEPTION 'no reserved tickets for this reservation'; END IF;

  IF EXISTS (SELECT 1 FROM public.entry_answers WHERE order_ref = v_order) THEN
    RAISE EXCEPTION 'answer already submitted for this order';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.tickets
    WHERE reservation_token = p_reservation_token AND order_ref IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'answer already submitted for this order';
  END IF;

  v_norm := public.normalise_numeric_answer(p_raw_answer);
  IF v_norm IS NULL THEN RAISE EXCEPTION 'unparseable answer'; END IF;

  v_correct := (v_norm = v_q.correct_answer);

  INSERT INTO public.entry_answers
    (order_ref, user_id, competition_id, question_id, raw_answer, normalised_answer, is_correct)
  SELECT v_order, auth.uid(), t.competition_id, v_q.id, left(coalesce(p_raw_answer,''), 200), v_norm, v_correct
  FROM public.tickets t
  WHERE t.reservation_token = p_reservation_token AND t.status = 'reserved'
  LIMIT 1;

  UPDATE public.tickets
     SET order_ref = v_order, is_qualifying = v_correct
   WHERE reservation_token = p_reservation_token AND status = 'reserved';

  UPDATE public.question_bank
     SET times_served = times_served + 1,
         times_correct = times_correct + CASE WHEN v_correct THEN 1 ELSE 0 END
   WHERE id = v_q.id;

  RETURN jsonb_build_object('is_correct', v_correct, 'order_ref', v_order);
END $$;
GRANT EXECUTE ON FUNCTION public.submit_skill_answer(uuid, uuid, text, uuid) TO anon, authenticated;

-- 8. Assignment helper: pick an active question not used by a competition closed in the last 14 days
CREATE OR REPLACE FUNCTION public.pick_question_for_competition()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id FROM public.question_bank q
   WHERE q.is_active
     AND NOT EXISTS (
       SELECT 1 FROM public.competitions c
        WHERE c.question_id = q.id
          AND (c.status = 'live' OR c.ends_at > now() - interval '14 days')
     )
   ORDER BY q.times_served ASC, random()
   LIMIT 1;
$$;

-- 9. Admin RPCs (no direct table access for clients)
CREATE OR REPLACE FUNCTION public.admin_list_questions()
RETURNS TABLE(id uuid, question_text text, answer_format text, category text,
              is_active boolean, times_served integer, times_correct integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id, q.question_text, q.answer_format, q.category, q.is_active,
         q.times_served, q.times_correct, q.created_at
  FROM public.question_bank q
  WHERE public.has_role(auth.uid(), 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_questions() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_question(
  p_id uuid, p_question_text text, p_answer_format text, p_correct_answer bigint, p_category text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.question_bank(question_text, answer_format, correct_answer, category)
    VALUES (p_question_text, p_answer_format, p_correct_answer, coalesce(p_category,'arithmetic'))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.question_bank
       SET question_text = p_question_text, answer_format = p_answer_format,
           correct_answer = p_correct_answer, category = coalesce(p_category, category)
     WHERE id = p_id RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_upsert_question(uuid, text, text, bigint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_question_active(p_id uuid, p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.question_bank SET is_active = p_active WHERE id = p_id;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_question_active(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_answer_stats()
RETURNS TABLE(day date, attempts integer, incorrect integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT date_trunc('day', a.answered_at)::date AS day,
         count(*)::int,
         count(*) FILTER (WHERE NOT a.is_correct)::int
  FROM public.entry_answers a
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY 1 ORDER BY 1;
$$;
GRANT EXECUTE ON FUNCTION public.admin_answer_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_export_entry_answers()
RETURNS TABLE(answered_at timestamptz, competition_title text, question_text text,
              raw_answer text, normalised_answer bigint, is_correct boolean, order_ref uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.answered_at, c.title, q.question_text, a.raw_answer, a.normalised_answer, a.is_correct, a.order_ref
  FROM public.entry_answers a
  LEFT JOIN public.competitions c ON c.id = a.competition_id
  LEFT JOIN public.question_bank q ON q.id = a.question_id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY a.answered_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.admin_export_entry_answers() TO authenticated;

-- 10. Reveal the answer only after the draw
CREATE OR REPLACE FUNCTION public.competition_revealed_answer(p_slug text)
RETURNS TABLE(question_text text, correct_answer bigint, answer_format text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.question_text, q.correct_answer, q.answer_format
  FROM public.competitions c
  JOIN public.question_bank q ON q.id = c.question_id
  WHERE c.slug = p_slug AND c.status = 'drawn';
$$;
GRANT EXECUTE ON FUNCTION public.competition_revealed_answer(text) TO anon, authenticated;

-- 11. Competition creation now takes a question id (auto-picked when null)
DROP FUNCTION IF EXISTS public.create_competition_with_tickets(text,text,text,text,text,text,numeric,integer,integer,integer,timestamptz,text,boolean,text,text,text,text,text,skill_option,text);
DROP FUNCTION IF EXISTS public.create_competition_with_tickets(text,text,text,text,text,text,numeric,integer,integer,integer,timestamptz,text,boolean,text,text,text,text,text,skill_option,text,text,text[]);

CREATE OR REPLACE FUNCTION public.create_competition_with_tickets(
  p_slug text, p_title text, p_subtitle text, p_category text, p_image text, p_description text,
  p_price_per_ticket numeric, p_total_tickets integer, p_cash_alternative integer,
  p_max_per_person integer, p_ends_at timestamptz, p_status text, p_hot boolean,
  p_letterbox_style text DEFAULT 'blur', p_thumb_url text DEFAULT NULL,
  p_supporting_images text[] DEFAULT '{}', p_question_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_id uuid; v_seed text; v_hash text; v_style public.letterbox_style; v_qid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_total_tickets < 1 OR p_total_tickets > 499 THEN
    RAISE EXCEPTION 'total tickets must be between 1 and 499';
  END IF;
  IF coalesce(array_length(p_supporting_images, 1), 0) > 5 THEN
    RAISE EXCEPTION 'no more than 5 supporting images';
  END IF;

  v_qid := coalesce(p_question_id, public.pick_question_for_competition());
  IF v_qid IS NULL THEN RAISE EXCEPTION 'no eligible question available in the bank'; END IF;

  BEGIN v_style := coalesce(p_letterbox_style,'blur')::public.letterbox_style;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid letterbox_style: %', p_letterbox_style;
  END;

  v_seed := encode(extensions.gen_random_bytes(32),'hex');
  v_hash := encode(extensions.digest(v_seed,'sha256'),'hex');

  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description,
    price_per_ticket, total_tickets, cash_alternative, max_per_person,
    ends_at, status, hot, seed_hash, letterbox_style, thumb_url, supporting_images, question_id
  ) VALUES (
    p_slug, p_title, coalesce(p_subtitle,''), p_category, coalesce(p_image,''), coalesce(p_description,''),
    p_price_per_ticket, p_total_tickets, p_cash_alternative, p_max_per_person,
    p_ends_at, 'draft', coalesce(p_hot,false), v_hash, v_style,
    p_thumb_url, coalesce(p_supporting_images, '{}'::text[]), v_qid
  ) RETURNING id INTO v_id;

  INSERT INTO public.competition_secrets(competition_id, seed) VALUES (v_id, v_seed);

  INSERT INTO public.tickets (competition_id, number, status)
    SELECT v_id, g, 'available' FROM generate_series(1, p_total_tickets) g;

  IF coalesce(p_status,'live') <> 'draft' THEN
    UPDATE public.competitions SET status = p_status WHERE id = v_id;
  END IF;

  RETURN v_id;
END $$;

-- 12. Seed the bank
INSERT INTO public.question_bank (question_text, answer_format, correct_answer, category) VALUES
('What is (12 × 4) + 17 − 9?', 'integer', 56, 'arithmetic'),
('What is (144 ÷ 12) × 7 − 23?', 'integer', 61, 'arithmetic'),
('What is 15% of 340, plus 128?', 'integer', 179, 'arithmetic'),
('What is (25 × 8) − (96 ÷ 4)?', 'integer', 176, 'arithmetic'),
('Take a third of 279, then subtract 47.', 'integer', 46, 'arithmetic'),
('What is 7² + 6², minus 19?', 'integer', 66, 'arithmetic'),
('What is (18 × 15) ÷ 5, plus 88?', 'integer', 142, 'arithmetic'),
('What is 20% of 645, doubled?', 'integer', 258, 'arithmetic'),
('Subtract 289 from 456, then add 94.', 'integer', 261, 'arithmetic'),
('What is (11 × 11) − (9 × 7)?', 'integer', 58, 'arithmetic'),
('What is 35% of 200, plus 17% of 300?', 'integer', 121, 'arithmetic'),
('Multiply 23 by 6, then subtract a quarter of 96.', 'integer', 114, 'arithmetic'),
('What is 480 ÷ 16, multiplied by 9?', 'integer', 270, 'arithmetic'),
('Add 17, 43 and 68, then subtract 55.', 'integer', 73, 'arithmetic'),
('What is 9 × 13, minus 8 × 7?', 'integer', 61, 'arithmetic'),
('What number comes next: 3, 7, 15, 31, ?', 'integer', 63, 'sequence'),
('What number comes next: 2, 6, 12, 20, 30, ?', 'integer', 42, 'sequence'),
('What number comes next: 1, 4, 9, 16, 25, ?', 'integer', 36, 'sequence'),
('What number comes next: 100, 92, 83, 73, 62, ?', 'integer', 50, 'sequence'),
('What number comes next: 5, 11, 23, 47, ?', 'integer', 95, 'sequence'),
('A train leaves at 14:35. The journey takes 2 hours 50 minutes. What time does it arrive? (24-hour, no colon)', 'time_24h', 1725, 'time'),
('A film starts at 19:45 and runs 135 minutes. What time does it finish? (24-hour, no colon)', 'time_24h', 2200, 'time'),
('If a job takes 3 hours 40 minutes and starts at 16:50, what time does it end? (24-hour, no colon)', 'time_24h', 2030, 'time'),
('How many minutes are there between 09:20 and 13:05?', 'integer', 225, 'time'),
('How many hours are there in 8 days?', 'integer', 192, 'time'),
('A van holds 24 boxes. Each box holds 15 items. How many items in three full vans?', 'integer', 1080, 'word'),
('Six people split a £234 bill equally, then each pays an extra £4 tip. What does each person pay in total, in pounds?', 'integer', 43, 'word'),
('A shop sells 145 items on Monday, 30 fewer on Tuesday, and twice Tuesday''s total on Wednesday. How many on Wednesday?', 'integer', 230, 'word'),
('A tank holds 900 litres. It''s three-fifths full, then 120 litres are added. How many litres are in it now?', 'integer', 660, 'word'),
('A wall needs 1,250 bricks. You have 14 packs of 80. How many bricks short are you?', 'integer', 130, 'word');

-- 13. Assign questions to existing competitions and validate the constraint
WITH ranked AS (
  SELECT c.id, row_number() OVER (ORDER BY c.created_at) AS rn
  FROM public.competitions c WHERE c.question_id IS NULL
), q AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn, count(*) OVER () AS total
  FROM public.question_bank WHERE is_active
)
UPDATE public.competitions c
   SET question_id = q.id
  FROM ranked r JOIN q ON q.rn = ((r.rn - 1) % q.total) + 1
 WHERE c.id = r.id;

ALTER TABLE public.competitions VALIDATE CONSTRAINT competitions_live_needs_question;

DROP TYPE IF EXISTS public.skill_option;