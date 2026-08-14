create or replace function public.admin_question_performance()
returns table(
  competition_id uuid,
  competition_slug text,
  competition_title text,
  total_answers integer,
  correct_answers integer,
  incorrect_answers integer,
  pct_incorrect numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id,
         c.slug,
         c.title,
         count(a.*)::integer,
         count(*) filter (where a.is_correct)::integer,
         count(*) filter (where not a.is_correct)::integer,
         case when count(a.*) > 0
              then round(100.0 * count(*) filter (where not a.is_correct)::numeric / count(a.*)::numeric, 1)
              else 0::numeric end
  from public.competitions c
  join public.entry_answers a on a.competition_id = c.id
  where public.has_role(auth.uid(), 'admin'::app_role)
  group by c.id, c.slug, c.title
  order by c.title;
$$;

revoke all on function public.admin_question_performance() from public;
grant execute on function public.admin_question_performance() to authenticated;

drop view if exists public.question_performance;