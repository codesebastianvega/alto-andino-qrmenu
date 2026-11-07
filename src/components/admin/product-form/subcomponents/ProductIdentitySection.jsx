import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function ProductIdentitySection({
  formData,
  handleChange,
  setFormData,
  categories = [],
  availableSubcategories = [],
  brandConceptOptions = [],
  handleGenerateAI,
  isGeneratingText = false
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
        Ficha Comercial
      </span>

      {/* Nombre */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          Nombre del Plato <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej. Bowl Pollito Teriyaki"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
      </div>

      {/* Categoría y Subcategoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            required
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Subcategoría
          </label>
          {availableSubcategories.length > 0 ? (
            <select
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
            >
              <option value="">Ninguna / General</option>
              {availableSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
              <option value="Otros">Otros</option>
            </select>
          ) : (
            <input
              type="text"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              placeholder="Ej. Especiales"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
            />
          )}
        </div>
      </div>

      {/* Concepto de Marca */}
      {brandConceptOptions.length > 0 && (
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Concepto de Marca (Línea de Menú)
          </label>
          <select
            name="brand_concept"
            value={formData.brand_concept}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
          >
            <option value="">Aplica a toda la marca</option>
            {brandConceptOptions.map((concept) => (
              <option key={concept.value} value={concept.value}>
                {concept.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Descripción con IA */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-700">
            Descripción Gastronómica
          </label>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGeneratingText}
            className="flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <Icon icon="heroicons:sparkles" className="text-xs text-purple-600" />
            {isGeneratingText ? 'Redactando...' : 'Generar con IA ✨'}
          </button>
        </div>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Describe ingredientes clave, cocción, aromas y textura para abrir el apetito..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Estado de Stock y Upsell */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Stock Inmediato
          </label>
          <select
            name="stock_status"
            value={formData.stock_status}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none cursor-pointer ${
              formData.stock_status === 'in'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <option value="in">🟢 Disponible para Venta</option>
            <option value="out">🔴 Agotado / Fuera de Stock</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Sugerido en Carrito (Upsell)
          </label>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, is_upsell: !prev.is_upsell }))}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              formData.is_upsell
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <span>{formData.is_upsell ? '⭐ Sugerir en Checkout' : 'No sugerir'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                formData.is_upsell ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
