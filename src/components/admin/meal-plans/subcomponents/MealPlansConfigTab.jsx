import React from 'react';
import { Settings, Save, Layers, Plus, Edit3, Trash2 } from 'lucide-react';
import { formatCOP } from '../../../../utils/money';

export default function MealPlansConfigTab({
  programConfig,
  setProgramConfig,
  activeTiers = [],
  allProducts = [],
  saving = false,
  onSaveProgramSettings,
  onOpenCreateTierModal,
  onOpenEditTierModal,
  onDeleteTier
}) {
  return (
    <div className="p-5 sm:p-6 space-y-6 bg-stone-50/50">
      {/* Bloque 1: Identidad del Programa y Plato Vinculado */}
      <form
        onSubmit={onSaveProgramSettings}
        className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              1. Identidad del Programa y Plato Base del Negocio
            </h3>
            <p className="text-xs text-stone-500">
              Personaliza cómo ven tus clientes el programa de tiqueteras en el menú público y qué plato/DIY se abre al canjear.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando...' : 'Guardar Ajustes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
              Título del Programa / Club
            </label>
            <input
              type="text"
              value={programConfig.program_title || ''}
              onChange={(e) =>
                setProgramConfig((prev) => ({ ...prev, program_title: e.target.value }))
              }
              placeholder="Ej: Planes & Tiqueteras Digitales (Club BOKU Fit)"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
              Sufijo de Códigos VIP
            </label>
            <input
              type="text"
              value={programConfig.code_suffix || ''}
              onChange={(e) =>
                setProgramConfig((prev) => ({
                  ...prev,
                  code_suffix: e.target.value.toUpperCase()
                }))
              }
              placeholder="Ej: BOKU"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono font-bold uppercase"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
              Subtítulo / Descripción en el Menú Público
            </label>
            <input
              type="text"
              value={programConfig.program_subtitle || ''}
              onChange={(e) =>
                setProgramConfig((prev) => ({ ...prev, program_subtitle: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
              Plato / Armador DIY Vinculado
            </label>
            <select
              value={programConfig.linked_product_id || ''}
              onChange={(e) =>
                setProgramConfig((prev) => ({ ...prev, linked_product_id: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold bg-stone-50"
            >
              {(allProducts || []).map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.config_options?.is_diy ? '✨ [DIY] ' : ''}
                  {prod.name} ({formatCOP(prod.price)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
              Valor Base Cubierto por Crédito ($)
            </label>
            <input
              type="number"
              value={programConfig.default_unit_value || 17000}
              onChange={(e) =>
                setProgramConfig((prev) => ({
                  ...prev,
                  default_unit_value: Number(e.target.value)
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
              Toppings / Verduras Gratis Incluidos
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={programConfig.included_toppings_count ?? 5}
              onChange={(e) =>
                setProgramConfig((prev) => ({
                  ...prev,
                  included_toppings_count: Number(e.target.value)
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
            />
          </div>
        </div>
      </form>

      {/* Bloque 2: CRUD de Planes / Paquetes del Negocio */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              2. Catálogo de Planes y Precios de tu Negocio ({activeTiers.length})
            </h3>
            <p className="text-xs text-stone-500">
              Crea, edita o elimina los paquetes (Semanal, Quincenal, Mensual) que tu restaurante ofrece a sus clientes.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreateTierModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Paquete / Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeTiers.map((tier) => (
            <div
              key={tier.id}
              className="rounded-2xl border border-stone-200 p-4 flex flex-col justify-between gap-3 hover:border-emerald-400 transition-all bg-stone-50/40"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      tier.includes_delivery
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {tier.includes_delivery ? '🛵 Todo Incluido' : '🥗 Solo Platos'}
                  </span>
                  <span className="text-xs font-bold text-stone-500">
                    {tier.total_credits} créditos
                  </span>
                </div>

                <h4 className="text-sm font-black text-stone-900 leading-snug">{tier.label}</h4>
                <p className="text-lg font-black text-emerald-700">
                  {formatCOP(tier.plan_price)}
                  <span className="text-[11px] font-semibold text-stone-400 ml-1">
                    ({formatCOP(Math.round(tier.plan_price / Math.max(1, tier.total_credits)))}/día)
                  </span>
                </p>
                <p className="text-[11px] text-stone-500 line-clamp-2">{tier.description}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/70">
                <button
                  type="button"
                  onClick={() => onOpenEditTierModal(tier)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Precio / Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTier(tier.id)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                  title="Eliminar paquete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
