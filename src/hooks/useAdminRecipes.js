import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';

export function useAdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            ingredient_id,
            quantity,
            ingredients (name, unit_cost, usage_unit)
          )
        `)
        .order('name');
      
      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      toast('Error al cargar recetas');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recipes,
    loading,
    fetchRecipes
  };
}
