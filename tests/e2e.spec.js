import { test, expect } from '@playwright/test';

/**
 * Flujo E2E Completo de Aluna QR Menu
 * /registro → /admin/checkout#admin/onboarding (4 pasos) → checkout trial → panel admin
 */
test('Flujo E2E: Registro → Onboarding → Trial → Categorías → Productos', async ({ browser, baseURL }) => {
  // Contexto LIMPIO sin sesiones previas
  const context = await browser.newContext({ baseURL });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const page = await context.newPage();
  test.setTimeout(180000);

  const suffix = Math.floor(Math.random() * 100000);
  const email = `playwright_${suffix}@aluna.com`;
  const password = 'TestUser123!';
  const enterAdminPinIfPrompted = async () => {
    const roleGate = page.getByRole('heading', { name: /Qui[eé]n eres/i });
    if (!(await roleGate.isVisible({ timeout: 2000 }).catch(() => false))) return;

    const adminPrincipal = page.getByRole('button', { name: /Admin Principal/i }).first();
    if (!(await adminPrincipal.isVisible({ timeout: 5000 }).catch(() => false))) {
      throw new Error('Pantalla de PIN visible, pero no aparece Admin Principal para la marca nueva.');
    }

    await adminPrincipal.click();
    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await page.getByRole('button', { name: /^Ingresar$/i }).click();
    await page.waitForTimeout(1200);
  };

  const completeOnboardingIfVisible = async () => {
    await page.waitForTimeout(2000);
    const onboardingTitle = page.getByRole('heading', { name: /Configura tu Negocio/i });
    if (!(page.url().includes('admin/onboarding') || await onboardingTitle.isVisible({ timeout: 3000 }).catch(() => false))) {
      return;
    }

    console.log('--- PASO 2B: AdminOnboarding (4 pasos) ---');

    // Paso 1 - Identidad
    await page.locator('input[placeholder="Ej. Mi Gran Restaurante"]').fill('Restaurante E2E Test');
    await page.locator('input[placeholder="mi-restaurante"]').fill(`rest-e2e-${suffix}`);
    await page.getByRole('button', { name: /^Siguiente$/i }).click();
    await page.waitForTimeout(800);

    // Paso 2 - Contacto
    await page.locator('input[placeholder*="573001234567"]').fill('+573001234567');
    await page.locator('input[placeholder*="contacto@minegocio"]').fill('contacto@rest-test.com');
    await page.locator('input[placeholder*="fijo o móvil"]').fill('+573009876543');
    await page.locator('input[placeholder*="Colombia"]').fill('Colombia');
    await page.locator('input[placeholder*="Bogotá"]').fill('Bogotá');
    await page.locator('input[placeholder*="Siempre Viva"]').fill('Calle Falsa 123, Local 4');
    await page.getByRole('button', { name: /^Siguiente$/i }).click();
    await page.waitForTimeout(800);

    // Paso 3 - Legal (saltar)
    await page.getByRole('button', { name: /^Siguiente$/i }).click();
    await page.waitForTimeout(800);

    // Paso 4 - Estilo (finalizar)
    const finBtn = page.getByRole('button', { name: /Finalizar|Completar|Terminar/i });
    if (await finBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await finBtn.click();
    } else {
      await page.getByRole('button', { name: /^Siguiente$/i }).click();
    }
    await page.waitForTimeout(4000);
    await enterAdminPinIfPrompted();
    console.log('✅ AdminOnboarding completado. URL:', page.url());
  };

  // ─────────────────────────────────────────────
  // 1. REGISTRO en /registro (2 pasos)
  // ─────────────────────────────────────────────
  console.log('--- PASO 1: Registro ---');
  await page.goto('/registro');
  await page.waitForTimeout(1500);

  // Step 1: nombre del negocio
  await page.locator('input[placeholder*="Postrería"]').fill('Restaurante E2E Test');
  await page.getByRole('button', { name: /Siguiente/i }).click();
  await page.waitForTimeout(800);

  // Step 2: email + contraseñas
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="passwordConfirm"]').fill(password);
  await page.getByRole('button', { name: /Lanzar mi negocio/i }).click();
  await page.waitForFunction(() => !window.location.pathname.startsWith('/registro'), null, { timeout: 45000 })
    .catch(async () => {
      const visibleError = await page
        .locator('[class*="text-red"], [role="alert"]')
        .first()
        .innerText({ timeout: 1000 })
        .catch(() => '');
      throw new Error(`El registro no salio de /registro. ${visibleError || 'La pantalla quedo cargando o sin redireccion.'}`);
    });
  console.log('✅ Registro enviado. URL:', page.url());
  await page.waitForTimeout(2500);

  // ─────────────────────────────────────────────
  // 2A. COMPLETAR PERFIL en /completar-registro (flujo nuevo usuario limpio)
  //     Solo pregunta nombre + tipo de negocio → "Crear mi negocio"
  // ─────────────────────────────────────────────
  if (page.url().includes('completar-registro')) {
    console.log('--- PASO 2A: Completar Perfil (/completar-registro) ---');
    // Placeholder en CompleteProfilePage: "Ej: La Postrería de Aluna"
    const nameInput = page.locator('input[placeholder*="Postrería"]');
    await nameInput.clear();
    await nameInput.fill('Restaurante E2E Test');
    // El tipo de negocio "Restaurante" ya está seleccionado por defecto
    await page.getByRole('button', { name: /Crear mi negocio/i }).click();
    await page.waitForTimeout(5000);
    console.log('✅ Perfil completado. URL:', page.url());
  }

  await completeOnboardingIfVisible();

  // ─────────────────────────────────────────────
  // 4. CHECKOUT — Activar Trial
  // ─────────────────────────────────────────────
  if (page.url().includes('checkout')) {
    console.log('--- PASO 4: Checkout → Trial ---');
    
    const allBtns = await page.locator('button:visible').allTextContents();
    console.log('Botones visibles:', allBtns.map(b => b.trim()).filter(Boolean).join(' | '));

    // Intentar hacer click en el botón de confirmar/continuar al panel
    const confirmBtn = page.getByRole('button', { 
      name: /Confirmar|Activar|Ir al panel|Empezar|Ir a mi restaurante|Entrar al panel|Continuar|Acceder/i 
    });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(5000);
    }
    console.log('✅ Checkout procesado. URL:', page.url());
  }

  await completeOnboardingIfVisible();

  // ─────────────────────────────────────────────
  // Obtener el slug del negocio
  // ─────────────────────────────────────────────
  let brandSlug = null;

  // Intentar obtenerlo de la URL
  const urlNow = page.url();
  const pathname = new URL(urlNow).pathname;
  const slugFromUrl = pathname.match(/^\/([^/?#]+)\//);
  const invalidSlugs = ['admin', 'checkout', 'completar-registro', 'registro', 'login'];
  if (slugFromUrl && !invalidSlugs.includes(slugFromUrl[1])) {
    brandSlug = slugFromUrl[1];
  }

  // Si no lo obtenemos de la URL, buscarlo en la página (puede aparecer en el sidebar)
  if (!brandSlug) {
    console.log('⚠️  Slug no detectado en URL. Buscando en la página...');
    // Intentar hacer click en el logo del sidebar para ir al panel
    const homeLink = page.locator('a[href*="admin_page=orders"], a[href*="admin_page=dashboard"]').first();
    if (await homeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      const href = await homeLink.getAttribute('href');
      const slugFromHref = href?.match(/\/([^/?#]+)\//)?.[1];
      if (slugFromHref && !invalidSlugs.includes(slugFromHref)) brandSlug = slugFromHref;
    }
  }

  console.log('Brand slug:', brandSlug, '| URL:', page.url());

  if (!brandSlug) {
    // Imprimir más info para depuración
    const pageText = (await page.locator('body').innerText()).slice(0, 500);
    console.log('Texto de la página:', pageText);
    throw new Error(`No se pudo detectar el slug. URL: ${page.url()}`);
  }

  const goAdmin = async (pageId) => {
    const navLabels = {
      categories: 'Categorías',
      products: 'Carta Principal',
      inventory: 'Inventario',
      recipes: 'Recetas',
    };
    const headings = {
      categories: /Categorías/i,
      products: /Productos|Carta Principal/i,
      inventory: /Inventario/i,
      recipes: /Recetas/i,
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const navButton = page.locator('aside').getByRole('button', { name: new RegExp(navLabels[pageId] || pageId, 'i') }).first();
      if (await navButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        try {
          await navButton.scrollIntoViewIfNeeded({ timeout: 1000 });
          await navButton.click({ force: true, timeout: 1000 });
        } catch {
          await page.goto(`/${brandSlug}/?admin_page=${pageId}#admin`);
        }
      } else {
        await page.goto(`/${brandSlug}/?admin_page=${pageId}#admin`);
      }

      await page.waitForTimeout(1500);
      await enterAdminPinIfPrompted();

      const expectedHeading = page.getByRole('main').getByRole('heading', { name: headings[pageId] || new RegExp(pageId, 'i') }).first();
      if (await expectedHeading.isVisible({ timeout: 1000 }).catch(() => false)) return;
    }

    throw new Error(`No se pudo navegar a admin_page=${pageId}. URL actual: ${page.url()}`);
  };

  // ─────────────────────────────────────────────
  // 5. CATEGORÍAS DE MENÚ (admin_page=categories)
  // ─────────────────────────────────────────────
  console.log('--- PASO 5: Categorías de Menú ---');
  await goAdmin('categories');

  if (page.url().includes('checkout')) {
    throw new Error('Aún en checkout después de activar trial. Botones de la página: ' + 
      (await page.locator('button:visible').allTextContents()).join(' | '));
  }

  await page.getByRole('button', { name: /Nueva Categoría|Agregar/i }).first().click();
  await page.waitForTimeout(500);
  await page.locator('input[name="name"]:visible').fill('Pizzas');
  await page.locator('input[name="slug"]:visible').fill('pizzas');
  await page.getByRole('button', { name: /Crear Categor/i }).click();
  await expect(page.getByRole('table').getByText('Pizzas', { exact: true }).first()).toBeVisible({ timeout: 8000 });
  console.log('✅ Categoría "Pizzas" creada');

  // ─────────────────────────────────────────────
  // 6. PRODUCTOS (x4)
  // ─────────────────────────────────────────────
  console.log('--- PASO 6: Productos ---');
  await goAdmin('products');

  const pizzas = ['Pizza Margarita', 'Pizza Pepperoni', 'Pizza Hawaiana', 'Pizza Carnívora'];
  for (const pizza of pizzas) {
    await page.getByRole('button', { name: /Nuevo Producto/i }).click();
    await page.waitForTimeout(600);
    await page.locator('input[name="name"]:visible').fill(pizza);
    await page.locator('select[name="category_id"]:visible').selectOption({ label: 'Pizzas' });
    await page.locator('input[name="price"]:visible').fill('25000');
    await page.getByRole('button', { name: /Crear producto/i }).click();
    await expect(page.getByRole('table').getByText(pizza, { exact: true }).first()).toBeVisible({ timeout: 8000 });
    console.log(`✅ "${pizza}" creado`);
  }

  // ─────────────────────────────────────────────
  // 7. INVENTARIO (si el plan lo permite)
  // ─────────────────────────────────────────────
  console.log('--- PASO 7: Inventario ---');
  await goAdmin('inventory');
  const ingredientCategoryName = `Materias Primas ${suffix}`;
  const locked = page.getByRole('heading', { name: /Funci[oó]n Premium/i });
  if (await locked.isVisible({ timeout: 2000 }).catch(() => false)) {
    throw new Error('Inventario bloqueado durante prueba activa de 21 dias. Esto rompe el acceso full-trial.');
  } else {
    await page.getByRole('main').getByRole('button', { name: /Categorías/i }).click();
    await page.waitForTimeout(500);
    await page.locator('input[placeholder*="Prote"]:visible').fill(ingredientCategoryName);
    await page.getByRole('button', { name: /Crear Categoría/i }).click();
    await expect(page.getByText(ingredientCategoryName, { exact: true }).first()).toBeVisible({ timeout: 8000 });
    console.log('✅ Categoría insumo creada');

    await page.getByRole('main').getByRole('button', { name: /Inventario/i }).click();
    await page.getByRole('button', { name: /Nuevo Insumo/i }).click();
    await page.waitForTimeout(600);
    await page.locator('input[placeholder*="Aguacate"]:visible').fill('Harina');
    await page.locator('select:visible').nth(1).selectOption({ label: ingredientCategoryName });
    await page.locator('select:visible').nth(3).selectOption({ label: 'Gramo (g)' });
    await page.locator('input[placeholder*="5000"]:visible').fill('5000');
    await page.locator('select:visible').nth(4).selectOption({ label: 'Kilogramos' });
    await page.locator('input[placeholder*="1000"]:visible').fill('1000');
    await page.getByRole('button', { name: /Crear insumo/i }).click();
    await expect(page.getByRole('table').getByText('Harina', { exact: true }).first()).toBeVisible({ timeout: 8000 });
    console.log('✅ Insumo "Harina" creado');

    await goAdmin('recipes');
    await page.getByRole('main').getByRole('button', { name: /Crear Receta|Crear Primera Receta/i }).first().click();
    await page.waitForTimeout(500);
    await page.locator('input[placeholder*="Hamburguesa"]:visible').fill('Masa para Pizza');
    await page.getByRole('button', { name: /Harina/i }).first().click();
    await expect(page.getByText('Harina', { exact: true }).first()).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /Guardar Nueva Receta/i }).click();
    await expect(page.getByText('Masa para Pizza', { exact: true }).first()).toBeVisible({ timeout: 8000 });
    console.log('✅ Receta creada');
  }

  await context.close();
  console.log(`\n🎉 PRUEBA E2E COMPLETADA CON ÉXITO! Negocio: ${brandSlug} | Email: ${email}`);
});
