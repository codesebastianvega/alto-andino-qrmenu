import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMenuLocation, getLocationPrice, resolveCartPrices, resolveCurrentMenuProduct } from '../src/utils/menuPricing.js';
import { getProductPlaceholder } from '../src/utils/productPlaceholder.js';
const locations = [{ id: 'main', is_main: true }, { id: 'north' }, { id: 'closed', is_active: false }];
const coffee = { id: 'coffee', price: 5500 };

test('public default, QR aliases, valid selection and foreign/inactive locations', () => {
  assert.equal(resolveMenuLocation(locations, 'all').id, 'main');
  assert.equal(resolveMenuLocation(locations, 'foreign').id, 'main');
  assert.equal(resolveMenuLocation(locations, 'north').id, 'north');
  for (const alias of ['loc','location_id','sede_id']) {
    assert.equal(resolveMenuLocation(locations, 'all', `?${alias}=north`).id, 'north');
  }
  assert.equal(resolveMenuLocation(locations, 'all', '?loc=closed').id, 'main');
  assert.equal(resolveMenuLocation([], 'foreign'), null);
  assert.equal(resolveMenuLocation([{id:'only'}], 'all').id, 'only');
});

test('location override precedes base; no override falls back; zero is valid; DB is immutable', () => {
  const original = JSON.stringify(coffee);
  assert.equal(getLocationPrice(coffee, new Map([['coffee',5000]])),5000);
  assert.equal(getLocationPrice(coffee, new Map([['coffee',6500]])),6500);
  assert.equal(getLocationPrice(coffee, new Map()),5500);
  assert.equal(getLocationPrice(coffee, new Map([['coffee',null]])),5500);
  assert.equal(getLocationPrice(coffee, new Map([['coffee',0]])),0);
  assert.equal(JSON.stringify(coffee),original);
});

test('cart location change retains extras, quantity, notes and independent product prices', () => {
  const items = [{id:'coffee',price:6000,catalog_price:5000,base_plan_price:5000,qty:2,note:'Sin azúcar',options:{extra:'Leche'},location_id:'main'},
    {id:'croissant',price:7000,catalog_price:7000,qty:1,location_id:'main'}];
  const original = structuredClone(items);
  const next = resolveCartPrices(items,[{id:'coffee',price:6500},{id:'croissant',price:7000}],'north');
  assert.equal(next[0].price,7500);
  assert.equal(next[0].base_plan_price,6500);
  assert.equal(next[0].qty,2);
  assert.equal(next[0].note,'Sin azúcar');
  assert.deepEqual(next[0].options,items[0].options);
  assert.equal(next[1].price,7000);
  assert.deepEqual(items,original);
  assert.deepEqual(resolveCartPrices(next,[{id:'coffee',price:6500},{id:'croissant',price:7000}],'north'),next);
});

test('custom and historical unbound cart lines are not repriced speculatively', () => {
  const custom = {id:'coffee',price:2000,qty:1};
  assert.equal(resolveCartPrices([custom],[{id:'coffee',price:5000}],'main')[0],custom);
  const bound = {...custom,catalog_price:2000};
  assert.equal(resolveCartPrices([bound],[],'main')[0],bound);
});

test('legacy QuickView and plain normalized catalog lines adopt the effective price without losing extras', () => {
  const products=[{id:'coffee',price:5000}];
  const qv={id:'coffee',price:6500,base_plan_price:5500,options:{extra:'Leche'},qty:2};
  const plain={id:'coffee',price:5500,_supabase:{id:'coffee'},qty:1};
  const next=resolveCartPrices([qv,plain],products,'main');
  assert.equal(next[0].price,6000);
  assert.equal(next[0].qty,2);
  assert.equal(next[1].price,5000);
});

test('missing photos have category-specific local placeholders without an external request', () => {
  const drink=getProductPlaceholder({name:'Café americano'});
  const bread=getProductPlaceholder({name:'Croissant'});
  const meal=getProductPlaceholder({categoryName:'Platos fuertes'});
  assert.ok(drink.startsWith('data:image/svg+xml,'));
  assert.notEqual(drink,bread);
  assert.notEqual(meal,bread);
  assert.match(decodeURIComponent(meal),/Fotografía pendiente/);
});

test('QuickView refreshes catalog fields without dropping local membership metadata', () => {
  const requested={id:'coffee',catalog_price:5000,price:5000,is_plan_bowl:true,plan_code:'PLAN-TEST',name:'old'};
  const resolved=resolveCurrentMenuProduct(requested,[{id:'coffee',price:6500,catalog_price:6500,name:'current'}]);
  assert.equal(resolved.price,6500);
  assert.equal(resolved.name,'current');
  assert.equal(resolved.is_plan_bowl,true);
  assert.equal(resolved.plan_code,'PLAN-TEST');
  assert.equal(resolveCurrentMenuProduct(requested,[]),null);
});
