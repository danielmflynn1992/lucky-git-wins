
ALTER TABLE public.draws
  ADD COLUMN IF NOT EXISTS draw_pool text
  GENERATED ALWAYS AS (
    CASE WHEN drew_from = 'qualifying' THEN 'qualifying' ELSE 'all' END
  ) STORED;

UPDATE public.draws
   SET total_tickets = LEAST(total_tickets, 499),
       winning_number = ((GREATEST(winning_number, 1) - 1) % 499) + 1;
