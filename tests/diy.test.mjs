import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDIYGroups, calculateDIYGroupPrice, getDIYSummary, getDIYOrderOptions, pruneDIYSelections, removeDIYPortion, wouldCreateDIYCycle } from '../src/utils/diy.js';

// Deliberately unrelated to food: the DIY engine must work for any catalog.
const rawGroups = [
  { id: 'material', name: 'Material', is_required: true, min_select: 1, max_select: 3, allow_quantity: true, included_quantity: 1,
    modifier_options: [
      { id: 'wood', name: 'Wood', image_url: '/img/raw.webp', price: 0, extra_price: 6, nested_group_id: 'finish' },
      { id: 'metal', name: 'Metal', price: 4, extra_price: 8, nested_group_id: 'finish' },
      { id: 'old', name: 'Old', is_active: false }, { id: 'out', stock_status: 'out' }, { id: 'zero', available_portions: 0 },
    ] },
  { id: 'finish', name: 'Finish', is_submodifier: false, is_required: true, min_select: 1, max_select: 1, included_quantity: 1,
    modifier_options: [
      { id: 'matte', name: 'Matte', image_url: '/img/matte.webp', price: 0 },
      { id: 'gloss', name: 'Gloss', image_url: '/img/gloss.webp', price: 2 },
    ] },
];
const build = (selections = {}, extra = {}) => buildDIYGroups({ assignedGroups: ['material', 'finish'], rawGroups, modifiers: {}, selections, ...extra });

test('children are conditional even with an incorrect submodifier flag; unavailable options never appear', () => {
  const groups = build(); assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].items.map(item => item.id), ['wood', 'metal']);
  const selected = build({ material: ['wood'] });
  assert.equal(selected[1].is_submodifier, true); assert.equal(selected[1].min, 1);
  assert.equal(build({}, { modifiers: { material: [] } })[0].items.length, 0);
});

test('two portions and shared child groups have independent preparations and images', () => {
  const selections = { material: ['wood', 'wood', 'metal'], 'material/wood/0/finish': ['matte'], 'material/wood/1/finish': ['gloss'], 'material/metal/0/finish': ['matte'] };
  const groups = build(selections); assert.equal(groups.length, 4);
  const summary = getDIYSummary(groups, selections);
  assert.equal(summary.length, 3);
  assert.deepEqual(summary.map(row => row.name), ['Wood · Matte', 'Wood · Gloss', 'Metal · Matte']);
  assert.deepEqual(summary.map(row => row.image_url), ['/img/matte.webp', '/img/gloss.webp', '/img/matte.webp']);
  assert.deepEqual(getDIYOrderOptions(groups, selections), { Material: ['Wood · Matte', 'Wood · Gloss', 'Metal · Matte'] });
  assert.equal(groups.reduce((total, group) => total + calculateDIYGroupPrice(group, selections[group.selectionKey]), 0), 16);
});

test('zero extra prices stay zero regardless of names; premiums and repeated portions use configured values', () => {
  const group = { name: 'Proteína Base Crunch', included_quantity: 1, items: [{ id: 'free', price: 0, extra_price: 0 }] };
  assert.equal(calculateDIYGroupPrice(group, ['free', 'free']), 0);
  assert.equal(calculateDIYGroupPrice(build()[0], ['wood', 'wood']), 6);
  assert.equal(calculateDIYGroupPrice(build()[0], ['metal']), 4);
});

test('remove a specific portion, keep and reindex the surviving preparation', () => {
  const selections = { material: ['wood', 'wood'], 'material/wood/0/finish': ['matte'], 'material/wood/1/finish': ['gloss'] };
  const next = removeDIYPortion(selections, 'material', 'wood', 0);
  assert.deepEqual(next.material, ['wood']); assert.deepEqual(next['material/wood/0/finish'], ['gloss']);
  assert.equal(getDIYSummary(build(next), next)[0].name, 'Wood · Gloss');
  const empty = removeDIYPortion(next, 'material', 'wood');
  assert.deepEqual(pruneDIYSelections(build(empty), empty), {});
});

test('switching or exhausting a parent removes its old preparation', () => {
  const selections = { material: ['metal'], 'material/wood/0/finish': ['gloss'] };
  assert.deepEqual(pruneDIYSelections(build(selections), selections), { material: ['metal'] });
  const context = { material: [] };
  assert.deepEqual(pruneDIYSelections(build(selections, { modifiers: context }), selections), {});
});

test('image before preparing comes from the ingredient; missing images are not guessed by name', () => {
  const selected = { material: ['wood'] };
  assert.equal(getDIYSummary(build(selected), selected)[0].image_url, '/img/raw.webp');
  const unknown = { material: ['metal'] };
  assert.equal(getDIYSummary(build(unknown), unknown)[0].image_url, null);
});

test('cycles are rejected by configuration and bounded in rendering', () => {
  assert.equal(wouldCreateDIYCycle(rawGroups, 'finish', 'material'), true);
  assert.equal(wouldCreateDIYCycle(rawGroups, 'material', 'finish'), false);
  assert.equal(wouldCreateDIYCycle(rawGroups, 'material', 'material'), true);
});

test('product overrides respect explicit zero limits and included quantities', () => {
  const groups = build({}, { config: { material: { min: 0, max: 0, included: 0 } } });
  assert.equal(groups[0].min, 0); assert.equal(groups[0].max, 0); assert.equal(groups[0].included_quantity, 0);
});
