import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { Icon } from '@iconify-icon/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#2f4131', '#7db87a', '#EAB308', '#F97316', '#3B82F6', '#8B5CF6'];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 'today', '7d', '30d', 'all'
  const { activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocation();
  const activeBrandId = activeBrand?.id;

  useEffect(() => {
    async function fetchDashboardData() {
      if (!activeBrandId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let query = supabase.from('orders').select(`
          id, total_amount, status, created_at, delivered_at, fulfillment_type, table_id, payment_method,
          restaurant_tables ( table_number ),
          order_items ( quantity, unit_price, products ( name, category_id ) )
        `).order('created_at', { ascending: true });

        if (activeBrandId) {
          query = query.eq('brand_id', activeBrandId);
        }

        if (!isAllLocations && activeLocationId) {
          query = query.eq('location_id', activeLocationId);
        }

        // Aplicar filtro de fecha en JS o en DB. Mejor DB para rendimiento si hay muchos.
        if (dateRange !== 'all') {
          const d = new Date();
          if (dateRange === 'today') d.setHours(0,0,0,0);
          if (dateRange === '7d') d.setDate(d.getDate() - 7);
          if (dateRange === '30d') d.setDate(d.getDate() - 30);
          query = query.gte('created_at', d.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [dateRange, activeBrandId, activeLocationId, isAllLocations]);

  const stats = useMemo(() => {
    if (!orders.length) return { revenue: 0, avgTicket: 0, orderCount: 0, avgTime: 0, itemsCount: 0 };

    const delivered = orders.filter(o => o.status === 'delivered');
    const revenue = delivered.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgTicket = delivered.length ? revenue / delivered.length : 0;
    
    let totalMins = 0;
    let timeCount = 0;
    delivered.forEach(o => {
      if (o.delivered_at && o.created_at) {
        const diff = (new Date(o.delivered_at) - new Date(o.created_at)) / 60000;
        if (diff > 0 && diff < 300) { // ignorar outliers raros > 5 horas
          totalMins += diff;
          timeCount++;
        }
      }
    });
    const avgTime = timeCount ? Math.round(totalMins / timeCount) : 0;

    const itemsCount = delivered.reduce((sum, o) => 
      sum + (o.order_items?.reduce((s, item) => s + item.quantity, 0) || 0)
    , 0);

    return {
      revenue,
      avgTicket,
      orderCount: delivered.length,
      pendingCount: orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status)).length,
      cancelledCount: orders.filter(o => o.status === 'cancelled').length,
      avgTime,
      itemsCount
    };
  }, [orders]);

  const salesTrend = useMemo(() => {
    const trend = {};
    orders.filter(o => o.status === 'delivered').forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      if (!trend[date]) trend[date] = { date, ventas: 0, pedidos: 0 };
      trend[date].ventas += Number(o.total_amount);
      trend[date].pedidos += 1;
    });
    return Object.values(trend);
  }, [orders]);

  const hourlyStats = useMemo(() => {
    // Fill from 7 AM to 11 PM
    const stats = Array.from({ length: 17 }, (_, i) => ({
      hour: i + 7,
      label: `${(i + 7).toString().padStart(2, '0')}:00`,
      ventas: 0,
      pedidos: 0
    }));

    orders.filter(o => o.status === 'delivered').forEach(o => {
      const h = new Date(o.created_at).getHours();
      if (h >= 7 && h <= 23) {
        const entry = stats.find(s => s.hour === h);
        if (entry) {
          entry.ventas += Number(o.total_amount);
          entry.pedidos += 1;
        }
      }
    });

    return stats;
  }, [orders]);

  const tableStats = useMemo(() => {
    const stats = {};
    orders.filter(o => o.status === 'delivered' && o.fulfillment_type === 'dine_in').forEach(o => {
      const name = o.restaurant_tables?.table_number || 'Sin asignar';
      if (!stats[name]) stats[name] = { name, ingresos: 0, pedidos: 0 };
      stats[name].ingresos += Number(o.total_amount);
      stats[name].pedidos += 1;
    });
    return Object.values(stats).sort((a, b) => b.ingresos - a.ingresos);
  }, [orders]);

  const topProducts = useMemo(() => {
    const productStats = {};
    orders.filter(o => o.status === 'delivered').forEach(o => {
      o.order_items?.forEach(item => {
        const name = item.products?.name || 'Desconocido';
        if (!productStats[name]) productStats[name] = { name, cantidad: 0, ingresos: 0 };
        productStats[name].cantidad += item.quantity;
        productStats[name].ingresos += (item.quantity * item.unit_price);
      });
    });
    return Object.values(productStats).sort((a,b) => b.cantidad - a.cantidad).slice(0, 5);
  }, [orders]);

  const origins = useMemo(() => {
    const counts = { 'Mesa': 0, 'Llevar': 0, 'Domicilio': 0 };
    orders.filter(o => o.status === 'delivered').forEach(o => {
      if (o.fulfillment_type === 'dine_in') counts['Mesa']++;
      else if (o.fulfillment_type === 'takeaway') counts['Llevar']++;
      else if (o.fulfillment_type === 'delivery') counts['Domicilio']++;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] })).filter(c => c.value > 0);
  }, [orders]);

  const paymentStats = useMemo(() => {
    const stats = {};
    orders.filter(o => o.status === 'delivered').forEach(o => {
      const method = o.payment_method || 'Pendiente';
      const label = method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : method.charAt(0).toUpperCase() + method.slice(1);
      if (!stats[label]) stats[label] = { name: label, value: 0 };
      stats[label].value += Number(o.total_amount);
    });
    return Object.values(stats);
  }, [orders]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 border-l-4 border-[#2f4131] pl-4">DASHBOARD</h1>
          <p className="text-gray-500 mt-1 font-medium pl-4">Inteligencia de Negocio & Analíticas</p>
        </div>
        <div className="flex gap-2">
          {['today', '7d', '30d', 'all'].map(t => (
             <button
               key={t}
               onClick={() => setDateRange(t)}
               className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm border ${
                 dateRange === t 
                   ? 'bg-[#2f4131] text-white border-[#2f4131]' 
                   : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200'
               }`}
             >
               {t === 'today' ? 'Hoy' : t === '7d' ? '7 Días' : t === '30d' ? '30 Días' : 'Todo'}
             </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">Ingresos Totales</p>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Icon icon="heroicons:banknotes" className="text-lg" />
                </div>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-black text-gray-900">{formatCurrency(stats.revenue)}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">{stats.orderCount} pedidos entregados</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">Ticket Promedio</p>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon icon="heroicons:receipt-percent" className="text-lg" />
                </div>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-black text-gray-900">{formatCurrency(stats.avgTicket)}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Por pedido finalizado</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">Tiempo Promedio</p>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Icon icon="heroicons:clock" className="text-lg" />
                </div>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-black text-gray-900">{stats.avgTime} <span className="text-lg text-gray-500 font-bold">min</span></p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Desde recibido hasta entregado</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">Flujo de Pedidos</p>
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Icon icon="heroicons:arrow-trending-up" className="text-lg" />
                </div>
              </div>
              <div className="flex items-end gap-3 mt-1">
                <div>
                  <p className="text-2xl lg:text-3xl font-black text-gray-900 leading-none">{stats.pendingCount}</p>
                  <p className="text-[10px] font-bold text-orange-500 mt-1">Pendientes</p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div>
                  <p className="text-xl font-black text-gray-600 leading-none">{stats.cancelledCount}</p>
                  <p className="text-[10px] font-bold text-red-500 mt-1">Cancelados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                <Icon icon="heroicons:chart-bar" className="text-[#7db87a]" />
                EVOLUCIÓN DE INGRESOS
              </h3>
              <div className="h-[300px] w-full min-h-[300px] relative">
                {salesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                      <YAxis tickFormatter={(v) => `$${v/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dx={-10} />
                      <RechartsTooltip 
                        formatter={(val) => [formatCurrency(val), 'Ingresos']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="ventas" stroke="#2f4131" strokeWidth={4} dot={{ r: 4, fill: '#7db87a', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 font-medium">No hay datos para mostrar</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                <Icon icon="heroicons:credit-card" className="text-emerald-500" />
                MÉTODOS DE PAGO
              </h3>
              <div className="h-[250px] w-full min-h-[250px] relative">
                {paymentStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentStats.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(val) => [formatCurrency(val), 'Ingresos']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                <Icon icon="heroicons:pie-chart" className="text-[#EAB308]" />
                ORIGEN DE VENTAS
              </h3>
              <div className="h-[250px] w-full min-h-[250px] relative">
                {origins.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={origins}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {origins.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#8B5CF6', '#F97316', '#3B82F6'][index % 3]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 font-medium">No hay datos</div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row Pro */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight italic">
                <Icon icon="heroicons:clock" className="text-orange-500" />
                Picos de Demanda (Por Hora)
              </h3>
              <div className="h-[300px] w-full min-h-[300px] relative">
                {hourlyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyStats}>
                      <defs>
                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7db87a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7db87a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                      <YAxis tickFormatter={(v) => `$${v/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                      <RechartsTooltip 
                        formatter={(val) => [formatCurrency(val), 'Ventas']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="ventas" stroke="#7db87a" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight italic">
                <Icon icon="heroicons:table-cells" className="text-blue-500" />
                Ventas por Mesa (Productividad)
              </h3>
              <div className="h-[300px] w-full min-h-[300px] relative">
                {tableStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tableStats} margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 700 }} />
                      <YAxis tickFormatter={(v) => `$${v/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <RechartsTooltip 
                        formatter={(val) => [formatCurrency(val), 'Ingresos']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="ingresos" fill="#2f4131" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Sin pedidos en mesa</div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
              <Icon icon="heroicons:star" className="text-[#3B82F6]" />
              TOP 5 PLATOS MÁS VENDIDOS
            </h3>
            <div className="h-[300px] w-full min-h-[300px] relative">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 600 }} width={90} />
                    <RechartsTooltip 
                      formatter={(val) => [`${val} uds`, 'Vendidos']}
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="cantidad" fill="#7db87a" radius={[0, 8, 8, 0]} barSize={24}>
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % 2 === 0 ? 1 : 0]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 font-medium">No hay datos</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
