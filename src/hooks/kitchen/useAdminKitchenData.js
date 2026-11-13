import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { useLocations } from '../../context/LocationContext';
import { useRestaurantSettings } from '../useRestaurantSettings';
import soundService from '../../utils/soundService';
import { useAdminRecipes } from '../useAdminRecipes';
import { resolveOrderItemName } from '../../utils/formatters';
import { isBarItem, isKitchenItem } from '../../utils/kdsHelpers';

export function useAdminKitchenData() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const [viewMode, setViewMode] = useState('all'); // 'all' | 'new' | 'preparing' | 'batch'
  const [stationFilter, setStationFilter] = useState('kitchen'); // 'kitchen' | 'bar' | 'all'
  
  // Nordic bistro light theme by default
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

  const { recipes: allRecipes } = useAdminRecipes();
  const [selectedRecipeForViewer, setSelectedRecipeForViewer] = useState(null);
  const [is86DrawerOpen, setIs86DrawerOpen] = useState(false);
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

  const fetchKitchenOrders = useCallback(async (isSilent = false) => {
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
        .neq('kitchen_status', 'none')
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
      console.error('Error fetching kitchen orders:', err);
      toast('Error al cargar pedidos de cocina');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId, isAllLocations, activeLocationId]);

  const markAsPreparing = async (orderId) => {
    try {
      setUpdatingStatus(orderId);
      const { data: savedOrder, error } = await supabase
        .from('orders')
        .update({ kitchen_status: 'preparing', status: 'preparing' })
        .eq('id', orderId).select('*').single();
      
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...savedOrder } : o));
      toast('🍳 Pedido en preparación en cocina');
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
      const hasBarItems = currentOrder?.order_items?.some(it => isBarItem(it));
      const isBarDone = !hasBarItems || !currentOrder?.bar_status || currentOrder.bar_status === 'ready' || currentOrder.bar_status === 'none';

      const updatePayload = {
        kitchen_status: 'ready',
        kitchen_ready_at: new Date().toISOString()
      };
      
      if (isBarDone) {
        updatePayload.status = 'ready';
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (isBarDone) {
        toast('🎉 ¡Pedido completamente despachado!');
      } else {
        toast('🍳 ¡Cocina lista! Esperando que barra finalice las bebidas 🍸', { icon: '🍸' });
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

  const handleOpenDishRecipe = (item) => {
    const prodName = item.products?.name?.toLowerCase() || '';
    const found = allRecipes.find(r => 
      r.name.toLowerCase().includes(prodName) || 
      prodName.includes(r.name.toLowerCase().split('(')[0].trim().toLowerCase())
    );
    if (found) {
      setSelectedRecipeForViewer(found);
    } else if (allRecipes.length > 0) {
      setSelectedRecipeForViewer(allRecipes[0]);
    } else {
      toast('No hay ficha técnica registrada');
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
        const isTargetLocation = isAllLocations || !activeLocationId || !payload.new?.location_id || (payload.new && payload.new.location_id === activeLocationId);
        if (!isTargetLocation) return;

        if (payload.eventType === 'INSERT') {
          if (payload.new.kitchen_status === 'none') return;

          if (['new', 'preparing'].includes(payload.new.status) && payload.new.kitchen_status !== 'ready') {
            soundService.startNewOrderLoop(3500);
            setIsSoundLoopActive(true);
            toast('¡Nueva comanda en cocina!', { icon: '🍳' });

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
                  const hasKitchen = (fullOrder.order_items || []).some(it => isKitchenItem(it));
                  if (hasKitchen && fullOrder.kitchen_status !== 'none') {
                    setIncomingOrdersQueue(prev => {
                      const exists = prev.some(o => o.id === fullOrder.id);
                      return exists ? prev : [...prev, fullOrder];
                    });
                    setIsAlertModalOpen(true);
                  }
                }
              } catch (err) {
                console.error('Error cargando detalles comanda cocina:', err);
              }
            }, 450);

            setTimeout(() => fetchKitchenOrders(true), 1000);
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.bar_status === 'ready' && payload.old?.bar_status !== 'ready') {
            soundService.playOrderReady();
            toast('🍸 ¡Bebidas listas para la comanda!', { icon: '🍸' });
          }

          if (!['new', 'preparing'].includes(payload.new.status) || payload.new.kitchen_status === 'ready' || payload.new.kitchen_status === 'none') {
            setOrders(prev => prev.filter(o => o.id !== payload.new.id));
          } else {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
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

  // Station filtered orders
  const stationOrders = useMemo(() => {
    const activeKitchenOrders = orders.filter(o => o.kitchen_status !== 'ready' && o.kitchen_status !== 'none');
    if (stationFilter === 'bar') {
      return activeKitchenOrders.filter(o => o.order_items?.some(it => isBarItem(it)));
    }
    return activeKitchenOrders.filter(o => o.order_items?.some(it => isKitchenItem(it)));
  }, [orders, stationFilter]);

  // Displayed orders (all / new / preparing)
  const displayedOrders = useMemo(() => {
    if (viewMode === 'new') return stationOrders.filter(o => o.status === 'new');
    if (viewMode === 'preparing') return stationOrders.filter(o => o.status === 'preparing');
    return stationOrders;
  }, [stationOrders, viewMode]);

  // Batching
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
            name: resolveOrderItemName(item), 
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
    allRecipes,
    selectedRecipeForViewer,
    setSelectedRecipeForViewer,
    is86DrawerOpen,
    setIs86DrawerOpen,
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
    handleOpenDishRecipe,
    fetchKitchenOrders,
  };
}
