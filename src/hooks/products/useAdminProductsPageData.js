import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useAdminProducts } from '../useAdminProducts';
import { useCategories } from '../useCategories';
import { useMenuData } from '../../context/MenuDataContext';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../usePlan';
import { useAdminRecipes } from '../useAdminRecipes';
import { useAdminIngredients } from '../useAdminIngredients';
import { useAdminModifierGroups } from '../useAdminModifierGroups';
import { useAllergens } from '../useAllergens';
import { useLocationOverrides } from '../useLocationOverrides';
import { useRestaurantSettings } from '../useRestaurantSettings';
import { Eye, EyeOff, Clock, AlertTriangle } from 'lucide-react';

export const STOCK_BADGE = {
  in:  { label: 'Disponible', variant: 'green' },
  low: { label: 'Stock bajo', variant: 'amber' },
  out: { label: 'Agotado',    variant: 'red'   },
};

const SYSTEM_CONCEPT_IDS = new Set(['operations_model', 'telegram_dispatch']);

export const normalizeBrandConcepts = (concepts = []) => {
  if (!Array.isArray(concepts)) return [];
  return concepts
    .filter((concept) => {
      if (!concept) return false;
      if (typeof concept === 'string') return concept.trim().length > 0;
      if (typeof concept === 'object') {
        if (SYSTEM_CONCEPT_IDS.has(concept.id)) return false;
        if (concept.fulfillment_modes || concept.bot_token) return false;
        return Boolean(concept.name || concept.label);
      }
      return false;
    })
    .map((concept) => {
      if (typeof concept === 'string') {
        return { value: concept, label: concept };
      }
      const label = concept.name || concept.label;
      return { value: label, label };
    });
};

export function useAdminProductsPageData() {
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
    fetchCategories('all');
  }, [fetchCategories]);

  const [locationFilter, setLocationFilter] = useState(activeLocationId || 'all');

  useEffect(() => {
    setLocationFilter(activeLocationId || 'all');
  }, [activeLocationId]);

  const { activePlan } = useAuth();
  const { withinLimit, isWithinProductLimit, planName, isTrialActive } = usePlan();
  const { recipes, fetchRecipes } = useAdminRecipes();
  const { ingredients, fetchIngredients } = useAdminIngredients();
  const { modifierGroups, fetchModifierGroups } = useAdminModifierGroups(activeLocationId);
  const { allergens, loading: loadingAllergens } = useAllergens();

  useEffect(() => {
    fetchIngredients('all');
  }, [fetchIngredients]);

  const { saveProductOverrides } = useLocationOverrides();
  const [search, setSearch] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [attrFilter, setAttrFilter] = useState('all');
  const [marginFilter, setMarginFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const hasActiveFilters = catFilter !== 'all' || attrFilter !== 'all' || marginFilter !== 'all' || locationFilter !== 'all';

  const { settings } = useRestaurantSettings();
  const brandConceptOptions = normalizeBrandConcepts(settings?.brand_concepts || []);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);
  const [isDailySpecialOpen, setIsDailySpecialOpen] = useState(false);

  // Reorder mode state
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedList, setOrderedList] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const maxProducts = activePlan?.max_products ?? null;

  useEffect(() => { 
    fetchRecipes(); 
    fetchModifierGroups();
  }, [fetchRecipes, fetchModifierGroups]);

  const enterReorderMode = useCallback(() => {
    if (catFilter === 'all') return;
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

  const getVisibilityStatus = useCallback((product) => {
    if (locationFilter === 'all') return { status: 'no_filter', label: '—', icon: null, color: '' };

    const locStatus = product.location_product_status?.find(s => s.location_id === locationFilter);
    if (!locStatus || locStatus.is_active === false) {
      return { status: 'not_linked', label: 'No vinculado', icon: EyeOff, color: 'text-red-500 bg-red-50 border-red-100' };
    }

    const cat = categories.find(c => c.id === product.category_id);
    if (!cat) {
      return { status: 'no_category', label: 'Sin categoría', icon: AlertTriangle, color: 'text-orange-500 bg-orange-50 border-orange-100' };
    }
    const catLinked = cat.location_categories?.some(lc => lc.location_id === locationFilter && lc.is_active !== false);
    if (!catLinked) {
      return { status: 'cat_not_linked', label: 'Cat. no vinculada', icon: AlertTriangle, color: 'text-orange-500 bg-orange-50 border-orange-100' };
    }

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

  const isAtLimit = !isTrialActive && !isWithinProductLimit;

  const filtered = products.filter(p => {
    if (p.is_addon) return false;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || p.category_id === catFilter;

    let matchAttr = true;
    if (attrFilter === 'upsell') matchAttr = p.is_upsell;
    else if (attrFilter === 'kitchen') matchAttr = p.station === 'kitchen' || (!p.station && p.requires_kitchen !== false);
    else if (attrFilter === 'bar') matchAttr = p.station === 'bar';
    else if (attrFilter === 'no_kitchen') matchAttr = p.station === 'none' || p.requires_kitchen === false;
    else if (attrFilter === 'packaging') matchAttr = (p.packaging_fee || 0) > 0;

    let matchMargin = true;
    if (marginFilter !== 'all') {
      if (p.price > 0 && (p.cost || 0) > 0) {
        const margin = ((p.price - (p.cost || 0)) / p.price) * 100;
        if (marginFilter === 'high') matchMargin = margin >= 45;
        else if (marginFilter === 'med') matchMargin = margin >= 25 && margin < 45;
        else if (marginFilter === 'low') matchMargin = margin < 25;
      } else {
        matchMargin = false;
      }
    }

    const matchBrand = brandFilter === 'all' || p.brand_concept === brandFilter;

    let matchLocation = true;
    if (locationFilter !== 'all') {
      const locStatus = p.location_product_status?.find(s => s.location_id === locationFilter);
      const isAssigned = locStatus && locStatus.is_active === true;

      if (showUnassigned) {
        matchLocation = !isAssigned;
      } else {
        matchLocation = isAssigned;
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
      if (refetchMenuData) refetchMenuData();
    }
  };

  const isLoading = (loadingProd && products.length === 0) || (loadingCats && categories.length === 0);

  return {
    // Data & loading
    products,
    categories,
    recipes,
    ingredients,
    modifierGroups,
    allergens,
    locations,
    activeLocation,
    activeLocationId,
    isLoading,
    isAtLimit,
    maxProducts,
    planName,
    isTrialActive,

    // Filters
    search,
    setSearch,
    isFiltersOpen,
    setIsFiltersOpen,
    catFilter,
    setCatFilter,
    attrFilter,
    setAttrFilter,
    marginFilter,
    setMarginFilter,
    brandFilter,
    setBrandFilter,
    locationFilter,
    setLocationFilter,
    showUnassigned,
    setShowUnassigned,
    hasActiveFilters,
    brandConceptOptions,
    filtered,

    // Reorder mode
    reorderMode,
    orderedList,
    dragIdx,
    overIdx,
    enterReorderMode,
    exitReorderMode,
    saveOrder,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,

    // Modals & form state
    isFormOpen,
    setIsFormOpen,
    editingProduct,
    setEditingProduct,
    confirmDelete,
    setConfirmDelete,
    isBulkEditorOpen,
    setIsBulkEditorOpen,
    isDailySpecialOpen,
    setIsDailySpecialOpen,
    isLinkModalOpen,
    setIsLinkModalOpen,

    // Actions
    handleEdit,
    handleCreate,
    handleDelete,
    handleSave,
    toggleActive,
    toggleStock,
    bulkUpdateCosts,
    fetchProducts,
    refetchMenuData,
    getVisibilityStatus,
  };
}
