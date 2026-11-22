import test from 'node:test';
import assert from 'node:assert/strict';
import { beginConversationTurn, conversationDraft, recipeConversationReply, validateConversationResponse, invalidateConversationProposals, canApproveConversationCard } from '../src/utils/alunaConversation.js';
import { buildPriceUpdateProposal, buildPriceUpdateBody } from '../src/utils/alunaPriceUpdate.js';

const coffee = { id: 'coffee', name: 'Café americano UX', price: 5500 };
const croissant = { id: 'croissant', name: 'Croissant UX', price: 7000 };
const products = [coffee, croissant];
const scope = 'brand:location';
const request = 'Quiero preparar la receta de mi café. Lleva 18 gramos de café molido y 200 mililitros de agua. Todavía no sé cuánto cuestan los ingredientes';
const begin = (message, previous, catalog = products, currentScope = scope) => beginConversationTurn({ message, previous, products: catalog, scope: currentScope, turnId: crypto.randomUUID() });

test('croissant → receta del café → fallo → recuperar conserva operación, producto y cantidades', async () => {
  const lookup = begin('Consultar Croissant UX');
  lookup.draft = { product_name: 'Croissant UX', price: 7000, recipe_draft: { ingredients: [{ name: 'Mantequilla' }] } };
  lookup.card = { type: 'proposal', action: 'create_catalog', draft: lookup.draft };
  const task = begin(request, lookup);
  assert.equal(task.operation, 'recipe');
  assert.equal(task.product.id, coffee.id);
  assert.deepEqual(task.ingredients.map(({ name, recipe_quantity, usage_unit }) => ({ name, recipe_quantity, usage_unit })), [
    { name: 'café molido', recipe_quantity: 18, usage_unit: 'g' },
    { name: 'agua', recipe_quantity: 200, usage_unit: 'ml' },
  ]);
  assert.equal(conversationDraft(task).product_name, coffee.name);
  assert.equal(JSON.stringify(conversationDraft(task)).includes('Croissant'), false);
  // A failing provider cannot change the locally retained task or show its error.
  let reply;
  try { await Promise.reject(new Error('Gemini JSON unsupported fields secret stack trace')); }
  catch { reply = recipeConversationReply(task, { failed: true }); }
  assert.match(reply.reply, /conservé/);
  assert.doesNotMatch(reply.reply, /Gemini|JSON|unsupported|stack|Croissant/);
  const restored = begin('Quiero recuperar el trabajo anterior', task);
  assert.equal(restored.product.id, coffee.id);
  assert.deepEqual(restored.ingredients, task.ingredients);
  assert.match(recipeConversationReply(restored).reply, /Retomemos tu receta/);
  assert.match(recipeConversationReply(restored).reply, /costos siguen pendientes/i);
  assert.equal(recipeConversationReply(restored).card.type, 'guidance');
  assert.ok(restored.ingredients.every((ingredient) => ingredient.purchase_price === ''));
});

test('cualquier respuesta de modelo de receta es informativa y nunca autoriza crear otro producto', () => {
  const task = begin(request, begin('Consultar Croissant UX'));
  for (const response of [
    { intent: 'create_catalog', catalog_draft: { product_name: 'Croissant UX', price: 7000 } },
    { intent: 'create_costed_product', matched_product: croissant, recipe_draft: { ingredients: [{ name: 'agua', purchase_price: 100 }] } },
    { intent: 'general', reply: '{"internal":"error"}' },
    null,
  ]) {
    assert.equal(validateConversationResponse(task, response), false);
    assert.doesNotMatch(recipeConversationReply(task).reply, /Croissant|internal/);
    assert.equal(task.ingredients[1].purchase_price, '');
  }
});

test('ante dos cafés pregunta solo por el producto y conserva las cantidades al elegir', () => {
  const catalog = [...products, { id: 'latte', name: 'Café latte', price: 6000 }];
  const ambiguous = begin(request, begin('Consultar Croissant UX'), catalog);
  assert.equal(ambiguous.product, null);
  assert.equal(ambiguous.needsProduct, true);
  assert.match(recipeConversationReply(ambiguous).reply, /Café americano UX, Café latte/);
  const clarified = begin('El Café americano UX', ambiguous, catalog);
  assert.equal(clarified.operation, 'recipe');
  assert.equal(clarified.product.id, coffee.id);
  assert.equal(clarified.ingredients[0].recipe_quantity, 18);
  assert.equal(begin('El primero', ambiguous, catalog).product.id, coffee.id);
});

test('producto desconocido no hereda el croissant ni cambia el trabajo entre negocios', () => {
  const old = begin('Quiero preparar la receta de Croissant UX. Lleva 20 gramos de mantequilla');
  const unknown = begin('Quiero preparar la receta de mi té', old);
  assert.equal(unknown.product, null);
  assert.equal(unknown.ingredients.length, 0);
  const switched = begin('Recuperar el trabajo anterior', old, [], 'different-brand:location');
  assert.equal(switched.operation, 'clarify');
  assert.equal(switched.product, undefined);
});

test('el historial permanece, pero una aprobación anterior no puede ejecutarse', () => {
  const card = { type: 'proposal', action: 'create_catalog', turnId: 'old' };
  const history = [{ role: 'assistant', content: 'Crear Croissant UX', card }];
  const invalidated = invalidateConversationProposals(history);
  assert.equal(invalidated[0].content, history[0].content);
  assert.equal(card.obsolete, undefined);
  assert.equal(canApproveConversationCard(invalidated[0].card, 'old'), false);
  assert.equal(canApproveConversationCard(card, 'new'), false);
  assert.equal(canApproveConversationCard({ ...card, turnId: 'new' }, 'new'), true);
});

test('H04 sigue conservando $5.500 aun con intención de creación errónea del proveedor', () => {
  const task = begin('Cambia el precio de Café americano UX de $5.000 a $5.500', begin('Consultar Croissant UX'));
  assert.equal(task.operation, 'price');
  assert.equal(validateConversationResponse(task, { intent: 'create_catalog', matched_product: coffee, catalog_draft: { product_name: croissant.name } }), true);
  const proposal = buildPriceUpdateProposal(task.sourceMessage, task.product, 'one-approval');
  assert.equal(proposal.priceUpdate.price, 5500);
  assert.deepEqual(buildPriceUpdateBody({ brandId: 'brand', productId: proposal.product.id, price: proposal.priceUpdate.price, idempotencyKey: proposal.priceUpdate.idempotencyKey }).proposal, { entity_id: coffee.id, changes: { price: 5500 } });
  assert.equal(validateConversationResponse(task, { intent: 'create_catalog', matched_product: croissant }), false);
});

test('consultar no crea y una creación no puede cambiar de nombre por el modelo', () => {
  assert.equal(validateConversationResponse(begin('Consultar Croissant UX'), { intent: 'create_catalog', catalog_draft: { product_name: croissant.name } }), false);
  const create = begin('Quiero crear una Limonada UX a 9000');
  assert.equal(validateConversationResponse(create, { intent: 'create_catalog', catalog_draft: { product_name: croissant.name } }), false);
  assert.equal(validateConversationResponse(create, { intent: 'create_catalog', catalog_draft: { product_name: 'Limonada UX' } }), true);
  assert.equal(validateConversationResponse(begin('Consultar Croissant UX'), { intent: 'update_delivery_settings' }), false);
  assert.equal(validateConversationResponse(create, { intent: 'update_branding' }), false);
});

test('la aprobación se vincula a negocio, operación y producto, además del turno', () => {
  const task = begin('Cambia el precio de Café americano UX a 5500');
  const card = { turnId: task.turnId, binding: { scope, operation: 'price', productId: coffee.id } };
  assert.equal(canApproveConversationCard(card, task.turnId, task), true);
  for (const binding of [{ ...card.binding, scope: 'other-brand' }, { ...card.binding, operation: 'create' }, { ...card.binding, productId: croissant.id }]) {
    assert.equal(canApproveConversationCard({ ...card, binding }, task.turnId, task), false);
  }
});

test('una cantidad que menciona otro producto sigue siendo ingrediente del trabajo activo', () => {
  const croissantRecipe = begin('Quiero preparar la receta de Croissant UX');
  const ingredientReply = begin('18 gramos de café molido', croissantRecipe);
  assert.equal(ingredientReply.product.id, croissant.id);
  assert.equal(ingredientReply.ingredients[0].name, 'café molido');
  const affirmative = begin('Sí', ingredientReply);
  assert.equal(affirmative.operation, 'recipe');
  assert.equal(affirmative.product.id, croissant.id);
  assert.deepEqual(affirmative.ingredients, ingredientReply.ingredients);
  const more = begin('Además 10 gramos de azúcar', affirmative);
  assert.deepEqual(more.ingredients.map((ingredient) => ingredient.name), ['café molido', 'azúcar']);
});
