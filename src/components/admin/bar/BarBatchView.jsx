export default function BarBatchView({ batchOrders, isDark }) {
  if (batchOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <p className="text-sm font-medium">No hay bebidas agrupadas en este momento</p>
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
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                  : 'bg-cyan-50 text-cyan-800 border-cyan-200'
              }`}>
                {batch.totalQuantity}
              </span>
            </div>

            {batch.modifiers && Object.keys(batch.modifiers).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {Object.values(batch.modifiers).map((mod, i) => (
                  <span key={i} className={`text-[10px] font-medium ${isDark ? 'text-cyan-300' : 'text-slate-600'}`}>
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
