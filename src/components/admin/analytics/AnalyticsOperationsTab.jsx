import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Filter, Download, ExternalLink } from 'lucide-react';
import { GlassCard, DiffBadge } from './AnalyticsCommon';
import OperationsIntelligence from '../OperationsIntelligence';

export default function AnalyticsOperationsTab({
  data,
  formatCurrency,
  biStats,
  stats,
  bottleneckStats = [],
  dateRange,
  handleSmartExport
}) {
  return (
    <div className="space-y-8 animate-fadeUp">
      {/* Tactical Dashboard: Operations Intelligence */}
      <OperationsIntelligence data={data} formatCurrency={formatCurrency} />

      <div className="pt-8 border-t border-gray-100/50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">
          Log Operativo Maestro & KPIs Base
        </p>
      </div>

      {/* Operation Health Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <DiffBadge value={biStats.diffs?.avgTime} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiempo Prom. de Entrega</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-black text-gray-900">{Math.round(stats.avgTime || 0)}</h3>
            <span className="text-xs font-bold text-gray-400">minutos</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <DiffBadge value={biStats.diffs?.orders} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Órdenes Finalizadas</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.orderCount || 0}</h3>
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
}
