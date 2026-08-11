-- 1. Rolling demo flag
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS is_rolling_demo boolean NOT NULL DEFAULT false;

-- 2. Single source for demo labelling: draws inherit is_demo from their competition
CREATE OR REPLACE FUNCTION public.draws_inherit_demo_flag()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.competition_id IS NOT NULL THEN
    SELECT c.is_demo INTO NEW.is_demo FROM public.competitions c WHERE c.id = NEW.competition_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_draws_inherit_demo ON public.draws;
CREATE TRIGGER trg_draws_inherit_demo BEFORE INSERT ON public.draws
FOR EACH ROW EXECUTE FUNCTION public.draws_inherit_demo_flag();

-- 3. Draw-complete notification outbox (admin/test recipients only)
CREATE TABLE IF NOT EXISTS public.draw_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid REFERENCES public.draws(id) ON DELETE CASCADE,
  competition_title text NOT NULL,
  is_demo boolean NOT NULL DEFAULT false,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

GRANT SELECT ON public.draw_notifications TO authenticated;
GRANT ALL ON public.draw_notifications TO service_role;
ALTER TABLE public.draw_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read draw notifications" ON public.draw_notifications;
CREATE POLICY "admins read draw notifications" ON public.draw_notifications
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.queue_draw_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prefix text := CASE WHEN NEW.is_demo THEN '[DEMO] ' ELSE '' END;
  v_subject text;
  v_body text;
  v_count int := 0;
  r record;
BEGIN
  v_subject := v_prefix || 'Draw complete: ' || NEW.competition_title;
  v_body := 'Competition: ' || NEW.competition_title || E'\n' ||
            'Winning ticket: #' || NEW.winning_number || ' of ' || NEW.total_tickets || E'\n' ||
            'Drawn at: ' || to_char(NEW.drawn_at, 'YYYY-MM-DD HH24:MI:SS TZ') || E'\n' ||
            'Draw ID: ' || NEW.id::text || E'\n' ||
            'Seed hash: ' || NEW.seed_hash || E'\n' ||
            CASE WHEN NEW.is_demo
              THEN E'\nThis is an EXAMPLE draw. The verification is real, the prize was not.'
              ELSE '' END;

  FOR r IN
    SELECT u.email FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
    WHERE u.email IS NOT NULL
  LOOP
    INSERT INTO public.draw_notifications(draw_id, competition_title, is_demo, recipient, subject, body)
    VALUES (NEW.id, NEW.competition_title, NEW.is_demo, r.email, v_subject, v_body);
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    INSERT INTO public.draw_notifications(draw_id, competition_title, is_demo, recipient, subject, body, status, detail)
    VALUES (NEW.id, NEW.competition_title, NEW.is_demo, '(no admin recipients)', v_subject, v_body,
            'skipped', 'No admin account with an email address exists yet.');
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_queue_draw_notification ON public.draws;
CREATE TRIGGER trg_queue_draw_notification AFTER INSERT ON public.draws
FOR EACH ROW EXECUTE FUNCTION public.queue_draw_notification();

-- 4. Rolling demo competition
CREATE OR REPLACE FUNCTION public.spawn_rolling_demo()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_id uuid; v_seed text; v_hash text; v_qid uuid; v_slug text; v_sold int;
BEGIN
  SELECT id INTO v_id FROM public.competitions
   WHERE is_rolling_demo AND status = 'live' AND ends_at > now() LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  v_slug := 'example-500-tester-' || to_char(now(), 'YYYYMMDDHH24MISS');
  v_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_seed, 'sha256'), 'hex');
  v_qid := public.pick_question_for_competition();

  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description, price_per_ticket, total_tickets,
    cash_alternative, max_per_person, ends_at, status, hot, seed_hash, question_id,
    is_demo, is_rolling_demo
  ) VALUES (
    v_slug, 'Example: £500 Tester',
    'Rolling example — closes every 48 hours and draws itself',
    'cash', '',
    'An example competition used to prove the draw pipeline end to end. It closes every 48 hours, draws automatically, publishes a verifiable result and respawns. No prize is awarded.',
    1.00, 499, 500, 25, now() + interval '48 hours', 'live', false, v_hash, v_qid,
    true, true
  ) RETURNING id INTO v_id;

  INSERT INTO public.competition_secrets(competition_id, seed) VALUES (v_id, v_seed);
  INSERT INTO public.tickets (competition_id, number, status)
    SELECT v_id, g, 'available' FROM generate_series(1, 499) g;

  v_sold := 120 + floor(random() * 160)::int;
  UPDATE public.tickets SET status = 'sold', is_qualifying = true
   WHERE id IN (
     SELECT id FROM public.tickets WHERE competition_id = v_id AND status = 'available'
     ORDER BY random() LIMIT v_sold
   );

  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rolling_demo_tick()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; v_drawn int := 0; v_id uuid;
BEGIN
  FOR r IN SELECT id FROM public.competitions
            WHERE is_rolling_demo AND status = 'live' AND ends_at <= now()
  LOOP
    BEGIN
      PERFORM public.draw_competition(r.id, 'rolling example auto-draw');
      v_drawn := v_drawn + 1;
    EXCEPTION WHEN OTHERS THEN CONTINUE;
    END;
  END LOOP;
  v_id := public.spawn_rolling_demo();
  RETURN jsonb_build_object('drawn', v_drawn, 'live_id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.admin_close_competition_now(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.competitions SET ends_at = now() - interval '1 second'
   WHERE id = p_id AND status <> 'drawn';
END $$;

CREATE OR REPLACE FUNCTION public.admin_reset_rolling_demo()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.competitions SET ends_at = now() - interval '1 second'
   WHERE is_rolling_demo AND status = 'live';
  RETURN public.rolling_demo_tick();
END $$;

-- 5. Execute the backlog through the real pipeline
DELETE FROM public.draws WHERE is_demo;

UPDATE public.competitions SET status = 'live' WHERE is_demo AND status = 'drawn';

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.competitions WHERE is_demo AND status = 'live' ORDER BY ends_at
  LOOP
    BEGIN
      PERFORM public.draw_competition(r.id, 'example competition — real draw pipeline');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skipped %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- 6. Start the rolling example
SELECT public.spawn_rolling_demo();