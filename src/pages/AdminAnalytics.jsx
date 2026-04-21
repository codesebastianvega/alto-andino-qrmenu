import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
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
  Plus,
  Check,
  X
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
  RadialBarChart, RadialBar, Treemap, ComposedChart
} from 'recharts';
import BulkCostEditor from '../components/admin/BulkCostEditor';
import OperationsIntelligence from '../components/admin/OperationsIntelligence';
import CustomerDirectory from '../components/admin/CustomerDirectory';
// Prospectos components removed as per user request to revert

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

const HeatmapCell = React.memo(({ day, h, maxCount, onHover, onLeave, active }) => {
  const opacity = h.count > 0 ? 0.12 + (h.count / maxCount) * 0.88 : 0.05;
  const color = h.count > 0 ? 'bg-emerald-500' : 'bg-gray-100';
  
  return (
    <div 
      className={`flex-1 h-7 rounded-sm ${color} transition-all hover:ring-2 hover:ring-emerald-400 cursor-pointer relative group`}
      style={{ opacity: active ? 1 : opacity, transform: active ? 'scale(1.1)' : 'scale(1)', zIndex: active ? 10 : 1 }}
      onMouseEnter={(e) => onHover(day, h, e.clientX, e.clientY, e.currentTarget)}
      onMouseMove={(e) => onHover(day, h, e.clientX, e.clientY, e.currentTarget)}
      onMouseLeave={onLeave}
    >
      {active && (
        <motion.div 
          layoutId="heatmap-glow"
          className="absolute inset-0 bg-emerald-400/20 blur-md rounded-sm"
        />
      )}
    </div>
  );
});

const WeeklyHeatmap = React.memo(({ data }) => {
  const [hover, setHover] = useState(null);
  
  const maxCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 1;
    const counts = data.flatMap(day => (day.hours || []).map(h => h.count || 0));
    return Math.max(...counts, 1);
  }, [data]);

  const handleHover = useCallback((day, hourData, x, y) => {
    setHover({
      day,
      hour: hourData.hour,
      count: hourData.count,
      x,
      y
    });
  }, []);

  const handleLeave = useCallback(() => setHover(null), []);

  if (!data || !Array.isArray(data)) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
        Cargando mapa de calor...
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-1.5 overflow-x-auto pt-8 pb-4 custom-scrollbar">
        {data.map((day, di) => (
          <div key={di} className="flex items-center gap-1.5 min-w-[600px]">
            <span className="w-8 text-[10px] font-black text-gray-400 uppercase">{day?.day}</span>
            <div className="flex-1 flex gap-1">
              {(day?.hours || []).map((h, hi) => (
                <HeatmapCell 
                  key={hi}
                  day={day?.day}
                  h={h}
                  maxCount={maxCount}
                  onHover={handleHover}
                  onLeave={handleLeave}
                  active={hover?.day === day?.day && hover?.hour === h?.hour}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {createPortal(
        <AnimatePresence>
          {hover && (
            <motion.div
              key="heatmap-tooltip"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                left: hover.x,
                top: hover.y
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 350,
                opacity: { duration: 0.1 }
              }}
              style={{ 
                position: 'fixed', 
                pointerEvents: 'none',
                zIndex: 999999,
                x: '-50%',
                y: 'calc(-100% - 20px)'
              }}
              className="bg-[#101010]/95 backdrop-blur-2xl text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center min-w-[160px] border border-white/10"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                  {hover.day} • {hover.hour}:00h
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums">{hover.count}</span>
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-tight">Pedidos realizados</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

const VisionTooltip = ({ active, payload, label, formatter, units = "ventas" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0B]/95 backdrop-blur-3xl text-white p-4 rounded-2xl border border-white/10 min-w-[180px] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <p className="text-[10px] font-black text-white/90 uppercase tracking-widest leading-none">
              {label}
            </p>
          </div>
          <span className="text-[8px] font-bold text-emerald-400/50 uppercase tracking-tighter">Vision OS</span>
        </div>
        <div className="space-y-2">
          {payload.map((item, i) => (
            <div key={i} className="flex justify-between items-center gap-4 group">
              <div className="flex items-center gap-2">
                <div 
                  className="w-1 h-3 rounded-full" 
                  style={{ backgroundColor: item.color || item.fill || '#10B981' }} 
                />
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-tight group-hover:text-white/80 transition-colors">
                  {item.name === 'revenue' ? 'Ingresos' : 
                   item.name === 'avgTicket' ? 'Ticket Prom.' : 
                   item.name === 'count' ? 'Ventas' :
                   item.name === 'cumPercentage' ? 'Acomulado' :
                   item.name === 'value' ? units :
                   item.name}
                </span>
              </div>
              <span className="text-[13px] font-black tabular-nums text-white">
                {formatter ? formatter(item.value, item.name) : 
                 (item.name === 'cumPercentage' ? `${item.value.toFixed(1)}%` : 
                  (typeof item.value === 'number' && item.value > 1000 ? item.value.toLocaleString() : item.value))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminAnalytics() {
  const [editingProductId, setEditingProductId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingCost, setIsSavingCost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('resumen');
  const [paretoType, setParetoType] = useState('revenue');
  const [advancedData, setAdvancedData] = useState({ forecasting: null, revPash: [], cohorts: {} });
  const [integrityStats, setIntegrityStats] = useState({ missingCosts: 0, identifiedPct: 0 });
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ orders: [], leads: [], events: [], paymentMethods: [] });
  const [prevData, setPrevData] = useState({ orders: [], leads: [], events: [] });
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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

      const [ordersRes, leadsRes, eventsRes, prevOrdersRes, prevLeadsRes, prevEventsRes, pmRes, productsRes] = await Promise.all([
        supabase.from('orders').select(`
          id, total_amount, status, created_at, delivered_at, fulfillment_type, payment_method,
          cancellation_reason, cancelled_by, discount_amount, discount_reason, waiter_id,
          service_fee,
          staff!waiter_id ( name ),
          restaurant_tables ( id, table_number ),
          order_items ( quantity, unit_price, products ( id, name, cost, margin, categories ( name ) ) )
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

        // Previous period - now including items for detailed margin comparison
        supabase.from('orders').select(`
          id, total_amount, status, created_at, delivered_at,
          order_items ( quantity, unit_price, products ( name, cost, margin ) )
        `)
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
          
        supabase.from('payment_methods').select('id, name').eq('brand_id', activeBrandId),
        supabase.from('products').select('id, name, cost, price, image_url').eq('brand_id', activeBrandId)
      ]);

      setData({
        orders: ordersRes.data || [],
        leads: leadsRes.data || [],
        events: eventsRes.data || [],
        paymentMethods: pmRes.data || []
      });

      setAllProducts(productsRes.data || []);

      setPrevData({
        orders: prevOrdersRes.data || [],
        leads: prevLeadsRes.data || [],
        events: prevEventsRes.data || []
      });

      // Show charts immediately with basic data
      setLoading(false);
      setIsReady(true);

      // --- Advanced Analytics RPCs (load in background, non-blocking) ---
      Promise.all([
        supabase.rpc('analytics_forecasting', { 
          p_brand_id: activeBrandId, 
          p_start_date: start.toISOString(), 
          p_end_date: new Date().toISOString()
        }),
        supabase.rpc('analytics_revpash', { 
          p_brand_id: activeBrandId, 
          p_start_date: start.toISOString(), 
          p_end_date: new Date().toISOString() 
        }),
        supabase.rpc('analytics_cohorts', { 
          p_brand_id: activeBrandId, 
          p_start_date: start.toISOString(), 
          p_end_date: new Date().toISOString() 
        }),
        supabase.from('products').select('id', { count: 'exact' }).eq('brand_id', activeBrandId).or('cost.eq.0,cost.is.null')
      ]).then(([forecastingRes, revPashRes, cohortsRes, integrityRes]) => {
        const rpcErrors = [forecastingRes.error, revPashRes.error, cohortsRes.error].filter(Boolean);
        if (rpcErrors.length > 0) {
          console.error('RPC Errors:', rpcErrors);
        }
        setAdvancedData({
          forecasting: forecastingRes.data,
          revPash: revPashRes.data || [],
          cohorts: cohortsRes.data || {}
        });
        const totalOrders = ordersRes.data?.length || 0;
        const identifiedOrders = ordersRes.data?.filter(o => o.customer_phone && o.customer_phone !== '').length || 0;
        setIntegrityStats({
          missingCosts: integrityRes.count || 0,
          identifiedPct: totalOrders > 0 ? (identifiedOrders / totalOrders) * 100 : 0
        });
      }).catch(err => {
        console.error('Error fetching advanced analytics:', err);
      });

    } catch (err) {
      console.error('Error fetching intelligence data:', err);
      toast.error('Ocurrió un error al cargar la analítica.');
    } finally {

      setLoading(false);
      setTimeout(() => setIsReady(true), 200);
    }
  };




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
      toast.success('Estado actualizado correctamente.');
      fetchData(); // Refresh
    } catch (err) {
      console.error('Error updating lead status:', err);
      toast.error('No se pudo actualizar el estado.');
    }
  };

  const handleQuickCostUpdate = async () => {
    if (!editingProductId || !editValue || isSavingCost) return;
    setIsSavingCost(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ cost: parseFloat(editValue) })
        .eq('id', editingProductId);
      
      if (error) throw error;
      
      // Clear editing state
      setEditingProductId(null);
      setEditValue('');
      
      // Refresh analytics data
      toast.success('Costo actualizado exitosamente.');
      await fetchData();
    } catch (err) {
      console.error('Error updating product cost:', err);
      toast.error('Error actualizando costo.');
    } finally {
      setIsSavingCost(false);
    }
  };

  const handleBulkSave = async (updates) => {
    setIsSavingCost(true);
    try {
      // Usamos Promise.all con update individual en lugar de upsert para evitar
      // el problema de constraint 'not-null' para columnas omitidas como 'name'.
      const updatePromises = updates.map(u => 
        supabase
          .from('products')
          .update({ cost: u.cost, margin: u.margin })
          .eq('id', u.id)
      );
      
      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error).map(r => r.error);
      
      if (errors.length > 0) throw errors[0];
      
      setShowBulkEditor(false);
      toast.success('Costos masivos guardados exitosamente.');
      await fetchData();
    } catch (err) {
      console.error('Error in handleBulkSave:', err);
      toast.error('Error al guardar costos masivos.');
    } finally {
      setIsSavingCost(false);
    }
  };

  const handleSmartExport = () => {
    window.print();
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este prospecto?')) return;
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Prospecto eliminado correctamente.');
      fetchData(); // Refresh
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error('Ocurrió un error al eliminar el prospecto.');
    }
  };

  const biStats = useMemo(() => {
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
        margin: current.margin - prev.margin // Direct point difference
      }
    };
  }, [data, prevData]);

  const stats = useMemo(() => biStats.current, [biStats]);

  const bottleneckStats = useMemo(() => {
    if (!data?.orders) return [];
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
  }, [data?.orders]);  const bcgData = useMemo(() => {
    if (!data?.orders) return { items: [], medians: { units: 0, margin: 0 }, missingItems: [] };
    const products = {};
    let totalVolume = 0;

    data.orders.filter(o => o.status === 'delivered').forEach(o => {
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
      margin: 100, // Visual fallback
      bcgCategory: 'Dog' // Default for missing
    }));

    if (validItems.length === 0) return { items: missingItems, medians: { units: 0, margin: 0 }, missingItems };

    const sortedUnits = [...validItems].map(p => p.units).sort((a,b) => a-b);
    const sortedMargins = [...validItems].map(p => p.margin).sort((a,b) => a-b);
    
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
  }, [data?.orders]);

  const growthContribution = useMemo(() => {
    if (!data?.orders || !prevData?.orders) return [];
    const currentItems = {};
    const prevItems = {};

    (data?.orders || []).filter(o => o.status === 'delivered').forEach(o => {
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

    (prevData?.orders || []).filter(o => o.status === 'delivered').forEach(o => {
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
    }).sort((a,b) => b.profitDiff - a.profitDiff);
  }, [data?.orders, prevData?.orders]);

  const paretoData = useMemo(() => {
    if (!data?.orders) return [];
    const products = {};
    let total = 0;

    (data?.orders || []).filter(o => o.status === 'delivered').forEach(o => {
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

    const sorted = Object.values(products).sort((a,b) => b.value - a.value);
    let cumulative = 0;

    return sorted.map(p => {
      cumulative += p.value;
      return {
        ...p,
        cumulativePercent: total > 0 ? (cumulative / total) * 100 : 0
      };
    });
  }, [data?.orders, paretoType]);

  const leakageAudit = useMemo(() => {
    if (!data?.orders) return { cancellations: [], discounts: [], totalLeakage: 0 };
    const cancellations = data.orders
      .filter(o => o.status === 'cancelled')
      .map(o => ({
        id: o.id,
        reason: o.cancellation_reason || 'Sin motivo especificado',
        by: o.cancelled_by || 'Sistema',
        amount: Number(o.total_amount || 0),
        time: o.created_at
      }));

    const discounts = (data?.orders || [])
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
  }, [data?.orders]);

  const prospectStats = useMemo(() => {
    const leads = data?.leads || [];
    const prevLeads = prevData?.leads || [];
    if (!leads.length && !prevLeads.length) return { total: 0, totalDiff: 0, rate: 0, rateDiff: 0, contacted: 0 };
    
    const converted = leads.filter(l => l.status === 'converted').length;
    const contacted = leads.filter(l => l.status === 'contacted').length;
    const prevConverted = prevLeads.filter(l => l.status === 'converted').length;
    
    const rate = leads.length > 0 ? (converted / leads.length) * 100 : 0;
    const prevRate = prevLeads.length > 0 ? (prevConverted / prevLeads.length) * 100 : 0;

    return {
      total: leads.length,
      totalDiff: prevLeads.length === 0 ? (leads.length > 0 ? 100 : 0) : ((leads.length - prevLeads.length) / prevLeads.length) * 100,
      rate,
      rateDiff: rate - prevRate,
      contacted
    };
  }, [data?.leads, prevData?.leads]);

  // Derived hooks for backward compatibility
  const productPerformance = useMemo(() => {
    return bcgData.items.sort((a,b) => b.revenue - a.revenue);
  }, [bcgData.items]);

  const topProducts = useMemo(() => {
    return bcgData.items.sort((a,b) => b.units - a.units).slice(0, 5);
  }, [bcgData.items]);

  const categoryStats = useMemo(() => {
    if (!data?.orders) return [];
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
  }, [data?.orders]);

  const channelStats = useMemo(() => {
    if (!data?.orders) return [];
    const channels = {
      'En Mesa': { name: 'En Mesa', value: 0, fill: '#10B981' },
      'Para Llevar': { name: 'Para Llevar', value: 0, fill: '#3B82F6' },
      'Domicilio': { name: 'Domicilio', value: 0, fill: '#F59E0B' },
      'Programado': { name: 'Programado', value: 0, fill: '#8B5CF6' }
    };

    (data?.orders || []).forEach(o => {
      const type = o.fulfillment_type || 'takeaway';
      let label = 'Para Llevar';
      if (type === 'dine_in') label = 'En Mesa';
      if (type === 'delivery') label = 'Domicilio';
      if (type === 'scheduled') label = 'Programado';
      
      if (channels[label]) channels[label].value += Number(o.total_amount);
    });

    // Sort by value to have the biggest rings outside
    return Object.values(channels).filter(c => c.value > 0).sort((a,b) => a.value - b.value);
  }, [data?.orders]);

  const tableStats = useMemo(() => {
    if (!data?.orders) return [];
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
  }, [data?.orders]);

  const paymentStats = useMemo(() => {
    if (!data?.orders) return [];
    const stats = {};
    data.orders.filter(o => o.status === 'delivered').forEach(o => {
      const method = o.payment_method || 'cash';
      
      // Map labels
      let label = method;
      if (method === 'cash') label = 'Efectivo';
      else if (method === 'card') label = 'Tarjeta';
      else if (method === 'Sin especificar' || !method) label = 'Sin especificar';
      else {
        // Search in paymentMethods if it's a UUID
        const found = data.paymentMethods?.find(pm => pm.id === method);
        if (found && found.name) label = found.name;
        else if (method.length > 20) label = 'Otro (Personalizado)'; // Fallback for UUIDs not found
      }

      if (!stats[label]) stats[label] = { name: label, value: 0, count: 0 };
      stats[label].value += Number(o.total_amount);
      stats[label].count += 1;
    });
    return Object.values(stats);
  }, [data?.orders, data?.paymentMethods]);


  const hourlyStats = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ label: `${i}h`, ventas: 0 }));
    if (!data?.orders) return hours;
    data.orders.forEach(o => {
      const h = new Date(o.created_at).getHours();
      hours[h].ventas += Number(o.total_amount);
    });
    return hours;
  }, [data?.orders]);

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

    if (!data?.orders) return matrix;
    data.orders.forEach(o => {
      const date = new Date(o.created_at);
      const d = date.getDay();
      const h = date.getHours();
      matrix[d].hours[h].count += 1;
    });
    return matrix;
  }, [data?.orders]);

  const dayOfWeekStats = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const stats = days.map(name => ({ name, pedidos: 0, revenue: 0, avgTicket: 0 }));

    if (!data?.orders) return stats;
    data.orders.forEach(o => {
      const d = new Date(o.created_at).getDay();
      stats[d].pedidos += 1;
      stats[d].revenue += Number(o.total_amount);
    });

    return stats.map(s => ({
      ...s,
      avgTicket: s.pedidos > 0 ? s.revenue / s.pedidos : 0
    }));
  }, [data?.orders]);

  const productProfitability = useMemo(() => {
    if (!data?.orders) return [];
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
  }, [data?.orders]);

  const analyticsSummary = useMemo(() => {
    if (!data) return { visits: 0, scans: 0, ordersCount: 0, conversion: 0, abandonmentRate: 0, ticketPromedio: 0 };
    const events = data?.events || [];
    const orders = data?.orders || [];
    const visits = events.filter(e => e.event_name === 'menu_visit').length;
    const scans = events.filter(e => e.event_name === 'qr_scan').length;
    
    // Calculate unique sessions
    const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean));
    const sessionCount = Math.max(uniqueSessions.size, visits, scans);
    
    const ordersCount = orders.length;
    
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
  }, [data?.events, data?.orders, stats]);


  const smartRecommendations = useMemo(() => {
    const recs = [];
    
    // 1. Check for missing costs (Data Integrity)
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

    // 2. Identify "Dogs" with high volume (Efficiency Leak)
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

    // 3. Identify "Stars" (Opportunity to push)
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

    // 4. Identify declining "Cash Cows"
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
  }, [bcgData, growthContribution]);

  const categoryPopularity = useMemo(() => {
    const cats = {};
    let totalUnits = 0;

    (data?.orders || []).filter(o => o.status === 'delivered').forEach(o => {
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
    })).sort((a,b) => b.units - a.units);
  }, [data?.orders]);

  const hourlyPerformance = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ 
      hour: i, 
      label: `${i}h`, 
      orders: 0, 
      revenue: 0,
      avgTicket: 0
    }));

    (data?.orders || []).filter(o => o.status === 'delivered').forEach(o => {
      const h = new Date(o.created_at).getHours();
      hours[h].orders += 1;
      hours[h].revenue += Number(o.total_amount);
    });

    return hours.map(h => ({
      ...h,
      avgTicket: h.orders > 0 ? h.revenue / h.orders : 0
    }));
  }, [data?.orders]);

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

  const DataIntegrityCard = () => {
    const missingCostsPct = allProducts?.length > 0 
      ? (integrityStats.missingCosts / allProducts.length) * 100 
      : 0;

    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <GlassCard noHover className="p-6 border-l-4 border-l-orange-500 bg-orange-50/10">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase">Integridad de Costos</h4>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">El <strong>{missingCostsPct.toFixed(1)}% ({integrityStats.missingCosts} productos)</strong> de tu catálogo no tiene costo asignado.</p>
              
              <div className="mt-3 flex items-center gap-2">
                 <div className="flex-1 h-1.5 bg-orange-100 rounded-full overflow-hidden w-32">
                    <div className="h-full bg-orange-500" style={{ width: `${missingCostsPct}%` }} />
                 </div>
                 <span className="text-[10px] font-black text-orange-600">{Math.round(missingCostsPct)}%</span>
              </div>
              
              <div className="mt-3">
                <button 
                  onClick={() => setShowBulkEditor(true)}
                  className="text-[10px] font-black text-white uppercase bg-orange-500 px-4 py-2 rounded-xl shadow-md hover:bg-orange-600 hover:scale-105 transition-all"
                >
                  Corregir Ahora
                </button>
              </div>
            </div>
          </div>
          <div className="text-right">
             <span className="text-2xl font-black text-orange-600">{integrityStats.missingCosts}</span>
             <span className="block text-[8px] font-black text-gray-400 uppercase">Alertas</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard noHover className="p-6 border-l-4 border-l-blue-500 bg-blue-50/10">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase">Identidad de Clientes</h4>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">Solo el <strong>{integrityStats.identifiedPct.toFixed(1)}%</strong> de tus pedidos tienen cliente identificado.</p>
              <div className="mt-3 flex items-center gap-2">
                 <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${integrityStats.identifiedPct}%` }} />
                 </div>
                 <span className="text-[10px] font-black text-blue-600">{Math.round(integrityStats.identifiedPct)}%</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-600 text-white p-1 rounded-md">
             <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </GlassCard>
    </div>
  );
  };

  const RenderResumen = () => (
    <div className="space-y-8 animate-fadeUp">
      <DataIntegrityCard />
      
      {/* Prime KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Ingresos Totales', val: formatCompactCurrency(stats.revenue), diff: biStats.diffs.revenue, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Pronóstico Cierre', val: formatCompactCurrency(advancedData.forecasting?.projected_sales || 0), diff: advancedData.forecasting?.deviation_pct, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Pedidos Totales', val: stats.orderCount, diff: biStats.diffs.orders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Cancelados', val: stats.cancelledCount, diff: biStats.diffs.cancelled, icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Ticket Promedio', val: formatCompactCurrency(stats.avgTicket), diff: biStats.diffs.ticket, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Prospección', val: stats.leadCount, diff: biStats.diffs.leads, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' }
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
              <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={250}>
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
              <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={250}>
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
              <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={250}>
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
                  <RechartsTooltip cursor={false} content={<VisionTooltip units="Ingresos" formatter={(val) => formatCurrency(val)} />} />
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
          <WeeklyHeatmap data={heatmapStats} />
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
        {/* Payment Methods - Executive Stacked Bar */}
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Mix de Pagos</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">Participación</span>
          </div>
          <div className="h-[250px] w-full">
            {isReady && paymentStats.length > 0 ? (
              <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={250}>
                <BarChart
                  layout="vertical"
                  data={[{ name: 'Total', ...paymentStats.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {}) }]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <RechartsTooltip cursor={false} content={<VisionTooltip units="Monto" formatter={(val) => formatCurrency(val)} />} />
                  {paymentStats.map((entry, index) => (
                    <Bar 
                      key={index} 
                      dataKey={entry.name} 
                      stackId="a" 
                      fill={COLORS[index % COLORS.length]} 
                      radius={index === 0 ? [4, 0, 0, 4] : index === paymentStats.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-[10px] font-bold uppercase italic">Sin datos de pago</div>
            )}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
             {paymentStats.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                   <span className="text-[9px] font-bold text-gray-500 uppercase">{p.name}</span>
                </div>
             ))}
          </div>
        </GlassCard>

        {/* Star Products - Vertical Bar Chart (Volume) */}
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Productos Estrella</h3>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Volumen (Unidades)</span>
          </div>
          <div className="h-[250px] w-full">
            {isReady && topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={250}>
                <BarChart data={topProducts.map(p => ({ name: p.name, value: p.units }))} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontBold: '900', fill: '#9ca3af' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis hide />
                  <RechartsTooltip cursor={false} content={<VisionTooltip units="Unidades" />} />
                  <Bar 
                    dataKey="value" 
                    fill="#10B981" 
                    radius={[6, 6, 0, 0]}
                    barSize={30}
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-[10px] font-bold uppercase italic">Sin datos de productos</div>
            )}
          </div>
        </GlassCard>

        {/* Active Tables - Radar Chart */}
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Carga por Mesa</h3>
            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md uppercase">Hotspots</span>
          </div>
          <div className="h-[250px] w-full">
            {isReady && tableStats.length > 0 ? (
              <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={250}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={tableStats.slice(0, 6)}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fontBold: '900', fill: '#9ca3af' }} />
                  <Radar
                    name="Ingresos"
                    dataKey="ingresos"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.5}
                  />
                  <RechartsTooltip cursor={false} content={<VisionTooltip units="Ingresos" formatter={(val) => formatCurrency(val)} />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-[10px] font-bold uppercase italic">Sin datos de mesas</div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Advanced Performance Tab Section (Merged for visibility) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* RevPASH / Hourly Efficiency */}
         <GlassCard className="p-8">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Eficiencia de Slot (RevPASH)</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Ingresos por hora del día</p>
               </div>
               <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">INTELIGENCIA ACTIVA</div>
            </div>
            <div className="h-[300px] w-full">
               {isReady && (
               <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={300}>
                  <BarChart data={advancedData.revPash}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="hour_of_day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis hide />
                    <RechartsTooltip cursor={false} content={<VisionTooltip units="PASH" formatter={(val) => formatCurrency(val)} />} />
                    <Bar dataKey="total_revenue" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
               )}
            </div>
         </GlassCard>

         {/* Customer Retention / Cohorts */}
         <GlassCard className="p-8">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Retención de Clientes</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Segmentación por lealtad</p>
               </div>
               <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="h-[300px] w-full flex items-center justify-center">
               {isReady && (
               <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Nuevos', value: advancedData.cohorts['Nuevo'] || 0, fill: '#3B82F6' },
                        { name: 'Recurrentes', value: advancedData.cohorts['Recurrente'] || 0, fill: '#10B981' },
                        { name: 'Esporádicos', value: advancedData.cohorts['Esporádico'] || 0, fill: '#F59E0B' }
                      ]}
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.keys(advancedData.cohorts || {}).map((_, i) => (
                        <Cell key={i} cornerRadius={8} />
                      ))}
                    </Pie>
                    <RechartsTooltip cursor={false} content={<VisionTooltip units="Clientes" />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
               )}
             </div>
          </GlassCard>
       </div>
       
       <AnimatePresence>
         {showBulkEditor && (
           <BulkCostEditor 
             products={allProducts.filter(p => !p.cost || p.cost === 0)}
             onSave={handleBulkSave}
             onCancel={() => setShowBulkEditor(false)}
           />
         )}
       </AnimatePresence>
     </div>
  );

  const RenderAnalitica = () => {
    const topDriver = (growthContribution || [])[0] || { name: 'N/A', contribution: 0 };
    
    return (
      <div className="space-y-8 animate-fadeUp">
        {/* Smart Recommendations Section */}
        <AnimatePresence mode="wait">
          {smartRecommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {smartRecommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard noHover className="p-4 border-l-4 h-full" style={{ borderLeftColor: rec.type === 'danger' ? '#F43F5E' : rec.type === 'warning' ? '#F59E0B' : '#10B981' }}>
                    <div className="flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-xl ${rec.bg} ${rec.color} flex-shrink-0 flex items-center justify-center shadow-sm`}>
                        <rec.icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                           <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{rec.title}</h4>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5 leading-tight">{rec.desc}</p>
                        <button 
                          onClick={() => {
                            if (rec.title === 'Integridad de Datos') setShowBulkEditor(true);
                            else setActiveTab('operaciones');
                          }}
                          className="mt-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-1"
                        >
                          {rec.actionLabel} <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Actionable BI KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
              <DiffBadge value={biStats.diffs.profit} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilidad Neta</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(biStats.current.profit)}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase text-emerald-600">Post-Costos de Insumo</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <div className={`text-[10px] font-black flex items-center gap-1 ${biStats.diffs.margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {biStats.diffs.margin >= 0 ? '+' : ''}{biStats.diffs.margin.toFixed(1)} pts
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Margen Real</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{biStats.current.margin.toFixed(1)}%</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase text-blue-600">Eficiencia Promedio</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Zap size={18} />
              </div>
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase">Leakage</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fuga de Ingresos</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(leakageAudit.totalLeakage)}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase text-rose-600">Canc. + Descuentos</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Package size={18} />
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Core Product</p>
            <h3 className="text-lg font-black text-gray-900 mt-1 truncate">{topDriver.name}</h3>
            <p className="text-[9px] font-bold text-emerald-500 mt-1 uppercase">+{topDriver.contribution.toFixed(1)}% Al Crecimiento</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* BCG Matrix Visualization */}
          <GlassCard className="lg:col-span-2 p-8 h-[450px]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Matriz de Portafolio (BCG)</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Volumen vs Margen (Umbrales Mediana)</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[8px] font-black text-gray-500 uppercase">Star</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[8px] font-black text-gray-500 uppercase">Cow</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[8px] font-black text-gray-500 uppercase">Enigma</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[8px] font-black text-gray-500 uppercase">Dog</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400 opacity-50" /><span className="text-[8px] font-black text-gray-400 uppercase italic">Sin Costo</span></div>
              </div>
            </div>
            <div className="h-[320px] w-full">
              {isReady && (
              <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={320}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number" 
                    dataKey="units" 
                    name="Volumen" 
                    label={{ value: 'Volumen (Unidades)', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 900 }} 
                    tick={{ fontSize: 9, fontWeight: 900 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="margin" 
                    name="Margen %" 
                    label={{ value: 'Margen %', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 900 }} 
                    tick={{ fontSize: 9, fontWeight: 900 }}
                  />
                  <ZAxis type="number" dataKey="revenue" range={[60, 400]} />
                  <RechartsTooltip cursor={false} content={<VisionTooltip units="Rentabilidad" formatter={(val, name) => name === 'units' ? `${val} sales/mo` : `${val.toFixed(0)}% margin`} />} />
                  <ReferenceLine x={bcgData.medians.units} stroke="#9ca3af" strokeDasharray="3 3" />
                  <ReferenceLine y={bcgData.medians.margin} stroke="#9ca3af" strokeDasharray="3 3" />
                  
                  {/* Quadrant Labels - Pure CSS positioning inside SVG space is tricky, using ReferenceLines with labels is safer */}
                  <ReferenceLine x={bcgData.medians.units * 1.5} y={bcgData.medians.margin * 1.5} stroke="transparent" label={{ value: 'ESTRELLAS', position: 'center', fill: '#10B981', fontSize: 8, fontWeight: 900, opacity: 0.2 }} />
                  <ReferenceLine x={bcgData.medians.units * 0.5} y={bcgData.medians.margin * 1.5} stroke="transparent" label={{ value: 'ENIGMAS', position: 'center', fill: '#F59E0B', fontSize: 8, fontWeight: 900, opacity: 0.2 }} />
                  <ReferenceLine x={bcgData.medians.units * 1.5} y={bcgData.medians.margin * 0.5} stroke="transparent" label={{ value: 'VACAS', position: 'center', fill: '#3B82F6', fontSize: 8, fontWeight: 900, opacity: 0.2 }} />
                  <ReferenceLine x={bcgData.medians.units * 0.5} y={bcgData.medians.margin * 0.5} stroke="transparent" label={{ value: 'PERROS', position: 'center', fill: '#F43F5E', fontSize: 8, fontWeight: 900, opacity: 0.2 }} />

                  <Scatter 
                    name="Productos" 
                    data={bcgData.items} 
                  >
                    {bcgData.items.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.hasMissingCost ? '#9ca3af' :
                          entry.bcgCategory === 'Star' ? '#10B981' : 
                          entry.bcgCategory === 'Cow' ? '#3B82F6' : 
                          entry.bcgCategory === 'Enigma' ? '#F59E0B' : '#F43F5E'
                        } 
                        fillOpacity={entry.hasMissingCost ? 0.3 : 1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              )}
            </div>
          </GlassCard>

          {/* Data Integrity / Gaps in Costs */}
          <GlassCard className="p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Integridad BI</h3>
              {bcgData.missingItems.length > 0 && <AlertCircle className="text-amber-500 animate-pulse" size={16} />}
            </div>
            
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-4 leading-relaxed">
              {bcgData.missingItems.length > 0 
                ? `Faltan costos para ${bcgData.missingItems.length} productos relevantes.`
                : "Base de datos 100% íntegra para análisis de rentabilidad."}
            </p>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
              {bcgData.missingItems.length > 0 ? bcgData.missingItems.map((item, i) => (
                <div key={i} className="bg-gray-50/50 p-3 rounded-2xl border border-dashed border-gray-200 group hover:border-indigo-200 transition-all">
                  {editingProductId === item.id ? (
                    <div className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-right duration-300">
                      <input 
                        type="number"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Costo unit."
                        className="w-full bg-gray-50 border-none text-[10px] font-black p-2 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        onKeyDown={(e) => {
                          if(e.key === 'Enter') handleQuickCostUpdate();
                          if(e.key === 'Escape') setEditingProductId(null);
                        }}
                      />
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => handleQuickCostUpdate()}
                          disabled={isSavingCost}
                          className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-90"
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => setEditingProductId(null)}
                          className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition-all active:scale-90"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-all">
                      <div className="min-w-0 pr-2">
                        <p className="text-[10px] font-black text-gray-900 uppercase truncate tracking-tight group-hover/item:text-indigo-600 transition-colors uppercase whitespace-nowrap">{item.name}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter shrink-0">{item.units} ventas sin margen</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingProductId(item.id);
                          setEditValue('');
                        }}
                        className="flex-shrink-0 text-[9px] font-black text-white bg-indigo-600 px-4 py-2 rounded-xl uppercase hover:bg-indigo-700 hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all active:scale-95 border border-indigo-500/20"
                      >
                        Fix
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Base de Datos Saludable</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Pareto row with Toggle (Revenue vs Quantity) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <GlassCard className="lg:col-span-2 p-8">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Análisis de Pareto (80/20)</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Concentración de {paretoType === 'revenue' ? 'Ingresos ($)' : 'Carga en Cocina (Cant.)'}</p>
                 </div>
                 <div className="flex p-1 bg-gray-100/50 rounded-xl">
                    <button 
                       onClick={() => setParetoType('revenue')}
                       className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${paretoType === 'revenue' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                       <DollarSign size={12} /> Cash
                    </button>
                    <button 
                       onClick={() => setParetoType('units')}
                       className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${paretoType === 'units' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                       <Zap size={12} /> Carga
                    </button>
                 </div>
              </div>

              <div className="h-[300px] w-full mt-4">
                 {isReady && (
                 <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={300}>
                    <ComposedChart data={paretoData.slice(0, 15)} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                       <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 9, fontBold: 900, fill: '#9ca3af' }} 
                          axisLine={false}
                          tickLine={false}
                          angle={-40}
                          textAnchor="end"
                          interval={0}
                       />
                       <YAxis hide yAxisId="left" />
                       <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          domain={[0, 100]} 
                          tick={{ fontSize: 9, fontBold: 900, fill: '#818cf8' }} 
                          axisLine={false}
                          tickLine={false}
                       />
                       <RechartsTooltip cursor={false} content={<VisionTooltip units="Valor" />} />
                       <Bar 
                          yAxisId="left" 
                          dataKey="value" 
                          radius={[6, 6, 0, 0]}
                       >
                         {paretoData.slice(0, 15).map((entry, index) => (
                           <Cell 
                              key={`cell-${index}`} 
                              fill={entry.cumPercentage <= 80 ? '#10B981' : '#E5E7EB'} 
                              fillOpacity={entry.cumPercentage <= 80 ? 1 : 0.4}
                           />
                         ))}
                       </Bar>
                       <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="cumulativePercent" 
                          stroke="#818cf8" 
                          strokeWidth={3} 
                          dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }} 
                       />
                       <ReferenceLine 
                          yAxisId="right" 
                          y={80} 
                          stroke="#10B981" 
                          strokeDasharray="5 5" 
                          strokeWidth={2}
                          label={{ 
                            position: 'right', 
                            value: '80% RELEVANCIA', 
                            fill: '#10B981', 
                            fontSize: 10, 
                            fontWeight: '900',
                            className: "drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          }} 
                        />
                    </ComposedChart>
                 </ResponsiveContainer>
                 )}
              </div>
           </GlassCard>

           <GlassCard className="p-8">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2">Market Contribution</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-6">Impacto en Utilidad Bruta</p>
              <div className="space-y-4">
                {growthContribution.slice(0, 7).map((item, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-gray-900 truncate max-w-[130px] tracking-tight">{item.name}</span>
                      <span className={item.profitDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {item.profitDiff >= 0 ? '+' : ''}{formatCompactCurrency(item.profitDiff)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.profitDiff >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{ width: `${Math.min(Math.abs(item.contribution) * 2.5, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
           </GlassCard>
        </div>

        {/* Efficiency & Hotspots Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <GlassCard className="lg:col-span-2 p-8">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Staffing & Peak Hours</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Relación Ingresos vs Órdenes por Hora</p>
                 </div>
              </div>
              <div className="h-[250px] w-full">
                 {isReady && (
                 <ResponsiveContainer width="100%" minWidth={1} minHeight={1} height={250}>
                    <AreaChart data={hourlyPerformance}>
                       <defs>
                          <linearGradient id="colorHourRev" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                       <XAxis 
                          dataKey="label" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontBold: 900, fill: '#cbd5e1' }}
                       />
                       <YAxis hide />
                       <RechartsTooltip cursor={false} content={<VisionTooltip units="Valor" />} />
                       <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#6366f1" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorHourRev)" 
                       />
                       <Area 
                          type="monotone" 
                          dataKey="avgTicket" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          strokeDasharray="4 4" 
                          fill="transparent" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
                 )}
              </div>
           </GlassCard>

           <GlassCard className="p-8">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-8">Volumen por Categoría</h3>
              <div className="space-y-6">
                 {categoryPopularity.slice(0, 5).map((cat, i) => (
                    <div key={i}>
                       <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">{cat.name}</span>
                          <span className="text-[10px] font-black text-indigo-500">{cat.share.toFixed(1)}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" 
                             style={{ width: `${cat.share}%` }}
                          />
                       </div>
                       <div className="flex justify-between mt-2">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{cat.units} unid.</span>
                          <span className="text-[8px] font-black text-emerald-500 uppercase">{formatCompactCurrency(cat.revenue)}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </GlassCard>
        </div>

        {/* Existing Audit Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/10 flex justify-between items-center">
              <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Auditoría: Cancelaciones</h3>
              <Trash2 className="text-rose-400" size={16} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">ID / Motivo</th>
                    <th className="px-6 py-4">Responsable</th>
                    <th className="px-6 py-4 text-right">Monto Perdido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-bold text-gray-600">
                  {leakageAudit.cancellations.length > 0 ? leakageAudit.cancellations.slice(0, 5).map((c, i) => (
                    <tr key={i} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-gray-900 uppercase">#{c.id.slice(0, 8)}</p>
                        <p className="text-[9px] text-rose-500 uppercase">{c.reason}</p>
                      </td>
                      <td className="px-6 py-4 uppercase text-[10px]">{c.by}</td>
                      <td className="px-6 py-4 text-right text-rose-500 font-black">{formatCurrency(c.amount)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="px-6 py-10 text-center italic text-gray-300">Sin fugas críticas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/10 flex justify-between items-center">
              <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Auditoría: Descuentos</h3>
              <DollarSign className="text-amber-400" size={16} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">ID / Glosa</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-bold text-gray-600">
                  {leakageAudit.discounts.length > 0 ? leakageAudit.discounts.slice(0, 5).map((d, i) => (
                    <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-gray-900 uppercase">#{d.id.slice(0, 8)}</p>
                        <p className="text-[9px] text-amber-600 uppercase">{d.reason}</p>
                      </td>
                      <td className="px-6 py-4 text-[10px]">{new Date(d.time).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right text-amber-600 font-black">{formatCurrency(d.amount)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="px-6 py-10 text-center italic text-gray-300">No hay descuentos registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  };

  const RenderOperaciones = () => (
    <div className="space-y-8 animate-fadeUp">
      {/* 🧠 Tactical Dashboard: Operations Intelligence */}
      <OperationsIntelligence data={data} formatCurrency={formatCurrency} />

      <div className="pt-8 border-t border-gray-100/50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Log Operativo Maestro & KPIs Base</p>
      </div>

      {/* Existing Operation Health Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <DiffBadge value={biStats.diffs.avgTime} />
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
            <DiffBadge value={biStats.diffs.orders} />
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
             <button 
               onClick={handleSmartExport}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
             >
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
              {(data?.orders || []).map((o) => {
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
          {(data?.leads || []).length === 0 ? (
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
                {(data?.leads || []).map((lead) => (
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
        <TabButton active={activeTab === 'crm'} onClick={() => setActiveTab('crm')} icon={Users} label="Clientes (CRM)" />
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
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {activeTab === 'resumen' && <RenderResumen />}
              {activeTab === 'analitica' && <RenderAnalitica />}
              {activeTab === 'operaciones' && <RenderOperaciones />}
              {activeTab === 'crm' && <CustomerDirectory />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* CRM components removed */}

      <AnimatePresence>
        {showBulkEditor && (
          <BulkCostEditor 
            products={allProducts}
            onSave={handleBulkSave}
            onCancel={() => setShowBulkEditor(false)}
          />
        )}
      </AnimatePresence>

      {createPortal(
        <div id="bi-report-root" className="print-report-container hidden print:flex flex-col bg-white min-h-screen p-16 text-gray-900 pointer-events-none fixed inset-0 z-[-1]">
           {/* Executive Branding */}
           <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-12">
              <div>
                 <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Reporte Ejecutivo BI</h1>
                 <p className="text-xl font-bold text-gray-400 uppercase mt-2 tracking-widest">{activeBrand?.name || 'Alto Andino'}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-gray-400">Rango de Análisis</p>
                 <p className="text-lg font-black text-gray-900 uppercase">
                    {dateRange === 'today' ? 'Hoy' : dateRange === '7d' ? 'Últimos 7 días' : 'Últimos 30 días'}
                 </p>
                 <p className="text-[9px] font-bold text-gray-400 mt-1 italic">Generado: {new Date().toLocaleString()}</p>
              </div>
           </div>

           {/* Prime Metrics Grid */}
           <div className="grid grid-cols-3 gap-12 mb-16">
              <div className="border-l-4 border-emerald-500 pl-6 py-2">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ingresos Totales</p>
                 <p className="text-3xl font-black text-gray-900 tabular-nums">{formatCurrency(biStats.current.revenue)}</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-6 py-2">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Utilidad Bruta</p>
                 <p className="text-3xl font-black text-gray-900 tabular-nums">{formatCurrency(biStats.current.profit)}</p>
              </div>
              <div className="border-l-4 border-indigo-500 pl-6 py-2">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Margen Real</p>
                 <p className="text-3xl font-black text-gray-900 tabular-nums">{biStats.current.margin.toFixed(1)}%</p>
              </div>
           </div>

           {/* BCG Matrix Insights */}
           <div className="mb-16">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-4 mb-8 italic">/// Análisis de Portafolio (BCG Matrix)</h2>
              <div className="grid grid-cols-2 gap-16">
                 <div>
                    <h3 className="text-[10px] font-black text-emerald-600 uppercase mb-4 tracking-tighter">★ PRODUCTOS ESTRELLA (Stars)</h3>
                    <div className="space-y-3">
                       {bcgData.items.filter(i => i.bcgCategory === 'Star').slice(0, 6).map((p, i) => (
                          <div key={i} className="flex justify-between items-baseline text-[11px] border-b border-gray-50 pb-1.5">
                             <span className="font-black text-gray-900 uppercase tracking-tight">{p.name}</span>
                             <span className="font-bold text-gray-500">{p.units} un • {p.margin.toFixed(0)}% mgn</span>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-[10px] font-black text-rose-600 uppercase mb-4 tracking-tighter">✘ PRODUCTOS PERRO (Dogs)</h3>
                    <div className="space-y-3">
                       {bcgData.items.filter(i => i.bcgCategory === 'Dog').slice(0, 6).map((p, i) => (
                          <div key={i} className="flex justify-between items-baseline text-[11px] border-b border-gray-50 pb-1.5">
                             <span className="font-black text-gray-900 opacity-40 uppercase tracking-tight">{p.name}</span>
                             <span className="font-bold text-gray-400">{p.units} un • {p.margin.toFixed(0)}% mgn</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Leakage Audit */}
           <div className="mb-16">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-4 mb-8 italic">/// Auditoría de Fugas de Ingresos</h2>
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                 <div className="flex justify-between items-center mb-8">
                    <p className="text-sm font-black text-rose-600 uppercase tracking-tighter">Impacto Total Fuga: {formatCurrency(leakageAudit.totalLeakage)}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-12">
                    <div>
                       <p className="text-[9px] font-black border-b border-gray-200 pb-2 mb-4 uppercase text-gray-400 tracking-widest">Cancelaciones</p>
                       <div className="space-y-2">
                          {leakageAudit.cancellations.slice(0, 5).map((c, i) => (
                             <div key={i} className="flex justify-between text-[10px] py-1">
                                <span className="font-bold text-gray-700">{c.reason.slice(0, 30)}</span>
                                <span className="font-black text-rose-600">{formatCurrency(c.amount)}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div>
                       <p className="text-[9px] font-black border-b border-gray-200 pb-2 mb-4 uppercase text-gray-400 tracking-widest">Descuentos</p>
                       <div className="space-y-2">
                          {leakageAudit.discounts.slice(0, 5).map((d, i) => (
                             <div key={i} className="flex justify-between text-[10px] py-1">
                                <span className="font-bold text-gray-700">{d.reason.slice(0, 30)}</span>
                                <span className="font-black text-amber-600">{formatCurrency(d.amount)}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-auto pt-16 text-[9px] font-black text-gray-300 uppercase italic text-center tracking-[0.2em] border-t border-gray-50">
              Intelligence Node /// Alto Andino Executive BI /// Confidencial
           </div>
        </div>,
        document.body
      )}
    </div>
  );
}
