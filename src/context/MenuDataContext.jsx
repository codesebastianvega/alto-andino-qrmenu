import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { useBrand } from './BrandContext';

const MenuDataContext = createContext({});

export const MenuDataProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [modifiers, setModifiers] = useState({});
  const [experiences, setExperiences] = useState([]);
  const [banners, setBanners] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [homeSettings, setHomeSettings] = useState(null);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [brand, setBrand] = useState(null);
  const [planFeatures, setPlanFeatures] = useState([]);
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
    setExperiences([]);
    setBanners([]);
    setAllergens([]);
    setHomeSettings(null);
    setRestaurantSettings(null);
    setBrand(null);
    setPlanFeatures([]);

    try {
      // Helper to add brand filter when needed
      // When brandId is known, filter explicitly — this handles multi-tenancy for admin panel
      const brandFilter = (query) => brandId ? query.eq('brand_id', brandId) : query;

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

      // Fetch modifiers
      const { data: mods } = await brandFilter(
        supabase.from('ingredients').select('*, ingredient_categories(name)').eq('is_active', true).eq('is_modifier', true)
      );
      const modGroups = {};
      (mods || []).forEach(m => {
        const groupName = m.ingredient_categories?.name || m.category || 'adiciones';
        if (!modGroups[groupName]) modGroups[groupName] = [];
        modGroups[groupName].push({ ...m, price: m.selling_price || 0, group: groupName });
      });
      setModifiers(modGroups);

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
        if (product.is_addon === true) return;
        const catSlug = product.categories?.slug || 'otros';
        if (!grouped[catSlug]) grouped[catSlug] = [];
        grouped[catSlug].push({
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
          _supabase: product
        });
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
  useEffect(() => {
    if (loadingBrand) return; 
    fetchMenuData(activeBrandId);
  }, [activeBrandId, loadingBrand, fetchMenuData]);

  // Real-time branding updates
  useEffect(() => {
    const channel = supabase.channel('branding-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_settings' }, (payload) => {
        if (payload.new) setRestaurantSettings(payload.new);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

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

  const getProductsByCategory = (slug) => productsByCategory[slug] || [];
  const getModifiers = (group) => modifiers[group] || [];
  const getAllProducts = () => Object.values(productsByCategory).flat();

  return (
    <MenuDataContext.Provider
      value={{
        categories,
        allCategories,
        productsByCategory,
        getProductsByCategory,
        getAllProducts,
        getModifiers,
        modifiers,
        experiences,
        banners,
        allergens,
        homeSettings,
        restaurantSettings,
        brand,
        planFeatures,
        loading,
        activeBrandId,
        refetchMenuData: () => fetchMenuData(activeBrandId),
        hasFeature: (key) => planFeatures?.find(f => f.feature_key === key)?.is_included ?? false,
      }}
    >
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuData = () => useContext(MenuDataContext);
