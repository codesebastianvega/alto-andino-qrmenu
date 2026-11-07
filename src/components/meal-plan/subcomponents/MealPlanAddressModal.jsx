import React from 'react';
import Portal from '../../Portal';
import AddressInputWithMap from '../../delivery/AddressInputWithMap';
import { MapPin, X } from 'lucide-react';

export default function MealPlanAddressModal({
  open,
  onClose,
  activePlan,
  customAddr,
  setCustomAddr,
  customNotes,
  setCustomNotes,
  customCoords,
  setCustomCoords,
  currentLocation,
  onSaveLocation
}) {
  if (!open || !activePlan) return null;

  return (
    <Portal>
      <div
        data-clarity-unmask="true"
        className="fixed inset-0 z-[260] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2f4131]" />
                Punto Exacto de Entrega en el Mapa
              </h3>
              <p className="text-xs text-stone-500">
                Marca tu casa en el mapa para que el domiciliario llegue directo todos los días.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-100 text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSaveLocation} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Dirección y Punto en el Mapa (Toca &quot;GPS&quot; o &quot;Mapa&quot;)
              </label>
              <AddressInputWithMap
                value={customAddr}
                onChange={setCustomAddr}
                currentLocation={currentLocation}
                initialCoords={customCoords}
                onLocationSelect={locInfo => {
                  if (locInfo?.coords) {
                    setCustomCoords(locInfo.coords);
                  }
                }}
                placeholder="Ej: Paso Ancho, Calle 4 # 5-20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Indicaciones para el Domiciliario (Casa / Apto / Color de Portón)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={e => setCustomNotes(e.target.value)}
                placeholder="Ej: Casa segundo piso portón blanco, entregar 2:30 PM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold text-stone-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#233124] text-white font-black text-xs shadow-md cursor-pointer"
              >
                ✓ Guardar mi Punto Exacto
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
