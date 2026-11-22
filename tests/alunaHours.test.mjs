import test from 'node:test';
import assert from 'node:assert/strict';
import { beginHoursTurn, hoursConversationReply, buildHoursUpdateBody, isHoursConversation } from '../src/utils/alunaHours.js';
import { validateConversationResponse } from '../src/utils/alunaConversation.js';

const locations = [{ id: 'principal', name: 'Sede Principal' }, { id: 'norte', name: 'Sede Norte' }];
const request = 'Mi cafetería abre de lunes a viernes de 8 de la mañana a 6 de la tarde. Ayúdame a configurar los horarios, pero antes dime qué información necesitas';
const begin = (message, previous, selectedLocationId = null, scope = 'brand:all') => beginHoursTurn({ message, previous, locations, selectedLocationId, scope, turnId: crypto.randomUUID() });

test('consulta primero, conserva lunes a viernes 08:00–18:00 y pregunta solo la sede', () => {
  const task = begin(request);
  assert.deepEqual(task.missing, ['location']);
  assert.deepEqual(Object.values(task.entries).map((row) => row.day_of_week), [1, 2, 3, 4, 5]);
  assert.ok(Object.values(task.entries).every((row) => row.open_time === '08:00' && row.close_time === '18:00'));
  assert.equal(hoursConversationReply(task).card, null);
  assert.match(hoursConversationReply(task).reply, /¿En qué sede/);
  assert.throws(() => buildHoursUpdateBody(task, 'brand'));
  const chosen = begin('Para Sede Principal', task);
  assert.deepEqual(chosen.entries, task.entries);
  assert.equal(chosen.ready, false);
  assert.equal(hoursConversationReply(chosen).card, null);
  assert.match(hoursConversationReply(chosen).reply, /¿Te muestro la propuesta/);
  const review = begin('Sí, muéstrame la propuesta', chosen);
  const card = hoursConversationReply(review, [{ location_id: 'principal', day_of_week: 1, open_time: '09:00:00', close_time: '22:00:00', is_closed: false }]).card;
  assert.equal(review.ready, true);
  assert.equal(card.title, 'Horarios de Sede Principal');
  assert.equal(card.beforeAfter.length, 5);
  assert.deepEqual(card.beforeAfter[0], { label: 'Lunes', before: '9:00 a. m. a 10:00 p. m.', after: '8:00 a. m. a 6:00 p. m.' });
  assert.match(card.summary, /Sin cambios: Domingo, Sábado/);
  const body = buildHoursUpdateBody(review, 'brand');
  assert.equal(body.location_id, 'principal');
  assert.equal(body.approved, true);
  assert.deepEqual(Object.keys(body.proposal), ['hours']);
  assert.deepEqual(body.proposal.hours, Object.values(task.entries));
  assert.equal(body.idempotency_key, buildHoursUpdateBody(review, 'brand').idempotency_key);
});

test('sede seleccionada conocida no necesita preguntar otra vez, pero respeta consultar primero', () => {
  const task = begin(request, null, 'principal');
  assert.equal(task.location.id, 'principal');
  assert.deepEqual(task.missing, []);
  assert.equal(hoursConversationReply(task).card, null);
  assert.equal(begin('Sí', task, 'principal').ready, true);
});

test('horas ambiguas o parciales no autorizan y se conservan los días', () => {
  const partial = begin('Configura los horarios de lunes a viernes', null, 'principal');
  assert.deepEqual(partial.pendingDays, [1, 2, 3, 4, 5]);
  assert.equal(hoursConversationReply(partial).card, null);
  const ambiguous = begin('De 8 a 6', partial, 'principal');
  assert.equal(ambiguous.ready, false);
  assert.equal(Object.keys(ambiguous.entries).length, 0);
  const clarified = begin('De 8 de la mañana a 6 de la tarde', ambiguous, 'principal');
  assert.equal(clarified.ready, true);
  assert.equal(Object.keys(clarified.entries).length, 5);
});

test('puede recibir primero las horas y después los días sin perderlas', () => {
  const times = begin('Configurar horarios de 08:00 a 18:00', null, 'principal');
  assert.deepEqual(times.missing, ['days']);
  const days = begin('De lunes a viernes', times, 'principal');
  assert.equal(days.ready, true);
  assert.equal(Object.keys(days.entries).length, 5);
});

test('un día adicional no modifica los demás y solo cierra un día explícitamente indicado', () => {
  const first = begin('Configura horarios de lunes a viernes de 08:00 a 18:00', null, 'principal');
  const second = begin('El sábado de 09:00 a 12:00', first, 'principal');
  assert.equal(second.entries[1].close_time, '18:00');
  assert.equal(second.entries[6].close_time, '12:00');
  assert.equal(second.entries[0], undefined);
  const closed = begin('El domingo cerrado', second, 'principal');
  assert.equal(closed.entries[0].is_closed, true);
  assert.equal(closed.entries[1].is_closed, false);
});

test('no reduce varios turnos o grupos de días a un horario inventado', () => {
  for (const text of ['Horarios lunes de 08:00 a 12:00 y de 14:00 a 18:00', 'Horarios lunes de 08:00 a 18:00 y sábado de 09:00 a 12:00', 'Horarios lunes a viernes de 08:00 a 18:00, domingo cerrado', 'Horarios lunes de 18:00 a 08:00', 'Horarios lunes de 123:00 a 23:30', 'Horarios lunes de 08:00 a 1800', 'Horarios lunes de 08:70 a 18:00']) {
    const task = begin(text, null, 'principal');
    assert.equal(task.ready, false, text);
    assert.equal(hoursConversationReply(task).card, null, text);
  }
});

test('no sustituye una sede desconocida ni hereda datos de otro negocio', () => {
  const task = begin('Configura horarios lunes de 08:00 a 18:00 para Sede Desconocida', null, 'principal');
  assert.equal(task.location, null);
  assert.equal(task.ready, false);
  const changed = begin('Muéstrame la propuesta', task, null, 'another-brand:all');
  assert.deepEqual(changed.entries, {});
  assert.equal(changed.ready, false);
});

test('recuperar no reactiva propuestas ejecutadas, descartadas o sin confirmación', () => {
  const task = begin('Configura horarios lunes de 08:00 a 18:00', null, 'principal');
  for (const status of ['executed', 'dismissed', 'unconfirmed']) {
    const recovered = begin('Recuperar el trabajo anterior', { ...task, status }, 'principal');
    assert.equal(hoursConversationReply(recovered).card, null);
    assert.throws(() => buildHoursUpdateBody(recovered, 'brand'));
  }
});

test('el modelo no puede proponer horarios desde otra operación; H01/H04 mantienen su ruta', () => {
  assert.equal(validateConversationResponse({ operation: 'other' }, { intent: 'update_business_hours', proposal_ready: true }), false);
  const previous = { operation: 'hours' };
  assert.equal(isHoursConversation('Quiero preparar la receta de mi café', previous), false);
  assert.equal(isHoursConversation('Cambia el precio de Café americano UX a 5500', previous), false);
  assert.equal(isHoursConversation(request), true);
});
