import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * useCRM Hook
 * manages customer data derived from orders and leads.
 * Deduplicates customers by phone number and calculates LTV, frequency, etc.
 */
export function useCRM() {
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id;
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);

  const fetchData = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);

    try {
      // 1. Fetch orders with customer info
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, customer_phone, customer_name, total_amount, created_at, status,
          order_items (
            id, quantity, 
            products ( name )
          )
        `)
        .eq('brand_id', brandId)
        .not('customer_phone', 'is', null)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // 2. Fetch leads (potential customers)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('brand_id', brandId);

      if (leadsError) throw leadsError;

      setOrders(ordersData || []);
      setLeads(leadsData || []);
    } catch (error) {
      console.error('[useCRM] Error fetching CRM data:', error);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform data into a customer-centric list
  const customers = useMemo(() => {
    const customerMap = {};

    // Process orders to build customer profiles
    orders.forEach(order => {
      const phone = order.customer_phone;
      if (!phone) return;

      if (!customerMap[phone]) {
        customerMap[phone] = {
          phone,
          name: order.customer_name || 'Sin nombre',
          ltv: 0,
          ordersCount: 0,
          lastVisit: order.created_at,
          firstVisit: order.created_at,
          avgTicket: 0,
          status: 'nuevo',
          orderHistory: [],
          source: 'order'
        };
      }

      // Update name if we find a better one
      if ((customerMap[phone].name === 'Sin nombre' || !customerMap[phone].name) && order.customer_name) {
        customerMap[phone].name = order.customer_name;
      }

      // Aggregate metrics for delivered orders
      if (order.status === 'delivered') {
        customerMap[phone].ltv += Number(order.total_amount || 0);
        customerMap[phone].ordersCount += 1;
      }

      // Track visit dates
      if (new Date(order.created_at) > new Date(customerMap[phone].lastVisit)) {
        customerMap[phone].lastVisit = order.created_at;
      }
      if (new Date(order.created_at) < new Date(customerMap[phone].firstVisit)) {
        customerMap[phone].firstVisit = order.created_at;
      }

      customerMap[phone].orderHistory.push(order);
    });

    // Process leads (if they have a phone and aren't already in the list)
    leads.forEach(lead => {
      const phone = lead.phone || lead.customer_phone;
      if (!phone) return;

      if (!customerMap[phone]) {
        customerMap[phone] = {
          phone,
          name: lead.name || lead.customer_name || 'Prospecto',
          ltv: 0,
          ordersCount: 0,
          lastVisit: lead.created_at,
          firstVisit: lead.created_at,
          avgTicket: 0,
          status: 'prospecto',
          orderHistory: [],
          source: 'lead',
          metadata: lead
        };
      }
    });

    // Calculate final metrics and segments
    const now = new Date();
    return Object.values(customerMap).map(c => {
      const lastVisitDate = new Date(c.lastVisit);
      const daysSinceLastVisit = Math.floor((now - lastVisitDate) / (1000 * 60 * 60 * 24));
      
      c.avgTicket = c.ordersCount > 0 ? c.ltv / c.ordersCount : 0;

      // Favorite product calculation
      const productCounts = {};
      c.orderHistory.forEach(order => {
        order.order_items?.forEach(item => {
          const name = item.products?.name;
          if (name) {
            productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1);
          }
        });
      });

      const favoriteProduct = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';


      // Calculate orders in time windows
      const ordersLastMonth = c.orderHistory.filter(o => 
        o.status === 'delivered' && 
        new Date(o.created_at) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      const ordersLastWeek = c.orderHistory.filter(o => 
        o.status === 'delivered' && 
        new Date(o.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      // Segmentation logic (4.2 in task.md)
      if (c.source === 'lead' && c.ordersCount === 0) {
        c.segment = 'prospecto';
      } else if (daysSinceLastVisit > 45) {
        c.segment = 'perdido';
      } else if (daysSinceLastVisit > 21) {
        c.segment = 'dormido';
      } else if (ordersLastMonth >= 5) {
        c.segment = 'frecuente';
      } else if (ordersLastMonth >= 2) {
        c.segment = 'recurrente';
      } else if (ordersLastWeek === 1 && c.ordersCount === 1) {
        c.segment = 'nuevo';
      } else {
        c.segment = 'ocasional';
      }

      return c;
    });
  }, [orders, leads]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => ['frecuente', 'recurrente', 'nuevo'].includes(c.segment)).length;
    const dormantCustomers = customers.filter(c => c.segment === 'dormido').length;
    const lostCustomers = customers.filter(c => c.segment === 'perdido').length;
    const totalLTV = customers.reduce((sum, c) => sum + c.ltv, 0);

    return {
      totalCustomers,
      activeCustomers,
      dormantCustomers,
      lostCustomers,
      totalLTV,
      avgLTV: totalCustomers > 0 ? totalLTV / totalCustomers : 0
    };
  }, [customers]);

  return {
    customers,
    stats,
    loading,
    refresh: fetchData
  };
}
