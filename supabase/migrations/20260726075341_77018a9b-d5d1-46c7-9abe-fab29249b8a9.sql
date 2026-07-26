
DROP POLICY IF EXISTS "Admins can upload competition images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update competition images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete competition images" ON storage.objects;

CREATE POLICY "Admins can upload competition images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'competition-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update competition images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'competition-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete competition images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'competition-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
