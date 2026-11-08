import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function KitchenStationBanner({
  activeBrand,
  zones,
  activeZone,
  setActiveZone,
  hasChanges,
  isSaving,
  openNewZoneModal,
  handleSaveToDatabase,
  handleResetToTemplate
}) {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm relative overflow-hidden border border-slate-800">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5">
              <Icon icon="heroicons:map-pin" className="text-xs" />
              Mapeo de Cocina {activeBrand?.name ? `• ${activeBrand.name}` : ''}
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-xs font-semibold">
              Layout 100% Personalizable
            </span>
            {hasChanges && (
              <span className="bg-amber-500 text-slate-900 px-2.5 py-0.5 rounded-md text-xs font-bold animate-pulse">
                ⚠️ Cambios sin guardar
              </span>
            )}
          </div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1.5">
            Layout Visual de Estaciones, Neveras y Mesón
          </h3>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
            Organiza la ubicación fija de cada equipo, insumo y herramienta en tu cocina.
            Personaliza las zonas según el espacio físico de tu local para agilizar los tiempos y evitar la contaminación cruzada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={openNewZoneModal}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Icon icon="heroicons:plus" className="text-sm" />
            <span>Nueva Estación</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <Icon icon={isSaving ? "heroicons:arrow-path" : "heroicons:check"} className={`text-sm ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToTemplate}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            title="Restaurar plantilla sugerida"
          >
            <Icon icon="heroicons:arrow-path" className="text-xs" />
            <span className="hidden sm:inline">Plantilla Base</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Estaciones */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveZone('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeZone === 'all'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'bg-white/10 text-slate-300 hover:bg-white/20'
          }`}
        >
          Todas ({zones.length})
        </button>
        {zones.map(z => (
          <button
            key={z.id}
            type="button"
            onClick={() => setActiveZone(z.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeZone === z.id
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Icon icon={z.icon || 'heroicons:squares-plus'} className="text-sm" />
            <span>{z.title.split(':')[0]}</span>
            <span className="text-[10px] opacity-80">({z.items?.length || 0})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
