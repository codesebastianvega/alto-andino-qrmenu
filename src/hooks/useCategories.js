import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';

// Toast wrapper
const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;
  const isMountedRef = useRef(false);

  const fetchCategories = useCallback(async (locationId = 'all', options = {}) => {
    const { signal } = options;
    try {
      if (signal?.aborted) return;
      if (isMountedRef.current) setLoading(true);
      console.log('Fetching categories for location:', locationId);
      
      let query = supabase
        .from('categories')
        .select(`
          *,
          items:products(id, is_active, stock_status, category_id),
          location_categories!left(*)
        `);

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      if (signal) {
        query = query.abortSignal(signal);
      }
        
      const { data, error } = await query.order('sort_order', { ascending: true });

      if (signal?.aborted || !isMountedRef.current) return;

      if (error) {
        console.error('Categories error:', error);
        throw error;
      }

      // Fetch location-specific product links if a location is active
      let linkedProductIds = null;
      if (locationId && locationId !== 'all') {
        let locationQuery = supabase
          .from('location_product_status')
          .select('product_id')
          .eq('location_id', locationId);

        if (signal) {
          locationQuery = locationQuery.abortSignal(signal);
        }

        const { data: lps } = await locationQuery;
        if (signal?.aborted || !isMountedRef.current) return;
        linkedProductIds = new Set((lps || []).map(r => r.product_id));
      }

      // Filter and process counts
      let filteredData = data || [];
      
      // We no longer filter results strictly. If a category exists in the brand, 
      // it's visible in the admin list unless specifically deactivated for that location in the future.

      const enrichedData = filteredData.map(cat => {
        const items = cat.items || [];
        const total_products = items.length;
        const active_products = items.filter(p => p.is_active && p.stock_status !== 'out').length;

        // Count products linked to this specific location
        const linked_products = linkedProductIds
          ? items.filter(p => linkedProductIds.has(p.id)).length
          : null;
        
        return {
          ...cat,
          total_products,
          active_products,
          linked_products
        };
      });

      console.log('Categories loaded:', enrichedData.length);
      setCategories(enrichedData);
      setError(null);
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError') return;
      console.error('Error fetching categories:', err);
      if (isMountedRef.current) setError(err.message);
    } finally {
      if (!signal?.aborted && isMountedRef.current) setLoading(false);
    }
  }, [activeBrandId]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!activeBrandId) {
      setLoading(false);
      return () => {
        isMountedRef.current = false;
      };
    }

    const abortController = new AbortController();

    fetchCategories('all', { signal: abortController.signal });

    // Real-time listener
    const channel = supabase
      .channel(`admin-categories-${activeBrandId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'categories',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => fetchCategories('all', { signal: abortController.signal }))
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'location_categories'
      }, () => fetchCategories('all', { signal: abortController.signal }))
      .subscribe();

    return () => {
      isMountedRef.current = false;
      abortController.abort();
      supabase.removeChannel(channel);
    };
  }, [activeBrandId, fetchCategories]);

  // Create new category
  const createCategory = async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...categoryData, brand_id: activeBrandId }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      toast.success('Categoría creada exitosamente');
      return { success: true, data };
    } catch (err) {
      console.error('Error creating category:', err);
      toast.error('Error al crear categoría: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Update existing category
  const updateCategory = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('brand_id', activeBrandId)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => 
        prev.map(c => {
          if (c.id === id) {
            // Preserve calculated counts while applying new data
            return {
              ...data,
              total_products: c.total_products,
              active_products: c.active_products
            };
          }
          return c;
        }).sort((a, b) => a.sort_order - b.sort_order)
      );
      toast.success('Categoría actualizada');
      return { success: true, data };
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error('Error al actualizar: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('brand_id', activeBrandId);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoría eliminada');
      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Error al eliminar: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Bulk update sort orders
  const updateCategoryOrders = async (orderedCategories) => {
    try {
      // Optimistic UI update
      setCategories(orderedCategories.map((cat, idx) => ({ ...cat, sort_order: idx + 1 })));

      const updates = orderedCategories.map((cat, idx) => ({
        id: cat.id,
        sort_order: idx + 1
      }));

      // Execute updates in parallel
      await Promise.all(
        updates.map(u => 
          supabase.from('categories').update({ sort_order: u.sort_order }).eq('id', u.id).eq('brand_id', activeBrandId)
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error updating category orders:', err);
      toast.error('Error al actualizar orden: ' + err.message);
      fetchCategories(); // Reload to fix optimistic UI failure
      return { success: false, error: err.message };
    }
  };

  return { categories, loading, error, createCategory, updateCategory, deleteCategory, updateCategoryOrders, fetchCategories };
};
