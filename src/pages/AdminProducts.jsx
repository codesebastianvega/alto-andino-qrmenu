import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  const { withinLimit, isWithinProductLimit, planName } = usePlan();
  const { recipes, fetchRecipes } = useAdminRecipes();
  const { modifierGroups, fetchModifierGroups } = useAdminModifierGroups(activeLocationId);
  const { allergens, loading: loadingAllergens } = useAllergens();
  const { saveProductOverrides } = useLocationOverrides();
  const [search, setSearch] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [attrFilter, setAttrFilter] = useState('all'); // 'all', 'upsell', 'no_kitchen', 'packaging'
  const [marginFilter, setMarginFilter] = useState('all'); // 'all', 'high', 'med', 'low'
  const [brandFilter, setBrandFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState(activeLocationId || 'all'); // 'all' or location_id
  const [showUnassigned, setShowUnassigned] = useState(false); // To show products not yet in this location
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const hasActiveFilters = catFilter !== 'all' || attrFilter !== 'all' || marginFilter !== 'all' || locationFilter !== 'all';
  
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

  const isAtLimit = !isWithinProductLimit;

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
        <div className="flex flex-row items-center justify-between gap-3 w-full sm:w-auto sm:justify-start">
          <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-gray-500 shadow-sm italic flex flex-col items-start sm:items-end shrink-0">
            <span className="text-[8px] text-gray-400 leading-none mb-0.5">Cupo de Catálogo</span>
            <span className={`text-[10px] leading-none ${isAtLimit ? 'text-orange-600' : 'text-gray-900'}`}>
              {products.length} / {maxProducts} PRODS
            </span>
          </div>
          
          <PrimaryButton 
            onClick={handleCreate} 
            disabled={isAtLimit}
            className="flex-1 sm:flex-initial py-2.5 px-4 text-xs sm:text-sm sm:py-3 sm:px-6 shadow-xl"
          >
            {isAtLimit ? 'Límite alcanzado' : '+ Nuevo Producto'}
          </PrimaryButton>
        </div>
      </PageHeader>

      {/* Product Limit Banner */}
      {!isWithinProductLimit && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100 rounded-[2rem] p-6 mb-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-500 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Límite de productos alcanzado
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Has alcanzado el límite de productos de tu plan <span className="font-bold text-orange-600 uppercase">{planName}</span>. 
                Mejora tu plan para seguir expandiendo tu menú.
              </p>
            </div>
          </div>
          <Link 
            to="/admin/settings?tab=plan"
            className="px-6 py-2.5 bg-gray-900 text-white text-[13px] font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shrink-0"
          >
            Ver Planes
          </Link>
        </div>
      )}

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
            {/* Pequeño punto indicador si hay filtros aplicados y el panel está cerrado */}
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
          <div className="w-full md:w-auto min-w-[150px]">
            <SelectInput value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
              <option value="all">Concepto: Todos</option>
              {brandConceptOptions.map(concept => (
                <option key={concept.value} value={concept.value}>{concept.label}</option>
              ))}
            </SelectInput>
          </div>

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
                onClick={enterReorderMode}
                className="flex-1 md:flex-initial px-4 py-2.5 text-[13px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <DragHandle />
                Ordenar
              </button>
             )}
            <button 
              onClick={() => setIsBulkEditorOpen(true)}
              className="flex-1 md:flex-initial px-4 py-2.5 text-[13px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Costos
            </button>
            {locationFilter !== 'all' && (
              <button 
                onClick={() => setIsLinkModalOpen(true)}
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

      {/* Desktop Table */}
      <div className="hidden md:block">
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
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {filtered.map((product, idx) => {
          const stock = STOCK_BADGE[product.stock_status] || STOCK_BADGE.out;
          const catName = product.category?.name || product.categories?.name;
          const isDelConf = confirmDelete === product.id;

          // Vista de confirmación de eliminación en móvil
          if (isDelConf) return (
            <div key={product.id} className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col gap-3">
              <p className="text-sm font-bold text-red-700">¿Eliminar "{product.name}"? No se puede deshacer.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleDelete(product.id)} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase">Eliminar</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-xs font-black uppercase">Cancelar</button>
              </div>
            </div>
          );

          // Tarjeta Premium de Producto
          return (
            <div key={product.id} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col gap-3 relative overflow-hidden">
              {/* Header de Tarjeta: Info Principal */}
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shrink-0 bg-gray-50 flex items-center justify-center">
                  <AAImage src={product.image_url} alt={product.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">{catName || 'Sin cat.'}</p>
                  <h4 className="text-base font-black text-gray-900 leading-tight truncate">{product.name}</h4>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">{formatCOP(product.price)}</p>
                </div>
                {/* Botones de acción arriba a la derecha */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => handleEdit(product)} className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-500 rounded-lg border border-gray-100 active:scale-95">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button onClick={() => setConfirmDelete(product.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg border border-red-100 active:scale-95">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              {/* Footer de Tarjeta: Toggles Rápidos (Stock y Estado) */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <button onClick={() => toggleStock(product.id, product.stock_status)} className="active:scale-95 transition-transform">
                  <Badge variant={stock.variant}>{stock.label}</Badge>
                </button>
                
                <button onClick={() => toggleActive(product.id, product.is_active)} className="active:scale-95 transition-transform">
                  <Badge variant={product.is_active ? 'green' : 'red'}>
                    {product.is_active ? 'Activo (Visible)' : 'Oculto'}
                  </Badge>
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sin resultados</p>
          </div>
        )}
      </div>

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
