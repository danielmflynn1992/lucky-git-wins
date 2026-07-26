ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS thumb_url text,
  ADD COLUMN IF NOT EXISTS supporting_images text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.competitions
  DROP CONSTRAINT IF EXISTS competitions_supporting_images_max;
ALTER TABLE public.competitions
  ADD CONSTRAINT competitions_supporting_images_max
  CHECK (coalesce(array_length(supporting_images, 1), 0) <= 5);

CREATE OR REPLACE FUNCTION public.create_competition_with_tickets(
  p_slug text, p_title text, p_subtitle text, p_category text, p_image text,
  p_description text, p_price_per_ticket numeric, p_total_tickets integer,
  p_cash_alternative integer, p_max_per_person integer,
  p_ends_at timestamp with time zone, p_status text, p_hot boolean,
  p_question text, p_option_a text, p_option_b text, p_option_c text, p_option_d text,
  p_correct_option skill_option, p_letterbox_style text DEFAULT 'blur'::text,
  p_thumb_url text DEFAULT NULL,
  p_supporting_images text[] DEFAULT '{}'::text[]
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_id uuid; v_seed text; v_hash text; v_style public.letterbox_style;
BEGIN
  IF p_total_tickets < 1 OR p_total_tickets > 499 THEN
    RAISE EXCEPTION 'total tickets must be between 1 and 499';
  END IF;
  IF p_question IS NULL OR length(trim(p_question)) < 8 THEN
    RAISE EXCEPTION 'skill question is required';
  END IF;
  IF coalesce(array_length(p_supporting_images, 1), 0) > 5 THEN
    RAISE EXCEPTION 'no more than 5 supporting images';
  END IF;

  BEGIN v_style := coalesce(p_letterbox_style,'blur')::public.letterbox_style;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid letterbox_style: %', p_letterbox_style;
  END;

  v_seed := encode(extensions.gen_random_bytes(32),'hex');
  v_hash := encode(extensions.digest(v_seed,'sha256'),'hex');

  INSERT INTO public.competitions (
    slug, title, subtitle, category, image, description,
    price_per_ticket, total_tickets, cash_alternative, max_per_person,
    ends_at, status, hot, seed_hash, letterbox_style,
    thumb_url, supporting_images
  ) VALUES (
    p_slug, p_title, coalesce(p_subtitle,''), p_category, coalesce(p_image,''), coalesce(p_description,''),
    p_price_per_ticket, p_total_tickets, p_cash_alternative, p_max_per_person,
    p_ends_at, 'draft', coalesce(p_hot,false), v_hash, v_style,
    p_thumb_url, coalesce(p_supporting_images, '{}'::text[])
  ) RETURNING id INTO v_id;

  INSERT INTO public.competition_secrets(competition_id, seed) VALUES (v_id, v_seed);

  INSERT INTO public.skill_questions(competition_id, question_text, option_a, option_b, option_c, option_d, correct_option)
    VALUES (v_id, p_question, p_option_a, p_option_b, p_option_c, p_option_d, p_correct_option);

  INSERT INTO public.tickets (competition_id, number, status)
    SELECT v_id, g, 'available' FROM generate_series(1, p_total_tickets) g;

  IF coalesce(p_status,'live') <> 'draft' THEN
    UPDATE public.competitions SET status = p_status WHERE id = v_id;
  END IF;

  RETURN v_id;
END $function$;