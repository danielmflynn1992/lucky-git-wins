delete from public.draw_notifications where draw_id in (select id from public.draws where competition_id='5980dda1-3b03-489b-a96a-fd356e0512bc');
delete from public.draws where competition_id='5980dda1-3b03-489b-a96a-fd356e0512bc';
delete from public.entry_answers where competition_id='5980dda1-3b03-489b-a96a-fd356e0512bc';
delete from public.tickets where competition_id='5980dda1-3b03-489b-a96a-fd356e0512bc';
delete from public.competition_secrets where competition_id='5980dda1-3b03-489b-a96a-fd356e0512bc';
delete from public.competitions where id='5980dda1-3b03-489b-a96a-fd356e0512bc';