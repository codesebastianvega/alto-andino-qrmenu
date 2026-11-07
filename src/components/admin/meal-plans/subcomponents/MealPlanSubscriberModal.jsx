import React from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import { formatCOP } from '../../../../utils/money';
import AddressInputWithMap from '../../../delivery/AddressInputWithMap';

export default function MealPlanSubscriberModal({
  isOpen,
  onClose,
  isEditing = false,
  form,
  setForm,
  activeTiers = [],
  currentLocation = null,
  saving = false,
  onTemplateSelect,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              {isEditing
                ? 'Editar Tiquetera y Punto GPS de Entrega'
                : 'Crear Nueva Tiquetera de Suscriptor'}
            </h3>
            <p className="text-xs text-stone-500">
              Configura los créditos, el paquete y marca en el mapa el punto exacto para el domiciliario.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Datos del Suscriptor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                value={form.customer_name}
                onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Ej: Erika"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                WhatsApp / Celular *
              </label>
              <input
                type="text"
                required
                value={form.customer_phone}
                onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="Ej: 3125535583"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Código VIP
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder="Ej: ERIKA-BOKU"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Correo Google (Opcional)
              </label>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm((prev) => ({ ...prev, customer_email: e.target.value }))}
                placeholder="cliente@gmail.com"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Estado del Pago
              </label>
              <select
                value={form.payment_status}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_status: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
              >
                <option value="paid">✅ Pagado Completo</option>
                <option value="pending">⏳ Pendiente / Abono 50%</option>
              </select>
            </div>
          </div>

          {/* Selección de Plan y Créditos */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Paquete / Modalidad Elegida
              </label>
              <select
                value={form.template_id}
                onChange={(e) => onTemplateSelect(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-black bg-white text-stone-900"
              >
                {activeTiers.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.label} — {formatCOP(tpl.plan_price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                  Total Almuerzos
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.total_credits}
                  onChange={(e) => setForm((prev) => ({ ...prev, total_credits: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                  Valor Cubierto/Plato
                </label>
                <input
                  type="number"
                  value={form.bowl_value}
                  onChange={(e) => setForm((prev) => ({ ...prev, bowl_value: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                  Modalidad Envío
                </label>
                <select
                  value={form.includes_delivery ? 'yes' : 'no'}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      includes_delivery: e.target.value === 'yes',
                      delivery_fee: e.target.value === 'yes' ? 0 : 5000
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold"
                >
                  <option value="yes">Incluido ($0)</option>
                  <option value="no">Aparte ($5.000)</option>
                </select>
              </div>
            </div>

            <div className="pt-1 border-t border-stone-200/70">
              <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                Modalidad de Entrada / Sopa del Suscriptor
              </label>
              <select
                value={form.soup_preference || 'flexible'}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    soup_preference: val,
                    dietary_notes:
                      val === 'sin_sopa'
                        ? 'Sin sopa • 1 Base + 1 Proteína + 5 Verduras/Toppings + Semillas + Salsa'
                        : 'Con Sopa del Día o Fruta • 1 Base + 1 Proteína + 5 Toppings + Semillas + Salsa'
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-black text-stone-900"
              >
                <option value="flexible">
                  🥣 Flexible: Con Sopa del Día / Fruta o Solo Bowl (El cliente elige cada día)
                </option>
                <option value="con_sopa">
                  🍲 Almuerzo Completo (Siempre incluye Sopa del Día o Fruta)
                </option>
                <option value="sin_sopa">
                  🥗 Línea Fit Sin Sopa (Solo Bowl: Base + Proteína + 5 Verduras/Toppings)
                </option>
              </select>
            </div>
          </div>

          {/* Dirección con Mapa Interactivo y Pin Exacto */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-emerald-950 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Ubicación Exacta de Entrega (Pin en Mapa para el Domiciliario)
              </label>
            </div>

            <AddressInputWithMap
              value={form.default_address}
              onChange={(addr) => setForm((prev) => ({ ...prev, default_address: addr }))}
              currentLocation={currentLocation}
              initialCoords={form.default_coords}
              onLocationSelect={(locInfo) => {
                if (locInfo?.coords) {
                  setForm((prev) => ({
                    ...prev,
                    default_coords: locInfo.coords
                  }));
                }
              }}
              placeholder="Escribe el barrio/dirección o toca 'Mapa' para poner el pin exacto"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                  Detalles Casa / Apto / Referencia
                </label>
                <input
                  type="text"
                  value={form.default_delivery_notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, default_delivery_notes: e.target.value }))
                  }
                  placeholder="Ej: Casa portón blanco, timbre 2"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                  Hora Programada Diaria
                </label>
                <input
                  type="text"
                  value={form.default_time}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, default_time: e.target.value }))
                  }
                  placeholder="Ej: 2:30 PM"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Tiquetera y Ubicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
