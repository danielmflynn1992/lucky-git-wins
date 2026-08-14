
-- ============ ORDERS ============
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_ref uuid NOT NULL UNIQUE,
  reservation_token uuid NOT NULL UNIQUE,
  quantity integer NOT NULL,
  amount_pence integer NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment',
  provider text NOT NULL DEFAULT 'stripe_test',
  provider_ref text,
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  display_name text,
  town text NOT NULL DEFAULT '',
  is_guest boolean NOT NULL DEFAULT true,
  failure_reason text,
  pending_expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_chk CHECK (status IN ('pending_payment','paid','failed','expired'))
);
CREATE INDEX orders_competition_idx ON public.orders(competition_id);
CREATE INDEX orders_email_idx ON public.orders(lower(contact_email));
CREATE INDEX orders_status_idx ON public.orders(status);

GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own orders" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "admins read all orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_order_id_fkey FOREIGN KEY (order_id)
  REFERENCES public.orders(id) ON DELETE SET NULL;

-- ============ PAYMENT EVENTS (idempotency) ============
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL DEFAULT '',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no client access to payment events" ON public.payment_events
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ============ EMAIL LOG ============
CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  template text NOT NULL DEFAULT 'generic',
  status text NOT NULL DEFAULT 'queued',
  detail text,
  dedupe_key text UNIQUE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  draw_id uuid REFERENCES public.draws(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  CONSTRAINT email_log_status_chk CHECK (status IN ('queued','sent','failed','skipped'))
);
CREATE INDEX email_log_status_idx ON public.email_log(status);
GRANT SELECT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read email log" ON public.email_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILE TOWN ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS town text NOT NULL DEFAULT '';

-- ============ ANSWER LOCKING ============
ALTER TABLE public.entry_answers ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- ============ EMAIL ENQUEUE HELPER ============
CREATE OR REPLACE FUNCTION public.enqueue_email(
  p_recipient text, p_subject text, p_body text, p_template text,
  p_dedupe_key text, p_order_id uuid DEFAULT NULL, p_draw_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_recipient IS NULL OR position('@' in p_recipient) = 0 THEN RETURN; END IF;
  INSERT INTO public.email_log(recipient, subject, body, template, dedupe_key, order_id, draw_id)
  VALUES (lower(btrim(p_recipient)), p_subject, p_body, p_template, p_dedupe_key, p_order_id, p_draw_id)
  ON CONFLICT (dedupe_key) DO NOTHING;
END $$;

-- ============ SWEEPER: respect pending payments ============
CREATE OR REPLACE FUNCTION public.sweep_expired_reservations()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Pending orders that ran out of time fail cleanly.
  UPDATE public.orders
     SET status = 'expired', failure_reason = 'payment window expired'
   WHERE status = 'pending_payment' AND pending_expires_at < now();

  UPDATE public.tickets t
     SET status = 'available', reservation_token = NULL, reserved_until = NULL, order_id = NULL
   WHERE t.status = 'reserved'
     AND t.reserved_until < now()
     AND NOT EXISTS (
       SELECT 1 FROM public.orders o
        WHERE o.id = t.order_id
          AND o.status = 'pending_payment'
          AND o.pending_expires_at > now()
     );
END $$;

-- ============ CREATE PENDING ORDER ============
CREATE OR REPLACE FUNCTION public.create_pending_order(
  p_reservation_token uuid,
  p_name text,
  p_email text,
  p_phone text DEFAULT '',
  p_display_name text DEFAULT NULL,
  p_town text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_comp public.competitions;
  v_qty int;
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_order_ref uuid;
  v_display text;
  v_email text := lower(btrim(coalesce(p_email,'')));
BEGIN
  SELECT c.* INTO v_comp
    FROM public.tickets t JOIN public.competitions c ON c.id = t.competition_id
   WHERE t.reservation_token = p_reservation_token AND t.status = 'reserved'
   LIMIT 1;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'reservation not found or expired'; END IF;

  SELECT count(*) INTO v_qty FROM public.tickets
   WHERE reservation_token = p_reservation_token AND status = 'reserved';

  IF v_uid IS NOT NULL THEN
    SELECT nullif(btrim(display_name), '') INTO v_display FROM public.profiles WHERE user_id = v_uid;
    v_display := coalesce(nullif(btrim(coalesce(p_display_name,'')), ''), v_display);
    IF v_display IS NULL THEN RAISE EXCEPTION 'display name required'; END IF;
    IF v_email = '' THEN SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid; END IF;
    UPDATE public.profiles
       SET display_name = v_display,
           town = coalesce(nullif(btrim(coalesce(p_town,'')), ''), town)
     WHERE user_id = v_uid;
  ELSE
    v_display := nullif(btrim(coalesce(p_display_name,'')), '');
  END IF;

  IF v_email = '' OR position('@' in v_email) = 0 THEN RAISE EXCEPTION 'a valid email is required'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE reservation_token = p_reservation_token;

  IF v_order.id IS NOT NULL THEN
    IF v_order.status = 'paid' THEN
      RETURN jsonb_build_object('order_id', v_order.id, 'order_ref', v_order.order_ref,
                                'amount_pence', v_order.amount_pence, 'quantity', v_order.quantity,
                                'status', v_order.status);
    END IF;
    UPDATE public.orders
       SET status = 'pending_payment', quantity = v_qty,
           amount_pence = round(v_comp.price_per_ticket * 100)::int * v_qty,
           contact_name = left(coalesce(p_name,''), 120), contact_email = v_email,
           contact_phone = left(coalesce(p_phone,''), 40),
           display_name = v_display, town = left(coalesce(p_town,''), 80),
           user_id = v_uid, is_guest = (v_uid IS NULL),
           pending_expires_at = now() + interval '30 minutes', failure_reason = NULL
     WHERE id = v_order.id
    RETURNING * INTO v_order;
  ELSE
    SELECT order_ref INTO v_order_ref FROM public.tickets
     WHERE reservation_token = p_reservation_token AND order_ref IS NOT NULL LIMIT 1;
    v_order_ref := coalesce(v_order_ref, gen_random_uuid());

    INSERT INTO public.orders (competition_id, user_id, order_ref, reservation_token, quantity,
      amount_pence, contact_name, contact_email, contact_phone, display_name, town, is_guest)
    VALUES (v_comp.id, v_uid, v_order_ref, p_reservation_token, v_qty,
      round(v_comp.price_per_ticket * 100)::int * v_qty,
      left(coalesce(p_name,''), 120), v_email, left(coalesce(p_phone,''), 40),
      v_display, left(coalesce(p_town,''), 80), v_uid IS NULL)
    RETURNING * INTO v_order;
  END IF;

  UPDATE public.tickets
     SET order_id = v_order.id,
         order_ref = v_order.order_ref,
         reserved_until = greatest(reserved_until, v_order.pending_expires_at)
   WHERE reservation_token = p_reservation_token AND status = 'reserved';

  RETURN jsonb_build_object('order_id', v_order.id, 'order_ref', v_order.order_ref,
                            'amount_pence', v_order.amount_pence, 'quantity', v_order.quantity,
                            'status', v_order.status);
END $$;
GRANT EXECUTE ON FUNCTION public.create_pending_order(uuid,text,text,text,text,text) TO anon, authenticated, service_role;

-- ============ ORDER STATUS (polling) ============
CREATE OR REPLACE FUNCTION public.order_status(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'status', o.status,
    'order_ref', o.order_ref,
    'paid_at', o.paid_at,
    'failure_reason', o.failure_reason,
    'numbers', coalesce((SELECT array_agg(t.number ORDER BY t.number)
                           FROM public.tickets t WHERE t.order_id = o.id), '{}'::int[]),
    'is_qualifying', coalesce((SELECT bool_or(t.is_qualifying) FROM public.tickets t WHERE t.order_id = o.id), false)
  )
  FROM public.orders o WHERE o.id = p_order_id;
$$;
GRANT EXECUTE ON FUNCTION public.order_status(uuid) TO anon, authenticated, service_role;

-- ============ MARK ORDER PAID (idempotent, atomic) ============
CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_order_id uuid, p_provider text, p_event_id text, p_provider_ref text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order public.orders;
  v_comp public.competitions;
  v_new boolean;
  v_nums text;
  v_qualifying boolean;
BEGIN
  INSERT INTO public.payment_events(provider, event_id, event_type, order_id)
  VALUES (p_provider, p_event_id, 'payment_succeeded', p_order_id)
  ON CONFLICT (provider, event_id) DO NOTHING;
  GET DIAGNOSTICS v_new = ROW_COUNT;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;

  IF NOT v_new OR v_order.status = 'paid' THEN
    RETURN jsonb_build_object('status', v_order.status, 'already_processed', true);
  END IF;

  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'order is % and cannot be paid', v_order.status;
  END IF;

  SELECT * INTO v_comp FROM public.competitions WHERE id = v_order.competition_id;

  UPDATE public.tickets
     SET status = 'sold',
         owner_id = v_order.user_id,
         reservation_token = NULL,
         reserved_until = NULL
   WHERE order_id = v_order.id AND status = 'reserved';

  UPDATE public.entry_answers
     SET locked_at = now()
   WHERE order_ref = v_order.order_ref AND locked_at IS NULL;

  UPDATE public.orders
     SET status = 'paid', paid_at = now(), provider = p_provider,
         provider_ref = coalesce(p_provider_ref, provider_ref)
   WHERE id = v_order.id
  RETURNING * INTO v_order;

  SELECT string_agg(lpad(t.number::text, 4, '0'), ', ' ORDER BY t.number),
         coalesce(bool_or(t.is_qualifying), false)
    INTO v_nums, v_qualifying
    FROM public.tickets t WHERE t.order_id = v_order.id;

  PERFORM public.enqueue_email(
    v_order.contact_email,
    'Order confirmed: ' || v_comp.title,
    'Thanks — your entry is in.' || E'\n\n' ||
    'Competition: ' || v_comp.title || E'\n' ||
    'Ticket numbers: ' || coalesce(v_nums, '—') || E'\n' ||
    'Total paid: £' || to_char(v_order.amount_pence / 100.0, 'FM999999990.00') || E'\n' ||
    'Skill question: ' || CASE WHEN v_qualifying
        THEN 'correct — your tickets are entered in the draw.'
        ELSE 'incorrect — these tickets are non-qualifying and are not entered in the draw.' END || E'\n' ||
    'Draw: ' || to_char(v_comp.ends_at AT TIME ZONE 'Europe/London', 'DD Mon YYYY HH24:MI') || ' (UK time)' || E'\n' ||
    'Order reference: ' || v_order.order_ref::text,
    'order_confirmation',
    'order_confirmation:' || v_order.id::text,
    v_order.id, NULL
  );

  RETURN jsonb_build_object('status', 'paid', 'already_processed', false);
END $$;
GRANT EXECUTE ON FUNCTION public.mark_order_paid(uuid,text,text,text) TO service_role;

-- ============ FAIL ORDER ============
CREATE OR REPLACE FUNCTION public.fail_order(p_order_id uuid, p_reason text DEFAULT 'payment failed')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.orders;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;
  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object('status', 'paid', 'changed', false);
  END IF;

  UPDATE public.tickets
     SET status = 'available', reservation_token = NULL, reserved_until = NULL, order_id = NULL
   WHERE order_id = v_order.id AND status = 'reserved';

  UPDATE public.orders SET status = 'failed', failure_reason = left(coalesce(p_reason,''), 300)
   WHERE id = v_order.id;

  RETURN jsonb_build_object('status', 'failed', 'changed', true);
END $$;
GRANT EXECUTE ON FUNCTION public.fail_order(uuid,text) TO service_role;

-- ============ SKILL ANSWER: refuse to change a locked answer ============
CREATE OR REPLACE FUNCTION public.submit_skill_answer(p_reservation_token uuid, p_question_id uuid, p_raw_answer text, p_order_ref uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_q public.question_bank;
  v_norm bigint;
  v_correct boolean;
  v_order uuid;
  v_existing uuid;
  v_prev public.entry_answers;
  v_count int;
BEGIN
  SELECT * INTO v_q FROM public.question_bank WHERE id = p_question_id;
  IF v_q.id IS NULL THEN RAISE EXCEPTION 'question not found'; END IF;

  SELECT count(*) INTO v_count FROM public.tickets
    WHERE reservation_token = p_reservation_token AND status = 'reserved';
  IF v_count = 0 THEN RAISE EXCEPTION 'no reserved tickets for this reservation'; END IF;

  SELECT order_ref INTO v_existing FROM public.tickets
   WHERE reservation_token = p_reservation_token AND status = 'reserved' AND order_ref IS NOT NULL
   LIMIT 1;

  v_order := coalesce(v_existing, p_order_ref, gen_random_uuid());

  v_norm := public.normalise_numeric_answer(p_raw_answer);
  IF v_norm IS NULL THEN RAISE EXCEPTION 'unparseable answer'; END IF;

  v_correct := (v_norm = v_q.correct_answer);

  SELECT * INTO v_prev FROM public.entry_answers WHERE order_ref = v_order LIMIT 1;

  IF v_prev.id IS NOT NULL AND v_prev.locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'answer already locked against a paid order';
  END IF;

  IF v_prev.id IS NOT NULL THEN
    UPDATE public.question_bank
       SET times_served = greatest(times_served - 1, 0),
           times_correct = greatest(times_correct - CASE WHEN v_prev.is_correct THEN 1 ELSE 0 END, 0)
     WHERE id = v_prev.question_id;

    UPDATE public.entry_answers
       SET question_id = v_q.id,
           raw_answer = left(coalesce(p_raw_answer,''), 200),
           normalised_answer = v_norm,
           is_correct = v_correct,
           answered_at = now()
     WHERE id = v_prev.id;
  ELSE
    INSERT INTO public.entry_answers
      (order_ref, user_id, competition_id, question_id, raw_answer, normalised_answer, is_correct)
    SELECT v_order, auth.uid(), t.competition_id, v_q.id, left(coalesce(p_raw_answer,''), 200), v_norm, v_correct
    FROM public.tickets t
    WHERE t.reservation_token = p_reservation_token AND t.status = 'reserved'
    LIMIT 1;
  END IF;

  UPDATE public.tickets
     SET order_ref = v_order, is_qualifying = v_correct
   WHERE reservation_token = p_reservation_token AND status = 'reserved';

  UPDATE public.question_bank
     SET times_served = times_served + 1,
         times_correct = times_correct + CASE WHEN v_correct THEN 1 ELSE 0 END
   WHERE id = v_q.id;

  RETURN jsonb_build_object('is_correct', v_correct, 'order_ref', v_order);
END $function$;

-- ============ DRAW: privacy-safe winner display name ============
CREATE OR REPLACE FUNCTION public.draw_competition(p_comp_id uuid, p_notes text DEFAULT ''::text)
 RETURNS draws
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_comp public.competitions;
  v_seed text; v_hash text;
  v_pool text; v_pool_size int; v_pick_index int;
  v_total_sold int;
  v_win public.tickets;
  v_display text := ''; v_name text; v_town text := '';
  v_row public.draws; v_digest bytea;
BEGIN
  SELECT * INTO v_comp FROM public.competitions WHERE id = p_comp_id FOR UPDATE;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'competition not found'; END IF;
  IF v_comp.status = 'drawn' THEN RAISE EXCEPTION 'competition already drawn'; END IF;

  PERFORM public.sweep_expired_reservations();

  SELECT seed INTO v_seed FROM public.competition_secrets WHERE competition_id = p_comp_id;
  IF v_seed IS NULL THEN RAISE EXCEPTION 'no seed for competition'; END IF;
  v_hash := encode(digest(v_seed, 'sha256'), 'hex');

  SELECT count(*) INTO v_total_sold FROM public.tickets
    WHERE competition_id = p_comp_id AND status = 'sold';

  SELECT count(*) INTO v_pool_size FROM public.tickets
    WHERE competition_id = p_comp_id AND status = 'sold' AND is_qualifying = true;

  IF v_pool_size > 0 THEN
    v_pool := 'qualifying';
  ELSIF v_total_sold > 0 THEN
    v_pool := 'all_sold_fallback';
    v_pool_size := v_total_sold;
  ELSE
    RAISE EXCEPTION 'no tickets to draw';
  END IF;

  v_digest := digest('draw:' || p_comp_id::text || ':' || v_seed, 'sha256');
  v_pick_index := (
    (get_byte(v_digest,0)::bigint << 24) |
    (get_byte(v_digest,1)::bigint << 16) |
    (get_byte(v_digest,2)::bigint << 8)  |
    (get_byte(v_digest,3)::bigint)
  ) % v_pool_size;

  IF v_pool = 'qualifying' THEN
    SELECT * INTO v_win FROM public.tickets
      WHERE competition_id = p_comp_id AND status = 'sold' AND is_qualifying = true
      ORDER BY number OFFSET v_pick_index LIMIT 1;
  ELSE
    SELECT * INTO v_win FROM public.tickets
      WHERE competition_id = p_comp_id AND status = 'sold'
      ORDER BY number OFFSET v_pick_index LIMIT 1;
  END IF;
  IF v_win.id IS NULL THEN RAISE EXCEPTION 'no tickets to draw'; END IF;

  -- Display name: profile first, then the order's own display name.
  -- Never any part of an email address.
  IF v_win.owner_id IS NOT NULL THEN
    SELECT nullif(btrim(p.display_name), ''), coalesce(nullif(btrim(p.town), ''), '')
      INTO v_name, v_town
      FROM public.profiles p WHERE p.user_id = v_win.owner_id;
  END IF;
  IF v_name IS NULL AND v_win.order_id IS NOT NULL THEN
    SELECT nullif(btrim(o.display_name), ''), coalesce(nullif(btrim(o.town), ''), '')
      INTO v_name, v_town
      FROM public.orders o WHERE o.id = v_win.order_id;
  END IF;

  IF v_name IS NOT NULL THEN
    IF position(' ' in v_name) > 0 THEN
      v_display := split_part(v_name, ' ', 1) || ' ' ||
                   upper(left(split_part(v_name, ' ', array_length(string_to_array(v_name, ' '), 1)), 1)) || '.';
    ELSE
      v_display := v_name;
    END IF;
  END IF;

  IF v_display IS NULL OR length(v_display) = 0 THEN
    v_display := 'Ticket #' || v_win.number || ' holder';
  END IF;

  INSERT INTO public.draws (
    competition_id, competition_title, prize, winning_number,
    winner_display_name, winner_town, total_tickets, draw_method,
    verification_hash, seed_hash, seed_revealed, notes, drawn_at,
    total_sold, qualifying_pool_size, drew_from
  ) VALUES (
    p_comp_id, v_comp.title, v_comp.title, v_win.number,
    v_display, coalesce(v_town, ''), v_comp.total_tickets, 'automatic',
    v_hash, v_hash, v_seed,
    coalesce(p_notes,'') || CASE WHEN v_pool='all_sold_fallback'
      THEN ' (fallback: no qualifying entries — drew from all sold per T&Cs)'
      ELSE '' END,
    now(), v_total_sold, v_pool_size, v_pool
  ) RETURNING * INTO v_row;

  UPDATE public.competitions SET status='drawn' WHERE id = p_comp_id;
  RETURN v_row;
END $function$;

-- ============ DRAW NOTIFICATIONS: entrants + winner ============
CREATE OR REPLACE FUNCTION public.queue_draw_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prefix text := CASE WHEN NEW.is_demo THEN '[DEMO] ' ELSE '' END;
  v_subject text;
  v_body text;
  v_count int := 0;
  v_cash int := 0;
  v_win_order uuid;
  r record;
BEGIN
  v_subject := v_prefix || 'Draw complete: ' || NEW.competition_title;
  v_body := 'Competition: ' || NEW.competition_title || E'\n' ||
            'Winning ticket: #' || NEW.winning_number || ' of ' || NEW.total_tickets || E'\n' ||
            'Drawn at: ' || to_char(NEW.drawn_at, 'YYYY-MM-DD HH24:MI:SS TZ') || E'\n' ||
            'Draw ID: ' || NEW.id::text || E'\n' ||
            'Seed hash: ' || NEW.seed_hash || E'\n' ||
            CASE WHEN NEW.is_demo
              THEN E'\nThis is an EXAMPLE draw. The verification is real, the prize was not.'
              ELSE '' END;

  FOR r IN
    SELECT u.email FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
    WHERE u.email IS NOT NULL
  LOOP
    INSERT INTO public.draw_notifications(draw_id, competition_title, is_demo, recipient, subject, body)
    VALUES (NEW.id, NEW.competition_title, NEW.is_demo, r.email, v_subject, v_body);
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    INSERT INTO public.draw_notifications(draw_id, competition_title, is_demo, recipient, subject, body, status, detail)
    VALUES (NEW.id, NEW.competition_title, NEW.is_demo, '(no admin recipients)', v_subject, v_body,
            'skipped', 'No admin account with an email address exists yet.');
  END IF;

  IF NEW.is_demo OR NEW.competition_id IS NULL THEN RETURN NEW; END IF;

  SELECT coalesce(cash_alternative, 0) INTO v_cash FROM public.competitions WHERE id = NEW.competition_id;

  SELECT t.order_id INTO v_win_order FROM public.tickets t
   WHERE t.competition_id = NEW.competition_id AND t.number = NEW.winning_number LIMIT 1;

  -- One email per paying entrant in this draw, win or lose.
  FOR r IN
    SELECT o.id, o.contact_email,
           (o.id = v_win_order) AS is_winner,
           (SELECT string_agg(lpad(t.number::text, 4, '0'), ', ' ORDER BY t.number)
              FROM public.tickets t WHERE t.order_id = o.id AND t.is_qualifying) AS nums
      FROM public.orders o
     WHERE o.competition_id = NEW.competition_id AND o.status = 'paid'
  LOOP
    IF r.is_winner THEN
      PERFORM public.enqueue_email(
        r.contact_email,
        'You have won: ' || NEW.competition_title,
        'Congratulations — ticket #' || lpad(NEW.winning_number::text, 4, '0') ||
        ' won ' || NEW.competition_title || '.' || E'\n\n' ||
        'What happens next: we will contact you within 2 working days to confirm your identity and arrange delivery or collection of the prize.' || E'\n' ||
        CASE WHEN v_cash > 0
          THEN 'Cash alternative: you may take £' || v_cash || ' instead of the prize if you prefer.'
          ELSE 'A cash alternative is not available for this prize.' END || E'\n\n' ||
        'The draw is provably fair. Verify it yourself with draw ID ' || NEW.id::text || '.',
        'winner_notification', 'winner:' || NEW.id::text || ':' || r.id::text, r.id, NEW.id);
    ELSE
      PERFORM public.enqueue_email(
        r.contact_email,
        'Draw result: ' || NEW.competition_title,
        'The draw for ' || NEW.competition_title || ' is done.' || E'\n\n' ||
        'Winning ticket: #' || lpad(NEW.winning_number::text, 4, '0') || E'\n' ||
        'Your qualifying tickets: ' || coalesce(r.nums, 'none') || E'\n\n' ||
        'Not this time. The draw is provably fair — verify it yourself with draw ID ' || NEW.id::text || '.',
        'draw_result', 'result:' || NEW.id::text || ':' || r.id::text, r.id, NEW.id);
    END IF;
  END LOOP;

  RETURN NEW;
END $function$;

-- ============ BACKFILL: strip email-derived winner names ============
UPDATE public.draws d
   SET winner_display_name = 'Ticket #' || d.winning_number || ' holder'
 WHERE EXISTS (
   SELECT 1 FROM auth.users u
    WHERE u.email IS NOT NULL
      AND lower(d.winner_display_name) = lower(split_part(u.email, '@', 1))
 );
