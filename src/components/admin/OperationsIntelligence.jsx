import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  Users, 
  TrendingUp, 
  ChefHat, 
  Timer, 
  Layout, 
  ArrowUpRight,
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  ComposedChart, ReferenceLine
} from 'recharts';

const GlassCard = ({ children, className = "", noHover = false }) => (
  <motion.div 
    whileHover={noHover ? {} : { y: -4, transition: { duration: 0.2 } }}
    className={`bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] glass-glow ${className}`}
  >
    {children}
  </motion.div>
);

const MetricCard = ({ label, value, subValue, icon: Icon, colorClass, delay = 0 }) => (
  <GlassCard className="p-6">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass} bg-opacity-10 shadow-sm shadow-black/5`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
      </div>
    </div>
    {subValue && (
      <div className="flex items-center gap-1.5 mt-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{subValue}</span>
      </div>
    )}
  </GlassCard>
);

export default function OperationsIntelligence({ data, formatCurrency }) {
  const stats = useMemo(() => {
    const orders = data?.orders || [];
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    
    // SLA Calculation (Prep Time)
    const prepTimes = deliveredOrders
      .map(o => {
        if (!o.delivered_at || !o.created_at) return null;
        return (new Date(o.delivered_at) - new Date(o.created_at)) / 60000;
      })
      .filter(t => t !== null && t > 0);
    
    const avgSLA = prepTimes.length > 0 
      ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) 
      : 0;

    // SLA Adherence (% orders <= 20 min)
    const targetMin = 20;
    const slaAdherence = prepTimes.length > 0
      ? Math.round((prepTimes.filter(t => t <= targetMin).length / prepTimes.length) * 100)
      : 0;

    // Hourly Pulse (Advanced Flow Analysis: Received vs Dispatched)
    const hourlyFlow = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      received: 0,
      dispatched: 0,
      accumulated: 0, // Current backlog at that hour
      slaMins: 0,
      slaCount: 0
    }));

    orders.forEach(o => {
      const createdHour = new Date(o.created_at).getHours();
      hourlyFlow[createdHour].received++;

      if (o.delivered_at) {
        const deliveredHour = new Date(o.delivered_at).getHours();
        hourlyFlow[deliveredHour].dispatched++;
        
        const pTime = (new Date(o.delivered_at) - new Date(o.created_at)) / 60000;
        if (pTime > 0) {
          hourlyFlow[createdHour].slaMins += pTime;
          hourlyFlow[createdHour].slaCount++;
        }
      }
    });

    // Calculate Backlog & Tension
    let currentBacklog = 0;
    let maxBacklog = 0;
    let peakHour = "N/A";

    const pulseData = hourlyFlow.map(h => {
      currentBacklog += (h.received - h.dispatched);
      if (currentBacklog > maxBacklog) {
        maxBacklog = currentBacklog;
        peakHour = h.hour;
      }
      return {
        ...h,
        backlog: Math.max(0, currentBacklog),
        avgTime: h.slaCount > 0 ? Math.round(h.slaMins / h.slaCount) : 0
      };
    });

    // Max Dispatch Capacity
    const maxDispatch = Math.max(...hourlyFlow.map(h => h.dispatched));

    // Staff Performance (Efficiency Score: Revenue/Order + Speed)
    const waiterStats = {};
    orders.forEach(o => {
      const waiterId = o.waiter_id || 'Mesero';
      const waiterName = o.staff?.name || (o.waiter_id ? `ID: ${o.waiter_id.slice(0, 4)}` : 'S.M.');
      
      if (!waiterStats[waiterId]) {
        waiterStats[waiterId] = { 
          id: waiterId, 
          name: waiterName, 
          orders: 0, 
          revenue: 0, 
          time: 0, 
          deliveredCount: 0,
          tips: 0 
        };
      }
      waiterStats[waiterId].orders++;
      waiterStats[waiterId].revenue += o.total_amount || 0;
      waiterStats[waiterId].tips += parseFloat(o.service_fee || 0);
      
      if (o.delivered_at) {
        const pTime = (new Date(o.delivered_at) - new Date(o.created_at)) / 60000;
        if (pTime > 0) {
          waiterStats[waiterId].time += pTime;
          waiterStats[waiterId].deliveredCount++;
        }
      }
    });

    const staffEfficiency = Object.values(waiterStats)
      .map(s => ({
        ...s,
        avgTime: s.deliveredCount > 0 ? Math.round(s.time / s.deliveredCount) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const tableStats = {};
    orders.forEach(o => {
      const tableNum = o.restaurant_tables?.table_number || 'S.M';
      if (!tableStats[tableNum]) {
        tableStats[tableNum] = { 
          number: tableNum, 
          count: 0, 
          revenue: 0, 
          duration: 0,
          deliveredCount: 0 
        };
      }
      tableStats[tableNum].count++;
      tableStats[tableNum].revenue += o.total_amount || 0;
      
      if (o.delivered_at && o.created_at) {
        const pTime = (new Date(o.delivered_at) - new Date(o.created_at)) / 60000;
        if (pTime > 0) {
          tableStats[tableNum].duration += pTime;
          tableStats[tableNum].deliveredCount++;
        }
      }
    });

    const tableProfitability = Object.values(tableStats)
      .map(t => {
        const totalHours = t.duration / 60 || 1; // Fallback to 1 to avoid /0
        return {
          ...t,
          revPH: t.revenue / totalHours,
          avgDuration: t.deliveredCount > 0 ? t.duration / t.deliveredCount : 0
        };
      })
      .sort((a, b) => b.revPH - a.revPH)
      .slice(0, 10);

    // Inactividad Crítica: Mesas con mucho tiempo y poco ingreso
    const criticalInactivity = tableProfitability
      .filter(t => t.avgDuration > 45 && t.revPH < 20000) // Arbitrary threshold for demo
      .slice(0, 3);

    return {
      avgSLA,
      slaAdherence,
      pulseData,
      peakHour,
      maxDispatch,
      totalOrders: orders.length,
      staffEfficiency,
      tableProfitability,
      criticalInactivity,
      // Friction Analysis with Pareto Calculation
      frictionData: (() => {
        const cancelled = orders.filter(o => o.status === 'cancelled');
        const reasons = {};
        let totalValue = 0;
        
        cancelled.forEach(o => {
          const r = o.cancellation_reason || 'Sin motivo';
          if (!reasons[r]) reasons[r] = { name: r, value: 0, count: 0 };
          reasons[r].value += (o.total_amount || 0);
          reasons[r].count++;
          totalValue += (o.total_amount || 0);
        });

        const sorted = Object.values(reasons).sort((a, b) => b.value - a.value);
        let cumulative = 0;
        return sorted.map(item => {
          cumulative += item.value;
          return {
            ...item,
            cumulative: (cumulative / (totalValue || 1)) * 100
          };
        });
      })(),
      // Payment Trends Analysis
      paymentTrends: (() => {
        const trends = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          // We'll fill this with dynamic methods
        }));
        
        const methods = data?.paymentMethods || [];
        orders.forEach(o => {
          if (o.status !== 'delivered') return;
          const hour = new Date(o.created_at).getHours();
          const methodName = methods.find(m => m.id === o.payment_method)?.name || 'Otro';
          if (!trends[hour][methodName]) trends[hour][methodName] = 0;
          trends[hour][methodName] += (o.total_amount || 0);
        });
        
        return trends.filter(t => Object.keys(t).length > 1); // Only hours with data
      })(),
      totalLoss: orders.reduce((acc, o) => {
        if (o.status === 'cancelled') return acc + (o.total_amount || 0);
        return acc + (parseFloat(o.discount_amount || 0));
      }, 0),
      slaStatus: avgSLA <= 20 ? 'Óptimo' : avgSLA <= 30 ? 'Alerta' : 'Crítico',
      // Advanced Metrics
      rushHour: pulseData.reduce((prev, curr) => (curr.received > prev.received ? curr : prev), { received: 0, hour: 'N/A' }),
      stressedHour: pulseData.reduce((prev, curr) => (curr.backlog > prev.backlog ? curr : prev), { backlog: 0, hour: 'N/A' }),
      avgStress: pulseData.length > 0 ? (pulseData.reduce((acc, curr) => acc + curr.backlog, 0) / pulseData.length) : 0,
      // Operational Incidents (SLA Breaches)
      incidents: orders
        .filter(o => o.status === 'delivered' && o.delivered_at && o.created_at)
        .map(o => {
          const pTime = (new Date(o.delivered_at) - new Date(o.created_at)) / 60000;
          return { ...o, pTime };
        })
        .filter(o => o.pTime > 25) // Threshold for "Incident"
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
    };
  }, [data]);

  return (
    <div className="space-y-8 animate-fadeUp">
      {/* Top Tactical KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="SLA Cocina (Prom)"
          value={`${stats.avgSLA} min`}
          subValue={`Cumplimiento: ${stats.slaAdherence}%`}
          icon={Timer}
          colorClass={stats.avgSLA <= 20 ? 'bg-emerald-500' : 'bg-rose-500'}
        />
        <MetricCard 
          label="Carga Operativa"
          value={stats.totalOrders}
          subValue="Pedidos procesados"
          icon={Zap}
          colorClass="bg-amber-500"
        />
        <MetricCard 
          label="Máxima Tensión"
          value={stats.peakHour}
          subValue={`Backlog máx: ${stats.maxBacklog} ped.`}
          icon={Target}
          colorClass="bg-rose-500"
        />
        <MetricCard 
          label="Capac. Despacho"
          value={stats.maxDispatch}
          subValue="Máx pedidos/hora"
          icon={TrendingUp}
          colorClass="bg-blue-500"
        />
        <MetricCard 
          label="Hora Pico (Draft)"
          value={stats.rushHour.hour}
          subValue={`${stats.rushHour.received} pedidos recib.`}
          icon={Clock}
          colorClass="bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pulso Operativo Chart: Intake vs Output */}
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Flujo de Cocina</h3>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Entrada (Recibidos) vs Salida (Despachados)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Recibidos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Despachados</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={stats.pulseData.filter(d => d.received > 0 || d.dispatched > 0)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontBold: 700, fill: '#94A3B8' }}
                />
                <YAxis yAxisId="left" hide />
                <YAxis yAxisId="right" hide />
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0A0A0B]/95 backdrop-blur-xl text-white p-4 rounded-2xl border border-white/10 shadow-2xl min-w-[160px]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">{label}</p>
                          <div className="space-y-1.5">
                             <p className="text-xs flex justify-between font-bold">
                               <span className="text-gray-400">Recibidos:</span> 
                               <span>{payload[0].value}</span>
                             </p>
                             <p className="text-xs flex justify-between font-bold">
                               <span className="text-gray-400">Despachados:</span> 
                               <span className="text-indigo-400">{payload[1].value}</span>
                             </p>
                             <p className="text-xs flex justify-between font-bold pt-1 border-t border-white/5">
                               <span className="text-gray-400">Backlog:</span> 
                               <span className="text-rose-400">{payload[2].value} ped.</span>
                             </p>
                             <p className="text-xs flex justify-between font-bold">
                               <span className="text-gray-400">SLA Prom:</span> 
                               <span className="text-emerald-400">{payload[3].value} min</span>
                             </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="received" 
                  fill="#E2E8F0" 
                  radius={[4, 4, 0, 0]} 
                  barSize={15}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="dispatched" 
                  fill="#6366F1" 
                  radius={[4, 4, 0, 0]} 
                  barSize={15}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="backlog" 
                  fill="#FDA4AF" 
                  fillOpacity={0.3}
                  radius={[4, 4, 0, 0]} 
                  barSize={5}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgTime" 
                  stroke="#10B981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <ReferenceLine yAxisId="right" y={20} label={{ value: 'GOAL', position: 'insideTopRight', fill: '#FDA4AF', fontSize: 8, fontWeight: 900 }} stroke="#FDA4AF" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-50">
                <ChefHat className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase">Hora de Mayor Carga</p>
                <p className="text-xs font-black text-gray-900">{stats.stressedHour.hour} ({stats.stressedHour.backlog} ped. en espera)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-right justify-end">
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase">Eficiencia de Despacho</p>
                <p className="text-xs font-black text-emerald-500">
                  {stats.totalOrders > 0 ? ((stats.totalOrders / (stats.totalOrders + stats.maxBacklog)) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50">
                <Zap className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Staff Productivity Ranking with Speed */}
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Ranking de Productividad</h3>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Ventas y Velocidad de Atención</p>
            </div>
            <ChefHat className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-6">
            {stats.staffEfficiency.map((staff, i) => (
              <div key={staff.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  i === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-gray-900 uppercase">{staff.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">⚡ {staff.avgTime} min prom.</span>
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">
                          💰 Propinas: {formatCurrency(staff.tips)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-black text-gray-900 tabular-nums block">{formatCurrency(staff.revenue)}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">{staff.orders} pedidos</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(staff.revenue / (stats.staffEfficiency[0]?.revenue || 1)) * 100}%` }}
                      className={`h-full ${i === 0 ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Table ROI Heatmap Grid */}
      <GlassCard className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Heatmap de Rentabilidad</h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Desempeño Visual por Mesa (RevPH)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Top ROI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Bajo ROI</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {stats.tableProfitability.map((table) => {
            const isCritical = table.revPH < 20000 && table.avgDuration > 45;
            const intensity = Math.min(1, table.revPH / 100000); // Scale 0-1
            
            return (
              <motion.div
                key={table.number}
                whileHover={{ scale: 1.05 }}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all ${
                  isCritical 
                    ? 'bg-rose-50 border-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
                    : 'bg-white border-gray-100 hover:shadow-xl'
                }`}
              >
                <div 
                  className="absolute inset-2 rounded-xl opacity-20"
                  style={{ backgroundColor: isCritical ? '#F43F5E' : '#10B981', transform: `scale(${intensity})` }}
                />
                <span className={`text-lg font-black ${isCritical ? 'text-rose-600' : 'text-gray-900'}`}>{table.number}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                  {formatCurrency(table.revPH)}/h
                </span>
                {isCritical && (
                  <div className="absolute -top-1 -right-1">
                    <AlertCircle className="w-4 h-4 text-rose-500 fill-white" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* Table Rentability & Turnover Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
          <div>
            <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Detalle de Operación de Mesas</h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Ingresos por Hora y Tiempo de Rotación</p>
          </div>
          <Layout className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Mesa / Ubicación</th>
                <th className="px-8 py-5 text-center">Frecuencia</th>
                <th className="px-8 py-5 text-right">Duración Prom.</th>
                <th className="px-8 py-5 text-right">Revenue p/Hora (RevPH)</th>
                <th className="px-8 py-5 text-right">Total Generado</th>
                <th className="px-8 py-5 text-right">ROI Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.tableProfitability.map((table) => (
                <tr key={table.number} className="hover:bg-gray-50/50 transition-colors group text-[11px]">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shadow-sm ${
                        table.revPH > 80000 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                      }`}>
                        {table.number}
                      </div>
                      <div>
                        <span className="font-black text-gray-900 uppercase">Zona Principal</span>
                        {table.revPH < 20000 && table.avgDuration > 45 && (
                          <div className="flex items-center gap-1 text-rose-500 text-[8px] font-bold mt-0.5">
                            <AlertCircle className="w-2.5 h-2.5" />
                            ALTA INACTIVIDAD
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className="font-black text-gray-900">{table.count} serv.</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="font-bold text-gray-600">{Math.round(table.avgDuration)} min</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="font-black text-emerald-600">{formatCurrency(table.revPH)}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="font-bold text-gray-900">{formatCurrency(table.revenue)}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-indigo-500 font-black text-[10px]">
                      {((table.revenue / (stats.tableProfitability.reduce((acc, t) => acc + t.revenue, 0) || 1)) * 100).toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Friction & Loss Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Friction Pareto Chart */}
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Análisis de Pareto (Fricción)</h3>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">20% de causas vs 80% de pérdidas</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-rose-400 uppercase">Pérdida Total</p>
              <p className="text-xl font-black text-rose-500 tracking-tighter">{formatCurrency(stats.totalLoss)}</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.frictionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontBold: 700, fill: '#94A3B8' }}
                />
                <YAxis yAxisId="left" hide />
                <YAxis yAxisId="right" orientation="right" hide />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0A0A0B]/95 backdrop-blur-xl text-white p-4 rounded-2xl border border-white/10 shadow-2xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">{payload[0].payload.name}</p>
                          <p className="text-xs font-bold mb-1">Monto: {formatCurrency(payload[0].value)}</p>
                          <p className="text-xs font-bold text-emerald-400">Acumulado: {payload[1].value.toFixed(1)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar yAxisId="left" dataKey="value" fill="#FDA4AF" radius={[6, 6, 0, 0]} barSize={40} />
                <Area 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#F43F5E" 
                  strokeWidth={3} 
                  fill="url(#colorLoss)" 
                  fillOpacity={0.1}
                />
                <ReferenceLine yAxisId="right" y={80} stroke="#475569" strokeDasharray="3 3" label={{ value: '80%', position: 'insideRight', fill: '#475569', fontSize: 10, fontWeight: 900 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Payment Trends & Mix */}
        <GlassCard className="p-8">
           <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Tendencias de Pago</h3>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Cómo pagan tus clientes según la hora</p>
            </div>
            <BarChart3 className="w-5 h-5 text-emerald-500" />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.paymentTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontBold: 700, fill: '#94A3B8' }}
                />
                <YAxis hide />
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0A0A0B]/95 backdrop-blur-xl text-white p-4 rounded-2xl border border-white/10 shadow-2xl min-w-[150px]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">{label}</p>
                          {payload.map((p, i) => (
                            <p key={i} className="text-[11px] flex justify-between gap-4 font-bold">
                              <span className="text-gray-400">{p.name}:</span>
                              <span>{formatCurrency(p.value)}</span>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {data?.paymentMethods.map((pm, i) => (
                  <Area
                    key={pm.id}
                    type="monotone"
                    dataKey={pm.name}
                    stackId="1"
                    stroke={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][i % 4]}
                    fill={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][i % 4]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Tactical Alerts Feed (SLA Audit) */}
      <GlassCard className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 tracking-tight text-sm uppercase">Consola de Incidencias</h3>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Auditoría de Incumplimiento de SLA {`> 25min`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {stats.incidents.length} Eventos Detectados
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.incidents.length > 0 ? (
            stats.incidents.map((inc, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-amber-200 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orden #{inc.id.slice(0, 4)}</span>
                    <span className="text-xs font-black text-gray-900 group-hover:text-amber-600 transition-colors uppercase">{inc.staff?.name || 'S.M.'}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                    inc.pTime > 40 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {Math.round(inc.pTime)} min
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                   <div className="flex items-center gap-1.5">
                     <Clock className="w-3 h-3 text-gray-300" />
                     <span className="font-bold text-[9px] text-gray-400 tabular-nums">
                       {new Date(inc.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                     </span>
                   </div>
                   <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Retraso Crítico</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 bg-emerald-50/30 rounded-3xl border border-dashed border-emerald-100">
               <CheckCircle2 className="w-8 h-8 text-emerald-400" />
               <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Cero incidencias de SLA en este periodo</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
