
-- Kill switch setting
INSERT INTO public.site_settings(key, value)
VALUES ('daily_demo', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_set_daily_demo(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.site_settings(key, value, updated_at)
  VALUES ('daily_demo', jsonb_build_object('enabled', p_enabled), now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN p_enabled;
END $$;

-- Spawn today's daily example competition (London 09:00 onwards, closes 19:00)
CREATE OR REPLACE FUNCTION public.spawn_daily_demo()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid; v_seed text; v_hash text; v_qid uuid; v_slug text; v_sold int;
  v_local timestamp := (now() AT TIME ZONE 'Europe/London');
  v_day date := v_local::date;
  v_open timestamptz := ((v_day::text || ' 09:00')::timestamp AT TIME ZONE 'Europe/London');
  v_close timestamptz := ((v_day::text || ' 19:00')::timestamp AT TIME ZONE 'Europe/London');
BEGIN
  IF NOT COALESCE((SELECT (value->>'enabled')::boolean FROM public.site_settings WHERE key = 'daily_demo'), true) THEN
    RETURN NULL;
  END IF;
  IF now() < v_open OR now() >= v_close THEN RETURN NULL; END IF;

  v_slug := 'example-daily-tester-' || to_char(v_day, 'YYYYMMDD');
  SELECT id INTO v_id FROM public.competitions WHERE slug = v_slug;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  v_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_seed, 'sha256'), 'hex');
  v_qid := public.pick_question_for_competition();

  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description, price_per_ticket, total_tickets,
    cash_alternative, max_per_person, ends_at, status, hot, seed_hash, question_id,
    is_demo, is_rolling_demo
  ) VALUES (
    v_slug, 'Example: Daily Tester',
    'Daily example — opens 09:00, closes 19:00 UK, draws itself',
    'cash', '',
    'An example competition used to prove the draw pipeline end to end every day. It opens at 09:00 UK, closes at 19:00 UK, draws automatically and publishes a verifiable result. No prize is awarded.',
    1.00, 499, 500, 25, v_close, 'live', false, v_hash, v_qid,
    true, true
  ) RETURNING id INTO v_id;

  INSERT INTO public.competition_secrets(competition_id, seed) VALUES (v_id, v_seed);
  INSERT INTO public.tickets (competition_id, number, status)
    SELECT v_id, g, 'available' FROM generate_series(1, 499) g;

  v_sold := round(499 * (0.40 + random() * 0.50))::int;
  UPDATE public.tickets SET status = 'sold', is_qualifying = true
   WHERE id IN (
     SELECT id FROM public.tickets WHERE competition_id = v_id AND status = 'available'
     ORDER BY random() LIMIT v_sold
   );

  RETURN v_id;
END $$;

-- Missed-draw alerts: any competition still live 5 minutes past its close time
CREATE OR REPLACE FUNCTION public.check_missed_draws()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record; a record; v_subject text; v_body text; v_alerts int := 0; v_sent int := 0;
BEGIN
  FOR r IN
    SELECT c.id, c.title, c.ends_at, c.is_demo, c.is_rolling_demo
      FROM public.competitions c
     WHERE c.status = 'live'
       AND c.ends_at <= now() - interval '5 minutes'
       AND NOT EXISTS (SELECT 1 FROM public.draws d WHERE d.competition_id = c.id)
  LOOP
    v_subject := CASE WHEN r.is_rolling_demo
      THEN '[DEMO] DAILY DRAW DID NOT FIRE — ' || to_char(r.ends_at AT TIME ZONE 'Europe/London', 'YYYY-MM-DD')
      ELSE 'DRAW DID NOT FIRE — ' || r.title || ' — ' || to_char(r.ends_at AT TIME ZONE 'Europe/London', 'YYYY-MM-DD HH24:MI') END;

    -- one alert per competition per close time
    IF EXISTS (SELECT 1 FROM public.draw_notifications n WHERE n.subject = v_subject) THEN
      CONTINUE;
    END IF;

    v_body := 'Competition: ' || r.title || E'\n' ||
              'Closed at: ' || to_char(r.ends_at AT TIME ZONE 'Europe/London', 'YYYY-MM-DD HH24:MI') || ' (UK)' || E'\n' ||
              'No draw record exists more than 5 minutes after close.' || E'\n' ||
              'Competition ID: ' || r.id::text;

    v_sent := 0;
    FOR a IN
      SELECT u.email FROM auth.users u
      JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
      WHERE u.email IS NOT NULL
    LOOP
      INSERT INTO public.draw_notifications(draw_id, competition_title, is_demo, recipient, subject, body, status, detail)
      VALUES (NULL, r.title, r.is_demo, a.email, v_subject, v_body, 'alert', 'Missed draw alert');
      v_sent := v_sent + 1;
    END LOOP;

    IF v_sent = 0 THEN
      INSERT INTO public.draw_notifications(draw_id, competition_title, is_demo, recipient, subject, body, status, detail)
      VALUES (NULL, r.title, r.is_demo, '(no admin recipients)', v_subject, v_body, 'alert', 'Missed draw alert — no admin email on file');
    END IF;

    v_alerts := v_alerts + 1;
  END LOOP;

  RETURN v_alerts;
END $$;

-- Keep only the 3 most recent daily example competitions; never touch real ones
CREATE OR REPLACE FUNCTION public.prune_daily_demos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ids uuid[]; v_count int;
BEGIN
  SELECT array_agg(id) INTO v_ids FROM (
    SELECT c.id FROM public.competitions c
     WHERE c.is_demo AND c.is_rolling_demo AND c.slug LIKE 'example-daily-tester-%'
     ORDER BY c.ends_at DESC
     OFFSET 3
  ) old;

  IF v_ids IS NULL THEN RETURN 0; END IF;
  v_count := array_length(v_ids, 1);

  DELETE FROM public.draw_notifications n
   USING public.draws d
   WHERE n.draw_id = d.id AND d.competition_id = ANY(v_ids) AND d.is_demo;
  DELETE FROM public.draws WHERE competition_id = ANY(v_ids) AND is_demo;
  DELETE FROM public.entry_answers WHERE competition_id = ANY(v_ids);
  DELETE FROM public.tickets WHERE competition_id = ANY(v_ids);
  DELETE FROM public.competition_secrets WHERE competition_id = ANY(v_ids);
  DELETE FROM public.competitions WHERE id = ANY(v_ids) AND is_demo;

  RETURN v_count;
END $$;

-- Single scheduler tick: spawn, draw, alert, prune. Safe to run every 5 minutes.
CREATE OR REPLACE FUNCTION public.demo_scheduler_tick()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean := COALESCE((SELECT (value->>'enabled')::boolean FROM public.site_settings WHERE key = 'daily_demo'), true);
  v_local timestamp := (now() AT TIME ZONE 'Europe/London');
  v_spawned uuid; v_drawn int := 0; v_alerts int; v_pruned int := 0; r record;
BEGIN
  IF v_enabled THEN
    v_spawned := public.spawn_daily_demo();
  END IF;

  -- Real draw pipeline for any closed example competition
  FOR r IN SELECT id FROM public.competitions
            WHERE is_rolling_demo AND status = 'live' AND ends_at <= now()
  LOOP
    BEGIN
      PERFORM public.draw_competition(r.id, 'daily example auto-draw');
      v_drawn := v_drawn + 1;
    EXCEPTION WHEN OTHERS THEN CONTINUE;
    END;
  END LOOP;

  v_alerts := public.check_missed_draws();

  IF extract(hour from v_local) = 3 THEN
    v_pruned := public.prune_daily_demos();
  END IF;

  RETURN jsonb_build_object(
    'enabled', v_enabled, 'spawned', v_spawned, 'drawn', v_drawn,
    'alerts', v_alerts, 'pruned', v_pruned
  );
END $$;

-- Admin: reset now (close current daily tester and run the tick)
CREATE OR REPLACE FUNCTION public.admin_reset_rolling_demo()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.competitions SET ends_at = now() - interval '1 second'
   WHERE is_rolling_demo AND status = 'live';
  RETURN public.demo_scheduler_tick();
END $$;

GRANT EXECUTE ON FUNCTION public.admin_set_daily_demo(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_rolling_demo() TO authenticated;
