import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../context/LocationContext';
import { useStaff } from '../hooks/useStaff';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentPOSModal from '../components/admin/PaymentPOSModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';
import { Modal } from '../components/admin/ui';

const ORDER_STATUSES = [
  { id: 'new', label: 'Nuevos', color: 'text-blue-600', icon: 'heroicons:star' },
  { id: 'preparing', label: 'En Cocina', color: 'text-yellow-600', icon: 'heroicons:fire' },
  { id: 'ready', label: 'Listos', color: 'text-green-600', icon: 'heroicons:check-badge' },
];

const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5); // A4

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
        console.error('Audio play failed', e);
    }
};

const DailyStats = ({ orders, range, onCancelledClick, onDeliveredClick }) => {
  const rangeLabels = {
    today: 'Hoy',
    '7d': '7 Días',
    '30d': '30 Días',
    all: 'Total Histórico'
  };

  const delivered = orders.filter(o => o.status === 'delivered');
  const revenue = delivered.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const cancelled = orders.filter(o => o.status === 'cancelled');
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-transform active:scale-95 cursor-default">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Ventas {rangeLabels[range]}</p>
        <p className="text-2xl font-black text-[#2f4131]">${revenue.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-transform active:scale-95 cursor-default">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pedidos {rangeLabels[range]}</p>
        <p className="text-2xl font-black text-gray-800">{orders.length}</p>
      </div>
      <button 
        onClick={onDeliveredClick}
        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95 hover:bg-emerald-50 hover:border-emerald-100 group text-left w-full relative overflow-hidden"
      >
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-emerald-600 transition-colors">Entregados</p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black text-emerald-600">{delivered.length}</p>
          <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            VER TODO
          </span>
        </div>
      </button>

      <button 
        onClick={onCancelledClick}
        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95 hover:bg-red-50 hover:border-red-100 group text-left w-full relative overflow-hidden"
      >
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-red-600 transition-colors">Cancelados</p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black text-red-600">{cancelled.length}</p>
          <span className="text-[9px] font-black bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all">
            VER TODO
          </span>
        </div>
      </button>
    </div>
  );
};

// Función para calcular colores del semáforo:
function getTimerColor(createdAt) {
  const diffMinutes = Math.floor((new Date() - new Date(createdAt)) / 60000);
  if (diffMinutes >= 20) return 'bg-red-500 text-white'; // Peligro (+20 min)
  if (diffMinutes >= 10) return 'bg-yellow-500 text-white'; // Advertencia (10-20 min)
  return 'bg-emerald-500 text-white'; // Normal (0-10 min)
}

function OrderTimer({ createdAt, status }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    if (status === 'delivered' || status === 'cancelled') return;
    
    const updateTimer = () => {
      setMins(Math.floor((new Date() - new Date(createdAt)) / 60000));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (status === 'delivered' || status === 'cancelled') return null;

  const colorClass = getTimerColor(createdAt);
  
  return (
    <div className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm ${colorClass}`}>
      <Icon icon="heroicons:clock" className="text-[14px]" />
      {mins} min
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today'); // Default: Today
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // Para marcar como pagado
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeSourceOrder, setMergeSourceOrder] = useState(null);
  const [mergeTargetOrder, setMergeTargetOrder] = useState(null);
  const [isMergeConfirmOpen, setIsMergeConfirmOpen] = useState(false);
  const [showCancelledHistory, setShowCancelledHistory] = useState(false);
  const [showDeliveredHistory, setShowDeliveredHistory] = useState(false);

  const getFulfillmentStyle = (type) => {
    switch (type) {
      case 'dine_in': return { icon: 'heroicons:building-storefront', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', text: 'Mesa' };
      case 'takeaway': return { icon: 'heroicons:shopping-bag', color: 'text-amber-600 bg-amber-50 border-amber-100', text: 'Llevar' };
      case 'delivery': return { icon: 'material-symbols:motorcycle', color: 'text-blue-600 bg-blue-50 border-blue-100', text: 'Domicilio' };
      default: return { icon: 'heroicons:truck', color: 'text-gray-600 bg-gray-50 border-gray-100', text: 'Pedido' };
    }
  };

  const { activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocations();
  const activeBrandId = activeBrand?.id;

  // REINSTATED: Missing logic for staff, payments and settings
  const { staffList } = useStaff();
  const waiters = useMemo(() => staffList.filter(s => s.role === 'waiter' || s.role === 'admin'), [staffList]);

  const { paymentMethods, loading: loadingPayments } = usePaymentMethods(activeBrandId);
  const activeMethods = useMemo(() => paymentMethods.filter(m => m.is_active), [paymentMethods]);

  // Set default payment method when methods are loaded
  useEffect(() => {
    if (activeMethods.length > 0) {
      const currentExists = activeMethods.find(m => m.id === selectedPaymentMethod);
      if (!selectedPaymentMethod || !currentExists) {
        setSelectedPaymentMethod(activeMethods[0].id);
      }
    }
  }, [activeMethods, selectedPaymentMethod]);

  // Fetch Restaurant Settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!activeBrandId) return;
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('brand_id', activeBrandId)
        .single();
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
    } catch (err) {
      toast.error('Error al asignar');
    }
  };

  // Helper for date filtering (Colombia UTC-5)
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
        query = query.gte('created_at', filterDate);
      }

      if (!isAllLocations && activeLocationId) {
        query = query.eq('location_id', activeLocationId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId, isAllLocations, activeLocationId, getFilterDate, dateRange]);

  useEffect(() => {
    // Safety: don't subscribe if missing identifiers
    if (!activeBrandId || (!isAllLocations && !activeLocationId)) {
      setLoading(false);
      return;
    }

    // Initial load
    fetchOrders();

    const channelName = `admin-orders-${activeBrandId}-${isAllLocations ? 'all' : activeLocationId}`;
    const orderFilter = isAllLocations ? `brand_id=eq.${activeBrandId}` : `location_id=eq.${activeLocationId}`;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: orderFilter
      }, (payload) => {
        // Double check location client-side (extra safety)
        if (!isAllLocations && activeLocationId && payload.new.location_id !== activeLocationId) return;

        setOrders(prev => [payload.new, ...prev]);
        playNotificationSound();
        toast('Nuevo pedido recibido!', { icon: '🔔' });
        fetchOrders(); // Full fetch to get associations
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: orderFilter
      }, (payload) => {
        // Filter by location client-side if needed
        if (!isAllLocations && activeLocationId && payload.new.location_id !== activeLocationId) {
          setOrders(prev => prev.filter(o => o.id !== payload.new.id));
          return;
        }

        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        if (selectedOrder?.id === payload.new.id) {
            setSelectedOrder(prev => ({ ...prev, ...payload.new }));
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBrandId, fetchOrders, activeLocationId, isAllLocations, selectedOrder?.id]); 

  // NEW: Sync selectedOrder with the latest data from the orders list
  useEffect(() => {
    if (selectedOrder) {
      const latest = orders.find(o => o.id === selectedOrder.id);
      // Only update if there are changes to avoid unnecessary re-renders
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(latest);
      }
    }
  }, [orders, selectedOrder?.id]);

  const updateOrderStatus = async (orderId, newStatus, extraPayload = {}) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Bloqueo de seguridad: Validar requerimientos de pago según configuración
      // Esto protege tanto los clics en botones como el Drag & Drop del Kanban
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

  const applyDiscount = async (orderId, percentage) => {
    try {
      setUpdatingStatus(orderId);
      
      // Calculate based on items total (before service fee or with current total?)
      // Usually discount applies to the food.
      const itemsTotal = selectedOrder.order_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const discountAmount = Math.round(itemsTotal * (percentage / 100));
      const newTotal = Math.max(0, (itemsTotal + (Number(selectedOrder.service_fee) || 0)) - discountAmount);

      const { error } = await supabase
        .from('orders')
        .update({ 
          discount_amount: discountAmount,
          discount_reason: percentage === 100 ? 'Amigo VIP' : `Descuento ${percentage}%`,
          total_amount: newTotal 
        })
        .eq('id', orderId);

      if (error) throw error;
      toast('Descuento aplicado ✨');
      
      const updates = { discount_amount: discountAmount, total_amount: newTotal, discount_reason: percentage === 100 ? 'Amigo VIP' : `Descuento ${percentage}%` };
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      setSelectedOrder(prev => ({ ...prev, ...updates }));
    } catch (err) {
      toast.error('Error al aplicar descuento');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const cancelOrder = (orderId) => {
    if (!cancellationReason.trim()) {
      toast.error("Por favor ingresa un motivo");
      return;
    }
    updateOrderStatus(orderId, 'cancelled', { cancelled_by: 'restaurant', cancellation_reason: cancellationReason });
    setIsCancelling(false);
    setCancellationReason("");
  };

  const handleMergeOrders = async (sourceOrder, targetOrder) => {
    if (sourceOrder.id === targetOrder.id) {
      toast.error("No puedes fusionar un pedido consigo mismo");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Move items from source to target
      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ order_id: targetOrder.id })
        .eq('order_id', sourceOrder.id);

      if (itemsError) throw itemsError;

      // 2. Update target order totals
      const newTotal = Number(targetOrder.total_amount || 0) + Number(sourceOrder.total_amount || 0);
      const newServiceFee = Number(targetOrder.service_fee || 0) + Number(sourceOrder.service_fee || 0);
      const newPaidAmount = Number(targetOrder.paid_amount || 0) + Number(sourceOrder.paid_amount || 0);
      const newDiscountAmount = Number(targetOrder.discount_amount || 0) + Number(sourceOrder.discount_amount || 0);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
          service_fee: newServiceFee,
          paid_amount: newPaidAmount,
          discount_amount: newDiscountAmount,
          // If the target was ready/delivered but we added items, reset to 'new' 
          // so the kitchen gets notified of the additions.
          status: (targetOrder.status === 'ready' || targetOrder.status === 'delivered') ? 'new' : targetOrder.status
        })
        .eq('id', targetOrder.id);

      if (updateError) throw updateError;

      // 3. Delete source order
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

    // Handle Merging (Combine)
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

    // Handle Status Change
    if (!destination) return;
    if (source.droppableId !== destination.droppableId) {
      const orderId = draggableId;
      const newStatus = destination.droppableId;
      const order = orders.find(o => o.id === orderId);

      // Protección contra cancelaciones accidentales
      if (newStatus === 'cancelled') {
        if (order) {
          setSelectedOrder(order);
          setIsCancelling(true);
          toast("Ingresa el motivo de cancelación para continuar", { icon: '📝' });
        }
        return; // Detenemos aquí, el usuario deberá confirmar en el panel de detalles
      }

      updateOrderStatus(orderId, newStatus);
    }
  };

  const getFulfillmentLabel = (type) => {
    switch (type) {
      case 'dine_in': return { text: 'EN MESA', icon: 'heroicons:hand-raised', color: 'bg-emerald-100 text-emerald-700' };
      case 'takeaway': return { text: 'PARA LLEVAR', icon: 'heroicons:shopping-bag', color: 'bg-blue-100 text-blue-700' };
      case 'delivery': return { text: 'DOMICILIO', icon: 'heroicons:truck', color: 'bg-purple-100 text-purple-700' };
      default: return { text: type, icon: 'heroicons:question-mark-circle', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const translateGroup = (group) => {
    const keys = {
      'Proteína': 'Proteína',
      'Termino de Carne': 'Término',
      'Salsas': 'Salsas',
      'Bebida': 'Bebida',
      'Adiciones': 'Adiciones',
      'extras': 'Extras',
      'options': 'Opciones',
      'milk_type': 'Leche',
      'sweetener': 'Endulzante'
    };
    return keys[group] || group;
  };

  const shareToWhatsApp = (order, type) => {
    const phone = order.customer_phone?.replace(/\D/g, '');
    if (!phone) {
        toast.error('No hay teléfono registrado');
        return;
    }

    let message = '';
    if (type === 'summary') {
      message = `*Resumen de tu pedido #${order.id.slice(0,4)}*\n\n`;
      order.order_items.forEach(item => {
          message += `${item.quantity}x ${item.products.name} - $${(item.quantity * item.unit_price).toLocaleString()}\n`;
      });
      if (order.service_fee > 0) {
        message += `\n*Servicio: $${order.service_fee.toLocaleString()}*`;
      }
      message += `\n*Total: $${order.total_amount.toLocaleString()}*`;
    } else {
      message = `¡Hola ${order.customer_name}! 👋\n\nTu pedido #${order.id.slice(0,4)} está listo. 🍽️\n\n${order.fulfillment_type === 'takeaway' ? 'Puedes pasar por él.' : 'Te lo llevaremos en un momento.'}`;
    }

    const url = `https://wa.me/57${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };
  
  const exportLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name, customer_phone')
        .eq('brand_id', activeBrandId)
        .not('customer_phone', 'is', null);

      if (error) throw error;

      // Remove duplicates
      const uniqueLeads = Array.from(new Set(data.map(o => JSON.stringify({
        Nombre: o.customer_name?.trim() || 'Desconocido',
        Celular: o.customer_phone?.replace(/\D/g, '') || ''
      })))).map(s => JSON.parse(s)).filter(l => l.Celular);

      if (uniqueLeads.length === 0) {
        toast.error('No hay leads para exportar');
        return;
      }

      // Create CSV
      const headers = ['Nombre', 'Celular'];
      const csvContent = [
        headers.join(','),
        ...uniqueLeads.map(l => `${l.Nombre},${l.Celular}`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `clientes_${activeBrand?.name || 'leads'}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast('Exportación completada! ✨', { icon: '📊' });
    } catch (err) {
      toast.error('Error al exportar');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1700px] mx-auto min-h-screen">
       {/* Merging Notification Bar */}
       {isMerging && (
         <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#2f4131] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon icon="heroicons:arrows-right-left" className="text-xl" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest leading-none mb-1">Modo Consolidación</p>
                <p className="text-xs opacity-80 font-medium">Selecciona el pedido destino para fusionar con #{mergeSourceOrder?.id?.slice(0,4)}</p>
              </div>
            </div>
            <button 
              onClick={() => { setIsMerging(false); setMergeSourceOrder(null); }}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-black transition-all border border-white/10"
            >
              CANCELAR
            </button>
         </div>
       )}
       {/* Actions Bar */}
       <div className="flex justify-end mb-6 gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-white border border-gray-100 p-1 rounded-2xl shadow-sm overflow-hidden">
            {[
              { id: 'today', label: 'Hoy' },
              { id: '7d', label: '7 Días' },
              { id: '30d', label: '30 Días' },
              { id: 'all', label: 'Total' }
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  dateRange === range.id 
                    ? 'bg-[#2f4131] text-white shadow-md shadow-[#2f4131]/20' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <button onClick={fetchOrders} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm flex items-center gap-2 font-bold text-sm">
             <Icon icon="heroicons:arrow-path" className={`text-xl ${loading ? 'animate-spin' : ''}`} />
             Actualizar
          </button>
       </div>
       
       <DailyStats 
         orders={orders} 
         range={dateRange} 
         onCancelledClick={() => setShowCancelledHistory(true)} 
         onDeliveredClick={() => setShowDeliveredHistory(true)}
       />

       {/* Modal de Historial de Entregados */}
       {showDeliveredHistory && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setShowDeliveredHistory(false)}></div>
           <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] border border-gray-100">
             <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <div>
                 <h3 className="text-xl font-black text-gray-900 tracking-tight">Historial de Entregados</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{orders.filter(o => o.status === 'delivered').length} Pedidos Hoy</p>
                 </div>
               </div>
               <button onClick={() => setShowDeliveredHistory(false)} className="p-2.5 hover:bg-gray-50 rounded-xl transition-all border border-gray-100 shadow-sm text-gray-400 hover:text-gray-600">
                 <Icon icon="heroicons:x-mark" className="text-xl" />
               </button>
             </div>
             
             <div className="overflow-y-auto px-2 scrollbar-hide">
               <div className="divide-y divide-gray-50">
                 {orders.filter(o => o.status === 'delivered').length > 0 ? (
                   orders.filter(o => o.status === 'delivered').map(order => {
                     const fStyle = getFulfillmentStyle(order.fulfillment_type);
                     return (
                       <div key={order.id} className="px-6 py-5 flex items-center gap-6 hover:bg-gray-50/80 transition-colors group">
                         <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${fStyle.color}`}>
                           <Icon icon={fStyle.icon} className="text-xl" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-0.5">
                             <p className="font-black text-gray-900 text-base flex items-center gap-3">
                               {order.customer_name || 'Sin nombre'}
                               <span className="text-[9px] font-mono text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100/50">#{order.id.slice(0,4).toUpperCase()}</span>
                             </p>
                             <p className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded shadow-sm border border-gray-50">
                               {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                           </div>
                           <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="font-bold text-gray-800">${Number(order.total_amount).toLocaleString()}</span>
                              <span className="text-gray-300">•</span>
                              <span>{order.order_items?.length || 0} productos</span>
                              <span className="text-gray-300">•</span>
                              <span className="capitalize">{order.fulfillment_type?.replace('_', ' ')}</span>
                           </div>
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Icon icon="heroicons:check-circle" className="text-emerald-500 text-xl" />
                         </div>
                       </div>
                     );
                   })
                 ) : (
                   <div className="py-24 text-center">
                     <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Icon icon="heroicons:archive-box" className="text-4xl text-gray-200" />
                     </div>
                     <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-300">Archivo vacío</p>
                   </div>
                 )}
               </div>
             </div>
             <div className="p-6 bg-gray-50/50 border-t border-gray-100 mt-auto text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fin del historial diario</p>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Historial de Cancelados */}
       {showCancelledHistory && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setShowCancelledHistory(false)}></div>
           <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] border border-gray-100">
             <div className="px-8 py-6 border-b border-rose-50 flex justify-between items-center bg-white sticky top-0 z-10">
               <div>
                 <h3 className="text-xl font-black text-gray-900 tracking-tight">Historial de Cancelados</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <div className="w-2 h-2 rounded-full bg-rose-500" />
                   <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.2em]">{orders.filter(o => o.status === 'cancelled').length} Incidencias Hoy</p>
                 </div>
               </div>
               <button onClick={() => setShowCancelledHistory(false)} className="p-2.5 hover:bg-gray-50 rounded-xl transition-all border border-gray-100 shadow-sm text-gray-400 hover:text-gray-600">
                 <Icon icon="heroicons:x-mark" className="text-xl" />
               </button>
             </div>
             
             <div className="overflow-y-auto px-2 scrollbar-hide">
               <div className="divide-y divide-gray-50">
                 {orders.filter(o => o.status === 'cancelled').length > 0 ? (
                   orders.filter(o => o.status === 'cancelled').map(order => {
                     const fStyle = getFulfillmentStyle(order.fulfillment_type);
                     return (
                       <div key={order.id} className="px-6 py-5 flex items-center gap-6 hover:bg-rose-50/30 transition-colors group">
                         <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                           <Icon icon={fStyle.icon} className="text-xl" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-0.5">
                             <p className="font-black text-gray-900 text-base flex items-center gap-3">
                               {order.customer_name || 'Sin nombre'}
                               <span className="text-[9px] font-mono text-rose-300 bg-rose-50/50 px-1.5 py-0.5 rounded border border-rose-100/50">#{order.id.slice(0,4).toUpperCase()}</span>
                             </p>
                             <p className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded shadow-sm border border-gray-50">
                               {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                           </div>
                           <div className="flex flex-col gap-1">
                              <p className="text-xs text-rose-600 font-black mt-0.5 italic">MOTIVO: {order.cancellation_reason || 'Sin especificar'}</p>
                              <div className="flex items-center gap-4 text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">
                                  <span>Subtotal: ${Number(order.total_amount).toLocaleString()}</span>
                                  <span>•</span>
                                  <span>{order.order_items?.length || 0} ítems</span>
                              </div>
                           </div>
                         </div>
                       </div>
                     );
                   })
                 ) : (
                   <div className="py-24 text-center">
                     <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Icon icon="heroicons:archive-box-x-mark" className="text-4xl text-gray-200" />
                     </div>
                     <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-300">Sin cancelaciones</p>
                   </div>
                 )}
               </div>
             </div>
             <div className="p-6 bg-gray-50/50 border-t border-gray-100 mt-auto text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resumen de perdidas y cancelaciones</p>
             </div>
           </div>
         </div>
       )}

        {loading && orders.length === 0 ? (
         <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
         </div>
       ) : (
         <DragDropContext onDragEnd={onDragEnd}>
           <div className="pb-8 h-[calc(100vh-280px)] min-h-[600px]">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full items-stretch">
               {ORDER_STATUSES.map((statusCol, index) => {
                 const fTypeWeights = { 'dine_in': 1, 'takeaway': 2, 'delivery': 3 };
                 
                 const sortOrders = (a, b, ascending = true) => {
                   const weightA = fTypeWeights[a.fulfillment_type] || 99;
                   const weightB = fTypeWeights[b.fulfillment_type] || 99;
                   if (weightA !== weightB) return weightA - weightB;
                   const dateA = new Date(a.created_at);
                   const dateB = new Date(b.created_at);
                   return ascending ? dateA - dateB : dateB - dateA;
                 };

                 const colOrders = statusCol.id === 'new'
                     ? orders.filter(o => o.status === 'new' || o.status === 'waiting_payment').sort((a,b) => sortOrders(a, b, true))
                     : orders.filter(o => o.status === statusCol.id).sort((a,b) => sortOrders(a, b, true));

                 // Color themes per column
                 const themes = {
                   new: 'from-blue-50/50 to-indigo-50/30 border-blue-100/50 shadow-blue-500/5',
                   preparing: 'from-amber-50/50 to-orange-50/30 border-amber-100/50 shadow-amber-500/5',
                   ready: 'from-emerald-50/50 to-teal-50/30 border-emerald-100/50 shadow-emerald-500/5'
                 };

                 const headerColors = {
                   new: 'bg-blue-600 shadow-blue-200',
                   preparing: 'bg-amber-600 shadow-amber-200',
                   ready: 'bg-emerald-600 shadow-emerald-200'
                 };

                 return (
                   <div key={statusCol.id} className="flex flex-col h-full min-h-[500px]">
                     {/* Column Header */}
                     <div className={`mb-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group`}>
                        <div className="flex items-center gap-3 z-10">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${headerColors[statusCol.id]}`}>
                            <Icon icon={statusCol.icon} className="text-xl" />
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">{statusCol.label}</h3>
                            <p className="text-[10px] text-gray-400 font-bold">{colOrders.length} PEDIDOS</p>
                          </div>
                        </div>
                        {/* Decorative background icon */}
                        <Icon icon={statusCol.icon} className="absolute -right-2 -bottom-2 text-6xl text-gray-50 opacity-50 group-hover:scale-110 transition-transform" />
                     </div>

                     <Droppable droppableId={statusCol.id} isCombineEnabled>
                       {(provided, snapshot) => (
                         <div
                           {...provided.droppableProps}
                           ref={provided.innerRef}
                           className={`flex-1 rounded-[2.5rem] p-4 transition-all duration-300 border-2 border-dashed flex flex-col gap-4 overflow-y-auto scrollbar-hide min-h-[400px] ${
                             snapshot.isDraggingOver 
                               ? 'bg-gray-50 border-gray-300 scale-[0.98]' 
                               : `bg-gradient-to-b ${themes[statusCol.id]} border-transparent`
                           }`}
                         >
                           <AnimatePresence mode="popLayout">
                             {colOrders.map((order, index) => (
                               <Draggable key={order.id} draggableId={order.id} index={index}>
                                 {(provided, snapshot) => (
                                   <div
                                     ref={provided.innerRef}
                                     {...provided.draggableProps}
                                     {...provided.dragHandleProps}
                                     onClick={() => setSelectedOrder(order)}
                                     style={provided.draggableProps.style}
                                     className="outline-none"
                                   >
                                     <motion.div
                                       layout
                                       initial={{ opacity: 0, y: 20 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       exit={{ opacity: 0, scale: 0.9 }}
                                       className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                                         snapshot.isDragging 
                                           ? 'shadow-2xl ring-2 ring-[#2f4131] border-transparent rotate-1 scale-105' 
                                           : 'shadow-sm border-gray-100 hover:shadow-xl hover:-translate-y-1'
                                       }`}
                                     >
                                       {/* Top level info */}
                                       <div className="flex justify-between items-start mb-4">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-inner ${
                                              order.fulfillment_type === 'dine_in' ? 'bg-emerald-50 text-emerald-700' :
                                              order.fulfillment_type === 'takeaway' ? 'bg-amber-50 text-amber-700' :
                                              'bg-blue-50 text-blue-700'
                                            }`}>
                                              {order.restaurant_tables?.table_number || 'S/M'}
                                            </div>
                                            <div>
                                              <p className="font-black text-gray-900 text-sm truncate max-w-[120px]">
                                                {order.customer_name || 'Sin nombre'}
                                              </p>
                                              <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-gray-300 uppercase leading-none tracking-tighter">#{order.id.slice(0,4)}</span>
                                                <OrderTimer createdAt={order.created_at} status={order.status} />
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-black text-gray-900">
                                              ${Number(order.total_amount).toLocaleString()}
                                            </span>
                                            <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                              order.payment_status === 'paid' 
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                : 'bg-rose-50 text-rose-500 border border-rose-100'
                                            }`}>
                                              {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                                            </div>
                                          </div>
                                       </div>

                                       {/* Items Preview */}
                                       <div className="space-y-1.5 mb-4">
                                          {order.order_items?.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                              <span className="truncate max-w-[150px]">
                                                {item.quantity}x {item.products?.name}
                                              </span>
                                              {item.is_paid && <Icon icon="heroicons:check-badge" className="text-emerald-500 text-xs" />}
                                            </div>
                                          ))}
                                          {order.order_items?.length > 3 && (
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">
                                              + {order.order_items.length - 3} productos más
                                            </p>
                                          )}
                                       </div>

                                       <div className="flex items-center justify-between pt-4 border-t border-gray-50/50">
                                          <div className="flex -space-x-2">
                                            {order.waiter_id && (
                                              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-gray-400" title="Mesero asignado">
                                                <Icon icon="heroicons:user-circle" />
                                              </div>
                                            )}
                                            {order.notes && (
                                              <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-amber-600" title="Tiene notas">
                                                <Icon icon="heroicons:chat-bubble-bottom-center-text" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Icon icon={getFulfillmentLabel(order.fulfillment_type).icon} className={`text-sm ${getFulfillmentLabel(order.fulfillment_type).color.split(' ')[1]}`} />
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                              {getFulfillmentLabel(order.fulfillment_type).text}
                                            </span>
                                          </div>
                                       </div>
                                     </motion.div>
                                   </div>
                                 )}
                               </Draggable>
                             ))}
                           </AnimatePresence>
                           {provided.placeholder}
                         </div>
                       )}
                     </Droppable>
                   </div>
                 );
               })}
             </div>
           </div>
         </DragDropContext>
       )}

       {/* Order detail panel (Overlay) */}
       <AnimatePresence>
         {selectedOrder && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[110] flex items-center justify-center p-4"
           >
             <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row border border-gray-100"
             >
                {/* Lateral Navigation / Quick Actions */}
                <div className="lg:w-72 bg-gray-50/50 border-r border-gray-100 flex flex-col p-8 order-2 lg:order-1">
                   <div className="mb-8">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Estado del Pedido</p>
                      <div className="space-y-3">
                         {ORDER_STATUSES.map(s => (
                           <button
                             key={s.id}
                             disabled={updatingStatus === selectedOrder.id}
                             onClick={() => updateOrderStatus(selectedOrder.id, s.id)}
                             className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                               selectedOrder.status === s.id
                                 ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-lg shadow-[#2f4131]/20 scale-[1.02]'
                                 : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                             }`}
                           >
                              <div className="flex items-center gap-3">
                                <Icon icon={s.icon} className="text-xl" />
                                <span className="text-xs font-black uppercase tracking-wider">{s.label}</span>
                              </div>
                              {selectedOrder.status === s.id && <Icon icon="heroicons:check-circle" />}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="mt-auto pt-8 border-t border-gray-200/50 space-y-4">
                      {selectedOrder.status !== 'delivered' && (
                        <button 
                          disabled={updatingStatus === selectedOrder.id}
                          onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                        >
                           <Icon icon="heroicons:truck" className="text-xl" />
                           Entregar Pedido
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setIsCancelling(true)}
                        className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-3"
                      >
                         <Icon icon="heroicons:trash" className="text-xl" />
                         Cancelar
                      </button>
                   </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-8 lg:p-12 overflow-y-auto scrollbar-hide order-1 lg:order-2 bg-white">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                       <div>
                          <div className="flex items-center gap-4 mb-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
                              selectedOrder.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {selectedOrder.payment_status === 'paid' ? 'FACTURADO' : 'CUENTA ABIERTA'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs font-black text-gray-400">REF: #{selectedOrder.id.slice(0,8).toUpperCase()}</span>
                          </div>
                          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4">
                            {selectedOrder.customer_name || 'Cliente sin nombre'}
                          </h1>
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <Icon icon="heroicons:map-pin" className="text-gray-400" />
                                <span className="text-xs font-black text-gray-600 uppercase tracking-wider">{selectedOrder.locations?.name}</span>
                             </div>
                             <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <Icon icon="heroicons:hand-raised" className="text-gray-400" />
                                <span className="text-xs font-black text-gray-600">MESA {selectedOrder.restaurant_tables?.table_number || 'S/M'}</span>
                             </div>
                          </div>
                       </div>

                       <div className="flex flex-col items-end bg-gray-50/50 p-6 rounded-3xl border border-gray-100 min-w-[220px]">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</p>
                          <p className="text-4xl font-black text-[#2f4131] leading-none mb-3">${Number(selectedOrder.total_amount).toLocaleString()}</p>
                          {selectedOrder.payment_status !== 'paid' && (
                            <button 
                              onClick={() => setIsPOSModalOpen(true)}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-[#2f4131] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-95"
                            >
                               <Icon icon="heroicons:banknotes" className="text-lg" />
                               Registrar Pago
                            </button>
                          )}
                       </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                       <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 group transition-all hover:border-gray-200">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Icon icon="heroicons:shopping-cart" className="text-xl" />
                             </div>
                             <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Comanda Digital</h4>
                          </div>
                          
                          <div className="space-y-6">
                             {selectedOrder.order_items?.map((item, idx) => (
                               <div key={idx} className="pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-start mb-2">
                                     <div className="flex gap-4">
                                        <span className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-black text-gray-400 border border-gray-100">{item.quantity}</span>
                                        <div>
                                           <p className="font-black text-gray-900 text-sm">{item.products?.name}</p>
                                           <p className="text-xs text-gray-400 font-bold mt-0.5">${(item.unit_price * item.quantity).toLocaleString()}</p>
                                        </div>
                                     </div>
                                     {item.is_paid && (
                                       <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-100">
                                          <Icon icon="heroicons:check-badge" /> PAGADO
                                       </span>
                                     )}
                                  </div>
                                  
                                  {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                                    <div className="ml-12 flex flex-wrap gap-2 mt-2">
                                       {Object.entries(item.modifiers).map(([group, val]) => (
                                         <div key={group} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50/50 rounded-lg border border-gray-100">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{translateGroup(group)}:</span>
                                            <span className="text-[10px] font-bold text-gray-600 capitalize">
                                               {Array.isArray(val) ? val.join(', ') : val}
                                            </span>
                                         </div>
                                       ))}
                                    </div>
                                  )}
                                  
                                  {item.notes && (
                                    <div className="ml-12 mt-3 flex items-start gap-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
                                       <Icon icon="heroicons:chat-bubble-bottom-center-text" className="text-amber-500 mt-0.5" />
                                       <p className="text-[11px] italic font-medium text-amber-900">{item.notes}</p>
                                    </div>
                                  )}
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-8">
                          {/* Waiter Assign Selection */}
                          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                             <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                      <Icon icon="heroicons:user-group" className="text-xl" />
                                   </div>
                                   <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Gestión Staff</h4>
                                </div>
                             </div>
                             
                             <div className="space-y-3">
                                {waiters.map(waiter => (
                                  <button
                                    key={waiter.id}
                                    onClick={() => assignWaiter(selectedOrder.id, waiter.id === selectedOrder.waiter_id ? null : waiter.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                      selectedOrder.waiter_id === waiter.id 
                                        ? 'bg-amber-50 border-amber-200 text-amber-900 ring-2 ring-amber-500/20' 
                                        : 'bg-white border-gray-100 hover:border-gray-200 text-gray-400'
                                    }`}
                                  >
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400 uppercase">
                                           {waiter.full_name?.slice(0,2)}
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider">{waiter.full_name}</span>
                                     </div>
                                     {selectedOrder.waiter_id === waiter.id && <Icon icon="heroicons:check-circle" className="text-xl" />}
                                  </button>
                                ))}
                             </div>
                          </div>

                          {/* Order Details Footer */}
                          <div className="bg-[#2f4131] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                             <Icon icon="heroicons:ticket" className="absolute -right-8 -top-8 text-[12rem] opacity-5 group-hover:scale-110 transition-transform duration-700" />
                             
                             <h4 className="font-black uppercase tracking-widest text-xs mb-6 relative z-10 flex items-center gap-2">
                               <Icon icon="heroicons:document-text" /> 
                               Resumen Financiero
                             </h4>
                             
                             <div className="space-y-4 relative z-10">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-60">
                                   <span>Subtotal</span>
                                   <span>${(selectedOrder.total_amount - (selectedOrder.service_fee || 0) + (selectedOrder.discount_amount || 0)).toLocaleString()}</span>
                                </div>
                                {selectedOrder.service_fee > 0 && (
                                  <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-60">
                                     <span>Propina sugerida</span>
                                     <span>${selectedOrder.service_fee.toLocaleString()}</span>
                                  </div>
                                )}
                                {selectedOrder.discount_amount > 0 && (
                                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[#93c47d]">
                                     <span>DESCUENTO ({selectedOrder.discount_reason})</span>
                                     <span>- ${selectedOrder.discount_amount.toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Confirmado</p>
                                      <p className="text-3xl font-black">${selectedOrder.total_amount.toLocaleString()}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Fecha</p>
                                      <p className="text-xs font-bold">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                          
                          {/* Share Actions */}
                          <div className="flex gap-4">
                             <button 
                               onClick={() => shareToWhatsApp(selectedOrder, 'summary')}
                               className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                             >
                                <Icon icon="logos:whatsapp-icon" className="text-lg" />
                                RESUMEN CUENTA
                             </button>
                             <button 
                               onClick={() => shareToWhatsApp(selectedOrder, 'ready')}
                               className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                             >
                                <Icon icon="logos:whatsapp-icon" className="text-lg" />
                                NOTIFICAR LISTO
                             </button>
                          </div>
                          
                          {/* Quick Discount Buttons - Only for admin/owner */}
                          <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Cortesías y Descuentos</h4>
                             <div className="flex gap-3">
                                {[5, 10, 50, 100].map(pct => (
                                  <button
                                    key={pct}
                                    onClick={() => applyDiscount(selectedOrder.id, pct)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                                      selectedOrder.discount_amount > 0 && selectedOrder.discount_reason?.includes(`${pct}%`)
                                        ? 'bg-[#2f4131] text-white border-[#2f4131]'
                                        : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
                                    }`}
                                  >
                                    {pct === 100 ? 'VIP' : `${pct}%`}
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Cancel Reason Modal Overlay */}
       <AnimatePresence>
         {isCancelling && (
           <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCancelling(false)}></div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl relative border border-gray-100"
              >
                 <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
                    <Icon icon="heroicons:exclamation-triangle" className="text-3xl" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">Cancelar Pedido</h3>
                 <p className="text-sm text-gray-500 font-medium mb-8">Esto marcará el pedido como cancelado permanentemente. ¿Cuál es el motivo?</p>
                 
                 <div className="space-y-3 mb-8">
                    {['Error del sistema', 'Cliente se arrepintió', 'Faltante de stock', 'Otro'].map(reason => (
                      <button
                        key={reason}
                        onClick={() => setCancellationReason(reason)}
                        className={`w-full p-4 rounded-2xl border text-sm font-black text-left transition-all flex items-center justify-between ${
                          cancellationReason === reason
                            ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                         {reason}
                         {cancellationReason === reason && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                      </button>
                    ))}
                    <input 
                      type="text" 
                      placeholder="Escribe otro motivo..." 
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      value={cancellationReason.startsWith('Otro: ') ? cancellationReason.replace('Otro: ', '') : ''}
                      onChange={(e) => setCancellationReason(`Otro: ${e.target.value}`)}
                      autoFocus
                    />
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => { setIsCancelling(false); setCancellationReason(""); }}
                      className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                    >
                      VOLVER
                    </button>
                    <button 
                      onClick={() => cancelOrder(selectedOrder.id)}
                      className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all"
                    >
                      CANCELAR DEFINITIVO
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Consolidation Confirm Modal */}
       <AnimatePresence>
         {isMergeConfirmOpen && mergeSourceOrder && mergeTargetOrder && (
           <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsMergeConfirmOpen(false)}></div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative border border-gray-100 text-center"
              >
                 <div className="flex items-center justify-center gap-6 mb-8">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center">
                       <span className="text-[10px] font-black leading-none mb-1">DE</span>
                       <span className="font-black">#{mergeSourceOrder.id.slice(0,4)}</span>
                    </div>
                    <Icon icon="heroicons:arrow-long-right" className="text-3xl text-gray-200" />
                    <div className="w-16 h-16 bg-[#2f4131] text-white rounded-2xl flex flex-col items-center justify-center shadow-xl shadow-[#2f4131]/20">
                       <span className="text-[10px] font-black leading-none mb-1">A</span>
                       <span className="font-black">#{mergeTargetOrder.id.slice(0,4)}</span>
                    </div>
                 </div>
                 
                 <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-4">¿Consolidar pedidos?</h3>
                 <p className="text-sm text-gray-500 font-medium mb-10 px-8">
                    Se moverán todos los productos de <b>{mergeSourceOrder.customer_name || 'Pedido A'}</b> hacia la cuenta de <b>{mergeTargetOrder.customer_name || 'Pedido B'}</b>. El primer pedido será eliminado permanentemente.
                 </p>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => { setIsMergeConfirmOpen(false); setMergeSourceOrder(null); setMergeTargetOrder(null); }}
                      className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors"
                    >
                      NO, CANCELAR
                    </button>
                    <button 
                      onClick={() => handleMergeOrders(mergeSourceOrder, mergeTargetOrder)}
                      className="flex-1 py-4 bg-[#2f4131] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#2f4131]/20 hover:bg-black transition-all"
                    >
                      SÍ, CONSOLIDAR AHORA
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>

       {selectedOrder && (
         <PaymentPOSModal
           isOpen={isPOSModalOpen}
           onClose={() => setIsPOSModalOpen(false)}
           order={selectedOrder}
           paymentMethods={activeMethods}
           onSuccess={() => {
             setIsPOSModalOpen(false);
             fetchOrders();
             setSelectedOrder(null);
           }}
         />
       )}
    </div>
  );
}
