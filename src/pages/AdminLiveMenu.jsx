import React, { useState, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, AlertTriangle, CheckCircle2, 
  Plus, Trash2, ChevronDown, ChevronRight, 
  ArrowLeft, Utensils, Sparkles, X, ShieldAlert,
  Layers, Package, Flame, Link2
} from 'lucide-react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useAdminModifierGroups } from '../hooks/useAdminModifierGroups';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useMenuData } from '../context/MenuDataContext';
import { formatCOP } from '../utils/money';
import AAImage from '../components/ui/AAImage';
import { toast } from '../components/Toast';
import { supabase } from '../config/supabase';

export default function AdminLiveMenu() {
  const { activeBrand } = useAuth();
  const { activeLocationId } = useLocation();
  const { categories, restaurantSettings } = useMenuData();

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

  // View & Filter States (2 modos limpios: 'products' | 'modifiers')
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'modifiers'
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOffFilter, setOnlyOffFilter] = useState(false);
  
  // Por defecto TODOS los desplegables están RECOGIDOS (false = cerrado)
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Selected Product for Column 3
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

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

  // ─── Computed Statistics ──────────────────────────────────────────────────
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

  // ─── Filtered Products (Column 2) ─────────────────────────────────────────
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

  // ─── Filtered Modifier Groups (Column 2 when activeTab === 'modifiers') ──
  const filteredModifierGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return modifierGroups.filter(g => {
      if (!q) return true;
      const matchName = g.name.toLowerCase().includes(q);
      const matchOpt = (g.options || []).some(o => o.name.toLowerCase().includes(q));
      return matchName || matchOpt;
    });
  }, [modifierGroups, searchQuery]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
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
      // Find all products that have this group assigned
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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] bg-[#F8F9FA] overflow-hidden select-none">
      
      {/* ─── Top Operational Header ────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 shrink-0 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-gray-900 truncate">Carta & Opciones</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operación en Vivo
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">
              {restaurantSettings?.business_name || activeBrand?.name || 'Mi Restaurante'} · Disponibilidad de platos y modificadores
            </p>
          </div>
        </div>

        {/* Omnibox Search */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar platos o modificadores..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs font-semibold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ─── 3 Columns Workspace (Balanced Widths) ─────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══════════════════════════════════════════════════════════════════════
            COLUMNA 1: Panel de Control (Izquierda - Ancho Fijo 260px)
        ══════════════════════════════════════════════════════════════════════ */}
        <aside className="w-64 xl:w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto hidden md:flex">
          <div className="p-3.5 space-y-3.5">
            
            {/* Banner Alerta Ítems Apagados */}
            {totalOffItems > 0 && (
              <button
                onClick={() => setOnlyOffFilter(!onlyOffFilter)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 shadow-xs ${
                  onlyOffFilter 
                    ? 'bg-rose-500 text-white border-rose-600' 
                    : 'bg-rose-50 border-rose-200 hover:bg-rose-100/80 text-rose-900'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${onlyOffFilter ? 'text-white' : 'text-rose-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black leading-tight">
                    {totalOffItems} {totalOffItems === 1 ? 'ítem apagado' : 'ítems apagados'}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${onlyOffFilter ? 'text-rose-100' : 'text-rose-600 font-semibold'}`}>
                    {onlyOffFilter ? 'Filtro activo (clic para quitar)' : 'Filtrar solo apagados >'}
                  </p>
                </div>
              </button>
            )}

            {/* Vistas de Catálogo (2 Modos Claros: Platos vs Modificadores) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
                Vistas de Catálogo
              </span>

              {/* Card 1: Platos & Menú */}
              <button
                onClick={() => { setActiveTab('products'); setSelectedProductId(null); }}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  activeTab === 'products'
                    ? 'bg-emerald-50 border-emerald-300 shadow-xs ring-1 ring-emerald-400/30'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    activeTab === 'products' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    🍱
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-black truncate ${activeTab === 'products' ? 'text-emerald-950' : 'text-gray-900'}`}>
                      Platos & Menú
                    </p>
                    <p className="text-[10px] text-gray-500 font-semibold">
                      {onProductsCount} activos · {offProducts.length} agotados
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'products' ? 'text-emerald-600' : 'text-gray-400'}`} />
              </button>

              {/* Card 2: Modificadores */}
              <button
                onClick={() => { setActiveTab('modifiers'); setSelectedProductId(null); }}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  activeTab === 'modifiers'
                    ? 'bg-emerald-50 border-emerald-300 shadow-xs ring-1 ring-emerald-400/30'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    activeTab === 'modifiers' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    ⚙️
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-black truncate ${activeTab === 'modifiers' ? 'text-emerald-950' : 'text-gray-900'}`}>
                      Modificadores
                    </p>
                    <p className="text-[10px] text-gray-500 font-semibold">
                      {modifierGroups.length} grupos · {allOptions.length - offOptions.length} activas
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'modifiers' ? 'text-emerald-600' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Interruptores de Emergencia */}
            <div className="pt-3 border-t border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
                Interruptores de Cocina
              </span>
              <div className="mt-2 space-y-1.5">
                <button
                  onClick={() => { setEmergencyAction('pause'); setShowEmergencyModal(true); }}
                  className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wide border border-rose-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Pausar Toda la Carta
                </button>
                <button
                  onClick={() => { setEmergencyAction('resume'); setShowEmergencyModal(true); }}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-wide border border-emerald-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Reactivar Toda la Carta
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════════════
            COLUMNA 2: Carta Central (Ancho Proporcionado ~540px - 600px)
        ══════════════════════════════════════════════════════════════════════ */}
        <main className={`w-full md:w-[500px] lg:w-[540px] xl:w-[580px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto ${mobileDetailOpen ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Mobile Tab Selector */}
          <div className="md:hidden flex border-b border-gray-200 p-2 gap-1 bg-gray-50 shrink-0">
            {[
              { id: 'products', label: '🍱 Platos' },
              { id: 'modifiers', label: '⚙️ Modificadores' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                  activeTab === tab.id ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-3.5 sm:p-4 space-y-3.5">
            
            {/* ── MODO PRODUCTOS ── */}
            {activeTab === 'products' && (
              <div className="space-y-3">
                {filteredProductsByCategory.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <p className="text-sm font-bold">No se encontraron platos</p>
                  </div>
                ) : (
                  filteredProductsByCategory.map(({ category, items }) => {
                    // Por defecto RECOGIDO (solo se abre si expandedCategories[category.id] === true)
                    const isExpanded = !!expandedCategories[category.id];
                    const activeInCat = items.filter(p => p.stock_status !== 'out').length;

                    return (
                      <div key={category.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                        
                        {/* Header de Categoría (Por defecto cerrado) */}
                        <button
                          onClick={() => toggleCategoryCollapse(category.id)}
                          className="w-full px-3.5 py-3 bg-gray-50/80 hover:bg-gray-100/70 border-b border-gray-200 flex items-center justify-between text-left transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
                              {category.name}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full">
                              {activeInCat}/{items.length} disponibles
                            </span>
                          </div>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>

                        {/* Lista de Platos (Solo visible si está expandido) */}
                        {isExpanded && (
                          <div className="divide-y divide-gray-100">
                            {items.map(product => {
                              const isOff = product.stock_status === 'out';
                              const isSelected = selectedProductId === product.id;
                              const modCount = Array.isArray(product.modifier_groups) ? product.modifier_groups.length : 0;

                              return (
                                <div 
                                  key={product.id}
                                  className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                                    isSelected 
                                      ? 'bg-emerald-50/70 border-l-4 border-emerald-600' 
                                      : 'hover:bg-gray-50/50'
                                  }`}
                                >
                                  {/* Info Principal */}
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                      <AAImage src={product.image_url} alt={product.name} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className={`text-xs font-black truncate leading-tight ${isOff ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                        {product.name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-black text-emerald-600">
                                          {formatCOP(product.price)}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setSelectedProductId(product.id);
                                            setMobileDetailOpen(true);
                                          }}
                                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                                        >
                                          <span>Modificadores ({modCount})</span>
                                          <ChevronRight className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* CHIP DE STOCK ELEGANTE */}
                                  <div className="shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleProductStockToggle(product)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                                        !isOff 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 shadow-2xs' 
                                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80'
                                      }`}
                                      title={!isOff ? 'Disponible en carta (Clic para Agotar)' : 'Agotado (Clic para Habilitar)'}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isOff ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                      <span>{!isOff ? 'Disponible' : 'Agotado'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── MODO MODIFICADORES (Grupos) ── */}
            {activeTab === 'modifiers' && (
              <div className="space-y-3">
                {filteredModifierGroups.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <p className="text-sm font-bold">No hay grupos de modificadores</p>
                  </div>
                ) : (
                  filteredModifierGroups.map(group => {
                    // Por defecto RECOGIDO
                    const isExpanded = !!expandedGroups[group.id];
                    const options = group.options || [];
                    const linkedCount = dishCountByGroup[group.id] || 0;

                    return (
                      <div key={group.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                        <div className="px-3.5 py-3 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between gap-2">
                          
                          <button
                            onClick={() => toggleGroupCollapse(group.id)}
                            className="flex items-center gap-2 text-left flex-1 min-w-0"
                          >
                            <span className="text-xs font-black text-gray-900 uppercase tracking-wide truncate">
                              {group.name}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full shrink-0">
                              {options.length} opciones
                            </span>
                          </button>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* BOTÓN: Platos Vinculados (Abre Modal de relación) */}
                            <button
                              onClick={() => setViewingLinkedDishesGroup(group)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
                              title="Ver qué platos de la carta usan este modificador"
                            >
                              <Utensils className="w-3 h-3" />
                              <span>{linkedCount} platos</span>
                            </button>

                            {/* Botón Añadir Opción */}
                            <button
                              onClick={() => {
                                setAddOptionTargetGroup(group);
                                setNewOptionForm({ name: '', price: 0, ingredient_id: '' });
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Opción</span>
                            </button>

                            {/* Flecha Desplegable */}
                            <button onClick={() => toggleGroupCollapse(group.id)} className="text-gray-400 p-0.5">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Opciones del Grupo (Visible solo si está desplegado) */}
                        {isExpanded && (
                          <div className="divide-y divide-gray-100">
                            {options.map(opt => {
                              const isOff = !opt.is_active || opt.stock_status === 'out';
                              return (
                                <div key={opt.id} className="p-3 px-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                                  <div>
                                    <p className={`text-xs font-bold ${isOff ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                      {opt.name}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-500">
                                      {opt.price > 0 ? `+ ${formatCOP(opt.price)}` : 'Incluido'}
                                    </p>
                                  </div>
                                  
                                  {/* Chip de Stock Opción Elegante */}
                                  <button
                                    type="button"
                                    onClick={() => handleOptionToggle(opt, group)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                                      !isOff 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 shadow-2xs' 
                                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isOff ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span>{!isOff ? 'Disponible' : 'Agotado'}</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        </main>

        {/* ══════════════════════════════════════════════════════════════════════
            COLUMNA 3: Modificadores del Plato Seleccionado (Flex-1)
        ══════════════════════════════════════════════════════════════════════ */}
        <aside className={`flex-1 bg-[#FBFBFC] flex flex-col shrink-0 overflow-y-auto ${mobileDetailOpen ? 'flex absolute inset-0 z-30 lg:relative lg:inset-auto' : 'hidden lg:flex'}`}>
          {selectedProduct ? (
            <div className="flex flex-col h-full">
              
              {/* Header Columna 3 */}
              <div className="p-3.5 px-4 border-b border-gray-200 bg-white shrink-0 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => {
                      setSelectedProductId(null);
                      setMobileDetailOpen(false);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                      Modificadores de
                    </span>
                    <h3 className="text-sm font-black text-gray-900 truncate">
                      {selectedProduct.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedProductId(null);
                    setMobileDetailOpen(false);
                  }}
                  className="hidden lg:flex p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contenido de Grupos de Modificadores */}
              <div className="p-4 space-y-3.5 flex-1 overflow-y-auto max-w-2xl">
                {selectedProductGroups.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 p-6 bg-white rounded-2xl border border-dashed border-gray-300">
                    <p className="text-xs font-bold text-gray-600">Este plato no tiene modificadores asignados.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Puedes asignarle grupos en la pestaña de Carta Principal.</p>
                  </div>
                ) : (
                  selectedProductGroups.map(group => {
                    const options = group.options || [];

                    return (
                      <div key={group.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                        
                        {/* Header de Grupo */}
                        <div className="p-3 px-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">{group.name}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              {group.min_selections > 0 ? `Obligatorio (${group.min_selections})` : 'Opcional'} · Máx {group.max_selections}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setAddOptionTargetGroup(group);
                              setNewOptionForm({ name: '', price: 0, ingredient_id: '' });
                            }}
                            className="p-1 px-2.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Opción</span>
                          </button>
                        </div>

                        {/* Opciones del Grupo */}
                        <div className="divide-y divide-gray-100">
                          {options.length === 0 ? (
                            <p className="p-3 text-[11px] text-gray-400 italic text-center">Sin opciones en este grupo</p>
                          ) : (
                            options.map(opt => {
                              const isOff = !opt.is_active || opt.stock_status === 'out';
                              return (
                                <div key={opt.id} className="p-2.5 px-3.5 flex items-center justify-between gap-2 hover:bg-gray-50/50">
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-xs font-bold truncate ${isOff ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                      {opt.name}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                                      {opt.price > 0 ? `+ ${formatCOP(opt.price)}` : 'Incluido'}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Chip de Stock Opción */}
                                    <button
                                      type="button"
                                      onClick={() => handleOptionToggle(opt, group)}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border ${
                                        !isOff 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 shadow-2xs' 
                                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80'
                                      }`}
                                      title={!isOff ? 'Disponible' : 'Agotado'}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isOff ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                      <span>{!isOff ? 'Disponible' : 'Agotado'}</span>
                                    </button>

                                    {/* Delete Option button */}
                                    <button
                                      onClick={() => {
                                        if (confirm(`¿Eliminar opción "${opt.name}" del grupo?`)) {
                                          deleteOption(opt.id);
                                        }
                                      }}
                                      className="p-1 text-gray-300 hover:text-rose-600 rounded-lg transition-colors"
                                      title="Eliminar opción"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            // Estado vacío Columna 3
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3 border border-gray-200">
                <Utensils className="w-7 h-7 text-gray-300" />
              </div>
              <h4 className="text-sm font-black text-gray-700">Selecciona un plato</h4>
              <p className="text-xs text-gray-400 max-w-xs mt-1">
                Haz clic en <span className="font-bold text-blue-600">"Modificadores"</span> en cualquier plato para ver y apagar sus opciones o bases en caliente.
              </p>
            </div>
          )}
        </aside>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Platos Vinculados a un Modificador (Lo que pediste)
      ══════════════════════════════════════════════════════════════════════ */}
      {viewingLinkedDishesGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Platos Vinculados</h3>
                  <p className="text-[11px] text-gray-500 font-bold">Modificador: {viewingLinkedDishesGroup.name}</p>
                </div>
              </div>
              <button onClick={() => setViewingLinkedDishesGroup(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500 font-semibold mb-3">
                Este grupo de modificadores está activo en los siguientes platos:
              </p>

              {(() => {
                const linkedDishes = products.filter(p => Array.isArray(p.modifier_groups) && p.modifier_groups.includes(viewingLinkedDishesGroup.id));
                if (linkedDishes.length === 0) {
                  return (
                    <div className="py-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs font-bold">Ningún plato tiene asignado este grupo actualmente.</p>
                    </div>
                  );
                }

                return (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {linkedDishes.map(dish => {
                      const isOff = dish.stock_status === 'out';
                      return (
                        <div key={dish.id} className="p-2.5 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              <AAImage src={dish.image_url} alt={dish.name} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-gray-900 truncate">{dish.name}</h4>
                              <p className="text-[10px] text-emerald-600 font-bold">{formatCOP(dish.price)}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleProductStockToggle(dish)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border shrink-0 ${
                              !isOff 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isOff ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{!isOff ? 'Disponible' : 'Agotado'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100">
              <button
                onClick={() => setViewingLinkedDishesGroup(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Cascada Inteligente (Auto-86: Caso del Arroz)
      ══════════════════════════════════════════════════════════════════════ */}
      {cascadeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                cascadeModal.type === 'turn_off' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {cascadeModal.type === 'turn_off' ? <AlertTriangle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 leading-tight">
                  {cascadeModal.type === 'turn_off' ? 'Modificador Crítico Agotado' : 'Reactivación de Modificador'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Opción: <span className="font-black text-gray-900">{cascadeModal.option.name}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-200/80">
              <p className="text-xs font-bold text-gray-700 mb-2">
                {cascadeModal.type === 'turn_off' 
                  ? `"${cascadeModal.option.name}" se utiliza en ${cascadeModal.affectedProducts.length} platos activos:`
                  : `Se reactivó "${cascadeModal.option.name}". ¿Deseas volver a habilitar los siguientes ${cascadeModal.affectedProducts.length} platos?`
                }
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {cascadeModal.affectedProducts.map(prod => (
                  <label key={prod.id} className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cascadeModal.selectedDishIds.includes(prod.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCascadeModal(prev => ({
                          ...prev,
                          selectedDishIds: checked 
                            ? [...prev.selectedDishIds, prod.id] 
                            : prev.selectedDishIds.filter(id => id !== prod.id)
                        }));
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="truncate">{prod.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleConfirmCascade}
                className={`w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-transform active:scale-98 ${
                  cascadeModal.type === 'turn_off' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {cascadeModal.type === 'turn_off' 
                  ? `⚡ Pausar los ${cascadeModal.selectedDishIds.length} platos en cascada`
                  : `🟢 Reactivar los ${cascadeModal.selectedDishIds.length} platos`
                }
              </button>

              <button
                onClick={async () => {
                  const isTurnOff = cascadeModal.type === 'turn_off';
                  await updateOption(cascadeModal.option.id, { 
                    is_active: !isTurnOff, 
                    stock_status: isTurnOff ? 'out' : 'in' 
                  });
                  setCascadeModal(null);
                }}
                className="w-full py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                Solo cambiar la opción individual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Añadir Opción Rápida
      ══════════════════════════════════════════════════════════════════════ */}
      {addOptionTargetGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-900">Añadir Opción</h3>
                <p className="text-[11px] text-gray-500 font-bold">Grupo: {addOptionTargetGroup.name}</p>
              </div>
              <button onClick={() => setAddOptionTargetGroup(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddOption} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Nombre de la opción</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Arroz Gohan Extra, Huevo, Queso..."
                  value={newOptionForm.name}
                  onChange={(e) => setNewOptionForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Precio Adicional (COP)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="0 si es incluido"
                  value={newOptionForm.price}
                  onChange={(e) => setNewOptionForm(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {ingredients && ingredients.length > 0 && (
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Vincular a Insumo de Cocina (Opcional)</label>
                  <select
                    value={newOptionForm.ingredient_id}
                    onChange={(e) => {
                      const ingId = e.target.value;
                      const matchedIng = ingredients.find(i => i.id === ingId);
                      setNewOptionForm(prev => ({ 
                        ...prev, 
                        ingredient_id: ingId,
                        name: (!prev.name.trim() && matchedIng) ? matchedIng.name : prev.name
                      }));
                    }}
                    className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Ninguno (Opción manual)</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingOption}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {isSubmittingOption ? 'Guardando...' : 'Crear Opción'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddOptionTargetGroup(null)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Emergencia / Pausa Total
      ══════════════════════════════════════════════════════════════════════ */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-11 h-11 rounded-2xl mx-auto flex items-center justify-center ${
              emergencyAction === 'pause' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            
            <h3 className="text-sm font-black text-gray-900 mt-3">
              {emergencyAction === 'pause' ? '¿Pausar toda la carta?' : '¿Reactivar toda la carta?'}
            </h3>
            
            <p className="text-xs text-gray-500 font-semibold mt-1">
              {emergencyAction === 'pause' 
                ? 'Todos los platos quedarán marcados como "Agotados por hoy" temporalmente.'
                : 'Todos los platos activos volverán a estar disponibles inmediatamente.'
              }
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleEmergencyMenuToggle}
                className={`w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-transform active:scale-98 ${
                  emergencyAction === 'pause' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {emergencyAction === 'pause' ? 'Confirmar Pausa Total' : 'Confirmar Reactivación Total'}
              </button>

              <button
                onClick={() => setShowEmergencyModal(false)}
                className="w-full py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
