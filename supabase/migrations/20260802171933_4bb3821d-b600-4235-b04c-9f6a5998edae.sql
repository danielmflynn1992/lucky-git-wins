ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

UPDATE public.draws SET is_demo = true WHERE competition_id IS NULL AND coalesce(seed_revealed,'') = '';

CREATE OR REPLACE FUNCTION public.real_draw_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.draws WHERE is_demo = false;
$$;

GRANT EXECUTE ON FUNCTION public.real_draw_count() TO anon, authenticated;