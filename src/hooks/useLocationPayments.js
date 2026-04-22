import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

export function useLocationPayments(locationId) {
  const [locationPayments, setLocationPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocationPayments = useCallback(async () => {
    if (!locationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('location_payment_methods')
        .select(`
          *,
          payment_method:payment_method_id (*)
        `)
        .eq('location_id', locationId);

      if (error) throw error;
      setLocationPayments(data || []);
    } catch (err) {
      console.error('Error fetching location payment methods:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchLocationPayments();
  }, [fetchLocationPayments]);

  const togglePaymentMethod = async (paymentMethodId, isActive) => {
    try {
      // Check if it already exists
      const existing = locationPayments.find(lp => lp.payment_method_id === paymentMethodId);
      
      let result;
      if (existing) {
        result = await supabase
          .from('location_payment_methods')
          .update({ is_active: isActive })
          .eq('location_id', locationId)
          .eq('payment_method_id', paymentMethodId)
          .select(`
            *,
            payment_method:payment_method_id (*)
          `)
          .single();
      } else {
        result = await supabase
          .from('location_payment_methods')
          .insert([{ 
            location_id: locationId, 
            payment_method_id: paymentMethodId, 
            is_active: isActive,
            config: {} 
          }])
          .select(`
            *,
            payment_method:payment_method_id (*)
          `)
          .single();
      }

      if (result.error) throw result.error;

      setLocationPayments(prev => {
        const index = prev.findIndex(lp => lp.payment_method_id === paymentMethodId);
        if (index >= 0) {
          const newPayments = [...prev];
          newPayments[index] = result.data;
          return newPayments;
        }
        return [...prev, result.data];
      });

      return { data: result.data, error: null };
    } catch (err) {
      console.error('Error toggling location payment method:', err);
      return { data: null, error: err };
    }
  };

  const updateLocationPaymentConfig = async (paymentMethodId, config) => {
    try {
      const { data, error } = await supabase
        .from('location_payment_methods')
        .update({ config })
        .eq('location_id', locationId)
        .eq('payment_method_id', paymentMethodId)
        .select(`
          *,
          payment_method:payment_method_id (*)
        `)
        .single();

      if (error) throw error;
      
      setLocationPayments(prev => prev.map(lp => 
        lp.payment_method_id === paymentMethodId ? data : lp
      ));

      return { data, error: null };
    } catch (err) {
      console.error('Error updating location payment config:', err);
      return { data: null, error: err };
    }
  };

  return {
    locationPayments,
    loading,
    error,
    refresh: fetchLocationPayments,
    togglePaymentMethod,
    updateLocationPaymentConfig
  };
}
