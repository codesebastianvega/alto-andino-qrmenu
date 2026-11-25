import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { isOrderableVisibility, getVisibilityLocationId } from '../src/utils/productVisibility.js';

test('public visibility preserves global and location restrictions independently', () => {
  const active = {is_active:true,stock_status:'in'};
  assert.equal(isOrderableVisibility(active),true);
  for(const product of [null,{...active,is_active:false},{...active,stock_status:'out'}]) assert.equal(isOrderableVisibility(product),false);
  assert.equal(isOrderableVisibility(active,{is_active:false,stock_status:'in'}),false);
  assert.equal(isOrderableVisibility(active,{is_active:true,stock_status:'out'}),false);
  assert.equal(getVisibilityLocationId('all','main',false),'main');
  assert.equal(getVisibilityLocationId('all','main',true),null);
  assert.equal(getVisibilityLocationId('north','main',false),'north');
});

test('actual availability service only selects the requested product/business and location; fails closed', async () => {
  const source=fs.readFileSync('src/services/productAvailability.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export async function','async function');
  for(const hidden of [false,true]) {
    const reads=[];
    const supabase={from(table){const filters={};reads.push({table,filters});return {
      select(){return this;},eq(key,value){filters[key]=value;return this;},
      maybeSingle:async()=>({data:table==='products'?{is_active:true,stock_status:'in'}:{is_active:!hidden,stock_status:'in'},error:null}),
    };}};
    const check=vm.runInNewContext(`${source}; canOrderProductNow`,{supabase,isOrderableVisibility});
    assert.equal(await check('coffee','business','main'),!hidden);
    assert.deepEqual(reads,[{table:'products',filters:{id:'coffee',brand_id:'business'}},{table:'location_product_status',filters:{product_id:'coffee',location_id:'main'}}]);
    assert.equal(await check('coffee',null,'main'),false);
    assert.equal(reads.length,2);
  }
  const supabase={from(){return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:null,error:{message:'unavailable'}})};}};
  const check=vm.runInNewContext(`${source}; canOrderProductNow`,{supabase,isOrderableVisibility});
  assert.equal(await check('coffee','business','main'),false);
});
