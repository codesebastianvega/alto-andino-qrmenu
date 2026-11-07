export default function KitchenBatchView({ batchOrders, isDark }) {
  if (batchOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <p className="text-sm font-medium">No hay productos agrupados en este momento</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {batchOrders.map((batch, idx) => (
        <div 
          key={idx} 
          className={`rounded-xl p-3 flex flex-col justify-between border ${
            isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className={`text-sm font-bold uppercase leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {batch.name}
              </p>
              <span className={`w-8 h-8 rounded-lg font-mono text-base font-black flex items-center justify-center shrink-0 border ${
                isDark 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {batch.totalQuantity}
              </span>
            </div>

            {batch.modifiers && Object.keys(batch.modifiers).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {Object.values(batch.modifiers).map((mod, i) => (
                  <span key={i} className={`text-[10px] font-medium ${isDark ? 'text-amber-300' : 'text-slate-600'}`}>
                    • {mod}
                  </span>
                ))}
              </div>
            )}

            {batch.notes && (
              <p className="text-xs text-rose-500 italic mb-2">⚠️ {batch.notes}</p>
            )}
          </div>

          <div className={`pt-2 border-t flex items-center gap-1.5 flex-wrap ${
            isDark ? 'border-gray-800' : 'border-slate-100'
          }`}>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Mesas:</span>
            {batch.orders.map((ord, i) => (
              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                isDark ? 'bg-gray-800 text-gray-200' : 'bg-slate-100 text-slate-800'
              }`}>
                {ord}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
