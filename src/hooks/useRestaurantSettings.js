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
        const { data, error } = await supabase
          .from('restaurant_settings')
          .select('*')
          .eq('brand_id', activeBrandId)
          .order('location_id', { ascending: true, nullsFirst: true })
          .limit(1)
          .maybeSingle();

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
