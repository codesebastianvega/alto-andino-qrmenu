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
    return matchSearch && matchCat;
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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
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

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex-1 w-full max-w-xl group relative">
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción o categoría..."
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
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Producto</Th>
              <Th>Categoría</Th>
              <Th>Precio</Th>
              <Th>Stock</Th>
              <Th>Receta</Th>
              <Th>Extras</Th>
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
                  <td colSpan={9} className="px-5 py-3 bg-red-50">
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
                <tr key={product.id} className="group hover:bg-gray-50/60 transition-colors">
                  {/* # (sort order) */}
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] text-gray-300 font-medium tabular-nums">{idx + 1}</span>
                  </td>

                  {/* Producto */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        <AAImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          fallback={<span className="text-base">🍽</span>}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</p>
                          {product.is_upsell && <span title="Sugerido para Upsell" className="text-xs">✨</span>}
                          {!product.requires_kitchen && <span title="No requiere cocina" className="text-xs">❄️</span>}
                        </div>
                        {product.description && (
                          <p className="text-[12px] text-gray-400 font-medium truncate max-w-[180px] mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Categoría */}
                  <td className="px-5 py-3.5">
                    <Badge variant="gray">{catName || '—'}</Badge>
                  </td>

                  {/* Precio */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCOP(product.price)}</p>
                    {product.cost > 0 && (
                      <p className="text-[11px] text-gray-400 font-medium tabular-nums mt-0.5">
                        Costo {formatCOP(product.cost)}
                      </p>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleStock(product.id, product.stock_status)}
                      title="Click para cambiar disponibilidad"
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all hover:opacity-70 active:scale-95 cursor-pointer ${
                        stock.variant === 'green'  ? 'bg-green-50 text-green-700 border-green-100' :
                        stock.variant === 'amber'  ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                     'bg-red-50 text-red-600 border-red-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        stock.variant === 'green' ? 'bg-green-500' :
                        stock.variant === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                      }`}/>
                      {stock.label}
                    </button>
                  </td>

                  {/* Receta */}
                  <td className="px-5 py-3.5">
                    {recipe ? (
                      <Badge variant="indigo">{recipe.name}</Badge>
                    ) : (
                      <span className="text-[12px] text-gray-300 font-medium">—</span>
                    )}
                  </td>

                    <td className="px-5 py-3.5">
                      {(product.modifier_groups || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(product.modifier_groups || []).slice(0, 3).map(g => {
                            const groupData = modifierGroups.find(mg => mg.id === g);
                            if (!groupData) return null; // No mostrar UUIDs si no hay data
                            
                            return (
                              <span key={g}
                                className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 capitalize shadow-sm">
                                {groupData.name.replace(/-/g, ' ')}
                              </span>
                            );
                          })}
                          {(product.modifier_groups || []).length > 3 && (
                            <span className="text-[10px] text-violet-400 font-bold self-center">
                              +{(product.modifier_groups || []).length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-gray-300 font-medium">—</span>
                      )}
                    </td>

                  {/* Estado */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(product.id, product.is_active)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all hover:opacity-80 ${
                        product.is_active
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(product.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" className="px-5 py-16 text-center text-gray-400 text-sm font-medium">
                  {search || catFilter !== 'all'
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
