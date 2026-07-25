
-- Competitions
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  price_per_ticket NUMERIC(10,2) NOT NULL,
  total_tickets INT NOT NULL,
  cash_alternative INT NOT NULL DEFAULT 0,
  max_per_person INT NOT NULL DEFAULT 100,
  ends_at TIMESTAMPTZ NOT NULL,
  instant_win BOOLEAN NOT NULL DEFAULT false,
  hot BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL DEFAULT '',
  skill_question JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'live', -- 'live' | 'closed' | 'drawn'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.competitions TO anon, authenticated;
GRANT ALL ON public.competitions TO service_role;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read competitions" ON public.competitions FOR SELECT TO anon, authenticated USING (true);

-- Tickets: one row per numbered ticket per competition
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- 'available' | 'reserved' | 'sold'
  reservation_token UUID,
  reserved_until TIMESTAMPTZ,
  order_id UUID,
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, number)
);
CREATE INDEX tickets_comp_status_idx ON public.tickets(competition_id, status);
CREATE INDEX tickets_reservation_idx ON public.tickets(reservation_token) WHERE reservation_token IS NOT NULL;
GRANT SELECT ON public.tickets TO anon, authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
-- Anon may read number/status to render the picker. We rely on GRANT column subset elsewhere; here we allow full row read (no sensitive data yet — owner_id/order_id will be linked via server fn only after auth).
CREATE POLICY "public read tickets" ON public.tickets FOR SELECT TO anon, authenticated USING (true);

-- Sweep expired reservations back to available.
CREATE OR REPLACE FUNCTION public.sweep_expired_reservations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tickets
     SET status = 'available',
         reservation_token = NULL,
         reserved_until = NULL
   WHERE status = 'reserved'
     AND reserved_until < now();
$$;

-- Atomic Lucky Dip: pick N available (or expired-reserved) tickets, lock and mark reserved.
CREATE OR REPLACE FUNCTION public.reserve_lucky_dip(
  p_slug TEXT,
  p_qty INT,
  p_token UUID
) RETURNS INT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp_id UUID;
  v_max INT;
  v_numbers INT[];
BEGIN
  IF p_qty < 1 OR p_qty > 500 THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;

  SELECT id, max_per_person INTO v_comp_id, v_max FROM public.competitions
    WHERE slug = p_slug AND status = 'live' AND ends_at > now();
  IF v_comp_id IS NULL THEN
    RAISE EXCEPTION 'competition not open';
  END IF;
  IF p_qty > v_max THEN
    RAISE EXCEPTION 'exceeds max per person';
  END IF;

  PERFORM public.sweep_expired_reservations();

  WITH picked AS (
    SELECT id FROM public.tickets
     WHERE competition_id = v_comp_id
       AND status = 'available'
     ORDER BY random()
     LIMIT p_qty
     FOR UPDATE SKIP LOCKED
  ), upd AS (
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
    -- Roll back partial reservation and error
    UPDATE public.tickets
       SET status = 'available', reservation_token = NULL, reserved_until = NULL
     WHERE reservation_token = p_token AND status = 'reserved';
    RAISE EXCEPTION 'not enough tickets available';
  END IF;

  RETURN v_numbers;
END;
$$;

-- Atomic reserve of specific numbers.
CREATE OR REPLACE FUNCTION public.reserve_specific_numbers(
  p_slug TEXT,
  p_numbers INT[],
  p_token UUID
) RETURNS INT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp_id UUID;
  v_max INT;
  v_qty INT := coalesce(array_length(p_numbers, 1), 0);
  v_numbers INT[];
BEGIN
  IF v_qty < 1 OR v_qty > 500 THEN
    RAISE EXCEPTION 'invalid selection';
  END IF;

  SELECT id, max_per_person INTO v_comp_id, v_max FROM public.competitions
    WHERE slug = p_slug AND status = 'live' AND ends_at > now();
  IF v_comp_id IS NULL THEN
    RAISE EXCEPTION 'competition not open';
  END IF;
  IF v_qty > v_max THEN
    RAISE EXCEPTION 'exceeds max per person';
  END IF;

  PERFORM public.sweep_expired_reservations();

  WITH candidates AS (
    SELECT id, number FROM public.tickets
     WHERE competition_id = v_comp_id
       AND number = ANY(p_numbers)
       AND status = 'available'
     FOR UPDATE SKIP LOCKED
  ), upd AS (
    UPDATE public.tickets t
       SET status = 'reserved',
           reservation_token = p_token,
           reserved_until = now() + interval '15 minutes'
      FROM candidates
     WHERE t.id = candidates.id
    RETURNING t.number
  )
  SELECT array_agg(number ORDER BY number) INTO v_numbers FROM upd;

  IF v_numbers IS NULL OR array_length(v_numbers, 1) < v_qty THEN
    -- Some numbers were taken between page load and click — roll back and tell the client.
    UPDATE public.tickets
       SET status = 'available', reservation_token = NULL, reserved_until = NULL
     WHERE reservation_token = p_token AND status = 'reserved';
    RAISE EXCEPTION 'one or more numbers just got taken';
  END IF;

  RETURN v_numbers;
END;
$$;

-- Release a reservation (used when user cancels or navigates away).
CREATE OR REPLACE FUNCTION public.release_reservation(p_token UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tickets
     SET status = 'available', reservation_token = NULL, reserved_until = NULL
   WHERE reservation_token = p_token AND status = 'reserved';
$$;

GRANT EXECUTE ON FUNCTION public.reserve_lucky_dip(TEXT, INT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_specific_numbers(TEXT, INT[], UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_reservation(UUID) TO anon, authenticated;
