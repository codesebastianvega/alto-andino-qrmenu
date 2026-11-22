// Isolated UI integration: all network requests are intercepted. No real writes.
import React from 'react';
import { createRoot } from 'react-dom/client';
import AlunaCopilot from '../../src/components/admin/AlunaCopilot';
import '../../src/index.css';
import '../../src/styles.css';
import { INVENTORY_CONTRACT } from '../../supabase/functions/_shared/alunaInventoryRules';
import { supabase } from '../../src/config/supabase';

const brandId = 'a63da806-a62a-49b9-a833-07e0976785ad';
const actorId = '22222222-2222-4222-8222-222222222222';
supabase.auth.getUser = async () => ({ data: { user: { id: actorId } }, error: null });
const site = { id: '44444444-4444-4444-8444-444444444444', name: 'Sede Principal' };
const ingredient = { id: '33333333-3333-4333-8333-333333333333', name: 'Café molido', usage_unit: 'g', stock_current: 500, unit_cost: 30 };
const receipts = new Map();
let siteStock = 100;
const missing = new URLSearchParams(location.search).has('unavailable');
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const trace = (text) => { const line = document.createElement('li'); line.textContent = text; document.getElementById('purchase-events').append(line); };
window.fetch = async (input, options = {}) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.includes('/rest/v1/brands')) return reply({ id: brandId, owner_id: actorId, is_active: true, payment_verified: true, plans: { id: 'plan', slug: 'premium', name: 'Premium' } });
  if (url.includes('/rest/v1/plan_features')) return reply([{ feature_key: 'inventory', is_included: true }]);
  if (url.includes('/rest/v1/ingredients')) return reply([ingredient]);
  if (url.includes('/rest/v1/locations')) return reply([site]);
  if (url.includes('/rest/v1/location_inventory')) return reply([{ location_id: site.id, ingredient_id: ingredient.id, stock_quantity: siteStock }]);
  if (url.includes('/functions/v1/aluna-inventory-action')) {
    if (!options.body) return reply(missing ? { error: 'NOT_FOUND' } : { contract: INVENTORY_CONTRACT, ready: true }, missing ? 404 : 200);
    const body = JSON.parse(options.body);
    if (body.brand_id !== brandId || body.location_id !== site.id || body.action !== 'batch_stock_entry' || body.approved !== true || !body.idempotency_key) throw new Error('Unexpected purchase scope');
    if (receipts.has(body.idempotency_key)) return reply({ ...receipts.get(body.idempotency_key), replayed: true });
    const entry = body.proposal.entries[0];
    if (entry.ingredient_id !== ingredient.id || entry.purchase_quantity !== 1 || entry.purchase_unit !== 'kg' || entry.total_cost !== 40000 || entry.expected_stock !== ingredient.stock_current || entry.expected_location_stock !== siteStock) throw new Error('Unexpected purchase values');
    ingredient.stock_current += 1000; ingredient.unit_cost = 40; siteStock += 1000;
    const result = { success: true, updated_ingredients: [{ ...ingredient }] };
    receipts.set(body.idempotency_key, result);
    trace(`Compras simuladas: ${receipts.size}. General: ${ingredient.stock_current} g. Sede: ${siteStock} g. Costo: $${ingredient.unit_cost}/g. Otros insumos: intactos.`);
    return reply(result);
  }
  throw new Error('Network blocked in isolated purchase fixture');
};
createRoot(document.getElementById('root')).render(<>
  <main className="p-8"><h1>Simulación H10 — Compra de insumo</h1><p>Plan Premium, stock y backend simulados. Ninguna escritura real. Servicio {missing ? 'no disponible' : 'disponible'}.</p><ul id="purchase-events" /></main>
  <AlunaCopilot brand={{ id: brandId, name: 'Boku Bento · Simulación H10', plan_id: '3b641b96-602a-4633-912c-2d7e9a4e1d76', plans: { slug: 'premium', name: 'Premium' } }} locationId={site.id} location={site} />
</>);
