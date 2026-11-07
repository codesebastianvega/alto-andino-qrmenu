import { TrendingUp, Trash2, QrCode } from 'lucide-react';
import { toast } from '../../../Toast';
import { CHANNEL_STYLES } from '../helpers/heatmapsHelpers';

export default function HeatmapsAttribution({
  channels = [],
  baseUrl,
  brandSlug,
  isClearing,
  handleClearTestAnalytics,
  onOpenTableModal,
  onSelectChannelForModal,
}) {
  return (
    <div className="lg:col-span-7 rounded-2xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
            Atribución: ¿De dónde vienen tus clientes?
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearTestAnalytics}
            disabled={isClearing}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 transition-all flex items-center gap-1 shrink-0 shadow-2xs"
            title="Reiniciar visitas de prueba a 0"
          >
            <Trash2 className="w-3 h-3" />
            <span>{isClearing ? 'Limpiando...' : 'Resetear a 0'}</span>
          </button>
          <span className="text-[10px] text-gray-400 font-bold hidden sm:inline">
            Por QR & Enlaces
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {channels.map((ch) => {
          const hasActivity = ch.visits > 0 || ch.orders > 0;
          const channelUrl = `${baseUrl}/${brandSlug}/?src=${encodeURIComponent(ch.key)}`;
          const style = CHANNEL_STYLES[ch.key] || CHANNEL_STYLES.default;
          const isMesas = ch.key === 'qr_mesa';

          return (
            <div
              key={ch.key}
              onClick={() => {
                if (isMesas) {
                  onOpenTableModal();
                } else {
                  onSelectChannelForModal(ch);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-2 relative overflow-hidden cursor-pointer hover:shadow-md ${
                hasActivity
                  ? `${style.bg} ${style.border} shadow-xs scale-[1.01]`
                  : 'bg-white/70 border-gray-200/70 opacity-80 hover:opacity-100 hover:bg-white'
              }`}
              title={
                isMesas
                  ? 'Haz clic para ver desglose por mesa'
                  : 'Haz clic para ver y descargar código QR'
              }
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  style.topBar || 'from-gray-200 to-gray-300'
                }`}
              />

              <div className="flex items-center justify-between gap-1 pt-0.5">
                <p
                  className={`text-[12px] font-bold truncate flex items-center gap-1.5 ${style.titleColor}`}
                  title={ch.name}
                >
                  <span className="text-sm shrink-0">{ch.icon || '🎯'}</span>
                  <span className="truncate">{ch.name}</span>
                </p>

                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isMesas ? (
                    <button
                      type="button"
                      onClick={onOpenTableModal}
                      className="text-[9px] font-black uppercase text-[#2f4131] bg-white/90 hover:bg-white px-2 py-0.5 rounded-md border border-[#2f4131]/20 transition-all cursor-pointer shadow-2xs"
                      title="Ver desglose por mesa individual"
                    >
                      Ver Mesas
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onSelectChannelForModal(ch)}
                        className="text-[9px] font-bold text-gray-700 hover:text-emerald-800 bg-white/90 hover:bg-white px-1.5 py-0.5 rounded-md border border-gray-200/70 transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-0.5"
                        title="Ver código QR y descargar"
                      >
                        <QrCode className="w-2.5 h-2.5" />
                        <span>QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(channelUrl);
                          toast.success(`Link de ${ch.name} copiado`);
                        }}
                        className="text-[9px] font-bold text-gray-500 hover:text-emerald-700 bg-white/80 hover:bg-white px-1.5 py-0.5 rounded-md border border-gray-200/60 transition-all shrink-0 cursor-pointer shadow-2xs"
                        title="Copiar enlace directo de este canal"
                      >
                        Copiar
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1.5 border-t border-black/5">
                <span className="text-xs font-black text-gray-900">
                  {ch.visits}{' '}
                  <span className="text-[10px] font-bold text-gray-500 font-normal">
                    {ch.visits === 1 ? 'visita' : 'visitas'}
                  </span>
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    ch.orders > 0 ? style.badgeActive : 'text-gray-400 bg-black/5'
                  }`}
                >
                  {ch.orders} {ch.orders === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400">
        Cada vez que imprimas un volante o pongas un link en Instagram, usa el enlace inteligente con{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">?src=...</code> para
        medir cuánta plata te generó.
      </p>
    </div>
  );
}
