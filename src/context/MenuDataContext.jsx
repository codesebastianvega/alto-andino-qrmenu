import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useBrand } from './BrandContext';
import { useLocation as useAppLocation } from './LocationContext';
import { catalogCache } from '../utils/offlineDb';
import { withTimeout } from '../utils/withTimeout';
import { useDynamicPWA } from '../hooks/useDynamicPWA';
import { useClarity } from '../hooks/useClarity';
import { getCategoryScheduleInfo, isRestaurantOpen } from '../utils/businessHours';
import { getDefaultBrandCoupons } from '../utils/couponSecurity';

const MenuDataContext = createContext({});

export const MenuDataProvider = ({ children }) => {
  const { activeLocationId } = useAppLocation();
  const [allCategories, setAllCategories] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [locationPrices, setLocationPrices] = useState([]);
  const [locationStatus, setLocationStatus] = useState([]);
  const [locationCategories, setLocationCategories] = useState([]);
  const [locationModLinks, setLocationModLinks] = useState([]);
  const [rawModifierGroups, setRawModifierGroups] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [banners, setBanners] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [homeSettings, setHomeSettings] = useState(null);
  const [locations, setLocations] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [brand, setBrand] = useState(null);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentLoadedBrandIdRef = React.useRef(null);

  // Get brand information from BrandContext (which resolves slug/session)
  const { brand: currentBrand, loadingBrand } = useBrand();
  const activeBrandId = currentBrand?.id ?? null;

  // Inyectar PWA manifest dinámico por marca
  useDynamicPWA({ brand: brand || currentBrand, restaurantSettings });

  // Expose the current location object for convenience
  const currentLocation = useMemo(() => {
    if (!locations || locations.length === 0) return null;
    if (activeLocationId && activeLocationId !== 'all') {
      const match = locations.find(l => l.id === activeLocationId);
      if (match) return match;
    }
    // Fallback al local principal o primer local de la marca activa
    return locations.find(l => l.is_main) || locations[0] || null;
  }, [locations, activeLocationId]);



  // Inyectar Microsoft Clarity exclusivamente en marcas autorizadas (Boku Bento)
  useClarity({ brand: brand || currentBrand, currentLocation });

  // Fetch menu data for a given brand
  const fetchMenuData = useCallback(async (brandId, { force = false } = {}) => {
    if (!brandId) {
      setLoading(false);
      return true;
    }
    const isDifferentBrand = currentLoadedBrandIdRef.current !== brandId;

    // Solo vaciamos estado y mostramos spinner global si cambiamos de restaurante.
    // Si es revalidación de la misma marca (ej. toggle de stock), se actualiza silenciosamente en segundo plano.
    if (isDifferentBrand) {
      setLoading(true);
      setAllCategories([]);
      setRawProducts([]);
      setLocationPrices([]);
      setLocationStatus([]);
      setLocationModLinks([]);
      setRawModifierGroups([]);
      setExperiences([]);
      setBanners([]);
      setAllergens([]);
      setHomeSettings(null);
      setRestaurantSettings(null);
      setBrand(null);
      setPlanFeatures([]);
      setLocations([]);
      setBusinessHours([]);
      setPromotions([]);
    }

    try {
      const cacheKey = `menu:v10:${brandId}`;
      let recentCache = null;
      if (!force) {
        try {
          recentCache = await withTimeout(catalogCache.get(cacheKey), 2500, 'La lectura del catálogo local');
        } catch (cacheReadError) {
          console.warn('MenuData: se omitió el caché local y se consultará Supabase.', cacheReadError);
        }
      }
      const hasValidModifierSchema = recentCache?.value?.modifierGroups?.some(g =>
        g.allow_quantity !== undefined || g.included_quantity !== undefined || g.modifier_options?.some(o => o.extra_price !== undefined)
      );
      if (recentCache?.value && hasValidModifierSchema) {
        const data = recentCache.value;
        setAllCategories(data.categories); setRawProducts(data.products); setRawModifierGroups(data.modifierGroups);
        setExperiences(data.experiences); setAllergens(data.allergens); setLocations(data.locations);
        setBanners(data.banners); setHomeSettings(data.homeSettings); setRestaurantSettings(data.restaurantSettings);
        setBrand(data.brand); setPlanFeatures(data.brand?.plans?.plan_features || []); setBusinessHours(data.businessHours);
        setLocationPrices(data.locationPrices); setLocationStatus(data.locationStatus);
        setLocationCategories(data.locationCategories); setLocationModLinks(data.locationModLinks);
        setPromotions(data.promotions || []);
        setLoading(false);

        // Si la cache tiene menos de 20 segundos, omitir la consulta a red
        if (Date.now() - recentCache.cachedAt < 20 * 1000) {
          return true;
        }
        // De lo contrario, continuamos en segundo plano para revalidar con Supabase (Stale-While-Revalidate)
      }

      if (!brandId) {
        setLoading(false);
        return true;
      }

      // Helper to add brand filter when needed
      const brandFilter = (query) => query.eq('brand_id', brandId);

      // 1. Fetch all brand-level data in PARALLEL
      const [
        catsRes,
        modsRes,
        expRes,
        allgsRes,
        locsRes,
        bnrsRes,
        hSettRes,
        rSettRes,
        brandRes,
        prodsRes,
        hoursRes,
        promosRes
      ] = await withTimeout(Promise.all([
        brandFilter(supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true })),
        brandFilter(supabase.from('modifier_groups').select('*, modifier_options!modifier_options_group_id_fkey(id, group_id, name, price, extra_price, sort_order, created_at, nested_group_id, image_url, emoji, ingredient_id, is_active, stock_status, available_portions, ingredients!modifier_options_ingredient_id_fkey(image_url))')),
        brandFilter(supabase.from('experiences').select('*').eq('is_active', true).order('created_at', { ascending: false })),
        brandFilter(supabase.from('allergens').select('*').order('name')),
        brandFilter(supabase.from('locations').select('*').eq('is_active', true).order('is_main', { ascending: false })),
        brandFilter(supabase.from('promo_banners').select('*').eq('is_active', true).order('sort_order', { ascending: true })),
        brandFilter(supabase.from('home_settings').select('*').limit(1)),
        brandFilter(supabase.from('restaurant_settings').select('*')),
        supabase.from('brands').select('*, plans(*, plan_features(*))').eq('id', brandId).single(),
        brandFilter(supabase.from('products').select('*, categories:category_id (slug)').order('sort_order', { ascending: true })),
        brandFilter(supabase.from('business_hours').select('*').order('day_of_week', { ascending: true })),
        brandFilter(supabase.from('promotions').select('*').eq('is_active', true).order('created_at', { ascending: false }))
      ]), 15000, 'La carga inicial del menú');

      if (modsRes?.error) console.error('MenuData modsRes error:', modsRes.error);
      const criticalError = [brandRes, catsRes, prodsRes, modsRes].find((result) => result.error)?.error;
      if (criticalError) throw criticalError;

      // Set brand and plan features from the joined query
      if (brandRes.data) {
        setBrand(brandRes.data);
        const features = brandRes.data.plans?.plan_features || [];
        setPlanFeatures(features);
      }

      const enrichedModGroups = (modsRes.data || []).map(group => {
        const opts = Array.isArray(group.modifier_options) ? [...group.modifier_options] : [];
        if (group.id === 'b0000d14-0000-4000-a000-000000000004') {
          if (!opts.some(o => /ma[ií]z/i.test(o.name || ''))) {
            opts.push({
              id: 'boku-opt-maiz-tierno',
              group_id: group.id,
              name: 'Maíz Tierno Dulce',
              emoji: '🌽',
              price: 0,
              extra_price: 1500,
              is_active: true,
              stock_status: 'in',
              sort_order: 2
            });
          }
          if (!opts.some(o => /zanahoria/i.test(o.name || ''))) {
            opts.push({
              id: 'boku-opt-zanahoria-fresca',
              group_id: group.id,
              name: 'Zanahoria Fresca Rallada',
              emoji: '🥕',
              price: 0,
              extra_price: 1500,
              is_active: true,
              stock_status: 'in',
              sort_order: 3
            });
          }
        }
        if (group.id === 'b0000d14-0000-4000-a000-000000000006') {
          if (!opts.some(o => /ch[ií]a/i.test(o.name || ''))) {
            opts.push({
              id: 'boku-opt-semillas-chia',
              group_id: group.id,
              name: 'Semillas de Chía',
              emoji: '🌱',
              price: 0,
              extra_price: 500,
              is_active: true,
              stock_status: 'in',
              sort_order: 1
            });
          }
        }
        return { ...group, modifier_options: opts };
      });

      setAllCategories(catsRes.data || []);
      setRawModifierGroups(enrichedModGroups);
      setExperiences(expRes.data || []);
      setAllergens(allgsRes.data || []);
      setLocations(locsRes.data || []);
      setBanners(bnrsRes.data || []);
      const rawHomeSettings = hSettRes.data?.[0] || null;
      setHomeSettings(rawHomeSettings);

      const allRS = rSettRes.data || [];
      const brandLevelRS = allRS.find(s => !s.location_id) || null;
      const mainLoc = locsRes.data?.find(l => l.is_main);
      const bestRS = allRS.find(s => activeLocationId && s.location_id === activeLocationId)
        || allRS.find(s => mainLoc && s.location_id === mainLoc.id)
        || brandLevelRS
        || allRS.find(s => s.logo_url)
        || allRS[0]
        || null;

      if (bestRS) {
        if (brandLevelRS && brandLevelRS.brand_concepts?.length > 0) {
          if (!bestRS.brand_concepts || bestRS.brand_concepts.length === 0) {
            bestRS.brand_concepts = brandLevelRS.brand_concepts;
          } else {
            // Keep brand-level concepts (like bento_del_dia_config & meal_plans_config) always in sync with brand-level row
            const brandSpecial = brandLevelRS.brand_concepts.find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config'));
            const brandMealPlans = brandLevelRS.brand_concepts.find(c => c && c.id === 'meal_plans_config');
            if (brandSpecial) {
              bestRS.brand_concepts = [
                ...bestRS.brand_concepts.filter(c => c && c.id !== 'bento_del_dia_config' && c.id !== 'daily_special_config'),
                brandSpecial
              ];
            }
            if (brandMealPlans) {
              bestRS.brand_concepts = [
                ...bestRS.brand_concepts.filter(c => c && c.id !== 'meal_plans_config'),
                brandMealPlans
              ];
            }
          }
        }
        if (!bestRS.logo_url) {
          const rowWithLogo = allRS.find(s => s.logo_url);
          if (rowWithLogo) {
            bestRS.logo_url = rowWithLogo.logo_url;
            if (!bestRS.favicon_url) bestRS.favicon_url = rowWithLogo.favicon_url;
          }
        }
        if (brandRes.data?.name && (bestRS.business_name === 'Alto Andino' || !bestRS.business_name) && brandRes.data.slug !== 'alto-andino') {
          bestRS.business_name = brandLevelRS?.business_name || brandRes.data.name;
        }
      }

      setRestaurantSettings(bestRS);
      setRawProducts(prodsRes.data || []);
      setBusinessHours(hoursRes.data || []);
      setPromotions(promosRes?.data || []);

      // 2. Fetch location-specific overrides (only if locations exist)
      let cachedLocationPrices = [];
      let cachedLocationStatus = [];
      let cachedLocationCategories = [];
      let cachedLocationModLinks = [];
      if (locsRes.data?.length > 0) {
        const locationIds = locsRes.data.map(l => l.id);
        const [pricesRes, statusRes, catLinksRes, modLinksRes] = await withTimeout(Promise.all([
          supabase.from('location_product_prices').select('*').in('location_id', locationIds),
          supabase.from('location_product_status').select('*').in('location_id', locationIds),
          supabase.from('location_categories').select('*').in('location_id', locationIds),
          supabase.from('location_modifier_groups').select('*').in('location_id', locationIds)
        ]), 10000, 'La carga de configuración por sede');

        setLocationPrices(pricesRes.data || []);
        setLocationStatus(statusRes.data || []);
        setLocationCategories(catLinksRes.data || []);
        setLocationModLinks(modLinksRes.data || []);
        cachedLocationPrices = pricesRes.data || [];
        cachedLocationStatus = statusRes.data || [];
        cachedLocationCategories = catLinksRes.data || [];
        cachedLocationModLinks = modLinksRes.data || [];
      }

      const cachePayload = {
        categories: catsRes.data || [], products: prodsRes.data || [], modifierGroups: modsRes.data || [],
        experiences: expRes.data || [], allergens: allgsRes.data || [], locations: locsRes.data || [],
        banners: bnrsRes.data || [], homeSettings: rawHomeSettings,
        restaurantSettings: bestRS, brand: brandRes.data || null,
        businessHours: hoursRes.data || [], locationPrices: cachedLocationPrices,
        locationStatus: cachedLocationStatus, locationCategories: cachedLocationCategories,
        locationModLinks: cachedLocationModLinks,
        promotions: promosRes?.data || []
      };
      try {
        await withTimeout(catalogCache.put(cacheKey, cachePayload), 2500, 'La escritura del catálogo local');
      } catch (cacheWriteError) {
        console.warn('MenuData: el menú cargó, pero no se pudo actualizar el caché local.', cacheWriteError);
      }

      currentLoadedBrandIdRef.current = brandId;
      console.log('✅ MenuData Parallel Fetch Complete');
      return true;

    } catch (err) {
      console.error('❌ MenuData Fetch Error:', err);
      let recoveredFromCache = false;
      try {
        const cached = await withTimeout(catalogCache.get(`menu:v10:${brandId}`), 2500, 'La recuperación del catálogo local');
        if (cached?.value) {
          const data = cached.value;
          setAllCategories(data.categories); setRawProducts(data.products); setRawModifierGroups(data.modifierGroups);
          setExperiences(data.experiences); setAllergens(data.allergens); setLocations(data.locations);
          setBanners(data.banners); setHomeSettings(data.homeSettings); setRestaurantSettings(data.restaurantSettings);
          setBrand(data.brand); setPlanFeatures(data.brand?.plans?.plan_features || []); setBusinessHours(data.businessHours);
          setLocationPrices(data.locationPrices); setLocationStatus(data.locationStatus);
          setLocationCategories(data.locationCategories); setLocationModLinks(data.locationModLinks);
          currentLoadedBrandIdRef.current = brandId;
          recoveredFromCache = true;
        }
      } catch (cacheError) {
        console.error('No fue posible restaurar el catalogo local:', cacheError);
      }
      return recoveredFromCache;
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute modifiers reactively and filter by location
  const modifiers = useMemo(() => {
    const modGroups = {};
    // 1. Identify primary groups visible in this location
    const directlyAllowedGroups = (rawModifierGroups || []).filter(group => {
      if (!activeLocationId || activeLocationId === 'all') return true; 
      if (!locationModLinks || locationModLinks.length === 0) return true; // Brand fallback

      // If a group has NO records in locationModLinks anywhere, it is brand-wide and inherited by all locations
      const groupHasAnyLinks = (locationModLinks || []).some(link => link.modifier_group_id === group.id);
      if (!groupHasAnyLinks) return true;

      // If it is explicitly linked to specific locations, only show if linked to active location
      return (locationModLinks || []).some(link => 
        link.modifier_group_id === group.id && link.location_id === activeLocationId
      );
    });

    // 2. Also ensure any nested sub-groups referenced by options in allowed groups are included
    const nestedGroupIds = new Set();
    directlyAllowedGroups.forEach(group => {
      (group.modifier_options || []).forEach(opt => {
        if (opt.nested_group_id) nestedGroupIds.add(opt.nested_group_id);
      });
    });

    const allowedGroupIds = new Set(directlyAllowedGroups.map(g => g.id));
    const filteredGroups = (rawModifierGroups || []).filter(group => 
      allowedGroupIds.has(group.id) || nestedGroupIds.has(group.id)
    );

    filteredGroups.forEach(group => {
      const groupName = group.name;
      const options = (group.modifier_options || [])
        .filter(opt => opt.is_active !== false)
        .map(opt => {
          let optName = opt.name;
          if (opt.name?.toLowerCase().includes('sopita de tomate') || opt.name?.toLowerCase().includes('sopa de tomate') || opt.name?.toLowerCase().includes('ramen')) {
            optName = '🥣 Crema de Espinaca casera (16 oz)';
          }
          return {
            ...opt,
            id: opt.id,
            name: optName,
          price: opt.price || 0,
          extra_price: opt.extra_price !== null && opt.extra_price !== undefined ? Number(opt.extra_price) : Number(opt.price || 0),
          emoji: opt.emoji,
          image_url: opt.image_url || opt.ingredients?.image_url || null,
          group: groupName,
          groupId: group.id,
          ingredient_id: opt.ingredient_id,
          is_active: opt.is_active !== false,
          stock_status: opt.stock_status || (opt.is_active === false ? 'out' : 'in'),
          available_portions: opt.available_portions !== null && opt.available_portions !== undefined ? Number(opt.available_portions) : null,
          is_out: opt.stock_status === 'out' || opt.is_active === false
        }; }).sort((a, b) => a.sort_order - b.sort_order);
      modGroups[groupName] = options;
      modGroups[group.id] = options;
    });
    return modGroups;
  }, [rawModifierGroups, locationModLinks, activeLocationId]);

  const currentBusinessHours = useMemo(() => {
    let hours = [];
    if (activeLocationId && activeLocationId !== 'all') {
      hours = businessHours.filter(h => h.location_id === activeLocationId);
    }
    if (!hours.length) {
      hours = businessHours.filter(h => !h.location_id);
    }
    if (!hours.length && businessHours.length > 0) {
      hours = businessHours;
    }
    return hours;
  }, [businessHours, activeLocationId]);

  // Evaluador de apertura/cierre automático con preservación de referencia
  // Solo actualiza el estado si los valores reales de apertura/pausa cambian,
  // evitando re-renderizar todo el árbol de componentes (66 consumidores) continuamente.
  const [storeStatusInfo, setStoreStatusInfo] = useState(() => isRestaurantOpen(currentBusinessHours, brand?.config));

  useEffect(() => {
    const checkStatus = () => {
      const nextStatus = isRestaurantOpen(currentBusinessHours, brand?.config);
      setStoreStatusInfo(prev => {
        if (!prev && !nextStatus) return prev;
        if (
          prev?.isOpen === nextStatus?.isOpen &&
          prev?.isManualPause === nextStatus?.isManualPause &&
          prev?.isScheduleClosed === nextStatus?.isScheduleClosed &&
          prev?.message === nextStatus?.message &&
          prev?.reopenFormatted === nextStatus?.reopenFormatted
        ) {
          return prev; // Mantiene la misma referencia de objeto para evitar re-renders innecesarios
        }
        return nextStatus;
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [currentBusinessHours, brand?.config]);

  const isAdminContext = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/admin') ||
    window.location.hash.startsWith('#admin') ||
    window.location.hash.includes('admin')
  );
  const isStorePausedForPublic = !isAdminContext && Boolean(storeStatusInfo && !storeStatusInfo.isOpen);

  // Compute productsByCategory reactively
  const productsByCategory = useMemo(() => {
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

    // 2. Plato / Especial del Día universal dynamic rotation
    const isBoku = restaurantSettings?.brand_id === 'a63da806-a62a-49b9-a833-07e0976785ad' 
      || brand?.id === 'a63da806-a62a-49b9-a833-07e0976785ad' 
      || brand?.slug === 'boku-bento';

    const dailySpecialConcept = (restaurantSettings?.brand_concepts || []).find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config'));
    const isSpecialEnabled = dailySpecialConcept ? dailySpecialConcept.enabled !== false : false;
    const specialLabel = dailySpecialConcept?.label || (isBoku ? 'El Bento del Día' : 'Plato del Día');
    const promoPrice = Number(dailySpecialConcept?.promo_price) || 0;
    const standardPrice = Number(dailySpecialConcept?.standard_price) || 0;
    const soupName = dailySpecialConcept?.soup_name || (isBoku ? 'Sopa de apio casera (16 oz)' : 'Crema de verduras casera (16 oz)');
    const drinkName = dailySpecialConcept?.drink_name || (isBoku ? 'Limonada Verde Antioxidante (5 oz)' : 'Bebida natural de la Casa (5 oz)');
    const defaultSchedule = {
      1: 'b0000b11-0000-4000-a000-000000000001', // Lunes
      2: 'b0000b12-0000-4000-a000-000000000002', // Martes
      3: 'b0000b13-0000-4000-a000-000000000003', // Miércoles
      4: 'b0000b14-0000-4000-a000-000000000004', // Jueves
      5: 'b0000b15-0000-4000-a000-000000000005', // Viernes
      6: null,
      0: null
    };
    const specialSchedule = dailySpecialConcept?.schedule || defaultSchedule;
    const manualOverride = dailySpecialConcept?.manual_override_product_id;
    const currentDayOfWeek = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    
    // Si es Boku, el Bento del Día configurado es Bento Tex-Mex (o el manualOverride activo)
    const activeSpecialId = isBoku 
      ? (manualOverride || specialSchedule[currentDayOfWeek] || 'b0000b25-0000-4000-a000-000000000025')
      : (manualOverride || (isSpecialEnabled ? specialSchedule[currentDayOfWeek] : null));

    // Platos adicionales seleccionados para el almuerzo ("Más Opciones del Día")
    const activeSecondaryIds = Array.isArray(dailySpecialConcept?.secondary_product_ids)
      ? dailySpecialConcept.secondary_product_ids
      : (dailySpecialConcept?.secondary_schedule?.[currentDayOfWeek] || (isBoku ? ['d07007ec-761b-4f40-bad5-799c1154b9ab'] : []));

    const isTodaySpecialItem = (id) => Boolean(id && (
      id === activeSpecialId ||
      activeSecondaryIds.includes(id) ||
      (isBoku && (id === 'b0000b25-0000-4000-a000-000000000025' || id === 'd07007ec-761b-4f40-bad5-799c1154b9ab'))
    ));

    (rawProducts || []).forEach(product => {
      const catSlug = product.categories?.slug || 'otros';

      // ── Desactivar Desayunos por hoy en Boku Bento ──
      if (isBoku && (product.category_id === 'b0000c04-0000-4000-a000-000000000004' || catSlug === 'boku-desayunos-brunch')) {
        return;
      }

      // ── Desactivar Boloñesa en Boku Bento ──
      if (isBoku && (
        product.id === 'b0000f02-0000-4000-a000-000000000002' ||
        product.id === 'b0000f03-0000-4000-a000-000000000003' ||
        product.id === 'b0000b17-0000-4000-a000-000000000007' ||
        product.name?.toLowerCase().includes('boloñesa') ||
        product.name?.toLowerCase().includes('bolonesa')
      )) {
        return;
      }

      // Si el producto es el plato estrella o una opción del almuerzo de hoy, NO se oculta aunque esté inactivo en el catálogo general
      const isSpecialChoiceToday = isTodaySpecialItem(product.id);

      if (isBoku) {
        if (product.id === 'b0000b13-0000-4000-a000-000000000003' || product.id === 'b0000b19-0000-4000-a000-000000000020') {
          if (!isSpecialChoiceToday) return;
        }
        if (product.is_active === false && !isSpecialChoiceToday) {
          return;
        }
      } else if (product.is_active === false && !isSpecialChoiceToday) {
        return;
      }

      // Apply location product status override
      if (activeLocationId && activeLocationId !== 'all' && hasLocProductConfig) {
        // Los platos del almuerzo de hoy nunca deben ser bloqueados por status de sede anterior
        const isActiveOverride = isSpecialChoiceToday
          ? true 
          : statusMap.get(product.id);

        if (isActiveOverride === false) {
          return;
        }
      }

      const cat = (allCategories || []).find(c => c.slug === catSlug || c.id === product.category_id);
      const catSchedule = getCategoryScheduleInfo(cat);
      
      // Apply location price override
      let finalPrice = product.price;
      if (activeLocationId && activeLocationId !== 'all') {
        const locPrice = priceMap.get(product.id);
        if (locPrice !== undefined && locPrice !== null) {
          finalPrice = locPrice;
        }
      }

      // Universal Daily Special Rotation
      const isScheduledSpecial = Boolean(activeSpecialId && product.id === activeSpecialId);
      let isExplicitSpecial = product.subcategory === specialLabel 
        || product.subcategory === 'El Bento del Día' 
        || (product.name && product.name.toLowerCase().includes('especial del día'));

      // Si es Boku y es el Bento Hawaiano de ayer, no debe mostrarse como plato de hoy
      if (isBoku && product.id === 'b0000b19-0000-4000-a000-000000000020') {
        isExplicitSpecial = false;
      }

      const isSpecialToday = isScheduledSpecial || isExplicitSpecial;
      const isBento = catSlug === 'boku-bentos' || product.category_id === 'b0000c01-0000-4000-a000-000000000001';
      let productSubcategory = product.subcategory;
      let originalPrice = undefined;

      if (isSpecialToday) {
        // Si es el Bento del Día programado o activo en Boku, usar promoPrice ($19.000)
        finalPrice = isBoku
          ? (promoPrice > 0 ? promoPrice : 19000)
          : ((product.price !== undefined && product.price !== null && Number(product.price) > 0)
            ? Number(product.price)
            : (promoPrice > 0 ? promoPrice : 19000));
        if (standardPrice > finalPrice) {
          originalPrice = standardPrice;
        }
        productSubcategory = specialLabel;
      } else if (isBento) {
        // Respect the product's actual price from DB/location! Never overwrite a custom DB price.
        if ((finalPrice === undefined || finalPrice === null || Number(finalPrice) === 0) && standardPrice > 0) {
          finalPrice = standardPrice;
        }
        productSubcategory = product.subcategory || 'Bentos Tradicionales & Fusión';
      }

      // Tratamiento especial de Pasta Alfredo en BOKU BENTO (Pertenencia nativa a Pastas & Ramen)
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
        finalDesc = 'Tornillos fusilli al dente en salsa cremosa Alfredo casera con pechuga de pollo en cubos dorados, champiñones frescos y queso parmesano rallado.';
      }

      if (isBoku && product.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab') {
        finalPrice = 22000;
        originalPrice = 34000;
        productSubcategory = 'Bowls Poke Fresco';
        finalName = 'Poke Salmón Fresh (Fresco o Salteado)';
        finalDesc = 'Cubos de salmón fresco magro (100g), arroz, láminas de rábano al limón, mango dulce, pepino, ajonjolí, semillas de girasol y ponzu cítrico. 👉 Término a elección: Fresco estilo Poke o Salteado al Wok. 🥣 Incluye: Sopita del día o Fruta + 🥤 Jugo del día.';
      }

      if (isBoku && product.id === 'b0000b25-0000-4000-a000-000000000025') {
        finalPrice = 22000;
        originalPrice = 28000;
        productSubcategory = 'Bowls Poke Fresco';
        finalName = 'Poke Tori Katsu (Pechuga Crocante)';
        finalDesc = 'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde del cebollín. 🥣 Incluye: Sopita del día o Fruta + 🥤 Jugo del día.';
        finalImage = '/img/products/boku-tori-katsu.webp';
      }

      const isBokuDailySpecial = isBoku && isTodaySpecialItem(product.id);
      let finalStockStatus = isBokuDailySpecial ? 'in' : (product.stock_status || 'in');
      let finalAvailablePortions = isBokuDailySpecial
        ? 50
        : (product.available_portions !== null && product.available_portions !== undefined ? Number(product.available_portions) : null);
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
        _supabase: product
      };

      if (product.is_addon !== true) {
        if (!grouped[finalCatSlug]) grouped[finalCatSlug] = [];
        grouped[finalCatSlug].push(normalizedProduct);
      }
    });

    // ── DOBLE PRESENCIA Y ALMUERZOS DE HOY EN BOKU BENTO ──
    if (isBoku) {
      if (!grouped['boku-bentos']) grouped['boku-bentos'] = [];

      // Modificadores Compartidos de Entrada y Bebida de la Casa
      const sharedSoupGroup = {
        id: 'b0000b20-0000-4000-a000-000000000002',
        name: '🥣 Entrada Incluida',
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: 'opt-bento-sopa-dia', name: 'Sopita del día casera (16 oz)', price: 0, is_default: true },
          { id: 'opt-bento-fruta', name: 'Porción de Fruta fresca picada', price: 0 },
          { id: 'opt-bento-nosoup', name: 'Sin sopa ni fruta', price: 0 }
        ]
      };

      const sharedDrinkGroup = {
        id: 'b0000b20-0000-4000-a000-000000000001',
        name: '🥤 Bebida del Día Incluida',
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: 'opt-bento-jugo-dia', name: 'Jugo del día refrescante (5 oz)', price: 0, is_default: true },
          { id: 'opt-bento-hatsu-caja', name: 'Cambiar por Té Hatsu en Caja (200 ml)', price: 2000 },
          { id: 'opt-bento-hatsu-lata', name: 'Cambiar por Té Hatsu en Lata (250 ml)', price: 4000 },
          { id: 'opt-bento-nodrink', name: 'Sin bebida', price: 0 }
        ]
      };

      // Modificador de Preparación de Salmón (Fresco vs Salteado)
      const salmonPrepGroup = {
        id: 'mg-salmon-prep',
        name: '🍣 Término del Salmón',
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: 'opt-salmon-fresco', name: 'Salmón Fresco (Estilo Poke Crudo Marinado)', price: 0, is_default: true },
          { id: 'opt-salmon-salteado', name: 'Salmón Salteado al Wok (Sellado Caliente)', price: 0 }
        ]
      };

      // Modificador de Salsa Tonkatsu para Tori Katsu
      const toriSauceGroup = {
        id: 'mg-tori-sauce',
        name: '🥢 Salsa Tonkatsu',
        min_select: 1,
        max_select: 1,
        is_required: true,
        options: [
          { id: 'opt-tori-sauce-on', name: 'Tonkatsu bañada sobre la pechuga crocante', price: 0, is_default: true },
          { id: 'opt-tori-sauce-side', name: 'Tonkatsu en envase aparte', price: 0 }
        ]
      };

      // 0A. Poke Tori Katsu (Pechuga Crocante) - Nueva Línea Poke Premium
      const pokeToriKatsu = {
        id: 'b0000b25-0000-4000-a000-000000000025',
        productId: 'b0000b25-0000-4000-a000-000000000025',
        name: 'Poke Tori Katsu (Pechuga Crocante)',
        price: 22000,
        original_price: 28000,
        is_bento_del_dia: true,
        is_daily_special: true,
        daily_special_label: '🔥 Línea Poke Premium ($22.000)',
        subcategory: 'Línea Poke Premium',
        categorySlug: 'boku-bentos',
        categoryId: 'b0000c01-0000-4000-a000-000000000001',
        categoryName: 'BOKU Bentos Caseros',
        desc: 'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde de cebollín. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
        description: 'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde de cebollín. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
        image: '/img/products/boku-tori-katsu.webp',
        image_url: '/img/products/boku-tori-katsu.webp',
        recipe_id: null,
        stock_status: 'in',
        available_portions: 50,
        is_schedule_available: isStorePausedForPublic ? false : true,
        schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
        modifierGroups: [
          toriSauceGroup,
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      };

      // 0B. Poke Salmón Fresh (Fresco o Salteado) - Nueva Línea Poke Premium
      const salmonRaw = (rawProducts || []).find(p => p.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab');
      const pokeSalmonFresh = {
        ...(salmonRaw || {}),
        id: 'd07007ec-761b-4f40-bad5-799c1154b9ab',
        productId: 'd07007ec-761b-4f40-bad5-799c1154b9ab',
        name: 'Poke Salmón Fresh (Fresco o Salteado)',
        price: 22000,
        original_price: 34000,
        is_bento_del_dia: true,
        is_daily_special: true,
        daily_special_label: '🔥 Línea Poke Premium ($22.000)',
        subcategory: 'Línea Poke Premium',
        categorySlug: 'boku-bentos',
        categoryId: 'b0000c01-0000-4000-a000-000000000001',
        categoryName: 'BOKU Bentos Caseros',
        desc: 'Cubos de salmón fresco magro (100g), arroz, láminas de rábano al limón, mango dulce, pepino, ajonjolí, semillas de girasol y ponzu cítrico. 👉 Término a elección: Fresco estilo Poke o Salteado al Wok. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
        description: 'Cubos de salmón fresco magro (100g), arroz, láminas de rábano al limón, mango dulce, pepino, ajonjolí, semillas de girasol y ponzu cítrico. 👉 Término a elección: Fresco estilo Poke o Salteado al Wok. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
        image: salmonRaw?.image_url || 'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/5nby4hb4t2_1791998655434.webp',
        image_url: salmonRaw?.image_url || 'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/5nby4hb4t2_1791998655434.webp',
        recipe_id: salmonRaw?.recipe_id || 'ba000012-0000-4000-a000-000000000001',
        stock_status: 'in',
        available_portions: 50,
        is_schedule_available: isStorePausedForPublic ? false : true,
        schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
        modifierGroups: [
          salmonPrepGroup,
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      };

      // 1. Bento Mediterráneo (Fresco y Balanceado) 🐠 - Nuevo Especial
      const bentoMediterraneo = {
        id: 'b0000b18-0000-4000-a000-000000000018',
        productId: 'b0000b18-0000-4000-a000-000000000018',
        name: 'Bento Mediterráneo (Fresco y Balanceado)',
        price: 19000,
        original_price: 22000,
        is_bento_del_dia: true,
        is_daily_special: true,
        daily_special_label: 'Nuevo Especial',
        subcategory: 'Bentos Caseros',
        categorySlug: 'boku-bentos',
        categoryId: 'b0000c01-0000-4000-a000-000000000001',
        categoryName: 'BOKU Bentos Caseros',
        desc: 'Arroz blanco con perejil, hummus casero cremoso de garbanzo con aceite y páprika, champiñones al ajillo, pepino fresco, tomates cherry y rábano crocante. 👉 Proteína a elección (al limón): Filete de merluza dorada o pechuga de pollo al wok. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        description: 'Arroz blanco con perejil, hummus casero cremoso de garbanzo con aceite y páprika, champiñones al ajillo, pepino fresco, tomates cherry y rábano crocante. 👉 Proteína a elección (al limón): Filete de merluza dorada o pechuga de pollo al wok. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        image: '/bento-mediterraneo.jpg',
        image_url: '/bento-mediterraneo.jpg',
        recipe_id: null,
        stock_status: 'in',
        available_portions: 50,
        is_schedule_available: isStorePausedForPublic ? false : true,
        schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
        modifierGroups: [
          {
            id: 'mg-medit-protein',
            name: '🐟 Proteína al Limón',
            min_select: 1,
            max_select: 2,
            included_count: 1,
            extra_price: 8000,
            options: [
              { id: 'opt-medit-merluza', name: 'Filete de merluza dorada', price: 0, extra_price: 8000, is_default: true },
              { id: 'opt-medit-pollo', name: 'Pechuga de pollo al wok', price: 0, extra_price: 7000 }
            ]
          },
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      };

      // 2. Bento Criollo Antioqueño (La Paisa) - Actualizado
      const criolloRaw = (rawProducts || []).find(p => p.id === 'b0000b11-0000-4000-a000-000000000001');
      const bentoCriollo = {
        ...(criolloRaw || {}),
        id: 'b0000b11-0000-4000-a000-000000000001',
        productId: 'b0000b11-0000-4000-a000-000000000001',
        name: 'Bento Criollo Antioqueño (La Paisa)',
        price: 19000,
        original_price: 22000,
        is_bento_del_dia: true,
        is_daily_special: true,
        daily_special_label: 'Favorito de la Casa',
        subcategory: 'Bentos Caseros',
        categorySlug: 'boku-bentos',
        categoryId: 'b0000c01-0000-4000-a000-000000000001',
        categoryName: 'BOKU Bentos Caseros',
        desc: 'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        description: 'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        image: criolloRaw?.image_url || 'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/4l57b6hx21n_1792011029842.webp',
        image_url: criolloRaw?.image_url || 'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/4l57b6hx21n_1792011029842.webp',
        recipe_id: 'ba000010-0000-4000-a000-000000000001',
        stock_status: 'in',
        available_portions: 50,
        is_schedule_available: isStorePausedForPublic ? false : true,
        schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
        modifierGroups: [
          {
            id: 'mg-criollo-frijol',
            name: '🍲 Tu Fríjol',
            min_select: 1,
            max_select: 2,
            included_count: 1,
            extra_price: 4000,
            options: [
              { id: 'opt-criollo-frijol-rojo', name: 'Fríjoles rojos calados', price: 0, extra_price: 4000, is_default: true },
              { id: 'opt-criollo-frijol-negro', name: 'Fríjoles negros', price: 0, extra_price: 4000 }
            ]
          },
          {
            id: 'mg-criollo-protein',
            name: '🥩 Tu Proteína Criolla',
            min_select: 1,
            max_select: 3,
            included_count: 1,
            extra_price: 7000,
            options: [
              { id: 'opt-criollo-molida', name: 'Carne molida sazonada', price: 0, extra_price: 7000, is_default: true },
              { id: 'opt-criollo-cerdo', name: 'Cerdo al wok en cubos', price: 0, extra_price: 7000 },
              { id: 'opt-criollo-pollo', name: 'Pollo al wok en cubos', price: 0, extra_price: 7000 }
            ]
          },
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      };

      // 3. Bento Mestizo -> Plato del Día ($19.000 con sopa y bebida)
      const mestizoRaw = (rawProducts || []).find(p => p.id === 'b0000b14-0000-4000-a000-000000000004') ||
                         (rawProducts || []).find(p => p.id === activeSpecialId) ||
                         grouped['boku-bentos']?.find(p => p.id === activeSpecialId);
      
      const bentoHeroToday = {
        ...(mestizoRaw || {}),
        id: 'b0000b14-0000-4000-a000-000000000004',
        productId: 'b0000b14-0000-4000-a000-000000000004',
        name: 'Bento Mestizo (Especial del Día)',
        price: 19000,
        original_price: 22000,
        is_bento_del_dia: true,
        is_daily_special: true,
        daily_special_label: 'El Bento del Día',
        subcategory: 'Bentos Caseros',
        categorySlug: 'boku-bentos',
        categoryId: 'b0000c01-0000-4000-a000-000000000001',
        categoryName: 'BOKU Bentos Caseros',
        desc: 'Arroz blanco, champiñones al ajillo, brócoli al vapor, tomates cherry y ensalada cremosa de remolacha y zanahoria en cubitos con mayonesa. Principio a elección (garbanzos caseros o maduritos melosos) y proteína a elección (pollo al curry dorado o cerdo teriyaki). 🥣 ¡Combo completo! Incluye Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        description: 'Arroz blanco, champiñones al ajillo, brócoli al vapor, tomates cherry y ensalada cremosa de remolacha y zanahoria en cubitos con mayonesa. Principio a elección (garbanzos caseros o maduritos melosos) y proteína a elección (pollo al curry dorado o cerdo teriyaki). 🥣 ¡Combo completo! Incluye Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        image: 'https://aluna-qrmenu.vercel.app/brand/boku-bento-mestizo.webp',
        image_url: 'https://aluna-qrmenu.vercel.app/brand/boku-bento-mestizo.webp',
        recipe_id: 'ba000040-0000-4000-a000-000000000004',
        stock_status: 'in',
        available_portions: 50,
        is_schedule_available: isStorePausedForPublic ? false : true,
        schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
        modifierGroups: [
          {
            id: 'mg-mestizo-protein',
            name: '🍗 Tu Proteína',
            min_select: 1,
            max_select: 2,
            included_count: 1,
            extra_price: 7000,
            options: [
              { id: 'opt-mestizo-pollo-curry', name: 'Pollo al curry dorado', price: 0, is_default: true },
              { id: 'opt-mestizo-cerdo-teriyaki', name: 'Cerdo teriyaki', price: 0 }
            ]
          },
          {
            id: 'mg-mestizo-principio',
            name: '🍲 Tu Principio Casero',
            min_select: 1,
            max_select: 2,
            included_count: 1,
            extra_price: 4000,
            options: [
              { id: 'opt-mestizo-garbanzos', name: 'Garbanzos caseros', price: 0, is_default: true },
              { id: 'opt-mestizo-maduritos', name: 'Maduritos melosos en panela', price: 0 },
              { id: 'opt-mestizo-mitad', name: 'Mitad garbanzos y mitad maduritos', price: 0 },
              { id: 'opt-mestizo-sin-principio', name: '🚫 Sin principio', price: 0 }
            ]
          },
          {
            id: 'mg-mestizo-veggies',
            name: '🥗 Ensalada & Vegetales',
            min_select: 0,
            max_select: 5,
            options: [
              { id: 'opt-mestizo-ensalada-aparte', name: 'Ensalada en recipiente aparte', price: 0 },
              { id: 'opt-mestizo-sin-ensalada', name: '🚫 Sin ensalada cremosa', price: 0 },
              { id: 'opt-mestizo-sin-champinones', name: '🚫 Sin champiñones al ajillo', price: 0 },
              { id: 'opt-mestizo-sin-brocoli', name: '🚫 Sin brócoli al vapor', price: 0 },
              { id: 'opt-mestizo-sin-tomates', name: '🚫 Sin tomates cherry', price: 0 }
            ]
          },
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      };

      // 4. Mazorcada de la Casa -> "Más Opciones del Día" ($19.000 con sopa y bebida)
      const mazorcadaToday = {
        id: 'b0000b22-0000-4000-a000-000000000022',
        productId: 'b0000b22-0000-4000-a000-000000000022',
        name: 'Mazorcada de la Casa (Especial del Día)',
        price: 19000,
        original_price: 22000,
        is_bento_del_dia: false,
        is_daily_special: true,
        daily_special_label: 'Opción del Día',
        subcategory: 'Más Opciones del Día',
        categorySlug: 'boku-bentos',
        categoryId: 'b0000c01-0000-4000-a000-000000000001',
        categoryName: 'BOKU Bentos Caseros',
        desc: 'Maíz tierno dulce con jamón, salchicha, queso fundido y papita cabello de ángel crocante. Proteína a elección (pollo o cerdo al wok), salsa a elección (BBQ o tártara) y pimentón salteado opcional. 🥣 ¡Combo completo! Incluye Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        description: 'Maíz tierno dulce con jamón, salchicha, queso fundido y papita cabello de ángel crocante. Proteína a elección (pollo o cerdo al wok), salsa a elección (BBQ o tártara) y pimentón salteado opcional. 🥣 ¡Combo completo! Incluye Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
        image: '/img/products/boku-mazorcada.jpg',
        image_url: '/img/products/boku-mazorcada.jpg',
        recipe_id: null,
        stock_status: 'in',
        available_portions: 50,
        is_schedule_available: isStorePausedForPublic ? false : true,
        schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
        modifierGroups: [
          {
            id: 'mg-mazor-protein',
            name: '🍗 Proteína a elección',
            min_select: 1,
            max_select: 2,
            included_count: 1,
            options: [
              { id: 'opt-mazor-pollo', name: 'Pollo salteado al wok', price: 0, extra_price: 7000, is_default: true },
              { id: 'opt-mazor-cerdo', name: 'Cerdo salteado al wok', price: 0, extra_price: 7000 }
            ]
          },
          {
            id: 'mg-mazor-sauce',
            name: '🍯 Salsa a elección',
            min_select: 1,
            max_select: 2,
            options: [
              { id: 'opt-mazor-bbq', name: 'Salsa BBQ de la casa', price: 0, is_default: true },
              { id: 'opt-mazor-tartara', name: 'Salsa Tártara cremosa', price: 0 }
            ]
          },
          {
            id: 'mg-mazor-pimenton',
            name: '🫑 Toque de Pimentón',
            min_select: 0,
            max_select: 1,
            options: [
              { id: 'opt-mazor-con-pimenton', name: 'Con pimentón salteado', price: 0, is_default: true },
              { id: 'opt-mazor-sin-pimenton', name: 'Sin pimentón', price: 0 }
            ]
          },
          sharedSoupGroup,
          sharedDrinkGroup,
          {
            id: 'mg-mazor-extras',
            name: '🍟 Acompañamiento Opcional',
            min_select: 0,
            max_select: 2,
            options: [
              { id: 'opt-mazor-extra-papas', name: 'Extra Porción de Papas a la Francesa', price: 6000 },
              { id: 'opt-mazor-extra-aji', name: 'Ají Casero de la Casa', price: 1500 }
            ]
          }
        ]
      };

      // Ensamblar la sección superior de Bentos de Hoy respetando fielmente el estado de la administración
      const candidateBentos = [
        pokeToriKatsu,
        pokeSalmonFresh,
        bentoMediterraneo,
        bentoCriollo,
        bentoHeroToday,
        mazorcadaToday
      ];

      const visibleBentos = candidateBentos.filter(b => {
        const raw = (rawProducts || []).find(p => p.id === b.id);
        const isPokeSpecial = b.id === 'b0000b25-0000-4000-a000-000000000025' || b.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab';
        // Si existe en base de datos, respetar fielmente su estado de Activo / Oculto y Stock
        if (raw) {
          if (raw.is_active === false) return false;
          if (!isPokeSpecial && raw.stock_status === 'out') return false;
          const locActive = statusMap.get(b.id);
          if (locActive === false) return false;
          const locStock = stockStatusMap.get(b.id);
          if (!isPokeSpecial && locStock === 'out') return false;
        }
        return b.is_active !== false && (isPokeSpecial || b.stock_status !== 'out');
      });

      grouped['boku-bentos'] = visibleBentos.length > 0 ? visibleBentos : [pokeToriKatsu, pokeSalmonFresh];

      // ── PRESENCIA DE TORI KATSU Y SALMÓN EN BOKU BOWLS ──
      if (!grouped['boku-bowls']) grouped['boku-bowls'] = [];
      const hasToriKatsuInBowls = grouped['boku-bowls'].some(p => p.id === 'b0000b25-0000-4000-a000-000000000025');
      if (!hasToriKatsuInBowls) {
        grouped['boku-bowls'].unshift({
          ...pokeToriKatsu,
          categorySlug: 'boku-bowls',
          categoryId: '6316a6dc-8a4c-4cc1-874b-4f3d362ed635',
          categoryName: 'BOKU Bowls',
          subcategory: 'Bowls Poke Fresco'
        });
      }
      const salmonInBowls = grouped['boku-bowls'].find(p => p.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab');
      if (salmonInBowls) {
        salmonInBowls.price = 22000;
        salmonInBowls.original_price = 34000;
        salmonInBowls.stock_status = 'in';
        salmonInBowls.available_portions = 50;
        salmonInBowls.out_reason = null;
        salmonInBowls.modifierGroups = [salmonPrepGroup, sharedSoupGroup, sharedDrinkGroup];
      }

      // ── ELIMINACIÓN TOTAL Y DEFINITIVA DE LA BOLOÑESA DE TODAS LAS CATEGORÍAS ──
      Object.keys(grouped).forEach(k => {
        grouped[k] = (grouped[k] || []).filter(p => {
          const lower = (p.name || '').toLowerCase();
          return !lower.includes('boloñesa') && 
                 !lower.includes('bolonesa') && 
                 p.id !== 'b0000b17-0000-4000-a000-000000000007' &&
                 p.id !== 'b0000f02-0000-4000-a000-000000000002' &&
                 p.id !== 'b0000f03-0000-4000-a000-000000000003';
        });
      });
    }
    return grouped;
  }, [rawProducts, locationPrices, locationStatus, activeLocationId, restaurantSettings, allCategories, brand, storeStatusInfo, isStorePausedForPublic]);

  // Compute categories reactively (Dayparting + Has Products + Location Filter)
  const categories = useMemo(() => {
    // Pre-compute: categorías asignadas a la sede activa
    const locCatsForActive = (activeLocationId && activeLocationId !== 'all')
      ? (locationCategories || []).filter(lc => lc.location_id === activeLocationId)
      : [];
    const hasLocCatConfig = locCatsForActive.length > 0;
    const now = new Date();
    const isBokuBrand = restaurantSettings?.brand_id === 'a63da806-a62a-49b9-a833-07e0976785ad' 
      || brand?.id === 'a63da806-a62a-49b9-a833-07e0976785ad' 
      || brand?.slug === 'boku-bento';

    return (allCategories || []).filter(cat => {
      // 1. Basic active status (desactivada manualmente por admin)
      if (cat.is_active === false) return false;

      // Desactivación operativa: Desayunos & Brunch desactivados por hoy en Boku Bento
      if (isBokuBrand && (cat.id === 'b0000c04-0000-4000-a000-000000000004' || cat.slug === 'boku-desayunos-brunch' || cat.name?.toLowerCase().includes('desayuno'))) {
        return false;
      }

      // 2. ESTRATEGIA HÍBRIDA de sede:
      //    Si la sede tiene categorías asignadas → modo estricto (solo esas).
      //    Si NO tiene ninguna asignación → mostrar todas las de la marca.
      if (activeLocationId && activeLocationId !== 'all' && hasLocCatConfig) {
        const locCat = locCatsForActive.find(lc => lc.category_id === cat.id);
        if (locCat && locCat.is_active === false) return false;
      }

      // 3. Must have products in this category
      const productsInCat = productsByCategory[cat.slug] || [];
      if (productsInCat.length === 0) return false;

      // UX: NO se filtra la categoría cuando está fuera de horario/día.
      // Se mantiene presente pero atenuada para que el comensal sepa que existe.
      return true;
    }).map(cat => {
      const scheduleInfo = getCategoryScheduleInfo(cat, now);
      const isBentoCat = isBokuBrand && (cat.slug === 'boku-bentos' || cat.id === 'b0000c01-0000-4000-a000-000000000001');
      const currentHour = now.getHours() + (now.getMinutes() / 60);
      const isLunchTime = currentHour >= 10.5 && currentHour <= 17.0;

      return {
        ...cat,
        schedule_info: scheduleInfo,
        is_schedule_active: isBentoCat ? (isStorePausedForPublic ? false : isLunchTime) : scheduleInfo.isAvailableNow,
        schedule_label: isBentoCat ? (isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM') : scheduleInfo.label,
        is_schedule_restricted: isBentoCat ? !isLunchTime : scheduleInfo.isRestricted
      };
    });
  }, [allCategories, productsByCategory, activeLocationId, locationCategories, restaurantSettings, brand, isStorePausedForPublic]);

  // Trigger fetch when brand changes (resolved from URL slug or session)
  const lastFetchedBrandRef = React.useRef(undefined);
  
  useEffect(() => {
    let isMounted = true;
    if (loadingBrand) return; 
    
    // Solo disparar fetch si el brandId cambió (o si es la primera carga)
    if (activeBrandId === lastFetchedBrandRef.current) return;

    lastFetchedBrandRef.current = activeBrandId;
    
    const doFetch = async () => {
      const loaded = await fetchMenuData(activeBrandId);
      if (!loaded && isMounted) {
        console.warn('MenuData: primer intento fallido; se hará un reintento controlado.');
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
        if (isMounted) await fetchMenuData(activeBrandId, { force: true });
      }
    };

    doFetch();

    return () => { isMounted = false; };
  }, [activeBrandId, loadingBrand, fetchMenuData]);

  // Real-time menu data updates
  useEffect(() => {
    if (!activeBrandId) return;

    // Listen for branding and settings changes
    const settingsChannel = supabase.channel(`settings-changes-${activeBrandId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'restaurant_settings',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
        if (payload.new) setRestaurantSettings(payload.new);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'home_settings',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
        if (payload.new) setHomeSettings(payload.new);
      })
      .subscribe();

    // Listen for menu content changes (wildcard for brand_id tables)
    // For tables WITHOUT brand_id (location overrides), we listen to all and filter in JS if needed
    // but usually, these changes are specific enough that a refresh is fine.
    // Listen for menu content changes
    const menuChannel = supabase.channel(`menu-changes-${activeBrandId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'locations',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'categories',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'modifier_groups',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'modifier_options' 
        // modifier_options doesn't have brand_id, but it's linked to groups
      }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_product_prices' }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_product_status' }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_categories' }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_modifier_groups' }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands', filter: `id=eq.${activeBrandId}` }, () => fetchMenuData(activeBrandId, { force: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions', filter: `brand_id=eq.${activeBrandId}` }, () => fetchMenuData(activeBrandId, { force: true }))
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(menuChannel);
    };
  }, [activeBrandId, fetchMenuData]);

  // Inject CSS Variables for Dynamic Theming
  useEffect(() => {
    if (!restaurantSettings) return;
    try {
      const root = document.documentElement;
      const isBoku = (brand?.slug === 'boku-bento') || (restaurantSettings?.business_name || '').toLowerCase().includes('boku');
      const defaultPrimary = isBoku ? '#bc0e0e' : '#2f4131';
      const colors = {
        '--color-brand-primary': restaurantSettings.primary_color || defaultPrimary,
        '--color-brand-secondary': restaurantSettings.theme_secondary || (isBoku ? '#8a0a0a' : '#7db87a'),
        '--color-brand-bg': restaurantSettings.theme_background || (isBoku ? '#fdfcfc' : '#f9f8f6'),
        '--color-brand-card': restaurantSettings.theme_card_bg || '#ffffff',
        '--color-brand-text': restaurantSettings.theme_text || (isBoku ? '#1c1917' : '#2c3e2d'),
        '--color-brand-footer': restaurantSettings.theme_footer_bg || (isBoku ? '#1a0505' : '#2f4131'),
      };
      Object.entries(colors).forEach(([k, v]) => root.style.setProperty(k, v));

      const faviconUrl = isBoku ? '/boku-favicon.png' : (restaurantSettings.favicon_url || '/favicon.png');
      const iconLinks = document.querySelectorAll("link[rel~='icon']");
      if (iconLinks.length > 0) {
        iconLinks.forEach((link) => {
          link.href = faviconUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
    } catch (err) {
      console.error('Error applying theme/favicon:', err);
    }
  }, [restaurantSettings]);

  const getProductsByCategory = useCallback((slug) => productsByCategory[slug] || [], [productsByCategory]);
  const getModifiers = useCallback((group) => modifiers[group] || [], [modifiers]);
  const getAllProducts = useCallback(() => Object.values(productsByCategory).flat(), [productsByCategory]);

  // Merge DB promotions with built-in starter coupons (DOMIGRATIS, BOKU10, DISCULPABOKU, VOLVER10)
  const mergedPromotions = useMemo(() => {
    const dbList = promotions || [];
    if (!activeBrandId) return dbList;
    const defaults = getDefaultBrandCoupons(activeBrandId);
    const dbCodes = new Set(dbList.map(p => (p.code || '').trim().toUpperCase()).filter(Boolean));
    const missingDefaults = defaults.filter(d => !dbCodes.has(d.code.toUpperCase()));
    return [...dbList, ...missingDefaults];
  }, [promotions, activeBrandId]);

  const activePromotions = useMemo(() => {
    if (!mergedPromotions || mergedPromotions.length === 0) return [];
    const now = new Date();
    return mergedPromotions.filter(p => {
      if (!p.is_active) return false;
      if (p.location_id && currentLocation?.id && p.location_id !== currentLocation.id) return false;
      if (p.start_date && new Date(p.start_date) > now) return false;
      if (p.end_date && new Date(p.end_date) < now) return false;
      if (typeof p.usage_limit === 'number' && p.usage_limit > 0 && (p.usage_count || 0) >= p.usage_limit) return false;
      return true;
    });
  }, [mergedPromotions, currentLocation]);

  // Automatic Free Delivery only applies if the promo does NOT require a coupon code
  const freeDeliveryPromo = useMemo(() => {
    return activePromotions.find(p => p.type === 'free_delivery' && !p.code) || null;
  }, [activePromotions]);

  const activePromoBanner = useMemo(() => {
    return activePromotions.find(p => p.show_banner && p.banner_message) || null;
  }, [activePromotions]);

  const value = useMemo(() => ({
    categories,
    allCategories,
    productsByCategory,
    getProductsByCategory,
    getAllProducts,
    getModifiers,
    modifiers,
    rawModifierGroups,
    experiences,
    banners,
    allergens,
    homeSettings,
    restaurantSettings,
    brand,
    businessHours,
    currentBusinessHours,
    storeStatusInfo,
    planFeatures,
    locations,
    loading,
    activeBrandId,
    currentLocation,
    currentLocationId: activeLocationId,
    promotions: mergedPromotions,
    activePromotions,
    freeDeliveryPromo,
    activePromoBanner,
    refetchMenuData: () => fetchMenuData(activeBrandId, { force: true }),
    refetchPromotions: () => fetchMenuData(activeBrandId, { force: true }),
    hasFeature: (key) => planFeatures?.find(f => f.feature_key === key)?.is_included ?? false,
  }), [
    categories, allCategories, productsByCategory, getProductsByCategory, getAllProducts, 
    getModifiers, modifiers, rawModifierGroups, experiences, banners, allergens,
    homeSettings, restaurantSettings, brand, businessHours, currentBusinessHours, storeStatusInfo,
    planFeatures, locations, loading, activeBrandId, currentLocation, activeLocationId,
    mergedPromotions, activePromotions, freeDeliveryPromo, activePromoBanner,
    fetchMenuData,
  ]);

  useEffect(() => {
    if (!brand) return;
    const bName = restaurantSettings?.business_name || brand?.name || "Boku Bento";
    const bDesc = homeSettings?.hero_subtitle || brand?.description || "Menú Digital Interactivo";
    const bShareImage = homeSettings?.menu_banner_img || homeSettings?.welcome_bg_img || restaurantSettings?.logo_url || brand?.logo_url;

    document.title = `${bName} | Menú Digital`;

    const setMeta = (attrName, attrVal, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('property', 'og:title', `${bName} | Menú Digital`);
    setMeta('property', 'og:description', bDesc);
    if (bShareImage) {
      setMeta('property', 'og:image', bShareImage);
      setMeta('property', 'og:image:secure_url', bShareImage);
      setMeta('name', 'twitter:image', bShareImage);
    }
    setMeta('property', 'og:url', window.location.href);
    setMeta('property', 'og:type', 'website');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', `${bName} | Menú Digital`);
    setMeta('name', 'twitter:description', bDesc);
  }, [brand, restaurantSettings, homeSettings]);

  return (
    <MenuDataContext.Provider value={value}>
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuData = () => useContext(MenuDataContext);

