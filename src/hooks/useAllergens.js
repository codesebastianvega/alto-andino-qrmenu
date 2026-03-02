import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export function useAllergens() {
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllergens() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('allergens').select('*').order('name');
        if (error) throw error;
        setAllergens(data || []);
      } catch (err) {
        console.error('Error fetching allergens:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllergens();
  }, []);

  return { allergens, loading };
}
