import React from 'react';

export default function MealPlanTierModal({
  isOpen,
  onClose,
  isEditing = false,
  tierForm,
  setTierForm,
  saving = false,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-base font-black text-stone-900">
            {isEditing ? 'Editar Paquete / Plan' : 'Nuevo Paquete / Plan'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
              Nombre Completo del Plan *
            </label>
            <input
              type="text"
              required
              value={tierForm.label}
              onChange={(e) => setTierForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Ej: Plan Semanal Todo Incluido (5 Bowls + Domicilio)"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Nombre Corto
              </label>
              <input
                type="text"
                value={tierForm.short_label}
                onChange={(e) => setTierForm((prev) => ({ ...prev, short_label: e.target.value }))}
                placeholder="Ej: Semanal Todo Incluido (5)"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Cantidad de Almuerzos
              </label>
              <input
                type="number"
                min="1"
                value={tierForm.total_credits}
                onChange={(e) =>
                  setTierForm((prev) => ({ ...prev, total_credits: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Precio Total del Plan ($)
              </label>
              <input
                type="number"
                value={tierForm.plan_price}
                onChange={(e) => setTierForm((prev) => ({ ...prev, plan_price: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                Valor Cubierto/Plato ($)
              </label>
              <input
                type="number"
                value={tierForm.bowl_value}
                onChange={(e) => setTierForm((prev) => ({ ...prev, bowl_value: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                ¿Incluye Domicilio?
              </label>
              <select
                value={tierForm.includes_delivery ? 'yes' : 'no'}
                onChange={(e) =>
                  setTierForm((prev) => ({
                    ...prev,
                    includes_delivery: e.target.value === 'yes',
                    delivery_fee: e.target.value === 'yes' ? 0 : 5000
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
              >
                <option value="yes">Sí (Todo Incluido)</option>
                <option value="no">No (Envío aparte)</option>
              </select>
            </div>
            {!tierForm.includes_delivery && (
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Tarifa Envío por Entrega ($)
                </label>
                <input
                  type="number"
                  value={tierForm.delivery_fee}
                  onChange={(e) => setTierForm((prev) => ({ ...prev, delivery_fee: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
              Descripción Corta
            </label>
            <input
              type="text"
              value={tierForm.description}
              onChange={(e) => setTierForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Ej: Incluye 5 Bowls armados a tu gusto + 5 domicilios"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer disabled:opacity-50"
            >
              Guardar Paquete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
