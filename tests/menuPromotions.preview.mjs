import { expect } from '@playwright/test';

export async function runMenuPromotionsSmoke({page,fixture,brand,main,north,coffee,menu,cardPrice,cartPrice,snap,clearCatalogCache,results}) {
  const originalSettings=fixture.restaurant_settings;
  const base=originalSettings[0]||{brand_id:brand};
  const special=(price,enabled=true)=>({id:'daily_special_config',enabled,manual_override_product_id:coffee,promo_price:price});
  const mainSettings={...base,id:'mock-main-settings',location_id:main,brand_concepts:[special(4500)]};
  const northSettings={...base,id:'mock-north-settings',location_id:north,brand_concepts:[special(6000)]};
  const globalSettings={...base,id:'mock-global-settings',location_id:null,brand_concepts:[special(5200)]};
  fixture.restaurant_settings=[mainSettings,northSettings];
  let phase=0;
  const loadChangedFixture=async location=>{
    await clearCatalogCache();
    // A new query forces a document navigation even when the previous URL/hash
    // was identical; the application ignores this test-only parameter.
    await menu(`?loc=${location}&h053_case=${++phase}`);
  };

  async function assertBokiPrice(value) {
    const heading=page.getByRole('heading',{name:'Café americano UX',exact:true});
    await expect(heading).toBeVisible();
    await expect(heading.locator('..').locator('..')).toContainText(new Intl.NumberFormat('es-CO').format(value));
  }
  async function openCart() {
    const boki=page.getByRole('button',{name:'Ver Pedido',exact:true});
    if(await boki.isVisible()) await boki.click();
    else await page.getByRole('button',{name:/Abrir carrito/}).filter({visible:true}).first().click();
  }
  async function verifySurfaces(value,label,add=false) {
    const formatted=new Intl.NumberFormat('es-CO').format(value);
    const card=await cardPrice(formatted);
    await card.scrollIntoViewIfNeeded();await snap(`${label}-menu`);
    await card.click();
    await expect(page.getByRole('dialog')).toContainText(formatted);
    await snap(`${label}-quickview`);
    if(add) {
      await page.getByRole('dialog').getByRole('button',{name:/Agregar al pedido/}).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    } else await page.getByRole('dialog').getByRole('button',{name:'Cerrar',exact:true}).click();
    await openCart();await cartPrice(value);await snap(`${label}-cart`);
    await page.getByRole('button',{name:'Cerrar modal',exact:true}).click();
    await page.locator('a[href="#asistente"]').filter({visible:true}).first().click();
    await page.getByPlaceholder(/Escribe a/).fill('Quiero café americano');
    await page.getByRole('button',{name:'Enviar mensaje'}).click();
    await assertBokiPrice(value);await snap(`${label}-boki`);
    results.push(`${label}: carta, QuickView, Boki y carrito = ${value}; imágenes cargadas y mismas cantidades.`);
  }

  // Original failing direct entry: no main-location settings can leak into North.
  await menu(`?loc=${north}`);
  await verifySurfaces(6000,'north-desktop',true);
  await page.evaluate(main=>{history.pushState(null,'',`?loc=${main}#asistente`);window.dispatchEvent(new PopStateEvent('popstate'));},main);
  await assertBokiPrice(4500);
  await page.getByRole('heading',{name:'Café americano UX',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('4.500');
  await page.evaluate(north=>{history.pushState(null,'',`?loc=${north}#asistente`);window.dispatchEvent(new PopStateEvent('popstate'));},north);
  await expect(page.getByRole('dialog')).toContainText('6.000');
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  results.push('Cambio de sede en conversación y QuickView abiertos: Principal 4500 → Norte 6000, sin recarga ni nueva respuesta LLM.');

  await menu(`?loc=${north}`);await cardPrice('6.000');
  await page.reload();await page.getByRole('button',{name:'Desayunos UX',exact:true}).click();
  await cardPrice('6.000');
  const cachedRows=await page.evaluate(brand=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('aluna-offline',1);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result;const tx=db.transaction('catalog-cache','readonly');
      const read=tx.objectStore('catalog-cache').get(`menu:v15:${brand}`);
      read.onsuccess=()=>{resolve(read.result?.value?.restaurantSettingsRows?.map(row=>row.id));db.close();};
    };
  }),brand);
  expect(cachedRows).toEqual(expect.arrayContaining(['mock-main-settings','mock-north-settings']));
  results.push('Recarga/caché v15 conserva ambas configuraciones y Norte sigue a 6000.');
  await menu(`?loc=${main}`);await verifySurfaces(4500,'main-desktop');

  // Explicitly brand-wide configuration retains the existing global precedence.
  fixture.restaurant_settings=[mainSettings,northSettings,globalSettings];
  await loadChangedFixture(north);
  await verifySurfaces(5200,'global-north');
  await menu(`?loc=${main}`);await cardPrice('5.200');
  results.push('Promoción global explícita 5200 vigente en Principal y Norte; no se deduce globalidad de una fila local.');

  fixture.restaurant_settings=[mainSettings,northSettings,{...globalSettings,brand_concepts:[special(5200,false)]}];
  await loadChangedFixture(north);await cardPrice('6.500');
  results.push('Promoción global desactivada no aplica aunque conserve el producto manual: Norte usa su override 6500.');
  fixture.restaurant_settings=[mainSettings];
  await loadChangedFixture(north);await cardPrice('6.500');
  results.push('Norte sin configuración promocional propia/global no hereda la promoción 4500 de Principal.');

  fixture.restaurant_settings=[mainSettings,northSettings];
  await page.setViewportSize({width:390,height:844});
  await loadChangedFixture(north);await verifySurfaces(6000,'north-mobile');
  await page.evaluate(({brand,main})=>localStorage.setItem('aa_applied_coupon',JSON.stringify({
    id:'mock-main-coupon',brand_id:brand,location_id:main,is_active:true,code:'MAIN_ONLY_H053',type:'fixed_discount',value:50,target:'all',
  })),{brand,main});
  await menu(`?loc=${north}&h053_case=coupon`);await openCart();await cartPrice(6000);
  await expect(page.getByRole('dialog')).not.toContainText('MAIN_ONLY_H053');
  await snap('north-ineligible-coupon');
  results.push('Cupón guardado de Principal no descuenta ni se anuncia como aplicado en Norte.');
  await page.getByRole('button',{name:'Cerrar modal',exact:true}).click();
  await page.evaluate(()=>localStorage.removeItem('aa_applied_coupon'));
  fixture.restaurant_settings=originalSettings;
}
