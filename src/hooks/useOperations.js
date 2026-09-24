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
  const offsetMs = 5 * 60 * 60 * 1000;
  const localMs = now.getTime() - offsetMs;
  const localDate = new Date(localMs);
  const startLocal = new Date(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
    0, 0, 0, 0
  );
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
  const [activeShift, setActiveShift] = useState(null);

  // Refs para evitar loops y cierres obsoletos en realtime
  const knownOrderIds = useRef(new Set());
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

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
        cancellation_reason, location_id, payment_method,
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

    (data || []).forEach(o => knownOrderIds.current.add(o.id));
    setOrders(data || []);

    setLiveEvents(prev => {
      if (prev.length > 0) return prev;
      if (!data || data.length === 0) return prev;
      
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

    let query = supabase
      .from('order_payments')
      .select(`
        id, amount, created_at,
        payment_methods ( name, type ),
        orders!inner ( id, brand_id, created_at, location_id )
      `)
      .eq('orders.brand_id', brandId)
      .gte('created_at', startOfDay);

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

  const fetchActiveShift = useCallback(async () => {
    if (!brandId) return;
    try {
      let query = supabase
        .from('cash_shifts')
        .select('*')
        .eq('brand_id', brandId)
        .eq('status', 'open');

      if (!isAllLocations && activeLocationId) {
        query = query.eq('location_id', activeLocationId);
      }

      const { data, error } = await query
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[useOperations] fetchActiveShift error:', error);
        return;
      }
      setActiveShift(data || null);
    } catch (err) {
      console.error('[useOperations] fetchActiveShift catch:', err);
    }
  }, [brandId, isAllLocations, activeLocationId]);

  const openCashShift = useCallback(async ({ locationId, initialCash, openedBy, staffId = null, openingNotes = '' }) => {
    if (!brandId) throw new Error('No brand active');
    try {
      const payload = {
        brand_id: brandId,
        location_id: locationId || (isAllLocations ? null : activeLocationId),
        status: 'open',
        opened_at: new Date().toISOString(),
        opened_by: openedBy,
        opened_by_staff_id: staffId,
        initial_cash: Number(initialCash || 0),
        opening_notes: openingNotes
      };

      const { data, error } = await supabase
        .from('cash_shifts')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      setActiveShift(data);
      toast.success(`Turno abierto con base de $${Number(initialCash || 0).toLocaleString('es-CO')}`);
      return { data, error: null };
    } catch (err) {
      console.error('[useOperations] openCashShift error:', err);
      toast.error('Error al abrir turno de caja: ' + err.message);
      return { data: null, error: err };
    }
  }, [brandId, isAllLocations, activeLocationId]);

  const closeCashShift = useCallback(async ({ shiftId, actualCash, closedBy, staffId = null, closingNotes = '', cashBreakdown = {}, metricsData = {} }) => {
    try {
      const idToClose = shiftId || activeShift?.id;
      if (!idToClose) throw new Error('No hay turno para cerrar');

      const initialCash = Number(activeShift?.initial_cash || 0);
      const cashSales = Number(metricsData.totalCashSales || 0);
      const expectedCash = initialCash + cashSales;
      const actual = Number(actualCash || 0);
      const difference = actual - expectedCash;

      const payload = {
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: closedBy,
        closed_by_staff_id: staffId,
        expected_cash: expectedCash,
        actual_cash: actual,
        cash_difference: difference,
        total_cash_sales: cashSales,
        total_card_sales: Number(metricsData.totalCardSales || 0),
        total_transfer_sales: Number(metricsData.totalTransferSales || 0),
        total_other_sales: Number(metricsData.totalOtherSales || 0),
        total_sales: Number(metricsData.totalRevenue || 0),
        total_tips: Number(metricsData.totalTips || 0),
        total_discounts: Number(metricsData.totalDiscounts || 0),
        total_orders_count: Number(metricsData.deliveredCount || 0),
        cash_breakdown: cashBreakdown,
        closing_notes: closingNotes,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('cash_shifts')
        .update(payload)
        .eq('id', idToClose)
        .select()
        .single();

      if (error) throw error;
      setActiveShift(null);
      toast.success('Turno de caja cerrado exitosamente');
      return { data, error: null };
    } catch (err) {
      console.error('[useOperations] closeCashShift error:', err);
      toast.error('Error al cerrar turno de caja: ' + err.message);
      return { data: null, error: err };
    }
  }, [activeShift]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchOrders(),
      fetchTables(),
      fetchAreas(),
      fetchPayments(),
      fetchSettings(),
      fetchActiveShift()
    ]);
    setLoading(false);
  }, [fetchOrders, fetchTables, fetchAreas, fetchPayments, fetchSettings, fetchActiveShift]);

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

    if (!brandId || (!isAllLocations && !activeLocationId)) return;

    const channelId = isAllLocations ? `operations-all-${brandId}` : `operations-${activeLocationId}`;
    const orderFilter = isAllLocations ? `brand_id=eq.${brandId}` : `location_id=eq.${activeLocationId}`;
    const tableFilter = isAllLocations ? `brand_id=eq.${brandId}` : `location_id=eq.${activeLocationId}`;
    const areaFilter  = isAllLocations ? `brand_id=eq.${brandId}` : `location_id=eq.${activeLocationId}`;
    const paymentFilter = `brand_id=eq.${brandId}`;

    const channel = supabase
      .channel(channelId)

      // ── Turnos de Caja ───────────────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_shifts', filter: `brand_id=eq.${brandId}` },
        () => { fetchActiveShift(); }
      )

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

          if (prev.status !== updated.status) {
            const statusLabels = {
              preparing: '🍳 En preparación',
              ready:     '✅ Listo para entregar',
              on_table:  '🏠 En Mesa',
              delivered: '🏁 Finalizado',
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
          const orderExists = ordersRef.current.some(o => o.id === payment.order_id);
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
          fetchOrders();
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
  }, [brandId, activeLocationId, isAllLocations, fetchOrders, fetchPayments, fetchTables, fetchAreas, fetchActiveShift, pushEvent]);

  // ─── Métricas Derivadas ───────────────────────────────────────────────────

  const metrics = (() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const cancelled = orders.filter(o => o.status === 'cancelled');
    const active    = orders.filter(o => ['new', 'preparing', 'ready', 'on_table', 'waiting_payment'].includes(o.status));

    const totalRevenue    = delivered.reduce((s, o) => s + Number(o.total_amount  || 0), 0);
    const totalTips       = delivered.reduce((s, o) => s + Number(o.service_fee   || 0), 0);
    const totalDiscounts  = delivered.reduce((s, o) => s + Number(o.discount_amount || 0), 0);
    const avgTicket       = delivered.length ? totalRevenue / delivered.length : 0;
    const cancelledAmount = cancelled.reduce((s, o) => s + Number(o.total_amount  || 0), 0);

    const byPaymentMethod = {};
    let totalCashSales = 0;
    let totalCardSales = 0;
    let totalTransferSales = 0;
    let totalOtherSales = 0;

    payments.forEach(p => {
      const name = p.payment_methods?.name || 'Otro';
      const type = p.payment_methods?.type || 'other';
      if (!byPaymentMethod[name]) {
        byPaymentMethod[name] = { name, type, total: 0, count: 0 };
      }
      const amt = Number(p.amount || 0);
      byPaymentMethod[name].total += amt;
      byPaymentMethod[name].count += 1;

      const key = (name + type).toLowerCase();
      if (key.includes('efectivo') || key.includes('cash')) {
        totalCashSales += amt;
      } else if (key.includes('tarjeta') || key.includes('card') || key.includes('débito') || key.includes('crédito') || key.includes('datafono')) {
        totalCardSales += amt;
      } else if (key.includes('transfer') || key.includes('nequi') || key.includes('daviplata') || key.includes('bancolombia')) {
        totalTransferSales += amt;
      } else {
        totalOtherSales += amt;
      }
    });

    if (payments.length === 0 && delivered.length > 0) {
      delivered.forEach(o => {
        const pm = (o.payment_method || '').toLowerCase();
        const amt = Number(o.total_amount || 0);
        if (pm.includes('efectivo') || pm.includes('cash')) {
          totalCashSales += amt;
        } else if (pm.includes('tarjeta') || pm.includes('card') || pm.includes('datafono')) {
          totalCardSales += amt;
        } else if (pm.includes('transfer') || pm.includes('nequi') || pm.includes('daviplata')) {
          totalTransferSales += amt;
        } else {
          totalOtherSales += amt;
        }
      });
    }

    const initialCash = Number(activeShift?.initial_cash || 0);
    const expectedCash = initialCash + totalCashSales;

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
      totalCashSales,
      totalCardSales,
      totalTransferSales,
      totalOtherSales,
      initialCash,
      expectedCash,
    };
  })();

  // ─── Estado de mesas ───────────────────────────────────────────────────────

  const tablesWithStatus = tables.map(table => {
    const activeOrder = orders.find(
      o =>
        o.table_id === table.id &&
        ['new', 'preparing', 'ready', 'on_table', 'waiting_payment'].includes(o.status)
    );

    let status = table.physical_status || 'libre';
    if (activeOrder && ['ready', 'waiting_payment'].includes(activeOrder.status)) {
      status = 'needs_billing';
    }

    let minutesSinceActivity = null;
    if (table.physical_status === 'ocupada' && table.occupied_at) {
      minutesSinceActivity = Math.floor(
        (Date.now() - new Date(table.occupied_at).getTime()) / 60000
      );
    } else if (activeOrder) {
      minutesSinceActivity = Math.floor(
        (Date.now() - new Date(activeOrder.created_at).getTime()) / 60000
      );
    }

    return {
      ...table,
      status,
      activeOrder: activeOrder || null,
      minutesSinceActivity,
    };
  });

  return {
    orders,
    tables,
    areas,
    payments,
    settings,
    liveEvents,
    loading,

    tablesWithStatus,
    metrics,
    activeShift,

    refresh: fetchAll,
    openCashShift,
    closeCashShift,
    fetchActiveShift,

    updateTablePhysicalStatus: async (tableId, nextStatus, shouldClearTimer) => {
      setTables(prev => prev.map(t => 
        t.id === tableId 
          ? { ...t, physical_status: nextStatus, occupied_at: shouldClearTimer ? null : t.occupied_at }
          : t
      ));

      const updatePayload = { physical_status: nextStatus };
      if (shouldClearTimer) updatePayload.occupied_at = null;

      const { error } = await supabase
        .from('restaurant_tables')
        .update(updatePayload)
        .eq('id', tableId);

      if (error) {
        toast.error('Error al actualizar mesa');
        fetchTables();
        return { error };
      }
      return { data: true };
    }
  };
}
