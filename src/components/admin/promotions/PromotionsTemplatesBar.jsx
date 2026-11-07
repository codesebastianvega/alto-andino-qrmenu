export default function PromotionsTemplatesBar({ onApplyTemplate }) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-emerald-50/40 to-neutral-50 p-5 rounded-2xl border border-amber-200/60 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h2 className="text-sm font-black text-neutral-800 uppercase tracking-wider">
            Plantillas Rápidas (1 Clic)
          </h2>
        </div>
        <span className="text-xs text-neutral-500 hidden sm:inline">Configuración pre-armada lista para encender</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => onApplyTemplate('free_delivery_opening')}
          className="p-3.5 bg-white hover:bg-emerald-50/60 border border-neutral-200/80 hover:border-emerald-300 rounded-xl text-left transition-all active:scale-95 group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xl">🚚</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Apertura
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-800 group-hover:text-emerald-700 leading-tight">
            Semana Domicilio Gratis
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            $0 COP en envíos toda la semana de lanzamiento.
          </p>
        </button>

        <button
          onClick={() => onApplyTemplate('ten_percent_store')}
          className="p-3.5 bg-white hover:bg-blue-50/60 border border-neutral-200/80 hover:border-blue-300 rounded-xl text-left transition-all active:scale-95 group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xl">🏷️</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
              10% OFF
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-800 group-hover:text-blue-700 leading-tight">
            Toda la Tienda
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Descuento global para incentivar primeros pedidos.
          </p>
        </button>

        <button
          onClick={() => onApplyTemplate('category_discount')}
          className="p-3.5 bg-white hover:bg-purple-50/60 border border-neutral-200/80 hover:border-purple-300 rounded-xl text-left transition-all active:scale-95 group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xl">🍱</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
              Categoría
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-800 group-hover:text-purple-700 leading-tight">
            20% en Categoría
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Rotación rápida de Bentos, Bowls o Rolls.
          </p>
        </button>

        <button
          onClick={() => onApplyTemplate('social_coupon')}
          className="p-3.5 bg-white hover:bg-amber-50/60 border border-neutral-200/80 hover:border-amber-300 rounded-xl text-left transition-all active:scale-95 group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xl">🎟️</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              Cupón
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-800 group-hover:text-amber-700 leading-tight">
            Cupón Redes (BOKU15)
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Código para compartir en historias de Instagram/TikTok.
          </p>
        </button>
      </div>
    </div>
  );
}
