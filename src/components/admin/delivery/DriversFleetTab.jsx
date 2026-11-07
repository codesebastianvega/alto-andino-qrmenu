import { Icon } from '@iconify-icon/react';
import { VEHICLES } from '../../../hooks/delivery/useAdminDeliveryDriversData';
import { normalizeWhatsAppNumber } from '../../../utils/formatters';

export default function DriversFleetTab({
  loading,
  drivers,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteDriver,
  onToggleActive
}) {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="py-16 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
          <Icon icon="solar:refresh-bold" className="animate-spin text-lg" />
          <span>Cargando flota de repartidores...</span>
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-3xl">
            🛵
          </div>
          <h3 className="text-base font-black text-gray-800">No tienes domiciliarios registrados aún</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Registra a tus repartidores (con su número de WhatsApp) para poder despacharles pedidos con un solo clic y que ellos tengan la ruta en GPS y llamada rápida al cliente.
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Icon icon="solar:user-plus-bold" className="text-emerald-400" />
            <span>Registrar Primer Domiciliario</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map(driver => {
            const vehicle = VEHICLES.find(v => v.id === driver.vehicle) || VEHICLES[0];
            const cleanPhone = (driver.phone || '').replace(/\D/g, '');
            const waNumber = normalizeWhatsAppNumber(cleanPhone);

            return (
              <div
                key={driver.id}
                className={`bg-white rounded-3xl border p-5 shadow-2xs transition-all space-y-4 ${
                  driver.is_active ? 'border-gray-200/90' : 'border-gray-200/50 opacity-60 bg-gray-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-2xl shrink-0">
                      {vehicle.emoji}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-gray-900 truncate leading-snug">
                        {driver.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          {vehicle.label}
                        </span>
                        {driver.plate && (
                          <span className="text-[10px] font-black text-gray-700 uppercase bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-md">
                            {driver.plate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleActive(driver)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                      driver.is_active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                    title="Alternar estado activo/inactivo"
                  >
                    {driver.is_active ? '🟢 Activo' : '⚪ Libre'}
                  </button>
                </div>

                {/* Teléfono y WhatsApp */}
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:phone" className="text-gray-400 text-sm" />
                    <span className="font-bold text-gray-700">{driver.phone}</span>
                  </div>
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors shadow-2xs"
                      title="Chatear con el repartidor"
                    >
                      <Icon icon="logos:whatsapp-icon" className="text-xs" />
                      <span>Chat</span>
                    </a>
                  )}
                </div>

                {driver.notes && (
                  <p className="text-[11px] text-gray-500 italic px-1 line-clamp-2">
                    "{driver.notes}"
                  </p>
                )}

                {/* Acciones de Tarjeta */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(driver)}
                    className="text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Icon icon="solar:pen-bold" className="text-sm" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteDriver(driver.id, driver.name)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" className="text-sm" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
