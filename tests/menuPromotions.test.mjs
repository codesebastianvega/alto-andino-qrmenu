import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { resolveMenuSettings, isMenuPromotionActive } from '../src/utils/menuPromotions.js';

const brand={id:'business',slug:'cafe',name:'Café'};
const special=(price,id='daily_special_config',enabled=true)=>({id,enabled,manual_override_product_id:'coffee',promo_price:price});
const main={id:'main-settings',brand_id:brand.id,location_id:'main',brand_concepts:[special(4500)]};
const north={id:'north-settings',brand_id:brand.id,location_id:'north',brand_concepts:[special(6000)]};
const getSpecial=settings=>settings?.brand_concepts.find(concept=>['daily_special_config','bento_del_dia_config'].includes(concept.id));

test('settings resolve after loading and on location change, without inheriting another location promotion',()=>{
  assert.equal(resolveMenuSettings([],brand,'north'),null);
  assert.equal(getSpecial(resolveMenuSettings([main,north],brand,'north')).promo_price,6000);
  assert.equal(getSpecial(resolveMenuSettings([main,north],brand,'main')).promo_price,4500);
  assert.equal(getSpecial(resolveMenuSettings([main],brand,'north')),undefined);
  assert.equal(getSpecial(resolveMenuSettings([main,north],brand,null)),undefined);
  const unknownScope={...main};delete unknownScope.location_id;
  assert.equal(getSpecial(resolveMenuSettings([unknownScope],brand,'north')),undefined);
});

test('explicit global special and plans preserve their existing precedence, including aliases and disabled state',()=>{
  const global={id:'global',brand_id:brand.id,location_id:null,brand_concepts:[special(5200,'bento_del_dia_config'),{id:'meal_plans_config',plans:[]}]};
  for(const location of ['main','north']) {
    const settings=resolveMenuSettings([main,north,global],brand,location);
    assert.equal(getSpecial(settings).promo_price,5200);
    assert.equal(settings.brand_concepts.filter(concept=>['daily_special_config','bento_del_dia_config'].includes(concept.id)).length,1);
    assert.ok(settings.brand_concepts.some(concept=>concept.id==='meal_plans_config'));
  }
  global.brand_concepts=[special(5200,'bento_del_dia_config',false)];
  assert.equal(getSpecial(resolveMenuSettings([main,north,global],brand,'north')).enabled,false);
});

test('cross-business data cannot supply settings or branding, and rows are not mutated',()=>{
  const foreign={...north,brand_id:'other',brand_concepts:[special(1)],logo_url:'https://foreign.invalid/logo.jpg'};
  const rows=JSON.parse(JSON.stringify([foreign,main,north]));
  const before=JSON.stringify(rows);
  rows.forEach(row=>{Object.freeze(row.brand_concepts);Object.freeze(row);});Object.freeze(rows);
  const result=resolveMenuSettings(rows,brand,'north');
  assert.equal(getSpecial(result).promo_price,6000);
  assert.equal(result.logo_url,undefined);
  assert.equal(JSON.stringify(rows),before);
  assert.equal(resolveMenuSettings([foreign],brand,'north'),null);
});

test('cached row collection resolves each location and does not retain the previous selected settings',()=>{
  const cache=JSON.parse(JSON.stringify({restaurantSettingsRows:[main,north]}));
  assert.equal(getSpecial(resolveMenuSettings(cache.restaurantSettingsRows,brand,'north')).promo_price,6000);
  assert.equal(getSpecial(resolveMenuSettings(cache.restaurantSettingsRows,brand,'main')).promo_price,4500);
  assert.equal(getSpecial(resolveMenuSettings(cache.restaurantSettingsRows,brand,'north')).promo_price,6000);
  cache.restaurantSettingsRows[0]={...main,brand_concepts:[special(3000)]};
  assert.equal(getSpecial(resolveMenuSettings(cache.restaurantSettingsRows,brand,'north')).promo_price,6000);
});

const now=new Date('2026-11-20T15:00:00Z');
const campaign={brand_id:brand.id,location_id:'main',is_active:true};
test('campaign scope requires the same business and an exact location, or an explicitly global row',()=>{
  assert.equal(isMenuPromotionActive(campaign,brand.id,'main',now),true);
  assert.equal(isMenuPromotionActive(campaign,brand.id,'north',now),false);
  assert.equal(isMenuPromotionActive(campaign,brand.id,null,now),false);
  assert.equal(isMenuPromotionActive({...campaign,location_id:null},brand.id,'north',now),true);
  assert.equal(isMenuPromotionActive({...campaign,brand_id:'other',location_id:null},brand.id,'north',now),false);
  assert.equal(isMenuPromotionActive({...campaign,brand_id:null,location_id:null},brand.id,'north',now),false);
  const unknownScope={...campaign};delete unknownScope.location_id;
  assert.equal(isMenuPromotionActive(unknownScope,brand.id,'north',now),false);
});

test('campaign activity, dates and usage limits remain enforced at inclusive boundaries',()=>{
  for(const changes of [{is_active:false},{start_date:'2026-11-21'},{end_date:'2026-11-19'},
    {start_date:'invalid'},{end_date:'invalid'},{usage_limit:2,usage_count:2}]) {
    assert.equal(isMenuPromotionActive({...campaign,...changes},brand.id,'main',now),false);
  }
  assert.equal(isMenuPromotionActive({...campaign,start_date:now.toISOString(),end_date:now.toISOString(),usage_limit:2,usage_count:1},brand.id,'main',now),true);
  assert.equal(isMenuPromotionActive({...campaign,usage_limit:0,usage_count:99},brand.id,'main',now),true);
});

test('actual cart coupon selection excludes the previous location and preserves global coupons and meal-plan behavior',()=>{
  const source=fs.readFileSync('src/components/CartModal.jsx','utf8');
  const start=source.indexOf('const effectivePromo = ');
  const end=source.indexOf(';',start);
  assert.ok(start>=0&&end>start);
  const expression=source.slice(start+'const effectivePromo = '.length,end);
  const automatic={id:'global-automatic'};
  const choose=(coupon,locationId)=>vm.runInNewContext(`(${expression})`,{appliedCoupon:coupon,automaticDiscountPromo:automatic,activeBrandId:brand.id,currentLocation:{id:locationId},isMenuPromotionActive});
  assert.equal(choose(campaign,'north'),automatic);
  assert.equal(choose(campaign,'main'),campaign);
  const global={...campaign,location_id:null};
  assert.equal(choose(global,'north'),global);
  const plan={is_meal_plan:true};
  assert.equal(choose(plan,'north'),plan);
});
