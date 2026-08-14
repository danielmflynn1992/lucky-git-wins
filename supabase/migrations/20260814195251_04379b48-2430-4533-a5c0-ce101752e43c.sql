ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS free_entry_slots integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_slots_claimed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS postal_cutoff_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_cutoff_at timestamptz;

UPDATE public.competitions
   SET free_entry_slots = GREATEST(3, ceil(total_tickets * 0.05)::int)
 WHERE free_entry_slots = 0;

UPDATE public.competitions
   SET postal_cutoff_at = COALESCE(postal_cutoff_at, ends_at - interval '3 days'),
       email_cutoff_at  = COALESCE(email_cutoff_at,  ends_at - interval '3 hours');

CREATE OR REPLACE FUNCTION public.competitions_free_entry_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.free_entry_slots, 0) = 0 THEN
    NEW.free_entry_slots := GREATEST(3, ceil(NEW.total_tickets * 0.05)::int);
  END IF;
  IF NEW.postal_cutoff_at IS NULL THEN
    NEW.postal_cutoff_at := NEW.ends_at - interval '3 days';
  END IF;
  IF NEW.email_cutoff_at IS NULL THEN
    NEW.email_cutoff_at := NEW.ends_at - interval '3 hours';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS competitions_free_entry_defaults ON public.competitions;
CREATE TRIGGER competitions_free_entry_defaults
BEFORE INSERT ON public.competitions
FOR EACH ROW EXECUTE FUNCTION public.competitions_free_entry_defaults();

CREATE TABLE IF NOT EXISTS public.free_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  entrant_name text NOT NULL,
  entrant_address text NOT NULL DEFAULT '',
  entrant_dob date,
  entrant_email text NOT NULL,
  entrant_phone text NOT NULL DEFAULT '',
  submitted_answer text NOT NULL DEFAULT '',
  route text NOT NULL CHECK (route IN ('post','email')),
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('logged','declined_full','declined_late','declined_wrong_answer','declined_duplicate','declined_frequency_cap')),
  assigned_ticket_number integer,
  logged_by uuid REFERENCES auth.users(id),
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.free_entries TO authenticated;
GRANT ALL ON public.free_entries TO service_role;

ALTER TABLE public.free_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read free entries" ON public.free_entries;
CREATE POLICY "admins read free entries" ON public.free_entries
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_free_entries_updated_at ON public.free_entries;
CREATE TRIGGER update_free_entries_updated_at
BEFORE UPDATE ON public.free_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS free_entries_comp_idx ON public.free_entries(competition_id);
CREATE INDEX IF NOT EXISTS free_entries_email_idx ON public.free_entries(lower(entrant_email), received_at DESC);

-- Paid reservation must never touch the reserved free block before the email cut-off.
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
  v_floor INT;
  v_numbers INT[];
BEGIN
  IF p_qty < 1 OR p_qty > 1000 THEN RAISE EXCEPTION 'qty out of range'; END IF;

  SELECT id, max_per_person,
         CASE WHEN now() < COALESCE(email_cutoff_at, ends_at)
              THEN total_tickets - free_entry_slots
              ELSE total_tickets END
    INTO v_comp_id, v_max, v_floor
  FROM public.competitions
  WHERE slug = p_slug AND status = 'live' AND ends_at > now();
  IF v_comp_id IS NULL THEN RAISE EXCEPTION 'competition not open'; END IF;
  IF p_qty > v_max THEN RAISE EXCEPTION 'exceeds max per person'; END IF;

  PERFORM public.sweep_expired_reservations();

  WITH picked AS (
    SELECT id, number FROM public.tickets
     WHERE competition_id = v_comp_id AND status = 'available' AND number <= v_floor
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
  v_floor INT;
  v_qty INT := coalesce(array_length(p_numbers, 1), 0);
  v_numbers INT[];
BEGIN
  IF v_qty < 1 OR v_qty > 1000 THEN RAISE EXCEPTION 'qty out of range'; END IF;

  SELECT id, max_per_person,
         CASE WHEN now() < COALESCE(email_cutoff_at, ends_at)
              THEN total_tickets - free_entry_slots
              ELSE total_tickets END
    INTO v_comp_id, v_max, v_floor
  FROM public.competitions
  WHERE slug = p_slug AND status = 'live' AND ends_at > now();
  IF v_comp_id IS NULL THEN RAISE EXCEPTION 'competition not open'; END IF;
  IF v_qty > v_max THEN RAISE EXCEPTION 'exceeds max per person'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_numbers) n WHERE n > v_floor) THEN
    RAISE EXCEPTION 'one or more numbers already taken';
  END IF;

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

-- Staff logging of a postal or email free entry.
CREATE OR REPLACE FUNCTION public.admin_log_free_entry(
  p_competition_id uuid,
  p_name text,
  p_address text,
  p_dob date,
  p_email text,
  p_phone text,
  p_answer text,
  p_route text,
  p_received_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_comp public.competitions%ROWTYPE;
  v_status text;
  v_number int;
  v_correct bigint;
  v_cutoff timestamptz;
  v_subject text;
  v_body text;
  v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  IF p_route NOT IN ('post','email') THEN RAISE EXCEPTION 'invalid route'; END IF;

  SELECT * INTO v_comp FROM public.competitions WHERE id = p_competition_id;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'competition not found'; END IF;

  v_cutoff := CASE WHEN p_route = 'post' THEN v_comp.postal_cutoff_at ELSE v_comp.email_cutoff_at END;

  IF v_cutoff IS NOT NULL AND COALESCE(p_received_at, now()) > v_cutoff THEN
    v_status := 'declined_late';
  ELSIF EXISTS (
    SELECT 1 FROM public.free_entries
     WHERE competition_id = p_competition_id
       AND lower(entrant_email) = lower(p_email)
       AND status = 'logged'
  ) THEN
    v_status := 'declined_duplicate';
  ELSIF EXISTS (
    SELECT 1 FROM public.free_entries
     WHERE lower(entrant_email) = lower(p_email)
       AND status = 'logged'
       AND received_at > now() - interval '30 days'
  ) THEN
    v_status := 'declined_frequency_cap';
  ELSIF v_comp.free_slots_claimed >= v_comp.free_entry_slots THEN
    v_status := 'declined_full';
  ELSE
    SELECT correct_answer INTO v_correct FROM public.question_bank WHERE id = v_comp.question_id;
    IF v_correct IS NULL OR public.normalise_numeric_answer(p_answer) IS DISTINCT FROM v_correct THEN
      v_status := 'declined_wrong_answer';
    ELSE
      SELECT number INTO v_number
        FROM public.tickets
       WHERE competition_id = v_comp.id
         AND status = 'available'
         AND number > v_comp.total_tickets - v_comp.free_entry_slots
       ORDER BY number
       LIMIT 1
       FOR UPDATE SKIP LOCKED;

      IF v_number IS NULL THEN
        v_status := 'declined_full';
      ELSE
        UPDATE public.tickets
           SET status = 'sold', is_qualifying = true, order_ref = gen_random_uuid()
         WHERE competition_id = v_comp.id AND number = v_number;
        UPDATE public.competitions
           SET free_slots_claimed = free_slots_claimed + 1
         WHERE id = v_comp.id;
        v_status := 'logged';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.free_entries (
    competition_id, entrant_name, entrant_address, entrant_dob, entrant_email,
    entrant_phone, submitted_answer, route, received_at, status,
    assigned_ticket_number, logged_by
  ) VALUES (
    p_competition_id, p_name, COALESCE(p_address,''), p_dob, p_email,
    COALESCE(p_phone,''), COALESCE(p_answer,''), p_route, COALESCE(p_received_at, now()), v_status,
    v_number, auth.uid()
  ) RETURNING id INTO v_id;

  IF v_status = 'logged' THEN
    v_subject := 'Free entry confirmation — ' || v_comp.title;
    v_body := 'Hello ' || p_name || E',\n\nYou are in. Your free entry for "' || v_comp.title ||
      '" has been logged and given ticket number ' || v_number ||
      E'.\n\nIt sits in exactly the same numbered pool as every paid ticket, with the same odds, and the draw runs automatically when the timer hits zero. We will email you either way.\n\nLucky Git Comps';
  ELSE
    v_subject := 'Free entry not entered — ' || v_comp.title;
    v_body := 'Hello ' || p_name || E',\n\nWe received your free entry for "' || v_comp.title ||
      '", but we could not enter it. ' ||
      CASE v_status
        WHEN 'declined_full' THEN 'The free entry spots for this competition were already fully claimed by the time yours arrived — the same as tickets selling out. We have not moved you into a different competition, because that would enter you for a prize you did not choose.'
        WHEN 'declined_late' THEN 'It arrived after the stated cut-off for this competition, so there was not time to log it before the draw.'
        WHEN 'declined_wrong_answer' THEN 'The answer to the skill question was not correct, and only correct answers go into the draw — exactly the same rule as for paid tickets.'
        WHEN 'declined_duplicate' THEN 'You already have a free entry logged for this competition, and it is one per person per competition.'
        ELSE 'You have already had a free entry logged in the last 30 days, and it is one free entry per person across the whole site in any 30-day period. You are very welcome to enter again after that.'
      END ||
      E'\n\nNo hard feelings — there will be another one along shortly.\n\nLucky Git Comps';
  END IF;

  INSERT INTO public.draw_notifications (competition_title, is_demo, recipient, subject, body, status)
  VALUES (v_comp.title, v_comp.is_demo, p_email, v_subject, v_body, 'queued');

  RETURN jsonb_build_object('id', v_id, 'status', v_status, 'ticket_number', v_number);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_log_free_entry(uuid, text, text, date, text, text, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_log_free_entry(uuid, text, text, date, text, text, text, text, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_free_entries()
RETURNS TABLE(
  id uuid, competition_id uuid, competition_title text, entrant_name text,
  entrant_email text, route text, status text, assigned_ticket_number integer,
  received_at timestamptz, logged_at timestamptz, submitted_answer text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT f.id, f.competition_id, c.title, f.entrant_name, f.entrant_email, f.route,
         f.status, f.assigned_ticket_number, f.received_at, f.logged_at, f.submitted_answer
    FROM public.free_entries f
    JOIN public.competitions c ON c.id = f.competition_id
   WHERE public.has_role(auth.uid(), 'admin')
   ORDER BY f.logged_at DESC
   LIMIT 500;
$$;

REVOKE ALL ON FUNCTION public.admin_list_free_entries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_free_entries() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_free_entry_stats()
RETURNS TABLE(
  competition_id uuid, competition_title text, status text, is_demo boolean,
  free_entry_slots integer, free_slots_claimed integer,
  declined_full integer, declined_late integer, declined_wrong_answer integer,
  declined_duplicate integer, declined_frequency_cap integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id, c.title, c.status, c.is_demo, c.free_entry_slots, c.free_slots_claimed,
         count(*) FILTER (WHERE f.status = 'declined_full')::int,
         count(*) FILTER (WHERE f.status = 'declined_late')::int,
         count(*) FILTER (WHERE f.status = 'declined_wrong_answer')::int,
         count(*) FILTER (WHERE f.status = 'declined_duplicate')::int,
         count(*) FILTER (WHERE f.status = 'declined_frequency_cap')::int
    FROM public.competitions c
    LEFT JOIN public.free_entries f ON f.competition_id = c.id
   WHERE public.has_role(auth.uid(), 'admin')
   GROUP BY c.id, c.title, c.status, c.is_demo, c.free_entry_slots, c.free_slots_claimed
   ORDER BY c.ends_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_free_entry_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_free_entry_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_free_entry_config(
  p_competition_id uuid,
  p_slots integer,
  p_postal_cutoff timestamptz,
  p_email_cutoff timestamptz
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  IF p_slots < 0 OR p_slots > 100 THEN RAISE EXCEPTION 'slots out of range'; END IF;
  UPDATE public.competitions
     SET free_entry_slots = GREATEST(p_slots, free_slots_claimed),
         postal_cutoff_at = COALESCE(p_postal_cutoff, postal_cutoff_at),
         email_cutoff_at = COALESCE(p_email_cutoff, email_cutoff_at)
   WHERE id = p_competition_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_free_entry_config(uuid, integer, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_free_entry_config(uuid, integer, timestamptz, timestamptz) TO authenticated;