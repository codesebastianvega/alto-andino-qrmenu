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
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [brand, setBrand] = useState(null);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [locations, setLocations] = useState([]);
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

    try {
      // Helper to add brand filter when needed
      const brandFilter = (query) => {
        if (!brandId) return query.limit(0); 
        return query.eq('brand_id', brandId);
      };

      // Fetch categories
      const { data: cats, error: catError } = await brandFilter(
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true })
      );
      if (catError) throw catError;

      // Fetch modifiers
      const { data: mods } = await brandFilter(
        supabase.from('modifier_groups').select('*, modifier_options!modifier_options_group_id_fkey(id, group_id, name, price, sort_order, created_at, nested_group_id, image_url, emoji, ingredient_id)')
      );
      setRawModifierGroups(mods || []);

      // Fetch experiences, allergens, locations, banners, settings...
      const [expRes, allgsRes, locsRes, bnrsRes, hSettRes, rSettRes] = await Promise.all([
        brandFilter(supabase.from('experiences').select('*').eq('is_active', true).order('created_at', { ascending: false })),
        brandFilter(supabase.from('allergens').select('*').order('name')),
        brandFilter(supabase.from('locations').select('*').eq('is_active', true).order('is_main', { ascending: false })),
        brandFilter(supabase.from('promo_banners').select('*').eq('is_active', true).order('sort_order', { ascending: true })),
        brandFilter(supabase.from('home_settings').select('*').limit(1)),
        brandFilter(supabase.from('restaurant_settings').select('*').limit(1))
      ]);

      setExperiences(expRes.data || []);
      setAllergens(allgsRes.data || []);
      setLocations(locsRes.data || []);
      setBanners(bnrsRes.data || []);
      setHomeSettings(hSettRes.data?.[0] || null);
      setRestaurantSettings(rSettRes.data?.[0] || null);

      // Fetch Brand and Plan Features
      if (brandId) {
        const { data: brandData } = await supabase.from('brands').select('*, plans(*)').eq('id', brandId).single();
        if (brandData) {
          setBrand(brandData);
          if (brandData.plan_id) {
            const { data: features } = await supabase.from('plan_features').select('*').eq('plan_id', brandData.plan_id);
            setPlanFeatures(features || []);
          }
        }
      }

      // Fetch products
      const { data: products, error: prodError } = await brandFilter(
        supabase.from('products').select('*, categories:category_id (slug)').eq('is_active', true).order('sort_order', { ascending: true })
      );
      if (prodError) throw prodError;
      setRawProducts(products || []);

      // Fetch location-specific overrides SAFELY
      // These tables DO NOT have brand_id, so we filter by location_ids
      if (locsRes.data?.length > 0) {
        const locationIds = locsRes.data.map(l => l.id);
        const [pricesRes, statusRes, catLinksRes, modLinksRes] = await Promise.all([
          supabase.from('location_product_prices').select('*').in('location_id', locationIds),
          supabase.from('location_product_status').select('*').in('location_id', locationIds),
          supabase.from('location_categories').select('*').in('location_id', locationIds),
          supabase.from('location_modifier_groups').select('*').in('location_id', locationIds)
        ]);

        if (pricesRes.error) console.error('Error fetching location prices:', pricesRes.error);
        if (statusRes.error) console.error('Error fetching location status:', statusRes.error);
        if (catLinksRes.error) console.error('Error fetching location cat links:', catLinksRes.error);
        if (modLinksRes.error) console.error('Error fetching location mod links:', modLinksRes.error);

        setLocationPrices(pricesRes.data || []);
        setLocationStatus(statusRes.data || []);
        setLocationCategories(catLinksRes.data || []);
        setLocationModLinks(modLinksRes.data || []);
      }

      setAllCategories(cats || []);

      console.log('✅ MenuData fetched for brand:', brandId || 'anonymous', {
        cats: cats?.length || 0,
        products: products?.length || 0
      });

    } catch (err) {
      console.error('Error fetching menu data:', err);
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

    // Pre-compute: productos asignados a la sede activa
    const locStatusForActive = (activeLocationId && activeLocationId !== 'all')
      ? (locationStatus || []).filter(ls => ls.location_id === activeLocationId)
      : [];
    const hasLocProductConfig = locStatusForActive.length > 0;

    (rawProducts || []).forEach(product => {
      // Apply location product status override (Estrategia Híbrida)
      if (activeLocationId && activeLocationId !== 'all' && hasLocProductConfig) {
        // Modo estricto: la sede tiene productos asignados.
        // Si el producto no tiene registro, lo mostramos por defecto (Herencia).
        // Si tiene registro, respetamos su estado is_active.
        const locStatus = locStatusForActive.find(ls => ls.product_id === product.id);
        if (locStatus && locStatus.is_active === false) {
          return;
        }
      }

      const catSlug = product.categories?.slug || 'otros';
      
      // Apply location price override
      let finalPrice = product.price;
      if (activeLocationId && activeLocationId !== 'all') {
        const locPrice = (locationPrices || []).find(lp => lp.product_id === product.id && lp.location_id === activeLocationId);
        if (locPrice && locPrice.price !== null) {
          finalPrice = locPrice.price;
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
  const lastFetchedBrandRef = React.useRef(null);
  
  useEffect(() => {
    if (loadingBrand) return; 
    
    if (activeBrandId === lastFetchedBrandRef.current && allCategories.length > 0) {
      return;
    }

    lastFetchedBrandRef.current = activeBrandId;
    fetchMenuData(activeBrandId);
  }, [activeBrandId, loadingBrand, fetchMenuData, allCategories.length]);

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
    const menuChannel = supabase.channel(`menu-changes-${activeBrandId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modifier_groups' }, () => fetchMenuData(activeBrandId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modifier_options' }, () => fetchMenuData(activeBrandId))
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
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.type = 'image/png';
    link.href = faviconUrl;
  }, [restaurantSettings]);

  const getProductsByCategory = useCallback((slug) => productsByCategory[slug] || [], [productsByCategory]);
  const getModifiers = useCallback((group) => modifiers[group] || [], [modifiers]);
  const getAllProducts = useCallback(() => Object.values(productsByCategory).flat(), [productsByCategory]);

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
    homeSettings, restaurantSettings, brand, planFeatures, locations, loading, activeBrandId, currentLocation, activeLocationId, fetchMenuData
  ]);


  return (
    <MenuDataContext.Provider value={value}>
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuData = () => useContext(MenuDataContext);

