
REVOKE ALL ON FUNCTION public.spawn_daily_demo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_missed_draws() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prune_daily_demos() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.demo_scheduler_tick() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_daily_demo(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_daily_demo(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spawn_daily_demo() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.check_missed_draws() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.prune_daily_demos() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.demo_scheduler_tick() TO postgres, service_role;
