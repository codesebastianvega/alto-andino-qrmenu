import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

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
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [viewMode, setViewMode] = useState('tower'); // 'tower' | 'batch' | 'all'
  const [restaurantSettings, setRestaurantSettings] = useState(null);

  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const fetchKitchenOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant_tables ( id, table_number ),
          order_items (
            id, product_id, quantity, unit_price, modifiers, notes,
            products ( id, name, description )
          )
        `)
        .in('status', ['new', 'preparing'])
        .eq('brand_id', activeBrandId)
      if (error) throw error;
      
      // Multi-level Priority Sorting: Mesa (1) > Llevar (2) > Domicilio (3) > Time (asc)
      const sortedData = (data || []).sort((a, b) => {
        const priority = { 'dine_in': 1, 'takeaway': 2, 'delivery': 3 };
        const pA = priority[a.fulfillment_type] || 4;
        const pB = priority[b.fulfillment_type] || 4;
        
        if (pA !== pB) return pA - pB;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      setOrders(sortedData);
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
      toast('Error al cargar pedidos de cocina');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId]);

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

  const batchOrders = React.useMemo(() => {
    const batches = {};
    orders.filter(o => o.status === 'preparing').forEach(order => {
        order.order_items?.forEach(item => {
            const mods = item.modifiers ? Object.entries(item.modifiers).sort((a,b) => a[0].localeCompare(b[0])) : [];
            const variantKey = `${item.product_id}-${JSON.stringify(mods)}-${item.notes || ''}`;
            
            if (!batches[variantKey]) {
                batches[variantKey] = { 
                    name: item.products?.name, 
                    totalQuantity: 0, 
                    productId: item.product_id,
                    description: item.products?.description,
                    modifiers: item.modifiers,
                    notes: item.notes,
                    orders: []
                };
            }
            batches[variantKey].totalQuantity += item.quantity;
            const orderLabel = order.fulfillment_type === 'dine_in' 
                ? `M${order.restaurant_tables?.table_number}` 
                : order.fulfillment_type === 'takeaway' ? 'LLEVAR' : 'DOM';
            batches[variantKey].orders.push(orderLabel);
        });
    });
    return Object.values(batches);
}, [orders]);

  const markAsPreparing = async (orderId) => {
    try {
      setUpdatingStatus(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o));
      toast('Pedido en preparación');
    } catch (err) {
      console.error('Error updating order:', err);
      toast('Error al marcar como preparando');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const ProductCompositionModal = ({ product, onClose }) => {
    const [ingredients, setIngredients] = useState([]);
    const [loadingIngredients, setLoadingIngredients] = useState(true);

    useEffect(() => {
      const fetchIngredients = async () => {
        try {
          setLoadingIngredients(true);
          const { data, error } = await supabase
            .from('product_ingredients')
            .select(`
              quantity,
              ingredients ( name, usage_unit )
            `)
            .eq('product_id', product.id);
          
          if (error) throw error;
          setIngredients(data || []);
        } catch (err) {
          console.error('Error fetching ingredients:', err);
        } finally {
          setLoadingIngredients(false);
        }
      };

      if (product?.id) fetchIngredients();
    }, [product]);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Composición del Producto</p>
              <h3 className="text-xl font-black text-white uppercase">{product.name}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors">
              <Icon icon="heroicons:x-mark-solid" className="text-2xl" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Description Section - ALWAYS VISIBLE */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Icon icon="heroicons:document-text-solid" />
                Descripción
              </p>
              <p className="text-sm font-medium text-white/80 leading-relaxed italic">
                {product.description || "Sin descripción disponible."}
              </p>
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {loadingIngredients ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <Icon icon="line-md:loading-loop" className="text-3xl text-emerald-500" />
                <p className="text-[10px] text-white/40 font-black uppercase">Cargando Receta...</p>
              </div>
            ) : ingredients.length > 0 ? (
              <div className="grid gap-2">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 ml-1 flex items-center gap-2">
                  <Icon icon="heroicons:beaker-solid" />
                  Ingredientes & Cantidades
                </p>
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-sm font-bold text-white uppercase">{ing.ingredients?.name}</span>
                    <span className="text-xs font-black text-emerald-400">
                      {ing.quantity} {ing.ingredients?.usage_unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                <Icon icon="heroicons:information-circle-solid" className="text-3xl text-white/10 mb-2 mx-auto" />
                <p className="text-[10px] text-white/40 font-black uppercase tracking-wider px-4 mb-2">Receta no vinculada</p>
                <p className="text-[9px] text-white/20 uppercase font-bold px-6">Consulta la descripción anterior para ver la composición general.</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/10 transition-all"
          >
            Entendido
          </button>
        </motion.div>
      </motion.div>
    );
  };

  const markAsReady = async (orderId) => {
    try {
      setUpdatingStatus(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', orderId);
      
      if (error) throw error;
      // We'll let the realtime subscription handle the removal or do it manually for immediate feedback
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast('¡Pedido listo para entregar!');
      playNotificationSound(); // Success sound
    } catch (err) {
      console.error('Error updating order:', err);
      toast('Error al marcar como listo');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const renderOrderCard = (order) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      key={order.id}
      className={`flex flex-col rounded-[2rem] transition-all duration-500 shadow-2xl relative overflow-hidden glass-premium border-2 ${
        order.status === 'preparing'
          ? 'border-emerald-500/40 shadow-emerald-500/10'
          : 'border-white/5 shadow-black/40'
      }`}
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Visual Status Indicator Glow */}
      {order.status === 'preparing' && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 animate-pulse z-10" />
      )}

      {/* Header Area */}
      <div className="p-6 pb-4 relative z-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-[0.15em] border ${
                order.status === 'preparing' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {order.status === 'preparing' ? 'EN PROCESO' : 'NUEVO'}
              </span>
              {order?.payment_status !== 'paid' && 
               (restaurantSettings?.payment_requirement_stage === 'pre_preparation' || 
                restaurantSettings?.payment_requirement_stage === 'pre_delivery') && (
                <span className="text-[10px] font-black px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full tracking-widest animate-pulse">
                   POR PAGAR
                </span>
              )}
              <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">
                #{order.id.slice(0, 4)}
              </span>
            </div>
            <h3 className="text-base font-black text-white flex items-center gap-2 mt-1 uppercase">
              {order.fulfillment_type === 'dine_in' ? (
                <>
                  <Icon icon="heroicons:map-pin-solid" className="text-emerald-500 text-lg" />
                  Mesa {order.restaurant_tables?.table_number || '??'}
                </>
              ) : order.fulfillment_type === 'takeaway' ? (
                <>
                  <Icon icon="heroicons:shopping-bag-solid" className="text-blue-500 text-lg" />
                  PARA LLEVAR
                </>
              ) : (
                <>
                  <Icon icon="heroicons:truck-solid" className="text-orange-500 text-xl" />
                  DOMICILIO
                </>
              )}
            </h3>
            {order.customer_name && (
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-0.5">
                {order.customer_name}
              </p>
            )}
          </div>
          <KitchenTimer createdAt={order.created_at} />
        </div>

        {/* Separator with dynamic color */}
        <div className={`h-px w-full mb-4 ${order.status === 'preparing' ? 'bg-emerald-500/20' : 'bg-white/10'}`} />

        {/* Items List */}
        <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
          {order.order_items?.map((item, idx) => (
            <div key={idx} className="group/item flex gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all">
              <div className="flex flex-col items-center justify-center bg-black/40 rounded-xl px-2 py-1 min-w-[3rem] border border-white/10">
                <span className="text-base font-black text-emerald-400 leading-none">{item.quantity}</span>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Cant</span>
              </div>
              <div className="flex-1 py-0.5">
                <button 
                  onClick={() => setSelectedProduct(item.products)}
                  className="text-xs font-black leading-tight uppercase text-white group-hover/item:text-emerald-400 transition-colors text-left"
                >
                  {item.products?.name}
                </button>
                
                {/* Modifiers List - HIGH VISIBILITY */}
                {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                     {Object.entries(item.modifiers).map(([group, choice]) => (
                       <div key={group} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-md">
                         <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                         <span className="text-yellow-400/90 font-black text-[10px] uppercase tracking-wider">{choice}</span>
                       </div>
                     ))}
                  </div>
                )}

                {/* Notes - URGENT LOOK */}
                {item.notes && (
                  <div className="mt-3 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r-xl shadow-lg shadow-red-950/20">
                    <p className="text-red-400 font-black text-[10px] uppercase mb-1 flex items-center gap-1.5">
                      <Icon icon="heroicons:exclamation-circle" className="text-sm" /> ATENCIÓN:
                    </p>
                    <p className="text-white font-bold text-xs italic leading-relaxed">"{item.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Order Note (if any) */}
      {order.notes && (
        <div className="px-6 py-3 bg-blue-500/10 border-t border-b border-blue-500/20">
          <p className="text-blue-400 font-black text-[10px] uppercase mb-1">Nota General:</p>
          <p className="text-white text-sm font-medium italic">{order.notes}</p>
        </div>
      )}

      {/* Action Footer (Massive Tactile Buttons) */}
      <div className="p-4 mt-auto">
        {order.status === 'new' ? (
          <button 
            onClick={() => markAsPreparing(order.id)}
            disabled={updatingStatus === order.id}
            className="w-full h-14 bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black rounded-[1.25rem] text-base uppercase tracking-[0.1em] transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-3 shadow-2xl shadow-blue-900/40 border border-blue-400/30"
          >
            {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : <><Icon icon="heroicons:play-solid" className="text-2xl" /> EMPEZAR</>}
          </button>
        ) : (
          <div className="flex gap-3">
             <button 
                onClick={() => markAsReady(order.id)}
                disabled={updatingStatus === order.id}
                className="flex-1 h-14 bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-[1.25rem] text-base uppercase tracking-[0.1em] transition-all active:scale-95 shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-3 disabled:opacity-50 border border-emerald-400/30"
              >
                {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : <><Icon icon="heroicons:check-circle-solid" className="text-2xl" /> LISTO</>}
              </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  useEffect(() => {
    fetchKitchenOrders();

    const channel = supabase
      .channel(`kitchen-${activeBrandId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
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
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'order_items',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => {
        fetchKitchenOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchKitchenOrders]);


  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <Icon icon="line-md:loading-loop" className="text-6xl mb-4 text-emerald-500" />
        <p className="text-xl font-black uppercase tracking-widest text-emerald-500/50">Sincronizando Cocina...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-white overflow-x-hidden font-sans selection:bg-emerald-500/30">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5 relative">
        {/* Header Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-emerald-500/10 blur-[100px] pointer-events-none" />
        
        <div className="flex items-center gap-5">
          <div className="bg-emerald-600/20 p-3 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Icon icon="heroicons:fire-solid" className="text-3xl text-emerald-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white uppercase leading-none mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Digital <span className="text-emerald-500">Tickets</span>
            </h1>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <p className="text-emerald-500/80 font-black uppercase tracking-[0.2em] text-[10px]">Staff Ops Center · Live</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 relative z-10">
            {/* View Mode Toggles */}
            <div className="flex bg-white/5 p-1.5 rounded-[1.25rem] border border-white/10 backdrop-blur-md">
                {[
                  { id: 'tower', label: 'Torre', icon: 'heroicons:squares-2x2-solid' },
                  { id: 'all', label: 'Todo', icon: 'heroicons:list-bullet-solid' },
                  { id: 'batch', label: 'Agrupados', icon: 'heroicons:rectangle-group-solid' }
                ].map(mode => (
                  <button 
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all duration-300 ${
                      viewMode === mode.id 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-105' 
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <Icon icon={mode.icon} className="text-lg" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-6 bg-white/5 px-6 py-2.5 rounded-[1.25rem] border border-white/10 backdrop-blur-md">
                <div className="text-center">
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-0.5">Pendientes</p>
                    <p className="text-xl font-black text-white leading-none">{orders.length}</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <button 
                  onClick={fetchKitchenOrders} 
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all active:rotate-180 duration-500 text-white/40 hover:text-white"
                >
                    <Icon icon="heroicons:arrow-path-solid" className="text-xl" />
                </button>
            </div>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50dvh] relative">
          <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full" />
          <div className="relative bg-white/5 p-10 rounded-[3rem] border border-white/5 backdrop-blur-sm flex flex-col items-center">
            <Icon icon="heroicons:check-badge-solid" className="text-9xl text-emerald-500/20 mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-[0.25em] text-white/40 mb-2">Todo Al Día</h2>
            <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No hay pedidos pendientes en este momento</p>
          </div>
        </div>
      ) : (
        <motion.div 
          layout
          className="relative"
        >
            {viewMode === 'all' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                    <AnimatePresence mode="popLayout">
                        {orders.map(order => renderOrderCard(order))}
                    </AnimatePresence>
                </div>
            )}

            {viewMode === 'tower' && (
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-10 items-start">
                    {/* Nuevos Column */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-4">
                            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                <div className="p-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <Icon icon="heroicons:inbox-arrow-down-solid" className="text-blue-500" /> 
                                </div>
                                Por Preparar
                            </h2>
                            <div className="bg-blue-500/10 text-blue-400 font-extrabold px-5 py-2 rounded-2xl border border-blue-500/20 text-lg shadow-inner">
                                {orders.filter(o => o.status === 'new').length}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <AnimatePresence mode="popLayout">
                                {orders.filter(o => o.status === 'new').map(order => renderOrderCard(order))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Preparando Column */}
                    <div className="flex flex-col gap-6">
                         <div className="flex items-center justify-between px-4">
                            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                <div className="p-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <Icon icon="heroicons:fire-solid" className="text-emerald-500" /> 
                                </div>
                                EN FUEGO
                            </h2>
                            <div className="bg-emerald-500/10 text-emerald-400 font-extrabold px-5 py-2 rounded-2xl border border-emerald-500/20 text-lg shadow-inner">
                                {orders.filter(o => o.status === 'preparing').length}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <AnimatePresence mode="popLayout">
                                {orders.filter(o => o.status === 'preparing').map(order => renderOrderCard(order))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'batch' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                         {batchOrders.map((batch, idx) => (
                             <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={idx} 
                                className="flex flex-col bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl"
                             >
                                 <div className="flex items-center gap-4 mb-4">
                                     <div className="bg-yellow-500 text-black text-2xl font-black w-12 h-12 rounded-xl shadow-lg shadow-yellow-500/20 flex items-center justify-center shrink-0">
                                         {batch.totalQuantity}
                                     </div>
                                     <div>
                                          <button
                                            onClick={() => setSelectedProduct({ 
                                                id: batch.productId, 
                                                name: batch.name,
                                                description: batch.description 
                                            })}
                                            className="text-left"
                                          >
                                            <span className="text-xs font-black uppercase text-white tracking-tight hover:text-emerald-400 transition-colors">
                                              {batch.name}
                                            </span>
                                          </button>
                                        
                                        {/* Modifiers for this batch */}
                                        {batch.modifiers && Object.keys(batch.modifiers).length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {Object.values(batch.modifiers).map((choice, i) => (
                                              <span key={i} className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/20 uppercase">
                                                {choice}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        {/* Notes for this batch */}
                                        {batch.notes && (
                                          <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
                                            <Icon icon="heroicons:chat-bubble-bottom-center-text-solid" className="text-yellow-500 text-[10px]" />
                                            <p className="text-[9px] font-bold text-yellow-500/80 italic leading-tight uppercase">{batch.notes}</p>
                                          </div>
                                        )}

                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                            <p className="text-yellow-500/70 text-[9px] font-black uppercase tracking-[0.2em]">Acumulado Crítico</p>
                                        </div>
                                     </div>
                                 </div>

                                 <div className="space-y-4">
                                     <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                         <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-3">Especificaciones</p>
                                         {batch.modifiers && Object.keys(batch.modifiers).length > 0 ? (
                                             <div className="flex flex-wrap gap-2">
                                                 {Object.values(batch.modifiers).map((mod, i) => (
                                                     <span key={i} className="text-xs font-black text-white bg-white/10 py-1.5 px-3 rounded-xl border border-white/10 uppercase tracking-wider">
                                                         {mod}
                                                     </span>
                                                 ))}
                                             </div>
                                         ) : (
                                             <p className="text-xs text-white/20 uppercase font-black tracking-widest">Sin Modificadores</p>
                                         )}
                                     </div>

                                     <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                         <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-3">Distribuido en {batch.orders.length} pedidos</p>
                                         <div className="flex flex-wrap gap-2">
                                             {batch.orders.map((ord, i) => (
                                                 <span key={i} className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 uppercase">
                                                     {ord}
                                                 </span>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             </motion.div>
                         ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
      )}

      {/* Product Composition Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductCompositionModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>

      {/* Global Aesthetics */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .glass-premium {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
