import { SearchInput, SelectInput } from '../ui';
import { Link as LinkIcon } from 'lucide-react';

export const DragHandle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/>
    <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
    <circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>
  </svg>
);

export default function ProductsFilterToolbar({
  search,
  setSearch,
  isFiltersOpen,
  setIsFiltersOpen,
  hasActiveFilters,
  catFilter,
  setCatFilter,
  categories,
  brandConceptOptions,
  brandFilter,
  setBrandFilter,
  locationFilter,
  setLocationFilter,
  locations,
  setShowUnassigned,
  attrFilter,
  setAttrFilter,
  marginFilter,
  setMarginFilter,
  onEnterReorderMode,
  onOpenBulkEditor,
  onOpenLinkModal
}) {
  return (
    <>
      <div className="flex flex-col gap-4 bg-white p-4 md:p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        {/* 1. Cabecera Fija: Buscador + Botón Filtros (Mobile) */}
        <div className="flex items-center gap-2 md:gap-4 w-full">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
            />
          </div>
          {/* Botón Toggle solo para Móvil */}
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`md:hidden flex items-center justify-center h-[42px] px-4 rounded-xl border transition-all font-bold text-xs gap-2 relative ${
              isFiltersOpen
                ? 'bg-[#2f4131] text-white border-[#2f4131]'
                : 'bg-gray-50 text-gray-600 border-gray-200 active:scale-95'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filtros
            {!isFiltersOpen && hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* 2. Cuerpo Colapsable: El resto de los filtros */}
        <div className={`flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-x-4 gap-y-4 transition-all duration-300 ${
          isFiltersOpen ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="w-full md:w-auto min-w-[150px]">
            <SelectInput value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectInput>
          </div>
          {brandConceptOptions.length > 0 && (
            <div className="w-full md:w-auto min-w-[150px]">
              <SelectInput value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
                <option value="all">Concepto: Todos</option>
                {brandConceptOptions.map(concept => (
                  <option key={concept.value} value={concept.value}>{concept.label}</option>
                ))}
              </SelectInput>
            </div>
          )}

          <div className="w-full md:w-auto min-w-[150px]">
            <SelectInput value={locationFilter} onChange={e => {
              setLocationFilter(e.target.value);
              setShowUnassigned(false);
            }}>
              <option value="all">Sede: Catálogo Maestro</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>Sede: {loc.name}</option>
              ))}
            </SelectInput>
          </div>

          <div className="flex items-center justify-between md:justify-start gap-1.5 px-3.5 py-2 bg-gray-50 rounded-xl border border-gray-100 w-full md:w-auto">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">Atributos</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'Todos', title: 'Todos los productos' },
                { id: 'kitchen', label: '🍳', title: 'Cocina (KDS)' },
                { id: 'bar', label: '🍸', title: 'Barra (BDS)' },
                { id: 'upsell', label: '✨', title: 'Upsell' },
                { id: 'no_kitchen', label: '⚡', title: 'Salida Directa' },
                { id: 'packaging', label: '📦', title: 'Con empaque' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAttrFilter(f.id)}
                  title={f.title || f.label}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] transition-all border ${
                    attrFilter === f.id 
                    ? 'bg-[#2f4131] text-white border-[#2f4131] shadow-xs' 
                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50 active:scale-95'
                  }`}
                >
                  {f.id === 'all' ? 'All' : f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-start gap-1.5 px-3.5 py-2 bg-gray-50 rounded-xl border border-gray-100 w-full md:w-auto">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">Margen</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'high', label: '📈' },
                { id: 'med', label: '📊' },
                { id: 'low', label: '⚠️' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setMarginFilter(f.id)}
                  title={f.label === 'Todos' ? 'Todos' : f.label}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[14px] transition-all border ${
                    marginFilter === f.id 
                    ? 'bg-[#2f4131] text-white border-[#2f4131]' 
                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50 active:scale-95'
                  }`}
                >
                  {f.id === 'all' ? 'All' : f.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-row flex-wrap items-center gap-2 w-full md:w-auto">
             {catFilter !== 'all' && (
              <button 
                onClick={onEnterReorderMode}
                className="flex-1 md:flex-initial px-4 py-2.5 text-[13px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <DragHandle />
                Ordenar
              </button>
             )}
            <button 
              onClick={onOpenBulkEditor}
              className="flex-1 md:flex-initial px-4 py-2.5 text-[13px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Costos
            </button>
            {locationFilter !== 'all' && (
              <button 
                onClick={onOpenLinkModal}
                className="flex-1 md:flex-initial px-4 py-2.5 text-[13px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <LinkIcon size={14} />
                Vincular de Catálogo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hint: select category to reorder */}
      {catFilter === 'all' && (
        <div className="mb-4 px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[13px] text-blue-700 font-medium flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          Selecciona una categoría para habilitar el botón de <strong className="ml-1">Ordenar</strong>.
        </div>
      )}
    </>
  );
}
