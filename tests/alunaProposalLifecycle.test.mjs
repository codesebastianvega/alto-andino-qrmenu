import test from 'node:test';
import assert from 'node:assert/strict';
import { createProposalLifecycle } from '../src/utils/alunaProposalLifecycle.js';
import { canApproveConversationCard, invalidateConversationProposals } from '../src/utils/alunaConversation.js';
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

test('replaced intent, product, location or business invalidates old permits even when returning to the original context', async () => {
  for (const change of ['intent', 'product', 'location', 'business']) {
    const gate = createProposalLifecycle();
    const old = gate.snapshot();
    gate.replace();
    gate.replace();
    let writes = 0;
    assert.equal(await gate.execute(old, async () => { writes++; }), false, change);
    assert.equal(writes, 0);
    assert.equal(await gate.execute(gate.snapshot(), async () => { writes++; }), true);
    assert.equal(writes, 1);
  }
});
test('every operation is single-use synchronously, during and after a double click', async () => {
  for (const operation of ['price','visibility','hours','catalog','location','recipe','operations','web','purchase','inventory','venue','consolidation']) {
    const gate = createProposalLifecycle();
    const pending = deferred();
    const ticket = gate.snapshot();
    let calls = 0;
    const first = gate.execute(ticket, async () => { calls++; await pending.promise; });
    assert.equal(await gate.execute(ticket, async () => { calls++; }), false, operation);
    assert.equal(gate.canApprove(ticket), false);
    pending.resolve(); await first;
    assert.equal(await gate.execute(ticket, async () => { calls++; }), false);
    assert.equal(calls, 1);
  }
});
test('late success, failure and audit callbacks cannot publish in a newer context', async () => {
  const gate = createProposalLifecycle();
  const pending = deferred();
  const published = [];
  const first = gate.execute(gate.snapshot(), async (isCurrent) => { await pending.promise; if (isCurrent()) published.push('old'); });
  gate.replace();
  assert.equal(await gate.execute(gate.snapshot(), async () => published.push('parallel')), false);
  pending.resolve(); await first;
  await gate.execute(gate.snapshot(), async (isCurrent) => { if (isCurrent()) published.push('new'); });
  assert.deepEqual(published, ['new']);
});
test('uncertain failures do not release the same approval for a retry', async () => {
  const gate = createProposalLifecycle();
  const ticket = gate.snapshot();
  await assert.rejects(gate.execute(ticket, async () => { throw new Error('lost response'); }));
  assert.equal(gate.canApprove(ticket), false);
  assert.equal(await gate.execute(ticket, async () => assert.fail('duplicate')), false);
});
test('missing turn IDs and terminal tasks never authorize; history stays visible', () => {
  assert.equal(canApproveConversationCard({}, undefined), false);
  const card = { turnId:'turn', binding:{scope:'brand:location',operation:'price',productId:'coffee'} };
  for (const status of ['executed','unconfirmed','dismissed']) assert.equal(canApproveConversationCard(card,'turn',{scope:'brand:location',operation:'price',product:{id:'coffee'},status}),false);
  const messages = [{role:'assistant',content:'Café $5.000 → $5.500',card}];
  assert.equal(invalidateConversationProposals([{...messages[0],card:{...card,type:'proposal'}}])[0].content,messages[0].content);
});
