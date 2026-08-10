
CREATE TABLE public.player_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_cap_pence integer,
  pending_cap_pence integer,
  pending_cap_effective_at timestamptz,
  cooloff_until timestamptz,
  self_excluded_until timestamptz,
  email_drop_reminders boolean NOT NULL DEFAULT true,
  email_draw_results boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.player_limits TO authenticated;
GRANT ALL ON public.player_limits TO service_role;

ALTER TABLE public.player_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own limits" ON public.player_limits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER player_limits_updated_at BEFORE UPDATE ON public.player_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Promote any pending (increase) cap whose cooling-off has elapsed, and return the row.
CREATE OR REPLACE FUNCTION public.my_limits()
RETURNS public.player_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); r public.player_limits;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  INSERT INTO public.player_limits(user_id) VALUES (v_uid) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.player_limits
     SET monthly_cap_pence = pending_cap_pence,
         pending_cap_pence = NULL,
         pending_cap_effective_at = NULL
   WHERE user_id = v_uid
     AND pending_cap_effective_at IS NOT NULL
     AND pending_cap_effective_at <= now();
  SELECT * INTO r FROM public.player_limits WHERE user_id = v_uid;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.set_monthly_cap(p_pence integer)
RETURNS public.player_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); r public.player_limits;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF p_pence IS NOT NULL AND (p_pence < 0 OR p_pence > 100000000) THEN
    RAISE EXCEPTION 'cap out of range';
  END IF;
  r := public.my_limits();

  IF p_pence IS NULL THEN
    -- Removing a cap is an increase: 24h cooling-off.
    IF r.monthly_cap_pence IS NULL THEN RETURN r; END IF;
    UPDATE public.player_limits
       SET pending_cap_pence = NULL, pending_cap_effective_at = now() + interval '24 hours'
     WHERE user_id = v_uid;
  ELSIF r.monthly_cap_pence IS NULL OR p_pence <= r.monthly_cap_pence THEN
    UPDATE public.player_limits
       SET monthly_cap_pence = p_pence, pending_cap_pence = NULL, pending_cap_effective_at = NULL
     WHERE user_id = v_uid;
  ELSE
    UPDATE public.player_limits
       SET pending_cap_pence = p_pence, pending_cap_effective_at = now() + interval '24 hours'
     WHERE user_id = v_uid;
  END IF;

  SELECT * INTO r FROM public.player_limits WHERE user_id = v_uid;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.start_cooloff(p_days integer)
RETURNS public.player_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); r public.player_limits; v_until timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF p_days NOT IN (7, 30, 90) THEN RAISE EXCEPTION 'cool-off must be 7, 30 or 90 days'; END IF;
  r := public.my_limits();
  v_until := now() + make_interval(days => p_days);
  -- Never shortens an existing break.
  UPDATE public.player_limits
     SET cooloff_until = greatest(coalesce(cooloff_until, now()), v_until)
   WHERE user_id = v_uid;
  SELECT * INTO r FROM public.player_limits WHERE user_id = v_uid;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.self_exclude(p_months integer)
RETURNS public.player_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); r public.player_limits; v_until timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF p_months < 6 OR p_months > 600 THEN RAISE EXCEPTION 'self-exclusion is 6 months minimum'; END IF;
  r := public.my_limits();
  v_until := now() + make_interval(months => p_months);
  UPDATE public.player_limits
     SET self_excluded_until = greatest(coalesce(self_excluded_until, now()), v_until),
         email_drop_reminders = false
   WHERE user_id = v_uid;
  SELECT * INTO r FROM public.player_limits WHERE user_id = v_uid;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.set_email_prefs(p_drop_reminders boolean, p_draw_results boolean)
RETURNS public.player_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); r public.player_limits;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  r := public.my_limits();
  UPDATE public.player_limits
     SET email_drop_reminders = coalesce(p_drop_reminders, email_drop_reminders),
         email_draw_results = coalesce(p_draw_results, email_draw_results)
   WHERE user_id = v_uid;
  SELECT * INTO r FROM public.player_limits WHERE user_id = v_uid;
  RETURN r;
END $$;

-- Spend this calendar month, in pence, from sold tickets owned by the caller.
CREATE OR REPLACE FUNCTION public.my_month_spend_pence()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(round(c.price_per_ticket * 100))::int, 0)
  FROM public.tickets t
  JOIN public.competitions c ON c.id = t.competition_id
  WHERE t.owner_id = auth.uid()
    AND t.status = 'sold'
    AND t.created_at >= date_trunc('month', now());
$$;

-- Authoritative purchase gate: cool-off, self-exclusion and monthly cap.
CREATE OR REPLACE FUNCTION public.purchase_allowance(p_amount_pence integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); r public.player_limits; v_spent int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'reason', null);
  END IF;
  IF p_amount_pence IS NULL OR p_amount_pence < 0 THEN RAISE EXCEPTION 'bad amount'; END IF;
  r := public.my_limits();

  IF r.self_excluded_until IS NOT NULL AND r.self_excluded_until > now() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'self_excluded',
      'until', r.self_excluded_until);
  END IF;
  IF r.cooloff_until IS NOT NULL AND r.cooloff_until > now() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'cooloff', 'until', r.cooloff_until);
  END IF;

  v_spent := public.my_month_spend_pence();
  IF r.monthly_cap_pence IS NOT NULL AND v_spent + p_amount_pence > r.monthly_cap_pence THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'monthly_cap',
      'cap_pence', r.monthly_cap_pence, 'spent_pence', v_spent);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'reason', null,
    'cap_pence', r.monthly_cap_pence, 'spent_pence', v_spent);
END $$;

-- Answer results stay sealed until the competition is drawn. Correctness is
-- never projected for an undrawn competition, so the client cannot know it.
DROP POLICY IF EXISTS "users read own answers" ON public.entry_answers;

CREATE OR REPLACE FUNCTION public.my_entry_answers()
RETURNS TABLE(
  id uuid,
  competition_id uuid,
  competition_title text,
  competition_slug text,
  drawn boolean,
  draw_id uuid,
  raw_answer text,
  answered_at timestamptz,
  is_correct boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id,
         a.competition_id,
         c.title,
         c.slug,
         (c.status = 'drawn') AS drawn,
         d.id AS draw_id,
         a.raw_answer,
         a.answered_at,
         CASE WHEN c.status = 'drawn' THEN a.is_correct ELSE NULL END AS is_correct
  FROM public.entry_answers a
  LEFT JOIN public.competitions c ON c.id = a.competition_id
  LEFT JOIN LATERAL (
    SELECT dd.id FROM public.draws dd WHERE dd.competition_id = a.competition_id
    ORDER BY dd.drawn_at DESC LIMIT 1
  ) d ON true
  WHERE a.user_id = auth.uid() AND auth.uid() IS NOT NULL
  ORDER BY a.answered_at DESC;
$$;

-- GDPR export of the caller's own data.
CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  RETURN jsonb_build_object(
    'exported_at', now(),
    'account', (SELECT jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at)
                  FROM auth.users u WHERE u.id = v_uid),
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id = v_uid),
    'limits', (SELECT to_jsonb(l) FROM public.player_limits l WHERE l.user_id = v_uid),
    'answers', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM public.my_entry_answers() x), '[]'::jsonb),
    'tickets', coalesce((SELECT jsonb_agg(jsonb_build_object(
                    'competition_id', t.competition_id, 'number', t.number,
                    'status', t.status, 'created_at', t.created_at))
                  FROM public.tickets t WHERE t.owner_id = v_uid), '[]'::jsonb)
  );
END $$;
