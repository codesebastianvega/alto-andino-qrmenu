import React from 'react';
import { QRCode } from 'react-qr-code';
import { Modal, ModalHeader, FormField, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../ui';
import { Edit3, QrCode, MapPin, ExternalLink } from 'lucide-react';

export default function TableFormModal({
  isFormOpen,
  setIsFormOpen,
  editingTable,
  modalTab,
  setModalTab,
  tableForm,
  setTableForm,
  isSubmittingTable,
  handleSaveTable,
  isAllLocations,
  locations = [],
  areas = [],
  getTableUrl,
  handleDownloadQr,
  handleCopyUrl
}) {
  if (!isFormOpen) return null;

  return (
    <Modal onClose={() => setIsFormOpen(false)}>
      <ModalHeader 
        title={editingTable ? `Gestionar Mesa — ${editingTable.table_number}` : 'Nueva Mesa'} 
        subtitle={editingTable ? 'Edita la configuración o descarga el código QR de esta mesa.' : 'Identifica la mesa para luego vincularla a un código QR.'}
        onClose={() => setIsFormOpen(false)} 
      />

      {/* Tabs — solo visibles en modo edición */}
      {editingTable && (
        <div className="flex px-7 gap-1 border-b border-gray-100 bg-gray-50/50">
          {[
            { id: 'datos', label: 'Datos', icon: <Edit3 size={14} /> },
            { id: 'qr', label: 'QR & Enlace', icon: <QrCode size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setModalTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                modalTab === tab.id 
                  ? 'border-[#2f4131] text-[#2f4131]' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab: Datos */}
      {(modalTab === 'datos' || !editingTable) && (
        <form onSubmit={handleSaveTable} className="p-7 space-y-6">
          <div className="space-y-4">
            <FormField>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Identificador de Mesa</label>
              <TextInput
                value={tableForm.table_number}
                onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                placeholder="Ej. Mesa 1, Sala Principal, VIP..."
                required
              />
            </FormField>

            {isAllLocations && !editingTable && locations.length > 1 && (
              <FormField label="Sede">
                <SelectInput
                  value={tableForm.location_id || ''}
                  onChange={(e) => setTableForm({ ...tableForm, location_id: e.target.value, area_id: '' })}
                  required
                >
                  <option value="" disabled>Seleccionar Sede...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </SelectInput>
              </FormField>
            )}

            <FormField label="Salón / Entorno">
              <SelectInput
                value={tableForm.area_id}
                onChange={(e) => setTableForm({ ...tableForm, area_id: e.target.value })}
              >
                <option value="">Sin salón específico</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name} {isAllLocations && area.locations?.name ? `(${area.locations.name})` : ''}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <div className="flex gap-3 pt-2">
            <div className="flex-1">
              <SecondaryButton 
                onClick={() => setIsFormOpen(false)}
                className="w-full justify-center"
              >
                Cancelar
              </SecondaryButton>
            </div>
            <div className="flex-1">
              <PrimaryButton 
                type="submit" 
                disabled={isSubmittingTable}
                className="w-full justify-center"
              >
                {isSubmittingTable ? 'Guardando...' : editingTable ? 'Guardar Cambios' : 'Crear Mesa'}
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}

      {/* Tab: QR & Enlace */}
      {modalTab === 'qr' && editingTable && (
        <div className="p-7 flex flex-col items-center justify-center space-y-6">
          {/* Sede info */}
          {editingTable.locations?.name && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <MapPin size={12} />
              {editingTable.locations.name}
            </div>
          )}

          {/* QR Code */}
          <div className="bg-white p-5 rounded-2xl shadow-lg shadow-gray-100 border border-gray-100">
            <QRCode 
              id={`qr-code-${editingTable.id}`}
              value={getTableUrl(editingTable)} 
              size={220}
              level="H"
              className="w-full h-auto"
            />
          </div>

          {/* URL preview */}
          <div className="w-full max-w-sm bg-gray-50 rounded-xl border border-gray-100 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Enlace del Menú</p>
            <p className="text-[11px] font-mono text-gray-600 break-all leading-relaxed select-all">{getTableUrl(editingTable)}</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {/* Ver Menú — abre en nueva pestaña */}
            <a 
              href={getTableUrl(editingTable)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full px-6 py-3.5 bg-[#2f4131] text-white rounded-xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-[#2f4131]/20 hover:bg-[#3d5440] hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              <ExternalLink size={16} />
              Ver Menú
            </a>

            <div className="flex gap-3">
              <PrimaryButton onClick={handleDownloadQr} className="flex-1 justify-center text-[11px]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar QR
              </PrimaryButton>
              <SecondaryButton onClick={() => handleCopyUrl(editingTable)} className="flex-1 justify-center text-[11px]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copiar URL
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
