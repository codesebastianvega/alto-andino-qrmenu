import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import {
  parseCustomerInfo,
  getDiscardedOrderIdsSet,
  backfillUnlinkedOrders,
  syncCollectionToFinancials,
  displayCustomerPhone,
  isAnonymousCustomerName,
  normalizePhone,
} from '../utils/customerSync';

export { parseCustomerInfo };

/**
 * useCRM Hook
 * Manages customer data derived from public.customers, public.orders, and public.leads.
 * Deduplicates customers by customer_id / phone number, calculates LTV, frequency,
 * detects cancellations/friction, and provides actionable recovery states.
 */
export function useCRM() {
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id;
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [dbCustomers, setDbCustomers] = useState([]);
  const [leads, setLeads] = useState([]);

  const discardedSet = useMemo(
    () => getDiscardedOrderIdsSet(activeBrand, brandId),
    [activeBrand, brandId]
  );

  const fetchData = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);

    try {
      const [ordersRes, custRes, leadsRes] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            id, customer_id, customer_phone, customer_name, total_amount, created_at, status,
            payment_status, payment_method, paid_amount,
            cancellation_reason, cancelled_at, delivery_address, delivery_notes, origin, fulfillment_type,
            order_items (
              id, quantity, 
              products ( name )
            )
          `)
          .eq('brand_id', brandId)
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('id, name, phone, email, notes, tags, created_at')
          .eq('brand_id', brandId),
        supabase
          .from('leads')
          .select('*')
          .eq('brand_id', brandId)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (leadsRes.error) throw leadsRes.error;

      const fetchedOrders = ordersRes.data || [];
      setOrders(fetchedOrders);
      setDbCustomers(custRes.data || []);
      setLeads(leadsRes.data || []);

      // Trigger non-blocking relational backfill for historical orders without customer_id
      backfillUnlinkedOrders(brandId, fetchedOrders, discardedSet);
    } catch (error) {
      console.error('[useCRM] Error fetching CRM data:', error);
    } finally {
      setLoading(false);
    }
  }, [brandId, discardedSet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [stageOverrides, setStageOverrides] = useState(() => {
    if (!brandId) return {};
    try {
      const fromBrand = activeBrand?.config?.crm_stages;
      if (fromBrand && typeof fromBrand === 'object') return fromBrand;
      return JSON.parse(localStorage.getItem(`aa_crm_stages_${brandId}`) || '{}');
    } catch (e) {
      return {};
    }
  });

  const [archivedKeys, setArchivedKeys] = useState(() => {
    if (!brandId) return [];
    try {
      const fromBrand = activeBrand?.config?.crm_archived;
      if (Array.isArray(fromBrand)) return fromBrand;
      return JSON.parse(localStorage.getItem(`aa_crm_archived_${brandId}`) || '[]');
    } catch (e) {
      return [];
    }
  });

  const updateCustomerStage = useCallback((customerKey, newStage) => {
    setStageOverrides(prev => {
      const next = { ...prev, [customerKey]: newStage };
      if (brandId) {
        localStorage.setItem(`aa_crm_stages_${brandId}`, JSON.stringify(next));
        supabase.from('brands').select('config').eq('id', brandId).single().then(({ data }) => {
          const currentConfig = data?.config || {};
          supabase.from('brands').update({
            config: {
              ...currentConfig,
              crm_stages: next
            }
          }).eq('id', brandId).then(() => {});
        }).catch(err => console.warn('Sync crm_stages error:', err));
      }
      return next;
    });
  }, [brandId]);

  const toggleArchiveCustomer = useCallback((customerKey) => {
    setArchivedKeys(prev => {
      const isArchived = prev.includes(customerKey);
      const next = isArchived ? prev.filter(k => k !== customerKey) : [...prev, customerKey];
      if (brandId) {
        localStorage.setItem(`aa_crm_archived_${brandId}`, JSON.stringify(next));
        supabase.from('brands').select('config').eq('id', brandId).single().then(({ data }) => {
          const currentConfig = data?.config || {};
          supabase.from('brands').update({
            config: {
              ...currentConfig,
              crm_archived: next
            }
          }).eq('id', brandId).then(() => {});
        }).catch(err => console.warn('Sync crm_archived error:', err));
      }
      return next;
    });
  }, [brandId]);

  const settleCustomerOrder = useCallback(async (orderId, paymentMethod = 'efectivo', { isHistorical = false, customAmount, discountReason } = {}) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const originalTotal = Number(order?.total_amount || 0);
      const prevPaid = Number(order?.paid_amount || 0);
      const remaining = Math.max(0, originalTotal - prevPaid);

      let finalTotal = originalTotal;
      let finalDiscount = Number(order?.discount_amount || 0);
      let finalReason = order?.discount_reason || null;
      let actualCollected = remaining;

      if (customAmount !== undefined && customAmount !== null && Number(customAmount) >= 0) {
        const agreed = Number(customAmount);
        actualCollected = agreed;
        if (agreed < originalTotal) {
          const diff = originalTotal - agreed;
          finalDiscount += diff;
          finalTotal = agreed;
          finalReason = discountReason || `Descuento Cortesía (-${diff.toLocaleString('es-CO')})`;
        }
      }

      const cleanNotes = (order?.delivery_notes || '').replace(/\[\s*🤝?\s*FIADO[^\]]*\]/gi, '').trim();
      const finalNotes = isHistorical ? `${cleanNotes} [Ajuste Histórico Regularizado]`.trim() : cleanNotes;
      const finalMethod = isHistorical ? `${paymentMethod} (Ajuste Histórico)` : paymentMethod;

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: finalMethod,
          total_amount: finalTotal,
          discount_amount: finalDiscount,
          discount_reason: finalReason,
          delivery_notes: finalNotes || null,
          paid_amount: finalTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Sync to Financial Ledger & Pocket Balance when it's a real collection today
      if (!isHistorical && actualCollected > 0) {
        const { cleanName } = parseCustomerInfo(order?.customer_name, order?.delivery_address, order?.delivery_notes);
        await syncCollectionToFinancials({
          brandId,
          customerName: cleanName || 'Cliente',
          amount: actualCollected,
          paymentMethod,
          isHistorical: false,
          notes: `Cobro desde CRM (#${String(orderId).slice(0, 4).toUpperCase()})`
        });
      }

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error settling customer order in CRM:', err);
      throw err;
    }
  }, [orders, brandId, fetchData]);

  // Transform data into a customer-centric list
  const customers = useMemo(() => {
    const customerMap = {};
    const dbCustById = new Map();
    (dbCustomers || []).forEach(dc => {
      if (dc.id) dbCustById.set(dc.id, dc);
    });

    // Process orders to build customer profiles (excluding discarded test orders)
    orders.forEach(order => {
      if (discardedSet.has(order.id)) return;

      const linkedCust = order.customer_id ? dbCustById.get(order.customer_id) : null;
      const rawPhone = order.customer_phone || linkedCust?.phone || '';
      const phone = displayCustomerPhone(rawPhone);
      const normPhone = normalizePhone(rawPhone);

      const { cleanName, address, notes } = parseCustomerInfo(
        order.customer_name || linkedCust?.name, 
        order.delivery_address, 
        order.delivery_notes || linkedCust?.notes
      );

      const normName = cleanName?.trim().toLowerCase();
      // Ignorar nombres genéricos de pruebas o placeholders si no hay teléfono
      if (!normPhone && isAnonymousCustomerName(cleanName)) {
        return;
      }

      // Clave única: teléfono normalizado si existe; o nombre normalizado si no tiene teléfono
      const customerKey = normPhone ? normPhone : `name:${normName}`;
      if (!customerKey) return;

      if (!customerMap[customerKey]) {
        customerMap[customerKey] = {
          key: customerKey,
          customerId: order.customer_id || linkedCust?.id || null,
          phone: phone,
          rawName: order.customer_name || linkedCust?.name || 'Sin nombre',
          name: cleanName,
          address,
          deliveryNotes: notes,
          ltv: 0,
          ordersCount: 0, // delivered orders count
          totalOwed: 0,   // cuentas por cobrar / saldo fiado
          pendingOrders: [],
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

      if (!customerMap[customerKey].customerId && (order.customer_id || linkedCust?.id)) {
        customerMap[customerKey].customerId = order.customer_id || linkedCust?.id;
      }
      if (!customerMap[customerKey].phone && phone) {
        customerMap[customerKey].phone = phone;
      }
      if (isAnonymousCustomerName(customerMap[customerKey].name) && !isAnonymousCustomerName(cleanName)) {
        customerMap[customerKey].name = cleanName;
      }
      if (!customerMap[customerKey].address && address) {
        customerMap[customerKey].address = address;
      }
      if (!customerMap[customerKey].deliveryNotes && notes) {
        customerMap[customerKey].deliveryNotes = notes;
      }

      // Aggregate metrics for delivered orders
      if (order.status === 'delivered') {
        customerMap[customerKey].ltv += Number(order.total_amount || 0);
        customerMap[customerKey].ordersCount += 1;
      } else if (order.status === 'cancelled') {
        customerMap[customerKey].cancelledCount += 1;
        customerMap[customerKey].hasCancelled = true;
        if (!customerMap[customerKey].lastCancellationReason && order.cancellation_reason) {
          customerMap[customerKey].lastCancellationReason = order.cancellation_reason;
          customerMap[customerKey].lastCancellationDate = order.cancelled_at || order.created_at;
        }
      }

      // Check for unpaid fiado or pending balance (accounting for partial payments)
      const isUnpaid = order.status !== 'cancelled' && (
        order.payment_status === 'pending' || 
        order.payment_method === 'fiado' ||
        String(order.delivery_notes || '').toLowerCase().includes('fiado')
      );
      const remainingOrderDebt = Math.max(0, Number(order.total_amount || 0) - Number(order.paid_amount || 0));
      if (isUnpaid && remainingOrderDebt > 0) {
        customerMap[customerKey].totalOwed += remainingOrderDebt;
        customerMap[customerKey].pendingOrders.push(order);
      }

      // Track visit dates
      if (new Date(order.created_at) > new Date(customerMap[customerKey].lastVisit)) {
        customerMap[customerKey].lastVisit = order.created_at;
        customerMap[customerKey].lastOrder = order;
      }
      if (new Date(order.created_at) < new Date(customerMap[customerKey].firstVisit)) {
        customerMap[customerKey].firstVisit = order.created_at;
      }

      customerMap[customerKey].orderHistory.push(order);
    });

    // Also include registered customers in public.customers who haven't placed an order yet
    (dbCustomers || []).forEach(dc => {
      const phone = displayCustomerPhone(dc.phone);
      const normPhone = normalizePhone(dc.phone);
      const { cleanName, address, notes } = parseCustomerInfo(dc.name, '', dc.notes);
      if (!normPhone && isAnonymousCustomerName(cleanName)) return;

      const customerKey = normPhone ? normPhone : `name:${cleanName.toLowerCase()}`;
      if (!customerMap[customerKey]) {
        customerMap[customerKey] = {
          key: customerKey,
          customerId: dc.id,
          phone,
          rawName: dc.name || 'Cliente',
          name: cleanName,
          address,
          deliveryNotes: notes,
          ltv: 0,
          ordersCount: 0,
          totalOwed: 0,
          pendingOrders: [],
          cancelledCount: 0,
          hasCancelled: false,
          lastCancellationReason: null,
          lastCancellationDate: null,
          lastVisit: dc.created_at || new Date().toISOString(),
          firstVisit: dc.created_at || new Date().toISOString(),
          lastOrder: null,
          avgTicket: 0,
          status: 'nuevo',
          orderHistory: [],
          source: 'directory'
        };
      } else if (!customerMap[customerKey].customerId) {
        customerMap[customerKey].customerId = dc.id;
      }
    });

    // Process leads (if they have a phone and aren't already in the list)
    leads.forEach(lead => {
      const phone = (lead.phone || lead.customer_phone)?.trim();
      if (!phone) return;

      if (!customerMap[phone]) {
        const { cleanName, address } = parseCustomerInfo(lead.name || lead.customer_name);
        customerMap[phone] = {
          key: phone.replace(/\D/g, ''),
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

      // Apply manual stage overrides if configured (la clasificación manual del usuario prevalece sobre cálculos automáticos)
      if (stageOverrides[customer.key]) {
        const manualStage = stageOverrides[customer.key];
        customer.segment = manualStage;
        customer.isManualStage = true;

        const stageLabels = {
          vip: '💎 VIP',
          frecuente: '🟢 Frecuente',
          nuevo: '🌱 Nuevo',
          dormido: '💤 Inactivo (+21d)',
          perdido: '❄️ Perdido (+45d)',
          ocasional: 'Comensal Ocasional',
          friccion: '🚨 Pedido Cancelado',
          prospecto: '✨ Prospecto'
        };
        customer.healthStatus = manualStage === 'friccion' ? 'friccion' : (manualStage === 'perdido' ? 'riesgo' : (manualStage === 'dormido' ? 'alerta' : 'saludable'));
        customer.healthLabel = stageLabels[manualStage] || manualStage;

        // Si el usuario decide reclasificarlo fuera de fricción, se respeta su decisión
        if (manualStage !== 'friccion') {
          customer.hasCancelled = false;
        }
      }
      customer.isArchived = archivedKeys.includes(customer.key);
    });

    return processedCustomers;
  }, [orders, dbCustomers, leads, stageOverrides, archivedKeys, discardedSet]);

  const activeCustomers = useMemo(() => {
    return customers.filter(c => !c.isArchived);
  }, [customers]);

  const archivedCustomers = useMemo(() => {
    return customers.filter(c => c.isArchived);
  }, [customers]);

  const stats = useMemo(() => {
    const totalCustomers = activeCustomers.length;
    const frictionCustomers = activeCustomers.filter(c => c.segment === 'friccion').length;
    const activeClients = activeCustomers.filter(c => ['vip', 'frecuente', 'nuevo'].includes(c.segment)).length;
    const dormantCustomers = activeCustomers.filter(c => c.segment === 'dormido').length;
    const lostCustomers = activeCustomers.filter(c => c.segment === 'perdido').length;
    const totalLTV = activeCustomers.reduce((sum, c) => sum + c.ltv, 0);

    return {
      totalCustomers,
      frictionCustomers,
      activeCustomers: activeClients,
      dormantCustomers,
      lostCustomers,
      totalLTV,
      avgLTV: totalCustomers > 0 ? totalLTV / totalCustomers : 0
    };
  }, [activeCustomers]);

  return {
    customers: activeCustomers,
    allCustomers: customers,
    archivedCustomers,
    stats,
    loading,
    refresh: fetchData,
    updateCustomerStage,
    toggleArchiveCustomer,
    settleCustomerOrder
  };
}
