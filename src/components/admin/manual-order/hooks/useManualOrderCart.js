import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../../config/supabase';
import { toast } from '../../../Toast';
import { formatCOP } from '../../../../utils/money';
import { printThermalDocument } from '../../../../utils/thermalPrint';
import { resolveOrCreateCustomer, syncCollectionToFinancials } from '../../../../utils/customerSync';
import {
  isValidUUID,
  resolveProductModifierConfig,
  calculateProductExtraPrice,
  calculateModalDishLivePrice
} from '../helpers/manualOrderHelpers';

export function useManualOrderCart({
  isOpen,
  brandId,
  locationId,
  selectedLocationId,
  locationsList,
  restaurantSettings,
  dailySpecialData,
  rawModifierGroups,
  getModifiers,
  digitalAccountsList,
  selectedDigitalAccountId,
  splitDigitalMethod,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryFee,
  orderNotes,
  fulfillmentType,
  timingMode,
  scheduledTime,
  onOrderCreated,
  onClose
}) {
  const [orderItems, setOrderItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active item configuration (when clicking a product with options)
  const [configuringProduct, setConfiguringProduct] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [itemKitchenNotes, setItemKitchenNotes] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Flow & Payment
  const [entryFlow, setEntryFlow] = useState('kitchen'); // 'kitchen' | 'completed'
  const [isPaid, setIsPaid] = useState(false);
  const [pendingType, setPendingType] = useState('contra_entrega'); // 'contra_entrega' | 'fiado'
  const [paymentMethod, setPaymentMethod] = useState('nequi');
  const [cashTendered, setCashTendered] = useState('');
  const [printKitchenTicket, setPrintKitchenTicket] = useState(true);

  // Split payment
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitDigitalAmount, setSplitDigitalAmount] = useState('');

  // Reset cart when modal closes/opens
  useEffect(() => {
    if (!isOpen) return;
    setOrderItems([]);
    setIsPaid(false);
    setPaymentMethod('nequi');
    setCashTendered('');
    setSplitCashAmount('');
    setSplitDigitalAmount('');
    setConfiguringProduct(null);
    setSelectedModifiers({});
    setItemKitchenNotes('');
    setEditingItemIndex(null);
  }, [isOpen]);

  // Open product modifier configuration
  const handleSelectProduct = (product) => {
    const config = resolveProductModifierConfig(product, dailySpecialData, rawModifierGroups, getModifiers);
    if (config) {
      setConfiguringProduct({ product, groups: config.groups });
      setSelectedModifiers(config.initialModifiers);
      setItemKitchenNotes('');
      setEditingItemIndex(null);
      return;
    }

    // Direct simple product
    addSimpleProductToCart(product);
  };

  const addSimpleProductToCart = (product) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && Object.keys(item.options || {}).length === 0);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, {
        product,
        qty: 1,
        unitPrice: Number(product.price) || 0,
        options: {},
        notes: ''
      }];
    });
    toast.success(`${product.name} agregado`);
  };

  const handleConfirmConfiguredProduct = () => {
    if (!configuringProduct) return;
    const { product, groups } = configuringProduct;

    const extra = calculateProductExtraPrice(groups, selectedModifiers);
    const unitPrice = (Number(product.price) || 0) + extra;

    // Flatten options for comanda
    const formattedOptions = {};
    Object.entries(selectedModifiers).forEach(([gName, arr]) => {
      if (arr && arr.length > 0) {
        formattedOptions[gName] = arr.length === 1 ? arr[0] : arr;
      }
    });

    setOrderItems(prev => {
      const newItem = {
        product,
        qty: editingItemIndex !== null && prev[editingItemIndex] ? prev[editingItemIndex].qty : 1,
        unitPrice,
        options: formattedOptions,
        notes: itemKitchenNotes.trim()
      };
      if (editingItemIndex !== null) {
        return prev.map((it, i) => (i === editingItemIndex ? newItem : it));
      }
      return [...prev, newItem];
    });

    setConfiguringProduct(null);
    setSelectedModifiers({});
    setItemKitchenNotes('');
    setEditingItemIndex(null);
    toast.success(`${product.name} ${editingItemIndex !== null ? 'actualizado' : 'agregado al pedido'}`);
  };

  const modalDishLivePrice = useMemo(() => {
    return calculateModalDishLivePrice(configuringProduct, selectedModifiers);
  }, [configuringProduct, selectedModifiers]);

  const handleEditItem = (index) => {
    const item = orderItems[index];
    if (!item) return;

    handleSelectProduct(item.product);
    const prefill = {};
    Object.entries(item.options || {}).forEach(([k, v]) => {
      prefill[k] = Array.isArray(v) ? v : [v];
    });
    setSelectedModifiers(prefill);
    setItemKitchenNotes(item.notes || '');
    setEditingItemIndex(index);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index, delta) => {
    setOrderItems(prev => {
      return prev.map((it, i) => {
        if (i !== index) return it;
        const newQty = it.qty + delta;
        return newQty > 0 ? { ...it, qty: newQty } : null;
      }).filter(Boolean);
    });
  };

  // Totals
  const itemsSubtotal = useMemo(() => {
    return orderItems.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  }, [orderItems]);

  const activeDeliveryFee = fulfillmentType === 'delivery' ? Number(deliveryFee || 0) : 0;
  const grandTotal = itemsSubtotal + activeDeliveryFee;

  // Submit and create order
  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      toast.error('Agrega al menos un plato o producto al pedido.');
      return;
    }
    if (timingMode === 'scheduled' && !scheduledTime) {
      toast.error('Por favor selecciona la fecha y hora programada.');
      return;
    }

    setIsSubmitting(true);
    try {
      let parsedScheduledTime = null;
      if (timingMode === 'scheduled' && scheduledTime) {
        try {
          parsedScheduledTime = new Date(scheduledTime).toISOString();
        } catch (e) {
          parsedScheduledTime = scheduledTime;
        }
      }

      const effectiveLocationId = isValidUUID(selectedLocationId)
        ? selectedLocationId
        : (isValidUUID(locationId) ? locationId : (locationsList?.find(l => l.is_main)?.id || locationsList?.[0]?.id || null));

      const isAlreadyDelivered = entryFlow === 'completed';

      let finalPaymentMethod = paymentMethod;
      let finalDeliveryNotes = orderNotes?.trim() || '';

      const tenderNum = Number(String(cashTendered).replace(/\D/g, '')) || 0;

      if (!isPaid) {
        if (pendingType === 'fiado') {
          finalPaymentMethod = 'fiado';
        } else {
          finalPaymentMethod = 'contra_entrega';
        }
      } else {
        if (paymentMethod === 'split') {
          const cashVal = Number(String(splitCashAmount).replace(/\D/g, '')) || 0;
          const digVal = Number(String(splitDigitalAmount).replace(/\D/g, '')) || 0;
          const selDig = digitalAccountsList?.find(d => d.id === selectedDigitalAccountId || d.id === splitDigitalMethod) || digitalAccountsList?.[0];
          const digLabel = selDig?.name || 'Billetera Digital';
          finalPaymentMethod = `Pago Dividido (Efectivo: ${formatCOP(cashVal)} + ${digLabel}: ${formatCOP(digVal)})`;
          const splitNote = `[⚡ Pago Mixto: ${formatCOP(cashVal)} Efectivo + ${formatCOP(digVal)} ${digLabel}]`;
          finalDeliveryNotes = finalDeliveryNotes ? `${finalDeliveryNotes}\n${splitNote}` : splitNote;
        } else if (paymentMethod === 'efectivo') {
          if (tenderNum > 0) {
            if (tenderNum === grandTotal) {
              finalPaymentMethod = 'Efectivo (Exacto)';
            } else if (tenderNum > grandTotal) {
              const change = tenderNum - grandTotal;
              finalPaymentMethod = `Efectivo (Paga: ${formatCOP(tenderNum)} | Vueltas: ${formatCOP(change)})`;
              const cashNote = `[💵 Paga en efectivo con ${formatCOP(tenderNum)} - Llevar ${formatCOP(change)} de vueltas]`;
              finalDeliveryNotes = finalDeliveryNotes ? `${finalDeliveryNotes}\n${cashNote}` : cashNote;
            } else {
              finalPaymentMethod = `Efectivo (Abono: ${formatCOP(tenderNum)})`;
            }
          } else {
            finalPaymentMethod = 'efectivo';
          }
        }
      }

      const finalPaymentStatus = isPaid ? 'paid' : 'pending';
      const finalPaymentMethodResolved = isPaid ? finalPaymentMethod : (pendingType === 'fiado' ? 'fiado' : 'contra_entrega');

      // Vincular o crear el cliente en public.customers
      const resolvedCustomerId = await resolveOrCreateCustomer({
        brandId,
        phone: customerPhone?.trim() || '',
        name: customerName?.trim() || '',
        address: fulfillmentType === 'delivery' ? (deliveryAddress?.trim() || '') : '',
        notes: finalDeliveryNotes
      });

      const orderPayload = {
        brand_id: brandId,
        location_id: effectiveLocationId,
        customer_id: resolvedCustomerId,
        status: isAlreadyDelivered ? 'delivered' : 'preparing',
        kitchen_status: isAlreadyDelivered ? 'ready' : 'pending',
        bar_status: isAlreadyDelivered ? 'ready' : 'pending',
        delivered_at: isAlreadyDelivered ? new Date().toISOString() : null,
        origin: 'whatsapp',
        fulfillment_type: fulfillmentType,
        customer_name: customerName?.trim() || 'Cliente Mostrador / WhatsApp',
        customer_phone: customerPhone?.trim() || null,
        delivery_address: fulfillmentType === 'delivery' ? (deliveryAddress?.trim() || null) : null,
        delivery_notes: finalDeliveryNotes || null,
        delivery_fee: activeDeliveryFee,
        scheduled_time: parsedScheduledTime,
        total_amount: grandTotal,
        paid_amount: isPaid ? grandTotal : 0,
        payment_status: finalPaymentStatus,
        payment_method: finalPaymentMethodResolved
      };

      const { data: createdOrder, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Sincronizar ingreso al bolsillo correspondiente en Finanzas
      if (isPaid && grandTotal > 0) {
        if (paymentMethod === 'split') {
          const cashVal = Number(String(splitCashAmount).replace(/\D/g, '')) || 0;
          const digVal = Number(String(splitDigitalAmount).replace(/\D/g, '')) || 0;
          const selDig = digitalAccountsList?.find(d => d.id === selectedDigitalAccountId || d.id === splitDigitalMethod) || digitalAccountsList?.[0];
          const digLabel = selDig?.name || 'Billetera Digital';
          syncCollectionToFinancials({
            brandId,
            customerName: customerName?.trim() || 'Cliente WhatsApp',
            amount: grandTotal,
            paymentMethod: 'Pago Dividido',
            splitPayments: [
              { method: 'efectivo', accountId: 'acc_cash_main', amount: cashVal },
              { method: digLabel, accountId: selDig?.id || 'acc_nequi_main', amount: digVal }
            ],
            isHistorical: false,
            notes: `Venta directa #${String(createdOrder.id).slice(0, 4).toUpperCase()}`
          });
        } else {
          syncCollectionToFinancials({
            brandId,
            customerName: customerName?.trim() || 'Cliente WhatsApp',
            amount: grandTotal,
            paymentMethod: finalPaymentMethodResolved,
            isHistorical: false,
            notes: `Venta directa #${String(createdOrder.id).slice(0, 4).toUpperCase()}`
          });
        }
      }

      // Insert order items
      const itemsPayload = orderItems.map(it => ({
        order_id: createdOrder.id,
        product_id: it.product.id,
        brand_id: brandId,
        quantity: it.qty,
        unit_price: it.unitPrice,
        modifiers: {
          _item_name: it.product.name,
          ...(it.options || {})
        },
        notes: it.notes || ''
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsPayload);

      if (itemsErr) throw itemsErr;

      // Print kitchen thermal ticket if enabled
      if (!isAlreadyDelivered && printKitchenTicket) {
        try {
          const thermalPayload = {
            order: createdOrder,
            order_items: itemsPayload.map(i => ({
              ...i,
              products: { name: i.modifiers?._item_name || 'Plato' }
            })),
            restaurant_settings: restaurantSettings
          };
          printThermalDocument(thermalPayload, 'kitchen');
        } catch (printErr) {
          console.warn('Could not print thermal ticket automatically:', printErr);
        }
      }

      if (isAlreadyDelivered) {
        toast.success(`¡Pedido #${createdOrder.order_number || createdOrder.id.slice(0, 5)} registrado en ventas e inventario!`);
      } else {
        toast.success(`¡Pedido #${createdOrder.order_number || createdOrder.id.slice(0, 5)} creado y enviado a cocina!`);
      }
      if (onOrderCreated) onOrderCreated();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error creating manual order:', err);
      toast.error('Error al crear pedido: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    orderItems,
    setOrderItems,
    isSubmitting,
    configuringProduct,
    setConfiguringProduct,
    selectedModifiers,
    setSelectedModifiers,
    itemKitchenNotes,
    setItemKitchenNotes,
    editingItemIndex,
    entryFlow,
    setEntryFlow,
    isPaid,
    setIsPaid,
    pendingType,
    setPendingType,
    paymentMethod,
    setPaymentMethod,
    cashTendered,
    setCashTendered,
    printKitchenTicket,
    setPrintKitchenTicket,
    splitCashAmount,
    setSplitCashAmount,
    splitDigitalAmount,
    setSplitDigitalAmount,
    handleSelectProduct,
    addSimpleProductToCart,
    handleConfirmConfiguredProduct,
    modalDishLivePrice,
    handleEditItem,
    handleRemoveItem,
    handleUpdateItemQty,
    itemsSubtotal,
    activeDeliveryFee,
    grandTotal,
    handleCreateOrder
  };
}
