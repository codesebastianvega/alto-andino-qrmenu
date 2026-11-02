import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Parses customer name and address from raw strings.
 * Often restaurant orders have names like:
 * "Dania Katheryn Rodriguez Duarte [Dir: Carrera 2 #23-11 Coclies - Puerta a la derecha]"
 */
export function parseCustomerInfo(rawName = '', deliveryAddress = '', deliveryNotes = '') {
  let cleanName = (rawName || '').trim();
  let address = (deliveryAddress || '').trim();
  let notes = (deliveryNotes || '').trim();

  const dirMatch = cleanName.match(/^(.*?)\s*\[(?:Dir|Dirección|Direccion):\s*(.*?)\]$/i);
  if (dirMatch) {
    cleanName = dirMatch[1].trim();
    if (!address) {
      address = dirMatch[2].trim();
    }
  }

  // Clean address from common suffixes like "- Puerta a la derecha"
  if (address && !notes && address.includes('-')) {
    const parts = address.split('-');
    if (parts.length > 1) {
      address = parts[0].trim();
      notes = parts.slice(1).join('-').trim();
    }
  }

  return {
    cleanName: cleanName || 'Sin nombre',
    address: address || '',
    notes: notes || ''
  };
}

/**
 * useCRM Hook
 * Manages customer data derived from orders and leads.
 * Deduplicates customers by phone number, calculates LTV, frequency,
 * detects cancellations/friction, and provides actionable recovery states.
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
      // 1. Fetch orders with customer info, status, cancellation reasons, and items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, customer_phone, customer_name, total_amount, created_at, status,
          cancellation_reason, cancelled_at, delivery_address, delivery_notes, origin, fulfillment_type,
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
      const phone = order.customer_phone?.trim();
      if (!phone) return;

      if (!customerMap[phone]) {
        const { cleanName, address, notes } = parseCustomerInfo(
          order.customer_name, 
          order.delivery_address, 
          order.delivery_notes
        );

        customerMap[phone] = {
          phone,
          rawName: order.customer_name || 'Sin nombre',
          name: cleanName,
          address,
          deliveryNotes: notes,
          ltv: 0,
          ordersCount: 0, // delivered orders count
          cancelledCount: 0,
          hasCancelled: false,
          lastCancellationReason: null,
          lastCancellationDate: null,
          lastVisit: order.created_at,
          firstVisit: order.created_at,
          lastOrder: order,
          avgTicket: 0,
          status: 'nuevo',
          orderHistory: [],
          source: 'order'
        };
      }

      // Update name & address if we find more detailed information
      const { cleanName, address, notes } = parseCustomerInfo(
        order.customer_name, 
        order.delivery_address, 
        order.delivery_notes
      );
      if ((customerMap[phone].name === 'Sin nombre' || !customerMap[phone].name) && cleanName) {
        customerMap[phone].name = cleanName;
      }
      if (!customerMap[phone].address && address) {
        customerMap[phone].address = address;
      }
      if (!customerMap[phone].deliveryNotes && notes) {
        customerMap[phone].deliveryNotes = notes;
      }

      // Aggregate metrics for delivered orders
      if (order.status === 'delivered') {
        customerMap[phone].ltv += Number(order.total_amount || 0);
        customerMap[phone].ordersCount += 1;
      } else if (order.status === 'cancelled') {
        customerMap[phone].cancelledCount += 1;
        customerMap[phone].hasCancelled = true;
        if (!customerMap[phone].lastCancellationReason && order.cancellation_reason) {
          customerMap[phone].lastCancellationReason = order.cancellation_reason;
          customerMap[phone].lastCancellationDate = order.cancelled_at || order.created_at;
        }
      }

      // Track visit dates
      if (new Date(order.created_at) > new Date(customerMap[phone].lastVisit)) {
        customerMap[phone].lastVisit = order.created_at;
        customerMap[phone].lastOrder = order;
      }
      if (new Date(order.created_at) < new Date(customerMap[phone].firstVisit)) {
        customerMap[phone].firstVisit = order.created_at;
      }

      customerMap[phone].orderHistory.push(order);
    });

    // Process leads (if they have a phone and aren't already in the list)
    leads.forEach(lead => {
      const phone = (lead.phone || lead.customer_phone)?.trim();
      if (!phone) return;

      if (!customerMap[phone]) {
        const { cleanName, address } = parseCustomerInfo(lead.name || lead.customer_name);
        customerMap[phone] = {
          phone,
          rawName: lead.name || lead.customer_name || 'Prospecto',
          name: cleanName || 'Prospecto',
          address: address || lead.address || '',
          deliveryNotes: lead.notes || '',
          ltv: 0,
          ordersCount: 0,
          cancelledCount: 0,
          hasCancelled: false,
          lastCancellationReason: null,
          lastCancellationDate: null,
          lastVisit: lead.created_at,
          firstVisit: lead.created_at,
          lastOrder: null,
          avgTicket: 0,
          status: 'prospecto',
          orderHistory: [],
          source: 'lead',
          metadata: lead
        };
      }
    });

    // Calculate final metrics, friction detection, and segments
    const now = new Date();
    const processedCustomers = Object.values(customerMap).map(c => {
      const lastVisitDate = new Date(c.lastVisit);
      const daysSinceLastVisit = Math.max(0, Math.floor((now - lastVisitDate) / (1000 * 60 * 60 * 24)));
      c.daysSinceLastVisit = daysSinceLastVisit;
      
      c.avgTicket = c.ordersCount > 0 ? c.ltv / c.ordersCount : 0;

      // Extract favorite product OR last requested product (even from cancelled/pending orders)
      const productCounts = {};
      let anyProductRequested = null;

      c.orderHistory.forEach(order => {
        order.order_items?.forEach(item => {
          const name = item.products?.name;
          if (name) {
            if (!anyProductRequested) anyProductRequested = name;
            productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1);
          }
        });
      });

      c.favoriteProduct = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || anyProductRequested || 'Sin preferencia';

      // Last order status
      const lastOrderStatus = c.lastOrder?.status || (c.orderHistory[0]?.status);
      c.lastOrderStatus = lastOrderStatus;

      // --- SEGMENTATION & CHURN / HEALTH LOGIC ---
      // 1. Friction / Cancelled Orders:
      // If customer has 0 delivered orders and at least 1 cancelled, or their latest order was cancelled
      if (c.hasCancelled && (c.ordersCount === 0 || lastOrderStatus === 'cancelled')) {
        c.segment = 'friccion';
        c.churnRisk = 95;
        c.healthStatus = 'friccion';
        c.healthLabel = '🚨 Pedido Cancelado';
        c.actionRecommendation = 'Recuperar con disculpa y cupón especial';
      } else if (c.source === 'lead' && c.ordersCount === 0 && !c.hasCancelled) {
        c.segment = 'prospecto';
        c.churnRisk = 45;
        c.healthStatus = 'prospecto';
        c.healthLabel = '✨ Prospecto';
        c.actionRecommendation = 'Enviar invitación con oferta de bienvenida';
      } else if (daysSinceLastVisit > 45) {
        c.segment = 'perdido';
        c.churnRisk = 90;
        c.healthStatus = 'riesgo';
        c.healthLabel = '❄️ Perdido (+45d)';
        c.actionRecommendation = 'Campaña de reactivación agresiva';
      } else if (daysSinceLastVisit > 21) {
        c.segment = 'dormido';
        c.churnRisk = 65;
        c.healthStatus = 'alerta';
        c.healthLabel = '💤 Inactivo (+21d)';
        c.actionRecommendation = 'Recordatorio amistoso con bento del día';
      } else if (c.ordersCount >= 3) {
        c.segment = 'vip';
        c.churnRisk = 10;
        c.healthStatus = 'saludable';
        c.healthLabel = '💎 Cliente VIP';
        c.actionRecommendation = 'Agradecimiento VIP / Beneficios exclusivos';
      } else if (c.ordersCount >= 2) {
        c.segment = 'frecuente';
        c.churnRisk = 20;
        c.healthStatus = 'saludable';
        c.healthLabel = '🟢 Frecuente';
        c.actionRecommendation = 'Mantener engagement semanal';
      } else if (c.ordersCount === 1) {
        c.segment = 'nuevo';
        c.churnRisk = 30;
        c.healthStatus = 'saludable';
        c.healthLabel = '🌱 Nuevo Comprador';
        c.actionRecommendation = 'Consultar satisfacción / Feedback';
      } else {
        c.segment = 'ocasional';
        c.churnRisk = 40;
        c.healthStatus = 'saludable';
        c.healthLabel = 'Comensal Ocasional';
        c.actionRecommendation = 'Promocionar platos del día';
      }

      return c;
    });

    // --- RFM SCORING (Quintiles) ---
    const sortedByRecency = [...processedCustomers].sort((a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit);
    const sortedByFreq = [...processedCustomers].sort((a, b) => b.ordersCount - a.ordersCount);
    const sortedByMonetary = [...processedCustomers].sort((a, b) => b.ltv - a.ltv);

    const getScore = (index, total) => {
      if (total <= 1) return 5;
      const percentile = (index / total) * 100;
      if (percentile <= 20) return 5;
      if (percentile <= 40) return 4;
      if (percentile <= 60) return 3;
      if (percentile <= 80) return 2;
      return 1;
    };

    const totalCount = processedCustomers.length;
    
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
      
      // Top 20% by Monetary with at least 1 order are Whales
      customer.isWhale = customer.ordersCount > 0 && mIndex < Math.max(1, totalCount * 0.2);
    });

    return processedCustomers;
  }, [orders, leads]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const frictionCustomers = customers.filter(c => c.segment === 'friccion' || c.hasCancelled).length;
    const activeCustomers = customers.filter(c => ['vip', 'frecuente', 'nuevo'].includes(c.segment)).length;
    const dormantCustomers = customers.filter(c => c.segment === 'dormido').length;
    const lostCustomers = customers.filter(c => c.segment === 'perdido').length;
    const totalLTV = customers.reduce((sum, c) => sum + c.ltv, 0);

    return {
      totalCustomers,
      frictionCustomers,
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
