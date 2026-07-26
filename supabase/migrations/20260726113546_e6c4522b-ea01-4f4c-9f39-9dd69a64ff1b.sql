-- 1) Drop dependent free_entries that reference tickets we're about to delete
DELETE FROM public.free_entries
 WHERE ticket_id IN (SELECT id FROM public.tickets WHERE number > 499);

-- 2) Delete every ticket with number > 499 (dev seed data only).
DELETE FROM public.tickets WHERE number > 499;

-- 3) Clamp all competitions to 499.
UPDATE public.competitions SET total_tickets = 499 WHERE total_tickets > 499;

-- 4) Hard cap in the schema.
ALTER TABLE public.competitions
  DROP CONSTRAINT IF EXISTS competitions_total_tickets_499_cap;
ALTER TABLE public.competitions
  ADD CONSTRAINT competitions_total_tickets_499_cap
  CHECK (total_tickets > 0 AND total_tickets <= 499);

-- 5) Reject oversized pools inside the creation RPC too.
CREATE OR REPLACE FUNCTION public.create_competition_with_tickets(
  p_slug text, p_title text, p_subtitle text, p_category text, p_image text, p_description text,
  p_price_per_ticket numeric, p_total_tickets integer, p_cash_alternative integer, p_max_per_person integer,
  p_ends_at timestamp with time zone, p_status text, p_hot boolean, p_instant_win boolean,
  p_instant_win_count integer, p_instant_win_prize numeric, p_letterbox_style text DEFAULT 'blur'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_id uuid;
  v_seed text;
  v_hash text;
  v_style public.letterbox_style;
BEGIN
  IF p_total_tickets < 1 OR p_total_tickets > 499 THEN
    RAISE EXCEPTION 'total tickets must be between 1 and 499 (the 499 promise)';
  END IF;

  BEGIN
    v_style := coalesce(p_letterbox_style, 'blur')::public.letterbox_style;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid letterbox_style: %', p_letterbox_style;
  END;

  v_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_seed, 'sha256'), 'hex');

  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description,
    price_per_ticket, total_tickets, cash_alternative, max_per_person,
    ends_at, status, hot, skill_question, instant_win, seed_hash, letterbox_style
  ) VALUES (
    p_slug, p_title, coalesce(p_subtitle, ''), p_category, coalesce(p_image, ''), coalesce(p_description, ''),
    p_price_per_ticket, p_total_tickets, p_cash_alternative, p_max_per_person,
    p_ends_at, coalesce(p_status, 'live'), coalesce(p_hot, false), '{}'::jsonb, coalesce(p_instant_win, false),
    v_hash, v_style
  ) RETURNING id INTO v_id;

  INSERT INTO public.competition_secrets(competition_id, seed) VALUES (v_id, v_seed);

  INSERT INTO public.tickets (competition_id, number, status)
  SELECT v_id, g, 'available' FROM generate_series(1, p_total_tickets) AS g;

  IF coalesce(p_instant_win, false) AND coalesce(p_instant_win_count, 0) > 0 THEN
    UPDATE public.tickets
       SET is_instant_win = true, instant_win_prize = p_instant_win_prize
     WHERE id IN (
       SELECT id FROM public.tickets
        WHERE competition_id = v_id ORDER BY random()
        LIMIT LEAST(p_instant_win_count, p_total_tickets)
     );
  END IF;

  RETURN v_id;
END;
$function$;