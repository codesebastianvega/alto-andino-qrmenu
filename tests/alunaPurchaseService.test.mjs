import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inventoryCapability, INVENTORY_CONTRACT } from '../supabase/functions/_shared/alunaInventoryRules.js';
import { beginPurchaseTurn, buildPurchaseBody } from '../src/utils/alunaPurchase.js';

const source = (await readFile(new URL('../src/services/alunaCopilot.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
function service({ slug = 'premium', ready = true, owner = true, badReceipt = false } = {}) {
  const calls = [];
  const supabase = {
    auth: { async getUser() { return { data: { user: { id: 'actor' } } }; } },
    from(table) {
      const entry = { table, filters: [] };
      const query = { select() { return query; }, eq(key, value) { entry.filters.push([key, value]); return query; }, in(key, value) { entry.filters.push([key, value]); return query; }, single() { return query; }, then(resolve) {
        calls.push(entry);
        const data = table === 'brands' ? { id: 'brand', owner_id: owner ? 'actor' : 'other', is_active: true, plans: { id: 'plan', slug, name: slug } }
          : table === 'plan_features' ? [{ feature_key: 'inventory', is_included: true }]
          : table === 'profiles' ? { brand_id: 'other', role: 'owner' }
          : table === 'locations' ? [{ id: 'site', name: 'Principal' }]
          : table === 'ingredients' ? [{ id: 'coffee', name: 'Café molido', usage_unit: 'g', stock_current: 500 }]
          : [{ location_id: 'site', ingredient_id: 'coffee', stock_quantity: 100 }];
        return Promise.resolve({ data, error: null }).then(resolve);
      } };
      return query;
    },
    functions: { async invoke(name, options) {
      calls.push({ name, options });
      return options.method === 'GET' ? { data: { contract: INVENTORY_CONTRACT, ready }, error: null }
        : { data: { success: true, updated_ingredients: [{ id: 'coffee', stock_current: badReceipt ? 500 : 1500, unit_cost: 40 }] }, error: null };
    } },
  };
  const api = new Function('supabase', 'inventoryCapability', 'INVENTORY_CONTRACT', 'buildPurchaseBody', `${source}\nreturn { loadAlunaPurchaseContext, executeAlunaPurchase };`)(supabase, inventoryCapability, INVENTORY_CONTRACT, buildPurchaseBody);
  return { ...api, calls };
}
test('servicio: consulta plan real antes de leer inventario o ofrecer ejecución', async () => {
  const api = service({ slug: 'esencial' });
  assert.equal((await api.loadAlunaPurchaseContext('brand')).capability.allowed, false);
  assert.deepEqual(api.calls.map((call) => call.table), ['brands', 'plan_features']);
});
test('servicio: propietario ajeno o ejecutor ausente no consultan stock ni envían escrituras', async () => {
  for (const config of [{ owner: false }, { ready: false }]) {
    const api = service(config);
    const context = await api.loadAlunaPurchaseContext('brand');
    assert.equal(context.executorReady, false);
    assert.equal(api.calls.some((call) => call.table === 'ingredients' || call.options?.body), false);
  }
});
test('servicio: confirma persistencia devuelta, mantiene clave y filtra por negocio/sedes', async () => {
  const api = service();
  const context = await api.loadAlunaPurchaseContext('brand');
  const task = beginPurchaseTurn({ message: 'Compré un kilo de café molido por $40.000', ...context, selectedLocationId: 'site', scope: 'brand:site', turnId: 'turn' });
  await api.executeAlunaPurchase(task, 'brand');
  assert.equal(api.calls.find((call) => call.options?.body).options.body.idempotency_key, task.idempotencyKey);
  assert.ok(api.calls.filter((call) => ['ingredients', 'locations'].includes(call.table)).every((call) => call.filters.some(([key, value]) => key === 'brand_id' && value === 'brand')));
  assert.deepEqual(api.calls.find((call) => call.table === 'location_inventory').filters, [['location_id', ['site']]]);
  await assert.rejects(service({ ready: false }).executeAlunaPurchase(task, 'brand'), /no está disponible/);
  await assert.rejects(service({ badReceipt: true }).executeAlunaPurchase(task, 'brand'), /No pude confirmar/);
});
