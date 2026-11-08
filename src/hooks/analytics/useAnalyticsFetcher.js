import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from '../../components/Toast';

export function useAnalyticsFetcher({ activeBrandId, dateRange, activeLocationId, isAllLocations }) {
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [data, setData] = useState({ orders: [], leads: [], events: [], paymentMethods: [], payments: [] });
  const [prevData, setPrevData] = useState({ orders: [], leads: [], events: [] });
  const [allProducts, setAllProducts] = useState([]);
  const [advancedData, setAdvancedData] = useState({ forecasting: null, revPash: [], cohorts: {} });
  const [integrityStats, setIntegrityStats] = useState({ missingCosts: 0, identifiedPct: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsReady(false);
    try {
      if (!activeBrandId) {
        setLoading(false);
        return;
      }

      let start = new Date();
      let prevStart = new Date();
      let prevEnd = new Date();

      if (dateRange === 'today') {
        start.setHours(0, 0, 0, 0);
        prevStart.setDate(prevStart.getDate() - 1);
        prevStart.setHours(0, 0, 0, 0);
        prevEnd.setHours(0, 0, 0, 0);
      } else if (dateRange === '7d') {
        start.setDate(start.getDate() - 7);
        prevStart.setDate(prevStart.getDate() - 14);
        prevEnd.setDate(prevEnd.getDate() - 7);
      } else if (dateRange === '30d') {
        start.setDate(start.getDate() - 30);
        prevStart.setDate(prevStart.getDate() - 60);
        prevEnd.setDate(prevEnd.getDate() - 30);
      } else {
        start = new Date(0);
        prevStart = new Date(0);
      }
      const filterObj = !isAllLocations && activeLocationId ? { location_id: activeLocationId } : {};
      const resetAt = typeof localStorage !== 'undefined' ? localStorage.getItem('aa_analytics_reset_at_' + activeBrandId) : null;
      let effectiveEventsStart = start;
      if (resetAt && new Date(resetAt) > start) { effectiveEventsStart = new Date(resetAt); }

      const results = await Promise.allSettled([
        // 0. Current Period Orders
        supabase.from('orders').select(`
          id, total_amount, status, created_at, delivered_at, fulfillment_type, payment_method,
          cancellation_reason, cancelled_by, discount_amount, discount_reason, waiter_id,
          service_fee, customer_phone,
          staff!waiter_id ( name ),
          restaurant_tables ( id, table_number ),
          order_items ( quantity, unit_price, products ( id, name, cost, margin, categories ( name ) ) )
        `).eq('brand_id', activeBrandId)
          .match(filterObj)
          .gte('created_at', start.toISOString())
          .order('created_at', { ascending: false }),

        // 1. Current Period Leads
        supabase.from('leads').select('id, created_at, status')
          .eq('brand_id', activeBrandId)
          .match(filterObj)
          .gte('created_at', start.toISOString())
          .order('created_at', { ascending: false }),

        // 2. Current Period Events
        supabase.from('analytics_events').select('id, created_at, session_id, event_name, metadata, user_agent, table_id, location_id')
          .eq('brand_id', activeBrandId)
          .match(filterObj)
          .gte('created_at', effectiveEventsStart.toISOString()),

        // 3. Previous Period Orders
        supabase.from('orders').select(`
          id, total_amount, status, created_at, delivered_at,
          order_items ( quantity, unit_price, products ( name, cost, margin ) )
        `)
          .eq('brand_id', activeBrandId)
          .match(filterObj)
          .gte('created_at', prevStart.toISOString())
          .lt('created_at', prevEnd.toISOString()),

        // 4. Previous Period Leads
        supabase.from('leads').select('id, created_at, status')
          .eq('brand_id', activeBrandId)
          .match(filterObj)
          .gte('created_at', prevStart.toISOString())
          .lt('created_at', prevEnd.toISOString()),

        // 5. Previous Period Events
        supabase.from('analytics_events').select('id, created_at, session_id, event_name, metadata, user_agent, table_id, location_id')
          .eq('brand_id', activeBrandId)
          .match(filterObj)
          .gte('created_at', prevStart.toISOString())
          .lt('created_at', prevEnd.toISOString()),

        // 6. Payment Methods
        supabase.from('payment_methods').select('id, name').eq('brand_id', activeBrandId),

        // 7. Products
        supabase.from('products').select('id, name, cost, price, image_url').eq('brand_id', activeBrandId),

        // 8. Order Payments
        supabase.from('order_payments').select(`
          id, amount, created_at,
          payment_methods ( name, type ),
          orders!inner ( id, brand_id, created_at, location_id )
        `)
          .eq('orders.brand_id', activeBrandId)
          .match(!isAllLocations && activeLocationId ? { 'orders.location_id': activeLocationId } : {})
          .gte('created_at', start.toISOString())
          .order('created_at', { ascending: false })
      ]);

      const [ordersRes, leadsRes, eventsRes, prevOrdersRes, prevLeadsRes, prevEventsRes, pmRes, productsRes, paymentsRes] = results.map(r =>
        r.status === 'fulfilled' ? r.value : { data: [], error: r.reason }
      );

      setData({
        orders: ordersRes.data || [],
        leads: leadsRes.data || [],
        events: eventsRes.data || [],
        paymentMethods: pmRes.data || [],
        payments: paymentsRes.data || []
      });

      setAllProducts(productsRes.data || []);

      setPrevData({
        orders: prevOrdersRes.data || [],
        leads: prevLeadsRes.data || [],
        events: prevEventsRes.data || []
      });

      setLoading(false);
      setIsReady(true);

      const p_location_id = isAllLocations ? null : activeLocationId;

      Promise.allSettled([
        supabase.rpc('analytics_forecasting', {
          p_brand_id: activeBrandId,
          p_start_date: start.toISOString(),
          p_end_date: new Date().toISOString(),
          p_location_id
        }),
        supabase.rpc('analytics_revpash', {
          p_brand_id: activeBrandId,
          p_start_date: start.toISOString(),
          p_end_date: new Date().toISOString(),
          p_location_id
        }),
        supabase.rpc('analytics_cohorts', {
          p_brand_id: activeBrandId,
          p_start_date: start.toISOString(),
          p_end_date: new Date().toISOString(),
          p_location_id
        }),
        supabase.from('products').select('id', { count: 'exact' }).eq('brand_id', activeBrandId).or('cost.eq.0,cost.is.null')
      ]).then((advResults) => {
        const [forecastingRes, revPashRes, cohortsRes, integrityRes] = advResults.map(r =>
          r.status === 'fulfilled' ? r.value : { data: null, error: r.reason }
        );

        setAdvancedData({
          forecasting: forecastingRes.data,
          revPash: revPashRes.data || [],
          cohorts: cohortsRes.data || {}
        });

        const totalOrders = (ordersRes.data || []).length;
        const identifiedOrders = (ordersRes.data || []).filter(o => o.customer_phone && o.customer_phone !== '').length;

        setIntegrityStats({
          missingCosts: integrityRes.count || 0,
          identifiedPct: totalOrders > 0 ? (identifiedOrders / totalOrders) * 100 : 0
        });
      });

    } catch (err) {
      console.error('Error fetching intelligence data:', err);
      toast.error('Ocurrió un error crítico al cargar la analítica.');
    } finally {
      setLoading(false);
      setTimeout(() => setIsReady(true), 200);
    }
  }, [activeBrandId, dateRange, activeLocationId, isAllLocations]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    isReady,
    data,
    prevData,
    allProducts,
    advancedData,
    integrityStats,
    fetchData
  };
}
