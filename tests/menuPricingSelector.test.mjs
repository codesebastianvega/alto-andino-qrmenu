import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { getLocationPrice } from '../src/utils/menuPricing.js';
import { getVisibilityLocationId } from '../src/utils/productVisibility.js';
import { resolveMenuSettings } from '../src/utils/menuPromotions.js';
const source=fs.readFileSync('src/context/MenuDataContext.jsx','utf8');
const marker='const productsByCategory = useMemo(() => {';
const start=source.indexOf(marker)+marker.length;
const end=source.indexOf('\n  }, [rawProducts',start);
assert.ok(start>=marker.length&&end>start);
const selector=source.slice(start,end);
const product={id:'coffee',name:'Café',price:5500,is_active:true,stock_status:'in',categories:{slug:'breakfast'}};
function catalog(extra={}) {
  return vm.runInNewContext(`(()=>{${selector}})()`,{
    rawProducts:[product],locationPrices:[{location_id:'main',product_id:'coffee',price:5000},{location_id:'north',product_id:'coffee',price:6500}],
    locationStatus:[],activeLocationId:'main',currentLocation:{id:'main'},isAdminContext:false,
    restaurantSettings:{},allCategories:[{id:'breakfast',slug:'breakfast',name:'Breakfast'}],brand:{},activeBrandId:'business',rawModifierGroups:[],
    isStorePausedForPublic:false,getCategoryScheduleInfo:()=>({isAvailableNow:true}),getVisibilityLocationId,getLocationPrice,getProductImage:()=>'/test.jpg',
    ...extra,
  });
}
test('actual selector uses site price, preserves base/admin view, and includes effective context',()=>{
  assert.equal(catalog().breakfast[0].price,5000);
  assert.equal(catalog({activeLocationId:'north',currentLocation:{id:'north'}}).breakfast[0].price,6500);
  assert.equal(catalog({isAdminContext:true,activeLocationId:'all'}).breakfast[0].price,5500);
  assert.equal(catalog({locationPrices:[]}).breakfast[0].price,5500);
  assert.equal(catalog().breakfast[0].catalog_price,5000);
  assert.equal(catalog().breakfast[0].location_id,'main');
  assert.equal(catalog().breakfast[0].brand_id,'business');
  assert.equal(Object.keys(catalog({currentLocation:null,activeLocationId:null})).length,0);
});
test('actual selector never publishes global inactive, unavailable, site-hidden or addon products',()=>{
  for(const change of [{is_active:false},{stock_status:'out'},{is_addon:true}]) assert.equal(Object.keys(catalog({rawProducts:[{...product,...change}]})).length,0);
  for(const change of [{is_active:false,stock_status:'in'},{is_active:true,stock_status:'out'}]) {
    assert.equal(Object.keys(catalog({locationStatus:[{location_id:'main',product_id:'coffee',...change}]})).length,0);
    assert.equal(catalog({activeLocationId:'north',currentLocation:{id:'north'},locationStatus:[{location_id:'main',product_id:'coffee',...change}]}).breakfast[0].price,6500);
  }
});
test('actual selector retains configured daily-special precedence over site price',()=>{
  const settings={brand_concepts:[{id:'daily_special_config',enabled:true,manual_override_product_id:'coffee',promo_price:4500}]};
  const coffee=catalog({restaurantSettings:settings}).breakfast[0];
  assert.equal(coffee.price,4500);
  assert.equal(coffee.original_price,5000);
});

test('actual selector uses North 6000 and Principal 4500, preserving explicit global promotions',()=>{
  const make=(location_id,price)=>({brand_id:'business',location_id,brand_concepts:[{id:'daily_special_config',enabled:true,manual_override_product_id:'coffee',promo_price:price}]});
  const rows=[make('main',4500),make('north',6000)];
  const select=(location,settingsRows)=>catalog({activeLocationId:location,currentLocation:{id:location},restaurantSettings:resolveMenuSettings(settingsRows,{id:'business'},location)}).breakfast[0];
  assert.equal(select('north',rows).price,6000);
  assert.equal(select('main',rows).price,4500);
  assert.equal(select('north',[rows[0]]).price,6500);
  assert.equal(select('north',[...rows,make(null,5200)]).price,5200);
});

test('disabled specials cannot apply a manual override or secondary promotional prices',()=>{
  const settings={brand_concepts:[{id:'daily_special_config',enabled:false,manual_override_product_id:'coffee',promo_price:4500,secondary_product_ids:['coffee'],custom_prices:{coffee:{promo_price:1}}}]};
  const coffee=catalog({restaurantSettings:settings}).breakfast[0];
  assert.equal(coffee.price,5000);
  assert.equal(coffee.is_daily_special,false);
});
