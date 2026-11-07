import { useState, useEffect } from 'react';
import { supabase } from '../../../../config/supabase';
import { toast } from '../../../Toast';
import { parseCustomerInfo } from '../../../../hooks/useCRM';

export function useManualOrderCustomer({ isOpen, brandId }) {
  const [customerName, setCustomerName] = useState('Cliente WhatsApp');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('delivery');

  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  const [timingMode, setTimingMode] = useState('immediate');
  const [scheduledTime, setScheduledTime] = useState('');

  // Reset when opening
  useEffect(() => {
    if (!isOpen) return;
    setCustomerName('Cliente WhatsApp');
    setCustomerPhone('');
    setDeliveryAddress('');
    setOrderNotes('');
    setTimingMode('immediate');
    setScheduledTime('');
    setFulfillmentType('delivery');
    setCustomerSuggestions([]);
    setShowSuggestions(false);
  }, [isOpen]);

  // Live autocomplete: buscar clientes recurrentes por nombre
  useEffect(() => {
    const qName = customerName?.trim() || '';
    if (!qName || qName.length < 2 || qName === 'Cliente WhatsApp') {
      setCustomerSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingCustomer(true);
        const { data } = await supabase
          .from('orders')
          .select('customer_name, customer_phone, delivery_address, delivery_notes')
          .eq('brand_id', brandId)
          .ilike('customer_name', `%${qName}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          const map = new Map();
          data.forEach(item => {
            const raw = (item.customer_phone || item.customer_name || '').toLowerCase().trim();
            if (raw && !map.has(raw)) {
              map.set(raw, item);
            }
          });
          setCustomerSuggestions(Array.from(map.values()));
        } else {
          setCustomerSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching customer suggestions:', err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [customerName, brandId]);

  // Si escriben un número de teléfono, autocompletar nombre y dirección si ya existía
  useEffect(() => {
    const raw = (customerPhone || '').replace(/\D/g, '');
    if (raw.length < 7) return;

    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('customer_name, delivery_address, delivery_notes')
          .eq('brand_id', brandId)
          .ilike('customer_phone', `%${raw}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const prev = data[0];
          if (prev.customer_name && (!customerName || customerName === 'Cliente WhatsApp')) {
            setCustomerName(prev.customer_name);
          }
          if (prev.delivery_address && !deliveryAddress) {
            setDeliveryAddress(prev.delivery_address);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customerPhone, customerName, deliveryAddress, brandId]);

  const handleSelectSuggestion = (sug) => {
    const parsed = parseCustomerInfo(sug.customer_name, sug.delivery_address, sug.delivery_notes);
    setCustomerName(parsed.cleanName || sug.customer_name || customerName);
    if (sug.customer_phone) setCustomerPhone(sug.customer_phone);
    if (parsed.address || sug.delivery_address) setDeliveryAddress(parsed.address || sug.delivery_address);
    if (parsed.notes && !orderNotes) setOrderNotes(parsed.notes);
    setShowSuggestions(false);
    toast.success(`Cliente cargado: ${parsed.cleanName || sug.customer_name}`);
  };

  return {
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    deliveryAddress,
    setDeliveryAddress,
    orderNotes,
    setOrderNotes,
    fulfillmentType,
    setFulfillmentType,
    customerSuggestions,
    showSuggestions,
    setShowSuggestions,
    isSearchingCustomer,
    timingMode,
    setTimingMode,
    scheduledTime,
    setScheduledTime,
    handleSelectSuggestion
  };
}
