import { getCategoryScheduleInfo } from '../../../utils/businessHours';
import {
  createPokeToriKatsu,
  createPokeSalmonFresh,
  createBentoMediterraneo,
  createBentoCriollo,
  SHARED_SOUP_GROUP,
  SHARED_DRINK_GROUP,
  SALMON_PREP_GROUP,
  TORI_SAUCE_GROUP,
} from './bokuSpecialsData';

export function transformModifiers(rawModifierGroups = [], locationModLinks = [], activeLocationId) {
  const modGroups = {};

  // 1. Identify primary groups visible in this location
  const directlyAllowedGroups = rawModifierGroups.filter((group) => {
    if (!activeLocationId || activeLocationId === 'all') return true;
    if (!locationModLinks || locationModLinks.length === 0) return true;

    const groupHasAnyLinks = locationModLinks.some((link) => link.modifier_group_id === group.id);
    if (!groupHasAnyLinks) return true;

    return locationModLinks.some(
      (link) => link.modifier_group_id === group.id && link.location_id === activeLocationId
    );
  });

  // 2. Also ensure any nested sub-groups referenced by options in allowed groups are included
  const nestedGroupIds = new Set();
  directlyAllowedGroups.forEach((group) => {
    (group.modifier_options || []).forEach((opt) => {
      if (opt.nested_group_id) nestedGroupIds.add(opt.nested_group_id);
    });
  });

  const allowedGroupIds = new Set(directlyAllowedGroups.map((g) => g.id));
  const filteredGroups = rawModifierGroups.filter(
    (group) => allowedGroupIds.has(group.id) || nestedGroupIds.has(group.id)
  );

  filteredGroups.forEach((group) => {
    const groupName = group.name;
    const options = (group.modifier_options || [])
      .filter((opt) => opt.is_active !== false)
      .map((opt) => {
        let optName = opt.name;
        if (
          opt.name?.toLowerCase().includes('sopita de tomate') ||
          opt.name?.toLowerCase().includes('sopa de tomate') ||
          opt.name?.toLowerCase().includes('ramen')
        ) {
          optName = '🥣 Crema de Espinaca casera (16 oz)';
        }
        return {
          ...opt,
          id: opt.id,
          name: optName,
          price: opt.price || 0,
          extra_price:
            opt.extra_price !== null && opt.extra_price !== undefined
              ? Number(opt.extra_price)
              : Number(opt.price || 0),
          emoji: opt.emoji,
          image_url: opt.image_url || opt.ingredients?.image_url || null,
          group: groupName,
          groupId: group.id,
          ingredient_id: opt.ingredient_id,
          is_active: opt.is_active !== false,
          stock_status: opt.stock_status || (opt.is_active === false ? 'out' : 'in'),
          available_portions:
            opt.available_portions !== null && opt.available_portions !== undefined
              ? Number(opt.available_portions)
              : null,
          is_out: opt.stock_status === 'out' || opt.is_active === false,
        };
      })
      .sort((a, b) => a.sort_order - b.sort_order);

    modGroups[groupName] = options;
    modGroups[group.id] = options;
  });

  return modGroups;
}

export function transformProductsByCategory({
  rawProducts = [],
  locationPrices = [],
  locationStatus = [],
  activeLocationId,
  restaurantSettings,
  allCategories = [],
  brand,
  isStorePausedForPublic,
}) {
  const grouped = {};

  const statusMap = new Map();
  const stockStatusMap = new Map();
  const portionsMap = new Map();
  if (activeLocationId && activeLocationId !== 'all') {
    locationStatus.forEach((ls) => {
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
    locationPrices.forEach((lp) => {
      if (lp.location_id === activeLocationId) {
        priceMap.set(lp.product_id, lp.price);
      }
    });
  }

  const hasLocProductConfig = statusMap.size > 0;

  const isBoku =
    restaurantSettings?.brand_id === 'a63da806-a62a-49b9-a833-07e0976785ad' ||
    brand?.id === 'a63da806-a62a-49b9-a833-07e0976785ad' ||
    brand?.slug === 'boku-bento';

  const dailySpecialConcept = (restaurantSettings?.brand_concepts || []).find(
    (c) => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')
  );
  const isSpecialEnabled = dailySpecialConcept ? dailySpecialConcept.enabled !== false : false;
  const specialLabel = dailySpecialConcept?.label || (isBoku ? 'El Bento del Día' : 'Plato del Día');
  const promoPrice = Number(dailySpecialConcept?.promo_price) || 0;
  const standardPrice = Number(dailySpecialConcept?.standard_price) || 0;
  const defaultSchedule = {
    1: 'b0000b11-0000-4000-a000-000000000001',
    2: 'b0000b12-0000-4000-a000-000000000002',
    3: 'b0000b13-0000-4000-a000-000000000003',
    4: 'b0000b14-0000-4000-a000-000000000004',
    5: 'b0000b15-0000-4000-a000-000000000005',
    6: null,
    0: null,
  };
  const specialSchedule = dailySpecialConcept?.schedule || defaultSchedule;
  const manualOverride = dailySpecialConcept?.manual_override_product_id;
  const currentDayOfWeek = new Date().getDay();

  const activeSpecialId = isBoku
    ? manualOverride || specialSchedule[currentDayOfWeek] || 'b0000b25-0000-4000-a000-000000000025'
    : manualOverride || (isSpecialEnabled ? specialSchedule[currentDayOfWeek] : null);

  const activeSecondaryIds = Array.isArray(dailySpecialConcept?.secondary_product_ids)
    ? dailySpecialConcept.secondary_product_ids
    : dailySpecialConcept?.secondary_schedule?.[currentDayOfWeek] ||
      (isBoku ? ['d07007ec-761b-4f40-bad5-799c1154b9ab'] : []);

  const isTodaySpecialItem = (id) =>
    Boolean(
      id &&
        (id === activeSpecialId ||
          activeSecondaryIds.includes(id) ||
          (isBoku &&
            (id === 'b0000b25-0000-4000-a000-000000000025' ||
              id === 'd07007ec-761b-4f40-bad5-799c1154b9ab')))
    );

  rawProducts.forEach((product) => {
    const catSlug = product.categories?.slug || 'otros';

    if (
      isBoku &&
      (product.category_id === 'b0000c04-0000-4000-a000-000000000004' ||
        catSlug === 'boku-desayunos-brunch')
    ) {
      return;
    }

    if (
      isBoku &&
      (product.id === 'b0000f02-0000-4000-a000-000000000002' ||
        product.id === 'b0000f03-0000-4000-a000-000000000003' ||
        product.id === 'b0000b17-0000-4000-a000-000000000007' ||
        product.name?.toLowerCase().includes('boloñesa') ||
        product.name?.toLowerCase().includes('bolonesa'))
    ) {
      return;
    }

    const isSpecialChoiceToday = isTodaySpecialItem(product.id);

    if (isBoku) {
      if (
        product.id === 'b0000b13-0000-4000-a000-000000000003' ||
        product.id === 'b0000b19-0000-4000-a000-000000000020'
      ) {
        if (!isSpecialChoiceToday) return;
      }
      if (product.is_active === false && !isSpecialChoiceToday) {
        return;
      }
    } else if (product.is_active === false && !isSpecialChoiceToday) {
      return;
    }

    if (activeLocationId && activeLocationId !== 'all' && hasLocProductConfig) {
      const isActiveOverride = isSpecialChoiceToday ? true : statusMap.get(product.id);
      if (isActiveOverride === false) return;
    }

    const cat = allCategories.find((c) => c.slug === catSlug || c.id === product.category_id);
    const catSchedule = getCategoryScheduleInfo(cat);

    let finalPrice = product.price;
    if (activeLocationId && activeLocationId !== 'all') {
      const locPrice = priceMap.get(product.id);
      if (locPrice !== undefined && locPrice !== null) {
        finalPrice = locPrice;
      }
    }

    const isScheduledSpecial = Boolean(activeSpecialId && product.id === activeSpecialId);
    let isExplicitSpecial =
      product.subcategory === specialLabel ||
      product.subcategory === 'El Bento del Día' ||
      (product.name && product.name.toLowerCase().includes('especial del día'));

    if (isBoku && product.id === 'b0000b19-0000-4000-a000-000000000020') {
      isExplicitSpecial = false;
    }

    const isSpecialToday = isScheduledSpecial || isExplicitSpecial;
    const isBento =
      catSlug === 'boku-bentos' || product.category_id === 'b0000c01-0000-4000-a000-000000000001';
    let productSubcategory = product.subcategory;
    let originalPrice = undefined;

    if (isSpecialToday) {
      finalPrice = isBoku
        ? promoPrice > 0
          ? promoPrice
          : 19000
        : product.price !== undefined && product.price !== null && Number(product.price) > 0
        ? Number(product.price)
        : promoPrice > 0
        ? promoPrice
        : 19000;
      if (standardPrice > finalPrice) {
        originalPrice = standardPrice;
      }
      productSubcategory = specialLabel;
    } else if (isBento) {
      if (
        (finalPrice === undefined || finalPrice === null || Number(finalPrice) === 0) &&
        standardPrice > 0
      ) {
        finalPrice = standardPrice;
      }
      productSubcategory = product.subcategory || 'Bentos Tradicionales & Fusión';
    }

    let finalCatSlug = catSlug;
    let finalCategoryId = product.category_id;
    let finalCategoryName = cat?.name || product.categories?.name;
    let finalName = product.name;
    let finalDesc = product.description || '';
    let finalImage = product.image_url;
    let finalRecipeId = product.recipe_id;

    if (isBoku && product.id === 'b0000b16-0000-4000-a000-000000000006') {
      finalCatSlug = 'boku-pastas-ramen';
      finalCategoryId = 'b0000c03-0000-4000-a000-000000000003';
      finalCategoryName = 'BOKU Pastas & Ramen';
      finalPrice = 26000;
      originalPrice = null;
      productSubcategory = 'Pastas Clásicas & Fusión';
      finalImage = '/img/products/boku-pasta-alfredo.jpg';
      finalRecipeId = 'ba000070-0000-4000-a000-000000000001';
      finalDesc =
        'Tornillos fusilli al dente en salsa cremosa Alfredo casera con pechuga de pollo en cubos dorados, champiñones frescos y queso parmesano rallado.';
    }

    if (isBoku && product.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab') {
      finalPrice = 22000;
      originalPrice = 34000;
      productSubcategory = 'Bowls Poke Fresco';
      finalName = 'Poke Salmón Fresh (Fresco o Salteado)';
      finalDesc =
        'Cubos de salmón fresco magro (100g), arroz, láminas de rábano al limón, mango dulce, pepino, ajonjolí, semillas de girasol y ponzu cítrico. 👉 Término a elección: Fresco estilo Poke o Salteado al Wok. 🥣 Incluye: Sopita del día o Fruta + 🥤 Jugo del día.';
    }

    if (isBoku && product.id === 'b0000b25-0000-4000-a000-000000000025') {
      finalPrice = 22000;
      originalPrice = 28000;
      productSubcategory = 'Bowls Poke Fresco';
      finalName = 'Poke Tori Katsu (Pechuga Crocante)';
      finalDesc =
        'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde del cebollín. 🥣 Incluye: Sopita del día o Fruta + 🥤 Jugo del día.';
      finalImage = '/img/products/boku-tori-katsu.webp';
    }

    const isBokuDailySpecial = isBoku && isTodaySpecialItem(product.id);
    let finalStockStatus = isBokuDailySpecial ? 'in' : product.stock_status || 'in';
    let finalAvailablePortions = isBokuDailySpecial
      ? 50
      : product.available_portions !== null && product.available_portions !== undefined
      ? Number(product.available_portions)
      : null;
    if (activeLocationId && activeLocationId !== 'all' && !isBokuDailySpecial) {
      if (stockStatusMap.has(product.id)) finalStockStatus = stockStatusMap.get(product.id);
      if (portionsMap.has(product.id)) finalAvailablePortions = portionsMap.get(product.id);
    }

    const normalizedProduct = {
      id: product.id,
      name: finalName,
      is_active: product.is_active ?? true,
      price: finalPrice,
      original_price: originalPrice,
      is_bento_del_dia: isSpecialToday,
      is_daily_special: isSpecialToday,
      daily_special_label: isSpecialToday ? specialLabel : null,
      desc: finalDesc,
      description: finalDesc,
      tags: product.tags || [],
      stock_status: finalStockStatus,
      available_portions: finalAvailablePortions,
      out_reason: product.out_reason,
      image: finalImage,
      image_url: finalImage,
      recipe_id: finalRecipeId,
      variants: product.variants || [],
      modifierGroups: product.modifier_groups || [],
      configOptions: product.config_options || {},
      is_upsell: product.is_upsell || false,
      requires_kitchen: product.requires_kitchen ?? true,
      station: product.station || (product.requires_kitchen === false ? 'none' : 'kitchen'),
      subcategory: productSubcategory,
      categorySlug: finalCatSlug,
      categoryId: finalCategoryId,
      categoryName: finalCategoryName,
      is_schedule_available: isStorePausedForPublic ? false : catSchedule.isAvailableNow,
      schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : catSchedule.label,
      schedule_info: catSchedule,
      is_addon: product.is_addon,
      _supabase: product,
    };

    if (product.is_addon !== true) {
      if (!grouped[finalCatSlug]) grouped[finalCatSlug] = [];
      grouped[finalCatSlug].push(normalizedProduct);
    }
  });

  // DOBLE PRESENCIA Y ALMUERZOS DE HOY EN BOKU BENTO
  if (isBoku) {
    if (!grouped['boku-bentos']) grouped['boku-bentos'] = [];

    const pokeToriKatsu = createPokeToriKatsu(isStorePausedForPublic);
    const salmonRaw = rawProducts.find((p) => p.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab');
    const pokeSalmonFresh = createPokeSalmonFresh(salmonRaw, isStorePausedForPublic);
    const bentoMediterraneo = createBentoMediterraneo(isStorePausedForPublic);
    const criolloRaw = rawProducts.find((p) => p.id === 'b0000b11-0000-4000-a000-000000000001');
    const bentoCriollo = createBentoCriollo(criolloRaw, isStorePausedForPublic);

    const starRaw = rawProducts.find((p) => p.id === activeSpecialId);
    let bentoHeroToday = null;
    if (starRaw) {
      if (starRaw.id === 'b0000b25-0000-4000-a000-000000000025') {
        bentoHeroToday = {
          ...pokeToriKatsu,
          price: promoPrice > 0 ? promoPrice : 22000,
          original_price: standardPrice > 0 ? standardPrice : 28000,
          is_bento_del_dia: true,
          is_daily_special: true,
          daily_special_label: specialLabel || 'Almuerzo Estrella de Hoy',
        };
      } else if (starRaw.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab') {
        bentoHeroToday = {
          ...pokeSalmonFresh,
          price: promoPrice > 0 ? promoPrice : 22000,
          original_price: standardPrice > 0 ? standardPrice : 34000,
          is_bento_del_dia: true,
          is_daily_special: true,
          daily_special_label: specialLabel || 'Almuerzo Estrella de Hoy',
        };
      } else {
        bentoHeroToday = {
          ...starRaw,
          id: starRaw.id,
          productId: starRaw.id,
          name: starRaw.name,
          price: promoPrice > 0 ? promoPrice : Number(starRaw.price) || 19000,
          original_price: standardPrice > 0 ? standardPrice : 22000,
          is_bento_del_dia: true,
          is_daily_special: true,
          daily_special_label: specialLabel || 'El Bento del Día',
          subcategory: 'Bentos Caseros',
          categorySlug: 'boku-bentos',
          categoryId: 'b0000c01-0000-4000-a000-000000000001',
          categoryName: 'BOKU Bentos Caseros',
          desc:
            starRaw.description ||
            'Almuerzo completo de la casa. 🥣 Combo completo: Entrada casera + 🥤 Bebida de la casa.',
          description:
            starRaw.description ||
            'Almuerzo completo de la casa. 🥣 Combo completo: Entrada casera + 🥤 Bebida de la casa.',
          image:
            starRaw.image_url || 'https://aluna-qrmenu.vercel.app/brand/boku-bento-mestizo.webp',
          image_url:
            starRaw.image_url || 'https://aluna-qrmenu.vercel.app/brand/boku-bento-mestizo.webp',
          recipe_id: starRaw.recipe_id || null,
          stock_status: 'in',
          available_portions: 50,
          is_schedule_available: !isStorePausedForPublic,
          schedule_label: isStorePausedForPublic
            ? '🔒 Cocina en Pausa'
            : 'Disponible de 11:00 AM a 5:00 PM',
          modifierGroups: starRaw.modifierGroups || [SHARED_SOUP_GROUP, SHARED_DRINK_GROUP],
        };
      }
    }

    const secondaryBentoList = (activeSecondaryIds || [])
      .map((secId) => {
        if (secId === 'd07007ec-761b-4f40-bad5-799c1154b9ab') return pokeSalmonFresh;
        if (secId === 'b0000b25-0000-4000-a000-000000000025') return pokeToriKatsu;
        const rawSec = rawProducts.find((p) => p.id === secId);
        if (!rawSec) return null;
        return {
          ...rawSec,
          is_daily_special: true,
          daily_special_label: 'Opción del Día',
          categorySlug: 'boku-bentos',
          categoryId: 'b0000c01-0000-4000-a000-000000000001',
          categoryName: 'BOKU Bentos Caseros',
          modifierGroups: rawSec.modifierGroups || [SHARED_SOUP_GROUP, SHARED_DRINK_GROUP],
        };
      })
      .filter(Boolean);

    const dailyMap = new Map();
    if (bentoHeroToday) dailyMap.set(bentoHeroToday.id, bentoHeroToday);
    secondaryBentoList.forEach((item) => {
      if (!dailyMap.has(item.id)) dailyMap.set(item.id, item);
    });

    const candidateBentos = Array.from(dailyMap.values());
    const visibleBentos = candidateBentos.filter((b) => {
      const raw = rawProducts.find((p) => p.id === b.id);
      const isAlwaysVisible = Boolean(
        (bentoHeroToday && b.id === bentoHeroToday.id) ||
          (activeSecondaryIds && activeSecondaryIds.includes(b.id))
      );
      if (raw) {
        if (raw.is_active === false && !isAlwaysVisible) return false;
        if (!isAlwaysVisible && raw.stock_status === 'out') return false;
        const locActive = statusMap.get(b.id);
        if (locActive === false && !isAlwaysVisible) return false;
        const locStock = stockStatusMap.get(b.id);
        if (!isAlwaysVisible && locStock === 'out') return false;
      }
      return b.is_active !== false && (isAlwaysVisible || b.stock_status !== 'out');
    });

    const sanitizedVisibleBentos = visibleBentos.filter((b) => {
      if (!b) return false;
      if (b.id === 'b0000b21-0000-4000-a000-000000000021') return false;
      if (/arroz con pollo/i.test(b.name || '')) return false;
      return true;
    });
    grouped['boku-bentos'] = sanitizedVisibleBentos;

    // PRESENCIA EN BOKU BOWLS
    if (!grouped['boku-bowls']) grouped['boku-bowls'] = [];
    const toriInBowls = grouped['boku-bowls'].find(
      (p) => p.id === 'b0000b25-0000-4000-a000-000000000025'
    );
    if (toriInBowls) {
      Object.assign(toriInBowls, pokeToriKatsu);
      toriInBowls.price = 22000;
      toriInBowls.original_price = 28000;
      toriInBowls.modifierGroups = [TORI_SAUCE_GROUP, SHARED_SOUP_GROUP, SHARED_DRINK_GROUP];
    } else {
      grouped['boku-bowls'].unshift({
        ...pokeToriKatsu,
        categorySlug: 'boku-bowls',
        categoryId: '6316a6dc-8a4c-4cc1-874b-4f3d362ed635',
        categoryName: 'BOKU Bowls',
        subcategory: 'Bowls Poke Fresco',
        modifierGroups: [TORI_SAUCE_GROUP, SHARED_SOUP_GROUP, SHARED_DRINK_GROUP],
      });
    }

    const salmonInBowls = grouped['boku-bowls'].find(
      (p) => p.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab'
    );
    if (salmonInBowls) {
      salmonInBowls.price = 22000;
      salmonInBowls.original_price = 34000;
      salmonInBowls.stock_status = 'in';
      salmonInBowls.available_portions = 50;
      salmonInBowls.out_reason = null;
      salmonInBowls.modifierGroups = [SALMON_PREP_GROUP, SHARED_SOUP_GROUP, SHARED_DRINK_GROUP];
    }

    // ELIMINACIÓN DE PLATOS OBSOLETOS
    Object.keys(grouped).forEach((k) => {
      grouped[k] = (grouped[k] || []).filter((p) => {
        const lower = (p.name || '').toLowerCase();
        return (
          !lower.includes('arroz con pollo') &&
          p.id !== 'b0000b21-0000-4000-a000-000000000021' &&
          !lower.includes('boloñesa') &&
          !lower.includes('bolonesa') &&
          p.id !== 'b0000b17-0000-4000-a000-000000000007' &&
          p.id !== 'b0000f02-0000-4000-a000-000000000002' &&
          p.id !== 'b0000f03-0000-4000-a000-000000000003'
        );
      });
    });
  }

  return grouped;
}

export function filterAndScheduleCategories({
  allCategories = [],
  productsByCategory = {},
  activeLocationId,
  locationCategories = [],
  restaurantSettings,
  brand,
  isStorePausedForPublic,
}) {
  const locCatsForActive =
    activeLocationId && activeLocationId !== 'all'
      ? locationCategories.filter((lc) => lc.location_id === activeLocationId)
      : [];
  const hasLocCatConfig = locCatsForActive.length > 0;
  const now = new Date();
  const isBokuBrand =
    restaurantSettings?.brand_id === 'a63da806-a62a-49b9-a833-07e0976785ad' ||
    brand?.id === 'a63da806-a62a-49b9-a833-07e0976785ad' ||
    brand?.slug === 'boku-bento';

  return allCategories
    .filter((cat) => {
      if (cat.is_active === false) return false;

      if (
        isBokuBrand &&
        (cat.id === 'b0000c04-0000-4000-a000-000000000004' ||
          cat.slug === 'boku-desayunos-brunch' ||
          cat.name?.toLowerCase().includes('desayuno'))
      ) {
        return false;
      }

      if (activeLocationId && activeLocationId !== 'all' && hasLocCatConfig) {
        const locCat = locCatsForActive.find((lc) => lc.category_id === cat.id);
        if (locCat && locCat.is_active === false) return false;
      }

      const productsInCat = productsByCategory[cat.slug] || [];
      if (productsInCat.length === 0) return false;

      return true;
    })
    .map((cat) => {
      const scheduleInfo = getCategoryScheduleInfo(cat, now);
      const isBentoCat =
        isBokuBrand &&
        (cat.slug === 'boku-bentos' || cat.id === 'b0000c01-0000-4000-a000-000000000001');
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const isLunchTime = currentHour >= 10.5 && currentHour <= 17.0;

      return {
        ...cat,
        schedule_info: scheduleInfo,
        is_schedule_active: isBentoCat
          ? isStorePausedForPublic
            ? false
            : isLunchTime
          : scheduleInfo.isAvailableNow,
        schedule_label: isBentoCat
          ? isStorePausedForPublic
            ? '🔒 Cocina en Pausa'
            : 'Disponible de 11:00 AM a 5:00 PM'
          : scheduleInfo.label,
        is_schedule_restricted: isBentoCat ? !isLunchTime : scheduleInfo.isRestricted,
      };
    });
}
