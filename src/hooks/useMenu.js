import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

/**
 * Hook to fetch all categories from Supabase
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) throw error;
        
        // Map to app format: { id: slug, label: name }
        const mapped = data.map(cat => ({
          id: cat.slug,
          label: cat.name,
          icon: cat.icon,
          _raw: cat // Keep original for reference
        }));
        
        setCategories(mapped);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

/**
 * Hook to fetch products by category slug
 */
export const useProducts = (categorySlug) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categorySlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        // First get the category by slug
        const { data: category, error: catError } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();

        if (catError) throw catError;

        // Then get products for that category
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', category.id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;

        // Map to app format
        const mapped = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          desc: product.description || '',
          tags: product.tags || [],
          stock: product.stock_status,
          image: product.image_url,
          _raw: product // Keep original
        }));

        setProducts(mapped);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug]);

  return { products, loading, error };
};

/**
 * Hook to fetch all products (for search)
 */
export const useAllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories (slug, name)
          `)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;

        // Map to app format with category info
        const mapped = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          desc: product.description || '',
          tags: product.tags || [],
          stock: product.stock_status,
          image: product.image_url,
          category: product.categories?.slug || '',
          _raw: product
        }));

        setProducts(mapped);
      } catch (err) {
        console.error('Error fetching all products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  return { products, loading, error };
};
