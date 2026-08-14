update public.client_errors
set resolved = true
where resolved = false
  and (message ilike '%hydrat%' or message ilike '%terry-cutout%' or stack ilike '%terry-cutout%');