alter table public.orders add column if not exists client_order_id uuid;
create unique index if not exists orders_client_order_id_key on public.orders (client_order_id) where client_order_id is not null;

alter table public.restaurant_settings
  add column if not exists kitchen_print_enabled boolean not null default false,
  add column if not exists receipt_print_enabled boolean not null default true,
  add column if not exists thermal_paper_width text not null default '80' check (thermal_paper_width in ('80', '58')),
  add column if not exists electronic_invoicing_status text not null default 'coming_soon' check (electronic_invoicing_status in ('coming_soon', 'setup', 'active'));

create or replace function public.create_order_idempotent(p_client_order_id uuid, p_order jsonb, p_items jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_order_id uuid;
begin
  select id into v_order_id from public.orders where client_order_id = p_client_order_id;
  if v_order_id is not null then return v_order_id; end if;
  insert into public.orders (client_order_id, brand_id, location_id, status, origin, fulfillment_type, table_id, total_amount, service_fee, customer_name, customer_phone, customer_id, scheduled_time, payment_status, payment_method)
  values (p_client_order_id, (p_order->>'brand_id')::uuid, nullif(p_order->>'location_id', '')::uuid, coalesce(p_order->>'status', 'new'), p_order->>'origin', p_order->>'fulfillment_type', nullif(p_order->>'table_id', '')::uuid, coalesce((p_order->>'total_amount')::numeric, 0), coalesce((p_order->>'service_fee')::numeric, 0), p_order->>'customer_name', p_order->>'customer_phone', nullif(p_order->>'customer_id', '')::uuid, nullif(p_order->>'scheduled_time', '')::timestamptz, coalesce(p_order->>'payment_status', 'pending'), p_order->>'payment_method')
  returning id into v_order_id;
  insert into public.order_items (order_id, product_id, brand_id, quantity, unit_price, modifiers, notes)
  select v_order_id, (item->>'product_id')::uuid, (item->>'brand_id')::uuid, coalesce((item->>'quantity')::integer, 1), coalesce((item->>'unit_price')::numeric, 0), coalesce(item->'modifiers', '{}'::jsonb), coalesce(item->>'notes', '')
  from jsonb_array_elements(p_items) as item;
  return v_order_id;
exception when unique_violation then
  select id into v_order_id from public.orders where client_order_id = p_client_order_id;
  return v_order_id;
end;
$$;

grant execute on function public.create_order_idempotent(uuid, jsonb, jsonb) to anon, authenticated;
