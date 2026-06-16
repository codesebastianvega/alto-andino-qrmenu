-- Deleting a user/profile must not delete a whole business.
-- Business closure should be handled explicitly through archive/suspend flows.
alter table public.brands
  drop constraint if exists brands_owner_id_fkey,
  add constraint brands_owner_id_fkey
    foreign key (owner_id) references public.profiles(id) on delete set null;
