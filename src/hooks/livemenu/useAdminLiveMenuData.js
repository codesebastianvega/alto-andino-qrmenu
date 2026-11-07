import { useState, useMemo, useEffect } from 'react';
import { useAdminProducts } from '../useAdminProducts';
import { useAdminModifierGroups } from '../useAdminModifierGroups';
import { useAdminIngredients } from '../useAdminIngredients';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { toast } from '../../components/Toast';
import { supabase } from '../../config/supabase';

export function useAdminLiveMenuData() {
  const { activeBrand } = useAuth();
  const { activeLocationId } = useLocation();
  const { categories } = useMenuData();

  // Products hook (optimistic stock updates)
  const { 
    products, 
    toggleStock, 
    refreshProducts
  } = useAdminProducts();

  // Modifier Groups hook
  const { 
    modifierGroups, 
    updateOption, 
    createOption, 
    deleteOption
  } = useAdminModifierGroups(activeLocationId);

  // Ingredients hook (para vincular opciones a insumos)
  const { ingredients } = useAdminIngredients();

  // 2 Modos: 'products' | 'modifiers'
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOffFilter, setOnlyOffFilter] = useState(false);
  
  // Por defecto TODOS los desplegables están RECOGIDOS (false = cerrado)
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Plato seleccionado para el panel derecho de Modificadores
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Modal de Platos Vinculados a un Modificador
  const [viewingLinkedDishesGroup, setViewingLinkedDishesGroup] = useState(null);

  // Quick Add Option State
  const [addOptionTargetGroup, setAddOptionTargetGroup] = useState(null);
  const [newOptionForm, setNewOptionForm] = useState({ name: '', price: 0, ingredient_id: '' });
  const [isSubmittingOption, setIsSubmittingOption] = useState(false);

  // Auto-86 Cascade State & Modal
  const [cascadeModal, setCascadeModal] = useState(null);
  const [cascadePausedDishes, setCascadePausedDishes] = useState({});

  // Emergency Menu Pause Modal
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyAction, setEmergencyAction] = useState('pause'); // 'pause' | 'resume'

  // Daily Special Modal
  const [isDailySpecialOpen, setIsDailySpecialOpen] = useState(false);

  // Auto-sync Sopa del Día
  useEffect(() => {
    if (!modifierGroups || modifierGroups.length === 0) return;
    const soupGroup = modifierGroups.find(g => 
      g.id === 'b0000b20-0000-4000-a000-000000000002' || g.name.toLowerCase().includes('sopa')
    );
    const soupOpt = soupGroup?.options?.find(o => 
      o.id === 'b0000b22-0000-4000-a000-000000000002' || o.name.toLowerCase().includes('tomate') || o.name.toLowerCase().includes('ramen')
    );
    if (soupOpt && !soupOpt.name.toLowerCase().includes('sopita del día') && !soupOpt.name.toLowerCase().includes('sopita del dia')) {
      updateOption(soupOpt.id, {
        name: '🥣 Sopita del Día (16 oz)',
        stock_status: 'in',
        is_active: true
      });
    }
  }, [modifierGroups, updateOption]);

  // Computed Statistics
  const totalProducts = products.length;
  const offProducts = products.filter(p => p.stock_status === 'out');
  const onProductsCount = totalProducts - offProducts.length;

  const allOptions = useMemo(() => {
    return modifierGroups.flatMap(g => (g.options || []).map(opt => ({ ...opt, groupName: g.name, groupId: g.id })));
  }, [modifierGroups]);

  const offOptions = allOptions.filter(o => !o.is_active || o.stock_status === 'out');
  const totalOffItems = offProducts.length + offOptions.length;

  // Selected Product Object
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Selected Product Modifier Groups
  const selectedProductGroups = useMemo(() => {
    if (!selectedProduct || !selectedProduct.modifier_groups) return [];
    const groupIds = Array.isArray(selectedProduct.modifier_groups) ? selectedProduct.modifier_groups : [];
    return modifierGroups.filter(g => groupIds.includes(g.id));
  }, [selectedProduct, modifierGroups]);

  // Map of dish counts linked to each modifier group
  const dishCountByGroup = useMemo(() => {
    const counts = {};
    modifierGroups.forEach(g => {
      counts[g.id] = products.filter(p => Array.isArray(p.modifier_groups) && p.modifier_groups.includes(g.id)).length;
    });
    return counts;
  }, [modifierGroups, products]);

  // Filtered Products (Left Panel)
  const filteredProductsByCategory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    const grouped = {};
    (categories || []).forEach(cat => {
      grouped[cat.id] = { category: cat, items: [] };
    });
    grouped['uncategorized'] = { category: { id: 'uncategorized', name: 'Sin Categoría' }, items: [] };

    products.forEach(p => {
      if (p.is_addon) return;
      if (onlyOffFilter && p.stock_status !== 'out') return;
      if (q && !p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) {
        return;
      }

      const catId = p.category_id && grouped[p.category_id] ? p.category_id : 'uncategorized';
      grouped[catId].items.push(p);
    });

    return Object.values(grouped).filter(g => g.items.length > 0);
  }, [products, categories, searchQuery, onlyOffFilter]);

  // Filtered Modifier Groups
  const filteredModifierGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return modifierGroups.filter(g => {
      if (!q) return true;
      const matchName = g.name.toLowerCase().includes(q);
      const matchOpt = (g.options || []).some(o => o.name.toLowerCase().includes(q));
      return matchName || matchOpt;
    });
  }, [modifierGroups, searchQuery]);

  // Handlers
  const toggleCategoryCollapse = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleGroupCollapse = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Toggle Product Stock with optimistic chip
  const handleProductStockToggle = async (product) => {
    const current = product.stock_status || 'in';
    await toggleStock(product.id, current);
  };

  // Toggle Modifier Option Stock & Check for Cascade
  const handleOptionToggle = async (option, group) => {
    const isCurrentlyActive = option.is_active !== false && option.stock_status !== 'out';
    const nextActive = !isCurrentlyActive;
    const nextStock = nextActive ? 'in' : 'out';

    if (!nextActive) {
      const affected = products.filter(p => {
        if (!p.modifier_groups) return false;
        return Array.isArray(p.modifier_groups) && p.modifier_groups.includes(group.id);
      });

      const activeAffected = affected.filter(p => p.stock_status !== 'out');
      if (activeAffected.length > 1) {
        setCascadeModal({
          type: 'turn_off',
          option,
          group,
          affectedProducts: activeAffected,
          selectedDishIds: activeAffected.map(p => p.id)
        });
        return;
      }
    } else {
      const previouslyPaused = cascadePausedDishes[option.id] || [];
      if (previouslyPaused.length > 0) {
        const dishesToRestore = products.filter(p => previouslyPaused.includes(p.id) && p.stock_status === 'out');
        if (dishesToRestore.length > 0) {
          setCascadeModal({
            type: 'turn_on',
            option,
            group,
            affectedProducts: dishesToRestore,
            selectedDishIds: dishesToRestore.map(p => p.id)
          });
          return;
        }
      }
    }

    await updateOption(option.id, { is_active: nextActive, stock_status: nextStock });
  };

  // Confirm Cascade Execution
  const handleConfirmCascade = async () => {
    if (!cascadeModal) return;
    const { type, option, selectedDishIds } = cascadeModal;

    if (type === 'turn_off') {
      await updateOption(option.id, { is_active: false, stock_status: 'out' });

      if (selectedDishIds.length > 0) {
        for (const dishId of selectedDishIds) {
          await supabase
            .from('products')
            .update({ stock_status: 'out' })
            .eq('id', dishId)
            .eq('brand_id', activeBrand?.id);
        }
        setCascadePausedDishes(prev => ({ ...prev, [option.id]: selectedDishIds }));
        toast(`⚠️ ${option.name} agotado. Se pausaron ${selectedDishIds.length} platos en cascada.`);
        refreshProducts('all', { silent: true });
      }
    } else if (type === 'turn_on') {
      await updateOption(option.id, { is_active: true, stock_status: 'in' });

      if (selectedDishIds.length > 0) {
        for (const dishId of selectedDishIds) {
          await supabase
            .from('products')
            .update({ stock_status: 'in' })
            .eq('id', dishId)
            .eq('brand_id', activeBrand?.id);
        }
        setCascadePausedDishes(prev => {
          const next = { ...prev };
          delete next[option.id];
          return next;
        });
        toast(`🟢 ${option.name} activado. Se reactivaron ${selectedDishIds.length} platos.`);
        refreshProducts('all', { silent: true });
      }
    }

    setCascadeModal(null);
  };

  // Quick Add Option to Group
  const handleQuickAddOption = async (e) => {
    e.preventDefault();
    if (!addOptionTargetGroup || !newOptionForm.name.trim()) return;

    try {
      setIsSubmittingOption(true);
      const payload = {
        group_id: addOptionTargetGroup.id,
        name: newOptionForm.name.trim(),
        price: parseFloat(newOptionForm.price) || 0,
        extra_price: parseFloat(newOptionForm.price) || 0,
        ingredient_id: newOptionForm.ingredient_id || null,
        is_active: true,
        stock_status: 'in'
      };

      await createOption(payload);
      toast(`Opción "${payload.name}" agregada`);
      setAddOptionTargetGroup(null);
      setNewOptionForm({ name: '', price: 0, ingredient_id: '' });
    } catch (err) {
      console.error('Error adding option:', err);
      toast('Error al agregar opción');
    } finally {
      setIsSubmittingOption(false);
    }
  };

  // Emergency Bulk Toggle (All Menu)
  const handleEmergencyMenuToggle = async () => {
    const nextStatus = emergencyAction === 'pause' ? 'out' : 'in';
    try {
      await supabase
        .from('products')
        .update({ stock_status: nextStatus })
        .eq('brand_id', activeBrand?.id)
        .eq('is_active', true);

      setShowEmergencyModal(false);
      refreshProducts('all', { silent: true });
      toast(emergencyAction === 'pause' ? '🛑 Carta pausada temporalmente' : '🟢 Carta reactivada por completo');
    } catch (err) {
      console.error('Error bulk updating menu:', err);
      toast('Error al modificar estado del menú');
    }
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    onlyOffFilter,
    setOnlyOffFilter,
    expandedCategories,
    expandedGroups,
    selectedProductId,
    setSelectedProductId,
    viewingLinkedDishesGroup,
    setViewingLinkedDishesGroup,
    addOptionTargetGroup,
    setAddOptionTargetGroup,
    newOptionForm,
    setNewOptionForm,
    isSubmittingOption,
    cascadeModal,
    setCascadeModal,
    showEmergencyModal,
    setShowEmergencyModal,
    emergencyAction,
    setEmergencyAction,
    isDailySpecialOpen,
    setIsDailySpecialOpen,
    ingredients,
    refreshProducts,
    deleteOption,
    updateOption,
    totalProducts,
    offProducts,
    onProductsCount,
    totalOffItems,
    selectedProduct,
    selectedProductGroups,
    dishCountByGroup,
    filteredProductsByCategory,
    filteredModifierGroups,
    toggleCategoryCollapse,
    toggleGroupCollapse,
    handleProductStockToggle,
    handleOptionToggle,
    handleConfirmCascade,
    handleQuickAddOption,
    handleEmergencyMenuToggle
  };
}
