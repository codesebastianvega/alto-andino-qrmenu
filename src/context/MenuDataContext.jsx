import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';
import { useLocation as useAppLocation } from './LocationContext';

const MenuDataContext = createContext({});

export const MenuDataProvider = ({ children }) => {
  const routerLocation = useLocation();
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
  const [loading, setLoading] = useState(true);

  // Get brand information from BrandContext (which resolves slug/session)
  const { brand: currentBrand, loadingBrand } = useBrand();
  const activeBrandId = currentBrand?.id ?? null;

  // Expose the current location object for convenience
  const currentLocation = useMemo(() => {
    return locations.find(l => l.id === activeLocationId) || null;
  }, [locations, activeLocationId]);



  // Fetch menu data for a given brand
  const fetchMenuData = useCallback(async (brandId) => {
    if (!brandId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Clear old state immediately to avoid "ghost" data from other brands
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

    try {
      if (!brandId) {
        setLoading(false);
        return;
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
        hoursRes
      ] = await Promise.all([
        brandFilter(supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true })),
        brandFilter(supabase.from('modifier_groups').select('*, modifier_options!modifier_options_group_id_fkey(id, group_id, name, price, sort_order, created_at, nested_group_id, image_url, emoji, ingredient_id)')),
        brandFilter(supabase.from('experiences').select('*').eq('is_active', true).order('created_at', { ascending: false })),
        brandFilter(supabase.from('allergens').select('*').order('name')),
        brandFilter(supabase.from('locations').select('*').eq('is_active', true).order('is_main', { ascending: false })),
        brandFilter(supabase.from('promo_banners').select('*').eq('is_active', true).order('sort_order', { ascending: true })),
        brandFilter(supabase.from('home_settings').select('*').limit(1)),
        brandFilter(supabase.from('restaurant_settings').select('*').limit(1)),
        supabase.from('brands').select('*, plans(*, plan_features(*))').eq('id', brandId).single(),
        brandFilter(supabase.from('products').select('*, categories:category_id (slug)').eq('is_active', true).order('sort_order', { ascending: true })),
        brandFilter(supabase.from('business_hours').select('*'))
      ]);

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
      setRestaurantSettings(rSettRes.data?.[0] || null);
      setRawProducts(prodsRes.data || []);
      setBusinessHours(hoursRes.data || []);

      // 2. Fetch location-specific overrides (only if locations exist)
      if (locsRes.data?.length > 0) {
        const locationIds = locsRes.data.map(l => l.id);
        const [pricesRes, statusRes, catLinksRes, modLinksRes] = await Promise.all([
          supabase.from('location_product_prices').select('*').in('location_id', locationIds),
          supabase.from('location_product_status').select('*').in('location_id', locationIds),
          supabase.from('location_categories').select('*').in('location_id', locationIds),
          supabase.from('location_modifier_groups').select('*').in('location_id', locationIds)
        ]);

        setLocationPrices(pricesRes.data || []);
        setLocationStatus(statusRes.data || []);
        setLocationCategories(catLinksRes.data || []);
        setLocationModLinks(modLinksRes.data || []);
      }

      console.log('✅ MenuData Parallel Fetch Complete');

    } catch (err) {
      console.error('❌ MenuData Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute modifiers reactively and filter by location
  const modifiers = useMemo(() => {
    const modGroups = {};
    const filteredGroups = (rawModifierGroups || []).filter(group => {
      if (!activeLocationId || activeLocationId === 'all') return true; 
      if (!locationModLinks || locationModLinks.length === 0) return true; // Brand fallback

      // check if the location HAS any mod links at all. If yes, we check for THIS group.
      const locHasAnyLinks = (locationModLinks || []).some(link => link.location_id === activeLocationId);
      if (!locHasAnyLinks) return true; // Inherit all if none configured for this location

      return (locationModLinks || []).some(link => 
        link.modifier_group_id === group.id && link.location_id === activeLocationId
      );
    });

    filteredGroups.forEach(group => {
      const groupName = group.name;
      const options = (group.modifier_options || []).map(opt => ({
        ...opt,
        id: opt.id,
        name: opt.name,
        price: opt.price || 0,
        emoji: opt.emoji,
        image_url: opt.image_url,
        group: groupName,
        groupId: group.id,
        ingredient_id: opt.ingredient_id
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
    if (activeLocationId && activeLocationId !== 'all') {
      (locationStatus || []).forEach(ls => {
        if (ls.location_id === activeLocationId) {
          statusMap.set(ls.product_id, ls.is_active);
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

    (rawProducts || []).forEach(product => {
      // Apply location product status override
      if (activeLocationId && activeLocationId !== 'all' && hasLocProductConfig) {
        const isActiveOverride = statusMap.get(product.id);
        if (isActiveOverride === false) {
          return;
        }
      }

      const catSlug = product.categories?.slug || 'otros';
      
      // Apply location price override
      let finalPrice = product.price;
      if (activeLocationId && activeLocationId !== 'all') {
        const locPrice = priceMap.get(product.id);
        if (locPrice !== undefined && locPrice !== null) {
          finalPrice = locPrice;
        }
      }

      const normalizedProduct = {
        id: product.id,
        name: product.name,
        price: finalPrice,
        desc: product.description || '',
        description: product.description || '',
        tags: product.tags || [],
        stock_status: product.stock_status || 'in',
        image: product.image_url,
        image_url: product.image_url,
        variants: product.variants || [],
        modifierGroups: product.modifier_groups || [],
        configOptions: product.config_options || {},
        is_upsell: product.is_upsell || false,
        requires_kitchen: product.requires_kitchen ?? true,
        subcategory: product.subcategory,
        categorySlug: catSlug,
        is_addon: product.is_addon,
        _supabase: product
      };

      if (product.is_addon !== true) {
        if (!grouped[catSlug]) grouped[catSlug] = [];
        grouped[catSlug].push(normalizedProduct);
      }
    });
    return grouped;
  }, [rawProducts, locationPrices, locationStatus, activeLocationId]);

  // Compute categories reactively (Dayparting + Has Products + Location Filter)
  const categories = useMemo(() => {
    // Pre-compute: categorías asignadas a la sede activa
    const locCatsForActive = (activeLocationId && activeLocationId !== 'all')
      ? (locationCategories || []).filter(lc => lc.location_id === activeLocationId)
      : [];
    const hasLocCatConfig = locCatsForActive.length > 0;

    return (allCategories || []).filter(cat => {
      // 1. Basic active status
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

      // 3. Dayparting logic
      const now = new Date();
      const currentDay = now.getDay();
      const config = cat.visibility_config || {};
      const allowedDays = config.days || [0, 1, 2, 3, 4, 5, 6];
      if (!allowedDays.includes(currentDay)) return false;
      if (!cat.available_from && !cat.available_to) return true;
      
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const parseTime = (t) => { 
        if (!t) return null; 
        const [h, m] = t.split(':').map(Number); 
        return h * 60 + m; 
      };
      const from = parseTime(cat.available_from);
      const to = parseTime(cat.available_to);
      
      if (from !== null && to !== null) {
        return from < to 
          ? (currentMinutes >= from && currentMinutes <= to) 
          : (currentMinutes >= from || currentMinutes <= to);
      }
      if (from !== null) return currentMinutes >= from;
      if (to !== null) return currentMinutes <= to;
      
      return true;
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
      await fetchMenuData(activeBrandId);
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
      }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'categories',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'modifier_groups',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'modifier_options' 
        // modifier_options doesn't have brand_id, but it's linked to groups
      }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_product_prices' }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_product_status' }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_categories' }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_modifier_groups' }, () => fetchMenuData(activeBrandId))
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
      const colors = {
        '--color-brand-primary': restaurantSettings.primary_color || '#2f4131',
        '--color-brand-secondary': restaurantSettings.theme_secondary || '#7db87a',
        '--color-brand-bg': restaurantSettings.theme_background || '#f9f8f6',
        '--color-brand-card': restaurantSettings.theme_card_bg || '#ffffff',
        '--color-brand-text': restaurantSettings.theme_text || '#2c3e2d',
        '--color-brand-footer': restaurantSettings.theme_footer_bg || '#2f4131',
      };
      Object.entries(colors).forEach(([k, v]) => root.style.setProperty(k, v));

      const faviconUrl = restaurantSettings.favicon_url || '/favicon.png';
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = faviconUrl;
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
    refetchMenuData: () => fetchMenuData(activeBrandId),
    hasFeature: (key) => planFeatures?.find(f => f.feature_key === key)?.is_included ?? false,
  }), [
    categories, allCategories, productsByCategory, getProductsByCategory, getAllProducts, 
    getModifiers, modifiers, rawModifierGroups, experiences, banners, allergens, 
    homeSettings, restaurantSettings, brand, planFeatures, locations, loading, activeBrandId, currentLocation, activeLocationId, fetchMenuData,
    currentBusinessHours, businessHours
  ]);


  return (
    <MenuDataContext.Provider value={value}>
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuData = () => useContext(MenuDataContext);

