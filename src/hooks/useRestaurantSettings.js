import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export const useRestaurantSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('restaurant_settings')
          .select('*');

        if (activeBrandId) {
          query = query.eq('brand_id', activeBrandId);
        }

        const { data, error } = await query
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setSettings(data || {});
      } catch (err) {
        console.error('Error fetching restaurant settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeBrandId) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [activeBrandId]);

  return { settings, loading };
};
