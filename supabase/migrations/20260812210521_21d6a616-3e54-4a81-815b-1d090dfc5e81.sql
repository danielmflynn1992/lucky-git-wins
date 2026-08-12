-- 1. tickets: no direct writes from clients; reads stay column-limited (number/status etc.)
REVOKE INSERT, UPDATE, DELETE ON public.tickets FROM anon, authenticated;
REVOKE SELECT ON public.tickets FROM anon, authenticated;
GRANT SELECT (id, competition_id, number, status, created_at, is_qualifying) ON public.tickets TO anon, authenticated;
GRANT ALL ON public.tickets TO service_role;

-- 2. competition_secrets: fail-closed forever
REVOKE ALL ON public.competition_secrets FROM anon, authenticated;
GRANT ALL ON public.competition_secrets TO service_role;
DROP POLICY IF EXISTS "no client access to competition secrets" ON public.competition_secrets;
CREATE POLICY "no client access to competition secrets"
  ON public.competition_secrets FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- 3. draw_notifications: admin read only, no client writes
REVOKE ALL ON public.draw_notifications FROM anon, authenticated;
GRANT SELECT ON public.draw_notifications TO authenticated;
GRANT ALL ON public.draw_notifications TO service_role;
DROP POLICY IF EXISTS "no client writes to draw notifications" ON public.draw_notifications;
CREATE POLICY "no client writes to draw notifications"
  ON public.draw_notifications FOR INSERT TO anon, authenticated
  WITH CHECK (false);

-- 4. entry_answers: owner-scoped read, no direct client writes
REVOKE ALL ON public.entry_answers FROM anon, authenticated;
GRANT SELECT ON public.entry_answers TO authenticated;
GRANT ALL ON public.entry_answers TO service_role;
DROP POLICY IF EXISTS "users read their own answers" ON public.entry_answers;
CREATE POLICY "users read their own answers"
  ON public.entry_answers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 5. SECURITY DEFINER functions: least privilege on EXECUTE
-- internal / scheduler only
REVOKE ALL ON FUNCTION public.pick_question_for_competition() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_draw_notification() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.spawn_rolling_demo() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.rolling_demo_tick() FROM anon, authenticated;

-- admin-only functions: signed-in callers still gated by has_role inside
REVOKE ALL ON FUNCTION public.admin_answer_stats() FROM anon;
REVOKE ALL ON FUNCTION public.admin_close_competition_now(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.admin_export_entry_answers() FROM anon;
REVOKE ALL ON FUNCTION public.admin_list_questions() FROM anon;
REVOKE ALL ON FUNCTION public.admin_reset_rolling_demo() FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_question_active(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.admin_upsert_question(uuid, text, text, bigint, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_competition_with_tickets(text, text, text, text, text, text, numeric, integer, integer, integer, timestamptz, text, boolean, text, text, text[], uuid) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- account functions require a signed-in user anyway
REVOKE ALL ON FUNCTION public.my_limits() FROM anon;
REVOKE ALL ON FUNCTION public.my_entry_answers() FROM anon;
REVOKE ALL ON FUNCTION public.my_month_spend_pence() FROM anon;
REVOKE ALL ON FUNCTION public.export_my_data() FROM anon;
REVOKE ALL ON FUNCTION public.set_monthly_cap(integer) FROM anon;
REVOKE ALL ON FUNCTION public.set_email_prefs(boolean, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.start_cooloff(integer) FROM anon;
REVOKE ALL ON FUNCTION public.self_exclude(integer) FROM anon;

-- public checkout/browse paths keep working for guests
GRANT EXECUTE ON FUNCTION public.release_reservation(uuid) TO anon, authenticated;
