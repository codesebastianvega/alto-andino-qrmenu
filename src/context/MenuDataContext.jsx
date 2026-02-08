import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const MenuDataContext = createContext({});

export const MenuDataProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [modifiers, setModifiers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        // Fetch categories
        const { data: cats, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (catError) throw catError;

        // Fetch modifiers
        const { data: mods, error: modError } = await supabase
          .from('modifiers')
          .select('*')
          .eq('is_active', true);
        
        if (modError) console.warn('Error fetching modifiers:', modError);

        // Group modifiers by group
        const modGroups = {};
        if (mods) {
          mods.forEach(m => {
            if (!modGroups[m.group]) modGroups[m.group] = [];
            modGroups[m.group].push(m);
          });
        }
        setModifiers(modGroups);

        // Fetch all products with their category info
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select(`
            *,
            categories (slug)
          `)
          .eq('is_active', true);

        if (prodError) throw prodError;

        // Group products by category slug
        const grouped = {};
        products.forEach(product => {
          const cat = product.categories; // it's an object or array? select categories(slug) -> single object usually if FK
          const catSlug = Array.isArray(cat) ? cat[0]?.slug : cat?.slug || 'otros';
          
          if (!grouped[catSlug]) grouped[catSlug] = [];
          
          // Map to app format
          grouped[catSlug].push({
            id: product.id,
            name: product.name,
            price: product.price,
            desc: product.description || '',
            tags: product.tags || [],
            stock: product.stock_status || 'in',
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
          products: products.length
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
