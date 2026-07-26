
-- 1) Public seed_hash on competitions (published pre-close, provably-fair commit)
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS seed_hash text NOT NULL DEFAULT '';

-- 2) Private seed store (never exposed to anon/authenticated except via draw reveal)
CREATE TABLE IF NOT EXISTS public.competition_secrets (
  competition_id uuid PRIMARY KEY REFERENCES public.competitions(id) ON DELETE CASCADE,
  seed text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.competition_secrets TO service_role;
ALTER TABLE public.competition_secrets ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: locked down. Only SECURITY DEFINER funcs read it.

-- 3) Reveal fields on draws
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS seed_revealed text NOT NULL DEFAULT '';
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS seed_hash text NOT NULL DEFAULT '';

-- 4) Site settings (weekly drop schedule config)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- Seed default drop schedule: Mon/Wed/Fri 20:00 Europe/London
INSERT INTO public.site_settings(key, value) VALUES
  ('drop_schedule', '{"days":[1,3,5],"hour":20,"minute":0,"tz":"Europe/London"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5) Drop notification opt-in (email pings before scheduled drops)
CREATE TABLE IF NOT EXISTS public.drop_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drop_subscribers TO authenticated;
GRANT INSERT ON public.drop_subscribers TO anon;
GRANT ALL ON public.drop_subscribers TO service_role;
ALTER TABLE public.drop_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self can read own subscription" ON public.drop_subscribers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "anyone can subscribe" ON public.drop_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "self can delete own subscription" ON public.drop_subscribers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6) Update create_competition_with_tickets to also generate + store seed and hash
CREATE OR REPLACE FUNCTION public.create_competition_with_tickets(
  p_slug text, p_title text, p_subtitle text, p_category text, p_image text, p_description text,
  p_price_per_ticket numeric, p_total_tickets integer, p_cash_alternative integer, p_max_per_person integer,
  p_ends_at timestamp with time zone, p_status text, p_hot boolean, p_skill_question jsonb,
  p_instant_win boolean, p_instant_win_count integer, p_instant_win_prize numeric
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
    p_ends_at, coalesce(p_status, 'live'), coalesce(p_hot, false), p_skill_question, coalesce(p_instant_win, false),
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
$function$;

-- 7) Backfill seeds + hashes for any pre-existing competitions
DO $$
DECLARE
  r RECORD;
  v_seed text;
BEGIN
  FOR r IN SELECT id FROM public.competitions WHERE seed_hash = '' LOOP
    v_seed := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public.competition_secrets(competition_id, seed) VALUES (r.id, v_seed)
      ON CONFLICT (competition_id) DO NOTHING;
    UPDATE public.competitions SET seed_hash = encode(digest(v_seed, 'sha256'), 'hex') WHERE id = r.id;
  END LOOP;
END $$;

-- 8) Rewrite draw_competition: deterministic pick from seed, reveal seed on draw row
CREATE OR REPLACE FUNCTION public.draw_competition(p_comp_id uuid, p_notes text DEFAULT '')
RETURNS public.draws
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_comp public.competitions;
  v_seed text;
  v_hash text;
  v_pool text;
  v_pool_size int;
  v_pick_index int;
  v_winning_ticket public.tickets;
  v_display text;
  v_town text := '';
  v_row public.draws;
  v_owner_email text;
  v_digest bytea;
BEGIN
  SELECT * INTO v_comp FROM public.competitions WHERE id = p_comp_id FOR UPDATE;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'competition not found'; END IF;
  IF v_comp.status = 'drawn' THEN RAISE EXCEPTION 'competition already drawn'; END IF;

  PERFORM public.sweep_expired_reservations();

  SELECT seed INTO v_seed FROM public.competition_secrets WHERE competition_id = p_comp_id;
  IF v_seed IS NULL THEN RAISE EXCEPTION 'no seed for competition'; END IF;
  v_hash := encode(digest(v_seed, 'sha256'), 'hex');

  -- Prefer sold-only pool; fall back to all if none sold
  SELECT count(*) INTO v_pool_size FROM public.tickets
    WHERE competition_id = p_comp_id AND status = 'sold';
  IF v_pool_size > 0 THEN v_pool := 'sold';
  ELSE
    SELECT count(*) INTO v_pool_size FROM public.tickets WHERE competition_id = p_comp_id;
    v_pool := 'all';
  END IF;
  IF v_pool_size = 0 THEN RAISE EXCEPTION 'no tickets to draw'; END IF;

  -- Deterministic index from seed + competition id: first 8 bytes of sha256("draw:"||id||":"||seed) mod pool_size
  v_digest := digest('draw:' || p_comp_id::text || ':' || v_seed, 'sha256');
  v_pick_index := (
    (get_byte(v_digest,0)::bigint << 24) |
    (get_byte(v_digest,1)::bigint << 16) |
    (get_byte(v_digest,2)::bigint << 8)  |
    (get_byte(v_digest,3)::bigint)
  ) % v_pool_size;

  IF v_pool = 'sold' THEN
    SELECT * INTO v_winning_ticket FROM public.tickets
      WHERE competition_id = p_comp_id AND status = 'sold'
      ORDER BY number OFFSET v_pick_index LIMIT 1;
  ELSE
    SELECT * INTO v_winning_ticket FROM public.tickets
      WHERE competition_id = p_comp_id
      ORDER BY number OFFSET v_pick_index LIMIT 1;
  END IF;
  IF v_winning_ticket.id IS NULL THEN RAISE EXCEPTION 'no tickets to draw'; END IF;

  IF v_winning_ticket.owner_id IS NOT NULL THEN
    SELECT email INTO v_owner_email FROM auth.users WHERE id = v_winning_ticket.owner_id;
    IF v_owner_email IS NOT NULL THEN v_display := split_part(v_owner_email, '@', 1); END IF;
  END IF;
  IF v_display IS NULL OR length(v_display) = 0 THEN
    v_display := 'Ticket #' || v_winning_ticket.number || ' holder';
  END IF;

  INSERT INTO public.draws (
    competition_id, competition_title, prize, winning_number,
    winner_display_name, winner_town, total_tickets, draw_method,
    verification_hash, seed_hash, seed_revealed, notes, drawn_at
  ) VALUES (
    p_comp_id, v_comp.title, v_comp.title, v_winning_ticket.number,
    v_display, v_town, v_comp.total_tickets, 'automatic',
    v_hash, v_hash, v_seed,
    coalesce(p_notes, '') || CASE WHEN v_pool = 'all' THEN ' (drew from all tickets: no sold tickets)' ELSE '' END,
    now()
  ) RETURNING * INTO v_row;

  UPDATE public.competitions SET status = 'drawn' WHERE id = p_comp_id;
  RETURN v_row;
END;
$function$;
