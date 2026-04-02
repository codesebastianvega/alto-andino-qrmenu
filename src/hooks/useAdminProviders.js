import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export function useAdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('providers')
        .select('*');

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      const { data, error } = await query
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBrandId]);

  useEffect(() => {
    if (activeBrandId) {
      fetchProviders();
    } else {
      setLoading(false);
    }
  }, [activeBrandId, fetchProviders]);

  const createProvider = async (providerData) => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .insert([{ ...providerData, brand_id: activeBrandId }])
        .select()
        .single();

      if (error) throw error;
      fetchProviders();
      return data;
    } catch (err) {
      console.error('Error creating provider:', err);
      return null;
    }
  };

  const updateProvider = async (id, providerData) => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .update(providerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      fetchProviders();
      return data;
    } catch (err) {
      console.error('Error updating provider:', err);
      return null;
    }
  };

  const deleteProvider = async (id) => {
    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProviders();
      return true;
    } catch (err) {
      console.error('Error deleting provider:', err);
      return false;
    }
  };

  return {
    providers,
    loading,
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider
  };
}
