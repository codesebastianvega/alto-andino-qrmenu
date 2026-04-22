import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { toast } from '../components/Toast';

/**
 * Devuelve el inicio del día actual en UTC considerando la zona horaria
 * de Colombia (UTC-5). Ejemplo: si son las 14:00 COT el 15/04,
 * devuelve 2026-04-15T05:00:00.000Z (que es 00:00 COT en UTC).
 */
function getStartOfDayColombia() {
  const now = new Date();
  // Colombia es UTC-5 (sin horario de verano)
  const offsetMs = 5 * 60 * 60 * 1000;
  const localMs = now.getTime() - offsetMs;
  const localDate = new Date(localMs);
  // Inicio del día local (00:00:00 COT)
  const startLocal = new Date(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
    0, 0, 0, 0
  );
  // Convertir de vuelta a UTC
  return new Date(startLocal.getTime() + offsetMs).toISOString();
}

export function useOperations() {
  const { activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocation();
  const brandId = activeBrand?.id;

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]); // FIFO max 20

  // Ref para evitar toast duplicados en la misma sesión
  const knownOrderIds = useRef(new Set());

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const pushEvent = useCallback((event) => {
    setLiveEvents(prev => [event, ...prev].slice(0, 20));
  }, []);

  // ─── Fetchers ──────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    if (!brandId) return;
    const startOfDay = getStartOfDayColombia();

    let query = supabase
      .from('orders')
      .select(`
        id, status, total_amount, paid_amount, service_fee,
        fulfillment_type, payment_status, created_at, delivered_at,
        cancelled_at, discount_amount, waiter_id, table_id,
        cancellation_reason, location_id,
        restaurant_tables ( id, table_number ),
        order_items (
          id, quantity, unit_price,
          products ( id, name )
        ),
        order_payments ( id, amount, payment_method_id,
          payment_methods ( name, type )
        )
      `)
      .eq('brand_id', brandId)
      .gte('created_at', startOfDay);

    if (!isAllLocations) {
      query = query.eq('location_id', activeLocationId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[useOperations] fetchOrders error:', error);
      return;
    }

    // Registrar IDs conocidos para evitar toasts duplicados en refresh
    (data || []).forEach(o => knownOrderIds.current.add(o.id));
    setOrders(data || []);

    // Sembrar eventos iniciales si el feed está vacío (solo la primera vez)
    setLiveEvents(prev => {
      if (prev.length > 0) return prev;
      if (!data || data.length === 0) return prev;
      
      // Tomar los últimos 20 eventos del turno actual
      const seedEvents = data.slice(0, 20).map(o => {
        let label = `Nuevo pedido — ${o.fulfillment_type === 'dine_in' ? `Mesa ${o.restaurant_tables?.table_number || '?'}` : 'Para llevar'}`;
        let icon = '🆕';
        if (o.status === 'delivered') { label = `✅ Entregado — $${Number(o.total_amount).toLocaleString()}`; icon = '✅'; }
        else if (o.status === 'cancelled') { label = `❌ Cancelado — $${Number(o.total_amount).toLocaleString()}`; icon = '❌'; }
        else if (o.status === 'ready') { label = `🔔 Listo — Mesa ${o.restaurant_tables?.table_number || '?'}`; icon = '🔔'; }
        else if (o.status === 'waiting_payment') { label = `⏳ Por cobrar — Mesa ${o.restaurant_tables?.table_number || '?'}`; icon = '⏳'; }

        return {
          id: `seed-${o.id}-${o.status}`,
          type: 'history',
          icon,
          label,
          amount: o.total_amount,
          time: o.created_at,
        };
      });
      return seedEvents;
    });

  }, [brandId, isAllLocations, activeLocationId]);

  const fetchTables = useCallback(async () => {
    if (!brandId) return;

    let query = supabase
      .from('restaurant_tables')
      .select('id, table_number, is_active, physical_status, occupied_at, area_id, location_id')
      .eq('brand_id', brandId);

    if (!isAllLocations) {
      query = query.eq('location_id', activeLocationId);
    }

    const { data, error } = await query.order('table_number', { ascending: true });

    if (error) {
      console.error('[useOperations] fetchTables error:', error);
      return;
    }
    setTables(data || []);
  }, [brandId, isAllLocations, activeLocationId]);

  const fetchAreas = useCallback(async () => {
    if (!brandId) return;

    let query = supabase
      .from('table_areas')
      .select('*')
      .eq('brand_id', brandId);

    if (!isAllLocations) {
      query = query.eq('location_id', activeLocationId);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      console.error('[useOperations] fetchAreas error:', error);
      return;
    }
    setAreas(data || []);
  }, [brandId, isAllLocations, activeLocationId]);

  const fetchPayments = useCallback(async () => {
    if (!brandId) return;
    const startOfDay = getStartOfDayColombia();

    // Traemos los pagos del día a través de los pedidos del día
    let query = supabase
      .from('order_payments')
      .select(`
        id, amount, created_at,
        payment_methods ( name, type ),
        orders!inner ( id, brand_id, created_at, location_id )
      `)
      .eq('orders.brand_id', brandId)
      .gte('orders.created_at', startOfDay);

    if (!isAllLocations) {
      query = query.eq('orders.location_id', activeLocationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[useOperations] fetchPayments error:', error);
      return;
    }
    setPayments(data || []);
  }, [brandId, isAllLocations, activeLocationId]);
  
  const fetchSettings = useCallback(async () => {
    if (!brandId) return;
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('brand_id', brandId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('[useOperations] fetchSettings error:', error);
      return;
    }
    setSettings(data || { inactivity_threshold_mins: 30, target_prep_time_mins: 15 });
  }, [brandId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchTables(), fetchAreas(), fetchPayments(), fetchSettings()]);
    setLoading(false);
  }, [fetchOrders, fetchTables, fetchAreas, fetchPayments, fetchSettings]);

  // Re-fetch everything when location context changes
  useEffect(() => {
    if (brandId) {
      fetchAll();
    }
  }, [brandId, activeLocationId, fetchAll]);

  // ─── Subscripciones Realtime ────────────────────────────────────────────────

  useEffect(() => {
    if (!brandId) {
      setLoading(false);
      return;
    }

    // Initial fetch handled by the useEffect above triggered by location change
    // fetchAll(); // Removed from here to avoid duplicate calls on mount

    // Safety: don't subscribe if missing key identifiers
    if (!brandId || (!isAllLocations && !activeLocationId)) return;

    const channelId = isAllLocations ? `operations-all-${brandId}` : `operations-${activeLocationId}`;
    
    // Filtros de realtime: inyectamos location_id si no estamos en vista "Todas"
    // Usamos el ID explícito para evitar "undefined" en el string del filtro
    const orderFilter = isAllLocations ? `brand_id=eq.${brandId}` : `location_id=eq.${activeLocationId}`;
    const tableFilter = isAllLocations ? `brand_id=eq.${brandId}` : `location_id=eq.${activeLocationId}`;
    const areaFilter  = isAllLocations ? `brand_id=eq.${brandId}` : `location_id=eq.${activeLocationId}`;
    const paymentFilter = `brand_id=eq.${brandId}`;

    const channel = supabase
      .channel(channelId)

      // ── Órdenes ──────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: orderFilter },
        (payload) => {
          const order = payload.new;
          if (!knownOrderIds.current.has(order.id)) {
            knownOrderIds.current.add(order.id);
            toast('🔔 Nuevo pedido recibido', { icon: '🆕' });
            pushEvent({
              type: 'new_order',
              icon: '🆕',
              label: `Nuevo pedido — ${order.fulfillment_type === 'dine_in' ? `Mesa ${order.table_id?.slice(0,4)}` : 'Para llevar'}`,
              amount: order.total_amount,
              time: new Date().toISOString(),
            });
          }
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: orderFilter },
        (payload) => {
          const updated = payload.new;
          const prev = payload.old;

          // Detectar cambio de estado
          if (prev.status !== updated.status) {
            const statusLabels = {
              preparing: '🍳 En preparación',
              ready:     '✅ Listo para entregar',
              delivered: '🚀 Entregado',
              cancelled: '❌ Cancelado',
            };
            if (statusLabels[updated.status]) {
              pushEvent({
                type: 'status_change',
                icon: statusLabels[updated.status].split(' ')[0],
                label: `${statusLabels[updated.status]} — $${Number(updated.total_amount).toLocaleString()}`,
                amount: updated.total_amount,
                time: new Date().toISOString(),
              });
            }
          }

          setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
        }
      )

      // ── Pagos ─────────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_payments', filter: paymentFilter },
        (payload) => {
          const payment = payload.new;
          
          // Si estamos en una sede específica, verificamos si el pago pertenece a una orden de esa sede
          // Dado que el payload de postgres_changes no trae la orden unida, tenemos que verificar si la orden
          // ya existe en nuestra lista filtrada de órdenes.
          const orderExists = orders.some(o => o.id === payment.order_id);
          
          // Si no es "Todas" y la orden no está en nuestra lista, ignoramos el evento
          if (!isAllLocations && !orderExists) return;

          toast('💳 Pago registrado', { icon: '💳' });
          pushEvent({
            type: 'payment',
            icon: '💳',
            label: `Pago recibido — $${Number(payment.amount).toLocaleString()}`,
            amount: payment.amount,
            time: new Date().toISOString(),
          });
          fetchPayments();
          fetchOrders(); // Actualizar paid_amount en orders
        }
      )

      // ── Mesas ─────────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_tables', filter: tableFilter },
        () => { fetchTables(); }
      )

      // ── Áreas ─────────────────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_areas', filter: areaFilter },
        () => { fetchAreas(); }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandId, activeLocationId, isAllLocations, fetchOrders, fetchPayments, fetchTables, fetchAreas, pushEvent, orders]);

  // ─── Métricas Derivadas (calculadas, no en estado) ─────────────────────────

  const metrics = (() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const cancelled = orders.filter(o => o.status === 'cancelled');
    const active    = orders.filter(o => ['new', 'preparing', 'ready', 'waiting_payment'].includes(o.status));

    const totalRevenue    = delivered.reduce((s, o) => s + Number(o.total_amount  || 0), 0);
    const totalTips       = delivered.reduce((s, o) => s + Number(o.service_fee   || 0), 0);
    const totalDiscounts  = delivered.reduce((s, o) => s + Number(o.discount_amount || 0), 0);
    const avgTicket       = delivered.length ? totalRevenue / delivered.length : 0;
    const cancelledAmount = cancelled.reduce((s, o) => s + Number(o.total_amount  || 0), 0);

    // Desglose por método de pago
    const byPaymentMethod = {};
    payments.forEach(p => {
      const name = p.payment_methods?.name || 'Otro';
      const type = p.payment_methods?.type || 'other';
      if (!byPaymentMethod[name]) {
        byPaymentMethod[name] = { name, type, total: 0, count: 0 };
      }
      byPaymentMethod[name].total += Number(p.amount || 0);
      byPaymentMethod[name].count += 1;
    });

    return {
      totalRevenue,
      totalTips,
      totalDiscounts,
      avgTicket,
      cancelledAmount,
      cancelledCount: cancelled.length,
      deliveredCount: delivered.length,
      activeCount: active.length,
      byPaymentMethod: Object.values(byPaymentMethod),
    };
  })();

  // ─── Estado de mesas (enriquecido con órdenes activas) ─────────────────────

  const tablesWithStatus = tables.map(table => {
    const activeOrder = orders.find(
      o =>
        o.table_id === table.id &&
        ['new', 'preparing', 'ready', 'waiting_payment'].includes(o.status)
    );

    // El status base es el físico
    let status = table.physical_status || 'libre';
    
    // Opcional: si queremos mantener el override de 'needs_billing' cuando la orden está esperando pago
    if (activeOrder && ['ready', 'waiting_payment'].includes(activeOrder.status)) {
      status = 'needs_billing';
    }

    // Calcular minutos desde la ocupación física
    let minutesSinceActivity = null;
    if (table.physical_status === 'ocupada' && table.occupied_at) {
      minutesSinceActivity = Math.floor(
        (Date.now() - new Date(table.occupied_at).getTime()) / 60000
      );
    } else if (activeOrder) {
      // Fallback si por alguna razón no hay occupied_at
      minutesSinceActivity = Math.floor(
        (Date.now() - new Date(activeOrder.created_at).getTime()) / 60000
      );
    }

    return {
      ...table,
      status, // 'libre', 'ocupada', 'sucia', o overrides temporales como 'needs_billing'
      activeOrder: activeOrder || null,
      minutesSinceActivity,
    };
  });

  return {
    // Raw data
    orders,
    tables,
    areas,
    payments,
    settings,
    liveEvents,
    loading,

    // Enriquecidos
    tablesWithStatus,
    metrics,

    // Acciones
    refresh: fetchAll,
  };
}
