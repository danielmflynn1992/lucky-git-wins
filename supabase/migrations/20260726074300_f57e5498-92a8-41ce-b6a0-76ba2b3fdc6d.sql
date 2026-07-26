
-- 1) Drop reservation RPCs that required a skill answer, recreate without.
DROP FUNCTION IF EXISTS public.reserve_lucky_dip(TEXT, INT, UUID, INT);
DROP FUNCTION IF EXISTS public.reserve_specific_numbers(TEXT, INT[], UUID, INT);

CREATE OR REPLACE FUNCTION public.reserve_lucky_dip(
  p_slug TEXT,
  p_qty INT,
  p_token UUID
) RETURNS INT[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_comp_id UUID;
  v_max INT;
  v_numbers INT[];
BEGIN
  IF p_qty < 1 OR p_qty > 1000 THEN RAISE EXCEPTION 'qty out of range'; END IF;

  SELECT id, max_per_person INTO v_comp_id, v_max
  FROM public.competitions
  WHERE slug = p_slug AND status = 'live' AND ends_at > now();
  IF v_comp_id IS NULL THEN RAISE EXCEPTION 'competition not open'; END IF;
  IF p_qty > v_max THEN RAISE EXCEPTION 'exceeds max per person'; END IF;

  PERFORM public.sweep_expired_reservations();

  WITH picked AS (
    SELECT id, number FROM public.tickets
     WHERE competition_id = v_comp_id AND status = 'available'
     ORDER BY random()
     LIMIT p_qty
     FOR UPDATE SKIP LOCKED
  ),
  upd AS (
    UPDATE public.tickets t
       SET status = 'reserved',
           reservation_token = p_token,
           reserved_until = now() + interval '15 minutes'
      FROM picked
     WHERE t.id = picked.id
    RETURNING t.number
  )
  SELECT array_agg(number ORDER BY number) INTO v_numbers FROM upd;

  IF v_numbers IS NULL OR array_length(v_numbers, 1) < p_qty THEN
    UPDATE public.tickets
       SET status = 'available', reservation_token = NULL, reserved_until = NULL
     WHERE reservation_token = p_token;
    RAISE EXCEPTION 'not enough tickets available';
  END IF;

  RETURN v_numbers;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_specific_numbers(
  p_slug TEXT,
  p_numbers INT[],
  p_token UUID
) RETURNS INT[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_comp_id UUID;
  v_max INT;
  v_qty INT := coalesce(array_length(p_numbers, 1), 0);
  v_numbers INT[];
BEGIN
  IF v_qty < 1 OR v_qty > 1000 THEN RAISE EXCEPTION 'qty out of range'; END IF;

  SELECT id, max_per_person INTO v_comp_id, v_max
  FROM public.competitions
  WHERE slug = p_slug AND status = 'live' AND ends_at > now();
  IF v_comp_id IS NULL THEN RAISE EXCEPTION 'competition not open'; END IF;
  IF v_qty > v_max THEN RAISE EXCEPTION 'exceeds max per person'; END IF;

  PERFORM public.sweep_expired_reservations();

  WITH picked AS (
    SELECT id, number FROM public.tickets
     WHERE competition_id = v_comp_id
       AND number = ANY(p_numbers)
       AND status = 'available'
     FOR UPDATE SKIP LOCKED
  ),
  upd AS (
    UPDATE public.tickets t
       SET status = 'reserved',
           reservation_token = p_token,
           reserved_until = now() + interval '15 minutes'
      FROM picked
     WHERE t.id = picked.id
    RETURNING t.number
  )
  SELECT array_agg(number ORDER BY number) INTO v_numbers FROM upd;

  IF v_numbers IS NULL OR array_length(v_numbers, 1) < v_qty THEN
    UPDATE public.tickets
       SET status = 'available', reservation_token = NULL, reserved_until = NULL
     WHERE reservation_token = p_token;
    RAISE EXCEPTION 'one or more numbers already taken';
  END IF;

  RETURN v_numbers;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_lucky_dip(TEXT, INT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_specific_numbers(TEXT, INT[], UUID) TO anon, authenticated;

-- 2) Drop competition-creator that required skill_question, recreate without.
DROP FUNCTION IF EXISTS public.create_competition_with_tickets(
  text, text, text, text, text, text, numeric, integer, integer, integer,
  timestamp with time zone, text, boolean, jsonb, boolean, integer, numeric
);

CREATE OR REPLACE FUNCTION public.create_competition_with_tickets(
  p_slug text, p_title text, p_subtitle text, p_category text, p_image text, p_description text,
  p_price_per_ticket numeric, p_total_tickets integer, p_cash_alternative integer, p_max_per_person integer,
  p_ends_at timestamp with time zone, p_status text, p_hot boolean,
  p_instant_win boolean, p_instant_win_count integer, p_instant_win_prize numeric
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_seed text;
  v_hash text;
BEGIN
  IF p_total_tickets < 1 OR p_total_tickets > 100000 THEN
    RAISE EXCEPTION 'total tickets out of range';
  END IF;

  v_seed := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_seed, 'sha256'), 'hex');

  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description,
    price_per_ticket, total_tickets, cash_alternative, max_per_person,
    ends_at, status, hot, skill_question, instant_win, seed_hash
  ) VALUES (
    p_slug, p_title, coalesce(p_subtitle, ''), p_category, coalesce(p_image, ''), coalesce(p_description, ''),
    p_price_per_ticket, p_total_tickets, p_cash_alternative, p_max_per_person,
    p_ends_at, coalesce(p_status, 'live'), coalesce(p_hot, false), '{}'::jsonb, coalesce(p_instant_win, false),
    v_hash
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
$$;

REVOKE ALL ON FUNCTION public.create_competition_with_tickets(
  text, text, text, text, text, text, numeric, integer, integer, integer,
  timestamp with time zone, text, boolean, boolean, integer, numeric
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_competition_with_tickets(
  text, text, text, text, text, text, numeric, integer, integer, integer,
  timestamp with time zone, text, boolean, boolean, integer, numeric
) TO authenticated, service_role;

-- 3) Storage RLS for competition-images bucket
DROP POLICY IF EXISTS "Public can read competition images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload competition images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update competition images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete competition images" ON storage.objects;

CREATE POLICY "Public can read competition images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'competition-images');

CREATE POLICY "Admins can upload competition images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'competition-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update competition images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'competition-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete competition images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'competition-images' AND public.has_role(auth.uid(), 'admin'));
