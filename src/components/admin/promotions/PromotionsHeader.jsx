import { Icon } from '@iconify-icon/react';

export default function PromotionsHeader({
  activeCount,
  promotions,
  onOpenCouponModal,
  onOpenNewPromoModal
}) {
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl font-bold border border-amber-500/20 shadow-xs">
              🏷️
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Campañas & Descuentos
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 font-medium">
                Crea promociones estilo Rappi Ads: domicilio gratis, descuentos porcentuales y cupones de lanzamiento.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenCouponModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Icon icon="solar:ticket-sale-bold" className="text-lg" />
            <span>Crear Cupón de Carrito</span>
          </button>
          <button
            onClick={onOpenNewPromoModal}
            className="px-4 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Icon icon="heroicons:plus-circle" className="text-lg" />
            <span>Nueva Campaña</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Campañas Activas</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
            <span className="text-xs text-neutral-500">en vivo</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Domicilio Gratis</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-sm font-black px-2 py-0.5 rounded-full ${
              promotions.some(p => p.is_active && p.type === 'free_delivery')
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-neutral-100 text-neutral-600'
            }`}>
              {promotions.some(p => p.is_active && p.type === 'free_delivery') ? 'ACTIVO' : 'PAUSADO'}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Banner en Menú</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-sm font-black px-2 py-0.5 rounded-full ${
              promotions.some(p => p.is_active && p.show_banner)
                ? 'bg-blue-100 text-blue-800'
                : 'bg-neutral-100 text-neutral-600'
            }`}>
              {promotions.some(p => p.is_active && p.show_banner) ? 'VISIBLE' : 'OCULTO'}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Histórico</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-neutral-800">{promotions.length}</span>
            <span className="text-xs text-neutral-500">campañas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
