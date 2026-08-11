ALTER FUNCTION public.draw_competition(uuid, text) SET search_path = public, extensions;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.competitions
            WHERE is_demo AND status = 'live' AND ends_at <= now() ORDER BY ends_at
  LOOP
    BEGIN
      PERFORM public.draw_competition(r.id, 'example competition — real draw pipeline');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'skipped %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;