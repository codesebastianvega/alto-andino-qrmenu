import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const MenuDataContext = createContext({});

export const MenuDataProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [modifiers, setModifiers] = useState({});
  const [experiences, setExperiences] = useState([]);
  const [banners, setBanners] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        // Fetch categories
        const { data: cats, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (catError) throw catError;

        // Filter categories based on dayparting (time schedule) and days of week
        const activeCats = cats.filter(cat => {
          // 1. Basic active toggle
          if (cat.is_active === false) return false;

          const now = new Date();
          const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
          
          // 2. Filter by Day of Week
          const config = cat.visibility_config || {};
          const allowedDays = config.days || [0,1,2,3,4,5,6];
          if (!allowedDays.includes(currentDay)) return false;

          // 3. Filter by Time
          if (!cat.available_from && !cat.available_to) return true;
          
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          const parseTime = (timeStr) => {
            if (!timeStr) return null;
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
          };

          const fromMinutes = parseTime(cat.available_from);
          const toMinutes = parseTime(cat.available_to);

          if (fromMinutes !== null && toMinutes !== null) {
            if (fromMinutes < toMinutes) {
              return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
            } else {
              // Day overlap, e.g., 18:00 to 02:00
              return currentMinutes >= fromMinutes || currentMinutes <= toMinutes;
            }
          } else if (fromMinutes !== null) {
            return currentMinutes >= fromMinutes;
          } else if (toMinutes !== null) {
            return currentMinutes <= toMinutes;
          }
          return true;
        });

        // Fetch modifiers from ingredients table with their category names
        const { data: mods, error: modError } = await supabase
          .from('ingredients')
          .select('*, ingredient_categories(name)')
          .eq('is_active', true)
          .eq('is_modifier', true);
        
        if (modError) console.warn('Error fetching modifiers:', modError);

        // Group modifiers by category
        const modGroups = {};
        if (mods) {
          mods.forEach(m => {
            const groupName = m.ingredient_categories?.name || m.category || 'adiciones';
            if (!modGroups[groupName]) modGroups[groupName] = [];
            modGroups[groupName].push({
              ...m,
              price: m.selling_price || 0,
              group: groupName
            });
          });
        }
        setModifiers(modGroups);

        // Fetch experiences
        const { data: exp, error: expError } = await supabase
          .from('experiences')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (expError) console.warn('Error fetching experiences (table might not exist yet):', expError);
        setExperiences(exp || []);

        // Fetch allergens
        const { data: allgs, error: allgError } = await supabase
          .from('allergens')
          .select('*')
          .order('name');
        
        if (allgError) console.warn('Error fetching allergens:', allgError);
        setAllergens(allgs || []);

        // Fetch banners
        const { data: bnrs, error: bnrsError } = await supabase
          .from('promo_banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (bnrsError) console.warn('Error fetching banners:', bnrsError);
        setBanners(bnrs || []);

        // Fetch all products with their category info
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select(`
            *,
            categories:category_id (slug)
          `)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (prodError) throw prodError;

        // Group products by category slug
        const grouped = {};
        products.forEach(product => {
          // Filter out items that are strictly addons from the main menu lists
          if (product.is_addon === true) return;

          // With the join above, product.categories should be { slug: '...' }
          const cat = product.categories; 
          const catSlug = cat?.slug || 'otros';
          
          if (!grouped[catSlug]) grouped[catSlug] = [];
          
          // Map to app format
          grouped[catSlug].push({
            id: product.id,
            name: product.name,
            price: product.price,
            desc: product.description || '',
            tags: product.tags || [],
            stock_status: product.stock_status || 'in',
            image: product.image_url,
            variants: product.variants || [],
            modifierGroups: product.modifier_groups || [],
            configOptions: product.config_options || {},
            is_upsell: product.is_upsell || false,
            requires_kitchen: product.requires_kitchen ?? true,
            subcategory: product.subcategory,
            categorySlug: catSlug,          // expose slug for QuickView fallback
            _supabase: product
          });
        });

        setCategories(activeCats);
        setProductsByCategory(grouped);
        
        // Debug
        console.log('✅ Datos cargados:', {
          cats: cats.length,
          mods: mods?.length || 0,
          products: products.length,
          experiences: exp?.length || 0,
          allergens: allgs?.length || 0
        });
      } catch (err) {
        console.error('Error fetching menu data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  const getProductsByCategory = (slug) => {
    return productsByCategory[slug] || [];
  };

  const getModifiers = (group) => {
    return modifiers[group] || [];
  };

  const getAllProducts = () => {
    return Object.values(productsByCategory).flat();
  };

  return (
    <MenuDataContext.Provider 
      value={{ 
        categories, 
        productsByCategory,
        getProductsByCategory,
        getAllProducts,
        getModifiers,
        modifiers,
        experiences,
        banners,
        allergens,
        loading 
      }}
    >
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuData = () => {
  return useContext(MenuDataContext);
};
