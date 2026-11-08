import { useState, useEffect } from 'react';
import { supabase } from '../../../../config/supabase';

export function useCustomerLoyaltyLookup({ initialPhone = '', initialName = '', brandId }) {
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [customerName, setCustomerName] = useState(initialName);
  const [loyaltyStats, setLoyaltyStats] = useState({ count: 0, medal: null });
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerPhone.length >= 7) {
        setIsSearchingCustomer(true);
        try {
          // Get most recent name
          const { data: recentOrders } = await supabase
            .from('orders')
            .select('customer_name')
            .eq('customer_phone', customerPhone)
            .neq('customer_name', '')
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentOrders?.length > 0 && !customerName) {
            setCustomerName(recentOrders[0].customer_name);
          }

          // Get total count for loyalty
          if (brandId) {
            const { count, error } = await supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('brand_id', brandId)
              .eq('customer_phone', customerPhone)
              .eq('status', 'delivered');

            if (!error) {
              let medal = null;
              if (count >= 1 && count <= 3) medal = 'gold';
              else if (count > 3) medal = 'emerald';
              setLoyaltyStats({ count, medal });
            }
          }
        } catch (err) {
          console.error('Error searching customer:', err);
        } finally {
          setIsSearchingCustomer(false);
        }
      } else {
        setLoyaltyStats({ count: 0, medal: null });
      }
    }, 600); // Debounce

    return () => clearTimeout(timer);
  }, [customerPhone, brandId]);

  return {
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    loyaltyStats,
    isSearchingCustomer
  };
}
