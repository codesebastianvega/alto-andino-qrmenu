import { AlertCircle, TrendingUp, Zap, ShoppingCart } from 'lucide-react';

export function computeBiStats(data, prevData) {
  const currentOrders = data?.orders || [];
  const currentLeads = data?.leads || [];
  const prevOrders = prevData?.orders || [];
  const prevLeads = prevData?.leads || [];

  if (!data || !data.orders) {
    return {
      current: { revenue: 0, profit: 0, margin: 0, cost: 0, discount: 0, avgTicket: 0, orderCount: 0, leadCount: 0, avgTime: 0, cancelledCount: 0, cancelledRevenue: 0 },
      prev: { revenue: 0, profit: 0, margin: 0, cost: 0, discount: 0, avgTicket: 0, orderCount: 0, leadCount: 0, avgTime: 0, cancelledCount: 0, cancelledRevenue: 0 },
      diffs: { revenue: 0, profit: 0, orders: 0, ticket: 0, leads: 0, avgTime: 0, cancelled: 0, margin: 0 }
    };
  }

  const calc = (orders, leads) => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const cancelled = orders.filter(o => o.status === 'cancelled');

    let revenue = 0;
    let cost = 0;
    let discount = 0;

    delivered.forEach(o => {
      revenue += Number(o.total_amount || 0);
      discount += Number(o.discount_amount || 0);
      o.order_items?.forEach(item => {
        cost += (Number(item.quantity) * Number(item.products?.cost || 0));
      });
    });

    const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
    const profit = revenue - cost;
    const avgTicket = delivered.length ? revenue / delivered.length : 0;

    let totalMins = 0;
    let timeCount = 0;
    delivered.forEach(o => {
      if (o.delivered_at && o.created_at) {
        const diff = (new Date(o.delivered_at) - new Date(o.created_at)) / 60000;
        if (diff > 0 && diff < 300) {
          totalMins += diff;
          timeCount++;
        }
      }
    });
    const avgTime = timeCount ? totalMins / timeCount : 0;

    return {
      revenue,
      profit,
      margin,
      cost,
      discount,
      avgTicket,
      orderCount: delivered.length,
      leadCount: leads.length,
      avgTime,
      cancelledCount: cancelled.length,
      cancelledRevenue: cancelled.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    };
  };

  const current = calc(currentOrders, currentLeads);
  const prev = calc(prevOrders, prevLeads);

  const getDiff = (curr, old) => {
    if (!old || old === 0) return curr > 0 ? 100 : 0;
    return ((curr - old) / old) * 100;
  };

  return {
    current,
    prev,
    diffs: {
      revenue: getDiff(current.revenue, prev.revenue),
      profit: getDiff(current.profit, prev.profit),
      orders: getDiff(current.orderCount, prev.orderCount),
      ticket: getDiff(current.avgTicket, prev.avgTicket),
      leads: getDiff(current.leadCount, prev.leadCount),
      avgTime: getDiff(current.avgTime, prev.avgTime),
      cancelled: getDiff(current.cancelledCount, prev.cancelledCount),
      margin: current.margin - prev.margin
    }
  };
}

export function computeBottleneckStats(orders) {
  if (!orders) return [];
  const products = {};
  orders.filter(o => o.status === 'delivered').forEach(o => {
    if (o.delivered_at && o.created_at) {
      const time = (new Date(o.delivered_at) - new Date(o.created_at)) / 60000;
      o.order_items?.forEach(item => {
        const name = item.products?.name;
        if (!name) return;
        if (!products[name]) products[name] = { name, times: [], avg: 0 };
        products[name].times.push(time);
      });
    }
  });

  return Object.values(products)
    .map(p => ({ ...p, avg: Math.round(p.times.reduce((a, b) => a + b, 0) / p.times.length) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);
}

export function computeBcgMatrix(orders) {
  if (!orders) return { items: [], medians: { units: 0, margin: 0 }, missingItems: [] };
  const products = {};
  let totalVolume = 0;

  orders.filter(o => o.status === 'delivered').forEach(o => {
    o.order_items?.forEach(item => {
      const p = item.products;
      if (!p) return;
      if (!products[p.id]) {
        products[p.id] = {
          id: p.id,
          name: p.name,
          units: 0,
          revenue: 0,
          cost: (p.cost !== null && p.cost !== undefined) ? Number(p.cost) : 0,
          hasMissingCost: p.cost === null || p.cost === 0 || p.cost === undefined
        };
      }
      products[p.id].units += item.quantity;
      products[p.id].revenue += (item.quantity * item.unit_price);
      totalVolume += item.quantity;
    });
  });

  const relevanceThreshold = totalVolume * 0.01;
  const allItems = Object.values(products).filter(p => p.units >= relevanceThreshold);

  const validItems = allItems.filter(p => !p.hasMissingCost).map(p => ({
    ...p,
    margin: p.revenue > 0 ? ((p.revenue - (p.units * p.cost)) / p.revenue) * 100 : 0
  }));

  const missingItems = allItems.filter(p => p.hasMissingCost).map(p => ({
    ...p,
    margin: 100,
    bcgCategory: 'Dog'
  }));

  if (validItems.length === 0) return { items: missingItems, medians: { units: 0, margin: 0 }, missingItems };

  const sortedUnits = [...validItems].map(p => p.units).sort((a, b) => a - b);
  const sortedMargins = [...validItems].map(p => p.margin).sort((a, b) => a - b);

  const getMedian = (arr) => {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  const medians = {
    units: getMedian(sortedUnits),
    margin: getMedian(sortedMargins)
  };

  const items = [
    ...validItems.map(p => {
      let category = 'Dog';
      if (p.units >= medians.units && p.margin >= medians.margin) category = 'Star';
      else if (p.units >= medians.units && p.margin < medians.margin) category = 'Cow';
      else if (p.units < medians.units && p.margin >= medians.margin) category = 'Enigma';
      return { ...p, bcgCategory: category };
    }),
    ...missingItems
  ];

  return { items, medians, missingItems };
}

export function computeGrowthContribution(currentOrders, prevOrders) {
  if (!currentOrders || !prevOrders) return [];
  const currentItems = {};
  const prevItems = {};

  (currentOrders || []).filter(o => o.status === 'delivered').forEach(o => {
    o.order_items?.forEach(item => {
      const name = item.products?.name;
      if (!name) return;
      if (!currentItems[name]) currentItems[name] = { revenue: 0, profit: 0, units: 0 };
      const revenue = item.quantity * item.unit_price;
      const profit = revenue - (item.quantity * Number(item.products?.cost || 0));
      currentItems[name].revenue += revenue;
      currentItems[name].profit += profit;
      currentItems[name].units += item.quantity;
    });
  });

  (prevOrders || []).filter(o => o.status === 'delivered').forEach(o => {
    o.order_items?.forEach(item => {
      const name = item.products?.name;
      if (!name) return;
      if (!prevItems[name]) prevItems[name] = { revenue: 0, profit: 0, units: 0 };
      const revenue = item.quantity * item.unit_price;
      const profit = revenue - (item.quantity * Number(item.products?.cost || 0));
      prevItems[name].revenue += revenue;
      prevItems[name].profit += profit;
      prevItems[name].units += item.quantity;
    });
  });

  const totalPrevProfit = Object.values(prevItems).reduce((sum, item) => sum + item.profit, 0) || 1;
  const allNames = new Set([...Object.keys(currentItems), ...Object.keys(prevItems)]);

  return Array.from(allNames).map(name => {
    const curr = currentItems[name] || { revenue: 0, profit: 0, units: 0 };
    const prev = prevItems[name] || { revenue: 0, profit: 0, units: 0 };
    const profitDiff = curr.profit - prev.profit;

    return {
      name,
      profitDiff,
      contribution: (profitDiff / totalPrevProfit) * 100,
      revenueGrow: prev.revenue > 0 ? ((curr.revenue - prev.revenue) / prev.revenue) * 100 : 100
    };
  }).sort((a, b) => b.profitDiff - a.profitDiff);
}

export function computeParetoData(orders, paretoType = 'revenue') {
  if (!orders) return [];
  const products = {};
  let total = 0;

  (orders || []).filter(o => o.status === 'delivered').forEach(o => {
    o.order_items?.forEach(item => {
      const name = item.products?.name;
      if (!name) return;
      if (!products[name]) products[name] = { name, value: 0 };
      const val = paretoType === 'revenue'
        ? (item.quantity * item.unit_price)
        : item.quantity;
      products[name].value += val;
      total += val;
    });
  });

  const sorted = Object.values(products).sort((a, b) => b.value - a.value);
  let cumulative = 0;

  return sorted.map(p => {
    cumulative += p.value;
    return {
      ...p,
      cumulativePercent: total > 0 ? (cumulative / total) * 100 : 0
    };
  });
}

export function computeLeakageAudit(orders) {
  if (!orders) return { cancellations: [], discounts: [], totalLeakage: 0 };
  const cancellations = orders
    .filter(o => o.status === 'cancelled')
    .map(o => ({
      id: o.id,
      reason: o.cancellation_reason || 'Sin motivo especificado',
      by: o.cancelled_by || 'Sistema',
      amount: Number(o.total_amount || 0),
      time: o.created_at
    }));

  const discounts = (orders || [])
    .filter(o => Number(o.discount_amount || 0) > 0)
    .map(o => ({
      id: o.id,
      reason: o.discount_reason || 'Descuento manual',
      amount: Number(o.discount_amount || 0),
      time: o.created_at
    }));

  return {
    cancellations,
    discounts,
    totalLeakage: cancellations.reduce((sum, c) => sum + c.amount, 0) + discounts.reduce((sum, d) => sum + d.amount, 0)
  };
}

export function computeProspectStats(leads, prevLeads) {
  const cur = leads || [];
  const prev = prevLeads || [];
  if (!cur.length && !prev.length) return { total: 0, totalDiff: 0, rate: 0, rateDiff: 0, contacted: 0 };

  const converted = cur.filter(l => l.status === 'converted').length;
  const contacted = cur.filter(l => l.status === 'contacted').length;
  const prevConverted = prev.filter(l => l.status === 'converted').length;

  const rate = cur.length > 0 ? (converted / cur.length) * 100 : 0;
  const prevRate = prev.length > 0 ? (prevConverted / prev.length) * 100 : 0;

  return {
    total: cur.length,
    totalDiff: prev.length === 0 ? (cur.length > 0 ? 100 : 0) : ((cur.length - prev.length) / prev.length) * 100,
    rate,
    rateDiff: rate - prevRate,
    contacted
  };
}

export function computeCategoryStats(orders) {
  if (!orders) return [];
  const cats = {};
  orders.filter(o => o.status === 'delivered').forEach(o => {
    o.order_items?.forEach(item => {
      const catName = item.products?.categories?.name || 'Varios';
      if (!cats[catName]) cats[catName] = { name: catName, value: 0, units: 0 };
      cats[catName].value += (item.quantity * item.unit_price);
      cats[catName].units += item.quantity;
    });
  });
  return Object.values(cats).sort((a, b) => b.value - a.value);
}

export function computeChannelStats(orders) {
  if (!orders) return [];
  const channels = {
    'En Mesa': { name: 'En Mesa', value: 0, fill: '#10B981' },
    'Para Llevar': { name: 'Para Llevar', value: 0, fill: '#3B82F6' },
    'Domicilio': { name: 'Domicilio', value: 0, fill: '#F59E0B' },
    'Programado': { name: 'Programado', value: 0, fill: '#8B5CF6' }
  };

  (orders || []).forEach(o => {
    const type = o.fulfillment_type || 'takeaway';
    let label = 'Para Llevar';
    if (type === 'dine_in') label = 'En Mesa';
    if (type === 'delivery') label = 'Domicilio';
    if (type === 'scheduled') label = 'Programado';

    if (channels[label]) channels[label].value += Number(o.total_amount);
  });

  return Object.values(channels).filter(c => c.value > 0).sort((a, b) => a.value - b.value);
}

export function computeTableStats(orders) {
  if (!orders) return [];
  const tableCounts = {};
  orders.filter(o => o.status === 'delivered').forEach(o => {
    const table = o.restaurant_tables;
    if (table) {
      const label = table.name || `Mesa ${table.table_number}`;
      if (!tableCounts[label]) tableCounts[label] = { name: label, pedidos: 0, ingresos: 0 };
      tableCounts[label].pedidos += 1;
      tableCounts[label].ingresos += Number(o.total_amount);
    }
  });
  return Object.values(tableCounts).sort((a, b) => b.ingresos - a.ingresos).slice(0, 8);
}

export function computePaymentStats(orders, payments, paymentMethods = []) {
  const pmCounts = {};

  if (payments && payments.length > 0) {
    payments.forEach(p => {
      const name = p.payment_methods?.name || 'Otro';
      pmCounts[name] = (pmCounts[name] || 0) + Number(p.amount || 0);
    });
  } else {
    orders?.filter(o => o.status === 'delivered').forEach(o => {
      let method = o.payment_method || 'Otro';
      if (method === 'cash') method = 'Efectivo';
      else if (method === 'card') method = 'Tarjeta';
      else if (method.length > 30) {
        const pmEntry = paymentMethods.find(p => p.id === method);
        if (pmEntry) method = pmEntry.name;
        else method = 'Otro (Personalizado)';
      }
      pmCounts[method] = (pmCounts[method] || 0) + (o.total_amount || 0);
    });
  }

  return Object.entries(pmCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function computeHourlyStats(orders) {
  const hours = Array.from({ length: 24 }, (_, i) => ({ label: `${i}h`, ventas: 0 }));
  if (!orders) return hours;
  orders.forEach(o => {
    const h = new Date(o.created_at).getHours();
    hours[h].ventas += Number(o.total_amount);
  });
  return hours;
}

export function computePeakHour(hourlyStats) {
  const max = [...hourlyStats].sort((a, b) => b.ventas - a.ventas)[0];
  return max?.ventas > 0 ? max.label : '--:--';
}

export function computeHeatmapStats(orders) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const matrix = Array.from({ length: 7 }, (_, d) => ({
    day: days[d],
    hours: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
  }));

  if (!orders) return matrix;
  orders.forEach(o => {
    const date = new Date(o.created_at);
    const d = date.getDay();
    const h = date.getHours();
    matrix[d].hours[h].count += 1;
  });
  return matrix;
}

export function computeDayOfWeekStats(orders) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const statsList = days.map(name => ({ name, pedidos: 0, revenue: 0, avgTicket: 0 }));

  if (!orders) return statsList;
  orders.forEach(o => {
    const d = new Date(o.created_at).getDay();
    statsList[d].pedidos += 1;
    statsList[d].revenue += Number(o.total_amount);
  });

  return statsList.map(s => ({
    ...s,
    avgTicket: s.pedidos > 0 ? s.revenue / s.pedidos : 0
  }));
}

export function computeProductProfitability(orders) {
  if (!orders) return [];
  const statsObj = {};
  orders.filter(o => o.status === 'delivered').forEach(o => {
    o.order_items?.forEach(item => {
      const p = item.products;
      if (!p) return;
      const name = p.name;
      if (!statsObj[name]) {
        statsObj[name] = {
          name,
          units: 0,
          revenue: 0,
          cost: Number(p.cost || 0),
          margin: Number(p.margin || 0),
          totalCost: 0,
          totalProfit: 0
        };
      }
      statsObj[name].units += item.quantity;
      statsObj[name].revenue += (item.quantity * item.unit_price);
      statsObj[name].totalCost += (item.quantity * Number(p.cost || 0));
    });
  });

  return Object.values(statsObj).map(s => ({
    ...s,
    totalProfit: s.revenue - s.totalCost,
    actualMargin: s.revenue > 0 ? ((s.revenue - s.totalCost) / s.revenue * 100) : 0
  })).sort((a, b) => b.revenue - a.revenue);
}

export function computeAnalyticsSummary(data, stats) {
  if (!data) return { visits: 0, scans: 0, ordersCount: 0, conversion: 0, abandonmentRate: 0, ticketPromedio: 0 };
  const events = data?.events || [];
  const orders = data?.orders || [];
  const visits = events.filter(e => e.event_name === 'menu_visit').length;
  const scans = events.filter(e => e.event_name === 'qr_scan').length;

  const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean));
  const sessionCount = Math.max(uniqueSessions.size, visits, scans);

  const ordersCount = orders.length;

  const convRate = sessionCount > 0
    ? ((ordersCount / sessionCount) * 100).toFixed(1)
    : (ordersCount > 0 ? 100 : 0);

  const abandonmentRate = sessionCount > 0
    ? Math.round(Math.max(0, 100 - (ordersCount / sessionCount * 100)))
    : (visits > 0 ? 100 : 0);

  const ticketPromedio = stats.orderCount > 0
    ? Math.round(stats.revenue / stats.orderCount)
    : 0;

  return {
    visits,
    scans,
    ordersCount,
    conversion: convRate,
    abandonmentRate,
    ticketPromedio
  };
}

export function generateSmartRecommendations(bcgData, growthContribution) {
  const recs = [];

  if (bcgData.missingItems.length > 0) {
    recs.push({
      type: 'warning',
      title: 'Integridad de Datos',
      desc: `Faltan costos para ${bcgData.missingItems.length} productos. La rentabilidad calculada puede ser inexacta.`,
      actionLabel: 'Completar Costos',
      icon: AlertCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    });
  }

  const heavyDogs = bcgData.items.filter(p => p.bcgCategory === 'Dog' && p.units > bcgData.medians.units * 0.5);
  if (heavyDogs.length > 0) {
    recs.push({
      type: 'danger',
      title: 'Fuga de Esfuerzo',
      desc: `${heavyDogs[0].name} tiene alto volumen pero margen crítico (${heavyDogs[0].margin.toFixed(1)}%).`,
      actionLabel: 'Revisar Receta',
      icon: TrendingUp,
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    });
  }

  const stars = bcgData.items.filter(p => p.bcgCategory === 'Star');
  if (stars.length > 0) {
    recs.push({
      type: 'success',
      title: 'Producto Estrella',
      desc: `${stars[0].name} lidera en margen y volumen. ¿Por qué no destacarlo más?`,
      actionLabel: 'Promocionar',
      icon: Zap,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    });
  }

  const cow = bcgData.items.find(p => p.bcgCategory === 'Cow');
  const contributor = growthContribution.find(c => c.name === cow?.name);
  if (contributor && contributor.profitDiff < 0) {
    recs.push({
      type: 'info',
      title: 'Vaca en Declive',
      desc: `${cow.name} aporta volumen pero su utilidad neta bajó.`,
      actionLabel: 'Ver Detalles',
      icon: ShoppingCart,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    });
  }

  return recs.slice(0, 3);
}

export function computeCategoryPopularity(orders) {
  const cats = {};
  let totalUnits = 0;

  (orders || []).filter(o => o.status === 'delivered').forEach(o => {
    o.order_items?.forEach(item => {
      const catName = item.products?.categories?.name || 'Varios';
      if (!cats[catName]) cats[catName] = { name: catName, units: 0, revenue: 0 };
      cats[catName].units += item.quantity;
      cats[catName].revenue += (item.quantity * item.unit_price);
      totalUnits += item.quantity;
    });
  });

  return Object.values(cats).map(c => ({
    ...c,
    share: totalUnits > 0 ? (c.units / totalUnits) * 100 : 0
  })).sort((a, b) => b.units - a.units);
}

export function computeHourlyPerformance(orders) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i}h`,
    orders: 0,
    revenue: 0,
    avgTicket: 0
  }));

  (orders || []).filter(o => o.status === 'delivered').forEach(o => {
    const h = new Date(o.created_at).getHours();
    hours[h].orders += 1;
    hours[h].revenue += Number(o.total_amount);
  });

  return hours.map(h => ({
    ...h,
    avgTicket: h.orders > 0 ? h.revenue / h.orders : 0
  }));
}
