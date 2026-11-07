import { ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from '../../../Toast';

export default function TrafficExclusionCard({
  baseUrl,
  brandSlug,
  isClearing,
  handleClearTestAnalytics,
}) {
  const excludeUrl = `${baseUrl}/${brandSlug}/?exclude_me=true`;

  return (
    <div className="rounded-2xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
              Filtro de Tráfico Interno (Tus Dispositivos y Personal)
            </h3>
            <p className="text-[11px] text-gray-400">
              Evita que tus propias visitas, la tablet del restaurante o tu celular alteren las
              métricas reales.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearTestAnalytics}
          disabled={isClearing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isClearing ? 'Limpiando...' : 'Resetear Visitas de Prueba a 0'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-700">🖥️ Este Computador / Navegador:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Excluido Automáticamente ✅
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Al estar dentro del panel de administración, este navegador quedó marcado para siempre
            como equipo interno. Ya no sumará visitas cuando abras el menú ni te grabará en Clarity.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 space-y-2">
          <span className="font-bold text-gray-700">
            📱 Tu Celular Personal o Tablet del Restaurante:
          </span>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Abre el menú una sola vez desde ese dispositivo con este enlace para excluirlo
            permanentemente:
          </p>
          <div className="flex items-center gap-2">
            <code className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-gray-200 text-indigo-700 flex-1 truncate">
              {excludeUrl}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(excludeUrl);
                toast.success('Enlace de exclusión copiado al portapapeles');
              }}
              className="px-2 py-1 bg-white border border-gray-200 rounded text-[11px] font-bold hover:bg-gray-100 shrink-0"
            >
              Copiar Enlace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
