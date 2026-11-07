import React from 'react';
import { Building2, MapPin, Phone, ExternalLink, Trash2, QrCode } from 'lucide-react';
import { Icon } from '@iconify/react';

export default function SedesListGrid({
  locations = [],
  handleOpenModal,
  setQrLocation,
  handleDelete
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {locations.map((loc) => (
        <div 
          key={loc.id} 
          className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
            loc.is_main ? 'border-indigo-200/80 ring-1 ring-indigo-500/10' : 'border-gray-200/80 hover:border-gray-300'
          } ${!loc.is_active ? 'opacity-60 bg-gray-50/50' : ''}`}
        >
          {/* Card Header */}
          <div className="p-5 pb-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  loc.is_main ? 'bg-gray-900 text-white shadow-xs' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}>
                  <Building2 size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-gray-900 truncate tracking-tight">{loc.name}</h4>
                    {loc.is_main && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold uppercase tracking-wider">
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">Sede operativa</p>
                </div>
              </div>

              {/* Status Indicator */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border ${
                loc.is_active 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' 
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${loc.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {loc.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            {/* Information Rows */}
            <div className="space-y-2 pt-1">
              {/* Address */}
              <div className="flex items-center gap-2.5 text-xs text-gray-600 bg-gray-50/70 px-3 py-2 rounded-xl border border-gray-100">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <span className="truncate font-medium">{loc.address || 'Sin dirección física registrada'}</span>
              </div>

              {/* Phone & WhatsApp Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {loc.phone ? (
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100 truncate">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">{loc.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 bg-gray-50/30 px-3 py-1.5 rounded-xl border border-gray-100 text-[11px]">
                    <Phone size={13} className="shrink-0 opacity-40" />
                    <span>Sin teléfono fijo</span>
                  </div>
                )}

                {loc.whatsapp ? (
                  <a 
                    href={`https://wa.me/${loc.whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/60 px-3 py-1.5 rounded-xl border border-emerald-100 truncate transition-colors cursor-pointer"
                    title="Chatear por WhatsApp"
                  >
                    <Icon icon="logos:whatsapp-icon" className="text-xs shrink-0" />
                    <span className="font-mono text-[11px] font-semibold truncate">{loc.whatsapp}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 bg-gray-50/30 px-3 py-1.5 rounded-xl border border-gray-100 text-[11px]">
                    <Icon icon="solar:whatsapp-bold" className="text-xs shrink-0 opacity-40" />
                    <span>Sin WhatsApp</span>
                  </div>
                )}
              </div>

              {/* Delivery & Operational Badges */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-2.5 py-0.5 rounded-lg">
                  <Icon icon="solar:map-point-wave-bold" className="text-xs" />
                  Radio: {loc.delivery_radius_km || 5} km
                </span>
                {Array.isArray(loc.operational_modes) && loc.operational_modes.includes('delivery') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-2 py-0.5 rounded-lg">
                    🛵 Domicilio
                  </span>
                )}
                {Array.isArray(loc.operational_modes) && loc.operational_modes.includes('takeaway') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100/80 px-2 py-0.5 rounded-lg">
                    🛍️ Retiro
                  </span>
                )}
                {Array.isArray(loc.operational_modes) && loc.operational_modes.includes('dine_in') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100/80 px-2 py-0.5 rounded-lg">
                    🍽️ Mesa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card Action Footer */}
          <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
            <button 
              type="button"
              onClick={() => handleOpenModal(loc)} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
            >
              <Icon icon="solar:pen-new-square-linear" className="text-sm" />
              <span>Editar</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => setQrLocation(loc)} 
                className="p-1.5 rounded-lg bg-white hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
                title="Código QR de la sede"
              >
                <QrCode size={15} />
              </button>

              {loc.maps_url && (
                <a 
                  href={loc.maps_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
                  title="Abrir en Google Maps"
                >
                  <ExternalLink size={15} />
                </a>
              )}

              <button 
                type="button"
                onClick={() => handleDelete(loc.id)} 
                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
                title="Eliminar sede"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {locations.length === 0 && (
        <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mb-4 border border-gray-200">
            <Icon icon="solar:shop-2-bold" className="text-2xl" />
          </div>
          <h4 className="text-base font-bold text-gray-900 tracking-tight">No hay sedes registradas</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">Registra la ubicación física de tu primer punto de venta para coordinar inventarios y domicilios.</p>
          <button 
            type="button"
            onClick={() => handleOpenModal()} 
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Icon icon="solar:add-circle-bold" className="text-base" />
            <span>Crear Sede Principal</span>
          </button>
        </div>
      )}
    </div>
  );
}
