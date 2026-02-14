import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const MenuDataContext = createContext({});

export const MenuDataProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [modifiers, setModifiers] = useState({});
  const [experiences, setExperiences] = useState([]);
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
          .order('sort_order', { ascending: true });
        
        if (expError) console.warn('Error fetching experiences (table might not exist yet):', expError);
        setExperiences(exp || []);

        // Fetch all products with their category info
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select(`
            *,
            categories:category_id (slug)
          `)
          .eq('is_active', true);

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
            stock_status: product.stock_status || 'in', // Changed from 'stock' to 'stock_status'
            image: product.image_url,
            variants: product.variants || [],
            modifierGroups: product.modifier_groups || [],
            configOptions: product.config_options || {},
            _supabase: product // Keep original for debugging
          });
        });

        setCategories(cats);
        setProductsByCategory(grouped);
        
        // Debug
        console.log('✅ Datos cargados:', {
          cats: cats.length,
          mods: mods?.length || 0,
          products: products.length,
          experiences: exp?.length || 0
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
