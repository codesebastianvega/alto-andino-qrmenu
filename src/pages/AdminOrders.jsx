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
import { printThermalDocument } from '../utils/thermalPrint';
import soundService from '../utils/soundService';

const ORDER_STATUSES = [
  { id: 'new', label: 'Nuevos', color: 'text-blue-600', icon: 'heroicons:star' },
  { id: 'preparing', label: 'En Cocina', color: 'text-yellow-600', icon: 'heroicons:fire' },
  { id: 'ready', label: 'Listos', color: 'text-emerald-600', icon: 'heroicons:check-badge' },
  { id: 'on_table', label: 'En Mesa / En Camino', color: 'text-purple-600', icon: 'heroicons:home' },
];

const playNotificationSound = () => {
    soundService.playNewOrder();
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
      <div className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm transition-transform active:scale-95 cursor-default">
        <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-wider mb-0.5 md:mb-1">Ventas {rangeLabels[range]}</p>
        <p className="text-lg md:text-2xl font-black text-[#2f4131] leading-none">${revenue.toLocaleString()}</p>
      </div>
      <div className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm transition-transform active:scale-95 cursor-default">
        <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-wider mb-0.5 md:mb-1">Pedidos {rangeLabels[range]}</p>
        <p className="text-lg md:text-2xl font-black text-gray-800 leading-none">{orders.length}</p>
      </div>
      <button 
        onClick={onDeliveredClick}
        className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95 hover:bg-emerald-50 hover:border-emerald-100 group text-left w-full relative overflow-hidden"
      >
        <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-wider mb-0.5 md:mb-1 group-hover:text-emerald-600 transition-colors">Finalizados</p>
        <div className="flex items-center justify-between gap-1">
          <p className="text-lg md:text-2xl font-black text-emerald-600 leading-none">{delivered.length}</p>
          <span className="text-[8px] md:text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all whitespace-nowrap">
            VER TODO
          </span>
        </div>
      </button>

      <button 
        onClick={onCancelledClick}
        className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95 hover:bg-red-50 hover:border-red-100 group text-left w-full relative overflow-hidden"
      >
        <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-wider mb-0.5 md:mb-1 group-hover:text-red-600 transition-colors">Cancelados</p>
        <div className="flex items-center justify-between gap-1">
          <p className="text-lg md:text-2xl font-black text-red-600 leading-none">{cancelled.length}</p>
          <span className="text-[8px] md:text-[9px] font-black bg-red-50 text-red-600 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all whitespace-nowrap">
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
        // Mostrar pedidos de hoy O pedidos pendientes de días anteriores
        query = query.or(`created_at.gte.${filterDate},status.not.in.(delivered,cancelled)`);
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
      let newStatus = destination.droppableId;
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

      // Columna 4 dinámica: en_mesa para dine_in, en_camino para delivery/takeaway
      if (newStatus === 'on_table' && order) {
        if (order.fulfillment_type === 'delivery' || order.fulfillment_type === 'takeaway') {
          newStatus = 'on_the_way';
        }
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
                   orders.filter(o => o.status === 'delivered').map(order => (
                     <div key={order.id} className="px-6 py-5 flex items-center gap-6 hover:bg-gray-50/80 transition-colors group">
                       <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                         <Icon icon="heroicons:truck" className="text-xl" />
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
                   ))
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
                   orders.filter(o => o.status === 'cancelled').map(order => (
                     <div key={order.id} className="px-6 py-5 flex items-center gap-6 hover:bg-rose-50/30 transition-colors group">
                       <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                         <Icon icon="heroicons:x-circle" className="text-xl" />
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
                   ))
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
            <div className="flex flex-nowrap md:grid md:grid-cols-4 gap-4 md:gap-8 h-[calc(100vh-280px)] min-h-[600px] items-start overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-6 custom-scrollbar scroll-smooth">
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
                    : statusCol.id === 'on_table'
                      ? orders.filter(o => o.status === 'on_table' || o.status === 'on_the_way').sort((a,b) => sortOrders(a, b, true))
                      : orders.filter(o => o.status === statusCol.id).sort((a,b) => sortOrders(a, b, true));

                // Color themes per column
                const themes = {
                  new: 'from-blue-50/50 to-indigo-50/30 border-blue-200 shadow-blue-500/5',
                  preparing: 'from-amber-50/50 to-orange-50/30 border-amber-200 shadow-amber-500/5',
                  ready: 'from-emerald-50/50 to-teal-50/30 border-emerald-200 shadow-emerald-500/5',
                  on_table: 'from-purple-50/50 to-fuchsia-50/30 border-purple-200 shadow-purple-500/5'
                };

                return (
                  <Droppable key={`status-column-${statusCol.id}-${index}`} droppableId={statusCol.id} isCombineEnabled>
                  {(provided, snapshot) => (
                    <div 
                      className={`min-w-[80vw] md:min-w-0 snap-center shrink-0 flex flex-col rounded-[2.5rem] p-4 md:p-6 border-2 transition-all duration-300 bg-gradient-to-b ${
                        snapshot.isDraggingOver 
                          ? 'bg-white/80 border-emerald-300 shadow-2xl' 
                          : `${themes[statusCol.id]} shadow-xl`
                      } h-full`}
                    >
                      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-2xl bg-white shadow-sm ${statusCol.color.replace('text-', 'text-Opacity-80')}`}>
                             <Icon icon={statusCol.icon} className="text-xl" />
                          </div>
                          <h3 className="font-black text-gray-800 text-lg tracking-tight">{statusCol.label}</h3>
                        </div>
                        <span className={`text-sm font-black px-4 py-1.5 rounded-2xl shadow-sm border border-white bg-white/80 ${statusCol.color}`}>
                          {colOrders.length}
                        </span>
                      </div>
                      
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-5"
                      >
                        {colOrders.map((order, index) => {
                          const fl = getFulfillmentLabel(order.fulfillment_type);
                          return (
                            <Draggable key={order.id} draggableId={order.id} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => { 
                                    if (isMerging) {
                                      handleMergeOrders(mergeSourceOrder, order);
                                    } else {
                                      setSelectedOrder(order); 
                                      setIsCancelling(false); 
                                    }
                                  }}
                                  className={`bg-white p-6 rounded-[2rem] shadow-sm border-2 transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-4 ${
                                    snapshot.isDragging ? 'shadow-2xl ring-4 ring-emerald-500/20 scale-105 rotate-1 z-50' : 'active:scale-[0.98]'
                                  } ${
                                    order?.fulfillment_type === 'dine_in' 
                                    ? 'border-emerald-100/80 hover:border-emerald-300' 
                                    : 'border-gray-100 hover:border-emerald-200'
                                  } ${
                                    snapshot.isCombiningWith ? 'bg-emerald-100 border-emerald-500 border-2' : ''
                                  }`}
                                >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                             <div className="flex flex-col">
                                <span className={`text-xl font-black leading-tight truncate group-hover:text-emerald-800 transition-colors ${
                                  order?.fulfillment_type === 'dine_in' ? 'text-emerald-900' : 'text-gray-900'
                                }`}>
                                  {order?.fulfillment_type === 'dine_in' 
                                    ? (order?.restaurant_tables?.table_number ? `Mesa ${order.restaurant_tables.table_number}` : 'Mesa ?')
                                    : (order?.customer_name || 'Sin nombre')}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest bg-gray-50 px-1.5 py-0.5 rounded">#{order?.id?.slice(0, 4).toUpperCase()}</span>
                                  {order?.fulfillment_type === 'dine_in' && order?.customer_name && (
                                    <span className="text-[10px] text-gray-400 font-medium truncate">• {order?.customer_name}</span>
                                  )}
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <OrderTimer createdAt={order.created_at} status={order.status} />
                            {order.fulfillment_type === 'dine_in' && (
                              <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">MESA</span>
                            )}
                            {order.status === 'on_the_way' && (
                              <span className="text-[8px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">EN CAMINO</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-black/5 ${fl.color}`}>
                            <Icon icon={fl.icon} />
                            {fl.text}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100">
                            {order?.order_items?.length || 0} ítems
                          </span>
                        </div>
                        
                        {/* Indicador de Pago / Balancé - Rediseñado a Rojo Suave */}
                        {order?.payment_status !== 'paid' && order?.status !== 'cancelled' && (
                          <div className={`flex flex-col gap-2 px-4 py-3 rounded-[1.25rem] border transition-colors ${
                            (restaurantSettings?.payment_requirement_stage === 'pre_preparation' && order?.status === 'new') ||
                            (restaurantSettings?.payment_requirement_stage === 'pre_delivery' && order?.status === 'ready')
                              ? 'bg-rose-50 border-rose-100 text-rose-700 animate-pulse'
                              : 'bg-rose-50/30 border-rose-100/50 text-rose-600/80'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon icon="heroicons:banknotes" className="text-base" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                  {order?.paid_amount > 0 ? 'Falta Saldo' : 'Pago Pendiente'}
                                </span>
                              </div>
                              <span className="text-[11px] font-black">
                                {order?.paid_amount > 0 
                                  ? `$${(order.total_amount - order.paid_amount).toLocaleString()}` 
                                  : `$${Number(order?.total_amount || 0).toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2 mt-1">
                          {order.order_items?.slice(0, 2).map(item => (
                            <div key={item.id} className="text-[13px] text-gray-600 truncate flex items-center gap-2">
                              <span className="font-black text-emerald-700 bg-emerald-50 w-6 h-6 flex items-center justify-center rounded-lg text-[10px] shrink-0">{item.quantity}x</span>
                              <span className="font-medium truncate">{item.products?.name}</span>
                            </div>
                          ))}
                          {order.order_items?.length > 2 && (
                            <div className="text-[10px] text-gray-400 font-bold pl-8">+{order.order_items.length - 2} productos más...</div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        {colOrders.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 opacity-20">
                            <Icon icon={statusCol.icon} className="text-4xl mb-2" />
                            <span className="text-xs font-bold uppercase tracking-widest">Sin pedidos</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>
      )}

      {/* Modal Detalle Pedido Rediseñado */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          ></div>
          <div className="relative z-10 bg-slate-50 w-full max-w-6xl h-[94vh] md:h-[88vh] max-h-[920px] rounded-t-[2rem] rounded-b-none md:rounded-b-[2rem] shadow-2xl overflow-hidden flex flex-col mt-auto md:mt-0 border border-slate-200/80 animate-in slide-in-from-bottom-4 md:zoom-in duration-300">
            
            {/* Header Modal (shrink-0) */}
            <div className="shrink-0 px-6 py-4 md:px-8 md:py-5 border-b border-gray-200 bg-white flex justify-between items-center z-10 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 text-[#2f4131]">
                  <Icon icon="heroicons:clipboard-document-list" className="text-2xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-none">
                      PEDIDO #{selectedOrder.id.slice(0,4).toUpperCase()}
                    </h2>
                    <span className={`text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-lg border ${getFulfillmentLabel(selectedOrder.fulfillment_type).color}`}>
                      {getFulfillmentLabel(selectedOrder.fulfillment_type).text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <Icon icon="solar:clock-circle-bold" className="text-sm" />
                    <span>Recibido a las {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {selectedOrder.scheduled_time && (
                      <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        📅 Programado: {new Date(selectedOrder.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setSelectedOrder(null); setIsCancelling(false); }}
                  className="h-9 w-9 md:h-10 md:w-10 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-all text-gray-400 border border-gray-200"
                  title="Cerrar modal"
                >
                  <Icon icon="heroicons:x-mark" className="text-xl" />
                </button>
              </div>
            </div>

            {/* Scrollable Body: flex-1 min-h-0 overflow-y-auto */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-7 custom-scrollbar bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6 items-start">
                
                {/* Columna Izquierda: Detalle de Platos, Notas y Totales */}
                <div className="space-y-4">
                  {/* Alertas de Estado (Delivered / Cancelled) */}
                  {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                    <div className="flex flex-col gap-2">
                      {selectedOrder.status === 'delivered' && (
                        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                          <Icon icon="heroicons:check-circle" className="text-lg text-emerald-600 shrink-0" />
                          <span>Pedido Finalizado a las {new Date(selectedOrder.delivered_at || selectedOrder.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {selectedOrder.status === 'cancelled' && (
                        <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl font-bold text-xs bg-red-50 text-red-800 border border-red-200 shadow-sm">
                          <div className="flex items-center gap-2 font-black uppercase text-xs text-red-700">
                            <Icon icon="heroicons:x-circle" className="text-lg text-red-600 shrink-0" />
                            Pedido Cancelado
                          </div>
                          {selectedOrder.cancellation_reason && (
                            <p className="text-xs font-medium text-red-600/90 pl-6">Motivo: {selectedOrder.cancellation_reason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tarjeta: Lista de Productos */}
                  <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <Icon icon="heroicons:shopping-cart" className="text-base text-slate-400" />
                        Detalle del Consumo ({selectedOrder.order_items?.length || 0} {selectedOrder.order_items?.length === 1 ? 'ítem' : 'ítems'})
                      </h3>
                      <span className="text-[11px] font-bold text-slate-500">
                        Total items: {selectedOrder.order_items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {selectedOrder.order_items?.map(item => (
                        <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5 group">
                          <span className="font-black text-sm md:text-base text-[#2f4131] bg-slate-100 px-2.5 py-1 rounded-xl shrink-0 h-fit border border-slate-200">
                            {item.quantity}x
                          </span>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors uppercase text-sm tracking-tight">
                                {item.products?.name}
                              </span>
                              {item.is_paid && (
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Icon icon="heroicons:check-circle-16-solid" />
                                  PAGADO
                                </span>
                              )}
                            </div>

                            {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {Object.entries(item.modifiers).map(([k, v]) => (
                                  <span key={k} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold">
                                    {translateGroup(k)}: {Array.isArray(v) ? v.join(", ") : v}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.notes && (
                              <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg italic font-medium border border-amber-200 flex items-center gap-1.5">
                                <Icon icon="heroicons:chat-bubble-bottom-center-text" className="text-amber-500 shrink-0" />
                                <span>"{item.notes}"</span>
                              </div>
                            )}
                          </div>

                          <span className="font-black text-sm text-gray-900 shrink-0 whitespace-nowrap pt-1">
                            ${(item.quantity * item.unit_price).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Desglose de Totales */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                        <span>Subtotal consumo</span>
                        <span>${selectedOrder.order_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}</span>
                      </div>
                      
                      {selectedOrder.service_fee > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold text-emerald-600">
                          <span className="flex items-center gap-1">
                            <Icon icon="heroicons:heart" />
                            Servicio Voluntario
                          </span>
                          <span>${selectedOrder.service_fee.toLocaleString()}</span>
                        </div>
                      )}

                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between items-center text-xs font-bold text-red-600">
                          <span className="flex items-center gap-1">
                            <Icon icon="heroicons:tag" />
                            Descuento ({selectedOrder.discount_reason})
                          </span>
                          <span>-${selectedOrder.discount_amount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900">TOTAL A PAGAR</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            selectedOrder.payment_status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}>
                            {selectedOrder.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                          </span>
                        </div>
                        <span className="text-2xl md:text-3xl font-black text-[#2f4131] tracking-tight">
                          ${selectedOrder.total_amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Sidebar Admin */}
                <div className="space-y-4">
                  {/* Tarjeta: Información de Cliente & Ubicación */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información General</p>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                        selectedOrder.fulfillment_type === 'dine_in' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {selectedOrder.fulfillment_type === 'dine_in' 
                          ? `🪑 MESA ${selectedOrder.restaurant_tables?.table_number || '?'}`
                          : getFulfillmentLabel(selectedOrder.fulfillment_type).text}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200 mt-0.5">
                        <Icon icon="heroicons:user" className="text-lg" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Cliente</p>
                        <p className="font-bold text-gray-900 text-sm leading-snug break-words">
                          {selectedOrder.customer_name || 'Sin nombre'}
                        </p>
                      </div>
                    </div>

                    {selectedOrder.customer_phone && (
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200">
                            <Icon icon="heroicons:phone" className="text-lg" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Celular</p>
                            <p className="font-bold text-gray-900 text-sm leading-none">{selectedOrder.customer_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a 
                            href={`https://wa.me/${(selectedOrder.customer_phone.replace(/\D/g, '').startsWith('57') ? selectedOrder.customer_phone.replace(/\D/g, '') : `57${selectedOrder.customer_phone.replace(/\D/g, '')}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200"
                            title="Chat por WhatsApp"
                          >
                            <Icon icon="logos:whatsapp-icon" className="text-base" />
                          </a>
                          <a 
                            href={`tel:${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
                            title="Llamar directamente"
                          >
                            <Icon icon="heroicons:phone" className="text-base" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tarjeta: Mesero Asignado */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Icon icon="solar:user-hand-up-bold" className="text-emerald-600 text-sm" />
                      Mesero Asignado
                    </p>
                    <select 
                      value={selectedOrder.waiter_id || ''}
                      onChange={(e) => assignWaiter(selectedOrder.id, e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold text-gray-800 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="">No asignado</option>
                      {waiters.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tarjeta: Resumen Financiero y Pagos */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Estado Financiero</span>
                      {selectedOrder.payment_method && (
                        <span className="text-slate-500 font-bold lowercase text-[10px] truncate max-w-[170px]" title={selectedOrder.payment_method}>
                          {selectedOrder.payment_method}
                        </span>
                      )}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Monto Total</span>
                      <span className="font-black text-slate-900">${selectedOrder.total_amount?.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Pagado</span>
                      <span className="font-black text-emerald-600">${(selectedOrder.paid_amount || 0).toLocaleString()}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-900">PENDIENTE</span>
                      <span className={`text-base font-black ${selectedOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                        ${Math.max(0, (selectedOrder.total_amount || 0) - (selectedOrder.paid_amount || 0)).toLocaleString()}
                      </span>
                    </div>

                    {selectedOrder.payment_status === 'paid' && (
                      <div className="flex items-center gap-1.5 justify-center py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-[10px] font-black uppercase">
                        <Icon icon="heroicons:check-circle" className="text-sm" />
                        Completamente Pagado
                      </div>
                    )}

                    {/* Historial de Pagos si hay pagos registrados */}
                    {selectedOrder.order_payments?.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Icon icon="heroicons:clipboard-document-check" className="text-xs" />
                          Abonos Realizados
                        </p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                          {selectedOrder.order_payments.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(pay => (
                            <div key={pay.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                              <div>
                                <span className="text-[10px] font-black text-slate-800 uppercase block">{pay.payment_method_name || 'Desconocido'}</span>
                                <span className="text-[8px] font-bold text-slate-400">{new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] font-black text-emerald-600 block">${pay.amount.toLocaleString()}</span>
                                {pay.change_amount > 0 && (
                                  <span className="text-[8px] font-bold text-slate-400 block">Cambio: ${pay.change_amount.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tarjeta: Descuentos VIP */}
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white space-y-3">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon icon="heroicons:sparkles" />
                        Cortesía / Descuento Rápido
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[10, 20, 50, 100].map(pct => (
                          <button
                            key={pct}
                            onClick={async () => {
                              await applyDiscount(selectedOrder.id, pct);
                              if (selectedOrder.status === 'waiting_payment') {
                                await updateOrderStatus(selectedOrder.id, "new", { 
                                  payment_status: "paid", 
                                  payment_method: selectedPaymentMethod 
                                });
                              }
                            }}
                            disabled={updatingStatus === selectedOrder.id}
                            className="py-2.5 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Fijo Estructural (shrink-0): NUNCA tapa contenido */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-4 md:px-8 md:py-4 z-20 flex flex-col gap-3 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
              {/* Fila 1: Botones Secundarios Compactos */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button 
                    onClick={() => shareToWhatsApp(selectedOrder, 'summary')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200"
                  >
                    <Icon icon="logos:whatsapp-icon" className="text-sm" />
                    <span>WhatsApp</span>
                  </button>

                  <button 
                    onClick={() => { 
                      setIsMerging(true); 
                      setMergeSourceOrder(selectedOrder); 
                      setSelectedOrder(null); 
                      toast("Ahora selecciona el pedido destino", { icon: '🎯' });
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-200"
                  >
                    <Icon icon="heroicons:arrows-right-left" className="text-sm" />
                    <span>Consolidar</span>
                  </button>

                  {restaurantSettings?.kitchen_print_enabled && (
                    <button 
                      onClick={() => printThermalDocument({ order: selectedOrder, type: 'kitchen', width: restaurantSettings?.thermal_paper_width || '80', businessName: activeBrand?.name, business: activeBrand })} 
                      className="px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Icon icon="solar:printer-bold" className="text-sm" />
                      <span>Comanda</span>
                    </button>
                  )}

                  {restaurantSettings?.receipt_print_enabled !== false && (
                    <button 
                      onClick={() => printThermalDocument({ order: selectedOrder, type: 'receipt', width: restaurantSettings?.thermal_paper_width || '80', businessName: activeBrand?.name, business: activeBrand })} 
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Icon icon="solar:bill-check-bold" className="text-sm" />
                      <span>Recibo</span>
                    </button>
                  )}
                </div>

                {/* Cancelación */}
                <div>
                  {!isCancelling ? (
                    <button 
                      onClick={() => setIsCancelling(true)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-red-200"
                    >
                      <Icon icon="heroicons:trash" className="text-sm" />
                      <span>Cancelar</span>
                    </button>
                  ) : (
                    <div className="flex gap-1.5 items-center bg-red-50 p-1.5 rounded-xl border border-red-200 animate-in fade-in">
                      <input 
                        type="text" 
                        placeholder="Motivo de cancelación..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="bg-white border border-red-200 text-xs font-medium p-1.5 px-2.5 rounded-lg focus:ring-1 focus:ring-red-400 w-48"
                      />
                      <button onClick={() => cancelOrder(selectedOrder.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black">
                        Confirmar
                      </button>
                      <button onClick={() => setIsCancelling(false)} className="p-1 text-slate-400 hover:text-slate-600">
                        <Icon icon="heroicons:x-mark" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fila 2: Acciones Operativas Primarias (Grandes y Elegantes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Botón: Cobrar / POS Modal */}
                {selectedOrder.payment_status !== 'paid' && (
                  <button 
                    onClick={() => setIsPOSModalOpen(true)}
                    disabled={updatingStatus === selectedOrder.id}
                    className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 border ${
                      (restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.status === 'new') || 
                      (restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.status === 'ready')
                        ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50'
                        : 'bg-white border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Icon icon="solar:round-transfer-horizontal-bold" className="text-xl" />
                    <span>COBRAR / REGISTRAR PAGO</span>
                  </button>
                )}

                {/* Botones de Estado */}
                {selectedOrder.status === 'new' && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                    disabled={
                      updatingStatus === selectedOrder.id || 
                      (restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid')
                    }
                    className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                      restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid'
                        ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed grayscale'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50'
                    } ${selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''}`}
                  >
                    <Icon icon="solar:fire-bold" className="text-xl" />
                    <span>
                      {restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid' 
                        ? 'PAGO REQUERIDO PARA COCINA' 
                        : 'ENVIAR A COCINA'}
                    </span>
                  </button>
                )}

                {selectedOrder.status === 'preparing' && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                    disabled={updatingStatus === selectedOrder.id}
                    className={`py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm shadow-md shadow-amber-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                      selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <Icon icon="solar:check-circle-bold" className="text-xl" />
                    <span>LISTO PARA ENTREGA</span>
                  </button>
                )}

                {selectedOrder.status === 'ready' && (
                  <>
                    {selectedOrder.fulfillment_type === 'dine_in' ? (
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'on_table')}
                        disabled={updatingStatus === selectedOrder.id}
                        className={`py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm shadow-md shadow-purple-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                          selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <Icon icon="solar:shop-2-bold" className="text-xl" />
                        <span>SERVIR EN MESA</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.id, 'on_the_way')}
                        disabled={updatingStatus === selectedOrder.id}
                        className={`py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm shadow-md shadow-purple-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                          selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <Icon icon="solar:delivery-bold" className="text-xl" />
                        <span>{selectedOrder.fulfillment_type === 'delivery' ? 'ENVIAR DOMICILIO' : 'LISTO PARA RECOGER'}</span>
                      </button>
                    )}
                  </>
                )}

                {(selectedOrder.status === 'on_table' || selectedOrder.status === 'on_the_way') && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    disabled={
                      updatingStatus === selectedOrder.id || 
                      (restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid')
                    }
                    className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                      restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid'
                        ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed grayscale'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50'
                    } ${selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''}`}
                  >
                    <Icon icon="solar:check-read-bold" className="text-xl" />
                    <span>
                      {restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid'
                        ? 'PAGO REQUERIDO PARA FINALIZAR'
                        : selectedOrder.status === 'on_the_way' ? 'PEDIDO ENTREGADO' : 'FINALIZAR PEDIDO'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Payment Modal */}
      {isPOSModalOpen && selectedOrder && (
        <PaymentPOSModal 
          order={selectedOrder}
          paymentMethods={activeMethods}
          restaurantSettings={restaurantSettings}
          onClose={() => setIsPOSModalOpen(false)}
          onSuccess={async ({ autoFinalized } = {}) => {
            if (autoFinalized) {
              setSelectedOrder(null);
              toast.success(`🎉 Pedido #${selectedOrder.id.slice(0,4).toUpperCase()} finalizado con éxito`);
            }
            await fetchOrders();
          }}
        />
      )}

      {/* MERGE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isMergeConfirmOpen && mergeSourceOrder && mergeTargetOrder && (
          <Modal onClose={() => setIsMergeConfirmOpen(false)}>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon icon="solar:globus-bold-duotone" className="text-4xl text-brand-primary animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">¿Consolidar Pedidos?</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Estás a punto de fusionar el pedido de <span className="text-gray-900 font-bold">{mergeSourceOrder.customer_name || 'Mesa ' + mergeSourceOrder.restaurant_tables?.table_number}</span> dentro de <span className="text-gray-900 font-bold">{mergeTargetOrder.customer_name || 'Mesa ' + mergeTargetOrder.restaurant_tables?.table_number}</span>.
                <br /><br />
                Los items del primer pedido se sumarán a la cuenta del segundo y el primer pedido será eliminado.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    handleMergeOrders(mergeSourceOrder, mergeTargetOrder);
                    setIsMergeConfirmOpen(false);
                  }}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  SÍ, CONSOLIDAR CUENTAS
                </button>
                <button 
                  onClick={() => setIsMergeConfirmOpen(false)}
                  className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
