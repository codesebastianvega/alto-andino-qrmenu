import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export function useIngredientCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('ingredient_categories')
        .select('*');

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      const { data, error } = await query
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching ingredient categories:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBrandId]);

  const createCategory = async (name) => {
    try {
      const { data, error } = await supabase
        .from('ingredient_categories')
        .insert([{ name, brand_id: activeBrandId }])
        .select()
        .single();

      if (error) throw error;
      toast('Categoría creada');
      fetchCategories();
      return data;
    } catch (err) {
      toast('Error: ' + err.message);
      return null;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const { error } = await supabase
        .from('ingredient_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Categoría eliminada');
      fetchCategories();
      return true;
    } catch (err) {
      toast('Error al eliminar: ' + err.message);
      return false;
    }
  };

  const updateCategory = async (id, name) => {
    try {
      const { data, error } = await supabase
        .from('ingredient_categories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast('Categoría actualizada');
      fetchCategories();
      return data;
    } catch (err) {
      toast('Error al actualizar: ' + err.message);
      return null;
    }
  };

  useEffect(() => {
    if (activeBrandId) {
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [activeBrandId, fetchCategories]);

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
}
