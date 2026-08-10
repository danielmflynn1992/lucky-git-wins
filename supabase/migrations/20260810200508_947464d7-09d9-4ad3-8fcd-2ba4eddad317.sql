
REVOKE EXECUTE ON FUNCTION public.my_limits() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_monthly_cap(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.start_cooloff(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.self_exclude(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_email_prefs(boolean, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_month_spend_pence() FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_entry_answers() FROM anon;
REVOKE EXECUTE ON FUNCTION public.export_my_data() FROM anon;
