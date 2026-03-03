import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';
import { useStaff } from '../hooks/useStaff';

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

  const { staffList } = useStaff();
  const waiters = useMemo(() => staffList.filter(s => s.role === 'waiter' || s.role === 'admin'), [staffList]);

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
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant_tables ( id, table_number ),
          order_items (
            id, quantity, unit_price, modifiers, notes,
            products ( id, name, category_id )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders(prev => [payload.new, ...prev]);
        playNotificationSound();
        toast('Nuevo pedido recibido!', { icon: '🔔' });
        fetchOrders(); // Full fetch to get associations
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        if (selectedOrder?.id === payload.new.id) {
            setSelectedOrder(prev => ({ ...prev, ...payload.new }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, selectedOrder?.id]);

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
      message += `\n*Total: $${order.total_amount.toLocaleString()}*`;
    } else {
      message = `¡Hola ${order.customer_name}! 👋\n\nTu pedido #${order.id.slice(0,4)} está listo. 🍽️\n\n${order.fulfillment_type === 'takeaway' ? 'Puedes pasar por él.' : 'Te lo llevaremos en un momento.'}`;
    }

    const url = `https://wa.me/57${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
       <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 border-l-4 border-[#2f4131] pl-4">PEDIDOS</h1>
          <p className="text-gray-500 mt-1 font-medium pl-4">Gestión en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={fetchOrders} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm">
              <Icon icon="heroicons:arrow-path" className="text-xl" />
           </button>
        </div>
      </header>
       
       <DailyStats orders={orders} />

       {loading && orders.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max items-start">
            {ORDER_STATUSES.map(statusCol => {
              const colOrders = statusCol.id !== 'delivered' && statusCol.id !== 'cancelled'
                 ? orders.filter(o => o.status === statusCol.id).sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
                 : orders.filter(o => {
                    if (o.status !== statusCol.id) return false;
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const orderDate = new Date(o.updated_at || o.created_at);
                    return orderDate >= today;
                   }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

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
                        key={order.id} 
                        onClick={() => { setSelectedOrder(order); setIsCancelling(false); }}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xl font-black text-gray-900 group-hover:text-[#2f4131]">#{order.id.slice(0, 4).toUpperCase()}</span>
                            <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">{order.customer_name || 'Sin nombre'}</p>
                          </div>
                          <OrderTimer createdAt={order.created_at} status={order.status} />
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 ${fl.color}`}>
                            <Icon icon={fl.icon} />
                            {fl.text}
                          </span>
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            {order.order_items?.length || 0} ítems
                          </span>
                          {order.waiter_id && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-lg flex items-center gap-1">
                              <Icon icon="heroicons:user-circle" />
                              {waiters.find(w => w.id === order.waiter_id)?.name?.split(' ')[0] || 'Mesero'}
                            </span>
                          )}
                        </div>
                        
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

      {/* Modal Detalle Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
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
                      {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Icon icon="heroicons:user" className="text-gray-400" />
                    {selectedOrder.customer_name || 'Anónimo'}
                  </p>
                  {selectedOrder.customer_phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                       <Icon icon="heroicons:phone" className="text-gray-400" />
                       {selectedOrder.customer_phone}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ubicación</p>
                  <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Icon icon="heroicons:map-pin" className="text-gray-400" />
                    {selectedOrder.fulfillment_type === 'dine_in' 
                      ? `Mesa ${selectedOrder.restaurant_tables?.table_number || '?'}`
                      : getFulfillmentLabel(selectedOrder.fulfillment_type).text}
                  </p>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Mesero Asignado</p>
                    <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                       <Icon icon="heroicons:user-circle" className="text-blue-500 text-lg" />
                       <select 
                         value={selectedOrder.waiter_id || ''}
                         onChange={(e) => assignWaiter(selectedOrder.id, e.target.value)}
                         className="bg-transparent border-none outline-none font-bold text-gray-800 cursor-pointer hover:bg-white rounded px-1 -ml-1"
                       >
                         <option value="">Sin asignar</option>
                         {waiters.map(w => (
                           <option key={w.id} value={w.id}>{w.name}</option>
                         ))}
                       </select>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === 'delivered' && (
                   <div className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm bg-green-100 text-green-800 w-full">
                      <Icon icon="heroicons:check-circle" />
                      Pedido Entregado a las {new Date(selectedOrder.delivered_at).toLocaleTimeString()}
                   </div>
                )}
                {selectedOrder.status === 'cancelled' && (
                   <div className="col-span-2 flex flex-col gap-1 px-3 py-2 rounded-xl font-bold text-sm bg-red-100 text-red-800 w-full">
                      <div className="flex items-center gap-2 text-red-900 border-b border-red-200 pb-1 mb-1">
                        <Icon icon="heroicons:x-circle" />
                        Pedido Cancelado (Por: {selectedOrder.cancelled_by === 'customer' ? 'Cliente' : 'Restaurante'})
                      </div>
                      {selectedOrder.cancellation_reason && (
                        <p className="text-xs font-normal">Motivo: {selectedOrder.cancellation_reason}</p>
                      )}
                   </div>
                )}
              </div>

              <h3 className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-xs">Resumen del Pedido</h3>
              <div className="space-y-4 bg-gray-50 rounded-2xl p-4">
                {selectedOrder.order_items?.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <span className="font-black text-lg text-[#2f4131] w-8">{item.quantity}x</span>
                    <div className="flex flex-col flex-1">
                      <span className="font-bold text-gray-900">{item.products?.name}</span>
                      {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.modifiers).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">
                              {translateGroup(k)}: {Array.isArray(v) ? v.join(", ") : v}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-100/50 px-2 py-1 rounded-lg italic">
                          "{item.notes}"
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-gray-600 text-sm">
                      ${(item.quantity * item.unit_price).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200 mt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-500">Total</span>
                  <span className="text-xl font-black text-gray-900">${selectedOrder.total_amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => shareToWhatsApp(selectedOrder, 'summary')}
                  title="Compartir Resumen"
                  className="p-3 bg-white border border-gray-200 rounded-2xl text-green-600 hover:bg-green-50 transition-colors shadow-sm disabled:opacity-50"
                  disabled={updatingStatus === selectedOrder.id}
                >
                  <Icon icon="logos:whatsapp-icon" className="text-2xl" />
                </button>
                
                {selectedOrder.status !== 'cancelled' && selectedOrder.customer_phone && (
                  <button 
                    onClick={() => shareToWhatsApp(selectedOrder, 'ready')}
                    className="p-3 bg-green-50 border border-green-200 rounded-2xl text-green-700 font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-2 flex-grow max-w-[200px]"
                    title="Avisar que está listo"
                  >
                    Avisar Listo <Icon icon="logos:whatsapp-icon" className="text-xl" />
                  </button>
                )}

                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button 
                    onClick={() => setIsCancelling(!isCancelling)}
                    className={`p-3 border font-bold rounded-2xl transition-colors flex items-center gap-2 ${isCancelling ? 'bg-red-500 text-white border-red-500' : 'bg-white border-red-200 text-red-600 hover:bg-red-50'}`}
                  >
                    <Icon icon={isCancelling ? "heroicons:arrow-path" : "heroicons:x-mark"} className="text-xl" />
                  </button>
                )}

                <div className="flex-1 flex flex-col gap-2">
                  {isCancelling ? (
                    <div className="flex gap-2 w-full">
                      <input 
                        type="text"
                        placeholder="Motivo de cancelación..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="flex-1 p-3 bg-red-50 border border-red-100 rounded-2xl outline-none focus:ring-1 focus:ring-red-400 font-medium"
                        autoFocus
                      />
                      <button 
                        onClick={() => cancelOrder(selectedOrder.id)}
                        className="bg-red-600 text-white px-6 rounded-2xl font-bold shadow-lg shadow-red-100"
                      >
                        Confirmar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full">
                      {selectedOrder.status === 'waiting_payment' && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'new', { payment_status: 'paid' })} 
                          disabled={updatingStatus === selectedOrder.id}
                          className="flex-1 bg-orange-400 hover:bg-orange-500 text-orange-900 font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 disabled:opacity-50"
                        >
                          {updatingStatus === selectedOrder.id ? <Icon icon="line-md:loading-loop" className="text-xl" /> : <>Marcar Pagado <Icon icon="heroicons:banknotes" /></>}
                        </button>
                      )}
                      {selectedOrder.status === 'new' && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')} 
                          disabled={updatingStatus === selectedOrder.id}
                          className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-100 disabled:opacity-50"
                        >
                          {updatingStatus === selectedOrder.id ? <Icon icon="line-md:loading-loop" className="text-xl" /> : <>Enviar a Cocina <Icon icon="heroicons:fire" /></>}
                        </button>
                      )}
                      {selectedOrder.status === 'preparing' && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'ready')} 
                          disabled={updatingStatus === selectedOrder.id}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50"
                        >
                          {updatingStatus === selectedOrder.id ? <Icon icon="line-md:loading-loop" className="text-xl" /> : <>Marcar Listo <Icon icon="heroicons:check-badge" /></>}
                        </button>
                      )}
                      {selectedOrder.status === 'ready' && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} 
                          disabled={updatingStatus === selectedOrder.id}
                          className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updatingStatus === selectedOrder.id ? <Icon icon="line-md:loading-loop" className="text-xl" /> : <>Entregar <Icon icon="heroicons:truck" /></>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
