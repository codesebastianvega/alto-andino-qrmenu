import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export const useRestaurantSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurant_settings')
          .select('*')
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

    fetchSettings();
  }, []);

  return { settings, loading };
};
