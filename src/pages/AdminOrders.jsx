import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { usePaymentMethods } from '../hooks/usePaymentMethods';

const ORDER_STATUSES = [
  { id: 'waiting_payment', label: 'Falta Pago', color: 'text-orange-600', icon: 'heroicons:banknotes' },
  { id: 'new', label: 'Nuevos', color: 'text-blue-600', icon: 'heroicons:star' },
  { id: 'preparing', label: 'En Cocina', color: 'text-yellow-600', icon: 'heroicons:fire' },
  { id: 'ready', label: 'Listos', color: 'text-green-600', icon: 'heroicons:check-badge' },
  { id: 'delivered', label: 'Entregado', color: 'text-gray-600', icon: 'heroicons:truck' },
  { id: 'cancelled', label: 'Cancelado', color: 'text-red-600', icon: 'heroicons:x-circle' },
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

const DailyStats = ({ orders }) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const todayOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= today;
  });

  const deliveredToday = todayOrders.filter(o => o.status === 'delivered');
  const revenueToday = deliveredToday.reduce((sum, o) => sum + Number(o.total_amount), 0);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Ventas Hoy</p>
        <p className="text-2xl font-black text-[#2f4131]">${revenueToday.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pedidos Hoy</p>
        <p className="text-2xl font-black text-gray-800">{todayOrders.length}</p>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Entregados</p>
        <p className="text-2xl font-black text-green-600">{deliveredToday.length}</p>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Cancelados</p>
        <p className="text-2xl font-black text-red-600">{todayOrders.filter(o => o.status === 'cancelled').length}</p>
      </div>
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // Para marcar como pagado
  const [restaurantSettings, setRestaurantSettings] = useState(null);

  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const { staffList } = useStaff();
  const waiters = useMemo(() => staffList.filter(s => s.role === 'waiter' || s.role === 'admin'), [staffList]);

  const { paymentMethods, loading: loadingPayments } = usePaymentMethods(activeBrandId);
  const activeMethods = useMemo(() => paymentMethods.filter(m => m.is_active), [paymentMethods]);

  // Set default payment method when methods are loaded
  useEffect(() => {
    if (activeMethods.length > 0) {
      // Si no hay seleccionado o el seleccionado ya no existe/está inactivo
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

  const fetchOrders = useCallback(async () => {
    if (!activeBrandId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          restaurant_tables ( id, table_number ),
          order_items (
            id, quantity, unit_price, modifiers, notes,
            products ( id, name, category_id )
          )
        `);

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
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
  }, [activeBrandId]);

  useEffect(() => {
    if (!activeBrandId) {
      setLoading(false);
      return;
    }

    fetchOrders();

    const channel = supabase
      .channel(`admin-orders-${activeBrandId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
        setOrders(prev => [payload.new, ...prev]);
        playNotificationSound();
        toast('Nuevo pedido recibido!', { icon: '🔔' });
        fetchOrders(); // Full fetch to get associations
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        if (selectedOrder?.id === payload.new.id) {
            setSelectedOrder(prev => ({ ...prev, ...payload.new }));
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'order_items' 
        // Note: order_items usually don't have brand_id directly, 
        // so we'd need to fetch or filter in JS if multi-tenancy is strict.
        // For now, we fetchOrders which is scoped by brand_id.
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBrandId, fetchOrders, selectedOrder?.id]);

  const updateOrderStatus = async (orderId, newStatus, extraPayload = {}) => {
    try {
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
       {/* Actions Bar */}
       <div className="flex justify-end mb-6 gap-3">
          <button 
            onClick={exportLeads} 
            className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 text-amber-700 transition-colors shadow-sm flex items-center gap-2 font-bold text-sm"
          >
             <Icon icon="heroicons:arrow-down-tray" className="text-xl" />
             Exportar Leads
          </button>
          <button onClick={fetchOrders} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm flex items-center gap-2 font-bold text-sm">
             <Icon icon="heroicons:arrow-path" className="text-xl" />
             Actualizar
          </button>
       </div>
       
       <DailyStats orders={orders} />

       {loading && orders.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-6 min-w-max items-start">
            {ORDER_STATUSES.map(statusCol => {
              const fTypeWeights = { 'dine_in': 1, 'takeaway': 2, 'delivery': 3 };
              
              const sortOrders = (a, b, ascending = true) => {
                const weightA = fTypeWeights[a.fulfillment_type] || 99;
                const weightB = fTypeWeights[b.fulfillment_type] || 99;
                
                if (weightA !== weightB) {
                  return weightA - weightB; // Priority by type
                }
                
                // Then by date
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return ascending ? dateA - dateB : dateB - dateA;
              };

              const colOrders = statusCol.id !== 'delivered' && statusCol.id !== 'cancelled'
                 ? orders.filter(o => o.status === statusCol.id).sort((a,b) => sortOrders(a, b, true))
                 : orders.filter(o => {
                    if (o.status !== statusCol.id) return false;
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const orderDate = new Date(o.updated_at || o.created_at);
                    return orderDate >= today;
                   }).sort((a,b) => sortOrders(a, b, false));

              return (
                <div key={statusCol.id} className="flex flex-col gap-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 w-[300px] min-h-[500px] flex-shrink-0">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
                  <h3 className="font-bold text-gray-700">{statusCol.label}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusCol.color} bg-white opacity-80`}>
                    {colOrders.length}
                  </span>
                </div>
                
                <div className="flex flex-col gap-3 h-full">
                  {colOrders.map(order => {
                    const fl = getFulfillmentLabel(order.fulfillment_type);
                    return (
                      <div 
                        key={order?.id} 
                        onClick={() => { setSelectedOrder(order); setIsCancelling(false); }}
                        className={`bg-white p-4 rounded-2xl shadow-sm border transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98] ${
                          order?.fulfillment_type === 'dine_in' 
                          ? 'border-emerald-100 hover:border-emerald-300 hover:shadow-md ring-1 ring-emerald-50/50' 
                          : 'border-gray-100 hover:shadow-md hover:border-emerald-200'
                        }`}
                      >
                        {order.fulfillment_type === 'dine_in' && (
                          <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black py-0.5 px-6 rotate-45 translate-x-4 translate-y-2 uppercase shadow-sm">
                              MESA
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 mr-2">
                             <div className="flex flex-col">
                                <span className={`text-lg font-black leading-tight truncate group-hover:text-emerald-800 ${
                                  order?.fulfillment_type === 'dine_in' ? 'text-emerald-900' : 'text-gray-900'
                                }`}>
                                  {order?.fulfillment_type === 'dine_in' 
                                    ? `Mesa ${order?.restaurant_tables?.table_number || '?'}` 
                                    : (order?.customer_name || 'Sin nombre')}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider">#{order?.id?.slice(0, 4).toUpperCase()}</span>
                                  {order?.fulfillment_type === 'dine_in' && order?.customer_name && (
                                    <span className="text-[10px] text-gray-400 font-medium truncate">• {order?.customer_name}</span>
                                  )}
                                  {order?.fulfillment_type !== 'dine_in' && !order?.customer_name && (
                                    <span className="text-[10px] text-gray-300 italic">Cliente incógnito</span>
                                  )}
                                </div>
                             </div>
                          </div>
                          <div className="flex-shrink-0">
                            <OrderTimer createdAt={order.created_at} status={order.status} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 ${fl.color}`}>
                            <Icon icon={fl.icon} />
                            {fl.text}
                          </span>
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            {order?.order_items?.length || 0} ítems
                          </span>
                          {order?.waiter_id && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-lg flex items-center gap-1">
                              <Icon icon="heroicons:user-circle" />
                              {waiters.find(w => w.id === order?.waiter_id)?.name?.split(' ')[0] || 'Mesero'}
                            </span>
                          )}
                        </div>
                        
                        {/* Indicador de Pago Faltante si aplica */}
                        {order?.payment_status !== 'paid' && 
                         order?.status !== 'cancelled' && 
                         (restaurantSettings?.payment_requirement_stage === 'pre_preparation' || 
                          restaurantSettings?.payment_requirement_stage === 'pre_delivery') && (
                          <div className={`mb-3 flex items-center gap-2 px-3 py-2 rounded-xl animate-pulse ${
                            restaurantSettings?.payment_requirement_stage === 'pre_preparation' && order?.status === 'new'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            <Icon icon="heroicons:banknotes" className="text-lg" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {restaurantSettings?.payment_requirement_stage === 'pre_preparation' && order?.status === 'new' 
                                ? 'Pago para Cocina' 
                                : 'Pago para Entrega'}
                            </span>
                            <span className="ml-auto text-[10px] font-black bg-white/50 px-2 py-0.5 rounded-full">
                              ${Number(order?.total_amount || 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        <div className="space-y-1">
                           {order.order_items?.slice(0, 2).map(item => (
                             <div key={item.id} className="text-xs text-gray-600 truncate flex items-center gap-1">
                               <span className="font-black text-[#2f4131] bg-emerald-50 px-1 rounded">{item.quantity}x</span>
                               {item.products?.name}
                             </div>
                           ))}
                           {order.order_items?.length > 2 && (
                             <div className="text-[10px] text-gray-400 font-bold pl-6">+{order.order_items.length - 2} más...</div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {colOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 opacity-20">
                      <Icon icon={statusCol.icon} className="text-4xl mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">Sin pedidos</span>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Detalle Pedido Rediseñado */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          ></div>
          <div className="bg-gray-50/50 w-full max-w-7xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20 backdrop-blur-xl flex flex-col">
            {/* Header Modal */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                  <Icon icon="heroicons:clipboard-document-list" className="text-2xl text-[#2f4131]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-none mb-1">PEDIDO #{selectedOrder.id.slice(0,4).toUpperCase()}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${getFulfillmentLabel(selectedOrder.fulfillment_type).color}`}>
                      {getFulfillmentLabel(selectedOrder.fulfillment_type).text}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      Recibido a las {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedOrder(null); setIsCancelling(false); }}
                className="h-10 w-10 bg-white hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-all text-gray-400 shadow-sm border border-gray-100"
              >
                <Icon icon="heroicons:x-mark" className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar pb-32">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8">
                
                {/* Columna Izquierda: Consumo */}
                <div className="space-y-6">
                  {/* Alertas de Estado */}
                  {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                    <div className="flex flex-col gap-3">
                      {selectedOrder.status === 'delivered' && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm bg-green-50 text-green-700 border border-green-100">
                          <Icon icon="heroicons:check-circle" className="text-lg" />
                          Pedido Entregado a las {new Date(selectedOrder.delivered_at).toLocaleTimeString()}
                        </div>
                      )}
                      {selectedOrder.status === 'cancelled' && (
                        <div className="flex flex-col gap-2 px-4 py-3 rounded-2xl font-bold text-sm bg-red-50 text-red-700 border border-red-100">
                          <div className="flex items-center gap-2 font-black uppercase text-xs">
                            <Icon icon="heroicons:x-circle" className="text-lg" />
                            Pedido Cancelado
                          </div>
                          {selectedOrder.cancellation_reason && (
                            <p className="text-xs font-medium opacity-80">Motivo: {selectedOrder.cancellation_reason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100">
                    <h3 className="font-black text-gray-400 mb-6 uppercase tracking-widest text-[10px] flex items-center gap-2">
                       <Icon icon="heroicons:shopping-cart" className="text-lg" />
                       Detalle del Pedido
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.order_items?.map(item => (
                        <div key={item.id} className="flex gap-4 group">
                          <span className="font-black text-xl text-[#2f4131] w-8">{item.quantity}x</span>
                          <div className="flex flex-col flex-1">
                            <span className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors uppercase text-sm tracking-tight">{item.products?.name}</span>
                            {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {Object.entries(item.modifiers).map(([k, v]) => (
                                  <span key={k} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg font-bold">
                                    {translateGroup(k)}: {Array.isArray(v) ? v.join(", ") : v}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl italic font-medium border border-amber-100">
                                <Icon icon="heroicons:chat-bubble-bottom-center-text" className="mr-1 inline" />
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-gray-800">
                            ${(item.quantity * item.unit_price).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      
                      <div className="mt-8 pt-6 border-t border-gray-200/60 space-y-3">
                         <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                           <span>Subtotal</span>
                           <span>${selectedOrder.order_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}</span>
                         </div>
                         
                         {selectedOrder.service_fee > 0 && (
                            <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                              <span className="flex items-center gap-1">
                                <Icon icon="heroicons:heart" />
                                Servicio Voluntario
                              </span>
                              <span>${selectedOrder.service_fee.toLocaleString()}</span>
                            </div>
                         )}

                         {selectedOrder.discount_amount > 0 && (
                           <div className="flex justify-between items-center text-sm font-bold text-red-600">
                             <span className="flex items-center gap-1">
                               <Icon icon="heroicons:tag" />
                               Descuento ({selectedOrder.discount_reason})
                             </span>
                             <span>-${selectedOrder.discount_amount.toLocaleString()}</span>
                           </div>
                         )}

                         <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-base font-black text-gray-900">TOTAL</span>
                            <span className="text-3xl font-black text-[#2f4131] tracking-tighter">
                              ${selectedOrder.total_amount?.toLocaleString()}
                            </span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Sidebar Admin */}
                <div className="space-y-6">
                  {/* Contexto: Cliente y Ubicación */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información General</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                        <Icon icon="heroicons:user" className="text-xl" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Cliente</p>
                        <p className="font-bold text-gray-800 text-sm leading-none">{selectedOrder.customer_name || 'Sin nombre'}</p>
                      </div>
                    </div>

                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                          <Icon icon="heroicons:phone" className="text-xl" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Celular</p>
                          <p className="font-bold text-gray-800 text-sm leading-none">{selectedOrder.customer_phone}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Icon icon="heroicons:map-pin" className="text-xl" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase leading-none mb-1">Ubicación</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-lg text-sm font-black ${
                            selectedOrder.fulfillment_type === 'dine_in' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {selectedOrder.fulfillment_type === 'dine_in' 
                              ? `MESA ${selectedOrder.restaurant_tables?.table_number || '?'}`
                              : getFulfillmentLabel(selectedOrder.fulfillment_type).text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asignación de Mesero */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Mesero Asignado</p>
                    <select 
                      value={selectedOrder.waiter_id || ''}
                      onChange={(e) => assignWaiter(selectedOrder.id, e.target.value)}
                      className="w-full p-3 rounded-2xl border border-gray-100 text-sm font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    >
                      <option value="">No asignado</option>
                      {waiters.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selección de Pago (Solo si falta pago) */}
                  {selectedOrder.status === 'waiting_payment' && (
                    <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-900/5 relative overflow-hidden group">
                      {/* Decorative elements */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-100/30 rounded-full blur-3xl group-hover:bg-emerald-200/40 transition-colors duration-700" />
                      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-100/20 rounded-full blur-3xl" />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-[11px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                              <Icon icon="heroicons:banknotes" className="text-sm" />
                            </span>
                            Método de Pago
                          </p>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 uppercase tracking-wider animate-pulse">
                            Pendiente
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           {activeMethods.length > 0 ? activeMethods.map(method => (
                              <button 
                                key={method.id}
                                onClick={() => setSelectedPaymentMethod(method.id)}
                                className={`group/btn p-5 rounded-[1.75rem] border-2 transition-all duration-300 flex flex-col items-center gap-3 relative overflow-hidden ${
                                  selectedPaymentMethod === method.id 
                                   ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-200 scale-[1.02] -translate-y-1' 
                                   : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                              >
                                {selectedPaymentMethod === method.id && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-in zoom-in duration-300">
                                    <Icon icon="heroicons:check-16-solid" className="text-white text-xs" />
                                  </div>
                                )}
                                
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                  selectedPaymentMethod === method.id 
                                    ? 'bg-white/20 text-white rotate-12 scale-110' 
                                    : 'bg-emerald-50 text-emerald-600 group-hover/btn:scale-110 group-hover/btn:rotate-6'
                                }`}>
                                  <Icon icon={method.icon || (method.name?.toLowerCase().includes('efectivo') ? 'heroicons:banknotes' : 'heroicons:credit-card')} className="text-2xl" />
                                </div>
                                
                                <span className={`text-xs font-black uppercase tracking-widest ${
                                  selectedPaymentMethod === method.id ? 'text-white' : 'text-gray-700'
                                }`}>
                                  {method.name || 'SIN NOMBRE'}
                                </span>
                              </button>
                           )) : (
                             <div className="col-span-2 p-10 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                               <Icon icon="solar:card-search-bold" className="text-4xl text-gray-300" />
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No hay métodos activos</p>
                               <button 
                                 onClick={() => window.location.href = '/admin/settings/payments'}
                                 className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black hover:bg-gray-50 transition-colors"
                               >
                                 CONFIGURAR AHORA
                               </button>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Descuentos VIP */}
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <div className="bg-gray-900 p-6 rounded-[2rem] shadow-xl">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Icon icon="heroicons:sparkles" />
                        CORTESÍA / VIP
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[10, 20, 50, 100].map(pct => (
                          <button
                            key={pct}
                            onClick={async () => {
                              await applyDiscount(selectedOrder.id, pct);
                              // Auto move to 'new' if it was waiting_payment
                              if (selectedOrder.status === 'waiting_payment') {
                                await updateOrderStatus(selectedOrder.id, "new", { 
                                  payment_status: "paid", 
                                  payment_method: selectedPaymentMethod 
                                });
                              }
                            } }
                            disabled={updatingStatus === selectedOrder.id}
                            className="py-2.5 bg-gray-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all border border-gray-700 active:scale-95 disabled:opacity-50"
                          >
                            {pct}% {pct === 100 && 'OFF'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Fijo del Modal */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-10">
               
               <div className="flex-1 flex gap-2">
                 <button 
                   onClick={() => shareToWhatsApp(selectedOrder, 'summary')}
                   className="flex-1 md:flex-none px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                 >
                   <Icon icon="logos:whatsapp-icon" />
                   RESUMEN
                 </button>

                 {!isCancelling ? (
                   <button 
                     onClick={() => setIsCancelling(true)}
                     className="flex-1 md:flex-none px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                   >
                     <Icon icon="heroicons:trash" />
                     CANCELAR
                   </button>
                 ) : (
                   <div className="flex-1 flex gap-2 items-center bg-red-50 p-2 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                     <input 
                       type="text" 
                       placeholder="Motivo..."
                       value={cancellationReason}
                       onChange={(e) => setCancellationReason(e.target.value)}
                       className="flex-1 bg-white border-none text-xs font-bold p-2.5 rounded-xl focus:ring-1 focus:ring-red-300"
                     />
                     <button onClick={() => cancelOrder(selectedOrder.id)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black">CONFIRMAR</button>
                     <button onClick={() => setIsCancelling(false)} className="p-2 text-gray-400 hover:text-gray-600">
                       <Icon icon="heroicons:x-mark" />
                     </button>
                   </div>
                 )}
                </div>

                <div className="flex-[1.5]">
                  {/* BOTÓN: MARCAR COMO PAGADO (Solo si no está pagado) */}
                  {selectedOrder.payment_status !== 'paid' && (
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, selectedOrder.status === 'waiting_payment' ? 'new' : selectedOrder.status, { 
                        payment_status: 'paid', 
                        payment_method: selectedPaymentMethod 
                      })}
                      disabled={updatingStatus === selectedOrder.id}
                      className={`w-full py-4.5 rounded-[2rem] font-black text-base shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mb-3 border-2 ${
                        (restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.status === 'new') || 
                        (restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.status === 'ready')
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200/50 hover:bg-emerald-700 hover:-translate-y-0.5'
                          : 'bg-white border-emerald-600 text-emerald-600 hover:bg-emerald-50 shadow-emerald-100/50 hover:-translate-y-0.5'
                      }`}
                    >
                      <Icon icon="solar:round-transfer-horizontal-bold" className="text-2xl" />
                      MARCAR COMO PAGADO
                    </button>
                  )}

                  {/* BOTÓN: ENVIAR A COCINA */}
                  {selectedOrder.status === 'new' && (
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                      disabled={
                        updatingStatus === selectedOrder.id || 
                        (restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid')
                      }
                      className={`w-full py-4.5 rounded-[2rem] font-black text-base shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ${
                        restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid'
                          ? 'bg-neutral-200 text-neutral-400 border-2 border-neutral-100 shadow-none cursor-not-allowed grayscale'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50 hover:-translate-y-0.5 border-2 border-blue-600'
                      }`}
                    >
                      <Icon icon="solar:fire-bold" className="text-2xl" />
                      {restaurantSettings?.payment_requirement_stage === 'pre_preparation' && selectedOrder.payment_status !== 'paid' 
                        ? 'PAGO REQUERIDO PARA COCINA' 
                        : 'ENVIAR A COCINA'}
                    </button>
                  )}

                  {/* BOTÓN: LISTO PARA ENTREGA */}
                  {selectedOrder.status === 'preparing' && (
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                      disabled={updatingStatus === selectedOrder.id}
                      className="w-full py-4.5 bg-amber-500 hover:bg-amber-600 text-white rounded-[2rem] font-black text-base shadow-2xl shadow-amber-200/50 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 border-2 border-amber-500 hover:-translate-y-0.5"
                    >
                      <Icon icon="solar:check-circle-bold" className="text-2xl" />
                      LISTO PARA ENTREGA
                    </button>
                  )}

                  {/* BOTÓN: MARCAR ENTREGADO */}
                  {selectedOrder.status === 'ready' && (
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                      disabled={
                        updatingStatus === selectedOrder.id || 
                        (restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid')
                      }
                      className={`w-full py-4.5 rounded-[2rem] font-black text-base shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ${
                        restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid'
                          ? 'bg-neutral-200 text-neutral-400 border-2 border-neutral-100 shadow-none cursor-not-allowed grayscale'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50 hover:-translate-y-0.5 border-2 border-emerald-600'
                      }`}
                    >
                      <Icon icon="solar:box-minimalistic-bold" className="text-2xl" />
                      {restaurantSettings?.payment_requirement_stage === 'pre_delivery' && selectedOrder.payment_status !== 'paid'
                        ? 'PAGO REQUERIDO PARA ENTREGA'
                        : 'MARCAR COMO ENTREGADO'}
                    </button>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
