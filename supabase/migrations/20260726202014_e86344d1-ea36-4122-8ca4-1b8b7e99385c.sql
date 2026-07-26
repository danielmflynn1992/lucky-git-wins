ALTER TABLE public.draws
  ADD COLUMN IF NOT EXISTS winner_photo_url text,
  ADD COLUMN IF NOT EXISTS photo_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS winner_quote text;