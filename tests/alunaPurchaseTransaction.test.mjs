// Optional isolated PostgreSQL: ALUNA_TEST_PGLITE points to a temporary npm prefix.
// Never connects to Supabase. Uses the actual migration against a minimal schema.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const prefix = process.env.ALUNA_TEST_PGLITE;
const brand = '11111111-1111-4111-8111-111111111111';
const actor = '22222222-2222-4222-8222-222222222222';
const ingredient = '33333333-3333-4333-8333-333333333333';
const location = '44444444-4444-4444-8444-444444444444';
const plan = '55555555-5555-4555-8555-555555555555';

test('H10: transacción real aislada, reintentos, permisos y rollback', { skip: !prefix }, async (t) => {
  const require = createRequire(`${prefix}/package.json`);
  const { PGlite } = require('@electric-sql/pglite');
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create table brands(id uuid primary key, plan_id uuid, owner_id uuid, is_active boolean, payment_verified boolean, subscription_status text, trial_end_date timestamptz);
      create table plans(id uuid primary key, slug text, is_custom_pricing boolean);
      create table plan_features(plan_id uuid, feature_key text, is_included boolean);
      create table profiles(id uuid primary key, brand_id uuid, role text);
      create table ingredients(id uuid primary key, brand_id uuid, name text, is_active boolean, usage_unit text, stock_current numeric, unit_cost numeric, updated_at timestamptz);
      create table locations(id uuid primary key, brand_id uuid, is_active boolean);
      create table location_inventory(id uuid primary key default gen_random_uuid(),location_id uuid,ingredient_id uuid,stock_quantity numeric,updated_at timestamptz);
      create table agent_change_sets(id uuid primary key default gen_random_uuid(),brand_id uuid,location_id uuid,created_by uuid,approved_by uuid,approved_at timestamptz,title text,summary text,status text,risk_level text,proposed_actions jsonb,approval_snapshot jsonb,executed_at timestamptz,updated_at timestamptz default now());
      create table agent_actions(id uuid primary key default gen_random_uuid(),change_set_id uuid,brand_id uuid,location_id uuid,sequence int,tool_name text,entity_type text,entity_id uuid,operation text,status text,idempotency_key uuid unique,before_data jsonb,proposed_data jsonb,result_data jsonb,executed_at timestamptz,updated_at timestamptz default now());
      create table agent_audit_log(brand_id uuid,location_id uuid,change_set_id uuid,action_id uuid,actor_id uuid,event_type text,event_data jsonb);
      insert into plans values('${plan}','premium',false);
      insert into brands values('${brand}','${plan}','${actor}',true,true,'trialing','2026-08-18');
      insert into plan_features values('${plan}','inventory',true);
      insert into ingredients values('${ingredient}','${brand}','Café molido',true,'g',500,30,now());
      insert into locations values('${location}','${brand}',true);
      insert into location_inventory(location_id,ingredient_id,stock_quantity) values('${location}','${ingredient}',100);
    `);
    const migration = await readFile(new URL('../supabase/migrations/20261117200921_aluna_inventory_purchase_atomic.sql', import.meta.url), 'utf8');
    const existingData = await db.query('select row_to_json(i) as ingredient from ingredients i');
    const existingLocationData = await db.query('select row_to_json(i) as inventory from location_inventory i');
    await db.exec(migration);
    await t.test('instalar y reaplicar la migración no cambia inventario existente', async () => {
      await db.exec(migration);
      assert.deepEqual((await db.query('select row_to_json(i) as ingredient from ingredients i')).rows, existingData.rows);
      assert.deepEqual((await db.query('select row_to_json(i) as inventory from location_inventory i')).rows, existingLocationData.rows);
      assert.equal((await db.query('select count(*)::int as count from agent_actions')).rows[0].count, 0);
    });
    const entry = { ingredient_id: ingredient, purchase_quantity: 1, purchase_unit: 'kg', total_cost: 40000, expected_stock: 500, expected_location_stock: 100 };
    const buy = (key, payload = entry, site = location, who = actor) => db.query('select aluna_register_inventory_purchase($1,$2,$3,$4,$5) as result', [brand, site, who, key, JSON.stringify(payload)]);
    const snapshot = async () => (await db.query(`select stock_current::text as stock,unit_cost::text as cost,(select stock_quantity::text from location_inventory limit 1) as site,(select count(*)::int from agent_actions) as actions,(select count(*)::int from agent_audit_log) as audit from ingredients where id='${ingredient}'`)).rows[0];
    await t.test('solo service_role puede ejecutar y readiness confirma el contrato', async () => {
      const result = await db.query("select has_function_privilege('anon','aluna_register_inventory_purchase(uuid,uuid,uuid,uuid,jsonb)','execute') as anon,has_function_privilege('authenticated','aluna_register_inventory_purchase(uuid,uuid,uuid,uuid,jsonb)','execute') as authenticated,has_function_privilege('service_role','aluna_register_inventory_purchase(uuid,uuid,uuid,uuid,jsonb)','execute') as service,aluna_inventory_purchase_ready() as contract");
      assert.deepEqual(result.rows[0], { anon: false, authenticated: false, service: true, contract: 'aluna-inventory-v2' });
    });
    await t.test('compra suma 1.000 g, registra COP 40/g y repetir no duplica', async () => {
      const key = crypto.randomUUID();
      const first = (await buy(key)).rows[0].result;
      assert.equal(first.success, true);
      assert.equal(first.updated_ingredients[0].stock_current, 1500);
      assert.equal(first.updated_ingredients[0].unit_cost, 40);
      const saved = await snapshot();
      assert.equal(Number(saved.site), 1100);
      assert.equal(saved.actions, 1);
      assert.equal(saved.audit, 2);
      const replay = (await buy(key)).rows[0].result;
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.updated_ingredients, first.updated_ingredients);
      assert.deepEqual(await snapshot(), saved);
      await assert.rejects(buy(key, { ...entry, total_cost: 50000 }), /IDEMPOTENCY_CONFLICT/);
      assert.deepEqual(await snapshot(), saved);
    });
    await t.test('stock cambiado invalida el diff y no crea trazas parciales', async () => {
      const saved = await snapshot();
      await assert.rejects(buy(crypto.randomUUID()), /STOCK_CHANGED/);
      assert.deepEqual(await snapshot(), saved);
    });
    await t.test('Esencial, actor ajeno y sede ajena no modifican inventario', async () => {
      const saved = await snapshot();
      await db.exec(`update plans set slug='esencial' where id='${plan}'`);
      await assert.rejects(buy(crypto.randomUUID()), /INVENTORY_NOT_INCLUDED/);
      await db.exec(`update plans set slug='premium' where id='${plan}'`);
      await assert.rejects(buy(crypto.randomUUID(), entry, location, crypto.randomUUID()), /FORBIDDEN/);
      await assert.rejects(buy(crypto.randomUUID(), entry, crypto.randomUUID()), /LOCATION_FORBIDDEN/);
      assert.deepEqual(await snapshot(), saved);
    });
    await t.test('Premium con inventario deshabilitado y prueba sin fechas no recibe permisos por valores nulos', async () => {
      const saved = await snapshot();
      await db.exec(`update plan_features set is_included=false; update brands set payment_verified=false,subscription_status=null,trial_end_date=null where id='${brand}'`);
      await assert.rejects(buy(crypto.randomUUID(), { ...entry, expected_stock: 1500, expected_location_stock: 1100 }), /INVENTORY_NOT_INCLUDED/);
      assert.deepEqual(await snapshot(), saved);
      await db.exec(`update plan_features set is_included=true; update brands set payment_verified=true,subscription_status='trialing' where id='${brand}'`);
    });
    await t.test('un insumo y una sede existentes de otro negocio permanecen intactos', async () => {
      const otherBrand = '66666666-6666-4666-8666-666666666666';
      const otherIngredient = '77777777-7777-4777-8777-777777777777';
      const otherSite = '88888888-8888-4888-8888-888888888888';
      await db.exec(`insert into ingredients values('${otherIngredient}','${otherBrand}','Ajeno',true,'g',999,25,now()); insert into locations values('${otherSite}','${otherBrand}',true); insert into location_inventory(location_id,ingredient_id,stock_quantity) values('${otherSite}','${otherIngredient}',999);`);
      const saved = await snapshot();
      await assert.rejects(buy(crypto.randomUUID(), { ...entry, ingredient_id: otherIngredient }), /INGREDIENT_NOT_FOUND/);
      await assert.rejects(buy(crypto.randomUUID(), entry, otherSite), /LOCATION_FORBIDDEN/);
      assert.equal((await db.query('select stock_current::int as stock from ingredients where id=$1', [otherIngredient])).rows[0].stock, 999);
      assert.equal((await db.query('select stock_quantity::int as stock from location_inventory where ingredient_id=$1', [otherIngredient])).rows[0].stock, 999);
      assert.deepEqual(await snapshot(), saved);
    });
    await t.test('un fallo al guardar auditoría revierte stock, costo y comprobantes', async () => {
      const saved = await snapshot();
      await db.exec("create function fail_audit() returns trigger language plpgsql as $$ begin raise exception 'SIMULATED_AUDIT_FAILURE'; end $$; create trigger fail_audit before insert on agent_audit_log for each row execute function fail_audit();");
      const next = { ...entry, expected_stock: 1500, expected_location_stock: 1100 };
      await assert.rejects(buy(crypto.randomUUID(), next), /SIMULATED_AUDIT_FAILURE/);
      assert.deepEqual(await snapshot(), saved);
      await db.exec('drop trigger fail_audit on agent_audit_log');
    });
    await t.test('sin sede explícita solo modifica inventario general', async () => {
      const result = (await buy(crypto.randomUUID(), { ...entry, expected_stock: 1500, expected_location_stock: null }, null)).rows[0].result;
      assert.equal(result.updated_ingredients[0].stock_current, 2500);
      assert.equal(Number((await snapshot()).site), 1100);
    });
    await t.test('limpieza preparada revierte solo la prueba aislada, deja auditoría y rechaza cambios posteriores', async () => {
      const testBrand = 'a63da806-a62a-49b9-a833-07e0976785ad';
      const testSite = '48be7326-6355-481b-b334-b7edc4b82e6f';
      const testIngredient = crypto.randomUUID();
      const testKey = crypto.randomUUID();
      await db.exec(`insert into brands values('${testBrand}','${plan}','${actor}',true,true,'active',null); insert into locations values('${testSite}','${testBrand}',true); insert into ingredients values('${testIngredient}','${testBrand}','H10-20261118-Cafe-molido-TEST',true,'g',0,0,now()); insert into location_inventory(location_id,ingredient_id,stock_quantity) values('${testSite}','${testIngredient}',0);`);
      await db.query('select aluna_register_inventory_purchase($1,$2,$3,$4,$5)', [testBrand, testSite, actor, testKey, JSON.stringify({ ...entry, ingredient_id: testIngredient, expected_stock: 0, expected_location_stock: 0 })]);
      const cleanup = (await readFile(new URL('../docs/deployment/H10/cleanup-test.sql', import.meta.url), 'utf8')).replace('00000000-0000-4000-8000-000000000000', testKey).replace('00000000-0000-4000-8000-000000000000', testIngredient);
      await db.query('update ingredients set stock_current=1001 where id=$1', [testIngredient]);
      await assert.rejects(db.exec(cleanup), /Test ingredient changed/);
      await db.exec('rollback');
      assert.equal((await db.query('select stock_current::int as stock from ingredients where id=$1', [testIngredient])).rows[0].stock, 1001);
      await db.query('update ingredients set stock_current=1000 where id=$1', [testIngredient]);
      const primaryBefore = await snapshot();
      await db.exec(cleanup);
      assert.deepEqual((await db.query('select stock_current::int as stock,unit_cost::int as cost,is_active from ingredients where id=$1', [testIngredient])).rows[0], { stock: 0, cost: 0, is_active: false });
      assert.equal((await db.query('select status from agent_actions where idempotency_key=$1', [testKey])).rows[0].status, 'reverted');
      assert.equal((await db.query("select count(*)::int as count from agent_audit_log where brand_id=$1 and event_type='reverted'", [testBrand])).rows[0].count, 1);
      await db.exec(cleanup);
      assert.equal((await db.query("select count(*)::int as count from agent_audit_log where brand_id=$1 and event_type='reverted'", [testBrand])).rows[0].count, 1);
      // The primary fixture ingredient's stock and cost are untouched by cleanup.
      const primaryAfter = await snapshot();
      assert.equal(primaryAfter.stock, primaryBefore.stock);
      assert.equal(primaryAfter.cost, primaryBefore.cost);
      assert.equal(primaryAfter.site, primaryBefore.site);
    });
  } finally { await db.close(); }
});
