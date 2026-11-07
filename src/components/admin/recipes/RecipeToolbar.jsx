import React from 'react';
import { Icon } from '@iconify-icon/react';
import { Link as LinkIcon, X } from 'lucide-react';

const ViewGridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ViewListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

export default function RecipeToolbar({
  isAllLocations,
  onOpenLinkModal,
  viewMode,
  setViewMode,
  onOpenBatchModal,
  onOpenCreateModal,
  recipeCategoryTab,
  setRecipeCategoryTab,
  activeFilter,
  setActiveFilter,
  dishesCount = 0,
  subrecipesCount = 0,
  showTip,
  onDismissTip,
  hasRecipes = true,
  searchTerm,
  setSearchTerm,
  selectedStation,
  setSelectedStation,
  availableStations = [],
  selectedIngredientId,
  setSelectedIngredientId,
  allIngredients = [],
  hasActiveFilters,
  onResetFilters,
  displayCount = 0,
  totalActiveCount = 0
}) {
  return (
    <>
      {/* ── Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fichas Técnicas & Sub-recetas</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Estandarización de porciones, costos de producción y fichas digitales para cocina.</p>
        </div>
        <div className="flex items-center gap-2.5">
          {!isAllLocations && (
            <button
              onClick={onOpenLinkModal}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200 shadow-2xs"
            >
              <LinkIcon size={14} />
              Vincular Catálogo
            </button>
          )}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ViewGridIcon />
              <span>Cuadrícula</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ViewListIcon />
              <span>Lista</span>
            </button>
          </div>
          <button 
            type="button"
            onClick={onOpenBatchModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-md shrink-0"
            title="Preparar bache de subreceta y descontar inventario"
          >
            <span className="text-sm">🍳</span>
            <span>Preparar Bache</span>
          </button>
          <button 
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Icon icon="heroicons:plus" className="text-base" />
            <span>{recipeCategoryTab === 'subrecipes' ? 'Nueva Sub-receta' : 'Crear Receta'}</span>
          </button>
        </div>
      </div>

      {/* ── Category View Tabs: Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1">
          <button
            onClick={() => { setRecipeCategoryTab('dishes'); setActiveFilter('all'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              recipeCategoryTab === 'dishes'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:sparkles" className="text-sm text-indigo-600" />
            <span>Platos & Ensamble</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700 text-[11px] font-mono font-bold">
              {dishesCount}
            </span>
          </button>

          <button
            onClick={() => { setRecipeCategoryTab('subrecipes'); setActiveFilter('all'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              recipeCategoryTab === 'subrecipes'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:beaker" className="text-sm text-amber-600" />
            <span>Sub-recetas & Prep</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700 text-[11px] font-mono font-bold">
              {subrecipesCount}
            </span>
          </button>

          <button
            onClick={() => setRecipeCategoryTab('layout')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              recipeCategoryTab === 'layout'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:map-pin" className="text-sm text-emerald-600" />
            <span>Layout de Estaciones Cocina</span>
          </button>
        </div>

        {activeFilter !== 'all' && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-medium border border-indigo-200">
            <span>Filtro: {
              activeFilter === 'critical' ? 'Margen bajo (<30%)' : 
              activeFilter === 'healthy' ? 'Rentables (>40%)' :
              activeFilter === 'addon' ? 'Vendible como Addon' :
              'Mayor Inversión'
            }</span>
            <button onClick={() => setActiveFilter('all')} className="hover:text-indigo-900 ml-1">
              <Icon icon="heroicons:x-mark" className="text-xs" />
            </button>
          </div>
        )}
      </div>

      {/* ── Onboarding Tip Banner (Crisp) */}
      {showTip && hasRecipes && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-slate-600 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base shrink-0">💡</span>
            <p className="leading-normal">
              <strong>Flujo de estandarización:</strong> 1. Crear Insumos → 2. Armar Sub-recetas / Fichas Técnicas → 3. Vincular a Productos de la Carta para sincronizar costos y márgenes automáticamente.
            </p>
          </div>
          <button onClick={onDismissTip} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 shrink-0" title="Descartar">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Search & Filter Toolbar (Only when not in layout tab) */}
      {recipeCategoryTab !== 'layout' && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Icon 
                icon="heroicons:magnifying-glass" 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" 
              />
              <input 
                type="text" 
                placeholder={recipeCategoryTab === 'subrecipes' ? "Buscar sub-receta por nombre, insumo, ubicación..." : "Buscar plato por nombre, ingrediente, estación..."} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title="Borrar búsqueda"
                >
                  <Icon icon="heroicons:x-mark" className="text-xs" />
                </button>
              )}
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Station Filter */}
              <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                <Icon icon="heroicons:map-pin" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <select
                  value={selectedStation}
                  onChange={e => setSelectedStation(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Todas las estaciones</option>
                  {availableStations.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              </div>

              {/* Ingredient Filter */}
              <div className="relative min-w-[190px] flex-1 sm:flex-initial">
                <Icon icon="heroicons:beaker" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <select
                  value={selectedIngredientId}
                  onChange={e => setSelectedIngredientId(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Todos los insumos</option>
                  {allIngredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
                <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              </div>

              {/* Financial Quick Pills */}
              {recipeCategoryTab === 'dishes' ? (
                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setActiveFilter('healthy')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'healthy' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-emerald-700'}`}
                  >
                    Rentables (&gt;40%)
                  </button>
                  <button
                    onClick={() => setActiveFilter('critical')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'critical' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-rose-700'}`}
                  >
                    Bajo Margen (&lt;30%)
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setActiveFilter('addon')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'addon' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-indigo-700'}`}
                  >
                    Vendible como Addon
                  </button>
                </div>
              )}

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={onResetFilters}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all border border-rose-200"
                  title="Restablecer todos los filtros"
                >
                  <Icon icon="heroicons:x-mark" className="text-xs" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Status / Count Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                Mostrando {displayCount} de {totalActiveCount} {recipeCategoryTab === 'subrecipes' ? 'sub-recetas' : 'recetas'}
              </span>
              {hasActiveFilters && (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-indigo-100">
                  Filtros aplicados
                </span>
              )}
            </div>
            {displayCount === 0 && (
              <span className="text-rose-600 font-medium">Ninguna receta coincide con los filtros aplicados</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
