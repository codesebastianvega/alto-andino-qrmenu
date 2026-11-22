import test from 'node:test';
import assert from 'node:assert/strict';
import { beginVisibilityTurn, visibilityConversationReply, buildLocationVisibilityUpdate, buildGlobalVisibilityBody, isOrderableVisibility, isVisibilityConversation, getVisibilityLocationId } from '../src/utils/alunaVisibility.js';
import { invalidateConversationProposals, canApproveConversationCard } from '../src/utils/alunaConversation.js';

const croissant = { id: 'croissant', name: 'Croissant UX', is_active: true, stock_status: 'in', updated_at: 'before' };
const coffee = { id: 'coffee', name: 'Café americano UX', is_active: true, stock_status: 'in', price: 5500, updated_at: 'before-coffee' };
const locations = [{ id: 'principal', name: 'Sede Principal' }, { id: 'norte', name: 'Sede Norte' }];
const statuses = [{ id: 'link', product_id: croissant.id, location_id: 'principal', is_active: true, stock_status: 'in', updated_at: 'link-before' }];
const scope = 'brand:all';
const begin = (message, previous, overrides = {}) => beginVisibilityTurn({ message, previous, products: [croissant, coffee], locations, statuses, scope, turnId: crypto.randomUUID(), ...overrides });

test('ocultar pregunta alcance, conserva producto y prepara propuesta antes de ejecutar', () => {
  const task = begin('Oculta Croissant UX del menú para que los clientes no puedan pedirlo. Muéstrame primero qué cambiará');
  assert.equal(task.product.id, croissant.id);
  assert.equal(task.target, false);
  assert.equal(visibilityConversationReply(task).card, null);
  const scoped = begin('En Sede Principal', task);
  const card = visibilityConversationReply(scoped).card;
  assert.equal(card.title, 'Ocultar Croissant UX');
  assert.deepEqual(card.beforeAfter[2], { label: 'Estado', before: 'Activo', after: 'Oculto' });
  assert.match(card.summary, /Sede Principal/);
  assert.equal(canApproveConversationCard(card, scoped.turnId, scoped), true);
  assert.deepEqual(buildLocationVisibilityUpdate(scoped, 'now'), { changes: { is_active: false, updated_at: 'now' }, id: 'link', location_id: 'principal', product_id: 'croissant', before: true, updated_at: 'link-before' });
  assert.equal(coffee.price, 5500);
});

test('reactivación invierte solamente el estado de la misma sede y respeta restricciones globales', () => {
  const task = begin('Vuelve a mostrar Croissant UX en Sede Principal', null, { statuses: [{ ...statuses[0], is_active: false }] });
  assert.equal(task.target, true);
  assert.deepEqual(buildLocationVisibilityUpdate(task, 'now').changes, { is_active: true, updated_at: 'now' });
  assert.match(visibilityConversationReply(task).card.summary, /cuando su categoría, sede y disponibilidad/);
  const blocked = begin('Reactiva Croissant UX en Sede Principal', null, { products: [{ ...croissant, is_active: false }, coffee] });
  assert.equal(blocked.ready, false);
  assert.equal(visibilityConversationReply(blocked).card, null);
  assert.ok(blocked.missing.includes('globalInactive'));
});

test('alcance global exige petición explícita y usa el contrato estricto existente', () => {
  const task = begin('Oculta Croissant UX en todas las sedes');
  assert.deepEqual(buildGlobalVisibilityBody(task, 'brand'), { brand_id: 'brand', action: 'update_product', approved: true, idempotency_key: task.idempotencyKey, proposal: { entity_id: 'croissant', changes: { is_active: false }, expected_updated_at: 'before' } });
  assert.throws(() => buildLocationVisibilityUpdate(task, 'now'));
});

test('ambigüedad, sede ajena, vínculo ausente y otro negocio no generan aprobación', () => {
  for (const [message, overrides] of [
    ['Oculta Muffin en Sede Principal', {}],
    ['Oculta Croissant UX en Sede Ajena', { selectedLocationId: 'principal' }],
    ['Oculta Croissant UX en Sede Norte', {}],
    ['Oculta Croissant UX en Sede Principal', { products: [croissant, { ...croissant, id: 'another' }] }],
  ]) assert.equal(visibilityConversationReply(begin(message, null, overrides)).card, null, message);
  const previous = begin('Oculta Croissant UX en Sede Principal');
  assert.equal(begin('Retomar lo anterior', previous, { scope: 'other-brand' }).ready, false);
  assert.equal(begin('No ocultes Croissant UX', previous).ready, false);
  assert.equal(begin('No lo reactives', previous).ready, false);
  assert.equal(begin('No vuelvas a mostrar Croissant UX', previous).ready, false);
  const forged = { ...previous, status: { ...statuses[0], product_id: coffee.id } };
  assert.throws(() => buildLocationVisibilityUpdate(forged, 'now'));
});

test('propuesta anterior permanece como historial, pero no puede aprobarse ni recuperarse ejecutada', () => {
  const task = begin('Oculta Croissant UX en Sede Principal');
  const card = visibilityConversationReply(task).card;
  const old = invalidateConversationProposals([{ role: 'assistant', content: 'Propuesta anterior', card }]);
  assert.equal(old[0].content, 'Propuesta anterior');
  assert.equal(canApproveConversationCard(old[0].card, task.turnId, task), false);
  const recovered = begin('Recuperar el trabajo anterior', { ...task, status: 'executed' });
  assert.equal(visibilityConversationReply(recovered).card, null);
  assert.equal(isVisibilityConversation('Oculta Croissant UX', { operation: 'hours' }), true);
  assert.equal(isVisibilityConversation('Cambia el precio del café a 5500', task), false);
  assert.equal(isVisibilityConversation('Activa los horarios de lunes a viernes', task), false);
  assert.equal(isVisibilityConversation('Activa el método de pagos', task), false);
});

test('Boki bloquea estado global o de sede oculto y no levanta un agotado al reactivar', () => {
  assert.equal(isOrderableVisibility(croissant, statuses[0]), true);
  assert.equal(isOrderableVisibility(croissant, { ...statuses[0], is_active: false }), false);
  assert.equal(isOrderableVisibility({ ...croissant, is_active: false }, statuses[0]), false);
  assert.equal(isOrderableVisibility(croissant, { ...statuses[0], stock_status: 'out' }), false);
  assert.equal(isOrderableVisibility(null), false);
});

test('carta pública aplica la sede mostrada aun en all; administración conserva catálogo maestro', () => {
  const hidden = { ...statuses[0], is_active: false };
  const publicId = getVisibilityLocationId('all', 'principal', false);
  assert.equal(publicId, 'principal');
  assert.equal(isOrderableVisibility(croissant, [hidden].find((row) => row.location_id === publicId)), false);
  assert.equal(getVisibilityLocationId('all', 'principal', true), null);
  assert.equal(getVisibilityLocationId('norte', 'principal', false), 'norte');
  assert.equal(isOrderableVisibility(croissant, [hidden].find((row) => row.location_id === 'norte')), true);
});
