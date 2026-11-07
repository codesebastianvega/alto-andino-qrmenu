import React from 'react';
import { createPortal } from 'react-dom';

export default function AnalyticsPrintReport({
  activeBrand,
  dateRange,
  biStats,
  formatCurrency,
  bcgData,
  leakageAudit
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div id="bi-report-root" className="print-report-container hidden print:flex flex-col bg-white min-h-screen p-16 text-gray-900 pointer-events-none fixed inset-0 z-[-1]">
      {/* Executive Branding */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Reporte Ejecutivo BI</h1>
          <p className="text-xl font-bold text-gray-400 uppercase mt-2 tracking-widest">{activeBrand?.name || 'Aluna'}</p>
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
        Intelligence Node /// Aluna Executive BI /// Confidencial
      </div>
    </div>,
    document.body
  );
}
