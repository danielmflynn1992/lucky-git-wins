GRANT SELECT (id, competition_id, question_text, option_a, option_b, option_c, option_d) ON public.skill_questions TO anon, authenticated;

CREATE POLICY "public reads safe questions for live competitions"
ON public.skill_questions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.competitions
    WHERE competitions.id = skill_questions.competition_id
      AND competitions.status = 'live'
  )
);