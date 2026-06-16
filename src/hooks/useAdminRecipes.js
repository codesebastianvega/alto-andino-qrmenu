import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export function useAdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;
  const isMountedRef = useRef(false);

  const fetchRecipes = useCallback(async (locationId = 'all', options = {}) => {
    const { signal } = options;
    try {
      if (signal?.aborted) return;
      if (isMountedRef.current) setLoading(true);
      let query = supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            ingredient_id,
            quantity,
            ingredients (name, unit_cost, usage_unit)
          ),
          location_recipes!left(*)
        `);

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query
        .order('name');

      if (signal?.aborted || !isMountedRef.current) return;
      
      if (error) throw error;

      let filteredData = data || [];
      if (locationId && locationId !== 'all') {
        filteredData = filteredData.filter(recipe => 
          recipe.location_recipes?.some(lr => lr.location_id === locationId)
        );
      }

      setRecipes(filteredData);
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError') return;
      console.error('Error fetching recipes:', err);
      if (isMountedRef.current) toast('Error al cargar recetas');
    } finally {
      if (!signal?.aborted && isMountedRef.current) setLoading(false);
    }
  }, [activeBrandId]);

  useEffect(() => {
    isMountedRef.current = true;
    const abortController = new AbortController();

    if (activeBrandId) {
      fetchRecipes('all', { signal: abortController.signal });
    } else {
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [activeBrandId, fetchRecipes]);

  return {
    recipes,
    loading,
    fetchRecipes
  };
}
