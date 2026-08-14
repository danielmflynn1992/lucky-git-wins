select set_config('request.jwt.claims', json_build_object('sub','d880a8bd-bdd7-48a3-afca-d43f842a1294','role','authenticated')::text, true);
select public.create_competition_with_tickets(
 'e2e-pre-golive-test','E2E Pre Go-Live Test','Full lifecycle rehearsal','cash',
 'https://images.unsplash.com/photo-1554672408-17d52a4b8b2f?w=1200',
 'End-to-end pre go-live test competition. Created by the automated lifecycle test to exercise creation, entry, close, draw, verification and winner notification.',
 2.00, 20, 500, 10, now() + interval '2 hours', 'live', false, 'blur', null, ARRAY[]::text[],
 (select id from public.question_bank where is_active = true order by id limit 1)
);