alter table public.leads
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists business_type text,
  add column if not exists plan_interest text,
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists next_follow_up_at timestamp with time zone,
  add column if not exists notes text,
  add column if not exists lost_reason text,
  add column if not exists updated_at timestamp with time zone not null default now();

create index if not exists leads_brand_id_created_at_idx
  on public.leads (brand_id, created_at desc);

create index if not exists leads_status_created_at_idx
  on public.leads (status, created_at desc);

create index if not exists leads_source_created_at_idx
  on public.leads (source, created_at desc);

drop policy if exists "secure_superadmin_manage_leads" on public.leads;
create policy "secure_superadmin_manage_leads"
  on public.leads
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'superadmin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'superadmin'
    )
  );

drop policy if exists "secure_public_create_aluna_leads" on public.leads;
create policy "secure_public_create_aluna_leads"
  on public.leads
  for insert
  to anon, authenticated
  with check (
    brand_id is null
    and coalesce(source, 'landing_page') in ('landing_page', 'contact_page', 'demo_request', 'manual', 'whatsapp')
  );
