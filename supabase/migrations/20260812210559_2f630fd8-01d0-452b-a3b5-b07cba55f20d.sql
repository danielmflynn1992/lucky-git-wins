DO $$
DECLARE
  f record;
  anon_ok text[] := ARRAY[
    'competition_revealed_answer','competition_sold_counts','get_competition_question',
    'log_client_error','real_draw_count','release_reservation','reserve_lucky_dip',
    'reserve_specific_numbers','submit_skill_answer','purchase_allowance'
  ];
  auth_ok text[] := ARRAY[
    'competition_revealed_answer','competition_sold_counts','get_competition_question',
    'log_client_error','real_draw_count','release_reservation','reserve_lucky_dip',
    'reserve_specific_numbers','submit_skill_answer','purchase_allowance',
    'has_role','claim_admin_if_empty','my_limits','my_entry_answers','my_month_spend_pence',
    'export_my_data','set_monthly_cap','set_email_prefs','start_cooloff','self_exclude',
    'admin_answer_stats','admin_close_competition_now','admin_export_entry_answers',
    'admin_list_questions','admin_reset_rolling_demo','admin_set_daily_demo',
    'admin_set_question_active','admin_upsert_question','create_competition_with_tickets',
    'unresolved_client_errors_count'
  ];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    IF f.proname = ANY(anon_ok) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', f.sig);
    END IF;
    IF f.proname = ANY(auth_ok) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
  END LOOP;
END $$;
