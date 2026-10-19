import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { useLocations } from '../context/LocationContext';
import { useRestaurantSettings } from '../hooks/useRestaurantSettings';
import { printThermalDocument } from '../utils/thermalPrint';
import soundService from '../utils/soundService';
import { NewOrderAlertModal } from '../components/admin/NewOrderAlertModal';

const playBarNotificationSound = () => {
  soundService.playNewOrder();
};

const playBarReadySound = () => {
  soundService.playOrderReady();
};

const isBarItem = (item) => {
  if (!item) return false;
  const prod = item.products;
  if (!prod) return false;
  const station = (prod.station || '').toLowerCase();
  if (station === 'bar') return true;
  if (station === 'kitchen' || station === 'none') return false;

  const name = (prod.name || '').toLowerCase();
  const desc = (prod.description || '').toLowerCase();
  const barKeywords = ['café', 'cafe', 'tinto', 'latte', 'capuchino', 'espresso', 'bebida', 'smoothie', 'jugo', 'coctel', 'cóctel', 'cocktail', 'gin', 'trago', 'cerveza', 'beer', 'vino', 'licor', 'soda', 'agua', 'hatsu', 'gaseosa', 'aromatica', 'aromática', 'té', 'coca-cola', 'refajo', 'cold brew', 'chai', 'milo', 'schweppes'];
  return barKeywords.some(kw => name.includes(kw) || desc.includes(kw));
};

const isKitchenItem = (item) => {
  if (!item) return false;
  const prod = item.products;
  if (!prod) return false;
  const station = (prod.station || '').toLowerCase();
  if (station === 'kitchen') return true;
  if (station === 'bar' || station === 'none') return false;
  if (prod.requires_kitchen === false) return false;
  return !isBarItem(item);
};

function BarTicketTimer({ createdAt, isDark, targetMins = 10 }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      setMins(Math.max(0, Math.floor((new Date() - new Date(createdAt)) / 60000)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const isOverdue = mins > targetMins;
  const isWarning = mins >= Math.floor(targetMins * 0.7);

  let badgeColor = isDark 
    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' 
    : 'text-cyan-800 bg-cyan-50 border-cyan-200 font-bold';

  if (isWarning && !isOverdue) {
    badgeColor = isDark 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
      : 'text-amber-800 bg-amber-50 border-amber-200 font-bold';
  }
  if (isOverdue) {
    badgeColor = isDark 
      ? 'text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse font-black' 
      : 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse font-black';
  }

  return (
    <div className={`text-xs font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${badgeColor}`}>
      <Icon icon={isOverdue ? "heroicons:exclamation-triangle" : "heroicons:clock"} className="text-xs" />
      <span>{mins}m</span>
      {isOverdue && (
        <span className="text-[10px] ml-0.5 opacity-90">
          (+{mins - targetMins}m)
        </span>
      )}
    </div>
  );
}

export default function AdminBar() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const [viewMode, setViewMode] = useState('all'); // 'all' | 'new' | 'preparing' | 'batch'
  const [stationFilter, setStationFilter] = useState('bar'); // 'bar' | 'kitchen' | 'all'

  // Tema claro tipo Bistró Nórdico por defecto, sincronizado con KDS
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('aluna_kds_dark') === 'true';
    } catch {
      return false;
    }
  });

  const { settings: restaurantSettings } = useRestaurantSettings();
  const { activeBrand, profile } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const { activeLocationId, isAllLocations } = useLocations();
  const activeBrandId = activeBrand?.id || brandFromContext?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const [isSoundLoopActive, setIsSoundLoopActive] = useState(false);
  const [incomingOrdersQueue, setIncomingOrdersQueue] = useState([]);
  const [incomingOrderIndex, setIncomingOrderIndex] = useState(0);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  useEffect(() => {
    const handleLoopChange = (e) => {
      setIsSoundLoopActive(Boolean(e.detail?.active));
    };
    window.addEventListener('aluna:sound-loop-changed', handleLoopChange);
    return () => window.removeEventListener('aluna:sound-loop-changed', handleLoopChange);
  }, []);

  const handleAcceptIncomingOrder = async (orderId) => {
    soundService.stopNewOrderLoop();
    setIsSoundLoopActive(false);

    await markAsPreparing(orderId);

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
  };

  const handleReviewIncomingOrder = (order) => {
    soundService.stopNewOrderLoop();
    setIsSoundLoopActive(false);
    setIsAlertModalOpen(false);
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      try { localStorage.setItem('aluna_kds_dark', String(next)); } catch {}
      return next;
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const fetchBarOrders = useCallback(async (isSilent = false) => {
    if (!activeBrandId) return;
    try {
      if (!isSilent) setLoading(true);
      let query = supabase
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
        .neq('bar_status', 'none')
        .eq('brand_id', activeBrandId);

      if (!isAllLocations && activeLocationId) {
        query = query.or(`location_id.eq.${activeLocationId},location_id.is.null`);
      }

      const { data, error } = await query;
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
      console.error('Error fetching bar orders:', err);
      toast('Error al cargar pedidos de barra');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId, isAllLocations, activeLocationId]);

  // Filtrado de pedidos según estación
  const stationOrders = useMemo(() => {
    // Si la barra ya despachó sus bebidas o la orden no requiere barra, no debe aparecer en BDS
    const activeBarOrders = orders.filter(o => o.bar_status !== 'ready' && o.bar_status !== 'none');
    if (stationFilter === 'kitchen') {
      return activeBarOrders.filter(o => o.order_items?.some(it => isKitchenItem(it)));
    }
    // En BDS sólo se muestran órdenes que tengan bebidas o tragos
    return activeBarOrders.filter(o => o.order_items?.some(it => isBarItem(it)));
  }, [orders, stationFilter]);

  const displayedOrders = useMemo(() => {
    if (viewMode === 'new') return stationOrders.filter(o => o.status === 'new');
    if (viewMode === 'preparing') return stationOrders.filter(o => o.status === 'preparing');
    return stationOrders;
  }, [stationOrders, viewMode]);

  // Rondas acumuladas para bartenders
  const batchOrders = useMemo(() => {
    const batches = {};
    const targetOrders = stationOrders.filter(o => o.status === 'preparing' || o.status === 'new');
    targetOrders.forEach(order => {
      const itemsToBatch = order.order_items?.filter(item => {
        if (stationFilter === 'bar') return isBarItem(item);
        if (stationFilter === 'kitchen') return isKitchenItem(item);
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
        .update({ bar_status: 'preparing', status: 'preparing' })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, bar_status: 'preparing', status: 'preparing' } : o));
      toast('🍸 Bebidas en preparación en barra');
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
      const currentOrder = orders.find(o => o.id === orderId);
      const hasKitchenItems = currentOrder?.order_items?.some(it => isKitchenItem(it));
      // Kitchen is complete if the order doesn't require kitchen, or kitchen_status is already 'ready' or 'none'
      const isKitchenDone = !hasKitchenItems || !currentOrder?.kitchen_status || currentOrder.kitchen_status === 'ready' || currentOrder.kitchen_status === 'none';

      const updatePayload = {
        bar_status: 'ready',
        bar_ready_at: new Date().toISOString()
      };

      if (isKitchenDone) {
        updatePayload.status = 'ready';
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (isKitchenDone) {
        toast('🎉 ¡Bebidas y pedido completamente listos!');
      } else {
        toast('🍸 ¡Bebidas listas! Cocina sigue preparando los platos 🍳', { icon: '🍳' });
      }
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

    fetchBarOrders();

    const channel = supabase
      .channel(`bar-${activeBrandId}-${activeLocationId || 'all'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
        const isTargetLocation = isAllLocations || activeLocationId === 'all' || !activeLocationId || !payload.new?.location_id || (payload.new && payload.new.location_id === activeLocationId);
        if (!isTargetLocation) return;

        if (payload.eventType === 'INSERT') {
          // Si el pedido no requiere barra (ej. no tiene bebidas), ignorar en BDS
          if (payload.new.bar_status === 'none') return;

          if (['new', 'preparing'].includes(payload.new.status) && payload.new.bar_status !== 'ready') {
            soundService.startNewOrderLoop(3500);
            setIsSoundLoopActive(true);
            toast('¡Nueva comanda en barra!', { icon: '🍸' });

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
                      products ( id, name, category_id, station, requires_kitchen )
                    ),
                    order_payments (*)
                  `)
                  .eq('id', payload.new.id)
                  .single();

                if (fullOrder) {
                  const hasBar = (fullOrder.order_items || []).some(it => isBarItem(it));
                  if (hasBar || fullOrder.bar_status === 'pending' || (fullOrder.bar_status !== 'none' && fullOrder.bar_status !== 'ready')) {
                    setIncomingOrdersQueue(prev => {
                      const exists = prev.some(o => o.id === fullOrder.id);
                      return exists ? prev : [...prev, fullOrder];
                    });
                    setIsAlertModalOpen(true);
                  }
                }
              } catch (err) {
                console.error('Error cargando detalles comanda barra:', err);
              }
            }, 450);

            setTimeout(() => fetchBarOrders(true), 1000);
          }
        } else if (payload.eventType === 'UPDATE') {
          // Notification when Kitchen finishes food for this order!
          if (payload.new.kitchen_status === 'ready' && payload.old?.kitchen_status !== 'ready') {
            playBarReadySound();
            toast('🍳 ¡Cocina ya tiene listos los platos!', { icon: '🍳' });
          }

          if (!['new', 'preparing'].includes(payload.new.status) || payload.new.bar_status === 'ready' || payload.new.bar_status === 'none') {
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
          } else {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
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

  const renderOrderTicket = (order) => {
    const itemsToShow = order.order_items?.filter(it => {
      if (stationFilter === 'bar') return isBarItem(it);
      if (stationFilter === 'kitchen') return isKitchenItem(it);
      return true;
    }) || [];

    const otherItemsCount = (order.order_items || []).length - itemsToShow.length;
    if (itemsToShow.length === 0) return null;

    const isPreparing = order.status === 'preparing';

    return (
      <div
        key={order.id}
        className={`flex flex-col rounded-xl border transition-all overflow-hidden ${
          isDark
            ? `bg-[#111827] ${isPreparing ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/20' : 'border-gray-800'}`
            : `bg-white ${isPreparing ? 'border-cyan-400 shadow-md ring-1 ring-cyan-400/20' : 'border-slate-200 shadow-xs'}`
        }`}
      >
        {/* Top Status Stripe */}
        <div className={`h-1.5 w-full ${isPreparing ? 'bg-cyan-500' : isDark ? 'bg-sky-600' : 'bg-slate-800'}`} />

        {/* Ticket Header */}
        <div className={`p-3.5 pb-2.5 border-b ${
          isDark ? 'border-gray-800/80 bg-gray-900/60' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {order.fulfillment_type === 'dine_in' ? (
                <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                  isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-900 text-white shadow-2xs'
                }`}>
                  Mesa {order.restaurant_tables?.table_number || '?'}
                </span>
              ) : order.fulfillment_type === 'takeaway' ? (
                <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                  isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-900 border border-blue-200'
                }`}>
                  Llevar
                </span>
              ) : (
                <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                  isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}>
                  Domicilio
                </span>
              )}

              <span className={`font-mono text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>
                #{order.id.slice(0, 4)}
              </span>

              {stationFilter === 'bar' && otherItemsCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  isDark 
                    ? 'text-orange-400 bg-orange-950/60 border-orange-800/50' 
                    : 'text-orange-800 bg-orange-50 border-orange-200'
                }`}>
                  🍳 +{otherItemsCount} cocina
                </span>
              )}

              {stationFilter === 'bar' && order.kitchen_status === 'ready' && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isDark 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  🍳 COCINA YA LISTA
                </span>
              )}

              {stationFilter === 'bar' && order.kitchen_status === 'preparing' && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isDark 
                    ? 'bg-orange-500/10 text-orange-300 border border-orange-500/30' 
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  🍳 Cocina preparando
                </span>
              )}

              {stationFilter === 'kitchen' && otherItemsCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  isDark 
                    ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50' 
                    : 'text-cyan-800 bg-cyan-50 border-cyan-200'
                }`}>
                  🍸 +{otherItemsCount} bar
                </span>
              )}
            </div>

            <BarTicketTimer createdAt={order.created_at} isDark={isDark} />
          </div>

          {order.customer_name && (
            <p className={`text-xs font-medium truncate mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Cliente: <span className={isDark ? 'text-gray-200 font-bold' : 'text-slate-800 font-bold'}>{order.customer_name}</span>
            </p>
          )}
        </div>

        {/* Ticket Items List */}
        <div className={`p-3.5 space-y-2.5 flex-1 min-h-[140px] max-h-[46vh] overflow-y-auto ${
          isDark ? 'bg-[#111827]' : 'bg-white'
        }`}>
          {itemsToShow.map((item, idx) => (
            <div key={idx} className={`flex items-start gap-2.5 py-1 border-b last:border-0 ${
              isDark ? 'border-gray-800/40' : 'border-slate-100'
            }`}>
              <span className={`w-6 h-6 rounded font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                isDark ? 'bg-gray-800 text-white' : 'bg-slate-900 text-white'
              }`}>
                {item.quantity}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <p className={`text-sm font-bold uppercase leading-tight truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.products?.name}
                  </p>
                  {stationFilter === 'all' && (
                    <span className={`text-[9px] font-bold px-1 rounded uppercase shrink-0 border ${
                      isBarItem(item) 
                        ? (isDark ? 'text-cyan-400 bg-cyan-950 border-cyan-800' : 'text-cyan-800 bg-cyan-50 border-cyan-200')
                        : (isDark ? 'text-orange-400 bg-orange-950 border-orange-800' : 'text-orange-800 bg-orange-50 border-orange-200')
                    }`}>
                      {isBarItem(item) ? 'Bar' : 'Cocina'}
                    </span>
                  )}
                </div>

                {/* Modificadores */}
                {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(item.modifiers).map(([group, choice]) => (
                      <span key={group} className={`text-[11px] font-medium ${
                        isDark ? 'text-cyan-300' : 'text-slate-600'
                      }`}>
                        • {choice}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notas de Ítem */}
                {item.notes && (
                  <div className={`mt-1 text-xs rounded px-2 py-0.5 border ${
                    isDark 
                      ? 'text-amber-300 bg-amber-950/40 border-amber-900/50' 
                      : 'text-amber-900 bg-amber-50 border-amber-200 font-medium'
                  }`}>
                    ⚠️ {item.notes}
                  </div>
                )}
              </div>
            </div>
          ))}

          {order.notes && (
            <div className={`text-xs rounded p-2 mt-2 border ${
              isDark 
                ? 'text-cyan-300 bg-cyan-950/30 border-cyan-900/40' 
                : 'text-slate-700 bg-slate-50 border-slate-200'
            }`}>
              <span className="font-bold">Nota General:</span> {order.notes}
            </div>
          )}
        </div>

        {/* Ticket Action Footer */}
        <div className={`p-2.5 pt-2 border-t flex items-center gap-2 ${
          isDark ? 'border-gray-800/80 bg-gray-900/40' : 'border-slate-100 bg-slate-50/80'
        }`}>
          {restaurantSettings?.kitchen_print_enabled && (
            <button
              onClick={() => printThermalDocument({ order, type: 'kitchen', width: restaurantSettings?.thermal_paper_width || '80', businessName: activeBrand?.name, business: activeBrand })}
              title="Imprimir comanda de barra"
              className={`h-9 px-2.5 rounded-lg border flex items-center justify-center transition-all ${
                isDark 
                  ? 'border-gray-800 hover:border-gray-700 bg-gray-800/60 text-gray-300 hover:text-white' 
                  : 'border-slate-200 hover:bg-white text-slate-600 shadow-2xs'
              }`}
            >
              <Icon icon="solar:printer-2-linear" className="text-base" />
            </button>
          )}

          {order.status === 'new' ? (
            <button
              onClick={() => markAsPreparing(order.id)}
              disabled={updatingStatus === order.id}
              className={`flex-1 h-9 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : 'Preparar Tragos'}
            </button>
          ) : (
            <button
              onClick={() => markAsReady(order.id)}
              disabled={updatingStatus === order.id}
              className="flex-1 h-9 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : 'Bebidas Listas ✓'}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>
        <Icon icon="line-md:loading-loop" className="text-4xl mb-3 text-cyan-500" />
        <p className="text-sm font-bold uppercase tracking-wider">Cargando barra...</p>
      </div>
    );
  }

  const activeCount = stationOrders.length;
  const newCount = stationOrders.filter(o => o.status === 'new').length;
  const preparingCount = stationOrders.filter(o => o.status === 'preparing').length;

  return (
    <div className={`min-h-screen p-3 sm:p-5 font-sans transition-colors ${
      isDark ? 'bg-[#090d16] text-gray-100' : 'bg-[#f4f5f8] text-slate-900'
    }`}>
      {/* Top Professional Control Bar */}
      <div className={`mb-4 pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDark ? 'border-gray-800/80' : 'border-slate-200'
      }`}>
        {/* Left: Station & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍸</span>
            <h1 className={`text-base sm:text-lg font-black tracking-tight uppercase ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              BDS <span className="text-cyan-600">Barra & Tragos</span>
            </h1>
          </div>

          {/* Selector de Estación */}
          <div className={`flex rounded-lg p-0.5 border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-slate-200/70 border-slate-300/60'
          }`}>
            {[
              { id: 'bar', label: 'Barra', emoji: '🍸' },
              { id: 'kitchen', label: 'Cocina', emoji: '🍳' },
              { id: 'all', label: 'Pase Expo', emoji: '📋' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStationFilter(st.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                  stationFilter === st.id
                    ? (isDark ? 'bg-cyan-600 text-white' : 'bg-white text-slate-900 shadow-xs')
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-600 hover:text-slate-900')
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
          {/* Botón Silenciar Alarma si está sonando */}
          {isSoundLoopActive && (
            <button
              type="button"
              onClick={() => soundService.stopNewOrderLoop()}
              className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-lg text-xs font-black shadow-md animate-pulse border border-yellow-500 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Silenciar sonido de la alarma continua"
            >
              <Icon icon="heroicons:speaker-wave" className="text-base animate-bounce" />
              <span>Silenciar Alarma</span>
            </button>
          )}

          {/* Botón Probar / Activar Sonido en Tablet */}
          <button
            type="button"
            onClick={() => {
              soundService.unlockAudio();
              soundService.playNewOrder();
              toast('Sonido de prueba emitido 🍸', { icon: '🔔' });
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark 
                ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs'
            }`}
            title="Toca para probar o activar el sonido de pedidos en esta tablet"
          >
            <Icon icon="heroicons:speaker-wave" className="text-cyan-500 text-sm" />
            <span className="hidden sm:inline">Probar Sonido</span>
          </button>

          {/* Filtros de Estado */}
          <div className={`flex rounded-lg p-0.5 border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-slate-200/70 border-slate-300/60'
          }`}>
            {[
              { id: 'all', label: 'Todos', count: activeCount },
              { id: 'new', label: 'En Cola', count: newCount },
              { id: 'preparing', label: 'En Barra', count: preparingCount },
              { id: 'batch', label: 'Rondas' }
            ].map(vm => (
              <button
                key={vm.id}
                onClick={() => setViewMode(vm.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                  viewMode === vm.id
                    ? (isDark ? 'bg-gray-800 text-white' : 'bg-white text-slate-900 shadow-xs')
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                <span>{vm.label}</span>
                {vm.count !== undefined && (
                  <span className={`text-[10px] px-1 rounded font-mono ${
                    viewMode === vm.id 
                      ? (isDark ? 'bg-gray-700 text-white' : 'bg-slate-100 text-slate-800') 
                      : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-300/60 text-slate-700')
                  }`}>
                    {vm.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Actions (Theme, Refresh, Fullscreen) */}
          <div className={`flex items-center gap-1 rounded-lg p-0.5 border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <button
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className={`w-8 h-7 flex items-center justify-center rounded transition-colors ${
                isDark ? 'text-amber-400 hover:bg-gray-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon icon={isDark ? 'solar:sun-2-bold' : 'solar:moon-stars-bold'} className="text-sm" />
            </button>
            <button
              onClick={() => fetchBarOrders()}
              title="Refrescar comanda"
              className={`w-8 h-7 flex items-center justify-center rounded transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon icon="heroicons:arrow-path" className="text-sm" />
            </button>
            <button
              onClick={toggleFullScreen}
              title="Pantalla Completa"
              className={`w-8 h-7 flex items-center justify-center rounded transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon icon="heroicons:arrows-pointing-out" className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {viewMode === 'batch' ? (
        batchOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-sm font-medium">No hay bebidas agrupadas en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {batchOrders.map((batch, idx) => (
              <div key={idx} className={`rounded-xl p-3 flex flex-col justify-between border ${
                isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className={`text-sm font-bold uppercase leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {batch.name}
                    </p>
                    <span className={`w-8 h-8 rounded-lg font-mono text-base font-black flex items-center justify-center shrink-0 border ${
                      isDark 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                        : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                    }`}>
                      {batch.totalQuantity}
                    </span>
                  </div>

                  {batch.modifiers && Object.keys(batch.modifiers).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.values(batch.modifiers).map((mod, i) => (
                        <span key={i} className={`text-[10px] font-medium ${isDark ? 'text-cyan-300' : 'text-slate-600'}`}>
                          • {mod}
                        </span>
                      ))}
                    </div>
                  )}

                  {batch.notes && (
                    <p className="text-xs text-rose-500 italic mb-2">⚠️ {batch.notes}</p>
                  )}
                </div>

                <div className={`pt-2 border-t flex items-center gap-1.5 flex-wrap ${
                  isDark ? 'border-gray-800' : 'border-slate-100'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Mesas:</span>
                  {batch.orders.map((ord, i) => (
                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isDark ? 'bg-gray-800 text-gray-200' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {ord}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Icon icon="heroicons:check-badge" className={`text-5xl mb-2 ${isDark ? 'text-gray-700' : 'text-slate-300'}`} />
            <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Barra Despejada</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>No hay comandas pendientes para la barra</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
            {displayedOrders.map(order => renderOrderTicket(order))}
          </div>
        )
      )}

      {/* ── Modal de Alerta de Nuevo Pedido Entrante en Barra */}
      {isAlertModalOpen && incomingOrdersQueue.length > 0 && (
        <NewOrderAlertModal
          isOpen={isAlertModalOpen}
          order={incomingOrdersQueue[incomingOrderIndex] || incomingOrdersQueue[0]}
          onClose={() => {
            soundService.stopNewOrderLoop();
            setIsSoundLoopActive(false);
            setIsAlertModalOpen(false);
          }}
          onAcceptAndSendToKitchen={handleAcceptIncomingOrder}
          onReviewDetail={handleReviewIncomingOrder}
          queueCount={incomingOrdersQueue.length}
          currentIndex={incomingOrderIndex}
          onNextOrder={() => setIncomingOrderIndex(prev => Math.min(incomingOrdersQueue.length - 1, prev + 1))}
          onPrevOrder={() => setIncomingOrderIndex(prev => Math.max(0, prev - 1))}
          restaurantSettings={restaurantSettings}
        />
      )}
    </div>
  );
}
