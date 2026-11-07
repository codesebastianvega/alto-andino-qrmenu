import { Icon } from '@iconify-icon/react';
import { VEHICLES } from '../../../hooks/delivery/useAdminDeliveryDriversData';

export default function DriverFormModal({
  isOpen,
  onClose,
  editingDriver,
  formData,
  setFormData,
  onSubmit,
  saving
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-zoomIn">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
              🛵
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">
                {editingDriver ? 'Editar Domiciliario' : 'Registrar Nuevo Domiciliario'}
              </h3>
              <span className="text-xs text-gray-400">Datos para asignación y envío de pedidos</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon icon="solar:close-circle-bold" className="text-2xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Gonzalo Repartidor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-gray-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
              Celular / WhatsApp *
            </label>
            <input
              type="tel"
              required
              placeholder="Ej: 3001234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-gray-900 transition-colors"
            />
            <span className="text-[10px] text-gray-400 block mt-1">
              Indispensable para enviarle la comanda y enlace de entrega por WhatsApp con 1 clic.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                Vehículo
              </label>
              <select
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none bg-white"
              >
                {VEHICLES.map(v => (
                  <option key={v.id} value={v.id}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                Placa (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: ABC-12D"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-gray-900 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
              Notas / Observaciones
            </label>
            <input
              type="text"
              placeholder="Ej: Turno de 11am a 4pm, mensajería de confianza"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="driver_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="driver_active" className="text-xs font-bold text-gray-700 select-none cursor-pointer">
              Activo para recibir domicilios
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingDriver ? 'Actualizar Domiciliario' : 'Guardar Domiciliario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
