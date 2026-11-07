import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { useLocations } from '../../context/LocationContext';
import { useRestaurantSettings } from '../useRestaurantSettings';
import soundService from '../../utils/soundService';
import { isBarItem, isKitchenItem } from '../../utils/kdsHelpers';

export function useAdminBarData() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const [viewMode, setViewMode] = useState('all'); // 'all' | 'new' | 'preparing' | 'batch'
  const [stationFilter, setStationFilter] = useState('bar'); // 'bar' | 'kitchen' | 'all'

  // Nordic bistro light theme by default, synchronized with KDS
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
      soundService.playOrderReady();
    } catch (err) {
      console.error('Error updating order:', err);
      toast('Error al marcar como listo');
    } finally {
      setUpdatingStatus(null);
    }
  };

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

  const handleReviewIncomingOrder = () => {
    soundService.stopNewOrderLoop();
    setIsSoundLoopActive(false);
    setIsAlertModalOpen(false);
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
          if (payload.new.kitchen_status === 'ready' && payload.old?.kitchen_status !== 'ready') {
            soundService.playOrderReady();
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

  // Station filtered orders
  const stationOrders = useMemo(() => {
    const activeBarOrders = orders.filter(o => o.bar_status !== 'ready' && o.bar_status !== 'none');
    if (stationFilter === 'kitchen') {
      return activeBarOrders.filter(o => o.order_items?.some(it => isKitchenItem(it)));
    }
    return activeBarOrders.filter(o => o.order_items?.some(it => isBarItem(it)));
  }, [orders, stationFilter]);

  const displayedOrders = useMemo(() => {
    if (viewMode === 'new') return stationOrders.filter(o => o.status === 'new');
    if (viewMode === 'preparing') return stationOrders.filter(o => o.status === 'preparing');
    return stationOrders;
  }, [stationOrders, viewMode]);

  // Batching for bartenders
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

  const activeCount = stationOrders.length;
  const newCount = stationOrders.filter(o => o.status === 'new').length;
  const preparingCount = stationOrders.filter(o => o.status === 'preparing').length;

  return {
    orders,
    loading,
    updatingStatus,
    viewMode,
    setViewMode,
    stationFilter,
    setStationFilter,
    isDark,
    toggleTheme,
    toggleFullScreen,
    restaurantSettings,
    activeBrand,
    activeBrandId,
    activeLocationId,
    isSoundLoopActive,
    incomingOrdersQueue,
    incomingOrderIndex,
    setIncomingOrderIndex,
    isAlertModalOpen,
    setIsAlertModalOpen,
    stationOrders,
    displayedOrders,
    batchOrders,
    activeCount,
    newCount,
    preparingCount,
    markAsPreparing,
    markAsReady,
    handleAcceptIncomingOrder,
    handleReviewIncomingOrder,
    fetchBarOrders,
  };
}
