CREATE OR REPLACE FUNCTION public.competition_sold_counts()
RETURNS TABLE (competition_id uuid, sold integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, count(t.*) FILTER (WHERE t.status = 'sold')::int
    FROM public.competitions c
    LEFT JOIN public.tickets t ON t.competition_id = c.id
   GROUP BY c.id;
$$;

REVOKE EXECUTE ON FUNCTION public.competition_sold_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.competition_sold_counts() TO anon, authenticated, service_role;