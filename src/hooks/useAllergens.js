import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export function useAllergens() {
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);

  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  useEffect(() => {
    async function fetchAllergens() {
      if (!activeBrandId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('allergens')
          .select('*')
          .eq('brand_id', activeBrandId)
          .order('name');
        if (error) throw error;
        setAllergens(data || []);
      } catch (err) {
        console.error('Error fetching allergens:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllergens();
  }, [activeBrandId]);

  return { allergens, loading };
}
