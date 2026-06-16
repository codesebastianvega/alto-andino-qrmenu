create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'superadmin'
  );
$$;

drop policy if exists "secure_superadmin_manage_profiles" on public.profiles;
create policy "secure_superadmin_manage_profiles"
  on public.profiles
  for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());
