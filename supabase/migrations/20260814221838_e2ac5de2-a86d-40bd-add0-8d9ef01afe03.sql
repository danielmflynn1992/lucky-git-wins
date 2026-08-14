DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.competitions WHERE slug = 'e2e-payment-rehearsal';
  IF v_id IS NULL THEN RETURN; END IF;
  DELETE FROM public.email_log WHERE order_id IN (SELECT id FROM public.orders WHERE competition_id = v_id);
  DELETE FROM public.payment_events WHERE order_id IN (SELECT id FROM public.orders WHERE competition_id = v_id);
  DELETE FROM public.entry_answers WHERE competition_id = v_id;
  DELETE FROM public.orders WHERE competition_id = v_id;
  DELETE FROM public.tickets WHERE competition_id = v_id;
  DELETE FROM public.competition_secrets WHERE competition_id = v_id;
  DELETE FROM public.competitions WHERE id = v_id;
END $$;