
CREATE TABLE public.draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  competition_title text NOT NULL,
  prize text NOT NULL,
  winning_number integer NOT NULL,
  winner_display_name text NOT NULL,
  winner_town text NOT NULL DEFAULT '',
  total_tickets integer NOT NULL,
  draw_method text NOT NULL DEFAULT 'automatic',
  verification_hash text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  drawn_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.draws TO anon, authenticated;
GRANT ALL ON public.draws TO service_role;

ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read draws" ON public.draws
  FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX draws_drawn_at_idx ON public.draws (drawn_at DESC);

INSERT INTO public.draws (competition_title, prize, winning_number, winner_display_name, winner_town, total_tickets, draw_method, verification_hash, drawn_at) VALUES
('Range Rover Sport SV', '2024 Range Rover Sport SV + £5,000 cash', 1472, 'James P.', 'Manchester', 2500, 'automatic-rng', 'sha256:9f2c1a8e3b7d4f6a2c5e8b1d9a4f7c3e', now() - interval '3 days'),
('£25,000 Tax-Free Cash', '£25,000 cash', 384, 'Sarah K.', 'Leeds', 1000, 'automatic-rng', 'sha256:4a7b2c9e1d8f3a6b5c4e7d2a9f1b8c3e', now() - interval '10 days'),
('Rolex Submariner + £2k', 'Rolex Submariner Date + £2,000 cash', 217, 'Daniel M.', 'Bristol', 750, 'automatic-rng', 'sha256:8c3e1a5b9d2f4c7e6a1b8d3f5c9e2a4b', now() - interval '18 days');
