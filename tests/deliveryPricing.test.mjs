import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDeliveryCoverage, defaultDeliveryRules, getDeliveryRules, hasActiveDeliveryRules, validateDeliveryRules, calculateDeliveryTariff, estimateDistanceMeters, quoteDeliveryFromPins } from '../src/utils/deliveryPricing.js';
const rules = { ...defaultDeliveryRules(), enabled: true };
const origin = { lat: 5.017463, lng: -73.999929 };
const location = { id: 'sede', latitude: origin.lat, longitude: origin.lng, delivery_pricing_rules: rules };

test('public checkout requires a pin and a finite limit from the serving branch', () => {
  const zipaquira = { ...location, delivery_radius_km: 0.8 };
  const chia = { lat: 4.861, lng: -74.058 };
  assert.equal(checkDeliveryCoverage(zipaquira, null).status, 'needs_pin');
  assert.equal(checkDeliveryCoverage(zipaquira, chia).status, 'outside_coverage');
  assert.equal(checkDeliveryCoverage(zipaquira, origin).ready, true);
  assert.equal(checkDeliveryCoverage(location, origin).status, 'needs_coverage');
  assert.equal(checkDeliveryCoverage({ ...zipaquira, latitude: chia.lat, longitude: chia.lng }, chia).ready, true);
});

test('loading, missing location and absent configuration never crash or enable delivery pricing', () => {
  for (const absent of [undefined, null, {}, { delivery_pricing_rules: null }]) {
    assert.equal(getDeliveryRules(absent).enabled, false);
    assert.equal(hasActiveDeliveryRules(absent), false);
    const quote = quoteDeliveryFromPins(absent, origin, 50000);
    assert.equal(quote.status, 'needs_origin');
    assert.equal(quote.ready, false);
    assert.equal(quote.fee, null);
  }
});

test('null during load or failed lookup does not mutate the existing rules when the location arrives', () => {
  const savedRules = Object.freeze({ ...rules, baseFee: 7000, extraKmFee: 2000 });
  const savedLocation = Object.freeze({ ...location, delivery_pricing_rules: savedRules });
  const before = JSON.stringify(savedLocation);
  assert.equal(quoteDeliveryFromPins(null, origin).ready, false);
  assert.deepEqual(getDeliveryRules(savedLocation), savedRules);
  assert.equal(calculateDeliveryTariff(getDeliveryRules(savedLocation), 3500).fee, 9000);
  assert.equal(quoteDeliveryFromPins(undefined, origin).fee, null);
  assert.equal(JSON.stringify(savedLocation), before);
});
test('500m free, 5001 base, extras start after 3km without rounding', () => {
  for (const [distance, fee] of [[0,0],[500,0],[500.1,5000],[501,5000],[3000,5000],[3000.1,6500],[4000,6500],[4000.1,8000],[12000,18500]]) assert.equal(calculateDeliveryTariff(rules,distance).fee,fee);
});
test('all prices and thresholds are configurable including zero extra fee', () => {
  assert.equal(calculateDeliveryTariff({...rules,freeDistanceM:1000},900).fee,0);
  assert.equal(calculateDeliveryTariff({...rules,baseFee:7000,extraKmFee:2000},4000).fee,9000);
  assert.equal(calculateDeliveryTariff({...rules,extraKmFee:0},4000).fee,5000);
  assert.equal(calculateDeliveryTariff({...rules,extraKmMode:'proportional'},3500).fee,5750);
});
test('no elevation or vehicle data is required or charged', () => {
  assert.equal(calculateDeliveryTariff({...rules,ascentEnabled:true,ascentFee:2000},3600).fee,6500);
});
test('missing pin is never zero fee and cannot be quoted', () => {
  for(const d of [null,undefined,NaN,-1,Infinity,'500']) {const result=calculateDeliveryTariff(rules,d); assert.equal(result.ready,false); assert.equal(result.fee,null);}
  assert.equal(quoteDeliveryFromPins(location,null).status,'needs_pin');
  assert.equal(quoteDeliveryFromPins({...location,latitude:null},origin).status,'needs_origin');
});
test('pin precision is preserved and geodesic estimate works at zero coordinates', () => {
  assert.equal(estimateDistanceMeters({lat:0,lng:0},{lat:0,lng:0}),0);
  assert(Math.abs(estimateDistanceMeters({lat:0,lng:0},{lat:0,lng:0.01})-1389.9366)<0.01);
  assert.equal(estimateDistanceMeters({lat:91,lng:0},origin),null);
  assert.equal(estimateDistanceMeters({lat:null,lng:0},origin),null);
  assert.equal(quoteDeliveryFromPins(location,origin).fee,0);
});
test('a moved pin recalculates for new distance and current sede', () => {
  const near={lat:origin.lat+0.001,lng:origin.lng};const far={lat:origin.lat+0.03,lng:origin.lng};
  assert.equal(quoteDeliveryFromPins(location,near).fee,0);
  assert(quoteDeliveryFromPins(location,far).fee>5000);
  assert.equal(quoteDeliveryFromPins({...location,latitude:far.lat},far).fee,0);
});
test('coverage checked before free purchase promotion, zero max means no cap', () => {
  const restricted={...location,free_delivery_threshold:10000,delivery_pricing_rules:{...rules,maxDistanceM:3000}};
  const far={lat:origin.lat+0.03,lng:origin.lng};
  assert.equal(quoteDeliveryFromPins(restricted,far,50000).status,'outside_coverage');
  assert.equal(calculateDeliveryTariff(rules,20000).ready,true);
  assert.equal(calculateDeliveryTariff({...rules,maxDistanceM:10000},10000.1).ready,false);
});
test('amount promotion is retained only with complete location data', () => {
  const far={lat:origin.lat+0.03,lng:origin.lng};
  const promo={...location,free_delivery_threshold:20000};
  assert.equal(quoteDeliveryFromPins(promo,far,20000).fee,0);
  assert(quoteDeliveryFromPins(promo,far,19999).fee>0);
  assert.equal(quoteDeliveryFromPins(promo,null,50000).ready,false);
});
test('existing venues remain in their old mode until explicitly enabled', () => {
  assert.equal(hasActiveDeliveryRules({}),false);
  assert.equal(hasActiveDeliveryRules({delivery_pricing_rules:{version:1,enabled:true}}),false);
  assert.equal(getDeliveryRules({delivery_pricing_rules:{version:1,ascentEnabled:true}}).enabled,false);
  assert.equal(hasActiveDeliveryRules(location),true);
});
test('invalid rules cannot be saved or quoted', () => {
  assert.deepEqual(validateDeliveryRules(rules),[]);
  for(const change of [{baseFee:-1},{baseFee:5000.5},{freeDistanceM:4000},{baseDistanceM:0},{maxDistanceM:1000},{extraKmFee:null},{enabled:'true'}]) assert.equal(calculateDeliveryTariff({...rules,...change},1000).status,'invalid_rules');
});
