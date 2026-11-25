import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeLoans, financingEntries, applyFinancingToAccounts } from '../src/utils/financeLoans.js';

const loan = { id: 'loan', kind: 'loan', lender: 'Prestamista', amount: 200000, interest_agreed: 0, received_on: '2026-11-20', due_on: '2026-11-30', destination: 'pocket', account_id: 'cash', account_name: 'Efectivo' };
const payment = { id: 'payment', loan_id: 'loan', principal: 80000, interest: 0, account_id: 'cash', account_name: 'Efectivo', paid_on: '2026-11-25', created_at: '2026-11-25T18:00:00Z' };

test('approved example: loan, supplies, customer collection and repayment yield 90000 cash and 120000 debt', () => {
  // Existing Finance accounts already include opening cash, the expense and collection.
  const accounts = [{ id: 'cash', balance: 20000 - 150000 + 100000 }];
  assert.equal(applyFinancingToAccounts(accounts, [loan], [payment])[0].balance, 90000);
  assert.equal(summarizeLoans([loan], [payment], '2026-11-25')[0].balanceDue, 120000);
  assert.equal(financingEntries([loan], [payment]).expenses.length, 0, 'principal repayment is not an operating expense');
});

test('purchase paid by lender creates expense and debt without changing pockets', () => {
  const direct = { ...loan, destination: 'direct_purchase', account_id: null, amount: 150000, expense_category: 'Insumos', description: 'Compra de arroz' };
  assert.equal(applyFinancingToAccounts([{ id: 'cash', balance: 20000 }], [direct], [])[0].balance, 20000);
  assert.equal(summarizeLoans([direct], [])[0].principalDue, 150000);
  const entries = financingEntries([direct], []);
  assert.equal(entries.expenses[0].amount, 150000);
  assert.equal(entries.expenses[0].source, 'financing');
  assert.equal(entries.ledger.length, 2);
});

test('interest is an expense once, while both principal and interest leave the paying pocket', () => {
  const p = { ...payment, interest: 10000, account_id: 'bank' };
  const l = { ...loan, interest_agreed: 30000 };
  const balances = applyFinancingToAccounts([{ id: 'cash', balance: 0 }, { id: 'bank', balance: 100000 }], [l], [p]);
  assert.equal(balances[0].balance, 200000);
  assert.equal(balances[1].balance, 10000);
  assert.equal(financingEntries([l], [p]).expenses.reduce((s, e) => s + e.amount, 0), 10000);
  assert.equal(summarizeLoans([l], [p])[0].interestDue, 20000);
});

test('contributions add liquidity without creating debt', () => {
  const l = { ...loan, kind: 'contribution' };
  assert.equal(summarizeLoans([l], [])[0].balanceDue, 0);
  assert.equal(summarizeLoans([l], [])[0].status, 'Aporte');
  assert.equal(applyFinancingToAccounts([{ id: 'cash', balance: 0 }], [l], [])[0].balance, 200000);
});

test('opening balances exclude earlier cash movements, but do not erase outstanding debt', () => {
  assert.equal(applyFinancingToAccounts([{ id: 'cash', balance: 500000 }], [loan], [payment], '2026-11-24T15:00:00Z')[0].balance, 420000);
  assert.equal(summarizeLoans([loan], [payment], '2026-12-01')[0].status, 'Vencido');
  assert.equal(summarizeLoans([loan], [{ ...payment, principal: 200000 }])[0].status, 'Saldado');
});

test('recalculation does not mutate source accounts, payments or loans', () => {
  const accounts = [{ id: 'cash', balance: 20 }];
  const original = JSON.stringify({ accounts, loan, payment });
  for (let i=0; i<3; i++) assert.equal(applyFinancingToAccounts(accounts, [loan], [payment])[0].balance, 120020);
  assert.equal(JSON.stringify({ accounts, loan, payment }), original);
});
