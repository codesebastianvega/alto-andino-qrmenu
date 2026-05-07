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
import { useLocationOverrides } from '../hooks/useLocationOverrides';
import { useRestaurantSettings } from '../hooks/useRestaurantSettings';
import BulkCostEditor from '../components/admin/BulkCostEditor';
import AAImage from '../components/ui/AAImage';
import {
  PageHeader, PrimaryButton, Badge,
  TableContainer, Th, SearchInput, SelectInput
} from '../components/admin/ui';
import { useLocation } from '../context/LocationContext';
import { LinkCatalogModal } from '../components/admin/LinkCatalogModal';
import { Link as LinkIcon } from 'lucide-react';
import { useMenuData } from '../context/MenuDataContext';
import { Eye, EyeOff, Clock, AlertTriangle } from 'lucide-react';

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

const normalizeBrandConcepts = (concepts = []) =>
  concepts
    .map((concept) => {
      if (typeof concept === 'string') {
        return { value: concept, label: concept };
      }

      if (concept && typeof concept === 'object') {
        const label = concept.name || concept.label || concept.id || '';
        return label ? { value: label, label } : null;
      }

      return null;
    })
    .filter(Boolean);

export default function AdminProducts() {
  const { activeLocationId, isAllLocations, activeLocation } = useLocation();
  const { 
    products, 
    loading: loadingProd, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    toggleActive, 
    toggleStock, 
    reorderProducts,
    bulkUpdateCosts,
    refreshProducts: fetchProducts 
  } = useAdminProducts();
  const { 
    categories, 
    loading: loadingCats, 
    fetchCategories 
  } = useCategories();
  const { refetchMenuData, locations } = useMenuData();

  useEffect(() => {
    // Always fetch all categories for the brand to populate filters and form
    fetchCategories('all');
  }, [fetchCategories]);

  // Sync location filter when activeLocationId changes from the header
  useEffect(() => {
    setLocationFilter(activeLocationId || 'all');
  }, [activeLocationId]);

  const { activePlan } = useAuth();
  const { withinLimit } = usePlan();
  const { recipes, fetchRecipes } = useAdminRecipes();
  const { modifierGroups, fetchModifierGroups } = useAdminModifierGroups(activeLocationId);
  const { allergens, loading: loadingAllergens } = useAllergens();
  const { saveProductOverrides } = useLocationOverrides();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [attrFilter, setAttrFilter] = useState('all'); // 'all', 'upsell', 'no_kitchen', 'packaging'
  const [marginFilter, setMarginFilter] = useState('all'); // 'all', 'high', 'med', 'low'
  const [brandFilter, setBrandFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState(activeLocationId || 'all'); // 'all' or location_id
  const [showUnassigned, setShowUnassigned] = useState(false); // To show products not yet in this location
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  const { settings } = useRestaurantSettings();
  const brandConceptOptions = normalizeBrandConcepts(settings?.brand_concepts || []);

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

  /* ─── Visibility Status Helper ─── */
  const getVisibilityStatus = useCallback((product) => {
    if (locationFilter === 'all') return { status: 'no_filter', label: '—', icon: null, color: '' };

    // 1. Check product linked to this location
    const locStatus = product.location_product_status?.find(s => s.location_id === locationFilter);
    if (!locStatus || locStatus.is_active === false) {
      return { status: 'not_linked', label: 'No vinculado', icon: EyeOff, color: 'text-red-500 bg-red-50 border-red-100' };
    }

    // 2. Check category linked to this location
    const cat = categories.find(c => c.id === product.category_id);
    if (!cat) {
      return { status: 'no_category', label: 'Sin categoría', icon: AlertTriangle, color: 'text-orange-500 bg-orange-50 border-orange-100' };
    }
    const catLinked = cat.location_categories?.some(lc => lc.location_id === locationFilter && lc.is_active !== false);
    if (!catLinked) {
      return { status: 'cat_not_linked', label: 'Cat. no vinculada', icon: AlertTriangle, color: 'text-orange-500 bg-orange-50 border-orange-100' };
    }

    // 3. Dayparting check on the category
    const now = new Date();
    const currentDay = now.getDay();
    const config = cat.visibility_config || {};
    const allowedDays = config.days || [0, 1, 2, 3, 4, 5, 6];
    if (!allowedDays.includes(currentDay)) {
      return { status: 'day_blocked', label: 'Fuera de día', icon: Clock, color: 'text-blue-500 bg-blue-50 border-blue-100' };
    }
    if (cat.available_from || cat.available_to) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const parseTime = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const from = parseTime(cat.available_from);
      const to = parseTime(cat.available_to);
      if (from !== null && to !== null) {
        const inRange = from < to
          ? (currentMinutes >= from && currentMinutes <= to)
          : (currentMinutes >= from || currentMinutes <= to);
        if (!inRange) {
          return { status: 'time_blocked', label: 'Fuera de horario', icon: Clock, color: 'text-blue-500 bg-blue-50 border-blue-100' };
        }
      }
    }

    return { status: 'visible', label: 'Visible', icon: Eye, color: 'text-green-600 bg-green-50 border-green-100' };
  }, [locationFilter, categories]);

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

    // Brand Concept Filtering
    const matchBrand = brandFilter === 'all' || p.brand_concept === brandFilter;

    // Location Filtering (The core of the Master Catalog concept)
    let matchLocation = true;
    if (locationFilter !== 'all') {
      const locStatus = p.location_product_status?.find(s => s.location_id === locationFilter);
      // Strict 'Empty by Default' rule:
      const isAssigned = locStatus && locStatus.is_active === true;

      if (showUnassigned) {
        matchLocation = !isAssigned; // Show only products NOT in this location
      } else {
        matchLocation = isAssigned;  // Show only products IN this location
      }
    }

    return matchSearch && matchCat && matchAttr && matchMargin && matchBrand && matchLocation;
  }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleEdit   = (p) => { setEditingProduct(p); setIsFormOpen(true); setConfirmDelete(null); };
  const handleCreate = ()  => { setEditingProduct(null); setIsFormOpen(true); setConfirmDelete(null); };
  const handleDelete = async (id) => {
    await deleteProduct(id);
    setConfirmDelete(null);
  };
  const handleSave = async (data, overrides) => {
    const result = editingProduct
      ? await updateProduct(editingProduct.id, data)
      : await createProduct(data);
    
    if (result) {
      const productId = editingProduct?.id || result.id;
      if (productId && overrides) {
        const structuredOverrides = {
          prices: overrides.map(o => {
            const parsed = typeof o.price === 'string' ? parseFloat(o.price) : o.price;
            return { 
              location_id: o.location_id, 
              price: (parsed === '' || parsed === null || isNaN(parsed)) ? null : parsed
            };
          }),
          status: overrides.map(o => ({
            location_id: o.location_id,
            is_active: o.is_active,
            stock_status: o.stock_status
          }))
        };
        await saveProductOverrides(productId, structuredOverrides);
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      // Ensure preview updates
      if (refetchMenuData) refetchMenuData();
    }
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
          <div className="flex-1 min-w-[300px] group relative">
            <SearchInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <SelectInput value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectInput>
            </div>
            <div className="w-40">
              <SelectInput value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
                <option value="all">Concepto: Todos</option>
                {brandConceptOptions.map(concept => (
                  <option key={concept.value} value={concept.value}>{concept.label}</option>
                ))}
              </SelectInput>
            </div>

            <div className="w-48">
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


            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Atributos:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'upsell', label: '✨' },
                { id: 'no_kitchen', label: '❄️' },
                { id: 'packaging', label: '📦' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAttrFilter(f.id)}
                  title={f.label === 'Todos' ? 'Todos' : f.label}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[14px] transition-all border ${
                    attrFilter === f.id 
                    ? 'bg-[#2f4131] text-white border-[#2f4131]' 
                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {f.id === 'all' ? 'All' : f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Margen:</span>
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
                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {f.id === 'all' ? 'All' : f.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
               {catFilter !== 'all' && (
                <button 
                  onClick={enterReorderMode}
                  className="px-4 py-2.5 text-[13px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <DragHandle />
                  Ordenar
                </button>
              )}
              <button 
                onClick={() => setIsBulkEditorOpen(true)}
                className="px-4 py-2.5 text-[13px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Costos
              </button>
            </div>

            {locationFilter !== 'all' && (
              <button 
                onClick={() => setIsLinkModalOpen(true)}
                className="px-4 py-2.5 text-[13px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
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
              {locationFilter !== 'all' && <Th>Menú Público</Th>}
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
                  <td colSpan={locationFilter !== 'all' ? 14 : 13} className="px-5 py-3 bg-red-50">
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
                    {product.subcategory ? (
                      <span className="text-[11px] font-semibold text-blue-600 px-2 py-0.5 bg-blue-50/50 rounded-full border border-blue-100/50">
                        {product.subcategory}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic">—</span>
                    )}
                  </td>

                  {/* Precio */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {(() => {
                      // If a specific location is filtered, look for an override
                      const locPrice = (locationFilter !== 'all') 
                        ? product.location_product_prices?.find(lp => lp.location_id === locationFilter)?.price 
                        : null;
                      
                      const displayPrice = locPrice !== null && locPrice !== undefined ? locPrice : product.price;
                      const isOverridden = locPrice !== null && locPrice !== undefined;

                      return (
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-gray-900 tabular-nums">
                            {formatCOP(displayPrice)}
                          </p>
                          {isOverridden && (
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tight">Precio de sede</span>
                          )}
                        </div>
                      );
                    })()}
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

                  {/* Menú Público — Visibility Helper */}
                  {locationFilter !== 'all' && (() => {
                    const vis = getVisibilityStatus(product);
                    const Icon = vis.icon;
                    return (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          title={vis.label}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${vis.color}`}
                        >
                          {Icon && <Icon size={13} strokeWidth={2.5} />}
                          {vis.label}
                        </span>
                      </td>
                    );
                  })()}

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
                <td colSpan={locationFilter !== 'all' ? 14 : 13} className="px-5 py-16 text-center text-gray-400 text-sm font-medium">
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
          modifierGroups={modifierGroups}
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

      {/* Catalog Link Modal */}
      <LinkCatalogModal 
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          fetchProducts(activeLocationId);
          if (refetchMenuData) refetchMenuData();
        }}
        type="product"
        locationId={activeLocationId}
        locationName={activeLocation?.name || 'Sede'}
      />
    </div>
  );
}
