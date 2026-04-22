import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';

const MenuDataContext = createContext({});

export const MenuDataProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [modifiers, setModifiers] = useState({});
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

  // Fetch menu data for a given brand
  const fetchMenuData = useCallback(async (brandId) => {
    setLoading(true);
    // Clear old state immediately to avoid "ghost" data from other brands
    setCategories([]);
    setAllCategories([]);
    setProductsByCategory({});
    setModifiers({});
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
      // When brandId is known, filter explicitly — this handles multi-tenancy for admin panel
      const brandFilter = (query) => {
        if (!brandId) return query.limit(0); // Safely return nothing if no brand is active
        return query.eq('brand_id', brandId);
      };

      // Fetch categories
      const { data: cats, error: catError } = await brandFilter(
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true })
      );
      if (catError) throw catError;

      // Filter categories by dayparting
      const activeCats = (cats || []).filter(cat => {
        if (cat.is_active === false) return false;
        const now = new Date();
        const currentDay = now.getDay();
        const config = cat.visibility_config || {};
        const allowedDays = config.days || [0,1,2,3,4,5,6];
        if (!allowedDays.includes(currentDay)) return false;
        if (!cat.available_from && !cat.available_to) return true;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const parseTime = (t) => { if (!t) return null; const [h,m] = t.split(':').map(Number); return h*60+m; };
        const from = parseTime(cat.available_from);
        const to = parseTime(cat.available_to);
        if (from !== null && to !== null) {
          return from < to ? (currentMinutes >= from && currentMinutes <= to) : (currentMinutes >= from || currentMinutes <= to);
        }
        if (from !== null) return currentMinutes >= from;
        if (to !== null) return currentMinutes <= to;
        return true;
      });

      // Fetch modifiers (NEW logic)
      const { data: mods } = await brandFilter(
        supabase.from('modifier_groups').select('*, modifier_options!modifier_options_group_id_fkey(id, group_id, name, price, sort_order, created_at, nested_group_id, image_url, emoji, ingredient_id)')
      );
      const modGroups = {};
      (mods || []).forEach(group => {
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
        // Index by BOTH name and UUID so lookups work with either format
        modGroups[groupName] = options;
        modGroups[group.id] = options;
      });
      setModifiers(modGroups);
      setRawModifierGroups(mods || []);

      // Fetch experiences
      const { data: exp } = await brandFilter(
        supabase.from('experiences').select('*').eq('is_active', true).order('created_at', { ascending: false })
      );
      setExperiences(exp || []);

      // Fetch allergens
      const { data: allgs } = await brandFilter(
        supabase.from('allergens').select('*').order('name')
      );
      setAllergens(allgs || []);

      // Fetch locations
      const { data: locs } = await brandFilter(
        supabase.from('locations').select('*').eq('is_active', true).order('is_main', { ascending: false })
      );
      setLocations(locs || []);

      // Fetch banners
      const { data: bnrs } = await brandFilter(
        supabase.from('promo_banners').select('*').eq('is_active', true).order('sort_order', { ascending: true })
      );
      setBanners(bnrs || []);

      // Fetch home_settings
      const { data: hSettings } = await brandFilter(
        supabase.from('home_settings').select('*').limit(1)
      );
      setHomeSettings(hSettings?.[0] || null);

      // Fetch restaurant_settings (branding)
      const { data: rSettings } = await brandFilter(
        supabase.from('restaurant_settings').select('*').limit(1)
      );
      setRestaurantSettings(rSettings?.[0] || null);

      // Fetch Brand and Plan Features
      if (brandId) {
        const { data: brandData } = await supabase
          .from('brands')
          .select('*, plans(*)')
          .eq('id', brandId)
          .single();
        
        if (brandData) {
          setBrand(brandData);
          if (brandData.plan_id) {
            const { data: features } = await supabase
              .from('plan_features')
              .select('*')
              .eq('plan_id', brandData.plan_id);
            setPlanFeatures(features || []);
          }
        }
      }

      // Fetch products
      const { data: products, error: prodError } = await brandFilter(
        supabase.from('products').select('*, categories:category_id (slug)').eq('is_active', true).order('sort_order', { ascending: true })
      );
      if (prodError) throw prodError;

      const grouped = {};
      (products || []).forEach(product => {
        const catSlug = product.categories?.slug || 'otros';
        const normalizedProduct = {
          id: product.id,
          name: product.name,
          price: product.price,
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

        // All products go into the categorical map if they are NOT addons
        if (product.is_addon !== true) {
          if (!grouped[catSlug]) grouped[catSlug] = [];
          grouped[catSlug].push(normalizedProduct);
        }
      });

      setAllCategories(cats || []);
      setCategories(activeCats);
      setProductsByCategory(grouped);

      console.log('✅ MenuData cargado para brand:', brandId || 'anónimo', {
        cats: cats?.length || 0,
        products: products?.length || 0,
      });

    } catch (err) {
      console.error('Error fetching menu data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger fetch when brand changes (resolved from URL slug or session)
  const lastFetchedBrandRef = React.useRef(null);
  
  useEffect(() => {
    if (loadingBrand) return; 
    
    // Safety: if brandId is the same as last one successfully fetched, don't re-trigger heavy fetch
    // Unless it's the very first load
    if (activeBrandId === lastFetchedBrandRef.current && categories.length > 0) {
      return;
    }

    lastFetchedBrandRef.current = activeBrandId;
    fetchMenuData(activeBrandId);
  }, [activeBrandId, loadingBrand, fetchMenuData, categories.length]);

  // Real-time branding and home settings updates
  useEffect(() => {
    if (!activeBrandId) return;

    const channel = supabase.channel(`content-changes-${activeBrandId}`)
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
    return () => supabase.removeChannel(channel);
  }, [activeBrandId]);

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

    const faviconUrl = restaurantSettings.favicon_url || '/logoalto.png';
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
    refetchMenuData: () => fetchMenuData(activeBrandId),
    hasFeature: (key) => planFeatures?.find(f => f.feature_key === key)?.is_included ?? false,
  }), [
    categories, allCategories, productsByCategory, getProductsByCategory, getAllProducts, 
    getModifiers, modifiers, rawModifierGroups, experiences, banners, allergens, 
    homeSettings, restaurantSettings, brand, planFeatures, locations, loading, activeBrandId, fetchMenuData
  ]);

  return (
    <MenuDataContext.Provider value={value}>
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuData = () => useContext(MenuDataContext);
