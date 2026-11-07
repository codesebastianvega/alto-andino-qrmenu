import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Zap, ChevronRight, AlertCircle, Check, X, Trash2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Bar, ScatterChart, Scatter, ZAxis, ReferenceLine, Cell, ComposedChart, Line
} from 'recharts';
import { GlassCard, DiffBadge, VisionTooltip } from './AnalyticsCommon';

export default function AnalyticsInsightsTab({
  growthContribution = [],
  smartRecommendations = [],
  setShowBulkEditor,
  setActiveTab,
  biStats,
  formatCurrency,
  formatCompactCurrency,
  leakageAudit,
  bcgData,
  isReady,
  editingProductId,
  setEditingProductId,
  editValue,
  setEditValue,
  handleQuickCostUpdate,
  isSavingCost,
  paretoType,
  setParetoType,
  paretoData = [],
  hourlyPerformance = [],
  categoryPopularity = []
}) {
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
            <DiffBadge value={biStats.diffs?.profit} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilidad Neta</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(biStats.current?.profit || 0)}</h3>
          <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase text-emerald-600">Post-Costos de Insumo</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div className={`text-[10px] font-black flex items-center gap-1 ${(biStats.diffs?.margin || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {(biStats.diffs?.margin || 0) >= 0 ? '+' : ''}{(biStats.diffs?.margin || 0).toFixed(1)} pts
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Margen Real</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{(biStats.current?.margin || 0).toFixed(1)}%</h3>
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
          <h3 className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(leakageAudit?.totalLeakage || 0)}</h3>
          <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase text-rose-500">Cancelaciones + Desc.</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap size={18} />
            </div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">Top Factor</span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Core Product</p>
          <h3 className="text-lg font-black text-gray-900 mt-1 truncate">{topDriver.name}</h3>
          <p className="text-[9px] font-bold text-emerald-500 mt-1 uppercase">+{topDriver.contribution.toFixed(1)}% Al Crecimiento</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BCG Matrix Visualization */}
        <GlassCard className="lg:col-span-2 p-5 md:p-8 h-[450px]">
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
        <GlassCard className="p-5 md:p-8 flex flex-col">
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
                        if (e.key === 'Enter') handleQuickCostUpdate();
                        if (e.key === 'Escape') setEditingProductId(null);
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
                      <p className="text-[10px] font-black text-gray-900 uppercase truncate tracking-tight group-hover/item:text-indigo-600 transition-colors whitespace-nowrap">{item.name}</p>
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
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
                  <Check size={18} />
                </div>
                <p className="text-xs font-black text-gray-900 uppercase">Sin Fugas de Información</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Márgenes 100% calculados</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Row 2: Pareto Distribution Curve & Growth Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 p-5 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Curva de Concentración (Pareto 80/20)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{paretoType === 'revenue' ? 'Distribución por Ingresos ($)' : 'Distribución por Carga de Cocina (Cant.)'}</p>
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

        <GlassCard className="p-5 md:p-8">
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
        <GlassCard className="lg:col-span-2 p-5 md:p-8">
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
                  <RechartsTooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} content={<VisionTooltip units="Valor" />} />
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

        <GlassCard className="p-5 md:p-8">
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

      {/* Audit Tables */}
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
                {leakageAudit?.cancellations?.length > 0 ? leakageAudit.cancellations.slice(0, 5).map((c, i) => (
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
                {leakageAudit?.discounts?.length > 0 ? leakageAudit.discounts.slice(0, 5).map((d, i) => (
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
}
