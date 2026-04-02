import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  useEffect(() => {
    if (activeBrandId) {
      fetchLocations();
    } else {
      setLoading(false);
    }
  }, [activeBrandId]);

  async function fetchLocations() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('brand_id', activeBrandId)
        .order('is_main', { ascending: false })
        .order('name');

      if (fetchError) throw fetchError;
      setLocations(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return {
    locations,
    loading,
    error,
    refresh: fetchLocations
  };
}
