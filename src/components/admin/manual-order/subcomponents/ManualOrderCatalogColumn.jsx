import React from 'react';
import { Icon } from '@iconify-icon/react';
import { formatCOP } from '../../../../utils/money';

export default function ManualOrderCatalogColumn({
  searchTerm,
  setSearchTerm,
  categories = [],
  selectedCategory,
  setSelectedCategory,
  dailySpecialData,
  catalogProducts = [],
  loadingCatalog,
  filteredProducts = [],
  handleSelectProduct
}) {
  return (
    <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
      {/* Search and Category Tabs */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Icon
            icon="heroicons:magnifying-glass"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-base"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar plato o bebida..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-neutral-50"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Todos
          </button>
          {categories.map(c => (
            <button
              key={c.id || c.slug}
              type="button"
              onClick={() => setSelectedCategory(c.id || c.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === (c.id || c.slug) ||
                (c.id === 'daily_specials' && selectedCategory === 'daily_specials')
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Special Banner Header */}
      <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <span className="text-xl shrink-0">🍱</span>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded-md">
                Almuerzo Estrella de Hoy
              </span>
              <span className="text-xs font-black text-neutral-900">
                {catalogProducts.find(p => p.id === dailySpecialData?.activeSpecialId)?.name?.replace(/\s*\(Especial del Día\)/i, '') || 'Poke Tori Katsu'} ({formatCOP(catalogProducts.find(p => p.id === dailySpecialData?.activeSpecialId)?.price || dailySpecialData?.promoPrice || 22000)})
              </span>
              {dailySpecialData?.activeSecondaryIds && dailySpecialData.activeSecondaryIds.length > 0 && (
                <>
                  <span className="text-neutral-300">•</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded-md">
                    Opción del Día
                  </span>
                  <span className="text-xs font-bold text-neutral-800">
                    {catalogProducts.find(p => dailySpecialData.activeSecondaryIds.includes(p.id))?.name?.replace(/\s*\(Especial del Día\)/i, '') || 'Salmón Fresh'} ({formatCOP(catalogProducts.find(p => dailySpecialData.activeSecondaryIds.includes(p.id))?.price || 22000)})
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-neutral-600">
              Entrada: <strong>{dailySpecialData?.soupName}</strong> • Bebida: <strong>{dailySpecialData?.drinkName}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedCategory('daily_specials')}
          className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
        >
          Ver del Día ⭐
        </button>
      </div>

      {/* Products Grid */}
      {loadingCatalog ? (
        <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
          <Icon icon="heroicons:arrow-path" className="text-2xl animate-spin" />
          <p className="text-xs">Cargando catálogo...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 text-center text-neutral-400 text-xs">
          No se encontraron productos disponibles.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
          {filteredProducts.map(p => {
            const isPrimarySpecial = p.id === dailySpecialData?.activeSpecialId;
            const isSecondarySpecial =
              dailySpecialData?.activeSecondaryIds &&
              dailySpecialData.activeSecondaryIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProduct(p)}
                className="flex flex-col p-3 rounded-2xl border border-neutral-200 bg-white hover:border-amber-500/80 hover:shadow-md transition-all text-left group cursor-pointer relative overflow-hidden"
              >
                {isPrimarySpecial ? (
                  <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded-md shadow-2xs">
                    ⭐ Plato del Día
                  </span>
                ) : isSecondarySpecial ? (
                  <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded-md shadow-2xs">
                    🔥 Poke Premium
                  </span>
                ) : null}
                <p className="font-bold text-xs text-neutral-900 group-hover:text-amber-800 line-clamp-1 pr-8">
                  {p.name.replace(/\s*\(Especial del Día\)/i, '')}
                </p>
                <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-tight">
                  {p.description || p.desc || p.subcategory || 'Plato BOKU'}
                </p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-100">
                  <span className="text-xs font-black text-neutral-900">
                    {formatCOP(p.price || 0)}
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-neutral-100 group-hover:bg-amber-500 group-hover:text-neutral-950 flex items-center justify-center text-xs font-bold transition-all">
                    +
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
