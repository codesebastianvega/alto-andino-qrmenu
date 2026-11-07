import {
  History,
  MapPin,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import LumiEmblem from '../components/LumiEmblem';

export default function AlunaCopilotHeader({
  titleId,
  isExpanded,
  onToggleExpand,
  onOpenChanges,
  onClose,
  brandName,
  locationName,
  planQuota,
  aiUsage,
}) {
  return (
    <header className="border-b border-gray-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#173D24] to-[#0D2616] text-white shadow-md shadow-emerald-950/20">
            <LumiEmblem size={24} className="text-emerald-300" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 id={titleId} className="font-bold text-gray-950 text-base">
                Lumi
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Copiloto Aluna
              </span>
            </div>
            <p className="text-xs text-gray-500">Tu asistente de apertura y operaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
            title={isExpanded ? 'Reducir a panel lateral' : 'Pantalla completa / Modo Enfoque'}
            aria-label={isExpanded ? 'Reducir a panel lateral' : 'Pantalla completa / Modo Enfoque'}
          >
            {isExpanded ? (
              <Minimize2 size={19} aria-hidden="true" />
            ) : (
              <Maximize2 size={19} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpenChanges}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Ver historial de cambios"
          >
            <History size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar panel"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800">
          <ShieldCheck size={13} aria-hidden="true" /> {brandName}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
          <MapPin size={13} aria-hidden="true" /> {locationName}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 font-semibold text-violet-800 border border-violet-100/80">
          <Sparkles size={12} className="text-violet-600" aria-hidden="true" />
          <span>
            Plan {planQuota.label}: {Math.max(planQuota.monthly_limit - aiUsage, 0)} consultas disp.
          </span>
        </span>
      </div>
    </header>
  );
}
