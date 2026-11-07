import { Icon } from '@iconify-icon/react';
import { Lightbulb, X, Link as LinkIcon } from 'lucide-react';
import { PrimaryButton } from '../ui';

export function InsumosToolbar({
  showInvTip = false,
  dismissInvTip,
  typeFilter = 'all',
  setTypeFilter,
  ingredientsCount = 0,
  rawCount = 0,
  subrecipeCount = 0,
  expiringSoonCount = 0,
  search = '',
  setSearch,
  catFilter = 'all',
  setCatFilter,
  categories = [],
  providerFilter = 'all',
  setProviderFilter,
  providers = [],
  sortBy = 'name_asc',
  setSortBy,
  isAllLocations = false,
  onOpenLinkModal,
  onOpenBatchModal,
  onOpenCreate
}) {
  return (
    <>
      {/* Onboarding Tip Banner */}
      {showInvTip && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs animate-fade-in relative">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
            <Lightbulb size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-bold text-slate-900 mb-0.5">Gestión de Insumos por Sede</p>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Los insumos se crean a nivel de marca y se vinculan a la sede activa. Si necesitas un insumo existente en otra sede, usa <strong className="font-semibold text-slate-800">"Vincular del Catálogo"</strong>. Registrar costos aquí permite calcular márgenes reales en recetas.
            </p>
          </div>
          <button onClick={dismissInvTip} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Segmented Filter: Insumos de Compra vs Subrecetas vs Vencimientos */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit mb-4 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            typeFilter === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({ingredientsCount})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('raw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            typeFilter === 'raw'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📦</span> Insumos de Compra ({rawCount})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('subrecipe')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            typeFilter === 'subrecipe'
              ? 'bg-white text-amber-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🍲</span> Subrecetas / Mise en Place ({subrecipeCount})
        </button>
        {expiringSoonCount > 0 && (
          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === 'expiring' ? 'all' : 'expiring')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'expiring'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80'
            }`}
          >
            <span>⏳</span> Próximos a Vencer ({expiringSoonCount})
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 w-full lg:w-auto">
          <div className="relative flex-1 w-full sm:min-w-[280px]">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
            />
          </div>
          <div className="relative w-full sm:w-52">
            <Icon
              icon="heroicons:funnel"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-52">
            <Icon
              icon="heroicons:truck"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <select
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todos los proveedores</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-52">
            <Icon
              icon="heroicons:bars-arrow-down"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
            >
              <option value="name_asc">Nombre (A → Z)</option>
              <option value="name_desc">Nombre (Z → A)</option>
              <option value="category">Por Categoría</option>
              <option value="stock_asc">Menor Stock (Críticos)</option>
              <option value="stock_desc">Mayor Stock</option>
              <option value="exp_asc">Caducidad (Próximos a vencer)</option>
              <option value="recent">Recién Actualizados</option>
              <option value="value_desc">Mayor Valor Total</option>
            </select>
            <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto shrink-0">
          {!isAllLocations && (
            <button
              onClick={onOpenLinkModal}
              className="flex items-center justify-center gap-1.5 px-3.5 h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200 shadow-2xs w-full sm:w-auto"
            >
              <LinkIcon size={14} className="text-slate-500" />
              Vincular del Catálogo
            </button>
          )}
          <button
            type="button"
            onClick={onOpenBatchModal}
            className="flex items-center justify-center gap-1.5 px-3.5 h-9 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-md w-full sm:w-auto shrink-0"
            title="Preparar bache de subreceta / mise en place y descontar bodega"
          >
            <span>🍲</span>
            <span>Preparar Bache</span>
          </button>
          <PrimaryButton onClick={onOpenCreate} className="h-9 px-4 text-xs font-semibold w-full sm:w-auto gap-1.5">
            <Icon icon="heroicons:plus" className="text-sm" />
            Nuevo Insumo
          </PrimaryButton>
        </div>
      </div>
    </>
  );
}
