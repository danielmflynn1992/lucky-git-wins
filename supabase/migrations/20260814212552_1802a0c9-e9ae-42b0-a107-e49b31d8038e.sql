-- Retire every single-step question: one-operation arithmetic, counting
-- general knowledge, and the legacy multiple-choice set.
update public.question_bank
set is_active = false, updated_at = now()
where category in ('general', 'legacy')
   or (category = 'arithmetic' and question_text ~* '^What is [0-9]+ ?([-+x×*/÷]|divided by) ?[0-9]+\?$');

-- Activate the multi-step families.
update public.question_bank
set is_active = true, updated_at = now()
where category in ('sequence', 'time', 'word')
   or (category = 'arithmetic' and is_active = false);

insert into public.question_bank (question_text, answer_format, correct_answer, category, is_active) values
('What is (14 × 6) − (45 ÷ 9)?', 'integer', 79, 'arithmetic', true),
('What is 25% of 480, plus 63?', 'integer', 183, 'arithmetic', true),
('Add 96, 48 and 108, then halve the total.', 'integer', 126, 'arithmetic', true),
('What is (17 × 5) + (13 × 4)?', 'integer', 137, 'arithmetic', true),
('Take 12% of 250, then multiply by 4.', 'integer', 120, 'arithmetic', true),
('What is 720 ÷ 9, minus 3 × 12?', 'integer', 44, 'arithmetic', true),
('What is (33 + 27) × 3, minus 45?', 'integer', 135, 'arithmetic', true),
('What is the next number in this sequence: 3, 7, 15, 31, ...?', 'integer', 63, 'sequence', true),
('What is the next number in this sequence: 2, 6, 18, 54, ...?', 'integer', 162, 'sequence', true),
('What comes next in this sequence: 100, 91, 83, 76, 70, ...?', 'integer', 65, 'sequence', true),
('What is the next number in this sequence: 1, 4, 9, 16, 25, ...?', 'integer', 36, 'sequence', true),
('Eight friends split a £312 bill equally, then each adds a £6 tip. How many pounds does each pay?', 'integer', 45, 'word', true),
('A crate holds 18 bottles. A pub orders 14 crates, then returns 22 bottles. How many bottles does it keep?', 'integer', 230, 'word', true),
('You buy 3 shirts at £24 each and get £15 off the total. How many pounds do you pay?', 'integer', 57, 'word', true),
('A coach seats 53. Four coaches are booked and 17 seats stay empty. How many people travel?', 'integer', 195, 'word', true),
('A train leaves at 08:50 and the journey takes 3 hours 25 minutes. What time does it arrive? (24-hour, no colon)', 'time_24h', 1215, 'time', true),
('How many minutes are there between 14:40 and 18:15?', 'integer', 215, 'time', true);