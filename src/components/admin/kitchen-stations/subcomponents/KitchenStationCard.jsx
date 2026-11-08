import React from 'react';
import { Icon } from '@iconify-icon/react';
import { ACCENT_COLORS } from '../stationTemplates';

export default function KitchenStationCard({
  zone,
  originalIndex,
  totalZones,
  onMoveZone,
  onEditZone,
  onDeleteZone,
  onNewItem,
  onEditItem,
  onDeleteItem
}) {
  const colorObj = ACCENT_COLORS.find(c => c.id === zone.accentColor) || ACCENT_COLORS[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:border-slate-300 transition-all relative group">
      {/* Header de la Zona */}
      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${colorObj.bg}`}>
            <Icon icon={zone.icon || 'heroicons:squares-plus'} className="text-xl" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 tracking-tight">{zone.title}</h4>
            <p className="text-xs text-slate-500 font-normal mt-0.5">{zone.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            {/* Botones de Orden */}
            <button
              type="button"
              onClick={() => onMoveZone(originalIndex, -1)}
              disabled={originalIndex === 0}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Mover arriba"
            >
              <Icon icon="heroicons:chevron-up" className="text-xs" />
            </button>
            <button
              type="button"
              onClick={() => onMoveZone(originalIndex, 1)}
              disabled={originalIndex === totalZones - 1}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Mover abajo"
            >
              <Icon icon="heroicons:chevron-down" className="text-xs" />
            </button>
            {/* Editar Estación */}
            <button
              type="button"
              onClick={() => onEditZone(originalIndex)}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
              title="Editar datos de estación"
            >
              <Icon icon="heroicons:pencil-square" className="text-sm" />
            </button>
            {/* Eliminar Estación */}
            <button
              type="button"
              onClick={() => onDeleteZone(originalIndex)}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              title="Eliminar estación"
            >
              <Icon icon="heroicons:trash" className="text-sm" />
            </button>
          </div>

          <div className="text-right">
            <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono">
              {zone.temp}
            </span>
            <p className="text-[11px] font-bold text-indigo-600 mt-0.5">{zone.badge}</p>
          </div>
        </div>
      </div>

      {zone.description && (
        <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
          {zone.description}
        </p>
      )}

      {/* Lista de Insumos y Equipos en la Zona */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Contenido & Disposición ({zone.items?.length || 0})
          </p>
          <button
            type="button"
            onClick={() => onNewItem(zone.id)}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
          >
            <Icon icon="heroicons:plus" className="text-xs" />
            <span>Agregar Elemento</span>
          </button>
        </div>

        {(zone.items || []).length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-medium">
            No hay equipos o insumos en esta estación aún.
          </div>
        ) : (
          zone.items.map((item, itemIdx) => (
            <div
              key={itemIdx}
              className="p-3 rounded-lg border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-start gap-3 group/item"
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  item.critical
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon icon={item.icon || 'heroicons:scale'} className="text-base" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 group-hover/item:text-indigo-600 transition-colors">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1">
                    {item.critical && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        Crítico
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditItem(zone.id, itemIdx)}
                      className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity cursor-pointer"
                      title="Editar elemento"
                    >
                      <Icon icon="heroicons:pencil-square" className="text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(zone.id, itemIdx)}
                      className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                      title="Eliminar elemento"
                    >
                      <Icon icon="heroicons:trash" className="text-xs" />
                    </button>
                  </div>
                </div>
                {item.location && (
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-indigo-600">
                    <Icon icon="heroicons:map-pin" className="text-xs" />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.purpose && (
                  <p className="text-xs text-slate-500 mt-1 leading-normal font-normal">
                    {item.purpose}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
