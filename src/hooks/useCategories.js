import { useState, useEffect } from 'react';
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('Fetching categories...');
      
      let query = supabase
        .from('categories')
        .select(`
          *,
          items:products(id, is_active, stock_status)
        `);

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }
        
      const { data, error } = await query.order('sort_order', { ascending: true });

      if (error) {
        console.error('Categories error:', error);
        throw error;
      }

      // Process counts
      const enrichedData = (data || []).map(cat => {
        const items = cat.items || [];
        const total_products = items.length;
        const active_products = items.filter(p => p.is_active && p.stock_status !== 'out').length;
        
        return {
          ...cat,
          total_products,
          active_products
        };
      });

      console.log('Categories loaded:', enrichedData.length);
      setCategories(enrichedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBrandId) {
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [activeBrandId]);

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

  return { categories, loading, error, createCategory, updateCategory, deleteCategory, updateCategoryOrders };
};
