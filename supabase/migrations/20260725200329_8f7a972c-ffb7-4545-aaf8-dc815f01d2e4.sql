
ALTER TABLE public.tickets ADD COLUMN skill_answer INT;

-- Recreate reservation RPCs with skill answer enforcement.
CREATE OR REPLACE FUNCTION public.reserve_lucky_dip(
  p_slug TEXT,
  p_qty INT,
  p_token UUID,
  p_skill_answer INT
) RETURNS INT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp_id UUID;
  v_max INT;
  v_correct INT;
  v_numbers INT[];
BEGIN
  IF p_qty < 1 OR p_qty > 500 THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;
  IF p_skill_answer IS NULL THEN
    RAISE EXCEPTION 'skill question required';
  END IF;

  SELECT id, max_per_person, (skill_question->>'correct')::int
    INTO v_comp_id, v_max, v_correct
  FROM public.competitions
  WHERE slug = p_slug AND status = 'live' AND ends_at > now();
  IF v_comp_id IS NULL THEN
    RAISE EXCEPTION 'competition not open';
  END IF;
  IF p_qty > v_max THEN
    RAISE EXCEPTION 'exceeds max per person';
  END IF;
  IF p_skill_answer IS DISTINCT FROM v_correct THEN
    RAISE EXCEPTION 'skill question answered incorrectly';
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
           reserved_until = now() + interval '15 minutes',
           skill_answer = p_skill_answer
      FROM picked
     WHERE t.id = picked.id
    RETURNING t.number
  )
  SELECT array_agg(number ORDER BY number) INTO v_numbers FROM upd;

  IF v_numbers IS NULL OR array_length(v_numbers, 1) < p_qty THEN
    UPDATE public.tickets
       SET status = 'available', reservation_token = NULL, reserved_until = NULL, skill_answer = NULL
     WHERE reservation_token = p_token AND status = 'reserved';
    RAISE EXCEPTION 'not enough tickets available';
  END IF;

  RETURN v_numbers;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_specific_numbers(
  p_slug TEXT,
  p_numbers INT[],
  p_token UUID,
  p_skill_answer INT
) RETURNS INT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp_id UUID;
  v_max INT;
  v_correct INT;
  v_qty INT := coalesce(array_length(p_numbers, 1), 0);
  v_numbers INT[];
BEGIN
  IF v_qty < 1 OR v_qty > 500 THEN
    RAISE EXCEPTION 'invalid selection';
  END IF;
  IF p_skill_answer IS NULL THEN
    RAISE EXCEPTION 'skill question required';
  END IF;

  SELECT id, max_per_person, (skill_question->>'correct')::int
    INTO v_comp_id, v_max, v_correct
  FROM public.competitions
  WHERE slug = p_slug AND status = 'live' AND ends_at > now();
  IF v_comp_id IS NULL THEN
    RAISE EXCEPTION 'competition not open';
  END IF;
  IF v_qty > v_max THEN
    RAISE EXCEPTION 'exceeds max per person';
  END IF;
  IF p_skill_answer IS DISTINCT FROM v_correct THEN
    RAISE EXCEPTION 'skill question answered incorrectly';
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
           reserved_until = now() + interval '15 minutes',
           skill_answer = p_skill_answer
      FROM candidates
     WHERE t.id = candidates.id
    RETURNING t.number
  )
  SELECT array_agg(number ORDER BY number) INTO v_numbers FROM upd;

  IF v_numbers IS NULL OR array_length(v_numbers, 1) < v_qty THEN
    UPDATE public.tickets
       SET status = 'available', reservation_token = NULL, reserved_until = NULL, skill_answer = NULL
     WHERE reservation_token = p_token AND status = 'reserved';
    RAISE EXCEPTION 'one or more numbers just got taken';
  END IF;

  RETURN v_numbers;
END;
$$;

-- Drop the old 3-arg versions so clients can't skip the answer.
DROP FUNCTION IF EXISTS public.reserve_lucky_dip(TEXT, INT, UUID);
DROP FUNCTION IF EXISTS public.reserve_specific_numbers(TEXT, INT[], UUID);

GRANT EXECUTE ON FUNCTION public.reserve_lucky_dip(TEXT, INT, UUID, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_specific_numbers(TEXT, INT[], UUID, INT) TO anon, authenticated;
