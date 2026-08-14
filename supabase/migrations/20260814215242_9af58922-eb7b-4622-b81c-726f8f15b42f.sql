-- Simulate what a successful payment SHOULD do for the test competition only.
update public.tickets
   set status='sold',
       owner_id='d880a8bd-bdd7-48a3-afca-d43f842a1294',
       is_qualifying = true,
       reserved_until = null
 where competition_id='5980dda1-3b03-489b-a96a-fd356e0512bc'
   and status='reserved';

-- A second, non-qualifying entrant (wrong answer) to prove the draw ignores them.
update public.tickets
   set status='sold', is_qualifying=false
 where competition_id='5980dda1-3b03-489b-a96a-fd356e0512bc'
   and status='available' and number between 15 and 20;