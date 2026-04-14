import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Database, 
  Users, 
  Calendar, 
  ChevronRight, 
  Search, 
  Filter,
  Download,
  AlertCircle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  CheckCircle2,
  Mail,
  Store,
  MoreVertical,
  Trash2,
  ExternalLink,
  MessageSquare,
  ArrowUpRight,
  Monitor,
  Zap,
  Plus
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis,
  RadialBarChart, RadialBar
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

const GlassCard = ({ children, className = "", noHover = false }) => (
  <motion.div 
    whileHover={noHover ? {} : { y: -4, transition: { duration: 0.2 } }}
    className={`bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] glass-glow ${className}`}
  >
    {children}
  </motion.div>
);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 ${
      active 
        ? 'bg-[#1A1A1A] text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] scale-105' 
        : 'bg-white/50 text-gray-500 hover:bg-white hover:text-gray-900 border border-transparent'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : ''}`} />
    {label}
  </button>
);

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [data, setData] = useState({ orders: [], leads: [], events: [], paymentMethods: [] });
  const [prevData, setPrevData] = useState({ orders: [], leads: [], events: [] });
  const [productLimit, setProductLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: 0 
  }).format(val);

  const formatCompact = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val;
  };

  const formatCompactCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return formatCurrency(val);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!activeBrandId) {
        setLoading(false);
        return;
      }

      let start = new Date();
      let prevStart = new Date();
      let prevEnd = new Date();

      if (dateRange === 'today') {
        start.setHours(0,0,0,0);
        prevStart.setDate(prevStart.getDate() - 1);
        prevStart.setHours(0,0,0,0);
        prevEnd.setHours(0,0,0,0);
      } else if (dateRange === '7d') {
        start.setDate(start.getDate() - 7);
        prevStart.setDate(prevStart.getDate() - 14);
        prevEnd.setDate(prevEnd.getDate() - 7);
      } else if (dateRange === '30d') {
        start.setDate(start.getDate() - 30);
        prevStart.setDate(prevStart.getDate() - 60);
        prevEnd.setDate(prevEnd.getDate() - 30);
      } else {
        start = new Date(0); // All time
        prevStart = new Date(0);
      }

      const [ordersRes, leadsRes, eventsRes, prevOrdersRes, prevLeadsRes, prevEventsRes, pmRes] = await Promise.all([
        supabase.from('orders').select(`
          id, total_amount, status, created_at, delivered_at, fulfillment_type, payment_method,
          restaurant_tables ( id, table_number ),
          order_items ( quantity, unit_price, products ( name, cost, margin, categories ( name ) ) )
        `).eq('brand_id', activeBrandId)
          .gte('created_at', start.toISOString())
          .order('created_at', { ascending: false }),
        
        supabase.from('leads').select('*')
          .eq('brand_id', activeBrandId)
          .gte('created_at', start.toISOString())
          .order('created_at', { ascending: false }),
        
        supabase.from('analytics_events').select('*')
          .contains('metadata', { brandId: activeBrandId })
          .gte('created_at', start.toISOString())
          .order('created_at', { ascending: false }),

        // Previous period
        supabase.from('orders').select(`id, total_amount, status, created_at, delivered_at`)
          .eq('brand_id', activeBrandId)
          .gte('created_at', prevStart.toISOString())
          .lt('created_at', prevEnd.toISOString()),
        
        supabase.from('leads').select('id, created_at, status')
          .eq('brand_id', activeBrandId)
          .gte('created_at', prevStart.toISOString())
          .lt('created_at', prevEnd.toISOString()),

        supabase.from('analytics_events').select('id, created_at, session_id')
          .contains('metadata', { brandId: activeBrandId })
          .gte('created_at', prevStart.toISOString())
          .lt('created_at', prevEnd.toISOString()),
          
        supabase.from('payment_methods').select('id, name').eq('brand_id', activeBrandId)
      ]);

      setData({
        orders: ordersRes.data || [],
        leads: leadsRes.data || [],
        events: eventsRes.data || [],
        paymentMethods: pmRes.data || []
      });

      setPrevData({
        orders: prevOrdersRes.data || [],
        leads: prevLeadsRes.data || [],
        events: prevEventsRes.data || []
      });

    } catch (err) {
      console.error('Error fetching intelligence data:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsReady(true), 200);
    }
  };

  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 400);
    return () => clearTimeout(timer);
  }, [activeTab, dateRange, activeBrandId]);

  useEffect(() => {
    fetchData();
  }, [dateRange, activeBrandId]);

  const handleUpdateLeadStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      fetchData(); // Refresh
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este prospecto?')) return;
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData(); // Refresh
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const stats = useMemo(() => {
    const { orders: currentOrders, leads: currentLeads } = data;
    const { orders: prevOrders, leads: prevLeads } = prevData;

    const calc = (orders, leads) => {
      const delivered = orders.filter(o => o.status === 'delivered');
      const cancelled = orders.filter(o => o.status === 'cancelled');
      const revenue = delivered.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const lostRevenue = cancelled.reduce((sum, o) => sum + Number(o.total_amount), 0);
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

      return { revenue, avgTicket, orderCount: delivered.length, leadCount: leads.length, avgTime, cancelledCount: cancelled.length, lostRevenue };
    };

    const current = calc(currentOrders, currentLeads);
    const prev = calc(prevOrders, prevLeads);

    const getDiff = (curr, old) => {
      if (!old || old === 0) return curr > 0 ? 100 : 0;
      return ((curr - old) / old) * 100;
    };

    return {
      revenue: current.revenue,
      avgTicket: current.avgTicket,
      orderCount: current.orderCount,
      newLeads: current.leadCount,
      avgTime: current.avgTime,
      cancelledCount: current.cancelledCount,
      lostRevenue: current.lostRevenue,
      revenueDiff: getDiff(current.revenue, prev.revenue),
      ordersDiff: getDiff(current.orderCount, prev.orderCount),
      ticketDiff: getDiff(current.avgTicket, prev.avgTicket),
      leadsDiff: getDiff(current.leadCount, prev.leadCount),
      avgTimeDiff: getDiff(current.avgTime, prev.avgTime),
      cancelledDiff: getDiff(current.cancelledCount, prev.cancelledCount),
    };
  }, [data, prevData]);

  const bottleneckStats = useMemo(() => {
    const products = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
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
      .map(p => ({ ...p, avg: Math.round(p.times.reduce((a,b) => a+b, 0) / p.times.length) }))
      .sort((a,b) => b.avg - a.avg)
      .slice(0, 3); // Top 3 slowest
  }, [data.orders]);

  const productPerformance = useMemo(() => {
    const products = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      o.order_items?.forEach(item => {
        const p = item.products;
        if (!p) return;
        const catName = p.categories?.name || 'Varios';
        if (!products[p.name]) products[p.name] = { name: p.name, category: catName, units: 0, revenue: 0 };
        products[p.name].units += item.quantity;
        products[p.name].revenue += (item.quantity * item.unit_price);
      });
    });
    return Object.values(products).sort((a,b) => b.revenue - a.revenue);
  }, [data.orders]);

  const categoryStats = useMemo(() => {
    const cats = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      o.order_items?.forEach(item => {
        const catName = item.products?.categories?.name || 'Varios';
        if (!cats[catName]) cats[catName] = { name: catName, value: 0, units: 0 };
        cats[catName].value += (item.quantity * item.unit_price);
        cats[catName].units += item.quantity;
      });
    });
    return Object.values(cats).sort((a,b) => b.value - a.value);
  }, [data.orders]);

  const topProducts = useMemo(() => {
    const productStats = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      o.order_items?.forEach(item => {
        const name = item.products?.name || 'Desconocido';
        if (!productStats[name]) productStats[name] = { name, cantidad: 0, ingresos: 0 };
        productStats[name].cantidad += item.quantity;
        productStats[name].ingresos += (item.quantity * item.unit_price);
      });
    });
    return Object.values(productStats).sort((a,b) => b.cantidad - a.cantidad).slice(0, 5);
  }, [data.orders]);

  const channelStats = useMemo(() => {
    const channels = {
      'En Mesa': { name: 'En Mesa', value: 0, fill: '#10B981' },
      'Para Llevar': { name: 'Para Llevar', value: 0, fill: '#3B82F6' },
      'Domicilio': { name: 'Domicilio', value: 0, fill: '#F59E0B' },
      'Programado': { name: 'Programado', value: 0, fill: '#8B5CF6' }
    };

    data.orders.forEach(o => {
      const type = o.fulfillment_type || 'takeaway';
      let label = 'Para Llevar';
      if (type === 'dine_in') label = 'En Mesa';
      if (type === 'delivery') label = 'Domicilio';
      if (type === 'scheduled') label = 'Programado';
      
      if (channels[label]) channels[label].value += Number(o.total_amount);
    });

    // Sort by value to have the biggest rings outside
    return Object.values(channels).filter(c => c.value > 0).sort((a,b) => a.value - b.value);
  }, [data.orders]);

  const tableStats = useMemo(() => {
    const tableCounts = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      const table = o.restaurant_tables;
      if (table) {
        const label = table.name || `Mesa ${table.table_number}`;
        if (!tableCounts[label]) tableCounts[label] = { name: label, pedidos: 0, ingresos: 0 };
        tableCounts[label].pedidos += 1;
        tableCounts[label].ingresos += Number(o.total_amount);
      }
    });
    return Object.values(tableCounts).sort((a,b) => b.ingresos - a.ingresos).slice(0, 8);
  }, [data.orders]);

  const paymentStats = useMemo(() => {
    const stats = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      const method = o.payment_method || 'Sin especificar';
      
      // Map labels
      let label = method;
      if (method === 'cash') label = 'Efectivo';
      else if (method === 'card') label = 'Tarjeta';
      else {
        // Search in paymentMethods if it's a UUID
        const found = data.paymentMethods?.find(pm => pm.id === method);
        if (found) label = found.name;
        else if (method === 'Sin especificar') label = 'Sin especificar';
        else if (method.length > 20) label = 'Otro (Personalizado)'; // Fallback for UUIDs not found
      }

      if (!stats[label]) stats[label] = { name: label, value: 0, count: 0 };
      stats[label].value += Number(o.total_amount);
      stats[label].count += 1;
    });
    return Object.values(stats);
  }, [data.orders, data.paymentMethods]);

  const hourlyStats = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ label: `${i}h`, ventas: 0 }));
    data.orders.forEach(o => {
      const h = new Date(o.created_at).getHours();
      hours[h].ventas += Number(o.total_amount);
    });
    return hours;
  }, [data.orders]);

  const peakHour = useMemo(() => {
    const max = [...hourlyStats].sort((a, b) => b.ventas - a.ventas)[0];
    return max?.ventas > 0 ? max.label : '--:--';
  }, [hourlyStats]);

  const heatmapStats = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const matrix = Array.from({ length: 7 }, (_, d) => ({
      day: days[d],
      hours: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
    }));

    data.orders.forEach(o => {
      const date = new Date(o.created_at);
      const d = date.getDay();
      const h = date.getHours();
      matrix[d].hours[h].count += 1;
    });
    return matrix;
  }, [data.orders]);

  const dayOfWeekStats = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const stats = days.map(name => ({ name, pedidos: 0, revenue: 0, avgTicket: 0 }));

    data.orders.forEach(o => {
      const d = new Date(o.created_at).getDay();
      stats[d].pedidos += 1;
      stats[d].revenue += Number(o.total_amount);
    });

    return stats.map(s => ({
      ...s,
      avgTicket: s.pedidos > 0 ? s.revenue / s.pedidos : 0
    }));
  }, [data.orders]);

  const productProfitability = useMemo(() => {
    const stats = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      o.order_items?.forEach(item => {
        const p = item.products;
        if (!p) return;
        const name = p.name;
        if (!stats[name]) {
          stats[name] = { 
            name, 
            units: 0, 
            revenue: 0, 
            cost: Number(p.cost || 0), 
            margin: Number(p.margin || 0),
            totalCost: 0,
            totalProfit: 0
          };
        }
        stats[name].units += item.quantity;
        stats[name].revenue += (item.quantity * item.unit_price);
        stats[name].totalCost += (item.quantity * Number(p.cost || 0));
      });
    });

    return Object.values(stats).map(s => ({
      ...s,
      totalProfit: s.revenue - s.totalCost,
      actualMargin: s.revenue > 0 ? ((s.revenue - s.totalCost) / s.revenue * 100) : 0
    })).sort((a,b) => b.revenue - a.revenue);
  }, [data.orders]);

  const analyticsSummary = useMemo(() => {
    const visits = data.events.filter(e => e.event_name === 'menu_visit').length;
    const scans = data.events.filter(e => e.event_name === 'qr_scan').length;
    
    // Calculate unique sessions
    const uniqueSessions = new Set(data.events.map(e => e.session_id).filter(Boolean));
    const sessionCount = Math.max(uniqueSessions.size, visits, scans);
    
    const ordersCount = data.orders.length;
    
    // Conversion metrics
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
  }, [data.events, data.orders, stats]);

  const prospectStats = useMemo(() => {
    const total = data.leads.length;
    const prevTotal = prevData.leads.length;
    
    const converted = data.leads.filter(l => l.status === 'converted').length;
    const prevConverted = prevData.leads.filter(l => l.status === 'converted').length;
    
    const contacted = data.leads.filter(l => l.status === 'contacted').length;
    const rate = total ? (converted / total) * 100 : 0;
    const prevRate = prevTotal ? (prevConverted / prevTotal) * 100 : 0;

    const getDiff = (curr, old) => {
      if (!old || old === 0) return curr > 0 ? 100 : 0;
      return ((curr - old) / old) * 100;
    };

    return { 
      total, 
      converted, 
      contacted, 
      rate,
      totalDiff: getDiff(total, prevTotal),
      rateDiff: getDiff(rate, prevRate)
    };
  }, [data.leads, prevData.leads]);

  const DiffBadge = ({ value }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
        isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
      }`}>
        {isPositive ? '↑' : '↓'} {Math.abs(Math.round(value))}%
      </div>
    );
  };

  const RenderResumen = () => (
    <div className="space-y-8 animate-fadeUp">
      {/* Prime KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Ingresos Totales', val: formatCompactCurrency(stats.revenue), diff: stats.revenueDiff, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Pedidos Totales', val: stats.orderCount, diff: stats.ordersDiff, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Cancelados', val: stats.cancelledCount, diff: stats.cancelledDiff, icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Ticket Promedio', val: formatCompactCurrency(stats.avgTicket), diff: stats.ticketDiff, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Prospección', val: stats.newLeads, diff: stats.leadsDiff, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' }
        ].map((item, i) => (
          <GlassCard key={i} className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <DiffBadge value={item.diff} />
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
            <h3 className="text-xl font-black text-gray-900 mt-1">{item.val}</h3>
          </GlassCard>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sales Trend - Visual AreaChart */}
        <GlassCard className="lg:col-span-3 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Pulso de Ventas</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Actividad por hora</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase">Pico Detectado</p>
              <p className="text-sm font-black text-emerald-600">{peakHour}</p>
            </div>
          </div>
          <div className="h-[250px] w-full relative">
            {isReady && (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={hourlyStats}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis hide />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    formatter={(val) => [formatCompactCurrency(val), 'Ventas']}
                  />
                  <Area type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>


        {/* Conversion Funnel */}
        <GlassCard className="p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Embudo</h3>
            <div className="text-right">
              <p className="text-xs font-black text-rose-600">{analyticsSummary.abandonmentRate}% Escapa</p>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            {(() => {
              const { scans, visits, ordersCount } = analyticsSummary;
              const maxVal = Math.max(scans, visits, ordersCount, 1);
              
              const steps = [
                { label: 'Escaneos', val: scans, icon: Zap, color: 'bg-amber-100 text-amber-600', percent: (scans / maxVal) * 100 },
                { label: 'Vistas', val: visits, icon: Monitor, color: 'bg-blue-100 text-blue-600', percent: (visits / maxVal) * 100 },
                { label: 'Pedidos', val: ordersCount, icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-600', percent: (ordersCount / maxVal) * 100 }
              ];

              return steps.map((step, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{step.label}</span>
                    <span className="text-xs font-black text-gray-900">{step.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, step.percent))}%` }}
                      className={`h-full ${step.color.split(' ')[1].replace('text-', 'bg-')}`}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </GlassCard>
      </div>

      {/* High Intensity Insights - New Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* [NEW] Ciclo de Ventas Semanal (Revenue vs Avg Ticket) */}
        <GlassCard className="lg:col-span-2 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Ciclo de Ventas Semanal</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Relación Ingresos vs Ticket Promedio por día</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ingresos</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ticket Prom.</span>
               </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            {isReady && (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dayOfWeekStats}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} 
                  />
                  <YAxis hide />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    formatter={(val, name) => [formatCurrency(val), name === 'revenue' ? 'Ingresos' : 'Ticket Prom.']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgTicket" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    fill="transparent" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* [NEW] Mix de Canales (Radial Bar) */}
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Mix de Canales</h3>
            <div className="flex flex-col gap-1 items-end">
               <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">Ventas Reales</span>
            </div>
          </div>

          <div className="h-[250px] w-full relative">
            {isReady && (
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart 
                  innerRadius="30%" 
                  outerRadius="100%" 
                  barSize={12} 
                  data={channelStats}
                  startAngle={90}
                  endAngle={450}
                >
                  <RadialBar
                    minAngle={15}
                    background={{ fill: '#f3f4f6' }}
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <RechartsTooltip 
                    cursor={{ stroke: 'transparent' }}
                    offset={20}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{payload[0].payload.name}</p>
                            </div>
                            <p className="text-lg font-black text-gray-900 leading-none">{formatCurrency(payload[0].value)}</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Total de ingresos</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            )}

            {/* Custom Interactive Legend - No overlap with mouse */}
            <div className="absolute bottom-0 right-0 p-2 flex flex-col gap-2">
              {channelStats.slice().reverse().map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 px-3 rounded-full hover:bg-white transition-all cursor-default">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.fill }} />
                  <span className="text-[9px] font-bold text-gray-500 uppercase">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Row 3: Operational Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Weekly Heatmap - Back to Wide */}
        <GlassCard className="lg:col-span-3 p-8 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Mapa de Calor Semanal</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Intensidad operativa por horario</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 overflow-x-auto pb-4 custom-scrollbar">
            {heatmapStats.map((day, di) => (
              <div key={di} className="flex items-center gap-1.5 min-w-[600px]">
                <span className="w-8 text-[10px] font-black text-gray-400 uppercase">{day.day}</span>
                <div className="flex-1 flex gap-1">
                  {day.hours.map((h, hi) => {
                    const maxCount = Math.max(...heatmapStats.flatMap(d => d.hours.map(h => h.count)), 1);
                    const opacity = h.count > 0 ? 0.1 + (h.count / maxCount) * 0.9 : 0.05;
                    const color = h.count > 0 ? 'bg-emerald-500' : 'bg-gray-200';
                    return (
                      <div 
                        key={hi} 
                        className={`flex-1 h-6 rounded-sm ${color} transition-all hover:ring-2 hover:ring-emerald-400 cursor-help`}
                        style={{ opacity }}
                        title={`${day.day} ${h.hour}:00h - ${h.count} pedidos`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Mini Category Performance - Horizontal Bars (As requested/maintained) */}
        <GlassCard className="p-8">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-8">Ranking Categorías</h3>
          <div className="space-y-4">
             {categoryStats.slice(0, 5).map((cat, i) => (
                <div key={i}>
                   <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="font-bold text-gray-500 uppercase tracking-tighter">{cat.name}</span>
                      <span className="font-black text-gray-900">{formatCompactCurrency(cat.value)}</span>
                   </div>
                   <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-emerald-500 rounded-full" 
                         style={{ width: `${(cat.value / stats.revenue * 100) || 0}%` }}
                      />
                   </div>
                </div>
             ))}
          </div>
        </GlassCard>
      </div>


      {/* Distribution & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <GlassCard className="p-8">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-8">Métodos de Pago</h3>
          <div className="space-y-4">
             {paymentStats.map((p, i) => (
                <div key={i}>
                   <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="font-bold text-gray-600 uppercase tracking-tighter">{p.name}</span>
                      <span className="font-black text-gray-900">{formatCompactCurrency(p.value)}</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-blue-500 rounded-full" 
                         style={{ width: `${(p.value / stats.revenue * 100) || 0}%` }}
                      />
                   </div>
                </div>
             ))}
          </div>
        </GlassCard>

        {/* Productos Estrella */}
        <GlassCard className="p-8">
          <h3 className="text-sm font-black text-gray-900 mb-8 uppercase tracking-tight">Productos Estrella</h3>
          <div className="space-y-4">
             {topProducts.map((p, i) => (
                <div key={i} className="flex justify-between items-center group">
                   <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-black text-gray-400 text-xs">
                         #{i + 1}
                      </div>
                      <span className="font-bold text-gray-700 uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">{p.name}</span>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-gray-900">{p.cantidad} u.</p>
                      <p className="text-[10px] font-bold text-gray-400">{formatCompactCurrency(p.ingresos)}</p>
                   </div>
                </div>
             ))}
          </div>
        </GlassCard>

        {/* Mesas más Activas */}
        <GlassCard className="p-8">
          <h3 className="text-sm font-black text-gray-900 mb-8 uppercase tracking-tight">Mesas más Activas</h3>
          <div className="space-y-4">
             {tableStats.slice(0, 5).map((t, i) => (
                <div key={i} className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center font-black text-emerald-600 text-[10px]">
                         MZA
                      </div>
                      <span className="font-bold text-gray-700 uppercase tracking-tighter">{t.name}</span>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-gray-900">{formatCompactCurrency(t.ingresos)}</p>
                      <p className="text-[10px] font-bold text-gray-400">{t.pedidos} pedidos</p>
                   </div>
                </div>
             ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );

  const RenderAnalitica = () => (
    <div className="space-y-8 animate-fadeUp">
      {/* Conversion Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Zap, label: 'Pico de Ventas', val: peakHour, color: 'text-amber-500' },
          { icon: Trash2, label: 'Cancelados', val: stats.cancelledCount, color: 'text-rose-500' },
          { icon: ShoppingCart, label: 'Venta Perdida', val: formatCompactCurrency(stats.lostRevenue), color: 'text-rose-500' },
          { icon: ShoppingCart, label: 'Tasa Abandono', val: `${analyticsSummary.abandonmentRate}%`, color: 'text-rose-500' },
        ].map((item, i) => (
          <GlassCard key={i} className="p-6 flex items-center gap-4">
             <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${item.color}`}>
                <item.icon size={18} />
             </div>
             <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-xl font-black text-gray-900">{item.val}</p>
             </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Channel Distribution Table */}
        <GlassCard className="overflow-hidden">

           <div className="p-6 border-b border-gray-100 bg-gray-50/30">
            <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Distribución por Canal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Canal</th>
                  <th className="px-6 py-4">Órdenes</th>
                  <th className="px-6 py-4">Ticket Prom.</th>
                  <th className="px-6 py-4 text-right">Total Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-gray-600">
                {channelStats.map((c, i) => (
                  <tr key={i} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="px-6 py-4 uppercase tracking-tighter">{c.name}</td>
                    <td className="px-6 py-4">{data.orders.filter(o => {
                      const type = o.fulfillment_type || 'takeaway';
                      if (c.name === 'En Mesa') return type === 'dine_in';
                      if (c.name === 'Para Llevar') return type === 'takeaway';
                      if (c.name === 'Domicilio') return type === 'delivery';
                      return type === 'scheduled';
                    }).length} ops</td>
                    <td className="px-6 py-4">
                      {formatCurrency(c.value / (data.orders.filter(o => {
                        const type = o.fulfillment_type || 'takeaway';
                        if (c.name === 'En Mesa') return type === 'dine_in';
                        if (c.name === 'Para Llevar') return type === 'takeaway';
                        if (c.name === 'Domicilio') return type === 'delivery';
                        return type === 'scheduled';
                      }).length || 1))}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">{formatCurrency(c.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Product Performance Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-end">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Rendimiento por Producto</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Desglose detallado de ventas y participación</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase">Mostrar:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[5, 10, 20, 'Todos'].map((num) => (
                <button
                  key={num}
                  onClick={() => setProductLimit(num === 'Todos' ? 999 : num)}
                  className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                    (num === 'Todos' ? productLimit === 999 : productLimit === num) 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Unidades</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ingresos Brutos</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Participación (%)</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productPerformance.slice(0, productLimit).map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{p.name}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{p.category || 'Sin Categoría'}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-sm font-black text-gray-900">{p.units}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-sm font-black text-gray-900">{formatCompactCurrency(p.revenue)}</span>
                  </td>
                  <td className="px-8 py-5 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.revenue / stats.revenue * 100) || 0}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="text-[10px] font-extrabold text-gray-400 w-12 text-right">{((p.revenue / stats.revenue * 100) || 0).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {productLimit < productPerformance.length && (
          <div className="p-4 bg-gray-50/30 text-center border-t border-gray-100">
            <button 
              onClick={() => setProductLimit(prev => prev + 5)}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Cargar más productos
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );

  const RenderOperaciones = () => (
    <div className="space-y-8 animate-fadeUp">
      {/* Operation Health Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <DiffBadge value={stats.avgTimeDiff} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiempo Prom. de Entrega</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-black text-gray-900">{Math.round(stats.avgTime)}</h3>
            <span className="text-xs font-bold text-gray-400">minutos</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <DiffBadge value={stats.ordersDiff} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Órdenes Finalizadas</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.orderCount}</h3>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cuellos de Botella</p>
          <div className="mt-1 space-y-1">
            {bottleneckStats.length > 0 ? bottleneckStats.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-rose-50/50 px-2 py-1 rounded-lg">
                <span className="text-[10px] font-bold text-gray-700 truncate max-w-[120px] uppercase">{p.name}</span>
                <span className="text-[10px] font-black text-rose-600 tracking-tighter">{p.avg}m</span>
              </div>
            )) : <p className="text-xs font-bold text-gray-400 italic">No hay datos suficientes</p>}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Log Operativo Maestro</h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase">Registro técnico de transacciones {dateRange}</p>
          </div>
          <div className="flex gap-2">
             <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400">
                <Filter size={14} />
             </button>
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                <Download className="w-3.5 h-3.5" /> Exportar
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-white text-[9px] font-black text-gray-300 uppercase tracking-[0.15em] border-b border-gray-100">
                <th className="px-6 py-4">ID / Estampa</th>
                <th className="px-6 py-4 text-center">Tipo</th>
                <th className="px-6 py-4 text-center">Tiempo Prep</th>
                <th className="px-6 py-4">Pago / Estado</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-bold text-gray-600">
              {data.orders.map((o) => {
                const prepTime = o.delivered_at && o.created_at 
                  ? Math.round((new Date(o.delivered_at) - new Date(o.created_at)) / 60000)
                  : null;

                return (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-3">
                      <p className="font-black text-gray-900 uppercase text-[10px]">#{o.id.slice(0,8)}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-3 text-center">
                       {o.fulfillment_type === 'dine_in' ? (
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase text-[9px]">Mesa {o.restaurant_tables?.table_number || '??'}</span>
                       ) : (
                          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase text-[9px]"> take / dom </span>
                       )}
                    </td>
                    <td className="px-6 py-3 text-center">
                       {prepTime !== null ? (
                          <div className="flex flex-col items-center">
                             <span className={`text-[11px] font-black ${prepTime > 25 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {prepTime}m
                             </span>
                             <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-full ${prepTime > 25 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${Math.min(100, (prepTime/45)*100)}%` }}
                                />
                             </div>
                          </div>
                       ) : <span className="text-gray-200">--</span>}
                    </td>
                    <td className="px-6 py-3">
                       <div className="flex items-center gap-2">
                          <span className="bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded uppercase text-[8px] border border-gray-100">
                             {o.payment_method === 'cash' ? 'EFECT' : 'TARJ'}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                             o.status === 'delivered' ? 'bg-emerald-500' : 
                             o.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          <span className="uppercase text-[9px] text-gray-500">{o.status}</span>
                       </div>
                    </td>
                    <td className="px-6 py-3 text-right font-black text-gray-900 text-xs">
                       {formatCurrency(o.total_amount)}
                    </td>
                    <td className="px-6 py-3 text-right">
                       <button className="p-1.5 text-gray-200 hover:text-emerald-500 transition-colors">
                          <ExternalLink size={12} />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );

  const RenderProspectos = () => (
    <div className="space-y-8 animate-fadeUp">
      {/* Lead Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Prospectos', val: prospectStats.total, diff: prospectStats.totalDiff, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Tasa Conversión', val: `${prospectStats.rate.toFixed(1)}%`, diff: prospectStats.rateDiff, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'En Seguimiento', val: prospectStats.contacted, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Tiempo Resp.', val: '< 2h', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' }
        ].map((item, i) => (
          <GlassCard key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                <item.icon className="w-5 h-5" />
              </div>
              {item.diff !== undefined && <DiffBadge value={item.diff} />}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{item.val}</h3>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Consola de Prospectos (CRM)</h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase">Gestión de oportunidades de negocio</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/10">
            <Plus className="w-3.5 h-3.5" /> Nuevo Lead
          </button>
        </div>
        <div className="overflow-x-auto">
          {data.leads.length === 0 ? (
            <div className="p-20 text-center">
               <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
               <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Bandeja de entrada vacía</p>
            </div>
          ) : (
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-white text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100">
                  <th className="px-6 py-4">Fecha / Cliente</th>
                  <th className="px-6 py-4">Restaurante / Contacto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Mensaje</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-gray-600">
                {data.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-purple-500/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 uppercase">{lead.name}</p>
                            <p className="text-[9px] text-gray-300">{new Date(lead.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="uppercase text-gray-700">{lead.restaurant_name}</p>
                       <p className="text-[10px] text-gray-400 normal-case font-medium">{lead.email}</p>
                    </td>
                    <td className="px-6 py-4">
                       <select 
                        value={lead.status}
                        onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-transparent focus:ring-0 cursor-pointer transition-colors ${
                          lead.status === 'new' ? 'bg-amber-100 text-amber-600' :
                          lead.status === 'contacted' ? 'bg-blue-100 text-blue-600' :
                          lead.status === 'converted' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <option value="new">Nuevo</option>
                        <option value="contacted">Siguiendo</option>
                        <option value="converted">Cerrado</option>
                        <option value="lost">Perdido</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-gray-400 italic font-medium truncate max-w-[200px] text-[10px]">
                          {lead.message ? `"${lead.message}"` : '--'}
                       </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={`https://wa.me/?text=Hola%20${lead.name}...`} 
                            target="_blank" 
                            className="p-1.5 hover:bg-emerald-100 hover:text-emerald-600 rounded transition-colors"
                          >
                            <MessageSquare size={14} />
                          </a>
                          <button 
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 hover:bg-rose-100 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto min-h-screen mesh-gradient-bg">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-3">
             <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">PREMIUM</span>
             <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Vision Intelligence OS</span>
          </div>
          <h1 className="text-5xl font-black text-[#1A1A1A] tracking-tighter leading-none">
            Estrategia de Crecimiento
          </h1>
          <p className="text-gray-500 mt-4 font-semibold text-lg max-w-xl leading-relaxed">
            Analiza el rendimiento operativo y gestiona el flujo de clientes desde un centro de mando unificado.
          </p>
        </motion.div>

        <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-xl shadow-black/[0.03]">
          {['today', '7d', '30d', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setDateRange(t)}
              className={`px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                dateRange === t ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'today' ? 'Hoy' : t === '7d' ? '7 Días' : t === '30d' ? '30 Días' : 'Total'}
            </button>
          ))}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 mb-12 pb-6 border-b border-gray-100">
        <TabButton active={activeTab === 'resumen'} onClick={() => setActiveTab('resumen')} icon={Zap} label="Resumen" />
        <TabButton active={activeTab === 'analitica'} onClick={() => setActiveTab('analitica')} icon={TrendingUp} label="Analítica" />
        <TabButton active={activeTab === 'operaciones'} onClick={() => setActiveTab('operaciones')} icon={Database} label="Operaciones" />
        <TabButton active={activeTab === 'prospectos'} onClick={() => setActiveTab('prospectos')} icon={Users} label="Prospectos" />
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-96 gap-6">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
             className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full" 
           />
           <p className="text-[11px] font-black text-emerald-600/60 uppercase tracking-[0.4em]">Sincronizando Nodo Estratégico...</p>
        </div>
      ) : (
        <div className="pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'resumen' && <RenderResumen />}
              {activeTab === 'analitica' && <RenderAnalitica />}
              {activeTab === 'operaciones' && <RenderOperaciones />}
              {activeTab === 'prospectos' && <RenderProspectos />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
