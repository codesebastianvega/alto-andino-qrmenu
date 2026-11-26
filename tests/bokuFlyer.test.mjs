import test from 'node:test';
import assert from 'node:assert/strict';
import { FLYER, getFlyerCatalog, getFlyerLayout, initialFlyerSelection, validateSelection, minimumPrice } from '../src/components/admin/boku-flyer/flyerModel.js';
const dish = (id,categorySlug='boku-bentos',price=22000) => ({id,name:id,categorySlug,price,image_url:`/${id}.jpg`});
test('deduplicates category aliases and retains actual sale and original prices',()=>{
 const p={...dish('a','boku-pastas-ramen',19000),original_price:26000};
 const c=getFlyerCatalog([p,{...p,categorySlug:'boku-bentos'},dish('b')]);
 assert.equal(c.eligible.length,2);assert.equal(c.eligible[0].basePrice,26000);assert.equal(c.eligible[0].currentPrice,19000);
});
test('starting price follows current selected prices including 28000 instead of base prices',()=>{
 const c=getFlyerCatalog([{...dish('poke','boku-bowls',28000),original_price:32000},dish('other','boku-bowls',30000)]);
 assert.equal(c.pokePrice,28000);assert.equal(minimumPrice([c.pokes[1]]),30000);assert.equal(minimumPrice([]),null);
});
test('requires two distinct promos and prohibits duplicates across all three galleries',()=>{
 const c=getFlyerCatalog([dish('a'),dish('b'),dish('c')]);
 assert.match(validateSelection(c,['a'],[]),/exactamente/);assert.match(validateSelection(c,['a','b'],['c'],['c']),/a la vez/);
 assert.equal(validateSelection(c,['a','b'],[],['c']),'');
});
test('default proposal fills six main dishes and keeps extra photos distinct',()=>{
 const c=getFlyerCatalog([...Array.from({length:6},(_,i)=>dish(`b${i}`)),dish('pasta1','boku-pastas-ramen'),dish('pasta2','boku-pastas-ramen'),dish('poke','boku-bowls',28000)]);
 const s=initialFlyerSelection(c.eligible,c.otherCandidates,c.pokes);
 assert.equal(s.otherIds.length,6);assert.equal(s.extraIds.length,1);assert.equal(new Set([...s.dailyIds,...s.otherIds,...s.extraIds]).size,9);
});
test('fits two promos, six gallery dishes and three photographed extras without a fixed four-photo cap',()=>{
 assert.ok(getFlyerLayout(6,3).fits);assert.equal(getFlyerLayout(6,3).columns,3);assert.ok(getFlyerLayout(9,0).fits);assert.equal(getFlyerLayout(30,3).fits,false);
 assert.equal(FLYER.width*FLYER.pixelRatio,2160);assert.equal(FLYER.height*FLYER.pixelRatio,2700);
});

import { draftKey, parseDraft } from '../src/components/admin/boku-flyer/flyerDraft.js';
test('saved design isolates accounts and restores choices without freezing catalog prices',()=>{
 assert.notEqual(draftKey('boku','one'),draftKey('boku','two'));
 assert.equal(draftKey('boku',null),null);
 const parsed=parseDraft(JSON.stringify({version:1,dailyIds:['a','a','b'],otherIds:['c'],extraIds:['p'],copy:{includes:'Sopa + jugo'},names:{a:'Mi plato'},showExtras:false,price:1,images:{fake:'ignored'}}));
 assert.deepEqual(parsed.dailyIds,['a','b']);assert.equal(parsed.copy.includes,'Sopa + jugo');assert.equal(parsed.showExtras,false);
 assert.equal(parsed.price,undefined);assert.equal(parsed.images,undefined);
 assert.match(validateSelection(getFlyerCatalog([dish('a'),dish('b')]),parsed.dailyIds,parsed.otherIds),/catálogo cambió/);
});
test('invalid drafts fail safely and unsupported versions do not replace defaults',()=>{
 assert.equal(parseDraft('{bad'),null);assert.equal(parseDraft('{"version":2}'),null);
 const parsed=parseDraft(JSON.stringify({version:1,copy:{title:'x'.repeat(200)},dailyIds:[1,null,'a'],names:[] }));
 assert.equal(parsed.copy.title.length,40);assert.deepEqual(parsed.dailyIds,['a']);assert.deepEqual(parsed.names,{});
});
