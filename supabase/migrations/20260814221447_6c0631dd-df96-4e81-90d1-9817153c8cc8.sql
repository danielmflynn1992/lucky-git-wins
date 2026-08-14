DO $$
DECLARE
  v_id uuid;
  v_seed text := encode(gen_random_bytes(16), 'hex');
BEGIN
  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description, price_per_ticket,
    total_tickets, cash_alternative, max_per_person, ends_at, status, hot,
    letterbox_style, supporting_images, question_id, is_demo, seed_hash
  ) VALUES (
    'e2e-payment-rehearsal',
    'Payment Rehearsal — 55" Telly',
    'Internal test competition',
    'Tech',
    '',
    'Temporary competition used to rehearse the payment-to-entry flow. Will be removed.',
    1.99, 20, 0, 25, now() + interval '2 hours', 'live', false,
    'blur', '{}'::text[], public.pick_question_for_competition(), false,
    encode(digest(v_seed, 'sha256'), 'hex')
  ) RETURNING id INTO v_id;

  INSERT INTO public.competition_secrets (competition_id, seed) VALUES (v_id, v_seed);

  INSERT INTO public.tickets (competition_id, number, status)
  SELECT v_id, g, 'available' FROM generate_series(1, 20) g;
END $$;