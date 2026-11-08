import React from 'react';
import { Icon } from '@iconify-icon/react';
import Portal from '../../../Portal';
import { ACCENT_COLORS, ICON_OPTIONS } from '../stationTemplates';

export default function KitchenZoneModal({
  open,
  onClose,
  editingZoneIndex,
  zoneFormData,
  setZoneFormData,
  onSaveZone
}) {
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {editingZoneIndex !== null ? 'Editar Estación de Cocina' : 'Nueva Estación de Cocina'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            >
              <Icon icon="heroicons:x-mark" className="text-lg" />
            </button>
          </div>

          <form onSubmit={onSaveZone} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre / Título de la Estación *</label>
              <input
                type="text"
                required
                placeholder="Ej. Plancha & Freidora, Mesón de Ensamble, Barra..."
                value={zoneFormData.title}
                onChange={e => setZoneFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo / Área</label>
              <input
                type="text"
                placeholder="Ej. Zona Central - Despacho, Zona Caliente..."
                value={zoneFormData.subtitle}
                onChange={e => setZoneFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temperatura / Clima</label>
                <input
                  type="text"
                  placeholder="Ej. 2°C a 4°C, Ambiente (20°C)"
                  value={zoneFormData.temp}
                  onChange={e => setZoneFormData(prev => ({ ...prev, temp: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Etiqueta / Badge</label>
                <input
                  type="text"
                  placeholder="Ej. Estación Crítica, Cadena de Frío"
                  value={zoneFormData.badge}
                  onChange={e => setZoneFormData(prev => ({ ...prev, badge: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Color Distintivo</label>
                <select
                  value={zoneFormData.accentColor}
                  onChange={e => setZoneFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {ACCENT_COLORS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Icono</label>
                <select
                  value={zoneFormData.icon}
                  onChange={e => setZoneFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {ICON_OPTIONS.map(ic => (
                    <option key={ic.id} value={ic.id}>{ic.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Regla Operativa</label>
              <textarea
                rows={3}
                placeholder="Describe el propósito de esta estación y las reglas de higiene o ensamble..."
                value={zoneFormData.description}
                onChange={e => setZoneFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {editingZoneIndex !== null ? 'Guardar Cambios' : 'Crear Estación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
