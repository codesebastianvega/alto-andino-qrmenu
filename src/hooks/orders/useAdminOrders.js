import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { useLocations } from '../../context/LocationContext';
import { useStaff } from '../useStaff';
import { usePaymentMethods } from '../usePaymentMethods';
import { useAdminModalBack } from '../useAdminModalBack';
import { printThermalDocument } from '../../utils/thermalPrint';
import soundService from '../../utils/soundService';
import { translateGroup, resolveOrderItemName } from '../../utils/formatters';

export function useAdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeSourceOrder, setMergeSourceOrder] = useState(null);
  const [mergeTargetOrder, setMergeTargetOrder] = useState(null);
  const [isMergeConfirmOpen, setIsMergeConfirmOpen] = useState(false);
  const [showCancelledHistory, setShowCancelledHistory] = useState(false);
  const [showDeliveredHistory, setShowDeliveredHistory] = useState(false);
  const [historyDetailOrder, setHistoryDetailOrder] = useState(null);
  const [mobileActiveStatus, setMobileActiveStatus] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [additionOrder, setAdditionOrder] = useState(null);
  const [incomingOrdersQueue, setIncomingOrdersQueue] = useState([]);
  const [incomingOrderIndex, setIncomingOrderIndex] = useState(0);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [isSoundLoopActive, setIsSoundLoopActive] = useState(false);
  const [isFiadosDrawerOpen, setIsFiadosDrawerOpen] = useState(false);
  const alertedOrderIdsRef = useRef(new Set());
  const initialOrdersLoadedRef = useRef(false);

  useAdminModalBack(Boolean(selectedOrder), () => setSelectedOrder(null));
  useAdminModalBack(isPOSModalOpen, () => setIsPOSModalOpen(false));
  useAdminModalBack(Boolean(additionOrder), () => setAdditionOrder(null));
  useAdminModalBack(showCancelledHistory, () => setShowCancelledHistory(false));
  useAdminModalBack(showDeliveredHistory, () => setShowDeliveredHistory(false));
  useAdminModalBack(Boolean(historyDetailOrder), () => setHistoryDetailOrder(null));
  useAdminModalBack(isManualOrderModalOpen, () => setIsManualOrderModalOpen(false));
  useAdminModalBack(isFiadosDrawerOpen, () => setIsFiadosDrawerOpen(false));

  useEffect(() => {
    const handleLoopChange = (e) => {
      setIsSoundLoopActive(Boolean(e.detail?.active));
    };
    window.addEventListener('aluna:sound-loop-changed', handleLoopChange);
    return () => window.removeEventListener('aluna:sound-loop-changed', handleLoopChange);
  }, []);

  const { activeBrand, profile } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const { activeLocationId, isAllLocations, locations } = useLocations();
  const activeBrandId = activeBrand?.id || brandFromContext?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const defaultOrderLocationId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
    ? activeLocationId
    : (locations?.find(l => l.is_main)?.id || locations?.[0]?.id || null);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.trim().toLowerCase().replace(/^#/, '');
    return orders.filter(o => {
      const idMatch = (o.id && o.id.toLowerCase().includes(q)) || 
                      (o.id && o.id.slice(-4).toLowerCase().includes(q)) ||
                      (o.id && o.id.slice(0, 4).toLowerCase().includes(q));
      const customerMatch = o.customer_name && o.customer_name.toLowerCase().includes(q);
      const phoneMatch = o.customer_phone && o.customer_phone.includes(q);
      const tableNum = String(o.restaurant_tables?.table_number || o.table_number || o.mesa || '');
      const tableMatch = (tableNum && tableNum.toLowerCase().includes(q)) ||
                         (q.startsWith('mesa') && tableNum.toLowerCase() === q.replace('mesa', '').trim());
      const addressMatch = o.delivery_address && o.delivery_address.toLowerCase().includes(q);
      const itemsMatch = o.order_items?.some(it => it.products?.name && it.products.name.toLowerCase().includes(q));
      const notesMatch = (o.notes && o.notes.toLowerCase().includes(q)) || (o.delivery_notes && o.delivery_notes.toLowerCase().includes(q));
      const paymentMatch = (o.payment_method && o.payment_method.toLowerCase().includes(q)) || (q === 'fiado' && (o.payment_method === 'fiado' || String(o.delivery_notes).toLowerCase().includes('fiado')));
      return idMatch || customerMatch || phoneMatch || tableMatch || addressMatch || itemsMatch || notesMatch || paymentMatch;
    });
  }, [orders, searchQuery]);

  const pendingFiadosList = useMemo(() => {
    return orders.filter(o => 
      o.status !== 'cancelled' && 
      (
        o.payment_status !== 'paid' || 
        o.payment_method === 'fiado' || 
        String(o.delivery_notes || '').toLowerCase().includes('fiado')
      )
    );
  }, [orders]);

  const fiadosCount = pendingFiadosList.length;

  const totalCarteraAmount = useMemo(() => {
    return pendingFiadosList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [pendingFiadosList]);

  const { staffList } = useStaff();
  const waiters = useMemo(() => staffList.filter(s => s.role === 'waiter' || s.role === 'admin'), [staffList]);

  const { paymentMethods } = usePaymentMethods(activeBrandId);
  const activeMethods = useMemo(() => paymentMethods.filter(m => m.is_active), [paymentMethods]);

  useEffect(() => {
    if (activeMethods.length > 0) {
      const currentExists = activeMethods.find(m => m.id === selectedPaymentMethod);
      if (!selectedPaymentMethod || !currentExists) {
        setSelectedPaymentMethod(activeMethods[0].id);
      }
    }
  }, [activeMethods, selectedPaymentMethod]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!activeBrandId) return;
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('brand_id', activeBrandId)
        .order('location_id', { ascending: true, nullsFirst: true })
        .limit(1)
        .maybeSingle();
      if (!error && data) setRestaurantSettings(data);
    };
    fetchSettings();
  }, [activeBrandId]);

  const assignWaiter = async (orderId, waiterId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ waiter_id: waiterId || null })
        .eq('id', orderId);
      if (error) throw error;
      toast('Mesero asignado', { icon: '🧑‍🍳' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, waiter_id: waiterId || null } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, waiter_id: waiterId || null }));
      }
    } catch {
      toast.error('Error al asignar');
    }
  };

  const getFilterDate = useCallback(() => {
    if (dateRange === 'all') return null;
    const now = new Date();
    const offsetMs = 5 * 60 * 60 * 1000;
    
    if (dateRange === 'today') {
      const localMs = now.getTime() - offsetMs;
      const localDate = new Date(localMs);
      const startLocal = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), 0, 0, 0, 0);
      return new Date(startLocal.getTime() + offsetMs).toISOString();
    }
    
    const days = dateRange === '7d' ? 7 : 30;
    const date = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const startOfRange = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    return new Date(startOfRange.getTime() + offsetMs).toISOString();
  }, [dateRange]);

  const fetchOrders = useCallback(async () => {
    if (!activeBrandId) {
      setLoading(false);
      return;
    }
    
    const filterDate = getFilterDate();
    try {
      setLoading(true);

      let query = supabase
        .from('orders')
        .select(`
          *,
          locations ( name ),
          restaurant_tables ( id, table_number ),
          order_items (
            id, quantity, unit_price, modifiers, notes, is_paid,
            products ( id, name, category_id )
          ),
          order_payments (*)
        `);

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      if (filterDate) {
        query = query.or(`created_at.gte.${filterDate},status.not.in.(delivered,cancelled)`);
      }

      if (!isAllLocations && activeLocationId) {
        query = query.or(`location_id.eq.${activeLocationId},location_id.is.null`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      const fetched = data || [];

      if (!initialOrdersLoadedRef.current) {
        // Primera carga: registrar los IDs ya existentes para no disparar alarma sobre pedidos viejos,
        // EXCEPTO si hay un pedido en estado 'new' creado hace menos de 10 minutos que aún nadie ha aceptado.
        initialOrdersLoadedRef.current = true;
        const tenMinsAgo = Date.now() - 10 * 60 * 1000;
        const unacceptedRecentNew = [];
        fetched.forEach(o => {
          const createdMs = new Date(o.created_at).getTime();
          if (o.status === 'new' && createdMs >= tenMinsAgo) {
            unacceptedRecentNew.push(o);
          } else {
            alertedOrderIdsRef.current.add(o.id);
          }
        });
        if (unacceptedRecentNew.length > 0) {
          unacceptedRecentNew.forEach(o => alertedOrderIdsRef.current.add(o.id));
          setIncomingOrdersQueue(prev => {
            const existingIds = new Set(prev.map(x => x.id));
            const toAdd = unacceptedRecentNew.filter(x => !existingIds.has(x.id));
            return [...prev, ...toAdd];
          });
          setIsAlertModalOpen(true);
          soundService.startNewOrderLoop(3500);
          setIsSoundLoopActive(true);
        }
      } else {
        // Cargas subsecuentes o Polling de respaldo: detectar cualquier pedido 'new' que Realtime no haya avisado
        const newlyArrived = fetched.filter(o => o.status === 'new' && !alertedOrderIdsRef.current.has(o.id));
        fetched.forEach(o => alertedOrderIdsRef.current.add(o.id));
        if (newlyArrived.length > 0) {
          soundService.startNewOrderLoop(3500);
          setIsSoundLoopActive(true);
          setIncomingOrdersQueue(prev => {
            const existingIds = new Set(prev.map(x => x.id));
            const toAdd = newlyArrived.filter(x => !existingIds.has(x.id));
            return [...prev, ...toAdd];
          });
          setIsAlertModalOpen(true);
          toast(`🔔 ¡Nuevo pedido #${newlyArrived[0].id.slice(0, 4).toUpperCase()} recibido!`, { icon: '🔔' });
        }
      }

      setOrders(fetched);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId, isAllLocations, activeLocationId, getFilterDate]);

  useEffect(() => {
    if (!activeBrandId) {
      setLoading(false);
      return;
    }

    fetchOrders();

    const channelName = `admin-orders-${activeBrandId}-${isAllLocations ? 'all' : activeLocationId}`;
    const orderFilter = `brand_id=eq.${activeBrandId}`;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: orderFilter
      }, (payload) => {
        if (!isAllLocations && activeLocationId && payload.new.location_id && payload.new.location_id !== activeLocationId) return;

        alertedOrderIdsRef.current.add(payload.new.id);
        setOrders(prev => {
          if (prev.some(o => o.id === payload.new.id)) return prev;
          return [payload.new, ...prev];
        });

        if (payload.new.status === 'new') {
          soundService.startNewOrderLoop(3500);
          setIsSoundLoopActive(true);

          // Abrir el modal de inmediato con los datos preliminares y enriquecerlo apenas carguen los items
          setIncomingOrdersQueue(prev => {
            const exists = prev.some(o => o.id === payload.new.id);
            return exists ? prev : [...prev, payload.new];
          });
          setIsAlertModalOpen(true);

          setTimeout(async () => {
            try {
              const { data: fullOrder } = await supabase
                .from('orders')
                .select(`
                  *,
                  locations ( name ),
                  restaurant_tables ( id, table_number ),
                  order_items (
                    id, quantity, unit_price, modifiers, notes, is_paid,
                    products ( id, name, category_id )
                  ),
                  order_payments (*)
                `)
                .eq('id', payload.new.id)
                .single();

              if (fullOrder) {
                setIncomingOrdersQueue(prev => {
                  const exists = prev.some(o => o.id === fullOrder.id);
                  if (exists) {
                    return prev.map(o => o.id === fullOrder.id ? fullOrder : o);
                  }
                  return [...prev, fullOrder];
                });
                setIsAlertModalOpen(true);
              }
            } catch (err) {
              console.error('Error cargando detalles del nuevo pedido:', err);
            }
          }, 800);
        } else {
          soundService.playNewOrder();
        }

        toast('¡Nuevo pedido recibido!', { icon: '🔔' });
        fetchOrders();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: orderFilter
      }, (payload) => {
        if (!isAllLocations && activeLocationId && payload.new.location_id && payload.new.location_id !== activeLocationId) {
          setOrders(prev => prev.filter(o => o.id !== payload.new.id));
          return;
        }

        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        if (selectedOrder?.id === payload.new.id) {
          setSelectedOrder(prev => ({ ...prev, ...payload.new }));
        }

        if (payload.new.status && payload.new.status !== 'new') {
          setIncomingOrdersQueue(prev => {
            const remaining = prev.filter(o => o.id !== payload.new.id);
            if (remaining.length === 0) {
              setIsAlertModalOpen(false);
              soundService.stopNewOrderLoop();
              setIsSoundLoopActive(false);
            }
            return remaining;
          });
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'order_items',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => {
        fetchOrders();
      })
      .subscribe();

    // Polling automático de respaldo cada 12 segundos + al volver a la pestaña (por si el WebSocket se desconecta o suspende)
    const pollInterval = setInterval(() => {
      fetchOrders();
    }, 12000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        soundService.unlockAudio();
        fetchOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
      supabase.removeChannel(channel);
    };
  }, [activeBrandId, fetchOrders, activeLocationId, isAllLocations]);

  useEffect(() => {
    if (selectedOrder) {
      const latest = orders.find(o => o.id === selectedOrder.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(latest);
      }
    }
  }, [orders, selectedOrder?.id]);

  const updateOrderStatus = async (orderId, newStatus, extraPayload = {}) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (newStatus === 'preparing' && restaurantSettings?.payment_requirement_stage === 'pre_preparation' && order.payment_status !== 'paid') {
        toast.error('⚠️ Se requiere el pago total para enviar a cocina');
        return;
      }
      
      if (newStatus === 'delivered' && restaurantSettings?.payment_requirement_stage === 'pre_delivery' && order.payment_status !== 'paid') {
        toast.error('⚠️ El pedido debe estar pagado para marcar como entregado');
        return;
      }

      setUpdatingStatus(orderId);
      const payload = { status: newStatus, ...extraPayload };
      if (newStatus === 'ready') payload.ready_at = new Date().toISOString();
      if (newStatus === 'delivered') payload.delivered_at = new Date().toISOString();
      if (newStatus === 'cancelled') payload.cancelled_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId);

      if (error) throw error;
      toast('Estado actualizado');
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...payload }));
      }
      
      if (newStatus === 'delivered' || newStatus === 'cancelled') setSelectedOrder(null);
    } catch (err) {
      console.error('Error actualizando pedido', err);
      toast('Error al actualizar');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAcceptIncomingOrder = async (orderId) => {
    soundService.stopNewOrderLoop();
    setIsSoundLoopActive(false);

    const currentOrder = orders.find(o => o.id === orderId);
    if (currentOrder && ['preparing', 'ready', 'delivered'].includes(currentOrder.status)) {
      toast(`El pedido #${orderId.slice(-4).toUpperCase()} ya está en estado ${currentOrder.status === 'ready' ? 'Listo' : currentOrder.status === 'delivered' ? 'Entregado' : 'Preparación'}`);
      setIncomingOrdersQueue(prev => {
        const remaining = prev.filter(o => o.id !== orderId);
        if (remaining.length === 0) {
          setIsAlertModalOpen(false);
          setIncomingOrderIndex(0);
        }
        return remaining;
      });
      return;
    }

    await updateOrderStatus(orderId, 'preparing');

    if (restaurantSettings?.auto_print_orders) {
      try {
        const orderToPrint = orders.find(o => o.id === orderId) || incomingOrdersQueue.find(o => o.id === orderId);
        if (orderToPrint) {
          printThermalDocument({
            type: 'comanda',
            order: orderToPrint,
            brand: activeBrand,
            settings: restaurantSettings
          });
        }
      } catch (printErr) {
        console.warn('Auto print failed:', printErr);
      }
    }

    setIncomingOrdersQueue(prev => {
      const remaining = prev.filter(o => o.id !== orderId);
      if (remaining.length === 0) {
        setIsAlertModalOpen(false);
        setIncomingOrderIndex(0);
      } else if (incomingOrderIndex >= remaining.length) {
        setIncomingOrderIndex(remaining.length - 1);
      }
      return remaining;
    });

    toast('¡Pedido aceptado y enviado a cocina! 🍳', { icon: '✅' });
  };

  const handleReviewIncomingOrder = (order) => {
    soundService.stopNewOrderLoop();
    setIsSoundLoopActive(false);
    setIsAlertModalOpen(false);
    setSelectedOrder(order);
  };

  const sendCancellationApologyWhatsApp = (targetOrder, reasonText) => {
    if (!targetOrder?.customer_phone) return;
    const rawDigits = String(targetOrder.customer_phone).replace(/\D/g, '');
    if (!rawDigits) return;
    const cleanPhone = rawDigits.startsWith('57') ? rawDigits : `57${rawDigits}`;
    const cleanName = (targetOrder.customer_name || 'Cliente').replace(/\s*\[Dir:.*$/i, '').trim();
    const shortNum = `#${targetOrder.id.slice(0, 4).toUpperCase()}`;
    const brandSlug = activeBrand?.slug || brandFromContext?.slug || 'boku-bento';
    const brandName = activeBrand?.name || brandFromContext?.name || 'Boku Bento';
    const recoveryUrl = `${window.location.origin}/${brandSlug}/?src=recuperacion`;
    const msg = `Hola ${cleanName} 🙏, te escribimos de *${brandName}* respecto a tu pedido *${shortNum}*.\n\nLamentablemente tuvimos que cancelarlo por el siguiente motivo: *${reasonText || targetOrder.cancellation_reason || 'Inconveniente en cocina'}*.\n\nTe pedimos mil disculpas por la molestia 😔. Para compensarte, te habilitamos el cupón *DISCULPABOKU* con un *15% DE DESCUENTO* para que elijas otro plato hoy o en tu próxima compra entrando aquí:\n👉 ${recoveryUrl}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCancelIncomingOrder = async (orderId, reason) => {
    soundService.stopNewOrderLoop();
    setIsSoundLoopActive(false);
    const targetOrder = orders.find(o => o.id === orderId) || incomingOrdersQueue.find(o => o.id === orderId);
    await updateOrderStatus(orderId, 'cancelled', {
      cancelled_by: 'restaurant',
      cancellation_reason: reason
    });
    setIncomingOrdersQueue(prev => {
      const remaining = prev.filter(o => o.id !== orderId);
      if (remaining.length === 0) {
        setIsAlertModalOpen(false);
        setIncomingOrderIndex(0);
      } else if (incomingOrderIndex >= remaining.length) {
        setIncomingOrderIndex(remaining.length - 1);
      }
      return remaining;
    });
    toast('Pedido cancelado', { icon: '❌' });
    if (targetOrder?.customer_phone && window.confirm('¿Deseas avisar al cliente por WhatsApp con el motivo y enviarle el cupón de disculpas DISCULPABOKU (15% OFF)?')) {
      sendCancellationApologyWhatsApp(targetOrder, reason);
    }
  };

  const applyDiscount = async (orderId, discountArg) => {
    try {
      setUpdatingStatus(orderId);
      const targetOrder = orders.find(o => o.id === orderId) || selectedOrder;
      const itemsTotal = (targetOrder?.order_items || []).reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unit_price) || 0)), 0);
      const deliveryFee = Number(targetOrder?.delivery_fee || 0);
      const serviceFee = Number(targetOrder?.service_fee || 0);
      const baseSubtotal = itemsTotal + deliveryFee + serviceFee;

      let discountAmount = 0;
      let discountReason = '';

      if (typeof discountArg === 'number') {
        const pct = discountArg;
        discountAmount = Math.round(itemsTotal * (pct / 100));
        discountReason = pct === 100 ? 'Amigo VIP (100%)' : `Descuento ${pct}%`;
      } else if (typeof discountArg === 'object' && discountArg !== null) {
        const { percentage, amount, fixedTotal, reason } = discountArg;
        if (fixedTotal !== undefined && fixedTotal !== null && fixedTotal !== '') {
          const targetTotal = Math.max(0, Number(fixedTotal));
          discountAmount = Math.max(0, baseSubtotal - targetTotal);
          discountReason = reason?.trim() || `Total acordado: ${targetTotal.toLocaleString('es-CO')}`;
        } else if (amount !== undefined && amount !== null && amount !== '') {
          discountAmount = Math.min(baseSubtotal, Math.max(0, Number(amount)));
          discountReason = reason?.trim() || `Cortesía -${discountAmount.toLocaleString('es-CO')}`;
        } else if (percentage !== undefined && percentage !== null) {
          const pct = Number(percentage);
          discountAmount = Math.round(itemsTotal * (pct / 100));
          discountReason = reason?.trim() || (pct === 100 ? 'Amigo VIP (100%)' : `Descuento ${pct}%`);
        }
      }

      const newTotal = Math.max(0, baseSubtotal - discountAmount);

      const { error } = await supabase
        .from('orders')
        .update({ 
          discount_amount: discountAmount,
          discount_reason: discountAmount > 0 ? (discountReason || 'Descuento') : null,
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(discountAmount > 0 ? `Descuento aplicado: -${discountAmount.toLocaleString('es-CO')}` : 'Descuento removido');
      
      const updates = { 
        discount_amount: discountAmount, 
        total_amount: newTotal, 
        discount_reason: discountAmount > 0 ? (discountReason || 'Descuento') : null 
      };
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      setSelectedOrder(prev => (prev?.id === orderId ? { ...prev, ...updates } : prev));
      fetchOrders();
    } catch (err) {
      console.error("Error al aplicar descuento:", err);
      toast.error('Error al aplicar descuento');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateDeliveryFee = async (orderId, newFee) => {
    try {
      setUpdatingStatus(orderId);
      const targetOrder = orders.find(o => o.id === orderId) || selectedOrder;
      const itemsTotal = (targetOrder?.order_items || []).reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unit_price) || 0)), 0);
      const serviceFee = Number(targetOrder?.service_fee || 0);
      const discount = Number(targetOrder?.discount_amount || 0);
      const fee = Math.max(0, Number(newFee || 0));
      const newTotal = Math.max(0, itemsTotal + fee + serviceFee - discount);

      const { error } = await supabase
        .from('orders')
        .update({
          delivery_fee: fee,
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(fee === 0 ? '🛵 Domicilio exonerado ($0)' : `🛵 Domicilio ajustado a ${fee.toLocaleString('es-CO')}`);
      
      const updates = { delivery_fee: fee, total_amount: newTotal };
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      setSelectedOrder(prev => (prev?.id === orderId ? { ...prev, ...updates } : prev));
      fetchOrders();
    } catch (err) {
      console.error("Error al actualizar domicilio:", err);
      toast.error('Error al actualizar costo de domicilio');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const cancelOrder = (orderId) => {
    if (!cancellationReason.trim()) {
      toast.error("Por favor ingresa un motivo");
      return;
    }
    const targetOrder = orders.find(o => o.id === orderId) || selectedOrder;
    const reasonText = cancellationReason.trim();
    updateOrderStatus(orderId, 'cancelled', { cancelled_by: 'restaurant', cancellation_reason: reasonText });
    setIsCancelling(false);
    setCancellationReason("");
    if (targetOrder?.customer_phone && window.confirm('¿Deseas avisar al cliente por WhatsApp con el motivo y enviarle el cupón de disculpas DISCULPABOKU (15% OFF)?')) {
      sendCancellationApologyWhatsApp(targetOrder, reasonText);
    }
  };

  const handleMergeOrders = async (sourceOrder, targetOrder) => {
    if (sourceOrder.id === targetOrder.id) {
      toast.error("No puedes fusionar un pedido consigo mismo");
      return;
    }

    try {
      setLoading(true);
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ order_id: targetOrder.id })
        .eq('order_id', sourceOrder.id);

      if (itemsError) throw itemsError;

      // Consolidar ítems recalculando con precisión sin duplicar cobro de domicilio
      const { data: allTargetItems } = await supabase
        .from('order_items')
        .select('quantity, unit_price')
        .eq('order_id', targetOrder.id);

      const itemsSubtotal = (allTargetItems || []).reduce(
        (sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unit_price) || 0)), 
        0
      );

      // El domicilio no se cobra dos veces por un mismo envío consolidado
      const finalDeliveryFee = Math.max(Number(targetOrder.delivery_fee || 0), Number(sourceOrder.delivery_fee || 0));
      const newServiceFee = Number(targetOrder.service_fee || 0) + Number(sourceOrder.service_fee || 0);
      const newPaidAmount = Number(targetOrder.paid_amount || 0) + Number(sourceOrder.paid_amount || 0);
      const newDiscountAmount = Number(targetOrder.discount_amount || 0) + Number(sourceOrder.discount_amount || 0);
      const newTotal = Math.max(0, itemsSubtotal + finalDeliveryFee + newServiceFee - newDiscountAmount);

      // Si el método de pago tenía un monto anterior estático en efectivo, actualizarlo de forma limpia
      let updatedPaymentMethod = targetOrder.payment_method;
      if (updatedPaymentMethod && /pago exacto/i.test(updatedPaymentMethod)) {
        updatedPaymentMethod = `Efectivo (Pago exacto: ${newTotal.toLocaleString('es-CO')})`;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
          delivery_fee: finalDeliveryFee,
          service_fee: newServiceFee,
          paid_amount: newPaidAmount,
          discount_amount: newDiscountAmount,
          payment_method: updatedPaymentMethod,
          status: (targetOrder.status === 'ready' || targetOrder.status === 'delivered') ? 'new' : targetOrder.status
        })
        .eq('id', targetOrder.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', sourceOrder.id);

      if (deleteError) throw deleteError;

      toast.success("Pedidos consolidados con éxito ✨");
      setIsMergeConfirmOpen(false);
      setMergeSourceOrder(null);
      setMergeTargetOrder(null);
      fetchOrders();
    } catch (err) {
      console.error('Error merging orders:', err);
      toast.error("Error al consolidar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result) => {
    const { source, destination, combine, draggableId } = result;

    if (combine) {
      const sourceOrder = orders.find(o => o.id === draggableId);
      const targetOrder = orders.find(o => o.id === combine.draggableId);
      if (sourceOrder && targetOrder) {
        setMergeSourceOrder(sourceOrder);
        setMergeTargetOrder(targetOrder);
        setIsMergeConfirmOpen(true);
      }
      return;
    }

    if (!destination) return;
    if (source.droppableId !== destination.droppableId) {
      const orderId = draggableId;
      let newStatus = destination.droppableId;
      const order = orders.find(o => o.id === orderId);

      if (newStatus === 'cancelled') {
        if (order) {
          setSelectedOrder(order);
          setIsCancelling(true);
          toast("Ingresa el motivo de cancelación para continuar", { icon: '📝' });
        }
        return;
      }

      if (newStatus === 'on_table' && order) {
        if (order.fulfillment_type === 'delivery' || order.fulfillment_type === 'takeaway') {
          newStatus = 'on_the_way';
        }
      }

      updateOrderStatus(orderId, newStatus);
    }
  };

  const handleSettleFiadoOrder = async (orderId, paymentMethod = 'efectivo') => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      const cleanNotes = (targetOrder?.delivery_notes || '').replace(/\[\s*🤝?\s*FIADO[^\]]*\]/gi, '').trim();

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: paymentMethod,
          paid_amount: targetOrder?.total_amount || 0,
          delivery_notes: cleanNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`🤝 Pago registrado vía ${paymentMethod.toUpperCase()}`);
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        payment_status: 'paid',
        payment_method: paymentMethod,
        paid_amount: o.total_amount,
        delivery_notes: cleanNotes || null
      } : o));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          payment_status: 'paid',
          payment_method: paymentMethod,
          paid_amount: prev.total_amount,
          delivery_notes: cleanNotes || null
        }));
      }
    } catch (err) {
      console.error('Error al liquidar fiado:', err);
      toast.error('Error al registrar cobro: ' + err.message);
    }
  };

  const handleSendWhatsAppCobro = (order) => {
    const phone = (order.customer_phone || '').replace(/\D/g, '');
    if (!phone) {
      toast.error('Este pedido no tiene teléfono registrado.');
      return;
    }
    const cleanName = (order.customer_name || '').replace(/\[.*?\]/gi, '').trim().split(' ')[0] || 'Hola';
    const amountStr = `$${Number(order.total_amount || 0).toLocaleString()}`;
    const orderRef = `#${order.id.slice(-4).toUpperCase()}`;

    const message = `Hola ${cleanName}! 👋 Te saludamos con mucho cariño de ${activeBrand?.name || 'Boku Bento'}.

Te recordamos cordialmente tu saldo pendiente de ${amountStr} de tu pedido ${orderRef}.

Puedes realizar tu pago en efectivo en tu próxima visita o transferirnos por:
🟣 Nequi / Bre-B
🔴 Daviplata
🟡 Bancolombia

¡Muchísimas gracias por tu apoyo y preferencia siempre! 🍱🤝`;

    const url = `https://wa.me/57${phone.slice(-10)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareToWhatsApp = (order, type) => {
    const rawPhone = order.customer_phone?.replace(/\D/g, '');
    if (!rawPhone) {
      toast.error('No hay teléfono registrado');
      return;
    }
    const phone = rawPhone.startsWith('57') ? rawPhone : `57${rawPhone}`;
    const orderNum = `#${order.id.slice(0, 4).toUpperCase()}`;
    const brand = activeBrand?.name || 'Boku Bento';
    const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/#order-status?orderId=${order.id}` : '';

    let message = '';
    if (type === 'summary') {
      message = `*Resumen de tu pedido ${orderNum} en ${brand}*\n\n`;
      (order.order_items || []).forEach(item => {
        message += `• *${item.quantity}x ${resolveOrderItemName(item)}* - ${(item.quantity * item.unit_price).toLocaleString()}\n`;
        if (item.modifiers && Object.keys(item.modifiers).length > 0) {
          const mods = Object.entries(item.modifiers)
            .filter(([k]) => !k.startsWith('_'))
            .map(([k, v]) => `   ↳ _${translateGroup(k)}:_ ${Array.isArray(v) ? v.join(', ') : (typeof v === 'object' && v ? (v.name || JSON.stringify(v)) : v)}`)
            .join('\n');
          message += `${mods}\n`;
        }
        if (item.notes) {
          message += `   ↳ 📝 _Nota:_ ${item.notes}\n`;
        }
      });
      if (order.service_fee > 0) {
        message += `\n*Servicio: $${order.service_fee.toLocaleString()}*`;
      }
      message += `\n*Total: $${Number(order.total_amount || 0).toLocaleString()}*`;
      if (trackingUrl) {
        message += `\n\nSeguimiento en vivo:\n${trackingUrl}`;
      }
    } else if (type === 'status') {
      let statusText = '';
      if (order.status === 'preparing') {
        statusText = `🍳 *¡Tu pedido ya está en preparación en cocina!* Estamos alistando tus platos con los ingredientes más frescos.`;
      } else if (order.status === 'on_table') {
        statusText = order.fulfillment_type === 'delivery'
          ? `🛵 *¡Tu pedido ya va en camino hacia tu dirección!* El repartidor va hacia ti.`
          : `🍽️ *¡Tu pedido va camino a tu mesa!*`;
      } else if (order.status === 'ready') {
        statusText = `🎉 *¡Tu pedido ya está listo!* ${order.fulfillment_type === 'takeaway' ? 'Ya puedes pasar a recogerlo al mostrador.' : 'En instantes te lo entregamos.'}`;
      } else if (order.status === 'delivered') {
        statusText = `✅ *¡Tu pedido ha sido entregado con éxito!* ¡Esperamos que lo disfrutes mucho!`;
      } else {
        statusText = `Confirmamos que recibimos tu pedido con éxito.`;
      }

      message = `¡Hola ${order.customer_name || ''}! 👋 Te saludamos de *${brand}*.\n\n${statusText}\n\nPuedes consultar el seguimiento en tiempo real aquí:\n${trackingUrl}`;
    } else {
      message = `¡Hola ${order.customer_name || ''}! 👋\n\nTu pedido ${orderNum} de ${brand} está listo. 🍽️\n\n${order.fulfillment_type === 'takeaway' ? 'Ya puedes pasar por él.' : 'Te lo llevaremos en un momento.'}\n\nSeguimiento en vivo:\n${trackingUrl}`;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return {
    orders,
    setOrders,
    loading,
    dateRange,
    setDateRange,
    selectedOrder,
    setSelectedOrder,
    updatingStatus,
    isCancelling,
    setIsCancelling,
    cancellationReason,
    setCancellationReason,
    selectedPaymentMethod,
    restaurantSettings,
    isPOSModalOpen,
    setIsPOSModalOpen,
    isMerging,
    setIsMerging,
    mergeSourceOrder,
    setMergeSourceOrder,
    mergeTargetOrder,
    setMergeTargetOrder,
    isMergeConfirmOpen,
    setIsMergeConfirmOpen,
    showCancelledHistory,
    setShowCancelledHistory,
    showDeliveredHistory,
    setShowDeliveredHistory,
    historyDetailOrder,
    setHistoryDetailOrder,
    mobileActiveStatus,
    setMobileActiveStatus,
    searchQuery,
    setSearchQuery,
    additionOrder,
    setAdditionOrder,
    incomingOrdersQueue,
    incomingOrderIndex,
    isAlertModalOpen,
    setIsAlertModalOpen,
    isManualOrderModalOpen,
    setIsManualOrderModalOpen,
    isSoundLoopActive,
    setIsSoundLoopActive,
    isFiadosDrawerOpen,
    setIsFiadosDrawerOpen,
    activeBrand,
    activeLocationId,
    defaultOrderLocationId,
    filteredOrders,
    pendingFiadosList,
    fiadosCount,
    totalCarteraAmount,
    waiters,
    fetchOrders,
    updateOrderStatus,
    assignWaiter,
    applyDiscount,
    updateDeliveryFee,
    cancelOrder,
    handleMergeOrders,
    onDragEnd,
    handleAcceptIncomingOrder,
    handleReviewIncomingOrder,
    handleCancelIncomingOrder,
    handleSettleFiadoOrder,
    handleSendWhatsAppCobro,
    shareToWhatsApp,
    sendCancellationApologyWhatsApp
  };
}

export default useAdminOrders;
