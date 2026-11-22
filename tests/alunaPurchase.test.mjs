import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryCapability, normalizePurchase } from '../supabase/functions/_shared/alunaInventoryRules.js';
import { beginPurchaseTurn, parsePurchase, purchaseConversationReply, buildPurchaseBody, isPurchaseConversation } from '../src/utils/alunaPurchase.js';
import { canApproveConversationCard, invalidateConversationProposals, validateConversationResponse } from '../src/utils/alunaConversation.js';

const request = 'Compré un kilo de café molido por $40.000. Ayúdame a registrarlo en mi inventario';
const brand = { is_active: true, payment_verified: true, plans: { slug: 'premium', name: 'Premium' } };
const capability = inventoryCapability(brand, { inventory: true });
const ingredient = { id: 'coffee', name: 'Café molido', usage_unit: 'g', stock_current: 500, unit_cost: 30 };
const context = { capability, executorReady: true, ingredients: [ingredient], locations: [{ id: 'main', name: 'Sede Principal' }], inventory: [{ location_id: 'main', ingredient_id: 'coffee', stock_quantity: 100 }], selectedLocationId: 'main', scope: 'boku:main' };
const begin = (message = request, previous = null, overrides = {}) => beginPurchaseTurn({ message, previous, ...context, turnId: crypto.randomUUID(), ...overrides });

test('conserva un kilo y COP 40.000, convierte a 1.000 g y muestra costo y ambos stocks', () => {
  assert.deepEqual(parsePurchase(request), { ingredient_name: 'café molido', purchase_quantity: 1, purchase_unit: 'kg', total_cost: 40000 });
  const task = begin();
  assert.equal(task.ready, true);
  assert.equal(task.normalized.added, 1000);
  assert.equal(task.normalized.unit_cost, 40);
  const card = purchaseConversationReply(task).card;
  assert.match(card.summary, /Premium.*Sede Principal/);
  assert.deepEqual(card.beforeAfter.slice(1), [{ label: 'Stock general', before: '500 g', after: '1500 g' }, { label: 'Stock en Sede Principal', before: '100 g', after: '1100 g' }]);
  assert.match(card.beforeAfter[0].after, /1 kg.*40\.000/);
  assert.equal(buildPurchaseBody(task, 'boku').proposal.entries[0].expected_stock, 500);
});

test('Esencial no ofrece aprobar aunque esté en prueba; Premium respeta feature deshabilitada', () => {
  const denied = inventoryCapability({ ...brand, payment_verified: false, subscription_status: 'trialing', trial_end_date: '2099-01-01', plans: { slug: 'esencial', name: 'Esencial' } }, { inventory: true });
  assert.equal(denied.allowed, false);
  const task = begin(request, null, { capability: denied });
  assert.equal(purchaseConversationReply(task).card, null);
  assert.match(purchaseConversationReply(task).reply, /Esencial.*no permite/);
  assert.match(purchaseConversationReply(task).reply, /registro externo/);
  assert.equal(task.data.total_cost, 40000);
  assert.throws(() => buildPurchaseBody(task, 'bruma'));
  assert.equal(inventoryCapability(brand, { inventory: false }).allowed, false);
  assert.equal(inventoryCapability({ ...brand, plans: null }).allowed, false);
  assert.equal(inventoryCapability({ ...brand, is_active: false }).allowed, false);
});

test('servicio ausente conserva nota pero no produce una aprobación ejecutable', () => {
  const task = begin(request, null, { executorReady: false });
  assert.equal(purchaseConversationReply(task).card, null);
  assert.match(purchaseConversationReply(task).reply, /no está disponible/);
  assert.equal(task.data.purchase_quantity, 1);
  assert.throws(() => buildPurchaseBody(task, 'boku'));
});

test('pide solamente el costo faltante y conserva cantidad, unidad e insumo al responder', () => {
  const partial = begin('Compré un kilo de café molido');
  assert.equal(partial.missing, 'cost');
  assert.equal(purchaseConversationReply(partial).card, null);
  assert.match(purchaseConversationReply(partial).reply, /¿Cuánto pagaste en total/);
  const task = begin('Pagué $40.000', partial);
  assert.equal(begin('$40.000', partial).ready, true);
  assert.equal(task.ready, true);
  assert.equal(task.data.purchase_unit, 'kg');
  assert.equal(task.normalized.unit_cost, 40);
});

test('una compra distinta no hereda costos y una corrección inválida no conserva el valor aprobado', () => {
  const previous = begin();
  assert.equal(begin('Compré un kilo de azúcar', previous).data.total_cost, undefined);
  assert.equal(begin('Otra compra: un kilo de café molido', previous).missing, 'cost');
  assert.equal(begin('Pagué $0', previous).missing, 'cost');
  assert.equal(begin('Pagué $-40.000', previous).missing, 'cost');
  assert.equal(begin('Compré -1 kg de café molido por $40.000', previous).missing, 'quantity');
});

test('no selecciona insumos parecidos, duplicados, sedes ajenas ni vínculos inexistentes', () => {
  for (const overrides of [{ ingredients: [{ ...ingredient, name: 'Café en grano' }] }, { ingredients: [ingredient, { ...ingredient, id: 'other' }] }, { inventory: [] }]) {
    const task = begin(request, null, overrides);
    assert.equal(task.ready, false);
    assert.equal(purchaseConversationReply(task).card, null);
  }
  const unknownSite = begin(request + ' en Sede Sur');
  assert.equal(unknownSite.location, null);
  assert.equal(unknownSite.ready, false);
});

test('inventario general explícito no modifica stock de sede y no supone una sede', () => {
  assert.equal(begin(request, null, { selectedLocationId: null }).missing, 'location');
  const task = begin(request + ' en inventario general');
  assert.equal(task.location, null);
  assert.equal(task.ready, true);
  assert.equal(buildPurchaseBody(task, 'boku').location_id, null);
  assert.equal(buildPurchaseBody(task, 'boku').proposal.entries[0].expected_location_stock, null);
});

test('rechaza unidades incompatibles, cantidades/costos inválidos sin inventar conversiones', () => {
  assert.equal(begin(request, null, { ingredients: [{ ...ingredient, usage_unit: 'ml' }] }).missing, 'unit');
  for (const entry of [{ purchase_quantity: -1, purchase_unit: 'kg', total_cost: 40000 }, { purchase_quantity: 1, purchase_unit: 'kg', total_cost: NaN }, { purchase_quantity: Infinity, purchase_unit: 'kg', total_cost: 1 }]) assert.throws(() => normalizePurchase(entry, ingredient));
});

test('reintentos usan la misma clave y propuestas ejecutadas o inciertas no se reactivan', () => {
  const first = begin();
  const retry = begin('Retoma la compra anterior', first);
  assert.equal(retry.idempotencyKey, first.idempotencyKey);
  assert.equal(buildPurchaseBody(first, 'boku').idempotency_key, buildPurchaseBody(retry, 'boku').idempotency_key);
  for (const status of ['executed', 'unconfirmed', 'dismissed']) {
    const recovered = begin('Recupera la compra anterior', { ...first, status });
    assert.equal(recovered.status, status);
    assert.equal(purchaseConversationReply(recovered).card, null);
    assert.throws(() => buildPurchaseBody(recovered, 'boku'));
    assert.equal(purchaseConversationReply(begin('Pagué $45.000', { ...first, status })).card, null);
  }
});

test('varios insumos no asignan el costo combinado al primero, tampoco al recuperar', () => {
  const task = begin('Compré 1 kg de café molido y 2 kg de azúcar por $40.000');
  assert.equal(task.missing, 'single');
  assert.equal(purchaseConversationReply(task).card, null);
  assert.equal(purchaseConversationReply(begin('Retoma la compra', task)).card, null);
});

test('H01: aprobación ligada a turno, operación y negocio; el modelo no autoriza compras', () => {
  const task = begin();
  const card = purchaseConversationReply(task).card;
  assert.equal(canApproveConversationCard(card, task.turnId, task), true);
  assert.equal(canApproveConversationCard(card, 'old', task), false);
  assert.equal(canApproveConversationCard(card, task.turnId, { ...task, scope: 'other:main' }), false);
  assert.equal(canApproveConversationCard(invalidateConversationProposals([{ card }])[0].card, task.turnId, task), false);
  assert.equal(validateConversationResponse({ operation: 'other' }, { intent: 'batch_stock_entry', inventory_draft: {} }), false);
  assert.equal(isPurchaseConversation(request), true);
  assert.equal(isPurchaseConversation('Cambia el precio del café a $5.500', task), false);
  assert.equal(isPurchaseConversation('Oculta Croissant UX', task), false);
  assert.equal(begin('Retoma la compra', task, { scope: 'other:main' }).data.ingredient_name, undefined);
});
