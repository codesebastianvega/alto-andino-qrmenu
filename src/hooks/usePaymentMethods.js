import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export function usePaymentMethods(explicitBrandId = null) {
  const { activeBrand } = useAuth();
  const brandId = explicitBrandId || activeBrand?.id;
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!brandId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [activeBrand?.id]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const createPaymentMethod = async (methodData) => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{ ...methodData, brand_id: activeBrand.id }])
        .select()
        .single();

      if (error) throw error;
      setPaymentMethods(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      console.error('Error creating payment method:', err);
      return { data: null, error: err };
    }
  };

  const updatePaymentMethod = async (id, Updates) => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(Updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setPaymentMethods(prev => prev.map(m => m.id === id ? data : m));
      return { data, error: null };
    } catch (err) {
      console.error('Error updating payment method:', err);
      return { data: null, error: err };
    }
  };

  const deletePaymentMethod = async (id) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting payment method:', err);
      return { error: err };
    }
  };

  return {
    paymentMethods,
    loading,
    error,
    refresh: fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
  };
}
