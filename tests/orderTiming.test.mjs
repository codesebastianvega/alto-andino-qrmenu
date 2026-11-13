import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrderTiming, getStationTiming, formatOrderDuration } from '../src/utils/orderTiming.js';

const base = Date.parse('2026-11-13T17:00:00Z');
const at = min => new Date(base + min * 60000).toISOString();
const event = (status, min) => ({ status, at: min == null ? null : at(min) });
const timeline = [event('new', 0), event('preparing', 3), event('ready', 18), event('on_the_way', 20), event('delivered', 28)];
const order = { status: 'delivered', fulfillment_type: 'delivery', created_at: at(0), preparing_at: at(3), ready_at: at(18), on_the_way_at: at(20), delivered_at: at(28), status_history: timeline };
const values = timing => timing.stages.map(stage => stage.ms == null ? null : stage.ms / 60000);

test('18 minutes until ready, 2 ready and 8 delivery are separated; initial wait is not kitchen time', () => {
  const timing = getOrderTiming(order, base + 100 * 60000);
  assert.deepEqual(values(timing), [3, 15, 2, 8]);
  assert.equal(timing.untilReadyMs / 60000, 18);
  assert.equal(timing.totalMs / 60000, 28);
  assert.equal(timing.current, null);
});
test('live delivery clock starts on departure and cooking remains frozen', () => {
  const timing = getOrderTiming({ ...order, status: 'on_the_way', delivered_at: null, status_started_at: at(20), status_history: timeline.slice(0, 4) }, base + 28 * 60000);
  assert.equal(timing.current.label, 'En camino'); assert.equal(timing.current.ms / 60000, 8);
  assert.deepEqual(values(timing), [3, 15, 2, 8]);
});
test('ready clock only counts waiting for dispatch', () => {
  const timing = getOrderTiming({ ...order, status: 'ready', delivered_at: null, on_the_way_at: null, status_history: timeline.slice(0, 3) }, base + 20 * 60000);
  assert.equal(timing.current.ms / 60000, 2); assert.equal(timing.stages[1].ms / 60000, 15);
});
test('historical order with only created and delivered never invents preparation times', () => {
  const timing = getOrderTiming({ status: 'delivered', created_at: at(0), delivered_at: at(50), updated_at: at(49) });
  assert.deepEqual(values(timing), [null, null, null, null]); assert.equal(timing.totalMs / 60000, 50);
  assert.equal(timing.untilReadyMs, null);
});
test('known legacy milestones can separate dispatch and delivery without guessing kitchen time', () => {
  const timing = getOrderTiming({ ...order, preparing_at: null, status_history: [] });
  assert.deepEqual(values(timing), [null, null, 2, 8]); assert.equal(timing.untilReadyMs / 60000, 18);
});
test('rework adds only actual cooking intervals, not time spent ready', () => {
  const history = [event('new', 0), event('preparing', 2), event('ready', 10), event('preparing', 13), event('ready', 18), event('on_the_way', 20), event('delivered', 28)];
  assert.deepEqual(values(getOrderTiming({ ...order, preparing_at: at(2), ready_at: at(10), status_history: history })), [2, 13, 5, 8]);
});
test('missing legacy history stays unknown after a genuine new transition', () => {
  const timing = getOrderTiming({ status: 'on_the_way', created_at: at(0), status_started_at: at(20), status_history: [event('ready', null), event('on_the_way', 20)] }, base + 28 * 60000);
  assert.equal(timing.stages[2].ms, null); assert.equal(timing.current.ms / 60000, 8);
});
test('dine-in service and legacy delivery on_table have distinct labels', () => {
  assert.equal(getOrderTiming({ status: 'on_table', fulfillment_type: 'dine_in', on_table_at: at(20) }, base + 28 * 60000).current.label, 'En mesa');
  const legacy = getOrderTiming({ status: 'on_table', fulfillment_type: 'delivery', on_table_at: at(20) }, base + 28 * 60000);
  assert.equal(legacy.current.label, 'En camino'); assert.equal(legacy.current.ms / 60000, 8);
});
test('cancellation freezes the last phase; payment timestamp does not extend it', () => {
  const timing = getOrderTiming({ ...order, status: 'cancelled', cancelled_at: at(8), updated_at: at(99), status_history: [event('new', 0), event('preparing', 3), event('cancelled', 8)] }, base + 100 * 60000);
  assert.equal(timing.stages[1].ms / 60000, 5); assert.equal(timing.totalMs / 60000, 8);
});
test('station timer freezes at ready and rejects invalid chronology', () => {
  assert.equal(getStationTiming({ kitchen_status: 'ready', kitchen_started_at: at(3), kitchen_ready_at: at(18) }, 'kitchen', base + 80 * 60000) / 60000, 15);
  assert.equal(getStationTiming({ kitchen_status: 'ready', kitchen_started_at: at(18), kitchen_ready_at: at(3) }, 'kitchen'), null);
  assert.equal(formatOrderDuration(null), 'Sin registro'); assert.equal(formatOrderDuration(0), '0 min');
});
test('payment confirmation does not reset the contiguous initial-wait phase', () => {
  const timing = getOrderTiming({ status: 'new', created_at: at(0), status_started_at: at(4), status_history: [event('waiting_payment', 0), event('new', 4)] }, base + 7 * 60000);
  assert.equal(timing.current.ms / 60000, 7); assert.equal(timing.stages[0].ms / 60000, 7);
});
