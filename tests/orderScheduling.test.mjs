import test from 'node:test';
import assert from 'node:assert/strict';
import { colombiaDateTime, scheduledOrderTimestamp } from '../src/utils/orderScheduling.js';
import { getFulfillmentModes } from '../src/constants/businessTypes.js';
import { getOrderTiming } from '../src/utils/orderTiming.js';

test('appointment uses Colombia time independently of device timezone and crosses midnight', () => {
  assert.equal(scheduledOrderTimestamp('2026-11-17T23:30'), '2026-11-18T04:30:00.000Z');
  assert.equal(colombiaDateTime(Date.parse('2026-11-18T04:30:00Z')), '2026-11-17T23:30');
  assert.equal(scheduledOrderTimestamp(''), null);
  assert.equal(scheduledOrderTimestamp('invalid'), null);
});

test('location overrides business defaults, including pickup for dark kitchens', () => {
  const settings = { business_type: 'dark_kitchen' };
  const enabled = getFulfillmentModes(settings, { operational_modes: ['delivery', 'takeaway', 'scheduled'] });
  assert.equal(enabled.takeaway, true);
  assert.equal(enabled.dine_in, false);
  assert.equal(enabled.scheduled, true);
  const pickupOnly = getFulfillmentModes(settings, { operational_modes: ['takeaway'] });
  assert.equal(pickupOnly.delivery, false);
  assert.equal(pickupOnly.scheduled, false);
});

test('scheduled delivery and pickup remain pending without operational delay', () => {
  for (const fulfillment_type of ['delivery', 'takeaway']) {
    const timing = getOrderTiming({ fulfillment_type, status: 'new', created_at: '2026-11-17T15:00:00Z', scheduled_time: scheduledOrderTimestamp('2026-11-17T13:00') }, Date.parse('2026-11-17T17:00:00Z'));
    assert.equal(timing.current.key, 'scheduled');
    assert.equal(timing.operationalTotalMs, 0);
  }
});
