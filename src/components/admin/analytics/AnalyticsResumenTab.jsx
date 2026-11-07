import React from 'react';
import { 
  DollarSign, TrendingUp, ShoppingCart, Trash2, Zap, Users, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { GlassCard, DiffBadge, VisionTooltip, WeeklyHeatmap } from './AnalyticsCommon';
import PlanCapacityBanner from './PlanCapacityBanner';
import DataIntegrityCard from './DataIntegrityCard';

const DEFAULT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function AnalyticsResumenTab({
  planDetails,
  activeBrand,
  integrityStats,
  allProducts = [],
  setShowBulkEditor,
  stats,
  biStats,
  advancedData,
  peakHour,
  isReady,
  hourlyStats = [],
  analyticsSummary,
  data,
  formatCompactCurrency,
  formatCurrency,
  setActiveTab,
  dayOfWeekStats = [],
  channelStats = [],
  heatmapStats = [],
  categoryStats = [],
  paymentStats = [],
  topProducts = [],
  tableStats = [],
  colors = DEFAULT_COLORS
}) {
  return (
    <div className="space-y-8 animate-fadeUp">
      <PlanCapacityBanner planDetails={planDetails} activeBrand={activeBrand} />
      <DataIntegrityCard 
        integrityStats={integrityStats} 
        allProducts={allProducts} 
        onOpenBulkEditor={() => setShowBulkEditor(true)} 
      />
      
      {/* Prime KPIs */}
      <div className="flex flex-row overflow-x-auto no-scrollbar gap-4 pb-4 snap-x -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Ingresos Totales', val: formatCompactCurrency(stats.revenue || 0), diff: biStats.diffs?.revenue, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Pronóstico Cierre', val: formatCompactCurrency(advancedData.forecasting?.projected_sales || 0), diff: advancedData.forecasting?.deviation_pct, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Pedidos Totales', val: stats.orderCount || 0, diff: biStats.diffs?.orders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Cancelados', val: stats.cancelledCount || 0, diff: biStats.diffs?.cancelled, icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Ticket Promedio', val: formatCompactCurrency(stats.avgTicket || 0), diff: biStats.diffs?.ticket, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Prospección', val: stats.leadCount || 0, diff: biStats.diffs?.leads, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' }
        ].map((item, i) => (
          <GlassCard key={i} className="p-5 shrink-0 snap-start w-[200px] md:w-auto">
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
        <GlassCard className="lg:col-span-3 p-5 md:p-8">
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
                  <RechartsTooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} content={<VisionTooltip units="Ventas" formatter={(val) => formatCompactCurrency(val)} />} />
                  <Area type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Conversion Funnel */}
        <GlassCard className="p-5 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Embudo de Ventas</h3>
            <div className="text-right">
              <p className="text-xs font-black text-rose-600">{analyticsSummary?.abandonmentRate || 0}% Fuga</p>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            {(() => {
              const { scans = 0, visits = 0, ordersCount = 0 } = analyticsSummary || {};
              const maxVal = Math.max(scans, visits, ordersCount, 1);
              
              const steps = [
                { label: 'Escaneos QR', val: scans, icon: Zap, color: 'bg-amber-100 text-amber-600', percent: (scans / maxVal) * 100 },
                { label: 'Vistas Carta', val: visits, icon: TrendingUp, color: 'bg-blue-100 text-blue-600', percent: (visits / maxVal) * 100 },
                { label: 'Pedidos Finales', val: ordersCount, icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-600', percent: (ordersCount / maxVal) * 100 },
              ];

              return steps.map((step, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-gray-500">{step.label}</span>
                    <span className="text-gray-900 font-mono">{step.val}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${step.color.split(' ')[0].replace('100', '500')}`} 
                      style={{ width: `${step.percent}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </GlassCard>
      </div>

      {/* Row 2: Recent Activity Table & Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <GlassCard className="lg:col-span-3 p-5 md:p-8 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Actividad Reciente</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Monitor operativo en vivo</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse">
              En Vivo
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-4">Estado</th>
                  <th className="pb-4">Origen</th>
                  <th className="pb-4">Hora</th>
                  <th className="pb-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.orders || []).slice(0, 6).map((o, i) => (
                  <tr key={i} className="group hover:bg-gray-50/50 transition-all cursor-pointer">
                    <td className="py-4">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${
                        o.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 
                        o.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {o.status === 'delivered' ? '✓' : o.status === 'cancelled' ? '✕' : '🕒'}
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-[10px] font-black text-gray-900 uppercase">
                        {o.fulfillment_type === 'dine_in' ? `Mesa ${o.restaurant_tables?.table_number || '??'}` : 'Para Llevar'}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">#{o.id.slice(0, 6)}</p>
                    </td>
                    <td className="py-4 font-bold text-gray-500 uppercase">
                      {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 text-right">
                      <p className="text-[11px] font-black text-gray-900 font-mono tracking-tight">{formatCompactCurrency(o.total_amount)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Action Card - Operational Focus */}
        <GlassCard className="p-5 md:p-8 flex flex-col justify-between border-gray-100/50 relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-50 rounded-full blur-[80px] opacity-60 group-hover:opacity-100 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-4 border border-gray-100 shadow-sm transition-transform group-hover:scale-110 duration-500">
              <Zap className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight text-center">Rendimiento Operativo</h3>
            <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider text-center">Estado de Hoy</p>
          </div>

          <div className="relative z-10 flex flex-col items-center py-4">
            {(() => {
              const successfulOrders = (data?.orders || []).filter(o => o.status === 'delivered');
              const totalRevenue = successfulOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
              const avgTicket = successfulOrders.length > 0 ? totalRevenue / successfulOrders.length : 0;

              return (
                <>
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-5xl font-black text-gray-900 tracking-tighter">
                      {successfulOrders.length}
                    </span>
                    <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      Ventas
                    </span>
                  </div>
                  
                  <div className="mt-4 flex gap-6 items-center">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-900 font-mono">
                        {formatCompactCurrency(avgTicket)}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Ticket Prom.</p>
                    </div>
                    <div className="w-px h-6 bg-gray-100" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-emerald-600">
                        LIVE
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Sincronizado</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          
          <button 
            onClick={() => setActiveTab('operaciones')}
            className="relative z-10 w-full py-3.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            Ver Pedidos (Log)
            <span className="opacity-40 tracking-normal font-normal">→</span>
          </button>
        </GlassCard>
      </div>

      {/* High Intensity Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ciclo de Ventas Semanal */}
        <GlassCard className="lg:col-span-2 p-5 md:p-8">
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
                  <RechartsTooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} content={<VisionTooltip units="Ingresos" formatter={(val) => formatCurrency(val)} />} />
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

        {/* Mix de Canales (Radial Bar) */}
        <GlassCard className="p-5 md:p-8">
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
        <GlassCard className="lg:col-span-3 p-5 md:p-8 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Mapa de Calor Semanal</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Intensidad operativa por horario</p>
            </div>
          </div>
          <WeeklyHeatmap data={heatmapStats} />
        </GlassCard>

        <GlassCard className="p-5 md:p-8">
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
                    style={{ width: `${(cat.value / (stats.revenue || 1) * 100) || 0}%` }}
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
        <GlassCard className="p-5 md:p-8">
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
                      fill={colors[index % colors.length]} 
                      radius={index === 0 ? [4, 0, 0, 4] : index === paymentStats.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-[10px] font-bold uppercase italic">Sin datos de pago</div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {paymentStats.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-[9px] font-bold text-gray-500 uppercase">{p.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Star Products */}
        <GlassCard className="p-5 md:p-8">
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
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-[10px] font-bold uppercase italic">Sin ventas registradas</div>
            )}
          </div>
        </GlassCard>

        {/* Table / Channel Radar */}
        <GlassCard className="p-5 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Ventas por Mesa</h3>
            <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md uppercase">Ocupación</span>
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

      {/* Advanced Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-5 md:p-8">
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

        <GlassCard className="p-5 md:p-8">
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
                      { name: 'Nuevos', value: advancedData.cohorts?.['Nuevo'] || 0, fill: '#3B82F6' },
                      { name: 'Recurrentes', value: advancedData.cohorts?.['Recurrente'] || 0, fill: '#10B981' },
                      { name: 'Esporádicos', value: advancedData.cohorts?.['Esporádico'] || 0, fill: '#F59E0B' }
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
    </div>
  );
}
