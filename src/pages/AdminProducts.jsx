import { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { useAdminRecipes } from '../hooks/useAdminRecipes';
import { useAdminModifierGroups } from '../hooks/useAdminModifierGroups';
import { useAllergens } from '../hooks/useAllergens';
import { formatCOP } from '../utils/money';
import ProductForm from '../components/admin/ProductForm';
import BulkCostEditor from '../components/admin/BulkCostEditor';
import AAImage from '../components/ui/AAImage';
import {
  PageHeader, PrimaryButton, Badge,
  TableContainer, Th, SearchInput, SelectInput
} from '../components/admin/ui';

const STOCK_BADGE = {
  in:  { label: 'Disponible', variant: 'green' },
  low: { label: 'Stock bajo', variant: 'amber' },
  out: { label: 'Agotado',    variant: 'red'   },
};

/* ─── Drag handle icon ─── */
const DragHandle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/>
    <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
    <circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>
  </svg>
);

export default function AdminProducts() {
  const { 
    products, 
    loading: loadingProd, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    toggleActive, 
    toggleStock, 
    reorderProducts,
    bulkUpdateCosts 
  } = useAdminProducts();
  const { categories, loading: loadingCats } = useCategories();
  const { activePlan } = useAuth();
  const { withinLimit } = usePlan();
  const { recipes, fetchRecipes } = useAdminRecipes();
  const { modifierGroups, fetchModifierGroups } = useAdminModifierGroups();
  const { allergens, loading: loadingAllergens } = useAllergens();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [attrFilter, setAttrFilter] = useState('all'); // 'all', 'upsell', 'no_kitchen', 'packaging'
  const [marginFilter, setMarginFilter] = useState('all'); // 'all', 'high', 'med', 'low'

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);

  // ─── Reorder mode state ───
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedList, setOrderedList] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // Derived plan values from activePlan (more reliable sync)
  const maxProducts = activePlan?.max_products ?? null;

  useEffect(() => { 
    fetchRecipes(); 
    fetchModifierGroups();
  }, [fetchRecipes, fetchModifierGroups]);

  // When entering reorder mode, populate orderedList from filtered products
  const enterReorderMode = useCallback(() => {
    if (catFilter === 'all') return; // must pick a category first
    const sorted = products
      .filter(p => !p.is_addon && p.category_id === catFilter)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setOrderedList(sorted);
    setReorderMode(true);
    setSearch('');
  }, [catFilter, products]);

  const exitReorderMode = () => {
    setReorderMode(false);
    setOrderedList([]);
    setDragIdx(null);
    setOverIdx(null);
  };

  const saveOrder = async () => {
    await reorderProducts(orderedList);
    exitReorderMode();
  };

  // ─── Drag handlers ───
  const handleDragStart = (idx) => {
    dragItem.current = idx;
    setDragIdx(idx);
  };
  const handleDragEnter = (idx) => {
    dragOverItem.current = idx;
    setOverIdx(idx);
  };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const list = [...orderedList];
    const [dragged] = list.splice(dragItem.current, 1);
    list.splice(dragOverItem.current, 0, dragged);
    setOrderedList(list);
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
    setOverIdx(null);
  };

  if (loadingProd || loadingCats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        Cargando productos…
      </div>
    );
  }

  const isAtLimit = !withinLimit('max_products', products.length);

  const filtered = products.filter(p => {
    if (p.is_addon) return false;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || p.category_id === catFilter;

    // Attribute Filtering
    let matchAttr = true;
    if (attrFilter === 'upsell') matchAttr = p.is_upsell;
    else if (attrFilter === 'no_kitchen') matchAttr = !p.requires_kitchen;
    else if (attrFilter === 'packaging') matchAttr = (p.packaging_fee || 0) > 0;

    // Profitability (Margin) Filtering
    let matchMargin = true;
    if (marginFilter !== 'all') {
      if (p.price > 0 && (p.cost || 0) > 0) {
        const margin = ((p.price - (p.cost || 0)) / p.price) * 100;
        if (marginFilter === 'high') matchMargin = margin >= 45;
        else if (marginFilter === 'med') matchMargin = margin >= 25 && margin < 45;
        else if (marginFilter === 'low') matchMargin = margin < 25;
      } else {
        matchMargin = false; // Exclude if no cost/price data
      }
    }

    return matchSearch && matchCat && matchAttr && matchMargin;
  }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleEdit   = (p) => { setEditingProduct(p); setIsFormOpen(true); setConfirmDelete(null); };
  const handleCreate = ()  => { setEditingProduct(null); setIsFormOpen(true); setConfirmDelete(null); };
  const handleDelete = async (id) => {
    await deleteProduct(id);
    setConfirmDelete(null);
  };
  const handleSave = async (data) => {
    const ok = editingProduct
      ? await updateProduct(editingProduct.id, data)
      : await createProduct(data);
    if (ok) { setIsFormOpen(false); setEditingProduct(null); }
  };

  /* ═══════════════════════════════════════
           REORDER MODE UI
     ═══════════════════════════════════════ */
  if (reorderMode) {
    const catName = categories.find(c => c.id === catFilter)?.name || 'Categoría';
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ordenar productos</h2>
            <p className="text-sm text-gray-500 mt-0.5">Arrastra para reordenar — <strong>{catName}</strong></p>
          </div>
          <div className="flex gap-2">
            <button onClick={exitReorderMode}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              Cancelar
            </button>
            <button onClick={saveOrder}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-sm">
              Guardar orden
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {orderedList.map((product, idx) => (
            <div
              key={product.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-grab active:cursor-grabbing select-none transition-all ${
                dragIdx === idx ? 'opacity-40 scale-[0.98]' : ''
              } ${overIdx === idx && dragIdx !== idx ? 'bg-blue-50/60 border-blue-200' : 'hover:bg-gray-50/60'}`}
            >
              {/* Drag handle */}
              <span className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                <DragHandle />
              </span>

              {/* Position number */}
              <span className="text-[11px] text-gray-300 font-bold w-5 text-center tabular-nums shrink-0">
                {idx + 1}
              </span>

              {/* Image */}
              <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">🍽</span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                <p className="text-[11px] text-gray-400 font-medium tabular-nums">{formatCOP(product.price)}</p>
              </div>

              {/* Stock badge */}
              {(() => {
                const stock = STOCK_BADGE[product.stock_status] || STOCK_BADGE.out;
                return (
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                    stock.variant === 'green'  ? 'bg-green-50 text-green-700 border-green-100' :
                    stock.variant === 'amber'  ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      stock.variant === 'green' ? 'bg-green-500' :
                      stock.variant === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                    }`}/>
                    {stock.label}
                  </span>
                );
              })()}
            </div>
          ))}
          {orderedList.length === 0 && (
            <p className="text-center text-sm text-gray-400 font-medium py-12">
              No hay productos en esta categoría.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
            NORMAL MODE UI
     ═══════════════════════════════════════ */
  return (
    <div className="p-4 sm:p-8 max-w-[1700px] mx-auto space-y-6">
      <PageHeader
        badge="Administración"
        title="Productos"
        subtitle="Gestiona el catálogo de tu menú digital."
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="text-[11px] font-black uppercase tracking-widest px-4 py-2 bg-white border border-gray-100 rounded-2xl text-gray-500 shadow-sm italic flex flex-col items-center sm:items-end">
              <span className="text-[9px] text-gray-400">Cupo de Catálogo</span>
              <span className={isAtLimit ? 'text-orange-600' : 'text-gray-900'}>
                {products.length} / {maxProducts} PRODUCTOS
              </span>
            </div>
          
          <PrimaryButton 
            onClick={handleCreate} 
            disabled={isAtLimit}
            className="w-full sm:w-auto py-3 px-6 shadow-xl"
          >
            {isAtLimit ? 'Límite alcanzado' : '+ Nuevo Producto'}
          </PrimaryButton>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1 w-full max-w-xl group relative">
            <SearchInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-48">
              <SelectInput value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectInput>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto ml-auto lg:ml-0">
               {catFilter !== 'all' && (
                <button 
                  onClick={enterReorderMode}
                  className="flex-1 sm:flex-initial px-4 py-2.5 text-[13px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <DragHandle />
                  Ordenar
                </button>
              )}
              <button 
                onClick={() => setIsBulkEditorOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-[13px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Editor de Costos
              </button>
            </div>
          </div>
        </div>

        {/* Operational Filters Row */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Atributos:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'upsell', label: '✨ Upsell' },
                { id: 'no_kitchen', label: '❄️ Sin Cocina' },
                { id: 'packaging', label: '📦 Empaque' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAttrFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border ${
                    attrFilter === f.id 
                    ? 'bg-[#2f4131] text-white border-[#2f4131] shadow-md shadow-[#2f4131]/10' 
                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-px bg-gray-100 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Rentabilidad:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'high', label: '📈 Alta', color: 'text-green-600' },
                { id: 'med', label: '📊 Media', color: 'text-orange-500' },
                { id: 'low', label: '⚠️ Baja', color: 'text-red-500' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setMarginFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border ${
                    marginFilter === f.id 
                    ? 'bg-[#2f4131] text-white border-[#2f4131] shadow-md shadow-[#2f4131]/10' 
                    : `bg-white ${f.color || 'text-gray-500'} border-gray-100 hover:bg-gray-50`
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
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

      {/* Table */}
      <TableContainer>
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Producto</Th>
              <Th>Categoría</Th>
              <Th>Subcategoría</Th>
              <Th>Precio</Th>
              <Th>Costo</Th>
              <Th>Margen</Th>
              <Th>Stock</Th>
              <Th>Atributos</Th>
              <Th>Receta</Th>
              <Th>Actualizado</Th>
              <Th>Estado</Th>
              <Th right>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((product, idx) => {
              const stock   = STOCK_BADGE[product.stock_status] || STOCK_BADGE.out;
              const recipe  = recipes.find(r => r.id === product.recipe_id);
              const catName = product.category?.name || product.categories?.name;
              const isDelConf = confirmDelete === product.id;

              // Inline delete confirmation row
              if (isDelConf) return (
                <tr key={product.id}>
                  <td colSpan={13} className="px-5 py-3 bg-red-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-red-700">
                        ¿Eliminar <strong>"{product.name}"</strong>? Esta acción no se puede deshacer.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[12px] font-semibold hover:bg-red-700 transition-all">
                          Eliminar
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[12px] font-semibold hover:bg-gray-50 transition-all">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );

              return (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3.5 text-xs text-gray-400 font-medium">#{idx + 1}</td>
                  
                  {/* Name and Image */}
                  <td className="px-5 py-3.5 min-w-[300px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                        <AAImage src={product.image_url} alt={product.name} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</span>
                        <span className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{product.description || 'Sin descripción'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-[12px] font-medium text-gray-600 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                      {catName || 'Sin cat.'}
                    </span>
                  </td>

                  {/* Subcategory */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {product.subcategories?.name ? (
                      <span className="text-[11px] font-semibold text-blue-600 px-2 py-0.5 bg-blue-50/50 rounded-full border border-blue-100/50">
                        {product.subcategories.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic">—</span>
                    )}
                  </td>

                  {/* Precio */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCOP(product.price)}</p>
                  </td>

                  {/* Costo */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {product.cost > 0 ? (
                      <p className="text-[12px] text-gray-500 font-medium tabular-nums">
                        {formatCOP(product.cost)}
                      </p>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic">No req.</span>
                    )}
                  </td>

                  {/* Margen */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {product.cost > 0 && product.price > 0 ? (
                      (() => {
                        const margin = ((product.price - product.cost) / product.price) * 100;
                        const color = margin >= 45 ? 'text-green-600 bg-green-50' : margin >= 25 ? 'text-orange-500 bg-orange-50' : 'text-red-500 bg-red-50';
                        return (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${color} tabular-nums border border-current/10 uppercase`}>
                            {margin.toFixed(0)}%
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-[11px] text-gray-200 font-medium whitespace-nowrap italic">—</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <button 
                      onClick={() => toggleStock(product.id, product.stock_status)}
                      className="group/stock active:scale-95 transition-all"
                    >
                      <Badge variant={stock.variant}>{stock.label}</Badge>
                    </button>
                  </td>

                  {/* Atributos */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {product.is_upsell && (
                        <span title="Sugerido para Upsell" className="w-6 h-6 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg border border-amber-100 shadow-sm cursor-help transition-transform hover:scale-110">
                          <span className="text-[13px]">✨</span>
                        </span>
                      )}
                      {!product.requires_kitchen && (
                        <span title="No requiere cocina (Directo)" className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm cursor-help transition-transform hover:scale-110">
                          <span className="text-[13px]">❄️</span>
                        </span>
                      )}
                      {product.packaging_fee > 0 && (
                        <span title={`Costo de empaque: ${formatCOP(product.packaging_fee)}`} className="w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg border border-gray-100 shadow-sm cursor-help transition-transform hover:scale-110">
                          <span className="text-[13px]">📦</span>
                        </span>
                      )}
                      {!product.is_upsell && product.requires_kitchen && (!product.packaging_fee || product.packaging_fee === 0) && (
                        <span className="text-[11px] text-gray-200 font-medium whitespace-nowrap italic">—</span>
                      )}
                    </div>
                  </td>

                  {/* Receta */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {recipe ? (
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-teal-600">{recipe.name}</span>
                        <span className="text-[10px] text-gray-400">Vinculado</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic italic">Sin receta</span>
                    )}
                  </td>

                  {/* Actualizado */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-[11px] text-gray-500 font-medium">
                      {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '—'}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <button onClick={() => toggleActive(product.id, product.is_active)}>
                      <Badge variant={product.is_active ? 'green' : 'red'}>
                        {product.is_active ? 'Activo' : 'Oculto'}
                      </Badge>
                    </button>
                  </td>

                  <td className="px-5 py-3.5 min-w-[120px]">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar producto"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar producto"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filtered.length === 0 && (
              <tr>
                <td colSpan="13" className="px-5 py-16 text-center text-gray-400 text-sm font-medium">
                  {search || catFilter !== 'all' || attrFilter !== 'all' || marginFilter !== 'all'
                    ? 'Sin resultados para los filtros actuales.'
                    : 'Aún no hay productos. Crea el primero.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>

      {/* Form modal */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          recipes={recipes}
          allergens={allergens}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
        />
      )}

      {isBulkEditorOpen && (
        <BulkCostEditor 
          products={products.filter(p => !p.is_addon)}
          onSave={async (updates) => {
            const ok = await bulkUpdateCosts(updates);
            if (ok) setIsBulkEditorOpen(false);
          }}
          onCancel={() => setIsBulkEditorOpen(false)}
        />
      )}
    </div>
  );
}
