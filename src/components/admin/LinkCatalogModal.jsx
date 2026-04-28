import React, { useState, useMemo, useEffect } from 'react';
import { 
  Modal, 
  ModalHeader, 
  SearchInput, 
  PrimaryButton, 
  GhostButton,
  Badge
} from './ui';
import { useLinkCatalog } from '../../hooks/useLinkCatalog';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useCategories } from '../../hooks/useCategories';
import { useAdminRecipes } from '../../hooks/useAdminRecipes';
import { useAdminIngredients } from '../../hooks/useAdminIngredients';
import { useAdminModifierGroups } from '../../hooks/useAdminModifierGroups';
import { 
  Check, 
  Plus, 
  Search, 
  Package, 
  Layers, 
  ClipboardList, 
  Box,
  Link as LinkIcon,
  X,
  CheckCheck,
  XCircle
} from 'lucide-react';

const ENTITY_CONFIG = {
  product: {
    title: 'Productos',
    icon: Package,
    useHook: useAdminProducts,
    dataKey: 'products',
    refreshKey: 'refreshProducts',
    nameField: 'name',
    subField: 'category.name'
  },
  category: {
    title: 'Categorías',
    icon: Layers,
    useHook: useCategories,
    dataKey: 'categories',
    refreshKey: 'fetchCategories',
    nameField: 'name',
    subField: 'total_products'
  },
  recipe: {
    title: 'Recetas',
    icon: ClipboardList,
    useHook: useAdminRecipes,
    dataKey: 'recipes',
    refreshKey: 'fetchRecipes',
    nameField: 'name',
    subField: 'description'
  },
  inventory: {
    title: 'Insumos',
    icon: Box,
    useHook: useAdminIngredients,
    dataKey: 'ingredients',
    refreshKey: 'fetchIngredients',
    nameField: 'name',
    subField: 'usage_unit'
  },
  modifier_group: {
    title: 'Grupos de Modificadores',
    icon: ClipboardList,
    useHook: useAdminModifierGroups,
    dataKey: 'modifierGroups',
    refreshKey: 'fetchModifierGroups',
    nameField: 'name',
    subField: 'description'
  }
};

export const LinkCatalogModal = ({ isOpen, onClose, type, locationId, locationName }) => {
  const config = ENTITY_CONFIG[type];
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilterModal, setCatFilterModal] = useState('all');
  
  // Hooks
  const entityHook = config.useHook();
  const allItems = entityHook[config.dataKey] || [];
  const isLoadingItems = entityHook.loading;
  
  const { 
    linkedIds, 
    isLoading: isLoadingLinks, 
    linkItem, 
    unlinkItem,
    refresh: refreshLinks 
  } = useLinkCatalog(locationId, type);

  // Sync links when modal opens
  useEffect(() => {
    if (isOpen && locationId) {
      refreshLinks();
    }
  }, [isOpen, locationId, refreshLinks]);

  // Unique categories from product items (only relevant for product type)
  const uniqueCategories = useMemo(() => {
    if (type !== 'product') return [];
    const catMap = new Map();
    allItems.forEach(item => {
      const catName = item.category?.name;
      const catId = item.category_id;
      if (catId && catName && !catMap.has(catId)) catMap.set(catId, catName);
    });
    return Array.from(catMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItems, type]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    // Category filter (products only)
    if (type === 'product' && catFilterModal !== 'all') {
      items = items.filter(item => item.category_id === catFilterModal);
    }
    // Search filter
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      items = items.filter(item => 
        item[config.nameField]?.toLowerCase().includes(lowSearch) ||
        (typeof item[config.subField] === 'string' && item[config.subField]?.toLowerCase().includes(lowSearch))
      );
    }
    return items;
  }, [allItems, searchTerm, config, catFilterModal, type]);

  const linkedCount = useMemo(() => linkedIds.length, [linkedIds]);

  const handleToggle = async (itemId) => {
    const isLinked = linkedIds.includes(itemId);
    if (isLinked) {
      await unlinkItem(itemId);
    } else {
      const result = await linkItem(itemId);
      // Cascading link: auto-link the product's category + modifier groups to this location
      if (result?.success && type === 'product') {
        const product = allItems.find(p => p.id === itemId);
        if (product?.category_id) {
          await linkItem('category', locationId, product.category_id);
        }
        // Auto-link modifier groups
        if (Array.isArray(product?.modifier_groups)) {
          for (const mgId of product.modifier_groups) {
            await linkItem('modifier_group', locationId, mgId);
          }
        }
      }
    }
  };

  const handleBulkLink = async () => {
    const unlinkedItems = filteredItems.filter(item => !linkedIds.includes(item.id));
    for (const item of unlinkedItems) {
      await linkItem(item.id);
      // Cascading category + modifier group links for products
      if (type === 'product') {
        if (item.category_id) {
          await linkItem('category', locationId, item.category_id);
        }
        if (Array.isArray(item.modifier_groups)) {
          for (const mgId of item.modifier_groups) {
            await linkItem('modifier_group', locationId, mgId);
          }
        }
      }
    }
    await refreshLinks();
  };

  const handleBulkUnlink = async () => {
    const linkedItems = filteredItems.filter(item => linkedIds.includes(item.id));
    for (const item of linkedItems) {
      await unlinkItem(item.id);
    }
    await refreshLinks();
  };

  if (!config) return null;

  const Icon = config.icon;
  const visibleLinkedCount = filteredItems.filter(item => linkedIds.includes(item.id)).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <LinkIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Vincular {config.title}</h3>
            <p className="text-sm text-gray-500">Sede: {locationName}</p>
          </div>
        </div>
      </ModalHeader>

      <div className="p-6 space-y-4">
        {/* Search + Category Filter + Bulk Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Buscar ${config.title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {type === 'product' && uniqueCategories.length > 0 && (
            <select
              value={catFilterModal}
              onChange={(e) => setCatFilterModal(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            >
              <option value="all">Todas las categorías</option>
              {uniqueCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkLink}
              disabled={isLoadingLinks}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-all disabled:opacity-50"
            >
              <CheckCheck size={14} />
              Vincular visibles
            </button>
            <button
              onClick={handleBulkUnlink}
              disabled={isLoadingLinks}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
            >
              <XCircle size={14} />
              Desvincular visibles
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
          {isLoadingItems || isLoadingLinks ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Cargando catálogo maestro...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full text-gray-400 mb-3">
                <Search size={24} />
              </div>
              <p className="text-gray-500">No se encontraron {config.title.toLowerCase()}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredItems.map((item) => {
                const isLinked = linkedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggle(item.id)}
                    className={`group relative flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                      isLinked 
                        ? 'border-indigo-200 bg-indigo-50/60 ring-1 ring-indigo-200' 
                        : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    {/* Check indicator */}
                    <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isLinked ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-400'
                    }`}>
                      {isLinked ? <Check size={11} strokeWidth={3} /> : <Plus size={11} strokeWidth={3} />}
                    </div>

                    <p className="text-[13px] font-semibold text-gray-900 leading-tight pr-6 line-clamp-2">{item[config.nameField]}</p>
                    <p className="text-[11px] text-gray-400 mt-1 truncate w-full">
                      {type === 'category' ? `${item.total_products || 0} productos` : 
                       type === 'product' ? (item.category?.name || 'Sin cat.') :
                       type === 'inventory' ? item.usage_unit :
                       (item[config.subField] || '')}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-2xl">
        <span className="text-[12px] font-semibold text-gray-400">
          {visibleLinkedCount} de {filteredItems.length} vinculados · {linkedCount} total en sede
        </span>
        <GhostButton onClick={onClose}>Listo</GhostButton>
      </div>
    </Modal>
  );
};
