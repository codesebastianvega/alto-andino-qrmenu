import {
  Flame,
  QrCode,
  ArrowUpRight,
  RefreshCw,
  PlayCircle,
  ShoppingBag,
  Globe,
} from 'lucide-react';

export default function HeatmapsHeader({
  onRefresh,
  isRefreshing,
  handleRefreshData,
  showQrDrawer,
  onToggleQrDrawer,
  clarityBaseUrl,
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
            <Flame className="w-5 h-5 fill-amber-500/30" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 tracking-tight">
                Comportamiento Visual & Analítica Real
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Activo
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Datos reales del menú: tiempo exacto, dispositivos, carritos y grabaciones de clientes.
            </p>
          </div>
        </div>

        {/* Botones de acción superior */}
        <div className="flex items-center gap-2 flex-wrap">
          {typeof onRefresh === 'function' && (
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Recargar métricas con los últimos eventos"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Actualizando...' : 'Recargar en Vivo'}</span>
            </button>
          )}
          <button
            onClick={onToggleQrDrawer}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-gray-600" />
            <span>{showQrDrawer ? 'Ocultar Creador' : 'Crear Campaña / QR'}</span>
          </button>
          <a
            href="#admin"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '#admin';
              const tablesBtn = document.querySelector('[data-page-id="tables"]');
              if (tablesBtn) tablesBtn.click();
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all"
          >
            <span>Ir a Mesas y QRs</span>
            <ArrowUpRight className="w-3 h-3 text-gray-400" />
          </a>
        </div>
      </div>

      {/* Botones de Acceso Rápido a Clarity */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-gray-100">
        <a
          href={`${clarityBaseUrl}/heatmaps`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/20 transition-all text-xs font-bold group"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mapas de Calor</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </a>

        <a
          href={`${clarityBaseUrl}/recordings`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-900 border border-indigo-500/20 transition-all text-xs font-bold group"
        >
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Grabaciones (Video)</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
        </a>

        <a
          href={`${clarityBaseUrl}/recordings`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-900 border border-rose-500/20 transition-all text-xs font-bold group"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Carritos Abandonados</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
        </a>

        <a
          href={`${clarityBaseUrl}/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 transition-all text-xs font-bold group"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-600 shrink-0" />
            <span>Consola Clarity</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
