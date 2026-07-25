
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS is_instant_win boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instant_win_prize numeric;

CREATE OR REPLACE FUNCTION public.create_competition_with_tickets(
  p_slug text,
  p_title text,
  p_subtitle text,
  p_category text,
  p_image text,
  p_description text,
  p_price_per_ticket numeric,
  p_total_tickets integer,
  p_cash_alternative integer,
  p_max_per_person integer,
  p_ends_at timestamptz,
  p_status text,
  p_hot boolean,
  p_skill_question jsonb,
  p_instant_win boolean,
  p_instant_win_count integer,
  p_instant_win_prize numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_total_tickets < 1 OR p_total_tickets > 100000 THEN
    RAISE EXCEPTION 'total tickets out of range';
  END IF;

  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description,
    price_per_ticket, total_tickets, cash_alternative, max_per_person,
    ends_at, status, hot, skill_question, instant_win
  ) VALUES (
    p_slug, p_title, coalesce(p_subtitle, ''), p_category, coalesce(p_image, ''), coalesce(p_description, ''),
    p_price_per_ticket, p_total_tickets, p_cash_alternative, p_max_per_person,
    p_ends_at, coalesce(p_status, 'live'), coalesce(p_hot, false), p_skill_question, coalesce(p_instant_win, false)
  ) RETURNING id INTO v_id;

  INSERT INTO public.tickets (competition_id, number, status)
  SELECT v_id, g, 'available'
  FROM generate_series(1, p_total_tickets) AS g;

  IF coalesce(p_instant_win, false) AND coalesce(p_instant_win_count, 0) > 0 THEN
    UPDATE public.tickets
       SET is_instant_win = true,
           instant_win_prize = p_instant_win_prize
     WHERE id IN (
       SELECT id FROM public.tickets
        WHERE competition_id = v_id
        ORDER BY random()
        LIMIT LEAST(p_instant_win_count, p_total_tickets)
     );
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_competition_with_tickets(
  text, text, text, text, text, text, numeric, integer, integer, integer,
  timestamptz, text, boolean, jsonb, boolean, integer, numeric
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_competition_with_tickets(
  text, text, text, text, text, text, numeric, integer, integer, integer,
  timestamptz, text, boolean, jsonb, boolean, integer, numeric
) TO service_role;
