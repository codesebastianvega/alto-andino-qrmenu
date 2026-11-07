import { Globe, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { getCountryFlag } from '../helpers/heatmapsHelpers';

export default function HeatmapsGeoSection({
  clarityApiInsights,
  lastSyncTime,
  handleSyncClarityApi,
  isSyncingApi,
}) {
  return (
    <div className="lg:col-span-5 rounded-2xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
            Países & Geografía (Detectados por IP)
          </h3>
        </div>
        {lastSyncTime && (
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <Check className="w-3 h-3" />
            Sincronizado
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {clarityApiInsights?.countries && clarityApiInsights.countries.length > 0 ? (
          clarityApiInsights.countries.map((item) => (
            <div
              key={item.country}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{getCountryFlag(item.country)}</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">{item.country}</p>
                  <p className="text-[10px] text-gray-400">{item.traffic} visitas oficiales</p>
                </div>
              </div>
              <span className="text-xs font-black text-gray-800">{item.traffic}</span>
            </div>
          ))
        ) : lastSyncTime ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
            <p className="text-xs font-bold flex items-center gap-1.5 text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              Conexión con Microsoft Clarity Verificada
            </p>
            <p className="text-[11px] text-emerald-800/80 leading-relaxed">
              Tu API Token está conectado correctamente. Microsoft Clarity procesa la geolocalización IP en lotes cada pocas horas para proyectos nuevos. En cuanto Microsoft complete el lote en Azure, los países aparecerán aquí con sus banderas.
            </p>
            <div className="flex items-center justify-between pt-1 text-[10px] text-emerald-700 font-bold">
              <span>Última consulta:</span>
              <span>
                {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-amber-900 space-y-2">
            <p className="text-xs font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Sincronización con Clarity
            </p>
            <p className="text-[11px] text-amber-800/80 leading-relaxed">
              Haz clic abajo para consultar a los servidores de Microsoft qué países han visitado tu menú.
            </p>
            <button
              onClick={handleSyncClarityApi}
              disabled={isSyncingApi}
              className="mt-1 w-full py-2 px-3 rounded-lg bg-[#2f4131] text-white text-xs font-bold hover:bg-[#253527] transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingApi ? 'animate-spin' : ''}`} />
              <span>{isSyncingApi ? 'Consultando a Microsoft...' : 'Sincronizar Países Ahora'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
