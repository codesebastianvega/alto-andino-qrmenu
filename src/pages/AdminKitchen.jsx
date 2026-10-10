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

const playNotificationSound = () => {
  soundService.playNewOrder();
};

const playReadySound = () => {
  soundService.playOrderReady();
};

const isBarItem = (item) => {
  if (!item) return false;
  const prod = item.products;
  if (!prod) return false;
  if (prod.station === 'bar') return true;
  if (prod.station === 'kitchen' || prod.station === 'none') return false;
  const name = (prod.name || '').toLowerCase();
  const desc = (prod.description || '').toLowerCase();
  const barKeywords = ['café', 'cafe', 'tinto', 'latte', 'capuchino', 'espresso', 'bebida', 'smoothie', 'jugo', 'coctel', 'cóctel', 'cocktail', 'gin', 'trago', 'cerveza', 'beer', 'vino', 'licor', 'soda', 'agua', 'hatsu', 'gaseosa', 'aromatica', 'aromática', 'té'];
  return barKeywords.some(kw => name.includes(kw) || desc.includes(kw));
};

const isKitchenItem = (item) => {
  if (!item) return false;
  const prod = item.products;
  if (!prod) return false;
  if (prod.station === 'kitchen') return true;
  if (prod.station === 'bar' || prod.station === 'none') return false;
  if (prod.requires_kitchen === false) return false;
  return !isBarItem(item);
};

function TicketTimer({ createdAt }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      setMins(Math.floor((new Date() - new Date(createdAt)) / 60000));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (mins >= 10) badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (mins >= 20) badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';

  return (
    <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${badgeColor}`}>
      <Icon icon="heroicons:clock" className="text-xs" />
      {mins}m
    </div>
  );
}

export default function AdminKitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [viewMode, setViewMode] = useState('all'); // 'all' | 'new' | 'preparing' | 'batch'
  const [stationFilter, setStationFilter] = useState('kitchen'); // 'kitchen' | 'bar' | 'all'
  const { settings: restaurantSettings } = useRestaurantSettings();

  const { activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocations();
  const activeBrandId = activeBrand?.id;

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const fetchKitchenOrders = useCallback(async (isSilent = false) => {
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
  }, [activeBrandId, isAllLocations, activeLocationId]);

  // Filtrado de pedidos según estación seleccionada
  const stationOrders = useMemo(() => {
    if (stationFilter === 'all') return orders;
    if (stationFilter === 'bar') {
      return orders.filter(o => o.order_items?.some(it => isBarItem(it)));
    }
    return orders.filter(o => o.order_items?.some(it => isKitchenItem(it)));
  }, [orders, stationFilter]);

  // Filtrado según estado (por preparar / preparando / todos)
  const displayedOrders = useMemo(() => {
    if (viewMode === 'new') return stationOrders.filter(o => o.status === 'new');
    if (viewMode === 'preparing') return stationOrders.filter(o => o.status === 'preparing');
    return stationOrders;
  }, [stationOrders, viewMode]);

  // Rondas acumuladas (Batching)
  const batchOrders = useMemo(() => {
    const batches = {};
    const targetOrders = stationOrders.filter(o => o.status === 'preparing' || o.status === 'new');
    targetOrders.forEach(order => {
      const itemsToBatch = order.order_items?.filter(item => {
        if (stationFilter === 'kitchen') return isKitchenItem(item);
        if (stationFilter === 'bar') return isBarItem(item);
        return true;
      }) || [];

      itemsToBatch.forEach(item => {
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
  }, [stationOrders, stationFilter]);

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

  const markAsReady = async (orderId) => {
    try {
      setUpdatingStatus(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast('¡Pedido despachado!');
      playReadySound();
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

    fetchKitchenOrders();

    const channel = supabase
      .channel(`kitchen-${activeBrandId}-${activeLocationId || 'all'}`)
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
            playNotificationSound();
            toast('¡Nueva comanda en cocina!', { icon: '🔥' });
            setTimeout(() => fetchKitchenOrders(true), 1000);
          }
        } else if (payload.eventType === 'UPDATE') {
          if (!['new', 'preparing'].includes(payload.new.status)) {
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
          } else {
            setTimeout(() => fetchKitchenOrders(true), 500);
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
        setTimeout(() => fetchKitchenOrders(true), 800);
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchKitchenOrders, activeBrandId, activeLocationId, isAllLocations]);

  const renderOrderTicket = (order) => {
    const itemsToShow = order.order_items?.filter(it => {
      if (stationFilter === 'kitchen') return isKitchenItem(it);
      if (stationFilter === 'bar') return isBarItem(it);
      return true;
    }) || [];

    const otherItemsCount = (order.order_items || []).length - itemsToShow.length;
    if (itemsToShow.length === 0) return null;

    const isPreparing = order.status === 'preparing';

    return (
      <div 
        key={order.id}
        className={`flex flex-col bg-[#111827] rounded-xl border transition-all shadow-md overflow-hidden ${
          isPreparing 
            ? 'border-emerald-500/50 shadow-emerald-950/20' 
            : 'border-gray-800 hover:border-gray-700'
        }`}
      >
        {/* Top Status Stripe */}
        <div className={`h-1 w-full ${isPreparing ? 'bg-emerald-500' : 'bg-blue-500'}`} />

        {/* Ticket Header */}
        <div className="p-3.5 pb-2.5 border-b border-gray-800/80 bg-gray-900/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {order.fulfillment_type === 'dine_in' ? (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black px-2 py-0.5 rounded uppercase">
                  Mesa {order.restaurant_tables?.table_number || '?'}
                </span>
              ) : order.fulfillment_type === 'takeaway' ? (
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black px-2 py-0.5 rounded uppercase">
                  Llevar
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black px-2 py-0.5 rounded uppercase">
                  Domicilio
                </span>
              )}

              <span className="text-gray-400 font-mono text-xs font-bold">
                #{order.id.slice(0, 4)}
              </span>

              {stationFilter === 'kitchen' && otherItemsCount > 0 && (
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.2 rounded">
                  🍸 +{otherItemsCount} bar
                </span>
              )}
              {stationFilter === 'bar' && otherItemsCount > 0 && (
                <span className="text-[10px] font-semibold text-orange-400 bg-orange-950/60 border border-orange-800/50 px-1.5 py-0.2 rounded">
                  🍳 +{otherItemsCount} cocina
                </span>
              )}
            </div>

            <TicketTimer createdAt={order.created_at} />
          </div>

          {order.customer_name && (
            <p className="text-gray-400 text-xs font-medium truncate mt-1">
              Cliente: <span className="text-gray-200">{order.customer_name}</span>
            </p>
          )}
        </div>

        {/* Ticket Items List */}
        <div className="p-3.5 space-y-2.5 flex-1 min-h-[140px] max-h-[45vh] overflow-y-auto">
          {itemsToShow.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 py-1 border-b border-gray-800/40 last:border-0">
              <span className="w-6 h-6 rounded bg-gray-800 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                {item.quantity}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <p className="text-sm font-bold text-white uppercase leading-tight truncate">
                    {item.products?.name}
                  </p>
                  {stationFilter === 'all' && (
                    <span className={`text-[9px] font-bold px-1 rounded uppercase shrink-0 ${
                      isBarItem(item) ? 'text-cyan-400 bg-cyan-950' : 'text-orange-400 bg-orange-950'
                    }`}>
                      {isBarItem(item) ? 'Bar' : 'Cocina'}
                    </span>
                  )}
                </div>

                {/* Modificadores */}
                {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(item.modifiers).map(([group, choice]) => (
                      <span key={group} className="text-[11px] text-amber-300 font-medium">
                        • {choice}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notas de Ítem */}
                {item.notes && (
                  <div className="mt-1 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 rounded px-2 py-0.5">
                    ⚠️ {item.notes}
                  </div>
                )}
              </div>
            </div>
          ))}

          {order.notes && (
            <div className="text-xs text-blue-300 bg-blue-950/30 border border-blue-900/40 rounded p-2 mt-2">
              <span className="font-bold">Nota General:</span> {order.notes}
            </div>
          )}
        </div>

        {/* Ticket Action Footer */}
        <div className="p-2.5 pt-2 border-t border-gray-800/80 bg-gray-900/40 flex items-center gap-2">
          {restaurantSettings?.kitchen_print_enabled && (
            <button
              onClick={() => printThermalDocument({ order, type: 'kitchen', width: restaurantSettings?.thermal_paper_width || '80', businessName: activeBrand?.name, business: activeBrand })}
              title="Imprimir comanda térmica"
              className="h-10 px-3 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-800/60 text-gray-300 hover:text-white flex items-center justify-center transition-all"
            >
              <Icon icon="solar:printer-2-linear" className="text-base" />
            </button>
          )}

          {order.status === 'new' ? (
            <button
              onClick={() => markAsPreparing(order.id)}
              disabled={updatingStatus === order.id}
              className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
            >
              {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : 'Iniciar Preparación'}
            </button>
          ) : (
            <button
              onClick={() => markAsReady(order.id)}
              disabled={updatingStatus === order.id}
              className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
            >
              {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : 'Marcar Listo ✓'}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Icon icon="line-md:loading-loop" className="text-4xl mb-3 text-emerald-500" />
        <p className="text-sm font-bold uppercase tracking-wider">Cargando comandas...</p>
      </div>
    );
  }

  const activeCount = stationOrders.length;
  const newCount = stationOrders.filter(o => o.status === 'new').length;
  const preparingCount = stationOrders.filter(o => o.status === 'preparing').length;

  return (
    <div className="min-h-screen bg-[#090d16] p-3 sm:p-5 text-gray-100 font-sans">
      {/* Top Professional Control Bar */}
      <div className="mb-4 pb-3 border-b border-gray-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Station & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍳</span>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
              KDS <span className="text-emerald-400">Cocina</span>
            </h1>
          </div>

          {/* Selector de Estación */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-0.5">
            {[
              { id: 'kitchen', label: 'Cocina', emoji: '🍳' },
              { id: 'bar', label: 'Barra', emoji: '🍸' },
              { id: 'all', label: 'Pase Expo', emoji: '📋' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStationFilter(st.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                  stationFilter === st.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>{st.emoji}</span>
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: View Modes & Quick Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtros de Estado */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-0.5">
            {[
              { id: 'all', label: 'Todos', count: activeCount },
              { id: 'new', label: 'En Cola', count: newCount },
              { id: 'preparing', label: 'En Fuego', count: preparingCount },
              { id: 'batch', label: 'Rondas' }
            ].map(vm => (
              <button
                key={vm.id}
                onClick={() => setViewMode(vm.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  viewMode === vm.id
                    ? 'bg-gray-800 text-white shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>{vm.label}</span>
                {vm.count !== undefined && (
                  <span className={`text-[10px] px-1 rounded font-mono ${
                    viewMode === vm.id ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {vm.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => fetchKitchenOrders()}
              title="Refrescar comanda"
              className="w-8 h-7 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <Icon icon="heroicons:arrow-path" className="text-sm" />
            </button>
            <button
              onClick={toggleFullScreen}
              title="Pantalla Completa"
              className="w-8 h-7 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <Icon icon="heroicons:arrows-pointing-out" className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {viewMode === 'batch' ? (
        /* Vista de Rondas / Agrupados */
        batchOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <p className="text-sm font-medium">No hay productos agrupados en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {batchOrders.map((batch, idx) => (
              <div key={idx} className="bg-gray-900/90 border border-gray-800 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-white uppercase leading-tight">
                      {batch.name}
                    </p>
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-base font-black flex items-center justify-center shrink-0">
                      {batch.totalQuantity}
                    </span>
                  </div>

                  {batch.modifiers && Object.keys(batch.modifiers).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.values(batch.modifiers).map((mod, i) => (
                        <span key={i} className="text-[10px] text-amber-300 font-medium">
                          • {mod}
                        </span>
                      ))}
                    </div>
                  )}

                  {batch.notes && (
                    <p className="text-xs text-rose-300 italic mb-2">⚠️ {batch.notes}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Mesas:</span>
                  {batch.orders.map((ord, i) => (
                    <span key={i} className="text-[10px] bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {ord}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Vista de Tickets Grid */
        displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Icon icon="heroicons:check-badge" className="text-5xl text-gray-700 mb-2" />
            <p className="text-sm font-bold uppercase tracking-wider text-gray-400">Todo Al Día</p>
            <p className="text-xs text-gray-600 mt-0.5">No hay comandas pendientes para esta estación</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
            {displayedOrders.map(order => renderOrderTicket(order))}
          </div>
        )
      )}
    </div>
  );
}
