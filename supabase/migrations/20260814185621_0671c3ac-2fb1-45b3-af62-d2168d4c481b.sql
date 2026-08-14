-- 1. Winner naming: "First N." from the account profile, else ticket holder.
CREATE OR REPLACE FUNCTION public.draw_competition(p_comp_id uuid, p_notes text DEFAULT ''::text)
 RETURNS draws
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_comp public.competitions;
  v_seed text; v_hash text;
  v_pool text; v_pool_size int; v_pick_index int;
  v_total_sold int;
  v_win public.tickets;
  v_display text := ''; v_owner_email text; v_name text;
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
    SELECT nullif(btrim(p.display_name), '') INTO v_name
      FROM public.profiles p WHERE p.user_id = v_win.owner_id;
    IF v_name IS NOT NULL THEN
      -- "Daniel Flynn" -> "Daniel F."; single word stays as-is.
      IF position(' ' in v_name) > 0 THEN
        v_display := split_part(v_name, ' ', 1) || ' ' ||
                     upper(left(split_part(v_name, ' ', array_length(string_to_array(v_name, ' '), 1)), 1)) || '.';
      ELSE
        v_display := v_name;
      END IF;
    ELSE
      SELECT email INTO v_owner_email FROM auth.users WHERE id = v_win.owner_id;
      IF v_owner_email IS NOT NULL THEN
        v_display := initcap(split_part(v_owner_email, '@', 1));
      END IF;
    END IF;
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
END $function$;

-- 2. Watchdog fires 10 minutes after close.
CREATE OR REPLACE FUNCTION public.check_missed_draws()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r record; a record; v_subject text; v_body text; v_alerts int := 0; v_sent int := 0;
BEGIN
  FOR r IN
    SELECT c.id, c.title, c.ends_at, c.is_demo, c.is_rolling_demo
      FROM public.competitions c
     WHERE c.status = 'live'
       AND c.ends_at <= now() - interval '10 minutes'
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
              'No draw record exists more than 10 minutes after close.' || E'\n' ||
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
$function$;

-- 3. A draw can never predate its competition's close time.
CREATE OR REPLACE FUNCTION public.enforce_draw_after_close()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_ends timestamptz;
BEGIN
  IF NEW.competition_id IS NOT NULL THEN
    SELECT ends_at INTO v_ends FROM public.competitions WHERE id = NEW.competition_id;
    IF v_ends IS NOT NULL AND NEW.drawn_at < v_ends THEN
      RAISE EXCEPTION 'draw cannot predate the competition close time';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_draw_after_close ON public.draws;
CREATE TRIGGER trg_draw_after_close
BEFORE INSERT OR UPDATE ON public.draws
FOR EACH ROW EXECUTE FUNCTION public.enforce_draw_after_close();

-- 4. Server-side, every minute, regardless of site traffic.
DO $$
BEGIN
  PERFORM cron.unschedule('auto-draw-expired');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule('auto-draw-expired', '* * * * *', $$
  SELECT public.auto_draw_expired();
  SELECT public.check_missed_draws();
$$);
