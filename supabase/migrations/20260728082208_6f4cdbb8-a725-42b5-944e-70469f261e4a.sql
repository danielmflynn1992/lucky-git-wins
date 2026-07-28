
-- 1) tickets: hide sensitive columns from anon/authenticated via column privileges
REVOKE SELECT ON public.tickets FROM anon, authenticated;
GRANT SELECT (id, competition_id, number, status, is_qualifying, created_at)
  ON public.tickets TO anon, authenticated;

-- 2) client_errors: explicitly revoke direct INSERT (writes must go through log_client_error SECURITY DEFINER)
REVOKE INSERT ON public.client_errors FROM anon, authenticated;

-- 3) competition_secrets: lock down all direct API access
REVOKE ALL ON public.competition_secrets FROM anon, authenticated;

-- 4) drop_subscribers: replace USING/CHECK (true) INSERT policy with scoped one
DROP POLICY IF EXISTS "anyone can subscribe" ON public.drop_subscribers;
CREATE POLICY "subscribe self or anonymous" ON public.drop_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 5) SECURITY DEFINER functions: revoke EXECUTE from public/anon/authenticated where not needed
-- Admin/cron only
REVOKE EXECUTE ON FUNCTION public.create_competition_with_tickets(
  text, text, text, text, text, text, numeric, integer, integer, integer,
  timestamptz, text, boolean, text, text, text, text, text, skill_option, text
) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_competition_with_tickets(
  text, text, text, text, text, text, numeric, integer, integer, integer,
  timestamptz, text, boolean, text, text, text, text, text, skill_option, text, text, text[]
) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.draw_competition(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_draw_expired() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sweep_expired_reservations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_reservation(uuid) FROM PUBLIC, anon;

-- Authenticated-only
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_empty() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unresolved_client_errors_count() FROM PUBLIC, anon;
