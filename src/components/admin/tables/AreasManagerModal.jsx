import React from 'react';
import { Modal, ModalHeader, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../ui';
import { MapPin } from 'lucide-react';

export default function AreasManagerModal({
  isAreaModalOpen,
  setIsAreaModalOpen,
  handleCreateArea,
  handleDeleteArea,
  newAreaName,
  setNewAreaName,
  isSubmittingArea,
  areas = [],
  isAllLocations = false,
  locations = [],
  tableForm,
  setTableForm
}) {
  if (!isAreaModalOpen) return null;

  return (
    <Modal onClose={() => setIsAreaModalOpen(false)}>
      <ModalHeader 
        title="Gestionar Salones / Áreas" 
        subtitle="Crea entornos para organizar tus mesas (ej. Terraza, VIP)."
        onClose={() => setIsAreaModalOpen(false)} 
      />
      <div className="p-7 space-y-6">
        <form onSubmit={handleCreateArea} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <TextInput 
                placeholder="Nuevo salón (ej. Terraza)"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
              />
            </div>
            <PrimaryButton type="submit" disabled={isSubmittingArea}>
              {isSubmittingArea ? '...' : 'Añadir'}
            </PrimaryButton>
          </div>
          
          {isAllLocations && locations.length > 1 && (
            <div className="px-1">
              <SelectInput
                value={tableForm?.location_id || ''}
                onChange={(e) => setTableForm && setTableForm({ ...tableForm, location_id: e.target.value })}
                className="text-[10px] font-bold h-9"
                required
              >
                <option value="" disabled>Sede para el salón...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </SelectInput>
            </div>
          )}
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {areas.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-4 italic">No hay salones creados.</p>
          ) : areas.map(area => (
            <div key={area.id} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{area.name}</span>
                <button 
                  onClick={() => handleDeleteArea(area.id)} 
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
              {isAllLocations && area.locations?.name && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <MapPin size={10} className="text-gray-300" />
                  {area.locations.name}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2">
          <SecondaryButton onClick={() => setIsAreaModalOpen(false)} className="w-full justify-center">
            Listo
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}
