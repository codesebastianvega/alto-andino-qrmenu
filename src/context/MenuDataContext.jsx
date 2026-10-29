import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useBrand } from './BrandContext';
import { useLocation as useAppLocation } from './LocationContext';
import { catalogCache } from '../utils/offlineDb';
import { withTimeout } from '../utils/withTimeout';
import { useDynamicPWA } from '../hooks/useDynamicPWA';
import { getCategoryScheduleInfo } from '../utils/businessHours';

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
      const cacheKey = `menu:v5:${brandId}`;
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
        brandFilter(supabase.from('products').select('*, categories:category_id (slug)').eq('is_active', true).order('sort_order', { ascending: true })),
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

      setAllCategories(catsRes.data || []);
      setRawModifierGroups(modsRes.data || []);
      setExperiences(expRes.data || []);
      setAllergens(allgsRes.data || []);
      setLocations(locsRes.data || []);
      setBanners(bnrsRes.data || []);
      setHomeSettings(hSettRes.data?.[0] || null);

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
            // Keep brand-level concepts (like bento_del_dia_config) always in sync with brand-level row
            const brandSpecial = brandLevelRS.brand_concepts.find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config'));
            if (brandSpecial) {
              bestRS.brand_concepts = [
                ...bestRS.brand_concepts.filter(c => c && c.id !== 'bento_del_dia_config' && c.id !== 'daily_special_config'),
                brandSpecial
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
        banners: bnrsRes.data || [], homeSettings: hSettRes.data?.[0] || null,
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
        const cached = await withTimeout(catalogCache.get(`menu:v5:${brandId}`), 2500, 'La recuperación del catálogo local');
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
        .map(opt => ({
          ...opt,
          id: opt.id,
          name: opt.name,
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
        })).sort((a, b) => a.sort_order - b.sort_order);
      modGroups[groupName] = options;
      modGroups[group.id] = options;
    });
    return modGroups;
  }, [rawModifierGroups, locationModLinks, activeLocationId]);

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
    const dailySpecialConcept = (restaurantSettings?.brand_concepts || []).find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config'));
    const isSpecialEnabled = dailySpecialConcept ? dailySpecialConcept.enabled !== false : false;
    const specialLabel = dailySpecialConcept?.label || (restaurantSettings?.brand_id === 'a63da806-a62a-49b9-a833-07e0976785ad' ? 'El Bento del Día' : 'Plato del Día');
    const promoPrice = Number(dailySpecialConcept?.promo_price) || 0;
    const standardPrice = Number(dailySpecialConcept?.standard_price) || 0;
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
    const activeSpecialId = manualOverride || (isSpecialEnabled ? specialSchedule[currentDayOfWeek] : null);

    (rawProducts || []).forEach(product => {
      // Apply location product status override
      if (activeLocationId && activeLocationId !== 'all' && hasLocProductConfig) {
        const isActiveOverride = statusMap.get(product.id);
        if (isActiveOverride === false) {
          return;
        }
      }

      const catSlug = product.categories?.slug || 'otros';
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
      const isSpecialToday = Boolean(activeSpecialId && product.id === activeSpecialId);
      const isBento = catSlug === 'boku-bentos' || product.category_id === 'b0000c01-0000-4000-a000-000000000001';
      let productSubcategory = product.subcategory;
      let originalPrice = undefined;

      if (isSpecialToday) {
        if (promoPrice > 0) {
          originalPrice = product.price > promoPrice ? product.price : (standardPrice > promoPrice ? standardPrice : product.price);
          finalPrice = promoPrice;
        }
        productSubcategory = specialLabel;
      } else if (isBento && standardPrice > 0) {
        finalPrice = standardPrice;
        productSubcategory = 'Bentos Tradicionales & Fusión';
      }

      let finalStockStatus = product.stock_status || 'in';
      let finalAvailablePortions = product.available_portions !== null && product.available_portions !== undefined ? Number(product.available_portions) : null;
      if (activeLocationId && activeLocationId !== 'all') {
        if (stockStatusMap.has(product.id)) finalStockStatus = stockStatusMap.get(product.id);
        if (portionsMap.has(product.id)) finalAvailablePortions = portionsMap.get(product.id);
      }

      const normalizedProduct = {
        id: product.id,
        name: product.name,
        is_active: product.is_active ?? true,
        price: finalPrice,
        original_price: originalPrice,
        is_bento_del_dia: isSpecialToday,
        is_daily_special: isSpecialToday,
        daily_special_label: isSpecialToday ? specialLabel : null,
        desc: product.description || '',
        description: product.description || '',
        tags: product.tags || [],
        stock_status: finalStockStatus,
        available_portions: finalAvailablePortions,
        out_reason: product.out_reason,
        image: product.image_url,
        image_url: product.image_url,
        variants: product.variants || [],
        modifierGroups: product.modifier_groups || [],
        configOptions: product.config_options || {},
        is_upsell: product.is_upsell || false,
        requires_kitchen: product.requires_kitchen ?? true,
        station: product.station || (product.requires_kitchen === false ? 'none' : 'kitchen'),
        subcategory: productSubcategory,
        categorySlug: catSlug,
        categoryId: product.category_id,
        categoryName: cat?.name || product.categories?.name,
        is_schedule_available: catSchedule.isAvailableNow,
        schedule_label: catSchedule.label,
        schedule_info: catSchedule,
        is_addon: product.is_addon,
        _supabase: product
      };

      if (product.is_addon !== true) {
        if (!grouped[catSlug]) grouped[catSlug] = [];
        grouped[catSlug].push(normalizedProduct);
      }
    });
    return grouped;
  }, [rawProducts, locationPrices, locationStatus, activeLocationId, restaurantSettings, allCategories]);

  // Compute categories reactively (Dayparting + Has Products + Location Filter)
  const categories = useMemo(() => {
    // Pre-compute: categorías asignadas a la sede activa
    const locCatsForActive = (activeLocationId && activeLocationId !== 'all')
      ? (locationCategories || []).filter(lc => lc.location_id === activeLocationId)
      : [];
    const hasLocCatConfig = locCatsForActive.length > 0;
    const now = new Date();

    return (allCategories || []).filter(cat => {
      // 1. Basic active status (desactivada manualmente por admin)
      if (cat.is_active === false) return false;

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
      return {
        ...cat,
        schedule_info: scheduleInfo,
        is_schedule_active: scheduleInfo.isAvailableNow,
        schedule_label: scheduleInfo.label,
        is_schedule_restricted: scheduleInfo.isRestricted
      };
    });
  }, [allCategories, productsByCategory, activeLocationId, locationCategories]);

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

  const currentBusinessHours = useMemo(() => {
    if (!activeLocationId || activeLocationId === 'all') {
      return businessHours.filter(h => !h.location_id);
    }
    return businessHours.filter(h => h.location_id === activeLocationId);
  }, [businessHours, activeLocationId]);

  const activePromotions = useMemo(() => {
    if (!promotions || promotions.length === 0) return [];
    const now = new Date();
    return promotions.filter(p => {
      if (!p.is_active) return false;
      if (p.location_id && currentLocation?.id && p.location_id !== currentLocation.id) return false;
      if (p.start_date && new Date(p.start_date) > now) return false;
      if (p.end_date && new Date(p.end_date) < now) return false;
      if (typeof p.usage_limit === 'number' && p.usage_limit > 0 && (p.usage_count || 0) >= p.usage_limit) return false;
      return true;
    });
  }, [promotions, currentLocation]);

  const freeDeliveryPromo = useMemo(() => {
    return activePromotions.find(p => p.type === 'free_delivery') || null;
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
    planFeatures,
    locations,
    loading,
    activeBrandId,
    currentLocation,
    currentLocationId: activeLocationId,
    promotions,
    activePromotions,
    freeDeliveryPromo,
    activePromoBanner,
    refetchMenuData: () => fetchMenuData(activeBrandId, { force: true }),
    refetchPromotions: () => fetchMenuData(activeBrandId, { force: true }),
    hasFeature: (key) => planFeatures?.find(f => f.feature_key === key)?.is_included ?? false,
  }), [
    categories, allCategories, productsByCategory, getProductsByCategory, getAllProducts, 
    getModifiers, modifiers, rawModifierGroups, experiences, banners, allergens,
    homeSettings, restaurantSettings, brand, businessHours, currentBusinessHours,
    planFeatures, locations, loading, activeBrandId, currentLocation, activeLocationId,
    promotions, activePromotions, freeDeliveryPromo, activePromoBanner,
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

