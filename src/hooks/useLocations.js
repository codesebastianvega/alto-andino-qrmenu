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

  async function createLocation(locationData) {
    try {
      const { data, error: createError } = await supabase
        .from('locations')
        .insert([{ ...locationData, brand_id: activeBrandId }])
        .select()
        .single();
      
      if (createError) throw createError;
      setLocations(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function updateLocation(id, updates) {
    try {
      const { data, error: updateError } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .eq('brand_id', activeBrandId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      setLocations(prev => prev.map(loc => loc.id === id ? data : loc));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function deleteLocation(id) {
    try {
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)
        .eq('brand_id', activeBrandId);
      
      if (deleteError) throw deleteError;
      setLocations(prev => prev.filter(loc => loc.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  return {
    locations,
    loading,
    error,
    refresh: fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation
  };
}
