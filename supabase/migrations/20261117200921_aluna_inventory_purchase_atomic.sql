-- H10. Source preparation only: no subscription changes and no automatic deployment.
-- Service-role only; the authenticated Edge Function validates the caller first.
create or replace function public.aluna_inventory_purchase_ready()
returns text language sql stable security invoker set search_path = ''
as $$ select 'aluna-inventory-v2'::text $$;
revoke all on function public.aluna_inventory_purchase_ready() from public, anon, authenticated;
grant execute on function public.aluna_inventory_purchase_ready() to service_role;

create or replace function public.aluna_register_inventory_purchase(
  p_brand_id uuid, p_location_id uuid, p_actor_id uuid,
  p_idempotency_key uuid, p_entry jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  b public.brands%rowtype;
  p public.plans%rowtype;
  ing public.ingredients%rowtype;
  loc_stock public.location_inventory%rowtype;
  previous public.agent_actions%rowtype;
  included boolean;
  qty numeric; total numeric; added numeric; cost numeric;
  source_unit text; factor_from numeric; factor_to numeric;
  change_id uuid; action_id uuid; receipt jsonb;
begin
  if p_actor_id is null or p_brand_id is null or p_idempotency_key is null then
    raise exception 'INVALID_PURCHASE';
  end if;
  -- Serialize retries of one purchase before acquiring stock locks.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key::text, 0));
  select * into b from public.brands where id = p_brand_id for share;
  if not found or b.is_active is false then raise exception 'BRAND_UNAVAILABLE'; end if;
  if b.owner_id is distinct from p_actor_id and not exists (
    select 1 from public.profiles where id = p_actor_id and
      (role = 'superadmin' or (brand_id = p_brand_id and role in ('owner','admin','manager','encargado')))
  ) then raise exception 'FORBIDDEN'; end if;

  select * into p from public.plans where id = b.plan_id for share;
  select is_included into included from public.plan_features where plan_id = b.plan_id and feature_key = 'inventory';
  if not coalesce(p.is_custom_pricing, false) and (
    p.slug is null or p.slug not in ('profesional','premium','enterprise') or
    not (coalesce(included, true) or coalesce((not coalesce(b.payment_verified, false) and
      b.subscription_status in ('trial','trialing') and b.trial_end_date > now()), false))
  ) then raise exception 'INVENTORY_NOT_INCLUDED'; end if;

  if p_location_id is not null then
    perform 1 from public.locations where id = p_location_id and brand_id = p_brand_id and is_active is true for share;
    if not found then raise exception 'LOCATION_FORBIDDEN'; end if;
  end if;
  select * into previous from public.agent_actions where idempotency_key = p_idempotency_key;
  if found then
    if previous.brand_id is distinct from p_brand_id or previous.location_id is distinct from p_location_id
      or previous.tool_name <> 'batch_stock_entry' or previous.proposed_data is distinct from p_entry
      or previous.status <> 'completed' then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return previous.result_data || jsonb_build_object('replayed', true);
  end if;
  if jsonb_typeof(p_entry) <> 'object' or not (p_entry ?& array['ingredient_id','purchase_quantity','purchase_unit','total_cost','expected_stock','expected_location_stock'])
    or exists (select 1 from jsonb_object_keys(p_entry) k where k <> all(array['ingredient_id','purchase_quantity','purchase_unit','total_cost','expected_stock','expected_location_stock']))
    then raise exception 'INVALID_PURCHASE'; end if;
  qty := (p_entry->>'purchase_quantity')::numeric;
  total := (p_entry->>'total_cost')::numeric;
  source_unit := p_entry->>'purchase_unit';
  if qty is null or not (qty > 0 and qty <= 1000000000) or total is null or not (total > 0 and total <= 1000000000) then raise exception 'INVALID_PURCHASE'; end if;
  select * into ing from public.ingredients where id = (p_entry->>'ingredient_id')::uuid and brand_id = p_brand_id and is_active is true for update;
  if not found then raise exception 'INGREDIENT_NOT_FOUND'; end if;
  if (source_unit in ('g','kg') and ing.usage_unit in ('g','kg')) or
     (source_unit in ('ml','l') and ing.usage_unit in ('ml','l')) or
     (source_unit = 'und' and ing.usage_unit = 'und') then
    factor_from := case when source_unit in ('kg','l') then 1000 else 1 end;
    factor_to := case when ing.usage_unit in ('kg','l') then 1000 else 1 end;
  else raise exception 'INCOMPATIBLE_UNIT'; end if;
  added := qty * factor_from / factor_to;
  if not (added > 0 and added <= 1000000) then raise exception 'INVALID_PURCHASE'; end if;
  cost := total / added;
  if (p_entry->>'expected_stock')::numeric is distinct from coalesce(ing.stock_current,0) then raise exception 'STOCK_CHANGED'; end if;
  if p_location_id is not null then
    select * into loc_stock from public.location_inventory where location_id = p_location_id and ingredient_id = ing.id for update;
    if not found then raise exception 'LOCATION_INVENTORY_NOT_LINKED'; end if;
    if (p_entry->>'expected_location_stock')::numeric is distinct from loc_stock.stock_quantity then raise exception 'STOCK_CHANGED'; end if;
  elsif p_entry->>'expected_location_stock' is not null then raise exception 'INVALID_PURCHASE'; end if;

  insert into public.agent_change_sets(brand_id,location_id,created_by,approved_by,approved_at,title,summary,status,risk_level,proposed_actions,approval_snapshot,executed_at)
    values(p_brand_id,p_location_id,p_actor_id,p_actor_id,now(),'Compra de ' || ing.name,'Cantidad y costo confirmados por el usuario','completed','medium',jsonb_build_array(p_entry),jsonb_build_object('approved',true,'entry',p_entry),now()) returning id into change_id;
  update public.ingredients set stock_current = coalesce(stock_current,0) + added, unit_cost = cost, updated_at = now() where id = ing.id;
  if p_location_id is not null then
    update public.location_inventory set stock_quantity = stock_quantity + added, updated_at = now() where id = loc_stock.id;
  end if;
  receipt := jsonb_build_object('success',true,'change_set_id',change_id,
    'updated_ingredients',jsonb_build_array(jsonb_build_object('id',ing.id,'name',ing.name,'usage_unit',ing.usage_unit,'stock_current',coalesce(ing.stock_current,0)+added,'unit_cost',cost)),
    'purchase',p_entry,'before_stock',coalesce(ing.stock_current,0),'added',added,
    'location_id',p_location_id,'location_stock',case when p_location_id is null then null else loc_stock.stock_quantity + added end);
  insert into public.agent_actions(change_set_id,brand_id,location_id,sequence,tool_name,entity_type,entity_id,operation,status,idempotency_key,before_data,proposed_data,result_data,executed_at)
    values(change_id,p_brand_id,p_location_id,1,'batch_stock_entry','ingredients',ing.id,'update','completed',p_idempotency_key,
      jsonb_build_object('stock',ing.stock_current,'unit_cost',ing.unit_cost,'location_stock',loc_stock.stock_quantity),p_entry,receipt,now()) returning id into action_id;
  insert into public.agent_audit_log(brand_id,location_id,change_set_id,action_id,actor_id,event_type,event_data)
    values(p_brand_id,p_location_id,change_id,action_id,p_actor_id,'approved',jsonb_build_object('entry',p_entry)),
          (p_brand_id,p_location_id,change_id,action_id,p_actor_id,'action_completed',receipt);
  -- Any failure above rolls back stock, costs, and the entire audit receipt together.
  return receipt;
end;
$$;
revoke all on function public.aluna_register_inventory_purchase(uuid,uuid,uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.aluna_register_inventory_purchase(uuid,uuid,uuid,uuid,jsonb) to service_role;
