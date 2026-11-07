import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { buildDefaultPaymentMethods } from '../utils/paymentDefaults';

export function usePaymentMethods(explicitBrandId = null) {
  const { activeBrand, profile } = useAuth();
  const brandId = explicitBrandId || activeBrand?.id || profile?.brand_id || localStorage.getItem("aa_active_brand_id");
  
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
        .eq('brand_id', brandId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Auto-provision default Cash payment method if store has none
        const defaultMethods = buildDefaultPaymentMethods(brandId, { 
          phone: activeBrand?.whatsapp || activeBrand?.phone 
        });
        const { data: created, error: createErr } = await supabase
          .from('payment_methods')
          .insert(defaultMethods)
          .select();
        
        if (!createErr && created && created.length > 0) {
          setPaymentMethods(created);
          return;
        }
      }

      const existing = data || [];
      const finAccounts = activeBrand?.config?.financials?.accounts || [];
      const missingFinAccounts = finAccounts.filter(acc => {
        if (!acc?.name) return false;
        const norm = acc.name.toLowerCase().trim();
        return !existing.some(m => (m.name || '').toLowerCase().trim() === norm);
      });

      if (missingFinAccounts.length > 0) {
        try {
          const toInsert = missingFinAccounts.map(acc => {
            const isCash = acc.type === 'cash' || /efectivo|gaveta/i.test(acc.name);
            return {
              brand_id: brandId,
              name: acc.name,
              type: isCash ? 'cash' : 'digital_wallet',
              icon: isCash ? 'solar:money-bag-bold' : 'solar:wallet-bold',
              is_active: true,
              details: {
                bank_name: acc.name,
                instructions: 'Pago vía ' + acc.name
              }
            };
          });
          const { data: newlyCreated } = await supabase
            .from('payment_methods')
            .insert(toInsert)
            .select();

          if (newlyCreated && newlyCreated.length > 0) {
            setPaymentMethods([...existing, ...newlyCreated]);
            return;
          }
        } catch (autoErr) {
          console.warn('[usePaymentMethods] auto-sync note:', autoErr);
        }
      }

      setPaymentMethods(existing);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const createPaymentMethod = async (methodData) => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{ ...methodData, brand_id: brandId }])
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
