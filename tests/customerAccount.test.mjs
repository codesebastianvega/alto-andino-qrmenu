import test from 'node:test';
import assert from 'node:assert/strict';
import { customerOrderBalance, customerOrderPaymentLabel } from '../src/utils/customerAccount.js';

const order = { id: 'test', brand_id: 'boku', status: 'delivered', payment_status: 'pending', total_amount: 37400, paid_amount: 0 };

test('the reported 57400 balance excludes another brand, unassigned legacy order and discarded test', () => {
  const orders = [order, { ...order, id: 'other', brand_id: 'other', total_amount: 2000 }, { ...order, id: 'legacy', brand_id: null, total_amount: 18000 }];
  const discarded = new Set(['test']);
  assert.equal(orders.reduce((sum, o) => sum + customerOrderBalance(o, 'boku', discarded), 0), 0);
  assert.equal(customerOrderPaymentLabel(order, discarded), 'Prueba descartada');
});

test('cancelled orders never create debt or a pending payment badge', () => {
  const cancelled = { ...order, status: 'cancelled' };
  assert.equal(customerOrderBalance(cancelled, 'boku'), 0);
  assert.equal(customerOrderPaymentLabel(cancelled), 'Sin cobro');
  assert.equal(customerOrderBalance({ ...order, payment_status: 'cancelled' }, 'boku'), 0);
});

test('real outstanding balances retain partial payments and clamp overpayment', () => {
  assert.equal(customerOrderBalance({ ...order, paid_amount: 7400 }, 'boku'), 30000);
  assert.equal(customerOrderBalance({ ...order, payment_method: 'fiado', payment_status: null }, 'boku'), 37400);
  assert.equal(customerOrderBalance({ ...order, paid_amount: 40000 }, 'boku'), 0);
});

test('paid orders are not collected again even with legacy missing paid amount', () => {
  assert.equal(customerOrderBalance({ ...order, payment_status: 'paid', payment_method: 'fiado', paid_amount: null }, 'boku'), 0);
  assert.equal(customerOrderBalance(order, null), 0);
});
