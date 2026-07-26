
CREATE TABLE public.client_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL CHECK (severity IN ('error','warning','info')),
  kind text NOT NULL,
  message text NOT NULL,
  stack text,
  route text,
  user_agent text,
  viewport text,
  extra jsonb,
  fingerprint text NOT NULL,
  count int NOT NULL DEFAULT 1,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX client_errors_fingerprint_key ON public.client_errors(fingerprint);
CREATE INDEX client_errors_last_seen_idx ON public.client_errors(last_seen_at DESC);

GRANT SELECT, UPDATE ON public.client_errors TO authenticated;
GRANT ALL ON public.client_errors TO service_role;

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read client_errors" ON public.client_errors
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update client_errors" ON public.client_errors
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_client_error(
  _severity text,
  _kind text,
  _message text,
  _stack text,
  _route text,
  _user_agent text,
  _viewport text,
  _extra jsonb,
  _fingerprint text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _severity NOT IN ('error','warning','info') THEN _severity := 'error'; END IF;
  INSERT INTO public.client_errors(severity, kind, message, stack, route, user_agent, viewport, extra, fingerprint)
  VALUES (_severity, _kind, left(coalesce(_message,''), 2000), left(_stack, 8000),
          left(coalesce(_route,''), 300), left(coalesce(_user_agent,''), 400),
          left(coalesce(_viewport,''), 40), _extra, left(_fingerprint, 128))
  ON CONFLICT (fingerprint) DO UPDATE
    SET count = public.client_errors.count + 1,
        last_seen_at = now(),
        resolved = false,
        message = EXCLUDED.message,
        stack = COALESCE(EXCLUDED.stack, public.client_errors.stack),
        route = EXCLUDED.route,
        user_agent = EXCLUDED.user_agent,
        viewport = EXCLUDED.viewport,
        extra = EXCLUDED.extra;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_client_error(text,text,text,text,text,text,text,jsonb,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.unresolved_client_errors_count()
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.client_errors
    WHERE resolved = false
      AND public.has_role(auth.uid(), 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.unresolved_client_errors_count() TO authenticated;
