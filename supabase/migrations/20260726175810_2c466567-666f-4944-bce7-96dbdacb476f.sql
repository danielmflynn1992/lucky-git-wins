
-- ============ 1. TEARDOWN: free entry & instant wins ============
DROP FUNCTION IF EXISTS public.submit_free_entry(text, text, text, text) CASCADE;
DROP TABLE IF EXISTS public.free_entries CASCADE;

ALTER TABLE public.tickets DROP COLUMN IF EXISTS entry_method;
DROP TYPE IF EXISTS public.entry_method;

ALTER TABLE public.tickets DROP COLUMN IF EXISTS is_instant_win;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS instant_win_prize;
ALTER TABLE public.competitions DROP COLUMN IF EXISTS instant_win;
ALTER TABLE public.competitions DROP COLUMN IF EXISTS free_entry_enabled;
ALTER TABLE public.competitions DROP COLUMN IF EXISTS skill_question;

-- ============ 2. TICKETS: qualifying flag ============
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS is_qualifying boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_ref uuid;

-- Preserve in-flight comps: any already-sold ticket qualifies retrospectively
UPDATE public.tickets SET is_qualifying = true WHERE status = 'sold';

CREATE INDEX IF NOT EXISTS tickets_comp_qualifying_idx
  ON public.tickets(competition_id, is_qualifying) WHERE is_qualifying = true;

-- ============ 3. DRAWS: qualifying-pool metadata ============
ALTER TABLE public.draws
  ADD COLUMN IF NOT EXISTS total_sold integer,
  ADD COLUMN IF NOT EXISTS qualifying_pool_size integer,
  ADD COLUMN IF NOT EXISTS drew_from text NOT NULL DEFAULT 'qualifying';

-- ============ 4. SKILL QUESTIONS ============
DO $$ BEGIN
  CREATE TYPE public.skill_option AS ENUM ('a','b','c','d');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.skill_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL UNIQUE REFERENCES public.competitions(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option public.skill_option NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants: NO select for anon/authenticated (correct_option is secret).
-- Reads go through skill_questions_public view or SECURITY DEFINER RPC.
GRANT ALL ON public.skill_questions TO service_role;
ALTER TABLE public.skill_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage skill questions" ON public.skill_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public view: strips correct_option
CREATE OR REPLACE VIEW public.skill_questions_public
WITH (security_invoker = true)
AS SELECT id, competition_id, question_text, option_a, option_b, option_c, option_d
   FROM public.skill_questions;
GRANT SELECT ON public.skill_questions_public TO anon, authenticated;

-- Trigger: block competitions.status='live' without a question
CREATE OR REPLACE FUNCTION public.ensure_skill_question_for_live()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'live' AND NOT EXISTS (
    SELECT 1 FROM public.skill_questions WHERE competition_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'competition cannot go live without a skill question';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ensure_skill_question ON public.competitions;
CREATE TRIGGER trg_ensure_skill_question
  BEFORE INSERT OR UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.ensure_skill_question_for_live();

-- Trigger: block question edits once any answer exists (evidence-log integrity)
CREATE OR REPLACE FUNCTION public.skill_question_immutable()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.entry_answers WHERE skill_question_id = OLD.id) THEN
    IF NEW.question_text <> OLD.question_text
       OR NEW.option_a <> OLD.option_a OR NEW.option_b <> OLD.option_b
       OR NEW.option_c <> OLD.option_c OR NEW.option_d <> OLD.option_d
       OR NEW.correct_option <> OLD.correct_option THEN
      RAISE EXCEPTION 'skill question is immutable once answers exist';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ============ 5. ENTRY ANSWERS (evidence log) ============
CREATE TABLE IF NOT EXISTS public.entry_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  skill_question_id uuid NOT NULL REFERENCES public.skill_questions(id) ON DELETE CASCADE,
  selected_option public.skill_option NOT NULL,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entry_answers_comp_idx ON public.entry_answers(competition_id);
CREATE INDEX IF NOT EXISTS entry_answers_user_idx ON public.entry_answers(user_id);
CREATE INDEX IF NOT EXISTS entry_answers_order_idx ON public.entry_answers(order_ref);

GRANT SELECT ON public.entry_answers TO authenticated;
GRANT ALL ON public.entry_answers TO service_role;
ALTER TABLE public.entry_answers ENABLE ROW LEVEL SECURITY;

-- No INSERT/UPDATE/DELETE policies → only SECURITY DEFINER RPCs write here
CREATE POLICY "users read own answers" ON public.entry_answers
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all answers" ON public.entry_answers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_skill_question_immutable ON public.skill_questions;
CREATE TRIGGER trg_skill_question_immutable
  BEFORE UPDATE ON public.skill_questions
  FOR EACH ROW EXECUTE FUNCTION public.skill_question_immutable();

-- ============ 6. SUBMIT SKILL ANSWER ============
CREATE OR REPLACE FUNCTION public.submit_skill_answer(
  p_reservation_token uuid,
  p_question_id uuid,
  p_selected public.skill_option,
  p_order_ref uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_q public.skill_questions;
  v_correct boolean;
  v_order uuid := coalesce(p_order_ref, gen_random_uuid());
  v_comp_id uuid;
  v_uid uuid := auth.uid();
  v_count int;
BEGIN
  SELECT * INTO v_q FROM public.skill_questions WHERE id = p_question_id;
  IF v_q.id IS NULL THEN RAISE EXCEPTION 'question not found'; END IF;
  v_comp_id := v_q.competition_id;

  -- Ensure reservation exists and belongs to this competition
  SELECT count(*) INTO v_count FROM public.tickets
    WHERE reservation_token = p_reservation_token
      AND competition_id = v_comp_id
      AND status = 'reserved';
  IF v_count = 0 THEN RAISE EXCEPTION 'no reserved tickets for this reservation'; END IF;

  -- One answer per reservation
  IF EXISTS (SELECT 1 FROM public.entry_answers WHERE order_ref = v_order) THEN
    RAISE EXCEPTION 'answer already submitted for this order';
  END IF;

  v_correct := (p_selected = v_q.correct_option);

  INSERT INTO public.entry_answers
    (order_ref, user_id, competition_id, skill_question_id, selected_option, is_correct)
  VALUES (v_order, v_uid, v_comp_id, v_q.id, p_selected, v_correct);

  -- Tag the reserved tickets with the order + qualification
  UPDATE public.tickets
     SET order_ref = v_order,
         is_qualifying = v_correct
   WHERE reservation_token = p_reservation_token
     AND status = 'reserved';

  RETURN jsonb_build_object('is_correct', v_correct, 'order_ref', v_order);
END $$;

GRANT EXECUTE ON FUNCTION public.submit_skill_answer(uuid, uuid, public.skill_option, uuid)
  TO anon, authenticated;

-- ============ 7. REWRITE draw_competition (qualifying pool) ============
CREATE OR REPLACE FUNCTION public.draw_competition(p_comp_id uuid, p_notes text DEFAULT '')
RETURNS public.draws LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_comp public.competitions;
  v_seed text; v_hash text;
  v_pool text; v_pool_size int; v_pick_index int;
  v_total_sold int;
  v_win public.tickets;
  v_display text := ''; v_owner_email text;
  v_row public.draws; v_digest bytea;
BEGIN
  SELECT * INTO v_comp FROM public.competitions WHERE id = p_comp_id FOR UPDATE;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'competition not found'; END IF;
  IF v_comp.status = 'drawn' THEN RAISE EXCEPTION 'competition already drawn'; END IF;

  PERFORM public.sweep_expired_reservations();

  SELECT seed INTO v_seed FROM public.competition_secrets WHERE competition_id = p_comp_id;
  IF v_seed IS NULL THEN RAISE EXCEPTION 'no seed for competition'; END IF;
  v_hash := encode(digest(v_seed, 'sha256'), 'hex');

  SELECT count(*) INTO v_total_sold FROM public.tickets
    WHERE competition_id = p_comp_id AND status = 'sold';

  SELECT count(*) INTO v_pool_size FROM public.tickets
    WHERE competition_id = p_comp_id AND status = 'sold' AND is_qualifying = true;

  IF v_pool_size > 0 THEN
    v_pool := 'qualifying';
  ELSIF v_total_sold > 0 THEN
    -- Fallback: no correct answers → question treated as void (per T&Cs), draw from all sold
    v_pool := 'all_sold_fallback';
    v_pool_size := v_total_sold;
  ELSE
    RAISE EXCEPTION 'no tickets to draw';
  END IF;

  v_digest := digest('draw:' || p_comp_id::text || ':' || v_seed, 'sha256');
  v_pick_index := (
    (get_byte(v_digest,0)::bigint << 24) |
    (get_byte(v_digest,1)::bigint << 16) |
    (get_byte(v_digest,2)::bigint << 8)  |
    (get_byte(v_digest,3)::bigint)
  ) % v_pool_size;

  IF v_pool = 'qualifying' THEN
    SELECT * INTO v_win FROM public.tickets
      WHERE competition_id = p_comp_id AND status = 'sold' AND is_qualifying = true
      ORDER BY number OFFSET v_pick_index LIMIT 1;
  ELSE
    SELECT * INTO v_win FROM public.tickets
      WHERE competition_id = p_comp_id AND status = 'sold'
      ORDER BY number OFFSET v_pick_index LIMIT 1;
  END IF;
  IF v_win.id IS NULL THEN RAISE EXCEPTION 'no tickets to draw'; END IF;

  IF v_win.owner_id IS NOT NULL THEN
    SELECT email INTO v_owner_email FROM auth.users WHERE id = v_win.owner_id;
    IF v_owner_email IS NOT NULL THEN v_display := split_part(v_owner_email, '@', 1); END IF;
  END IF;
  IF v_display IS NULL OR length(v_display) = 0 THEN
    v_display := 'Ticket #' || v_win.number || ' holder';
  END IF;

  INSERT INTO public.draws (
    competition_id, competition_title, prize, winning_number,
    winner_display_name, winner_town, total_tickets, draw_method,
    verification_hash, seed_hash, seed_revealed, notes, drawn_at,
    total_sold, qualifying_pool_size, drew_from
  ) VALUES (
    p_comp_id, v_comp.title, v_comp.title, v_win.number,
    v_display, '', v_comp.total_tickets, 'automatic',
    v_hash, v_hash, v_seed,
    coalesce(p_notes,'') || CASE WHEN v_pool='all_sold_fallback'
      THEN ' (fallback: no qualifying entries — drew from all sold per T&Cs)'
      ELSE '' END,
    now(), v_total_sold, v_pool_size, v_pool
  ) RETURNING * INTO v_row;

  UPDATE public.competitions SET status='drawn' WHERE id = p_comp_id;
  RETURN v_row;
END $$;

-- ============ 8. REWRITE create_competition_with_tickets ============
DROP FUNCTION IF EXISTS public.create_competition_with_tickets(
  text,text,text,text,text,text,numeric,integer,integer,integer,timestamptz,text,boolean,boolean,integer,numeric,text
);

CREATE OR REPLACE FUNCTION public.create_competition_with_tickets(
  p_slug text, p_title text, p_subtitle text, p_category text, p_image text, p_description text,
  p_price_per_ticket numeric, p_total_tickets integer, p_cash_alternative integer, p_max_per_person integer,
  p_ends_at timestamptz, p_status text, p_hot boolean,
  p_question text, p_option_a text, p_option_b text, p_option_c text, p_option_d text,
  p_correct_option public.skill_option,
  p_letterbox_style text DEFAULT 'blur'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_id uuid; v_seed text; v_hash text; v_style public.letterbox_style;
BEGIN
  IF p_total_tickets < 1 OR p_total_tickets > 499 THEN
    RAISE EXCEPTION 'total tickets must be between 1 and 499';
  END IF;
  IF p_question IS NULL OR length(trim(p_question)) < 8 THEN
    RAISE EXCEPTION 'skill question is required';
  END IF;

  BEGIN v_style := coalesce(p_letterbox_style,'blur')::public.letterbox_style;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid letterbox_style: %', p_letterbox_style;
  END;

  v_seed := encode(extensions.gen_random_bytes(32),'hex');
  v_hash := encode(extensions.digest(v_seed,'sha256'),'hex');

  -- Insert competition as draft first so the live-check trigger doesn't fire
  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description,
    price_per_ticket, total_tickets, cash_alternative, max_per_person,
    ends_at, status, hot, seed_hash, letterbox_style
  ) VALUES (
    p_slug, p_title, coalesce(p_subtitle,''), p_category, coalesce(p_image,''), coalesce(p_description,''),
    p_price_per_ticket, p_total_tickets, p_cash_alternative, p_max_per_person,
    p_ends_at, 'draft', coalesce(p_hot,false), v_hash, v_style
  ) RETURNING id INTO v_id;

  INSERT INTO public.competition_secrets(competition_id, seed) VALUES (v_id, v_seed);

  INSERT INTO public.skill_questions(competition_id, question_text, option_a, option_b, option_c, option_d, correct_option)
    VALUES (v_id, p_question, p_option_a, p_option_b, p_option_c, p_option_d, p_correct_option);

  INSERT INTO public.tickets (competition_id, number, status)
    SELECT v_id, g, 'available' FROM generate_series(1, p_total_tickets) g;

  -- Now safe to flip to requested status
  IF coalesce(p_status,'live') <> 'draft' THEN
    UPDATE public.competitions SET status = p_status WHERE id = v_id;
  END IF;

  RETURN v_id;
END $$;

-- ============ 9. PROFILES + AGE GATE ============
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth date NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own profile" ON public.profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_age_gate()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.date_of_birth IS NULL OR NEW.date_of_birth > (current_date - interval '18 years')::date THEN
    RAISE EXCEPTION 'must be 18 or over';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_age_gate ON public.profiles;
CREATE TRIGGER trg_enforce_age_gate
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_age_gate();

-- ============ 10. Question performance view (admin) ============
CREATE OR REPLACE VIEW public.question_performance
WITH (security_invoker = true)
AS
SELECT
  c.id AS competition_id,
  c.slug,
  c.title,
  c.status,
  count(a.*)::int AS total_answers,
  count(*) FILTER (WHERE a.is_correct)::int AS correct_count,
  count(*) FILTER (WHERE NOT a.is_correct)::int AS incorrect_count,
  CASE WHEN count(a.*) > 0
    THEN round(100.0 * count(*) FILTER (WHERE NOT a.is_correct) / count(a.*), 1)
    ELSE 0 END AS incorrect_pct
FROM public.competitions c
LEFT JOIN public.entry_answers a ON a.competition_id = c.id
GROUP BY c.id;

GRANT SELECT ON public.question_performance TO authenticated;
