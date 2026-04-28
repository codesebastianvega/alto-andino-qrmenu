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
    const processedCustomers = Object.values(customerMap).map(c => {
      const lastVisitDate = new Date(c.lastVisit);
      const daysSinceLastVisit = Math.floor((now - lastVisitDate) / (1000 * 60 * 60 * 24));
      c.daysSinceLastVisit = daysSinceLastVisit;
      
      c.avgTicket = c.ordersCount > 0 ? c.ltv / c.ordersCount : 0;

      // Churn Risk Calculation
      // If they have multiple orders, we can see their frequency
      if (c.ordersCount >= 2) {
        const firstVisitDate = new Date(c.firstVisit);
        const totalDaysRange = Math.floor((lastVisitDate - firstVisitDate) / (1000 * 60 * 60 * 24));
        const avgGap = totalDaysRange / (c.ordersCount - 1);
        c.avgOrderGap = avgGap;
        
        // Churn risk grows as daysSinceLastVisit exceeds avgGap
        // Risk = 100% if daysSinceLastVisit is 3x their average gap
        const riskFactor = avgGap > 0 ? daysSinceLastVisit / (avgGap * 3) : 0;
        c.churnRisk = Math.min(Math.round(riskFactor * 100), 100);
      } else {
        c.churnRisk = daysSinceLastVisit > 30 ? 70 : 20; // Default for single-order or lead
      }

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

      c.favoriteProduct = Object.entries(productCounts)
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

      // Segmentation logic (Legacy)
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

    // --- RFM SCORING (Quintiles) ---
    // Sort and score Recency (Inverted: lower days = higher score)
    const sortedByRecency = [...processedCustomers].sort((a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit);
    // Sort and score Frequency
    const sortedByFreq = [...processedCustomers].sort((a, b) => b.ordersCount - a.ordersCount);
    // Sort and score Monetary
    const sortedByMonetary = [...processedCustomers].sort((a, b) => b.ltv - a.ltv);

    const getScore = (index, total) => {
      const percentile = (index / total) * 100;
      if (percentile <= 20) return 5;
      if (percentile <= 40) return 4;
      if (percentile <= 60) return 3;
      if (percentile <= 80) return 2;
      return 1;
    };

    const totalCount = processedCustomers.length;
    
    // Assign scores and detect Whales (Top 20% by Monetary)
    processedCustomers.forEach(customer => {
      const rIndex = sortedByRecency.findIndex(c => c.phone === customer.phone);
      const fIndex = sortedByFreq.findIndex(c => c.phone === customer.phone);
      const mIndex = sortedByMonetary.findIndex(c => c.phone === customer.phone);

      customer.rfm = {
        r: getScore(rIndex, totalCount),
        f: getScore(fIndex, totalCount),
        m: getScore(mIndex, totalCount)
      };
      
      customer.rfmScore = Math.round((customer.rfm.r + customer.rfm.f + customer.rfm.m) / 3);
      
      // Pareto Rule: Top 20% of customers by Monetary value are "Whales"
      customer.isWhale = mIndex < (totalCount * 0.2);
    });

    return processedCustomers;
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
