import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCatalogRequest, catalogPrice, catalogFormProducts, catalogDraftReply, continueCatalogRequest, syncCatalogDraft } from '../src/utils/alunaCatalogDraft.js';

const message = 'Quiero vender café americano a $5.000 y croissant a $7.000 en la categoría Desayunos. Muéstrame cómo quedaría antes de guardar';
test('two explicit products share exactly the values shown in the form and reply, regardless of provider', () => {
  const draft = extractCatalogRequest(message);
  assert.equal(draft.category_name, 'Desayunos');
  assert.deepEqual(catalogFormProducts(draft).map(({ name, price }) => [name, price]), [['café americano', 5000], ['croissant', 7000]]);
  for (const response of [{}, { product_name: 'Otro', price: 999 }, { product_name: 'café americano', price: '5.000' }]) assert.deepEqual(syncCatalogDraft(message, response), draft);
  assert.match(catalogDraftReply(draft), /café americano: \$5\.000; croissant: \$7\.000/);
  assert.match(catalogDraftReply(draft), /Todavía no he guardado nada/);
});
test('a missing price is retained as missing; a named followup changes only its product', () => {
  const draft = extractCatalogRequest('Quiero crear café a $5.000 y croissant en la categoría Desayunos');
  assert.equal(draft.products[1].price, '');
  assert.match(catalogDraftReply(draft), /Qué precio tendrá croissant/);
  const updated = continueCatalogRequest('El croissant cuesta $7.000', draft);
  assert.equal(updated.products[0].price, 5000);
  assert.equal(updated.products[1].price, 7000);
  assert.equal(draft.products[1].price, '');
  assert.equal(continueCatalogRequest('Cambia precio del croissant a $8.000', draft), null);
});
test('names, quoted descriptions with conjunctions and category stay with their product', () => {
  const draft = extractCatalogRequest('Crear café a $5.000 descripción: "Café negro y caliente" y croissant a $7.000 descripción: "De mantequilla" en la categoría Desayunos.');
  assert.deepEqual(draft.products.map(({ name, description, price }) => ({ name, description, price })), [{ name: 'café', description: 'Café negro y caliente', price: 5000 }, { name: 'croissant', description: 'De mantequilla', price: 7000 }]);
});
test('formatting, invalid and invented prices do not become executable numbers', () => {
  for (const value of [null, undefined, '', 0, -1, '5 mil', 'Infinity', 1e10]) assert.equal(catalogPrice(value), '');
  assert.equal(catalogPrice('$5.000 COP'), 5000);
  assert.equal(catalogPrice('7,000'), 7000);
  assert.equal(syncCatalogDraft('Ayúdame a crear café', { product_name: 'café', price: 5000 }).price, '');
  assert.equal(catalogFormProducts({ product_name: 'Café', price: '5.000', description: 'Negro', category_name: 'Desayunos' })[0].price, 5000);
});
test('updates, recipes, visibility and hours do not enter the creation parser', () => {
  for (const text of ['Cambia el precio de café a $5.500', 'Quiero preparar la receta de mi café', 'Oculta Croissant UX', 'Abre de lunes a viernes de 8 a 18']) assert.equal(extractCatalogRequest(text), null);
});
test('the batch limit never silently drops products and continuing a draft keeps its description', () => {
  const draft = extractCatalogRequest(`Crear ${Array.from({ length: 11 }, (_, index) => `producto ${index} a $5.000`).join(' y ')} en la categoría Prueba`);
  assert.equal(draft.products.length, 11);
  assert.match(catalogDraftReply(draft), /hasta 10 productos/);
  const single = syncCatalogDraft('Ahora revisa el borrador', { product_name: 'Café', price: '' }, { price: 5000, description: 'Negro caliente', category_name: 'Desayunos' });
  assert.equal(single.price, 5000);
  assert.equal(single.description, 'Negro caliente');
  assert.equal(single.category_name, 'Desayunos');
});
