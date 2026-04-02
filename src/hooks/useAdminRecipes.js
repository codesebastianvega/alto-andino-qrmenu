import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export function useAdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            ingredient_id,
            quantity,
            ingredients (name, unit_cost, usage_unit)
          )
        `);

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      const { data, error } = await query
        .order('name');
      
      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      toast('Error al cargar recetas');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId]);

  useEffect(() => {
    if (activeBrandId) {
      fetchRecipes();
    } else {
      setLoading(false);
    }
  }, [activeBrandId, fetchRecipes]);

  return {
    recipes,
    loading,
    fetchRecipes
  };
}
