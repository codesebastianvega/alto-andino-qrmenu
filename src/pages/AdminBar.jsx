import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../context/LocationContext';
import { useRestaurantSettings } from '../hooks/useRestaurantSettings';
import { printThermalDocument } from '../utils/thermalPrint';
import soundService from '../utils/soundService';

const playBarNotificationSound = () => {
  soundService.playNewOrder();
};

const playBarReadySound = () => {
  soundService.playOrderReady();
};

// Heurística de respaldo si el producto aún no tiene station explícito
const isBarItem = (item) => {
  if (!item) return false;
  const prod = item.products;
  if (!prod) return false;
  
  if (prod.station === 'bar') return true;
  if (prod.station === 'kitchen' || prod.station === 'none') return false;

  // Fallback por keywords si station aún no está configurado
  const name = (prod.name || '').toLowerCase();
  const desc = (prod.description || '').toLowerCase();
  const barKeywords = ['café', 'cafe', 'tinto', 'latte', 'capuchino', 'espresso', 'bebida', 'smoothie', 'jugo', 'coctel', 'cóctel', 'cocktail', 'gin', 'trago', 'cerveza', 'beer', 'vino', 'licor', 'soda', 'agua', 'hatsu', 'gaseosa', 'aromatica', 'aromática', 'té', 'infusion', 'mojito', 'margarita'];
  return barKeywords.some(kw => name.includes(kw) || desc.includes(kw));
};

function BarTimer({ createdAt }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      setMins(Math.floor((new Date() - new Date(createdAt)) / 60000));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  let color = 'text-cyan-400';
  if (mins >= 7) color = 'text-amber-400';
  if (mins >= 15) color = 'text-rose-500';

  return (
    <div className={`text-sm font-bold tracking-wide ${color} flex items-center gap-1.5`}>
      <Icon icon="heroicons:clock" />
      {mins} min
    </div>
  );
}

export default function AdminBar() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [viewMode, setViewMode] = useState('tower'); // 'tower' | 'batch' | 'all'
  const { settings: restaurantSettings } = useRestaurantSettings();

  const { activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocations();
  const activeBrandId = activeBrand?.id;

  const fetchBarOrders = useCallback(async (isSilent = false) => {
    if (!activeBrandId) return;
    try {
      if (!isSilent) setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          locations ( name ),
          restaurant_tables ( id, table_number ),
          order_items (
            id, product_id, quantity, unit_price, modifiers, notes, created_at,
            products ( id, name, description, station, requires_kitchen )
          )
        `)
        .in('status', ['new', 'preparing'])
        .eq('brand_id', activeBrandId)
        .match(!isAllLocations && activeLocationId ? { location_id: activeLocationId } : {});

      if (error) throw error;

      // Filtrar órdenes que tengan al menos 1 ítem de barra
      const barRelevantOrders = (data || []).filter(order => 
        order.order_items?.some(item => isBarItem(item))
      );

      // Multi-level Priority Sorting: Mesa (1) > Llevar (2) > Domicilio (3) > Time (asc)
      const sortedData = barRelevantOrders.sort((a, b) => {
        const priority = { 'dine_in': 1, 'takeaway': 2, 'delivery': 3 };
        const pA = priority[a.fulfillment_type] || 4;
        const pB = priority[b.fulfillment_type] || 4;
        
        if (pA !== pB) return pA - pB;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      setOrders(sortedData);
    } catch (err) {
      console.error('Error fetching bar orders:', err);
      toast('Error al cargar pedidos de barra');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId, isAllLocations, activeLocationId]);

  // Agrupado en Barra (Batch / Rondas): Crucial para bartenders y baristas
  const batchOrders = useMemo(() => {
    const batches = {};
    orders.filter(o => o.status === 'preparing' || o.status === 'new').forEach(order => {
      order.order_items?.filter(item => isBarItem(item)).forEach(item => {
        const mods = item.modifiers ? Object.entries(item.modifiers).sort((a, b) => a[0].localeCompare(b[0])) : [];
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
          ? `M${order.restaurant_tables?.table_number || '?'}` 
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
      toast('Bebidas en preparación');
    } catch (err) {
      console.error('Error updating order:', err);
      toast('Error al marcar como preparando');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const markAsReady = async (orderId) => {
    try {
      setUpdatingStatus(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast('¡Bebidas listas para servir!');
      playBarReadySound();
    } catch (err) {
      console.error('Error updating order:', err);
      toast('Error al marcar como listo');
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    if (!activeBrandId) return;
    if (!isAllLocations && !activeLocationId) return;

    fetchBarOrders();

    const channel = supabase
      .channel(`bar-${activeBrandId}-${activeLocationId || 'all'}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
        const isTargetLocation = isAllLocations || (payload.new && payload.new.location_id === activeLocationId);
        if (!isTargetLocation) return;

        if (payload.eventType === 'INSERT') {
          if (['new', 'preparing'].includes(payload.new.status)) {
            playBarNotificationSound();
            toast('¡Nuevo pedido para Barra / Coctelería!', {
              icon: '🍸',
              style: {
                borderRadius: '1rem',
                background: '#090d16',
                color: '#fff',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }
            });
            setTimeout(() => fetchBarOrders(true), 1000);
          }
        } else if (payload.eventType === 'UPDATE') {
          if (!['new', 'preparing'].includes(payload.new.status)) {
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
          } else {
            setTimeout(() => fetchBarOrders(true), 500);
          }
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'order_items',
        filter: `brand_id=eq.${activeBrandId}`
      }, () => {
        setTimeout(() => fetchBarOrders(true), 800);
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchBarOrders, activeBrandId, activeLocationId, isAllLocations]);

  const renderOrderCard = (order) => {
    const barItems = order.order_items?.filter(it => isBarItem(it)) || [];
    const kitchenItemsCount = (order.order_items || []).filter(it => !isBarItem(it)).length;

    if (barItems.length === 0) return null;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        key={order.id}
        className={`flex flex-col rounded-[2rem] transition-all duration-500 shadow-2xl relative overflow-hidden glass-bar border-2 ${
          order.status === 'preparing'
            ? 'border-cyan-500/50 shadow-cyan-950/40'
            : 'border-white/10 shadow-black/50'
        }`}
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Glow animado superior */}
        {order.status === 'preparing' && (
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500/0 via-cyan-400 to-cyan-500/0 animate-pulse z-10" />
        )}

        {/* Header del Ticket */}
        <div className="p-6 pb-4 relative z-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-[0.15em] border ${
                  order.status === 'preparing' 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                }`}>
                  {order.status === 'preparing' ? 'EN BARRA' : 'NUEVO'}
                </span>
                <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">
                  #{order.id.slice(0, 4)}
                </span>
                {kitchenItemsCount > 0 && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                    <span>🍳</span> +{kitchenItemsCount} cocina
                  </span>
                )}
                {isAllLocations && order.locations?.name && (
                  <span className="text-[10px] font-black px-3 py-1 bg-white/10 text-white/50 border border-white/20 rounded-full tracking-widest uppercase">
                    {order.locations.name}
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-white flex items-center gap-2 mt-1 uppercase">
                {order.fulfillment_type === 'dine_in' ? (
                  <>
                    <Icon icon="heroicons:map-pin-solid" className="text-cyan-400 text-lg" />
                    Mesa {order.restaurant_tables?.table_number || '??'}
                  </>
                ) : order.fulfillment_type === 'takeaway' ? (
                  <>
                    <Icon icon="heroicons:shopping-bag-solid" className="text-blue-400 text-lg" />
                    PARA LLEVAR
                  </>
                ) : (
                  <>
                    <Icon icon="heroicons:truck-solid" className="text-amber-400 text-xl" />
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
            <BarTimer createdAt={order.created_at} />
          </div>

          <div className={`h-px w-full mb-4 ${order.status === 'preparing' ? 'bg-cyan-500/20' : 'bg-white/10'}`} />

          {/* Lista de Bebidas de Barra */}
          <div className="space-y-3 max-h-[42vh] overflow-y-auto custom-scrollbar pr-2">
            {barItems.map((item, idx) => (
              <div key={idx} className="group/item flex gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all">
                <div className="flex flex-col items-center justify-center bg-black/60 rounded-xl px-2.5 py-1 min-w-[3rem] border border-cyan-500/30">
                  <span className="text-base font-black text-cyan-400 leading-none">{item.quantity}</span>
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Cant</span>
                </div>
                <div className="flex-1 py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black leading-tight uppercase text-white group-hover/item:text-cyan-300 transition-colors">
                      {item.products?.name}
                    </span>
                  </div>

                  {/* Modificadores (Leche, Hielo, Azúcar, etc.) */}
                  {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(item.modifiers).map(([group, choice]) => (
                        <div key={group} className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="text-cyan-300 font-black text-[10px] uppercase tracking-wider">{choice}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notas Especiales del Bar */}
                  {item.notes && (
                    <div className="mt-2.5 bg-amber-500/10 border-l-4 border-amber-400 p-2.5 rounded-r-xl">
                      <p className="text-amber-300 font-black text-[10px] uppercase mb-0.5 flex items-center gap-1">
                        <Icon icon="heroicons:exclamation-circle" className="text-xs" /> NOTA BARRA:
                      </p>
                      <p className="text-white font-bold text-xs italic leading-tight">"{item.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nota General de la Orden */}
        {order.notes && (
          <div className="px-6 py-2.5 bg-cyan-950/40 border-t border-b border-cyan-500/20">
            <p className="text-cyan-400 font-black text-[10px] uppercase mb-0.5">Nota de Mesa:</p>
            <p className="text-white/80 text-xs italic">{order.notes}</p>
          </div>
        )}

        {/* Botones Táctiles de Acción */}
        <div className="p-4 mt-auto">
          {restaurantSettings?.kitchen_print_enabled && (
            <button 
              onClick={() => printThermalDocument({ order, type: 'kitchen', width: restaurantSettings?.thermal_paper_width || '80', businessName: activeBrand?.name, business: activeBrand })} 
              className="w-full h-9 mb-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black border border-white/10 flex items-center justify-center gap-2"
            >
              <Icon icon="solar:printer-2-linear" /> IMPRIMIR BARRA
            </button>
          )}

          {order.status === 'new' ? (
            <button 
              onClick={() => markAsPreparing(order.id)}
              disabled={updatingStatus === order.id}
              className="w-full h-14 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-black rounded-[1.25rem] text-base uppercase tracking-[0.1em] transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-3 shadow-xl shadow-cyan-950/50 border border-cyan-400/40"
            >
              {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : <><Icon icon="heroicons:play-solid" className="text-2xl" /> PREPARAR TRAGOS</>}
            </button>
          ) : (
            <button 
              onClick={() => markAsReady(order.id)}
              disabled={updatingStatus === order.id}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-[1.25rem] text-base uppercase tracking-[0.1em] transition-all active:scale-95 shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3 disabled:opacity-50 border border-emerald-400/40"
            >
              {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : <><Icon icon="heroicons:check-circle-solid" className="text-2xl" /> BEBIDAS LISTAS</>}
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-white">
        <Icon icon="line-md:loading-loop" className="text-6xl mb-4 text-cyan-400" />
        <p className="text-xl font-black uppercase tracking-widest text-cyan-400/60">Sincronizando Barra (BDS)...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] p-3 sm:p-4 md:p-8 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] lg:pb-8 text-white overflow-x-hidden font-sans selection:bg-cyan-500/30">
      {/* Header Bar Display */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-white/5 relative">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-cyan-500/10 blur-[100px] pointer-events-none" />
        
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="bg-cyan-600/20 p-2.5 sm:p-3 rounded-2xl border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
            <span className="text-2xl sm:text-3xl">🍸</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white uppercase leading-none mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Bar Display <span className="text-cyan-400">System (BDS)</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <p className="text-cyan-400/80 font-black uppercase tracking-[0.2em] text-[10px]">Estación de Coctelería & Bebidas · En Vivo</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 relative z-10">
          {/* View Mode Toggles */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            {[
              { id: 'tower', label: 'Torre', icon: 'heroicons:squares-2x2-solid' },
              { id: 'all', label: 'Todo', icon: 'heroicons:list-bullet-solid' },
              { id: 'batch', label: 'Rondas (Batch)', icon: 'heroicons:rectangle-group-solid' }
            ].map(mode => (
              <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase transition-all duration-300 ${
                  viewMode === mode.id 
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 scale-[1.02]' 
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <Icon icon={mode.icon} className="text-base sm:text-lg" />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 bg-white/5 px-6 py-2.5 rounded-[1.25rem] border border-white/10 backdrop-blur-md">
            <div className="text-center">
              <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-0.5">En Barra</p>
              <p className="text-xl font-black text-cyan-400 leading-none">{orders.length}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <button 
              onClick={() => fetchBarOrders()} 
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all active:rotate-180 duration-500 text-white/40 hover:text-white"
            >
              <Icon icon="heroicons:arrow-path-solid" className="text-xl" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50dvh] relative">
          <div className="absolute inset-0 bg-cyan-500/5 blur-[120px] rounded-full" />
          <div className="relative bg-white/5 p-10 rounded-[3rem] border border-white/5 backdrop-blur-sm flex flex-col items-center">
            <span className="text-8xl mb-6 opacity-30">🍸</span>
            <h2 className="text-2xl font-black uppercase tracking-[0.25em] text-white/40 mb-2">Barra Despejada</h2>
            <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No hay bebidas pendientes en este momento</p>
          </div>
        </div>
      ) : (
        <motion.div layout className="relative">
          {viewMode === 'all' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              <AnimatePresence mode="popLayout">
                {orders.map(order => renderOrderCard(order))}
              </AnimatePresence>
            </div>
          )}

          {viewMode === 'tower' && (
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-10 items-start">
              {/* Nuevos en Barra */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-3">
                    <div className="p-1.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                      <Icon icon="heroicons:inbox-arrow-down-solid" /> 
                    </div>
                    Comandas Nuevas
                  </h2>
                  <div className="bg-sky-500/10 text-sky-400 font-extrabold px-5 py-2 rounded-2xl border border-sky-500/20 text-lg">
                    {orders.filter(o => o.status === 'new').length}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AnimatePresence mode="popLayout">
                    {orders.filter(o => o.status === 'new').map(order => renderOrderCard(order))}
                  </AnimatePresence>
                </div>
              </div>

              {/* En Preparación de Barra */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-3">
                    <div className="p-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                      <Icon icon="heroicons:beaker-solid" /> 
                    </div>
                    En Preparación
                  </h2>
                  <div className="bg-cyan-500/10 text-cyan-400 font-extrabold px-5 py-2 rounded-2xl border border-cyan-500/20 text-lg">
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
                    className="flex flex-col bg-white/5 p-6 rounded-[2.5rem] border border-cyan-500/20 backdrop-blur-xl shadow-2xl"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-cyan-500 text-slate-950 text-2xl font-black w-14 h-14 rounded-2xl shadow-lg shadow-cyan-500/30 flex items-center justify-center shrink-0">
                        {batch.totalQuantity}
                      </div>
                      <div>
                        <span className="text-sm font-black uppercase text-white tracking-tight">
                          {batch.name}
                        </span>

                        {batch.modifiers && Object.keys(batch.modifiers).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.values(batch.modifiers).map((choice, i) => (
                              <span key={i} className="text-[9px] font-black bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/20 uppercase">
                                {choice}
                              </span>
                            ))}
                          </div>
                        )}

                        {batch.notes && (
                          <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <Icon icon="heroicons:chat-bubble-bottom-center-text-solid" className="text-amber-400 text-[10px]" />
                            <p className="text-[9px] font-bold text-amber-300 italic uppercase">{batch.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <p className="text-cyan-400/80 text-[9px] font-black uppercase tracking-[0.2em]">Ronda de Preparación</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-3">Mesas Solicitantes ({batch.orders.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {batch.orders.map((ord, i) => (
                          <span key={i} className="text-[10px] font-black text-cyan-300 bg-cyan-500/10 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 uppercase">
                            {ord}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* Global CSS Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
        
        .glass-bar {
          background: rgba(10, 16, 30, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
      `}</style>
    </div>
  );
}
