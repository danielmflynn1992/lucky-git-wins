-- 1. Run the real draw pipeline every tick, not just for example comps.
CREATE OR REPLACE FUNCTION public.demo_scheduler_tick()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_enabled boolean := COALESCE((SELECT (value->>'enabled')::boolean FROM public.site_settings WHERE key = 'daily_demo'), true);
  v_local timestamp := (now() AT TIME ZONE 'Europe/London');
  v_spawned uuid; v_drawn int := 0; v_alerts int; v_pruned int := 0; r record;
BEGIN
  IF v_enabled THEN
    v_spawned := public.spawn_daily_demo();
  END IF;

  -- Same pipeline for every closed competition, example or real.
  FOR r IN SELECT id FROM public.competitions
            WHERE status = 'live' AND ends_at <= now()
            ORDER BY ends_at ASC LIMIT 100
  LOOP
    BEGIN
      PERFORM public.draw_competition(r.id, 'auto-draw on close');
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
END
$fn$;

-- 2. Alert threshold: 15 minutes past close with no draw record.
CREATE OR REPLACE FUNCTION public.check_missed_draws()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r record; a record; v_subject text; v_body text; v_alerts int := 0; v_sent int := 0;
BEGIN
  FOR r IN
    SELECT c.id, c.title, c.ends_at, c.is_demo, c.is_rolling_demo
      FROM public.competitions c
     WHERE c.status = 'live'
       AND c.ends_at <= now() - interval '15 minutes'
       AND NOT EXISTS (SELECT 1 FROM public.draws d WHERE d.competition_id = c.id)
  LOOP
    v_subject := CASE WHEN r.is_rolling_demo
      THEN '[DEMO] DAILY DRAW DID NOT FIRE — ' || to_char(r.ends_at AT TIME ZONE 'Europe/London', 'YYYY-MM-DD')
      ELSE 'DRAW DID NOT FIRE — ' || r.title || ' — ' || to_char(r.ends_at AT TIME ZONE 'Europe/London', 'YYYY-MM-DD HH24:MI') END;

    IF EXISTS (SELECT 1 FROM public.draw_notifications n WHERE n.subject = v_subject) THEN
      CONTINUE;
    END IF;

    v_body := 'Competition: ' || r.title || E'\n' ||
              'Closed at: ' || to_char(r.ends_at AT TIME ZONE 'Europe/London', 'YYYY-MM-DD HH24:MI') || ' (UK)' || E'\n' ||
              'No draw record exists more than 15 minutes after close.' || E'\n' ||
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
END
$fn$;

-- 3. Dedicated minute-by-minute real draw job (independent of the demo tick).
SELECT cron.schedule('auto-draw-on-close', '* * * * *', $$select public.auto_draw_expired();$$)
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-draw-on-close');

-- 4. Clear the backlog now.
SELECT public.auto_draw_expired();

-- 5. Single source of truth for site statistics (real data only).
CREATE OR REPLACE FUNCTION public.site_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT jsonb_build_object(
    'comps_live', (SELECT count(*) FROM public.competitions
                    WHERE is_demo = false AND status = 'live' AND ends_at > now()),
    'prize_value_live', (SELECT COALESCE(sum(cash_alternative),0) FROM public.competitions
                    WHERE is_demo = false AND status = 'live' AND ends_at > now()),
    'tickets_sold', (SELECT count(*) FROM public.tickets t
                      JOIN public.competitions c ON c.id = t.competition_id
                     WHERE c.is_demo = false AND t.status = 'sold'),
    'draws_completed', (SELECT count(*) FROM public.draws WHERE is_demo = false),
    'winners_paid', (SELECT count(*) FROM public.draws WHERE is_demo = false)
  );
$fn$;

GRANT EXECUTE ON FUNCTION public.site_stats() TO anon, authenticated;