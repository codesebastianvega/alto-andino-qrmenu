import { getCategoryScheduleInfo } from './businessHours.js';

// Shared projection: public menu and manual orders use identical stock, location and promotional pricing rules.
export function buildMenuProducts({ rawProducts = [], locationPrices = [], locationStatus = [], activeLocationId, restaurantSettings, allCategories = [], isStorePausedForPublic = false }) {
    const grouped = {};

    // 1. Create Maps for O(1) lookups of location overrides
    // This avoids using .find() or .filter() inside the product loop
    const statusMap = new Map();
    const stockStatusMap = new Map();
    const portionsMap = new Map();
    if (activeLocationId && activeLocationId !== 'all') {
      (locationStatus || []).forEach(ls => {
        if (ls.location_id === activeLocationId) {
          statusMap.set(ls.product_id, ls.is_active);
          if (ls.stock_status) stockStatusMap.set(ls.product_id, ls.stock_status);
          if (ls.available_portions !== undefined && ls.available_portions !== null) {
            portionsMap.set(ls.product_id, ls.available_portions);
          }
        }
      });
    }

    const priceMap = new Map();
    if (activeLocationId && activeLocationId !== 'all') {
      (locationPrices || []).forEach(lp => {
        if (lp.location_id === activeLocationId) {
          priceMap.set(lp.product_id, lp.price);
        }
      });
    }

    const hasLocProductConfig = statusMap.size > 0;

    // 2. Plato / Especial del Día universal & 100% dynamic rotation
    const dailySpecialConcept = (restaurantSettings?.brand_concepts || []).find(
      c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')
    );
    const isSpecialEnabled = dailySpecialConcept ? dailySpecialConcept.enabled !== false : false;
    const specialLabel = dailySpecialConcept?.label || 'Plato del Día';
    const customPrices = dailySpecialConcept?.custom_prices || {};
    const promoPrice = Number(dailySpecialConcept?.promo_price) || 0;
    const standardPrice = Number(dailySpecialConcept?.standard_price) || 0;
    const specialSchedule = dailySpecialConcept?.schedule || {};
    const manualOverride = dailySpecialConcept?.manual_override_product_id;
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    // The active special ID: ONLY from manual override or schedule when enabled (NO fake hardcoded fallback!)
    const activeSpecialId = isSpecialEnabled ? (manualOverride || specialSchedule[currentDayOfWeek] || null) : null;

    // Platos adicionales seleccionados para el almuerzo ("Más Opciones del Día")
    const activeSecondaryIds = (isSpecialEnabled ? (
      Array.isArray(dailySpecialConcept?.secondary_product_ids)
        ? dailySpecialConcept.secondary_product_ids
        : (dailySpecialConcept?.secondary_schedule?.[currentDayOfWeek] || [])
    ) : []).filter(secId => {
      const raw = (rawProducts || []).find(p => p.id === secId);
      return raw && raw.is_active !== false && raw.stock_status !== 'out';
    });

    // Main daily special category (e.g. spotlight-split or hero category)
    const specialCategory = (allCategories || []).find(c => 
      c.visibility_config?.section_type === 'spotlight-split' ||
      c.slug === 'boku-bentos' ||
      (c.visibility_config?.subcategories || []).some(s => /bento del d[ií]a|plato del d[ií]a/i.test(s))
    );
    const specialCategorySlug = specialCategory?.slug || null;

    (rawProducts || []).forEach(product => {
      // 1. Si el producto está inactivo u oculto en base de datos, NUNCA se muestra en el menú público
      if (product.is_active === false) return;

      // 2. Si el producto está agotado en base de datos, NUNCA se muestra en el menú público
      if (product.stock_status === 'out') return;

      // 3. Location-level override
      if (activeLocationId && activeLocationId !== 'all' && hasLocProductConfig) {
        const isActiveOverride = statusMap.get(product.id);
        if (isActiveOverride === false) return;
        const stockOverride = stockStatusMap.get(product.id);
        if (stockOverride === 'out') return;
      }

      const catSlug = product.categories?.slug || 'otros';
      const cat = (allCategories || []).find(c => c.slug === catSlug || c.id === product.category_id);
      const catSchedule = getCategoryScheduleInfo(cat, now);

      // Price determination: base price from DB or location price
      let basePrice = Number(product.price) || 0;
      if (activeLocationId && activeLocationId !== 'all') {
        const locPrice = priceMap.get(product.id);
        if (locPrice !== undefined && locPrice !== null) {
          basePrice = Number(locPrice) || 0;
        }
      }

      // Check if this specific item is the active daily special
      const isScheduledSpecial = Boolean(activeSpecialId && product.id === activeSpecialId);
      const isSecondarySpecial = Boolean(activeSecondaryIds.includes(product.id));
      const isSpecialToday = isScheduledSpecial || isSecondarySpecial;

      let finalPrice = basePrice;
      let originalPrice = null;
      let productSubcategory = product.subcategory;

      if (isScheduledSpecial) {
        // Plato Estrella del Día:
        const itemCustom = customPrices[product.id];
        const customPromo = itemCustom && Number(itemCustom.promo_price) > 0 ? Number(itemCustom.promo_price) : 0;
        const customStandard = itemCustom && Number(itemCustom.standard_price) > 0 ? Number(itemCustom.standard_price) : 0;

        // El precio promocional del plato estrella
        finalPrice = customPromo > 0 ? customPromo : (promoPrice > 0 ? promoPrice : basePrice);
        // El precio tachado hereda fielmente el precio del plato en la carta pública
        const strikePrice = customStandard > 0 ? customStandard : (standardPrice > finalPrice ? standardPrice : basePrice);
        originalPrice = strikePrice > finalPrice ? strikePrice : null;
        productSubcategory = specialLabel;
      } else if (isSecondarySpecial) {
        // Opción adicional de almuerzo del día:
        const itemCustom = customPrices[product.id];
        if (itemCustom && Number(itemCustom.promo_price) > 0) {
          finalPrice = Number(itemCustom.promo_price);
          const strikePrice = Number(itemCustom.standard_price) > 0 ? Number(itemCustom.standard_price) : basePrice;
          originalPrice = strikePrice > finalPrice ? strikePrice : null;
        } else {
          finalPrice = basePrice;
          originalPrice = null;
        }
        if (catSlug === specialCategorySlug) {
          productSubcategory = 'Más Opciones del Día';
        }
      } else {
        // Plato regular del catálogo: mantiene su precio de base de datos
        finalPrice = basePrice;
        originalPrice = null;
      }

      // Stock portions
      let finalStockStatus = product.stock_status || 'in';
      let finalAvailablePortions = (product.available_portions !== null && product.available_portions !== undefined)
        ? Number(product.available_portions)
        : null;
      if (activeLocationId && activeLocationId !== 'all') {
        if (stockStatusMap.has(product.id)) finalStockStatus = stockStatusMap.get(product.id);
        if (portionsMap.has(product.id)) finalAvailablePortions = portionsMap.get(product.id);
      }

      // Modifiers: EXCLUSIVAMENTE los grupos configurados por el Admin en el producto en base de datos (0% inyecciones automáticas)
      let itemModifierGroups = Array.isArray(product.modifier_groups) ? [...product.modifier_groups] : [];

      const normalizedProduct = {
        id: product.id,
        name: product.name,
        is_active: product.is_active ?? true,
        price: finalPrice,
        original_price: originalPrice,
        is_bento_del_dia: isScheduledSpecial,
        is_daily_special: isSpecialToday,
        daily_special_label: isScheduledSpecial ? specialLabel : (isSecondarySpecial ? 'Opción del Día' : null),
        desc: product.description || '',
        description: product.description || '',
        tags: product.tags || [],
        stock_status: finalStockStatus,
        available_portions: finalAvailablePortions,
        out_reason: product.out_reason,
        image: product.image_url,
        image_url: product.image_url,
        recipe_id: product.recipe_id,
        variants: product.variants || [],
        modifierGroups: itemModifierGroups,
        configOptions: product.config_options || {},
        is_upsell: product.is_upsell || false,
        requires_kitchen: product.requires_kitchen ?? true,
        station: product.station || (product.requires_kitchen === false ? 'none' : 'kitchen'),
        subcategory: productSubcategory,
        categorySlug: catSlug,
        categoryId: product.category_id,
        categoryName: cat?.name || product.categories?.name,
        is_schedule_available: isStorePausedForPublic ? false : catSchedule.isAvailableNow,
        schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : catSchedule.label,
        schedule_info: catSchedule,
        is_addon: product.is_addon,
        _supabase: product
      };

      if (product.is_addon !== true) {
        if (!grouped[catSlug]) grouped[catSlug] = [];
        grouped[catSlug].push(normalizedProduct);

        // Si este plato fue seleccionado como almuerzo especial y su categoría nativa no es la categoría de almuerzos,
        // también lo presentamos en la categoría de almuerzos para conveniencia del comensal:
        if (specialCategorySlug && catSlug !== specialCategorySlug && isSpecialToday) {
          if (!grouped[specialCategorySlug]) grouped[specialCategorySlug] = [];
          grouped[specialCategorySlug].push({
            ...normalizedProduct,
            subcategory: isScheduledSpecial ? specialLabel : 'Más Opciones del Día',
            is_bento_del_dia: true,
            categorySlug: specialCategorySlug,
            categoryId: specialCategory.id,
            categoryName: specialCategory.name
          });
        }
      }
    });

    return grouped;

}

export function selectManualOrderCatalog({ grouped = {}, categories = [], locationCategories = [], locationId, restaurantSettings, day = new Date().getDay() }) {
  const hidden = new Set(locationCategories.filter(link => link.location_id === locationId && link.is_active === false).map(link => link.category_id));
  const visibleCategories = categories.filter(category => category.is_active !== false && !hidden.has(category.id));
  const categoryIds = new Set(visibleCategories.map(c => c.id));
  const byId = new Map();
  for (const product of Object.values(grouped).flat()) {
    const nativeId = product._supabase?.category_id || product.category_id || product.categoryId;
    if (!product.id || !categoryIds.has(nativeId) || product.is_active === false || product.stock_status === 'out' || product.is_addon) continue;
    const nativeCategory = visibleCategories.find(category => category.id === nativeId);
    // A promoted dish may have a display alias in another category. Preserve its real category and configured options.
    byId.set(product.id, { ...product, categoryId: nativeId, categorySlug: nativeCategory.slug, categoryName: nativeCategory.name });
  }
  const products = [...byId.values()];
  const concept = restaurantSettings?.brand_concepts?.find(c => c && ['bento_del_dia_config','daily_special_config'].includes(c.id));
  const enabled = Boolean(concept && concept.enabled !== false);
  const configuredPrimary = enabled ? (concept.manual_override_product_id || concept.schedule?.[day] || null) : null;
  const configuredSecondary = enabled ? (Array.isArray(concept.secondary_product_ids) ? concept.secondary_product_ids : concept.secondary_schedule?.[day] || []) : [];
  const activeSpecialId = products.some(p => p.id === configuredPrimary) ? configuredPrimary : null;
  const activeSecondaryIds = products.filter(p => p.id !== activeSpecialId && configuredSecondary.includes(p.id)).map(p => p.id);
  const dailySpecialData = { activeSpecialId, activeSecondaryIds, soupName: concept?.soup_name?.trim() || '', drinkName: concept?.drink_name?.trim() || '', label: concept?.label?.trim() || 'Plato del Día' };
  return { products, categories: visibleCategories.filter(category => products.some(p => p.categoryId === category.id)), dailySpecialData };
}

export function filterManualOrderProducts(products, category, query, specials) {
  const secondary = specials.activeSecondaryIds || [];
  const score = p => p.id === specials.activeSpecialId ? 2 : secondary.includes(p.id) ? 1 : 0;
  const search = String(query || '').trim().toLocaleLowerCase();
  return products.filter(p => (category === 'all' || (category === 'daily_specials' ? score(p) > 0 : p.categoryId === category || p.categorySlug === category)) && (!search || [p.name,p.description,p.desc,p.subcategory].some(text => String(text || '').toLocaleLowerCase().includes(search)))).sort((a,b) => score(b)-score(a));
}
