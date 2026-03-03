import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';

const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5);

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

function KitchenTimer({ createdAt }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      setMins(Math.floor((new Date() - new Date(createdAt)) / 60000));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  let color = 'text-emerald-500';
  if (mins >= 10) color = 'text-yellow-500';
  if (mins >= 20) color = 'text-red-500';

  return (
    <div className={`text-sm font-bold tracking-wide ${color} flex items-center gap-1.5`}>
      <Icon icon="heroicons:clock" />
      {mins} min
    </div>
  );
}

export default function AdminKitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const [viewMode, setViewMode] = useState('tower'); // 'tower' | 'batch' | 'all'

  const fetchKitchenOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant_tables ( id, table_number ),
          order_items (
            id, quantity, unit_price, modifiers, notes,
            products ( id, name )
          )
        `)
        .in('status', ['new', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
      toast('Error al cargar pedidos de cocina');
    } finally {
      setLoading(false);
    }
  }, []);

  const getBatchItems = () => {
    const items = {};
    orders.filter(o => o.status === 'new' || o.status === 'preparing').forEach(order => {
      order.order_items.forEach(item => {
        // Create a unique key based on product and modifiers
        const modifiersKey = item.modifiers ? JSON.stringify(item.modifiers) : 'no-mod';
        const key = `${item.product_id}-${modifiersKey}`;
        
        if (!items[key]) {
          items[key] = {
             productId: item.product_id,
             name: item.products?.name,
             modifiers: item.modifiers,
             totalQuantity: 0,
             orders: []
          };
        }
        items[key].totalQuantity += item.quantity;
        items[key].orders.push(`#${order.id.slice(0,4).toUpperCase()} (${item.quantity})`);
      });
    });
    return Object.values(items).sort((a,b) => b.totalQuantity - a.totalQuantity);
  };

  const renderOrderCard = (order) => (
            <div 
              key={order.id}
              className={`flex flex-col rounded-xl overflow-hidden border transition-all duration-200 shadow-xl ${
                order.status === 'preparing' 
                  ? 'bg-[#1e293b] border-emerald-500/40 ring-1 ring-emerald-500/20' 
                  : 'bg-[#111827] border-white/10'
              } ${
                // Urgency Pulse: If order is > 15 mins old (900000 ms) and not 'ready'
                (new Date() - new Date(order.created_at) > 900000 && order.status !== 'ready') 
                ? 'animate-pulse ring-2 ring-red-500/50 shadow-red-900/40' : ''
              }`}
            >
              {/* Card Header */}
              <div className="p-3 pb-2 flex justify-between items-start bg-black/20 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-black tracking-tighter text-white">#{order.id.slice(0, 4).toUpperCase()}</span>
                    {order.fulfillment_type !== 'dine_in' && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                            order.fulfillment_type === 'takeaway' 
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        }`}>
                            {order.fulfillment_type === 'takeaway' ? 'LLEVAR' : 'DOMI'}
                        </span>
                    )}
                  </div>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-wide">
                    {order.fulfillment_type === 'dine_in' ? `Mesa ${order.restaurant_tables?.table_number || '?'}` : order.customer_name || 'PARA LLEVAR'}
                  </p>
                </div>
                <KitchenTimer createdAt={order.created_at} />
              </div>

              {/* Items List */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar" style={{ maxHeight: '250px' }}>
                {order.order_items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center pt-0.5">
                        <span className={`text-base font-bold w-7 h-7 rounded border flex items-center justify-center pb-px ${
                             order.status === 'preparing' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-gray-300 border-white/10'
                        }`}>
                        {item.quantity}
                        </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-tight uppercase text-white/90">{item.products?.name}</p>
                      
                      {/* Modifiers List - CLEANER */}
                      {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                        <div className="mt-2 space-y-0.5">
                           {Object.entries(item.modifiers).map(([group, choice]) => (
                             <div key={group} className="flex items-center gap-1.5">
                               <div className="w-1 h-1 rounded-full bg-yellow-500/60" />
                               <span className="text-yellow-400/90 font-semibold text-[11px] uppercase tracking-wide">{choice}</span>
                             </div>
                           ))}
                        </div>
                      )}

                      {/* Notes - STRUCTURED */}
                      {item.notes && (
                        <div className="mt-3 bg-red-950/30 border-l-2 border-red-500/50 p-2.5 rounded-r-lg">
                          <p className="text-red-400 font-black text-[9px] uppercase mb-0.5 flex items-center gap-1">
                            <Icon icon="heroicons:exclamation-triangle" /> NOTA:
                          </p>
                          <p className="text-white/80 font-bold text-sm italic">"{item.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="p-3 bg-black/20 border-t border-white/5">
                {order.status === 'new' ? (
                  <button 
                    onClick={() => markAsPreparing(order.id)}
                    disabled={updatingStatus === order.id}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-md text-sm uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm"
                  >
                    {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : <><Icon icon="heroicons:play" /> PREPARAR</>}
                  </button>
                ) : (
                  <button 
                    onClick={() => markAsReady(order.id)}
                    disabled={updatingStatus === order.id}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-md text-sm uppercase tracking-wider transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : <><Icon icon="heroicons:check-badge" /> LISTO</>}
                  </button>
                )}
              </div>
            </div>
  );

  useEffect(() => {
    fetchKitchenOrders();

    const channel = supabase
      .channel('kitchen-view-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
            if (['new', 'preparing'].includes(payload.new.status)) {
                playNotificationSound();
                toast('¡Nuevo pedido para cocina!');
                fetchKitchenOrders();
            }
        } else if (payload.eventType === 'UPDATE') {
            if (!['new', 'preparing'].includes(payload.new.status)) {
                // If status changed to something else (ready, delivered, cancelled), remove it
                setOrders(prev => prev.filter(o => o.id !== payload.new.id));
            } else {
                fetchKitchenOrders();
            }
        } else {
            fetchKitchenOrders();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchKitchenOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchKitchenOrders]);

  const markAsReady = async (orderId) => {
    try {
      setUpdatingStatus(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready', ready_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      toast('Pedido Marcado como LISTO', { icon: '✅' });
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error('Error al marcar pedido:', err);
      toast('Error al actualizar estado');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const markAsPreparing = async (orderId) => {
    try {
        setUpdatingStatus(orderId);
        const { error } = await supabase
          .from('orders')
          .update({ status: 'preparing' })
          .eq('id', orderId);
  
        if (error) throw error;
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o));
      } catch (err) {
        console.error('Error al marcar preparación:', err);
      } finally {
        setUpdatingStatus(null);
      }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <Icon icon="line-md:loading-loop" className="text-6xl mb-4" />
        <p className="text-xl font-bold">Cargando Cocina...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6 text-white overflow-x-hidden font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-sm">
            <Icon icon="heroicons:fire" className="text-xl text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white/90 uppercase leading-none mb-1">Cocina</h1>
            <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Staff Mode · Real-time</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Toggles */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setViewMode('tower')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'tower' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                > Torre de Control </button>
                <button 
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                > Todos </button>
                <button 
                   onClick={() => setViewMode('batch')}
                   className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex border border-transparent items-center gap-1 ${viewMode === 'batch' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Icon icon="heroicons:rectangle-group" /> Agrupados
                </button>
            </div>

            <div className="flex items-center gap-6 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <div className="text-center">
                    <p className="text-[9px] text-gray-500 font-bold uppercase">Pendientes</p>
                    <p className="text-xl font-black">{orders.length}</p>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <button onClick={fetchKitchenOrders} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                    <Icon icon="heroicons:arrow-path" className="text-xl" />
                </button>
            </div>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] opacity-20">
          <Icon icon="heroicons:check-badge" className="text-8xl mb-4" />
          <p className="text-2xl font-black uppercase tracking-wider">Sin Pendientes</p>
        </div>
      ) : (
        <>
            {viewMode === 'all' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {orders.map(order => renderOrderCard(order))}
                </div>
            )}

            {viewMode === 'tower' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 items-start">
                    {/* Nuevos Column */}
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                            <h2 className="text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                <Icon icon="heroicons:inbox-arrow-down" /> Por Preparar
                            </h2>
                            <span className="bg-blue-500/20 text-blue-400 font-bold px-3 py-1 rounded-lg border border-blue-500/20">
                                {orders.filter(o => o.status === 'new').length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders.filter(o => o.status === 'new').map(order => renderOrderCard(order))}
                        </div>
                    </div>

                    {/* Preparando Column */}
                    <div className="bg-emerald-900/10 rounded-2xl p-4 border border-emerald-500/10 ring-1 ring-emerald-500/5">
                         <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-500/10">
                            <h2 className="text-lg font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                <Icon icon="heroicons:fire" /> En Proceso
                            </h2>
                            <span className="bg-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-lg border border-emerald-500/20">
                                {orders.filter(o => o.status === 'preparing').length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders.filter(o => o.status === 'preparing').map(order => renderOrderCard(order))}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'batch' && (
                <div className="bg-black/20 rounded-xl p-4 md:p-6 border border-white/5 max-w-3xl mx-auto">
                     <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2 mb-4 md:mb-6">
                        <Icon icon="heroicons:rectangle-group" /> Agrupados (Total Pendientes)
                     </h2>
                     <div className="space-y-3">
                         {getBatchItems().map((batch, idx) => (
                             <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between bg-[#111827] p-4 rounded-lg border border-white/5">
                                 <div className="flex items-center gap-4 md:gap-6">
                                     <div className="bg-yellow-500/20 text-yellow-400 text-xl font-black w-10 h-10 rounded-lg border border-yellow-500/30 flex items-center justify-center shrink-0">
                                         {batch.totalQuantity}
                                     </div>
                                     <div>
                                        <p className="text-sm md:text-base font-bold uppercase">{batch.name}</p>
                                        {/* Modifiers condensed */}
                                        {batch.modifiers && Object.keys(batch.modifiers).length > 0 ? (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {Object.values(batch.modifiers).map((mod, i) => (
                                                    <span key={i} className="text-xs font-bold text-gray-400 border border-white/10 py-1 px-2 rounded bg-white/5 uppercase">
                                                        {mod}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 uppercase mt-1 font-bold">Standard</p>
                                        )}
                                     </div>
                                 </div>
                                 <div className="mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/5 md:pl-6">
                                     <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Pedidos ({batch.orders.length})</p>
                                     <div className="flex flex-wrap gap-2">
                                         {batch.orders.map((ord, i) => (
                                             <span key={i} className="text-xs font-mono text-white/70 bg-black/40 px-2 py-1 rounded border border-white/5">
                                                 {ord}
                                             </span>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            )}
        </>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
