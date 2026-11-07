import { Key, RefreshCw, ExternalLink } from 'lucide-react';

export default function ClarityApiCard({
  clarityToken,
  setClarityToken,
  lastSyncTime,
  isSyncingApi,
  handleSyncClarityApi,
  handleSaveToken,
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-neutral-900 text-white p-5 shadow-sm border border-gray-800 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-white/10 text-amber-400">
            <Key className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              API Oficial de Microsoft Clarity (Data Export API)
            </h4>
            <p className="text-[11px] text-gray-400">
              {lastSyncTime
                ? `Última sincronización: ${lastSyncTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Conecta tu token para traer países y métricas consolidadas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSyncClarityApi}
            disabled={isSyncingApi}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingApi ? 'animate-spin' : ''}`} />
            <span>{isSyncingApi ? 'Sincronizando...' : 'Sincronizar Insights'}</span>
          </button>
          <a
            href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-amber-300 hover:underline inline-flex items-center gap-1 font-bold"
          >
            <span>Doc API</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <input
          type="password"
          placeholder="Pega aquí tu API Token de Clarity (desde Configuración > Exportación de Datos)"
          value={clarityToken}
          onChange={(e) => setClarityToken(e.target.value)}
          className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-hidden focus:ring-1 focus:ring-amber-400"
        />
        <button
          onClick={handleSaveToken}
          className="px-4 py-2 rounded-xl bg-white text-gray-950 font-bold text-xs hover:bg-gray-100 transition-all shrink-0"
        >
          Guardar Token
        </button>
      </div>
      <p className="text-[10px] text-gray-400">
        Nota: Microsoft Clarity actualiza sus paquetes de insights cada pocas horas en su API de
        Exportación. Aluna guarda la respuesta para que no consumas tu cuota diaria
        innecesariamente.
      </p>
    </div>
  );
}
