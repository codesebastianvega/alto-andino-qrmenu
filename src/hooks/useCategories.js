import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('Fetching categories...');
        
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Categories error:', error);
          throw error;
        }

        console.log('Categories loaded:', data?.length);
        setCategories(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Create new category
  const createCategory = async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
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
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => 
        prev.map(c => c.id === id ? data : c).sort((a, b) => a.sort_order - b.sort_order)
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
        .eq('id', id);

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

  return { categories, loading, error, createCategory, updateCategory, deleteCategory };
};
