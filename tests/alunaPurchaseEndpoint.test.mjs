import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { inventoryCapability, INVENTORY_CONTRACT, normalizePurchase } from '../supabase/functions/_shared/alunaInventoryRules.js';

const brandId = '11111111-1111-4111-8111-111111111111';
const actorId = '22222222-2222-4222-8222-222222222222';
const ingredientId = '33333333-3333-4333-8333-333333333333';
const siteId = '44444444-4444-4444-8444-444444444444';
const source = stripTypeScriptTypes((await readFile(new URL('../supabase/functions/aluna-inventory-action/index.ts', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, ''));
function endpoint({ slug = 'premium', allowedActor = true, allowedLocation = true, allowedIngredient = true, ready = true } = {}) {
  let handler;
  const calls = [];
  const admin = {
    from(table) {
      const query = { table, filters: [] };
      const chain = { select() { return chain; }, eq(key, value) { query.filters.push([key, value]); return chain; }, maybeSingle() { return chain; }, then(resolve) {
        calls.push(query);
        const data = table === 'brands' ? { id: brandId, owner_id: allowedActor ? actorId : 'different', is_active: true, payment_verified: true, plans: { id: 'plan', slug } }
          : table === 'profiles' ? null : table === 'plan_features' ? [{ feature_key: 'inventory', is_included: true }]
          : table === 'locations' ? (allowedLocation ? { id: siteId } : null)
          : table === 'ingredients' ? (allowedIngredient ? { id: ingredientId, usage_unit: 'g' } : null) : null;
        return Promise.resolve({ data, error: null }).then(resolve);
      } };
      return chain;
    },
    async rpc(name, args) {
      calls.push({ rpc: name, args });
      return name === 'aluna_inventory_purchase_ready' ? { data: ready ? INVENTORY_CONTRACT : null, error: ready ? null : { code: 'NOT_INSTALLED' } }
        : { data: { success: true, updated_ingredients: [{ id: ingredientId, stock_current: 1500 }] }, error: null };
    },
  };
  const caller = { auth: { getUser: async () => ({ data: { user: { id: actorId } }, error: null }) } };
  new Function('serve', 'createClient', 'Deno', 'inventoryCapability', 'INVENTORY_CONTRACT', 'normalizePurchase', source)(
    (callback) => { handler = callback; }, (_url, key) => key === 'SUPABASE_SERVICE_ROLE_KEY' ? admin : caller,
    { env: { get: (key) => key } }, inventoryCapability, INVENTORY_CONTRACT, normalizePurchase);
  return { calls, invoke: (body, method = 'POST', auth = true) => handler(new Request('https://local.test', { method, headers: auth ? { Authorization: 'Bearer test' } : {}, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) })) };
}
const body = () => ({ brand_id: brandId, location_id: siteId, action: 'batch_stock_entry', approved: true, idempotency_key: crypto.randomUUID(), proposal: { entries: [{ ingredient_id: ingredientId, purchase_quantity: 1, purchase_unit: 'kg', total_cost: 40000, expected_stock: 500, expected_location_stock: 100 }] } });

test('endpoint: sin sesión, aprobación o clave estable no ejecuta', async () => {
  for (const [edit, auth, status] of [[(b) => b, false, 401], [(b) => ({ ...b, approved: false }), true, 400], [(b) => ({ ...b, idempotency_key: null }), true, 400]]) {
    const api = endpoint();
    assert.equal((await api.invoke(edit(body()), 'POST', auth)).status, status);
    assert.equal(api.calls.some((call) => call.rpc === 'aluna_register_inventory_purchase'), false);
  }
});
test('endpoint: plan, actor y sede se verifican antes de ejecutar', async () => {
  for (const config of [{ slug: 'esencial' }, { allowedActor: false }, { allowedLocation: false }]) {
    const api = endpoint(config);
    assert.equal((await api.invoke(body())).status, 403);
    assert.equal(api.calls.some((call) => call.rpc === 'aluna_register_inventory_purchase'), false);
  }
});
test('endpoint: payload estricto, unidades y stock inválidos no llegan a la transacción', async () => {
  for (const change of [(b) => ({ ...b, debug: true }), (b) => ({ ...b, location_id: 'wrong' }), (b) => ({ ...b, proposal: { entries: [{ ...b.proposal.entries[0], unit_cost: 1 }] } }), (b) => ({ ...b, proposal: { entries: [{ ...b.proposal.entries[0], purchase_unit: 'ml' }] } })]) {
    const api = endpoint();
    assert.equal((await api.invoke(change(body()))).status, 400);
    assert.equal(api.calls.some((call) => call.rpc === 'aluna_register_inventory_purchase'), false);
  }
});
test('endpoint: insumo se consulta con negocio y activo, solo RPC escribe y conserva clave', async () => {
  const api = endpoint(); const input = body();
  const result = await api.invoke(input);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).success, true);
  assert.deepEqual(api.calls.find((call) => call.table === 'ingredients').filters, [['id', ingredientId], ['brand_id', brandId], ['is_active', true]]);
  const rpc = api.calls.find((call) => call.rpc === 'aluna_register_inventory_purchase');
  assert.equal(rpc.args.p_idempotency_key, input.idempotency_key);
  assert.equal(rpc.args.p_actor_id, actorId);
  assert.deepEqual(rpc.args.p_entry, input.proposal.entries[0]);
});
test('endpoint: readiness falla cerrado si falta la migración', async () => {
  assert.deepEqual(await (await endpoint().invoke(null, 'GET')).json(), { ready: true, contract: INVENTORY_CONTRACT });
  const response = await endpoint({ ready: false }).invoke(null, 'GET');
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ready, false);
});
