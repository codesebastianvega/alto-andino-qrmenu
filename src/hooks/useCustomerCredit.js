import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export function normalizeCreditPhone(value = '') {
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits;
}

export function useCustomerCredit(brandId, phone) {
  const normalized = normalizeCreditPhone(phone);
  const key = `${brandId || ''}:${normalized}`;
  const [result, setResult] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!brandId || normalized.length !== 10) return;
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('checkout_customer_credit_enabled', {
          p_brand_id: brandId, p_phone: normalized,
        });
        if (!cancelled) setResult({ key, allowed: !error && data === true });
      } catch {
        if (!cancelled) setResult({ key, allowed: false });
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [brandId, normalized, key]);
  return normalized.length === 10 && result?.key === key && result.allowed === true;
}
