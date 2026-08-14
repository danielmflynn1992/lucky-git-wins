update public.question_bank
set is_active = false, updated_at = now()
where is_active
  and question_text ~* '^What is [0-9]+ ?(x|×|\*|/|÷|\+|-|−|divided by) ?[0-9]+\?$';