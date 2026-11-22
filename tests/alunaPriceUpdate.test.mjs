import test from 'node:test';
import assert from 'node:assert/strict';
import { getRequestedPrice, buildPriceUpdateBody, buildPriceUpdateProposal } from '../src/utils/alunaPriceUpdate.js';

test('una orden explícita de precio conserva entidad y diff sin convertirse en creación', () => {
  const product = { id: 'cafe', name: 'Café americano UX', price: 5000 };
  const card = buildPriceUpdateProposal('Cambia el precio de Café americano UX de $5.000 a $5.500.', product, 'key');
  assert.equal(card.action, 'edit_product_price');
  assert.equal(card.product.id, 'cafe');
  assert.deepEqual(card.priceUpdate, { price: 5500, idempotencyKey: 'key' });
  assert.deepEqual(card.beforeAfter, [{ label: 'Precio', before: '$ 5.000', after: '$ 5.500' }]);
  assert.equal(buildPriceUpdateProposal('Crear Café americano UX a precio 5500', product, 'key'), null);
  assert.equal(buildPriceUpdateProposal('Cambia el costo a 5500', product, 'key'), null);
  assert.equal(buildPriceUpdateProposal('Cambia el precio a 5500', null, 'key'), null);
});

test('conserva el precio nuevo explícito y no el precio anterior', () => {
  for (const message of [
    'Cambia el precio de Café americano UX de $5.000 a $5.500',
    'Cambia el precio de Café americano UX de $5.000 a $5.500. Muéstrame la propuesta antes de aplicarla.',
    'Cambia el precio de Café americano UX a 5500 COP. Muéstrame el cambio antes de aplicarlo.',
    'Usar $ 5.500 COP',
    'Nuevo precio: 5500',
    '5000 → 5500',
  ]) assert.equal(getRequestedPrice(message), 5500, message);
});

test('no inventa un precio cuando falta o es inválido', () => {
  for (const message of ['Edita el precio del Combo 2', 'Cambia el precio a -5500', 'Precio: 0', 'Precio: 1000000001', 'Cambia el costo a 5500']) {
    assert.equal(getRequestedPrice(message), null, message);
  }
});

test('envía solo el contrato estricto del backend y una sola entidad', () => {
  const body = buildPriceUpdateBody({ brandId: 'brand', productId: 'cafe', price: 5500, idempotencyKey: 'approval-key' });
  assert.deepEqual(body, {
    brand_id: 'brand', action: 'update_product', approved: true, idempotency_key: 'approval-key',
    proposal: { entity_id: 'cafe', changes: { price: 5500 } },
  });
  assert.equal('location_id' in body, false);
  for (const price of [NaN, Infinity, -1, 0, '5500', 1_000_000_001]) {
    assert.throws(() => buildPriceUpdateBody({ brandId: 'brand', productId: 'cafe', price, idempotencyKey: 'approval-key' }));
  }
});
