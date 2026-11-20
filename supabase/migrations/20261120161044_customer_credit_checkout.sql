-- The allowlist is private: public callers can only check one brand/phone pair.
create table private.customer_credit_permissions (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table private.customer_credit_permissions enable row level security;
revoke all on private.customer_credit_permissions from public, anon, authenticated;

create function private.checkout_credit_customer(p_brand_id uuid, p_phone text)
returns uuid language sql stable security definer set search_path = '' as $$
  select c.id from public.customers c
  join private.customer_credit_permissions a on a.customer_id = c.id and a.enabled
  where c.brand_id = p_brand_id
    and regexp_replace(c.phone, '[^0-9]', '', 'g') in (
      regexp_replace(p_phone, '[^0-9]', '', 'g'),
      '57' || regexp_replace(p_phone, '[^0-9]', '', 'g')
    )
    and length(regexp_replace(p_phone, '[^0-9]', '', 'g')) = 10
  limit 1
$$;
revoke all on function private.checkout_credit_customer(uuid,text) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.checkout_credit_customer(uuid,text) to anon, authenticated;

create function public.checkout_customer_credit_enabled(p_brand_id uuid, p_phone text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.checkout_credit_customer(p_brand_id, p_phone) is not null
$$;
revoke all on function public.checkout_customer_credit_enabled(uuid,text) from public;
grant execute on function public.checkout_customer_credit_enabled(uuid,text) to anon, authenticated;

create function private.enforce_checkout_customer_credit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare allowed_customer uuid;
begin
  if lower(btrim(coalesce(new.payment_method, ''))) <> 'fiado' then return new; end if;
  -- Staff retain the existing ability to record credit sales in POS.
  if auth.role() = 'service_role' or public.is_brand_manager(new.brand_id) then return new; end if;
  allowed_customer := private.checkout_credit_customer(new.brand_id,
    case when length(regexp_replace(new.customer_phone, '[^0-9]', '', 'g')) = 12
      and left(regexp_replace(new.customer_phone, '[^0-9]', '', 'g'), 2) = '57'
      then substring(regexp_replace(new.customer_phone, '[^0-9]', '', 'g') from 3)
      else new.customer_phone end);
  if allowed_customer is null then
    raise exception 'Fiado no está autorizado para este cliente.' using errcode = '42501';
  end if;
  new.customer_id := allowed_customer;
  if tg_op = 'INSERT' then
    new.payment_status := 'pending';
    new.paid_amount := 0;
  end if;
  return new;
end
$$;
revoke all on function private.enforce_checkout_customer_credit() from public, anon, authenticated;
create trigger enforce_checkout_customer_credit
before insert or update of payment_method, customer_phone, brand_id, customer_id on public.orders
for each row execute function private.enforce_checkout_customer_credit();
