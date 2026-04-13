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
  Zap
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
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
  const [data, setData] = useState({ orders: [], leads: [], events: [] });
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

  const fetchData = async () => {
    if (!activeBrandId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const d = new Date();
      if (dateRange === 'today') d.setHours(0,0,0,0);
      else if (dateRange === '7d') d.setDate(d.getDate() - 7);
      else if (dateRange === '30d') d.setDate(d.getDate() - 30);

      const [ordersRes, leadsRes, eventsRes] = await Promise.all([
        supabase.from('orders').select(`
          id, total_amount, status, created_at, delivered_at, fulfillment_type, payment_method,
          restaurant_tables ( table_number ),
          order_items ( quantity, unit_price, products ( name, category_id ) )
        `).eq('brand_id', activeBrandId)
          .gte('created_at', dateRange !== 'all' ? d.toISOString() : '1970-01-01')
          .order('created_at', { ascending: false }),
        
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        
        supabase.from('analytics_events').select('*')
          .eq('metadata->>brandId', activeBrandId)
          .gte('created_at', dateRange !== 'all' ? d.toISOString() : '1970-01-01')
          .order('created_at', { ascending: false })
      ]);

      setData({
        orders: ordersRes.data || [],
        leads: leadsRes.data || [],
        events: eventsRes.data || []
      });

    } catch (err) {
      console.error('Error fetching intelligence data:', err);
    } finally {
      setLoading(false);
      // Small delay to let the DOM settle before measuring charts
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
    const { orders, leads } = data;
    const delivered = orders.filter(o => o.status === 'delivered');
    const revenue = delivered.reduce((sum, o) => sum + Number(o.total_amount), 0);
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

    return {
      revenue,
      avgTicket,
      orderCount: delivered.length,
      pendingCount: orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status)).length,
      avgTime: timeCount ? Math.round(totalMins / timeCount) : 0,
      newLeads: leads.filter(l => l.status === 'new').length
    };
  }, [data]);

  const salesTrend = useMemo(() => {
    const trend = {};
    [...data.orders].reverse().filter(o => o.status === 'delivered').forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      if (!trend[date]) trend[date] = { date, ventas: 0, pedidos: 0 };
      trend[date].ventas += Number(o.total_amount);
      trend[date].pedidos += 1;
    });
    return Object.values(trend);
  }, [data.orders]);

  const hourlyStats = useMemo(() => {
    const statsArr = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      ventas: 0
    }));

    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      const h = new Date(o.created_at).getHours();
      const entry = statsArr.find(s => s.hour === h);
      if (entry) entry.ventas += Number(o.total_amount);
    });

    return statsArr.filter(s => s.hour >= 8 && s.hour <= 23); // Typical hours
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
      'En Mesa': { name: 'En Mesa', value: 0, color: '#10B981' },
      'Para Llevar': { name: 'Para Llevar', value: 0, color: '#3B82F6' },
      'Domicilio': { name: 'Domicilio', value: 0, color: '#F59E0B' },
      'Programado': { name: 'Programado', value: 0, color: '#8B5CF6' }
    };

    data.orders.forEach(o => {
      const type = o.fulfillment_type || 'takeaway';
      let label = 'Para Llevar';
      if (type === 'dine_in') label = 'En Mesa';
      if (type === 'delivery') label = 'Domicilio';
      if (type === 'scheduled') label = 'Programado';
      
      if (channels[label]) channels[label].value += Number(o.total_amount);
    });

    return Object.values(channels).filter(c => c.value > 0);
  }, [data.orders]);

  const tableStats = useMemo(() => {
    const tableCounts = {};
    data.orders.forEach(o => {
      const tNum = o.restaurant_tables?.table_number;
      if (tNum) {
        if (!tableCounts[tNum]) tableCounts[tNum] = { name: `Mesa ${tNum}`, pedidos: 0, ingresos: 0 };
        tableCounts[tNum].pedidos += 1;
        tableCounts[tNum].ingresos += Number(o.total_amount);
      }
    });
    return Object.values(tableCounts).sort((a,b) => b.pedidos - a.pedidos).slice(0, 5);
  }, [data.orders]);

  const paymentStats = useMemo(() => {
    const stats = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      const method = o.payment_method || 'Sin especificar';
      const label = method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : method;
      if (!stats[label]) stats[label] = { name: label, value: 0, count: 0 };
      stats[label].value += Number(o.total_amount);
      stats[label].count += 1;
    });
    return Object.values(stats);
  }, [data.orders]);

  const peakHour = useMemo(() => {
    const max = [...hourlyStats].sort((a,b) => b.ventas - a.ventas)[0];
    return max?.ventas > 0 ? max.label : '--:--';
  }, [hourlyStats]);

  const analyticsSummary = useMemo(() => {
    const visits = data.events.filter(e => e.event_name === 'menu_visit').length;
    const scans = data.events.filter(e => e.event_name === 'qr_scan').length;
    const ordersCount = data.orders.length;
    const conversion = visits ? ((ordersCount / visits) * 100).toFixed(1) : 0;
    
    return {
      visits,
      scans,
      ordersCount,
      conversion
    };
  }, [data.events, data.orders]);

  const RenderResumen = () => (
    <div className="space-y-8 animate-fadeUp">
      {/* Bento Grid KPIs */}
      <div className="bento-grid">
        <GlassCard className="col-span-1 lg:col-span-2 p-8 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:scale-125 transition-transform duration-500">
            <DollarSign size={120} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Ingresos Totales</p>
            </div>
            <h2 className="text-4xl font-black text-gray-900 mt-2">{formatCurrency(stats.revenue)}</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Crecimiento orgánico neto</p>
          </div>
          <div className="flex items-center gap-8 mt-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pedidos</p>
              <p className="text-xl font-black text-gray-800">{stats.orderCount}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket Promedio</p>
              <p className="text-xl font-black text-gray-800">{formatCurrency(stats.avgTicket)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-orange-100 text-orange-600 uppercase tracking-tighter">Live</span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Atención en Cocina</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.avgTime} <span className="text-sm text-gray-400">min</span></h3>
            <p className="text-xs text-gray-500 mt-2 font-medium">Tiempo promedio de entrega</p>
          </div>
        </GlassCard>

        <GlassCard className="p-8 flex flex-col justify-between bg-emerald-500/5 border-emerald-500/20">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Hora de Mayor Venta</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{peakHour}</h3>
            <p className="text-xs text-gray-500 mt-2 font-medium">Pico de actividad detectado</p>
          </div>
        </GlassCard>

        <GlassCard className="col-span-1 lg:col-span-2 p-8 overflow-hidden h-full">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Actividad de hoy (Pulso de Ventas)</h3>
          <div className="h-[140px] w-full relative">
            {isReady && (
              <ResponsiveContainer width="100%" height={140} minWidth={0} minHeight={0} debounce={50}>
                <AreaChart data={hourlyStats}>
                <defs>
                  <linearGradient id="colorVentasP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentasP)" />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 shadow-xl border border-gray-100 rounded-lg text-[10px] font-black uppercase">
                          {formatCurrency(payload[0].value)}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard className="col-span-1 lg:col-span-2 p-8 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[11px] font-black text-purple-600 uppercase tracking-widest">Nuevos Prospectos</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.newLeads}</h3>
            <button 
              onClick={() => setActiveTab('prospectos')}
              className="mt-4 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              Ver todos los prospectos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center">
            <Users className="w-10 h-10 text-purple-400" />
          </div>
        </GlassCard>
      </div>
    </div>
  );

  const RenderAnalitica = () => (
    <div className="space-y-8 animate-fadeUp">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <h3 className="text-sm font-black text-gray-900 mb-8 flex items-center gap-2 uppercase tracking-tight">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            Ventas por Canal
          </h3>
          <div className="h-[350px] w-full relative">
            {isReady && (
              <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0} debounce={50}>
                <PieChart>
                <Pie
                  data={channelStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-8">
          <h3 className="text-sm font-black text-gray-900 mb-8 flex items-center gap-2 uppercase tracking-tight">
            <Package className="w-5 h-5 text-emerald-500" />
            Top 5 Productos Estrella
          </h3>
          <div className="h-[350px] w-full relative">
            {isReady && (
              <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0} debounce={50}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#4B5563' }} width={120} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="cantidad" fill="#1A1A1A" radius={[0, 10, 10, 0]} barSize={20}>
                  {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: Monitor, label: 'Visitas al Menú', val: analyticsSummary.visits, color: 'text-blue-500' },
          { icon: Zap, label: 'Escaneos QR', val: analyticsSummary.scans, color: 'text-orange-500' },
          { icon: ArrowUpRight, label: 'Conversión', val: `${analyticsSummary.conversion}%`, color: 'text-emerald-500' },
          { icon: ShoppingCart, label: 'Pedidos Totales', val: analyticsSummary.ordersCount, color: 'text-purple-500' }
        ].map((item, i) => (
          <GlassCard key={i} className="p-6 flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${item.color}`}>
                <item.icon className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-2xl font-black text-gray-900">{item.val}</p>
             </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <h3 className="text-sm font-black text-gray-900 mb-8 flex items-center gap-2 uppercase tracking-tight">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Distribución por Método de Pago
          </h3>
          <div className="h-[350px] w-full relative">
            {isReady && (
              <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0} debounce={50}>
                <PieChart>
                <Pie
                  data={paymentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-8">
          <h3 className="text-sm font-black text-gray-900 mb-8 flex items-center gap-2 uppercase tracking-tight">
            <Store className="w-5 h-5 text-emerald-500" />
            Uso de Mesas (Más Populares)
          </h3>
          <div className="h-[350px] w-full relative">
            {isReady && (
              <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0} debounce={50}>
                <BarChart data={tableStats} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#4B5563' }} width={120} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="pedidos" fill="#10B981" radius={[0, 10, 10, 0]} barSize={20}>
                  {tableStats.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );

  const RenderOperaciones = () => (
    <div className="animate-fadeUp">
      <GlassCard className="overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 className="font-black text-gray-900 tracking-tight text-lg">LOG DE OPERACIONES</h3>
            <p className="text-xs text-gray-500 font-medium">Auditoría técnica de transacciones recientes</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Exportar Reporte
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4">ID Transacción</th>
                <th className="px-8 py-4">Estampa Temporal</th>
                <th className="px-8 py-4">Origen</th>
                <th className="px-8 py-4">Pago</th>
                <th className="px-8 py-4">Estado OS</th>
                <th className="px-8 py-4 text-right">Monto Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-600">
              {data.orders.map((o) => (
                <tr key={o.id} className="hover:bg-emerald-500/5 transition-colors group">
                  <td className="px-8 py-4 font-mono text-[10px] text-gray-400 group-hover:text-emerald-600">#{o.id.slice(0,8)}</td>
                  <td className="px-8 py-4">
                    <span className="font-bold text-gray-700">{new Date(o.created_at).toLocaleDateString()}</span>
                    <span className="text-[10px] text-gray-300 ml-2">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-8 py-4">
                    {o.restaurant_tables?.table_number ? (
                      <span className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500" />
                         Mesa {o.restaurant_tables.table_number}
                      </span>
                    ) : 'Para Llevar / Dom.'}
                  </td>
                  <td className="px-8 py-4">
                    <span className="uppercase text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                      {o.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                      o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right font-black text-gray-900">{formatCurrency(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );

  const RenderProspectos = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeUp">
      <div className="lg:col-span-2 space-y-4">
        {data.leads.length === 0 ? (
          <GlassCard className="p-20 text-center">
            <Users className="w-16 h-16 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-gray-300">SIN PROSPECTOS ACTIVOS</h3>
            <p className="text-sm text-gray-400 font-medium">Los leads de la landing aparecerán aquí.</p>
          </GlassCard>
        ) : data.leads.map((lead) => (
          <GlassCard key={lead.id} className="p-6 flex items-start justify-between group">
            <div className="flex gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-purple-200">
                {lead.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{lead.name}</h4>
                  <select 
                    value={lead.status}
                    onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                    className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                      lead.status === 'new' ? 'bg-amber-100 text-amber-600' :
                      lead.status === 'contacted' ? 'bg-blue-100 text-blue-600' :
                      lead.status === 'converted' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <option value="new">Nuevo</option>
                    <option value="contacted">Contactado</option>
                    <option value="converted">Convertido</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <Store className="w-3 h-3 text-purple-400" /> {lead.restaurant_name}
                  </span>
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-purple-400" /> {lead.email}
                  </span>
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
                {lead.message && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-600 italic">
                    "{lead.message}"
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 h-full opacity-60 group-hover:opacity-100 transition-opacity">
              <a 
                href={`https://wa.me/?text=Hola%20${lead.name},%20vi%20tu%20interés%20en%20Alto%20Andino...`} 
                target="_blank" 
                className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <button 
                onClick={() => handleDeleteLead(lead.id)}
                className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="space-y-6">
        <GlassCard className="p-8 bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] text-white">
          <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-6 text-emerald-400">Guía de Conversión</h4>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3 h-3" />
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">Contesta los prospectos en menos de 10 minutos para duplicar la conversión.</p>
            </li>
            <li className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3 h-3" />
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">Usa los logs técnicos para demostrar la eficiencia del sistema durante la demo.</p>
            </li>
          </ul>
        </GlassCard>
      </div>
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
