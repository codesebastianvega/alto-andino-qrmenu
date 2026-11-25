// Controlled preview smoke: fresh browser, public GET snapshot, all backend writes mocked.
// Run: node tests/menuPricing.preview.mjs (preview on H051_PREVIEW_PORT, default 4182).
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
const env = dotenv.parse(await fs.readFile('.env.local'));
const host = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const brand = 'd10ff259-3b11-408c-99fe-174f278e50f1';
const main = '58f1d5d4-5eb3-4509-8584-ab7ea13d6db4';
const north = '11111111-1111-4111-8111-111111111111';
const coffee = '72f54235-552f-4498-97b2-b2def646d120';
const croissant = 'f10abad9-82e6-447d-b742-102c8060ef11';
const slug = 'caf-bruma-prueba-ux-14-nov-mwgj65c1';
const root = `http://127.0.0.1:${process.env.H051_PREVIEW_PORT || 4182}/${slug}/`;
const out = process.env.H051_EVIDENCE_DIR || (process.argv.includes('--promotions') ? 'docs/deployment/H05/evidence/H05.3' : 'docs/deployment/H05/evidence/H05.1');
await fs.mkdir(out,{recursive:true});
const fixture = {};
const tables = ['brands','categories','modifier_groups','experiences','allergens','locations','promo_banners','home_settings','restaurant_settings','products','business_hours','promotions'];
await Promise.all(tables.map(async table => {
  const select = table === 'brands' ? '*,plans(*,plan_features(*))' : table === 'products' ? '*,categories:category_id(slug)' : '*';
  const query = new URLSearchParams({select,[table === 'brands' ? 'id' : 'brand_id']:`eq.${brand}`});
  const res = await fetch(`${host}/rest/v1/${table}?${query}`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
  if(!res.ok) throw new Error(`Read snapshot ${table}: HTTP ${res.status}`);
  fixture[table] = await res.json();
}));
for(const table of ['location_product_prices','location_product_status','location_categories','location_modifier_groups']) {
  const res = await fetch(`${host}/rest/v1/${table}?location_id=eq.${main}&select=*`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
  if(!res.ok) throw new Error(`Read snapshot ${table}: HTTP ${res.status}`);
  fixture[table]=await res.json();
}
// Snapshot is never altered remotely. A second location exists only in the test browser.
const original = JSON.stringify(fixture);
const browser = await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
let synthetic = true;
let noLocations = false;
let hiddenCoffee = false;
let brokenPhoto = false;
let writesIntercepted=0;
const checkoutCalls=[];
let pendingHeader=null;
let rejectCheckout=false;
let delayCheckout=false;
let pendingCheckout;
let checkoutResponse='99999999-9999-4999-8999-999999999999';
const errors=[];
const expectedHttpErrors=[];
const results=[];
const ctx=await browser.newContext({serviceWorkers:'block', viewport:{width:1365,height:1000}});
await ctx.addInitScript(({slug,north})=>{
  // Service workers are disabled for deterministic preview tests.
  delete Navigator.prototype.serviceWorker;
  localStorage.setItem(`aluna_welcome_${slug}`,String(Date.now()));
  localStorage.setItem('aa_is_staff_device','true');
  localStorage.setItem('aa_fulfillment_flow','takeaway');
  localStorage.setItem('aa_current_location_id',north);
},{slug,north});
await ctx.route('**/*',async route=>{
  const request=route.request(); const url=new URL(request.url());
  if(brokenPhoto && url.pathname==='/img/products/croissant.jpg') return route.fulfill({status:200,contentType:'image/jpeg',body:'invalid-image-for-fallback-test'});
  if(url.origin!==new URL(host).origin) return route.continue();
  if(url.pathname.includes('/functions/v1/gemini-chat')) {
    writesIntercepted++;
    return route.fulfill({json:{reply:'Esta opción está disponible. Revisa el precio de la tarjeta.',product_ids:[coffee]}});
  }
  if(url.pathname.endsWith('/rpc/create_order_idempotent')) {
    writesIntercepted++; checkoutCalls.push(request.postDataJSON());
    if(delayCheckout) await new Promise(resolve=>{pendingCheckout=resolve});
    return rejectCheckout ? route.fulfill({status:400,json:{code:'P0001',message:'ALUNA_CART_UNAVAILABLE',details:JSON.stringify({product_ids:[coffee]})}})
      : route.fulfill({json:checkoutResponse});
  }
  if(process.argv.includes('--orders') && request.method()==='POST' && url.pathname.endsWith('/orders')) {
    writesIntercepted++;pendingHeader=request.postDataJSON()[0];return route.fulfill({json:{...pendingHeader,id:checkoutResponse}});
  }
  if(process.argv.includes('--orders') && request.method()==='POST' && url.pathname.endsWith('/order_items')) {
    writesIntercepted++;checkoutCalls.push({p_order:pendingHeader,p_items:request.postDataJSON()});return route.fulfill({json:[]});
  }
  if(request.method()!=='GET') { writesIntercepted++;return route.fulfill({status:200,json:[]}); }
  const table=url.pathname.split('/').at(-1);
  let rows=structuredClone(fixture[table]||[]);
  if(noLocations && table==='locations') rows=[];
  if(synthetic && !noLocations && table==='locations') rows.push({...fixture.locations[0],id:north,name:'Sede Norte simulada',is_main:false});
  if(synthetic && table.startsWith('location_')) rows.push(...rows.map(row=>({...row,location_id:north,...(table==='location_product_prices'&&row.product_id===coffee?{price:6500}:{})})));
  if(hiddenCoffee && table==='location_product_status') rows=rows.map(row=>row.product_id===coffee?{...row,is_active:false}:row);
  for(const [field,value] of url.searchParams) {
    if(value.startsWith('eq.')) rows=rows.filter(row=>String(row[field])===value.slice(3));
    if(value.startsWith('in.(')) rows=rows.filter(row=>value.slice(4,-1).split(',').includes(String(row[field])));
  }
  const object=request.headers().accept?.includes('object+json');
  return route.fulfill({json:object?(rows[0]||null):rows,headers:{'content-range':`0-${Math.max(rows.length-1,0)}/${rows.length}`}});
});
await ctx.routeWebSocket(`${host.replace('https:','wss:')}/**`, socket=>socket.close());
const page=await ctx.newPage();
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error') {
  if(process.argv.includes('--availability') && rejectCheckout && message.location().url.includes('/rpc/create_order_checked') && message.text().includes('400')) expectedHttpErrors.push(message.text());
  else errors.push(message.text());
}});
const snap=async name=>{
  if(name==='desktop-menu' || name==='mobile-menu-reload') {
    await page.getByRole('button').filter({has:page.getByRole('heading',{name:'Café americano UX',exact:true})}).scrollIntoViewIfNeeded();
  }
  await page.screenshot({path:`${out}/${name}.png`,fullPage:false});
  await fs.writeFile(`${out}/${name}.txt`,`${page.url()}\n${await page.locator('body').innerText()}`);
};
const clearCatalogCache=()=>page.evaluate(()=>new Promise((resolve,reject)=>{
  const request=indexedDB.open('aluna-offline',1);
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{
    const db=request.result;
    const tx=db.transaction('catalog-cache','readwrite');tx.objectStore('catalog-cache').clear();
    tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
  };
}));
async function menu(search='') {
  await page.goto(`${root}${search}#menu`);
  await page.getByRole('button',{name:'Desayunos UX',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Café americano UX',exact:true})).toBeVisible();
}
async function cardPrice(price) {
  const card=page.getByRole('button').filter({has:page.getByRole('heading',{name:'Café americano UX',exact:true})});
  await expect(card).toContainText(price);
  const img=card.getByRole('img',{name:'Café americano UX',exact:true});
  await expect(img).toBeVisible();
  await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  return card;
}
async function cartPrice(unit) {
  const readLine=()=>page.evaluate(({brand,coffee})=>JSON.parse(localStorage.getItem(`aa_cart_${brand}`)||'[]').find(item=>(item.productId||item.id)===coffee),{brand,coffee});
  await expect.poll(async()=>(await readLine())?.price).toBe(unit);
  const line=await readLine();
  const formatted=new Intl.NumberFormat('es-CO').format(unit*(line.qty||1));
  await expect(page.getByRole('dialog')).toContainText(formatted);
}
if(process.argv.includes('--visual-only')) {
  try {
    await menu();await cardPrice('5.000');await snap('desktop-menu');
    await page.setViewportSize({width:390,height:844});
    await menu();await cardPrice('5.000');await snap('mobile-menu-reload');
  } finally { await browser.close(); }
  process.exit(0);
}
if(process.argv.includes('--orders')) {
  try {
    fixture.business_hours=[];
    fixture.brands[0].config={...fixture.brands[0].config,operational_modes:{dine_in:true,takeaway:true,delivery:false}};
    for(const mobile of [false,true]) {
      await page.setViewportSize(mobile?{width:390,height:844}:{width:1365,height:1000});
      await page.goto(root+'#menu');await page.evaluate(()=>localStorage.clear());await clearCatalogCache();
      await menu('?checkout_case='+(mobile?'mobile':'desktop'));await cardPrice('5.000');
      await page.getByRole('heading',{name:'Café americano UX',exact:true}).click();
      await page.getByRole('dialog').getByRole('button',{name:/Agregar al pedido/}).click({position:{x:24,y:20}});
      await page.getByRole('button',{name:/Abrir carrito/}).filter({visible:true}).first().click();
      await page.getByRole('button',{name:/Elegir entrega|Datos de recogida|Confirmar Pedido/}).filter({visible:true}).first().click();
      await page.getByRole('button',{name:'En mesa',exact:true}).click();
      const name=page.getByPlaceholder('Nombre Completo');if(await name.isVisible())await name.fill('Cliente sintético');
      const phone=page.getByPlaceholder('Celular / WhatsApp (ej: 310 123 4567)');if(await phone.isVisible())await phone.fill('3000000000');
      const before=checkoutCalls.length;
      await page.getByRole('button',{name:'Confirmar Pedido',exact:true}).click();
      await expect.poll(()=>checkoutCalls.length).toBe(before+1);
      const call=checkoutCalls.at(-1);expect(call.p_order.brand_id).toBe(brand);expect(call.p_order.location_id).toBe(main);expect(call.p_items).toHaveLength(1);expect(call.p_items[0].unit_price).toBe(5000);expect(call.p_order.total_amount).toBe(5000);
      await expect.poll(()=>page.evaluate(brand=>JSON.parse(localStorage.getItem('aa_cart_'+brand)||'[]').length,brand)).toBe(0);
      await snap(mobile?'mobile-checkout-success':'desktop-checkout-success');
      results.push((mobile?'Móvil':'Escritorio')+': checkout de producción envía un pedido sintético con sede/precio efectivos y limpia carrito tras éxito simulado.');
    }
    expect(errors).toEqual([]);
  } finally {
    await fs.writeFile(out+'/preview-results.json',JSON.stringify({results,errors,writesIntercepted,remoteWrites:0,checkoutCalls:checkoutCalls.map(c=>({operation:c.p_client_order_id,brand:c.p_order.brand_id,location:c.p_order.location_id,total:c.p_order.total_amount,items:c.p_items.map(i=>({product:i.product_id,price:i.unit_price,quantity:i.quantity}))})),source:'Existing online orders/order_items inserts mocked; no real orders or remote atomicity certification.'},null,2));await browser.close();
  }
  console.log(results.join('\n'));process.exit(0);
}
if(process.argv.includes('--promotions')) {
  try {
    const { runMenuPromotionsSmoke } = await import('./menuPromotions.preview.mjs');
    await runMenuPromotionsSmoke({page,fixture,brand,main,north,coffee,menu,cardPrice,cartPrice,snap,clearCatalogCache,results});
    expect(errors).toEqual([]);
  } catch(error) {
    await snap('failure-promotions');
    await fs.writeFile(`${out}/failure-promotions.txt`,error.stack);
    throw error;
  } finally {
    await fs.writeFile(`${out}/preview-results.json`,JSON.stringify({results,errors,writesIntercepted,remoteWrites:0,source:'Readonly public snapshot; synthetic site/global settings; all browser backend requests intercepted.'},null,2));
    await browser.close();
  }
  console.log(results.join('\n'));
  process.exit(0);
}
try {
  await menu();
  let card=await cardPrice('5.000');
  await snap('desktop-menu');
  await card.click();
  const qv=page.getByRole('dialog');
  await expect(qv).toContainText('5.000');
  await expect.poll(()=>qv.getByRole('img',{name:'Café americano UX',exact:true}).evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await snap('desktop-quickview');
  await qv.getByRole('button',{name:/Agregar al pedido/}).click();
  await page.getByRole('button',{name:'Abrir carrito',exact:true}).click();
  await cartPrice(5000);
  await expect(page.getByRole('dialog')).toContainText('Café americano UX');
  await expect.poll(()=>page.getByRole('dialog').locator('img[src*="cafe-americano"]').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await snap('desktop-cart');
  await page.getByRole('button',{name:'Cerrar modal',exact:true}).click();
  results.push('Default principal: carta, QuickView y carrito = 5000; imagen cargada.');
  await menu(`?loc=${main}`);
  await cardPrice('5.000');
  await page.reload();
  await page.getByRole('button',{name:'Desayunos UX',exact:true}).click();
  await cardPrice('5.000');
  results.push('Sede explícita y recarga: 5000.');
  await page.locator('a[href="#asistente"]').filter({visible:true}).first().click();
  await page.getByPlaceholder(/Escribe a/).fill('Quiero café americano');
  await page.getByRole('button',{name:'Enviar mensaje'}).click();
  await expect(page.getByRole('heading',{name:'Café americano UX',exact:true})).toBeVisible();
  await expect(page.locator('body')).toContainText('5.000');
  await expect.poll(()=>page.getByRole('img',{name:'Café americano UX',exact:true}).evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await snap('desktop-boki');
  const readQuantity=()=>page.evaluate(({brand,coffee})=>JSON.parse(localStorage.getItem(`aa_cart_${brand}`)||'[]').find(item=>(item.productId||item.id)===coffee)?.qty||0,{brand,coffee});
  const beforeHidden=await readQuantity();
  hiddenCoffee=true;
  await page.getByRole('button',{name:'Agregar',exact:true}).click();
  await expect(page.getByText('Este producto ya no está disponible en esta sede.',{exact:true})).toBeVisible();
  expect(await readQuantity()).toBe(beforeHidden);
  hiddenCoffee=false;
  results.push('Dependencia H09: una sugerencia visible anterior a ocultar no se puede añadir; cantidad del carrito intacta.');
  await page.getByRole('button',{name:'Agregar',exact:true}).click();
  await expect(page.getByRole('button',{name:'Agregado',exact:true})).toBeVisible();
  await page.getByRole('heading',{name:'Café americano UX',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('5.000');
  await page.getByRole('dialog').getByRole('button',{name:/Agregar al pedido/}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  results.push('Boki (LLM simulado por ID), adición directa y su QuickView = 5000; añadir mantiene el precio.');
  // Synthetic second-location price, no database mutation.
  synthetic=true;
  await menu(`?location_id=${north}`);
  await cardPrice('6.500');
  await page.getByRole('button',{name:'Abrir carrito',exact:true}).click();
  await cartPrice(6500);
  await snap('north-cart');
  await page.getByRole('button',{name:'Cerrar modal',exact:true}).click();
  results.push('Segunda sede simulada: override 6500 y carrito recalculado; extras protegidos por tests unitarios.');
  await page.locator('a[href="#asistente"]').filter({visible:true}).first().click();
  await page.getByPlaceholder(/Escribe a/).fill('Quiero café americano');
  await page.getByRole('button',{name:'Enviar mensaje'}).click();
  await expect(page.getByRole('heading',{name:'Café americano UX',exact:true})).toBeVisible();
  await expect(page.locator('body')).toContainText('6.500');
  // Same mounted conversation, route context changes without a new model reply.
  await page.evaluate(({main})=>{
    history.pushState(null,'',`?loc=${main}#asistente`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },{main});
  await expect(page.locator('body')).toContainText('5.000');
  await page.getByRole('heading',{name:'Café americano UX',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('5.000');
  await page.evaluate(({north})=>{
    history.pushState(null,'',`?loc=${north}#asistente`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },{north});
  await expect(page.getByRole('dialog')).toContainText('6.500');
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  results.push('Conversación y QuickView abiertos: cambio de sede actualiza 6500 → 5000 → 6500 sin usar el precio guardado en el mensaje.');
  await page.setViewportSize({width:390,height:844});
  await menu();
  await cardPrice('5.000');
  await page.reload();
  await page.getByRole('button',{name:'Desayunos UX',exact:true}).click();
  await cardPrice('5.000');
  await snap('mobile-menu-reload');
  card=await cardPrice('5.000');await card.click();
  await expect(page.getByRole('dialog')).toContainText('5.000');
  await snap('mobile-quickview');
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  const broken=await page.locator('img').evaluateAll(images=>images.filter(img=>img.getBoundingClientRect().height>0&&(!img.complete||!img.naturalWidth)).map(img=>img.alt));
  expect(broken).toEqual([]);
  results.push('Móvil 390x844: recarga, carta, QuickView e imágenes cargadas.');
  await page.getByRole('button',{name:/Abrir carrito/}).first().click();
  await cartPrice(5000);
  await expect.poll(()=>page.getByRole('dialog').locator('img[src*="cafe-americano"]').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await snap('mobile-cart');
  await page.getByRole('button',{name:'Cerrar modal',exact:true}).click();
  await page.locator('a[href="#asistente"]').filter({visible:true}).first().click();
  await page.getByPlaceholder(/Escribe a/).fill('Quiero café americano');
  await page.getByRole('button',{name:'Enviar mensaje'}).click();
  await expect(page.getByRole('heading',{name:'Café americano UX',exact:true})).toBeVisible();
  await expect(page.locator('body')).toContainText('5.000');
  await expect.poll(()=>page.getByRole('img',{name:'Café americano UX',exact:true}).evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await snap('mobile-boki');
  await menu();
  results.push('Móvil: Boki y carrito también muestran 5000 con la fotografía correcta.');
  brokenPhoto=true;
  await page.reload();
  await page.getByRole('button',{name:'Desayunos UX',exact:true}).click();
  const fallbackImage=page.getByRole('img',{name:'Croissant UX',exact:true});
  await expect.poll(()=>fallbackImage.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
  await expect.poll(()=>fallbackImage.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await snap('mobile-image-fallback');
  results.push('Foto rota simulada: placeholder cargado, sin icono de imagen rota ni desaparición del producto.');
  brokenPhoto=false;
  hiddenCoffee=true;
  await clearCatalogCache();
  await page.reload();
  await page.getByRole('button',{name:'Desayunos UX',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Croissant UX',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Café americano UX',exact:true})).toHaveCount(0);
  results.push('H09: ocultamiento por sede simulado excluye café sin ocultar croissant.');
  noLocations=true;
  await clearCatalogCache();
  await page.reload();
  await expect(page.getByText('Este negocio aún no tiene una sede disponible para pedidos.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Croissant UX',exact:true})).toHaveCount(0);
  results.push('Sin sedes activas: estado informativo, sin catálogo ejecutable.');
  expect(JSON.stringify(fixture)).toBe(original);
  expect(errors).toEqual([]);
} catch(error) {
  await snap('failure');
  await fs.writeFile(`${out}/failure.txt`,`${error.stack}\nConsole errors:\n${errors.join('\n')}`);
  throw error;
} finally {
  await fs.writeFile(`${out}/preview-results.json`,JSON.stringify({results,errors,writesIntercepted,remoteWrites:0,source:'Anon GET snapshot; all browser backend requests fulfilled locally.'},null,2));
  await browser.close();
}
console.log(results.join('\n'));
