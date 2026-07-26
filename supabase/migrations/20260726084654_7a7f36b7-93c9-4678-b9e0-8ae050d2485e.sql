
-- Enum + column additions
DO $$ BEGIN
  CREATE TYPE public.entry_method AS ENUM ('paid','free');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS entry_method public.entry_method NOT NULL DEFAULT 'paid';

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS free_entry_enabled boolean NOT NULL DEFAULT true;

-- Free entries log
CREATE TABLE IF NOT EXISTS public.free_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  email text NOT NULL,
  ip_address text,
  user_agent text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS free_entries_comp_email_uniq
  ON public.free_entries (competition_id, lower(email));
CREATE INDEX IF NOT EXISTS free_entries_comp_ip_idx
  ON public.free_entries (competition_id, ip_address);

GRANT ALL ON public.free_entries TO service_role;
-- No anon/authenticated grants: writes go through SECURITY DEFINER function; reads are admin-only via server functions.

ALTER TABLE public.free_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read free entries"
  ON public.free_entries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Atomic free-entry submission
CREATE OR REPLACE FUNCTION public.submit_free_entry(
  p_slug text,
  p_email text,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.competitions;
  v_ticket public.tickets;
  v_email text := lower(trim(p_email));
  v_uid uuid := auth.uid();
BEGIN
  IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid email';
  END IF;

  SELECT * INTO v_comp FROM public.competitions
    WHERE slug = p_slug FOR UPDATE;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'competition not found'; END IF;
  IF v_comp.status <> 'live' OR v_comp.ends_at <= now() THEN
    RAISE EXCEPTION 'competition not open';
  END IF;
  IF NOT v_comp.free_entry_enabled THEN
    RAISE EXCEPTION 'free entry disabled';
  END IF;

  -- Dedupe by email
  IF EXISTS (SELECT 1 FROM public.free_entries
              WHERE competition_id = v_comp.id AND lower(email) = v_email) THEN
    RAISE EXCEPTION 'already entered free for this competition';
  END IF;

  -- Soft rate-limit by IP: max 3 free entries per IP per rolling 24h across all comps
  IF p_ip IS NOT NULL AND p_ip <> '' THEN
    IF (SELECT count(*) FROM public.free_entries
          WHERE ip_address = p_ip AND created_at > now() - interval '24 hours') >= 3 THEN
      RAISE EXCEPTION 'free entry rate limit reached, try again later';
    END IF;
  END IF;

  PERFORM public.sweep_expired_reservations();

  -- Pick a random available ticket in the same pool
  SELECT * INTO v_ticket FROM public.tickets
    WHERE competition_id = v_comp.id AND status = 'available'
    ORDER BY random() LIMIT 1
    FOR UPDATE SKIP LOCKED;
  IF v_ticket.id IS NULL THEN RAISE EXCEPTION 'no tickets available'; END IF;

  UPDATE public.tickets
     SET status = 'sold',
         entry_method = 'free',
         owner_id = v_uid,
         reservation_token = NULL,
         reserved_until = NULL
   WHERE id = v_ticket.id;

  INSERT INTO public.free_entries (competition_id, ticket_id, email, ip_address, user_agent, user_id)
    VALUES (v_comp.id, v_ticket.id, v_email, p_ip, p_user_agent, v_uid);

  RETURN v_ticket.number;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_free_entry(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_free_entry(text, text, text, text) TO anon, authenticated;
