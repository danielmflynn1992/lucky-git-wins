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

  -- An answer already exists for this (still unpaid) reservation: replace it.
  SELECT order_ref INTO v_existing FROM public.tickets
   WHERE reservation_token = p_reservation_token AND status = 'reserved' AND order_ref IS NOT NULL
   LIMIT 1;

  v_order := coalesce(v_existing, p_order_ref, gen_random_uuid());

  v_norm := public.normalise_numeric_answer(p_raw_answer);
  IF v_norm IS NULL THEN RAISE EXCEPTION 'unparseable answer'; END IF;

  v_correct := (v_norm = v_q.correct_answer);

  SELECT * INTO v_prev FROM public.entry_answers WHERE order_ref = v_order LIMIT 1;

  IF v_prev.id IS NOT NULL THEN
    -- Roll back the stats of the previous attempt, then overwrite it.
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