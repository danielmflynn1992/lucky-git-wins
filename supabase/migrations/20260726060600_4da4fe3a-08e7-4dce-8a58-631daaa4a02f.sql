
CREATE OR REPLACE FUNCTION public.draw_competition(p_comp_id uuid, p_notes text DEFAULT '')
RETURNS public.draws
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.competitions;
  v_winning_ticket public.tickets;
  v_total_sold int;
  v_pool text;
  v_display text;
  v_town text := '';
  v_hash text;
  v_row public.draws;
  v_owner_email text;
BEGIN
  SELECT * INTO v_comp FROM public.competitions WHERE id = p_comp_id FOR UPDATE;
  IF v_comp.id IS NULL THEN
    RAISE EXCEPTION 'competition not found';
  END IF;
  IF v_comp.status = 'drawn' THEN
    RAISE EXCEPTION 'competition already drawn';
  END IF;

  -- Release any stale reservations before drawing
  PERFORM public.sweep_expired_reservations();

  SELECT count(*) INTO v_total_sold FROM public.tickets
   WHERE competition_id = p_comp_id AND status = 'sold';

  IF v_total_sold > 0 THEN
    v_pool := 'sold';
    SELECT * INTO v_winning_ticket FROM public.tickets
     WHERE competition_id = p_comp_id AND status = 'sold'
     ORDER BY random() LIMIT 1;
  ELSE
    v_pool := 'all';
    SELECT * INTO v_winning_ticket FROM public.tickets
     WHERE competition_id = p_comp_id
     ORDER BY random() LIMIT 1;
  END IF;

  IF v_winning_ticket.id IS NULL THEN
    RAISE EXCEPTION 'no tickets to draw';
  END IF;

  IF v_winning_ticket.owner_id IS NOT NULL THEN
    SELECT email INTO v_owner_email FROM auth.users WHERE id = v_winning_ticket.owner_id;
    IF v_owner_email IS NOT NULL THEN
      v_display := split_part(v_owner_email, '@', 1);
    END IF;
  END IF;
  IF v_display IS NULL OR length(v_display) = 0 THEN
    v_display := 'Ticket #' || v_winning_ticket.number || ' holder';
  END IF;

  v_hash := encode(
    digest(
      p_comp_id::text || ':' || v_winning_ticket.number::text || ':' ||
      extract(epoch from now())::text || ':' || gen_random_uuid()::text,
      'sha256'
    ),
    'hex'
  );

  INSERT INTO public.draws (
    competition_id, competition_title, prize, winning_number,
    winner_display_name, winner_town, total_tickets, draw_method,
    verification_hash, notes, drawn_at
  ) VALUES (
    p_comp_id, v_comp.title, v_comp.title, v_winning_ticket.number,
    v_display, v_town, v_comp.total_tickets, 'automatic',
    v_hash, coalesce(p_notes, '') ||
      CASE WHEN v_pool = 'all' THEN ' (drew from all tickets: no sold tickets)' ELSE '' END,
    now()
  ) RETURNING * INTO v_row;

  UPDATE public.competitions SET status = 'drawn' WHERE id = p_comp_id;

  RETURN v_row;
END;
$$;

-- Auto-draws any live competition whose timer has expired. Safe to call from
-- a cron or a public endpoint that verifies its own secret.
CREATE OR REPLACE FUNCTION public.auto_draw_expired()
RETURNS SETOF public.draws
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.competitions;
  d public.draws;
BEGIN
  FOR r IN
    SELECT * FROM public.competitions
     WHERE status = 'live' AND ends_at <= now()
     ORDER BY ends_at ASC
     LIMIT 50
  LOOP
    BEGIN
      d := public.draw_competition(r.id, 'auto-draw on close');
      RETURN NEXT d;
    EXCEPTION WHEN OTHERS THEN
      -- Skip failures (e.g. no tickets) and continue
      CONTINUE;
    END;
  END LOOP;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.draw_competition(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.draw_competition(uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.auto_draw_expired() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_draw_expired() TO service_role;
