import React from 'react';
import { Icon } from '@iconify-icon/react';
import Portal from '../../../Portal';
import { ICON_OPTIONS } from '../stationTemplates';

export default function KitchenItemModal({
  open,
  onClose,
  editingItemIndex,
  itemFormData,
  setItemFormData,
  onSaveItem
}) {
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {editingItemIndex !== null ? 'Editar Elemento de Estación' : 'Agregar Elemento a la Estación'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            >
              <Icon icon="heroicons:x-mark" className="text-lg" />
            </button>
          </div>

          <form onSubmit={onSaveItem} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Equipo / Insumo *</label>
              <input
                type="text"
                required
                placeholder="Ej. Báscula Gramera, Inserto GN 1/3 Pollo, Biberón Sriracha..."
                value={itemFormData.name}
                onChange={e => setItemFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación Física Exacta</label>
              <input
                type="text"
                placeholder="Ej. Centro del mesón, Estante superior, Puerta nevera..."
                value={itemFormData.location}
                onChange={e => setItemFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Propósito / Protocolo de Uso</label>
              <textarea
                rows={2}
                placeholder="Instrucción estándar de gramaje, rotulado, fecha de vencimiento..."
                value={itemFormData.purpose}
                onChange={e => setItemFormData(prev => ({ ...prev, purpose: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Icono</label>
                <select
                  value={itemFormData.icon}
                  onChange={e => setItemFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {ICON_OPTIONS.map(ic => (
                    <option key={ic.id} value={ic.id}>{ic.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemFormData.critical}
                    onChange={e => setItemFormData(prev => ({ ...prev, critical: e.target.checked }))}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-rose-700">Elemento Crítico</span>
                </label>
              </div>
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
                {editingItemIndex !== null ? 'Guardar Cambios' : 'Agregar Elemento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
