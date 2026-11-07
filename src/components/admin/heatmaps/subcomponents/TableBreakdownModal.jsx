import { Table, X, ArrowUpRight } from 'lucide-react';

export default function TableBreakdownModal({
  show,
  onClose,
  tableBreakdown = [],
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2f4131]/10 text-[#2f4131] flex items-center justify-center">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                Rendimiento por Mesa / Activo
              </h3>
              <p className="text-[11px] text-gray-400">
                Escaneos, pedidos y facturación de cada punto físico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
          {tableBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Aún no hay visitas registradas por mesas en este período.
            </div>
          ) : (
            tableBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-xs font-black text-gray-700 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {item.visits} {item.visits === 1 ? 'escaneo' : 'escaneos'} • {item.conversion}% conv.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {item.orders} {item.orders === 1 ? 'pedido' : 'pedidos'}
                  </span>
                  {item.revenue > 0 && (
                    <p className="text-[10px] font-black text-gray-700 mt-0.5">
                      ${Number(item.revenue).toLocaleString('es-CO')} COP
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 flex justify-between items-center border-t border-gray-100">
          <span className="text-[11px] text-gray-400">Métricas en vivo de Supabase</span>
          <a
            href="/admin#admin?admin_page=tables"
            className="px-4 py-2 text-xs font-bold text-white bg-[#2f4131] hover:bg-[#253527] rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Ir a Gestión de Mesas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
