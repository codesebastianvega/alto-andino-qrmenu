import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeIncome } from '../src/utils/financeIncome.js';

test('sales, partial collections, quantities and order adjustments reconcile', () => {
  const result = summarizeIncome([
    { total_amount: 25000, paid_amount: 10000, order_items: [{ product_id: 'a', quantity: 2, unit_price: 10000, modifiers: { _item_name: 'Bowl' } }] },
    { total_amount: 10000, paid_amount: 10000, order_items: [{ product_id: 'a', quantity: 1, unit_price: 10000, modifiers: { _item_name: 'Bowl' } }] },
  ]);
  assert.equal(result.sold, 35000);
  assert.equal(result.collected, 20000);
  assert.equal(result.pending, 15000);
  assert.equal(result.units, 3);
  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].amount, 30000);
  assert.equal(result.adjustments, 5000);
});

test('paid legacy orders without paid_amount and explicit zero remain distinguishable', () => {
  const result = summarizeIncome([{ total_amount: 12000, payment_status: 'paid' }, { total_amount: 9000, payment_status: 'paid', paid_amount: 0 }]);
  assert.equal(result.collected, 12000);
  assert.equal(result.pending, 9000);
  assert.equal(summarizeIncome().sold, 0);
});
