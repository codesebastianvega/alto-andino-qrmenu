import { Icon } from '@iconify-icon/react';
import { Sparkles } from 'lucide-react';

export function InsumosKpis({
  ingredientsCount = 0,
  outOfStockCount = 0,
  lowStockCount = 0,
  totalInventoryValue = 0,
  zeroCostCount = 0,
  zeroWasteCount = 0,
  showZeroOnly = false,
  showZeroWasteOnly = false,
  onSelectTotal,
  onSelectStockAlerts,
  onSelectHighValue,
  onToggleZeroCost,
  onToggleZeroWaste
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* Total Insumos */}
      <div
        className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        onClick={onSelectTotal}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Insumos Activos</span>
          <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center text-base group-hover:bg-slate-200/70 transition-colors">
            <Icon icon="heroicons:archive-box" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <h4 className="text-2xl font-black text-slate-900 tracking-tight">{ingredientsCount}</h4>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            <Icon icon="heroicons:arrow-trending-up" className="text-xs" />
            Sincronizado
          </span>
        </div>
      </div>

      {/* Alertas Stock */}
      <div
        className={`p-4 rounded-xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
          outOfStockCount > 0
            ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
            : lowStockCount > 0
              ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
        }`}
        onClick={onSelectStockAlerts}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alertas de Stock</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
            outOfStockCount > 0
              ? 'bg-rose-100 text-rose-700'
              : lowStockCount > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-50 text-emerald-700'
          }`}>
            <Icon icon={outOfStockCount > 0 ? "heroicons:exclamation-triangle" : lowStockCount > 0 ? "heroicons:clock" : "heroicons:check-badge"} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <h4 className={`text-2xl font-black tracking-tight ${
            outOfStockCount > 0 ? 'text-rose-600' : lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>
            {outOfStockCount + lowStockCount}
          </h4>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
            outOfStockCount > 0
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : lowStockCount > 0
                ? 'text-amber-800 bg-amber-50 border-amber-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-100'
          }`}>
            {outOfStockCount > 0 ? `${outOfStockCount} agotado${outOfStockCount === 1 ? '' : 's'}` : lowStockCount > 0 ? `${lowStockCount} por reponer` : 'Niveles óptimos'}
          </span>
        </div>
      </div>

      {/* Valor Inventario */}
      <div
        className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        onClick={onSelectHighValue}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Valorado</span>
          <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center text-base group-hover:bg-blue-100/70 transition-colors">
            <Icon icon="heroicons:currency-dollar" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <h4 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
            ${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h4>
          <span className="text-[11px] font-medium text-slate-400">En almacén</span>
        </div>
      </div>

      {/* Sin Costo */}
      <div
        className={`p-4 rounded-xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
          zeroCostCount > 0
            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
            : 'bg-white border-slate-200/90 hover:border-slate-300'
        }`}
        onClick={onToggleZeroCost}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sin Costo</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
            zeroCostCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <Icon icon="heroicons:no-symbol" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <h4 className={`text-2xl font-black tracking-tight ${zeroCostCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{zeroCostCount}</h4>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
            zeroCostCount > 0
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-slate-500 bg-slate-100 border-slate-200'
          }`}>
            {zeroCostCount > 0 ? 'Por fijar' : 'Completo'}
          </span>
        </div>
      </div>

      {/* IA Zero-Waste Card */}
      <div
        className={`p-4 rounded-xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
          showZeroWasteOnly
            ? 'bg-emerald-900 text-white border-emerald-800 ring-2 ring-emerald-500/30'
            : 'bg-gradient-to-br from-emerald-50/60 to-teal-50/30 border-emerald-200 hover:border-emerald-300'
        }`}
        onClick={onToggleZeroWaste}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${showZeroWasteOnly ? 'text-emerald-200' : 'text-emerald-800'}`}>
            IA Zero-Waste
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
            showZeroWasteOnly ? 'bg-white/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <Sparkles size={16} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <h4 className={`text-2xl font-black tracking-tight ${showZeroWasteOnly ? 'text-white' : 'text-emerald-950'}`}>
            {zeroWasteCount}
          </h4>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
            showZeroWasteOnly
              ? 'text-emerald-100 bg-emerald-800 border-emerald-700'
              : 'text-emerald-800 bg-emerald-100 border-emerald-200'
          }`}>
            {showZeroWasteOnly ? 'Filtrando' : 'Aprovechables'}
          </span>
        </div>
      </div>
    </div>
  );
}
