import { useState, useEffect } from 'react';
import { supabase } from '../../../../config/supabase';
import { toast } from '../../../Toast';
import { usePaymentPOSCalculations } from './usePaymentPOSCalculations';
import { useCustomerLoyaltyLookup } from './useCustomerLoyaltyLookup';

export function usePaymentPOSModal({ order, onClose, onSuccess, paymentMethods = [], activeBrand }) {
  // -- State --
  const [isSplitting, setIsSplitting] = useState(false);
  const [waiveServiceFee, setWaiveServiceFee] = useState(false);
  const [wasAutoFinalized, setWasAutoFinalized] = useState(false);

  // Selection
  const [selectedQuantities, setSelectedQuantities] = useState(() => {
    // Default to selecting all units of all unpaid items
    const initial = {};
    order?.order_items?.forEach((item) => {
      if (!item.is_paid) initial[item.id] = item.quantity;
    });
    return initial;
  });

  const [manualAmount, setManualAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('items'); // 'items' or 'manual'
  const [tenders, setTenders] = useState([]); // [{ methodId, name, amount, received, change, isCash }]
  const [currentMethod, setCurrentMethod] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [inputFocus, setInputFocus] = useState('received'); // 'manual_amount', 'received', or 'customer_phone'

  // Loyalty lookup
  const {
    customerPhone,
    setCustomerPhone,
    customerName,
    loyaltyStats,
    isSearchingCustomer
  } = useCustomerLoyaltyLookup({
    initialPhone: order?.customer_phone || '',
    initialName: order?.customer_name || '',
    brandId: activeBrand?.id
  });

  // UI Flow
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [lastTransactionChange, setLastTransactionChange] = useState(0);

  // Financial calculations
  const calculations = usePaymentPOSCalculations({
    order,
    waiveServiceFee,
    paymentMode,
    selectedQuantities,
    manualAmount,
    tenders
  });

  const { unpaidItems, amountToCover, pendingThreshold } = calculations;

  // -- Initialization --
  useEffect(() => {
    if (paymentMethods?.length > 0 && !currentMethod) {
      const defaultMethod = paymentMethods.find((m) => m.name.toLowerCase().includes('efectivo')) || paymentMethods[0];
      setCurrentMethod(defaultMethod);
    }
  }, [paymentMethods, currentMethod]);

  // -- Escape/Enter Key to Close or Finalize --
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSuccessScreen) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          onSuccess?.({ autoFinalized: wasAutoFinalized });
          onClose();
        }
        return;
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onSuccess, showSuccessScreen, wasAutoFinalized]);

  // Keypad Logic
  const isCash = currentMethod?.name?.toLowerCase().includes('efectivo');
  const keypadTarget =
    inputFocus === 'customer_phone'
      ? 'phone'
      : paymentMode === 'manual' && inputFocus === 'manual_amount'
      ? 'manual'
      : 'received';

  const handleKeyPress = (key) => {
    const setterMap = {
      phone: setCustomerPhone,
      manual: setManualAmount,
      received: setReceivedAmount
    };
    const setter = setterMap[keypadTarget];

    if (key === 'clear') {
      setter('');
      return;
    }
    if (key === '000') {
      if (keypadTarget !== 'phone') setter((prev) => prev + '000');
      return;
    }
    setter((prev) => prev + key);
  };

  // -- List Handlers --
  const updateItemQty = (itemId, change, max) => {
    setPaymentMode('items');
    setSelectedQuantities((prev) => {
      const curr = prev[itemId] || 0;
      const next = Math.max(0, Math.min(max, curr + change));
      return { ...prev, [itemId]: next };
    });
  };

  const toggleSplitting = () => {
    const nextVal = !isSplitting;
    setIsSplitting(nextVal);

    const allSelected = {};
    order?.order_items?.forEach((item) => {
      if (!item.is_paid) allSelected[item.id] = item.quantity;
    });
    setSelectedQuantities(allSelected);
  };

  const addTender = () => {
    if (!currentMethod) return;

    const inputVal = parseFloat(receivedAmount) || 0;

    let amount = 0;
    let received = 0;
    let change = 0;

    if (isCash) {
      received = inputVal;
      if (received <= 0) {
        toast.error('Ingrese el monto recibido');
        return;
      }
      amount = Math.min(received, pendingThreshold);
      change = received - amount;
    } else {
      amount = inputVal > 0 ? Math.min(inputVal, pendingThreshold) : pendingThreshold;
      received = amount;
      change = 0;
    }

    if (amount <= 0 && pendingThreshold > 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    setTenders((prev) => [
      ...prev,
      {
        methodId: currentMethod.id,
        name: currentMethod.name,
        amount,
        received,
        change,
        isCash: !!isCash
      }
    ]);

    setReceivedAmount('');
  };

  const removeTender = (index) => {
    setTenders((prev) => prev.filter((_, i) => i !== index));
  };

  // -- Finalize Transaction --
  const handleFinalize = async () => {
    let finalTenders = [...tenders];

    if (finalTenders.length === 0) {
      if (amountToCover <= 0) {
        toast.error('No hay un monto válido para pagar');
        return;
      }
      if (!currentMethod) {
        toast.error('Seleccione un método de pago');
        return;
      }

      finalTenders = [
        {
          methodId: currentMethod.id,
          name: currentMethod.name,
          amount: amountToCover,
          received: parseFloat(receivedAmount) || amountToCover,
          change: isCash ? Math.max(0, (parseFloat(receivedAmount) || 0) - amountToCover) : 0,
          isCash: !!isCash
        }
      ];
    }

    const currentTotalTendered = finalTenders.reduce((sum, t) => sum + t.amount, 0);

    if (currentTotalTendered < amountToCover - 0.1) {
      toast.error('El monto no cubre el total seleccionado');
      return;
    }

    setIsProcessing(true);
    try {
      const updates = {
        updated_at: new Date().toISOString(),
        customer_phone: customerPhone,
        customer_name: customerName || order.customer_name
      };

      if (waiveServiceFee && order.service_fee > 0) {
        updates.service_fee = 0;
        updates.total_amount = order.total_amount - order.service_fee;
      }

      await supabase.from('orders').update(updates).eq('id', order.id);

      const coveredItemIds = [];
      if (paymentMode === 'items') {
        for (const item of unpaidItems) {
          const qtyToPay = selectedQuantities[item.id] || 0;
          if (qtyToPay <= 0) continue;

          if (qtyToPay === item.quantity) {
            const { error: updError } = await supabase
              .from('order_items')
              .update({ is_paid: true })
              .eq('id', item.id);
            if (updError) throw updError;
            coveredItemIds.push(item.id);
          } else {
            const { error: updError } = await supabase
              .from('order_items')
              .update({ quantity: item.quantity - qtyToPay })
              .eq('id', item.id);
            if (updError) throw updError;

            const { id, created_at, products, ...rest } = item;
            const { data: newRow, error: insError } = await supabase
              .from('order_items')
              .insert([
                {
                  ...rest,
                  brand_id: rest.brand_id || order.brand_id || activeBrand.id,
                  quantity: qtyToPay,
                  is_paid: true
                }
              ])
              .select('id')
              .single();

            if (insError) throw insError;
            if (newRow?.id) {
              coveredItemIds.push(newRow.id);
            }
          }
        }
      }

      const totalChange = finalTenders.reduce((sum, t) => sum + t.change, 0);
      setLastTransactionChange(totalChange);

      const inserts = finalTenders.map((t) => ({
        order_id: order.id,
        brand_id: activeBrand.id,
        amount: t.amount,
        received_amount: t.received,
        change_amount: t.change,
        payment_method_id: t.methodId,
        payment_method_name: t.name,
        items_covered: paymentMode === 'items' ? coveredItemIds : null
      }));

      const { error: pError } = await supabase.from('order_payments').insert(inserts);
      if (pError) throw pError;

      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('total_amount, paid_amount, status')
        .eq('id', order.id)
        .single();
      const isFullyPaid =
        updatedOrder && Number(updatedOrder.paid_amount || 0) >= Number(updatedOrder.total_amount || 0) - 1;
      let autoFinalized = false;

      if (isFullyPaid) {
        if (updatedOrder.status === 'waiting_payment') {
          await supabase.from('orders').update({ status: 'new', payment_status: 'paid' }).eq('id', order.id);
        } else if (order.status === 'on_table' || order.status === 'on_the_way') {
          // El comensal consumió y pagó: finalizamos automáticamente el pedido y liberamos la mesa
          await supabase.from('orders').update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            payment_status: 'paid'
          }).eq('id', order.id);
          autoFinalized = true;
        } else {
          await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', order.id);
        }
      }

      setWasAutoFinalized(autoFinalized);
      setShowSuccessScreen(true);
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar la transacción');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isSplitting,
    waiveServiceFee,
    setWaiveServiceFee,
    wasAutoFinalized,
    selectedQuantities,
    manualAmount,
    paymentMode,
    setPaymentMode,
    tenders,
    currentMethod,
    setCurrentMethod,
    receivedAmount,
    setReceivedAmount,
    inputFocus,
    setInputFocus,
    customerPhone,
    customerName,
    loyaltyStats,
    isSearchingCustomer,
    isProcessing,
    showSuccessScreen,
    lastTransactionChange,
    calculations,
    isCash,
    keypadTarget,
    handleKeyPress,
    updateItemQty,
    toggleSplitting,
    addTender,
    removeTender,
    handleFinalize
  };
}
