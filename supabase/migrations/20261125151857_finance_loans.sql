-- Financing is separate from sales, expenses and the legacy JSON configuration.
create table public.finance_loans (
  id uuid primary key,
  brand_id uuid not null references public.brands(id) on delete cascade,
  location_id uuid references public.locations(id),
  kind text not null check (kind in ('loan','contribution')),
  lender text not null check (length(btrim(lender)) between 1 and 160),
  amount numeric(16,0) not null check (amount > 0),
  interest_agreed numeric(16,0) not null default 0 check (interest_agreed >= 0),
  destination text not null check (destination in ('pocket','direct_purchase')),
  account_id text,
  account_name text,
  description text not null default '',
  expense_category text not null default 'Insumos y Materia Prima',
  receipt_url text,
  received_on date not null,
  due_on date,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  request_payload jsonb not null,
  check (kind <> 'contribution' or interest_agreed = 0),
  check ((destination = 'pocket' and account_id is not null) or (destination = 'direct_purchase' and account_id is null)),
  check (due_on is null or due_on >= received_on)
);
create index finance_loans_brand_date on public.finance_loans(brand_id,received_on desc,id);
create index finance_loans_location on public.finance_loans(location_id);
create index finance_loans_creator on public.finance_loans(created_by);
create table public.finance_loan_payments (
  id uuid primary key,
  loan_id uuid not null references public.finance_loans(id),
  brand_id uuid not null references public.brands(id) on delete cascade,
  principal numeric(16,0) not null check (principal >= 0),
  interest numeric(16,0) not null check (interest >= 0),
  account_id text not null,
  account_name text not null,
  paid_on date not null,
  notes text not null default '',
  receipt_url text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  request_payload jsonb not null,
  check (principal + interest > 0)
);
create index finance_loan_payments_loan on public.finance_loan_payments(loan_id);
create index finance_loan_payments_brand on public.finance_loan_payments(brand_id);
create index finance_loan_payments_creator on public.finance_loan_payments(created_by);

create function private.can_manage_finance_loans(p_brand uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    exists (select 1 from public.brands where id=p_brand and owner_id=auth.uid())
    or exists (select 1 from public.profiles where id=auth.uid() and
      (role='superadmin' or (brand_id=p_brand and role in ('owner','manager'))))
  )
$$;
revoke all on function private.can_manage_finance_loans(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.can_manage_finance_loans(uuid) to authenticated;
alter table public.finance_loans enable row level security;
alter table public.finance_loan_payments enable row level security;
revoke all on public.finance_loans,public.finance_loan_payments from anon,authenticated;
grant select on public.finance_loans,public.finance_loan_payments to authenticated;
create policy finance_loans_admin_read on public.finance_loans for select to authenticated
using (private.can_manage_finance_loans(brand_id));
create policy finance_loan_payments_admin_read on public.finance_loan_payments for select to authenticated
using (private.can_manage_finance_loans(brand_id));

-- Validate pocket IDs against the same configuration Finance currently loads.
create function private.finance_loan_account(p_brand uuid,p_account text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare cfg jsonb; account_label text;
begin
  select c->'data' into cfg from public.restaurant_settings s,
    lateral jsonb_array_elements(coalesce(s.brand_concepts,'[]'::jsonb)) c
    where s.brand_id=p_brand and c->>'id'='financials_config'
    order by s.location_id nulls first limit 1;
  if cfg is null then select config->'financials' into cfg from public.brands where id=p_brand; end if;
  select a->>'name' into account_label from jsonb_array_elements(coalesce(cfg->'accounts','[]'::jsonb)) a
    where a->>'id'=p_account limit 1;
  if account_label is null then raise exception 'El bolsillo no existe en la configuración guardada de esta marca.'; end if;
  return account_label;
end $$;
revoke all on function private.finance_loan_account(uuid,text) from public,anon,authenticated;

create function private.record_finance_loan(p_brand uuid,p_id uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare existing public.finance_loans; account_label text; location uuid;
  amount numeric; interest numeric; received date;
begin
  if not private.can_manage_finance_loans(p_brand) then raise exception 'No autorizado para administrar préstamos.' using errcode='42501'; end if;
  if p_id is null or p_data is null then raise exception 'Solicitud incompleta.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into existing from public.finance_loans where id=p_id;
  if found then
    if existing.brand_id<>p_brand or existing.request_payload<>p_data then raise exception 'La solicitud ya fue utilizada con otros datos.'; end if;
    return existing.id;
  end if;
  amount := (p_data->>'amount')::numeric;
  interest := coalesce((p_data->>'interest_agreed')::numeric,0);
  if amount is null or amount<=0 or amount<>trunc(amount) or amount>1000000000000
    or interest<0 or interest<>trunc(interest) or interest>1000000000000 then raise exception 'Los montos deben ser pesos enteros válidos.'; end if;
  received := (p_data->>'received_on')::date;
  if received is null or received>(now() at time zone 'America/Bogota')::date then raise exception 'La fecha de recepción no puede ser futura.'; end if;
  location := nullif(p_data->>'location_id','')::uuid;
  if location is not null and not exists(select 1 from public.locations where id=location and brand_id=p_brand) then raise exception 'La sede no pertenece a esta marca.'; end if;
  if p_data->>'destination'='pocket' then account_label:=private.finance_loan_account(p_brand,p_data->>'account_id'); end if;
  insert into public.finance_loans(id,brand_id,location_id,kind,lender,amount,interest_agreed,destination,account_id,account_name,description,expense_category,receipt_url,received_on,due_on,created_by,request_payload)
  values(p_id,p_brand,location,p_data->>'kind',btrim(p_data->>'lender'),amount,interest,p_data->>'destination',
    case when p_data->>'destination'='pocket' then p_data->>'account_id' end,account_label,
    coalesce(p_data->>'description',''),coalesce(nullif(p_data->>'expense_category',''),'Insumos y Materia Prima'),
    nullif(p_data->>'receipt_url',''),received,nullif(p_data->>'due_on','')::date,auth.uid(),p_data);
  return p_id;
end $$;
revoke all on function private.record_finance_loan(uuid,uuid,jsonb) from public,anon;
grant execute on function private.record_finance_loan(uuid,uuid,jsonb) to authenticated;
create function public.record_finance_loan(p_brand uuid,p_id uuid,p_data jsonb) returns uuid
language sql security invoker set search_path = '' as $$ select private.record_finance_loan(p_brand,p_id,p_data) $$;
revoke all on function public.record_finance_loan(uuid,uuid,jsonb) from public,anon;
grant execute on function public.record_finance_loan(uuid,uuid,jsonb) to authenticated;

create function private.repay_finance_loan(p_loan uuid,p_id uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare loan public.finance_loans; existing public.finance_loan_payments;
  capital numeric; interest numeric; paid_capital numeric; paid_interest numeric; paid_date date; account_label text;
begin
  select * into loan from public.finance_loans where id=p_loan and private.can_manage_finance_loans(brand_id) for update;
  if not found or not private.can_manage_finance_loans(loan.brand_id) then raise exception 'Préstamo no disponible o no autorizado.' using errcode='42501'; end if;
  if p_id is null or p_data is null then raise exception 'Solicitud incompleta.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into existing from public.finance_loan_payments where id=p_id;
  if found then
    if existing.loan_id<>p_loan or existing.request_payload<>p_data then raise exception 'La solicitud ya fue utilizada con otros datos.'; end if;
    return existing.id;
  end if;
  if loan.kind<>'loan' then raise exception 'Los aportes no generan deuda ni admiten abonos.'; end if;
  capital:=coalesce((p_data->>'principal')::numeric,0); interest:=coalesce((p_data->>'interest')::numeric,0);
  if capital<0 or interest<0 or capital+interest<=0 or capital<>trunc(capital) or interest<>trunc(interest) then raise exception 'El abono debe tener montos enteros positivos.'; end if;
  select coalesce(sum(principal),0),coalesce(sum(p.interest),0) into paid_capital,paid_interest from public.finance_loan_payments p where loan_id=p_loan;
  if capital>loan.amount-paid_capital or interest>loan.interest_agreed-paid_interest then raise exception 'El abono supera el capital o los intereses pendientes.'; end if;
  paid_date:=(p_data->>'paid_on')::date;
  if paid_date is null or paid_date<loan.received_on or paid_date>(now() at time zone 'America/Bogota')::date then raise exception 'Revisa la fecha del abono.'; end if;
  account_label:=private.finance_loan_account(loan.brand_id,p_data->>'account_id');
  insert into public.finance_loan_payments(id,loan_id,brand_id,principal,interest,account_id,account_name,paid_on,notes,receipt_url,created_by,request_payload)
    values(p_id,p_loan,loan.brand_id,capital,interest,p_data->>'account_id',account_label,paid_date,coalesce(p_data->>'notes',''),nullif(p_data->>'receipt_url',''),auth.uid(),p_data);
  return p_id;
end $$;
revoke all on function private.repay_finance_loan(uuid,uuid,jsonb) from public,anon;
grant execute on function private.repay_finance_loan(uuid,uuid,jsonb) to authenticated;
create function public.repay_finance_loan(p_loan uuid,p_id uuid,p_data jsonb) returns uuid
language sql security invoker set search_path = '' as $$ select private.repay_finance_loan(p_loan,p_id,p_data) $$;
revoke all on function public.repay_finance_loan(uuid,uuid,jsonb) from public,anon;
grant execute on function public.repay_finance_loan(uuid,uuid,jsonb) to authenticated;
