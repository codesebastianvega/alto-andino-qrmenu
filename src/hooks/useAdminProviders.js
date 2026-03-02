import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';

export function useAdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const createProvider = async (providerData) => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .insert([providerData])
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
