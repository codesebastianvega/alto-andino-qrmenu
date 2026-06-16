update public.staff
set access_all_locations = true
where role = 'admin'
  and name = 'Admin Principal'
  and coalesce(access_all_locations, false) = false;
