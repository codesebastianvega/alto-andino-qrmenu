import { useState, useEffect, useMemo } from 'react';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useIngredientCategories } from '../hooks/useIngredientCategories';
import { useAdminProviders } from '../hooks/useAdminProviders';
import { useLocations } from '../hooks/useLocations';
import { useLocationInventory } from '../hooks/useLocationInventory';
import { useLinkCatalog } from '../hooks/useLinkCatalog';
import { LinkCatalogModal } from '../components/admin/LinkCatalogModal';
import { ShoppingListBoard } from '../components/admin/ShoppingListBoard';
import { BatchProductionModal } from '../components/admin/BatchProductionModal';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  TableContainer, Th, SearchInput, SelectInput,
  Modal, ModalHeader, FormField, TextInput
} from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';
import { useLocation } from '../context/LocationContext';
import { Link as LinkIcon, Lightbulb, X, Sparkles, Leaf } from 'lucide-react';

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const TABS = [
  { id: 'inventario',    label: 'Inventario',    icon: 'heroicons:archive-box' },
  { id: 'categorias',    label: 'Categorías',    icon: 'heroicons:tag' },
  { id: 'proveedores',   label: 'Proveedores',   icon: 'heroicons:truck' },
  { id: 'lista_compras', label: 'Lista de Compras', icon: 'heroicons:shopping-cart' },
];

export default function AdminModifiers() {
  const { activeLocationId } = useLocation();
  const [activeTab, setActiveTab] = useState('inventario');
  const { ingredients, fetchIngredients } = useAdminIngredients();

  useEffect(() => {
    fetchIngredients(activeLocationId);
  }, [activeLocationId, fetchIngredients]);

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Tabs Menu */}
      <div className="flex flex-row overflow-x-auto scrollbar-hide flex-nowrap bg-slate-100 p-1 mb-6 rounded-xl w-full sm:w-fit mx-auto border border-slate-200/80 shadow-2xs sticky top-4 z-40">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Icon icon={tab.icon} className={activeTab === tab.id ? 'text-emerald-700' : 'text-slate-400'} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inventario'    && <InsumosTab activeLocationId={activeLocationId} />}
      {activeTab === 'categorias'    && <CategoriasTab ingredients={ingredients} />}
      {activeTab === 'proveedores'   && <ProveedoresTab ingredients={ingredients} />}
      {activeTab === 'lista_compras' && <ListaComprasTab activeLocationId={activeLocationId} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB LISTA COMPRAS
// ═══════════════════════════════════════════════════════

function ListaComprasTab({ activeLocationId }) {
  const { ingredients, fetchIngredients } = useAdminIngredients();
  const { providers, fetchProviders } = useAdminProviders();

  useEffect(() => {
    fetchIngredients(activeLocationId);
    fetchProviders();
  }, [activeLocationId, fetchIngredients, fetchProviders]);

  return (
    <div className="animate-fade-in">
      <ShoppingListBoard ingredients={ingredients} providers={providers} />
    </div>
  );
}

// Base de conocimiento culinario Zero-Waste para rescate de mermas y tallos
const ZERO_WASTE_KNOWLEDGE = [
  {
    keywords: ['brócoli', 'brocoli'],
    badge: 'Tallos & Tronco',
    suggestion: 'El tallo representa ~35% del peso. Pélalo y córtalo en julianas o rodajas finas para encurtido japonés (Asazuke), salteados wok o puré de base.',
    potentialSaving: '35% de merma rescatable'
  },
  {
    keywords: ['cebolla larga', 'cebollín', 'cebollin'],
    badge: 'Tallo Verde & Raíz',
    suggestion: 'Usa las partes verdes para aceite aromatizado de cebollín o guarnición fresca. Las raíces limpias aportan umami profundo a caldos y fondos.',
    potentialSaving: '20% de merma rescatable'
  },
  {
    keywords: ['cebolla morada', 'cebolla cabezona', 'cebolla blanca'],
    badge: 'Cáscaras & Puntas',
    suggestion: 'Usa los cortes externos para encurtidos rápidos con vinagre de arroz y remolacha, o resérvalos para fondo de caldos base.',
    potentialSaving: '15% de merma rescatable'
  },
  {
    keywords: ['zanahoria'],
    badge: 'Puntas & Piel',
    suggestion: 'Lávala con cepillo para no pelarla (cero merma). Los recortes van a caldo vegetal aromático o deshidratados en chips de sal marina.',
    potentialSaving: '18% de merma rescatable'
  },
  {
    keywords: ['cilantro'],
    badge: 'Tallos Bajos',
    suggestion: '¡No descartes los tallos! Tienen más aroma que las hojas; tritúralos para marinados asiáticos, pasta de curry o aderezo de la casa.',
    potentialSaving: '25% de merma rescatable'
  },
  {
    keywords: ['pepino', 'pepino cohombro'],
    badge: 'Semillas & Piel',
    suggestion: 'Piel y semillas son ideales para infusionar agua aromática de cortesía o emulsionar aderezo refrescante de sésamo y pepino.',
    potentialSaving: '20% de merma rescatable'
  },
  {
    keywords: ['mango'],
    badge: 'Semilla & Pulpa residual',
    suggestion: 'Hervir la semilla y recortes con panela/azúcar y vinagre para crear salsa Sweet & Sour agridulce artesanal o reducción para postres.',
    potentialSaving: '30% de merma rescatable'
  },
  {
    keywords: ['aguacate', 'palta'],
    badge: 'Rendimiento y Maduración',
    suggestion: 'Porciones muy blandas pueden emulsionarse con limón y aceite de sésamo para una mayo-aguacate sin huevo con 0 desperdicio.',
    potentialSaving: '15% de merma rescatable'
  },
  {
    keywords: ['papa', 'papas'],
    badge: 'Cáscaras Limpias',
    suggestion: 'Cáscaras bien lavadas fritas a 180°C con sal marina y togarashi quedan como crocantes gourmet de cortesía para el bento.',
    potentialSaving: '12% de merma rescatable'
  },
  {
    keywords: ['pollo', 'pechuga', 'muslo'],
    badge: 'Huesos & Pieles',
    suggestion: 'Huesos para fondo Tori Paitan (caldo ramen concentrado). Piel crocante frita (Torikawa) para topping crocante en ensaladas.',
    potentialSaving: '25% de merma rescatable'
  }
];

function getZeroWasteSuggestion(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  
  // Productos procesados o congelados no tienen merma de huesos/pieles
  if (lower.includes('nugget') || lower.includes('empanada') || lower.includes('salchicha')) {
    return null;
  }

  for (const item of ZERO_WASTE_KNOWLEDGE) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════
// TAB 1 — INVENTARIO
// ═══════════════════════════════════════════════════════
function InsumosTab({ activeLocationId }) {
  const {
    ingredients, loading, fetchIngredients,
    createIngredient, updateIngredient, deleteIngredient, toggleIngredientStatus
  } = useAdminIngredients();

  const { categories } = useIngredientCategories();
  const { providers, fetchProviders } = useAdminProviders();

  const [isOpen,        setIsOpen]        = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [search,        setSearch]        = useState('');
  const [catFilter,     setCatFilter]     = useState('all');
  const [providerFilter, setProviderFilter]= useState('all');
  const [showZeroOnly,  setShowZeroOnly]  = useState(false);
  const [showZeroWasteOnly, setShowZeroWasteOnly] = useState(false);
  const [typeFilter,    setTypeFilter]    = useState('all'); // 'all' | 'raw' | 'subrecipe'
  const [sortBy,        setSortBy]        = useState('name_asc');
  const [batchModalItem, setBatchModalItem] = useState(null);
  // inlineEdit: { id, purchase_price, purchase_quantity, purchase_unit, usage_unit }
  const [inlineEdit,    setInlineEdit]    = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const { activeLocation, isAllLocations } = useLocation();
  const [showInvTip, setShowInvTip] = useState(() => {
    try { return localStorage.getItem('inventory_tip_dismissed') !== 'true'; } catch { return true; }
  });

  const dismissInvTip = () => {
    setShowInvTip(false);
    try { localStorage.setItem('inventory_tip_dismissed', 'true'); } catch {}
  };

  // Per-location inventory state
  const { locations } = useLocations();
  const { saveInventory, fetchInventory } = useLocationInventory();
  const { linkItem, unlinkItem } = useLinkCatalog();
  const [locationInventory, setLocationInventory] = useState({}); // { [locId]: { stock_quantity, min_stock } }

  const emptyForm = {
    name: '', description: '', sku: '', image_url: '',
    purchase_price: 0, purchase_unit: 'Unidad', purchase_quantity: 1,
    usage_unit: 'unidad', stock_current: 0, stock_min: 0,
    selling_price: 0, is_modifier: false, category_id: '', provider_id: '', is_active: true,
    has_merma: false, merma_percent: 0, portion_size: 50
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { 
    fetchIngredients(activeLocationId); 
    fetchProviders(); 
  }, [activeLocationId, fetchIngredients, fetchProviders]);

  const unitCost = useMemo(() =>
    (parseFloat(form.purchase_price) || 0) / (parseFloat(form.purchase_quantity) || 1),
    [form.purchase_price, form.purchase_quantity]
  );

  const inlineUnitCost = useMemo(() => {
    if (!inlineEdit) return 0;
    return (parseFloat(inlineEdit.purchase_price) || 0) / (parseFloat(inlineEdit.purchase_quantity) || 1);
  }, [inlineEdit]);

  const zeroCostCount = useMemo(() =>
    ingredients.filter(i => !i.unit_cost || i.unit_cost === 0).length,
    [ingredients]
  );

  const totalInventoryValue = useMemo(() => 
    ingredients.reduce((sum, i) => sum + ((i.unit_cost || 0) * (i.stock_current || 0)), 0),
    [ingredients]
  );

  const lowStockCount = useMemo(() => 
    ingredients.filter(i => i.stock_current <= i.stock_min).length,
    [ingredients]
  );

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const zeroWasteCount = useMemo(() =>
    ingredients.filter(i => Boolean(i.has_merma)).length,
    [ingredients]
  );

  const rawCount = useMemo(() =>
    ingredients.filter(i => !i.is_subrecipe && !(i.name || '').toLowerCase().includes('(subreceta)')).length,
    [ingredients]
  );

  const subrecipeCount = useMemo(() =>
    ingredients.filter(i => Boolean(i.is_subrecipe) || (i.name || '').toLowerCase().includes('(subreceta)')).length,
    [ingredients]
  );

  const filtered = useMemo(() => {
    const list = ingredients.filter(i => {
      // Logic for special search terms or standard search
      let matchSearch = true;
      if (search === 'stock_bajo') {
        matchSearch = i.stock_current <= i.stock_min;
      } else if (search === 'high_value') {
        // High value items: more than the average value or just a top threshold
        const avgValue = totalInventoryValue / (ingredients.length || 1);
        matchSearch = ((i.unit_cost || 0) * (i.stock_current || 0)) >= avgValue;
      } else {
        matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                      (i.sku || '').toLowerCase().includes(search.toLowerCase());
      }
      
      const matchCat      = catFilter === 'all' || i.category_id === catFilter;
      const matchProv     = providerFilter === 'all' || i.provider_id === providerFilter;
      const matchZero     = !showZeroOnly || !i.unit_cost || i.unit_cost === 0;
      const matchZeroWaste= !showZeroWasteOnly || Boolean(i.has_merma);

      const isSubrecipeItem = Boolean(i.is_subrecipe) || (i.name || '').toLowerCase().includes('(subreceta)');
      const matchType     = typeFilter === 'all' ? true :
                            typeFilter === 'subrecipe' ? isSubrecipeItem :
                            !isSubrecipeItem;

      return matchSearch && matchCat && matchProv && matchZero && matchZeroWaste && matchType;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'category') {
        const catA = categories.find(c => c.id === a.category_id)?.name || 'Sin Categ';
        const catB = categories.find(c => c.id === b.category_id)?.name || 'Sin Categ';
        const cmp = catA.localeCompare(catB, 'es', { sensitivity: 'base' });
        return cmp !== 0 ? cmp : (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'stock_asc') {
        return (a.stock_current || 0) - (b.stock_current || 0);
      }
      if (sortBy === 'stock_desc') {
        return (b.stock_current || 0) - (a.stock_current || 0);
      }
      if (sortBy === 'value_desc') {
        const valA = (a.unit_cost || 0) * (a.stock_current || 0);
        const valB = (b.unit_cost || 0) * (b.stock_current || 0);
        return valB - valA;
      }
      if (sortBy === 'recent') {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      }
      return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
    });
  }, [ingredients, search, catFilter, providerFilter, showZeroOnly, showZeroWasteOnly, typeFilter, totalInventoryValue, sortBy, categories]);

  const openCreate = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setLocationInventory({});
    setIsOpen(true); 
  };

  const openEdit   = async (item) => {
    const defaultZw = getZeroWasteSuggestion(item.name);
    setEditing(item);
    setForm({
      name: item.name, description: item.description || '', sku: item.sku || '', image_url: item.image_url || '',
      purchase_price: item.purchase_price || 0, purchase_unit: item.purchase_unit || 'Unidad',
      purchase_quantity: item.purchase_quantity || 1, usage_unit: item.usage_unit || 'unidad',
      stock_current: item.stock_current || 0, stock_min: item.stock_min || 0,
      selling_price: item.selling_price || 0, is_modifier: item.is_modifier || false,
      category_id: item.category_id || '', provider_id: item.provider_id || '', is_active: item.is_active,
      portion_size: item.portion_size || 50,
      has_merma: item.has_merma ?? (defaultZw !== null),
      merma_percent: item.merma_percent ?? (defaultZw?.defaultPercent || 20)
    });

    // Load per-location inventory
    const existingInv = await fetchInventory({ ingredient_id: item.id });
    const invMap = {};
    existingInv.forEach(inv => {
      invMap[inv.location_id] = {
        stock_quantity: inv.stock_quantity,
        min_stock: inv.min_stock
      };
    });
    setLocationInventory(invMap);

    setIsOpen(true);
  };

  const openInlineEdit = (item) => {
    setInlineEdit({
      id: item.id,
      purchase_price:    item.purchase_price    || 0,
      purchase_quantity: item.purchase_quantity || 1,
      purchase_unit:     item.purchase_unit     || 'Unidad',
      usage_unit:        item.usage_unit        || 'unidad',
    });
    setConfirmDelete(null);
  };

  const saveInlineCost = async () => {
    if (!inlineEdit) return;
    const item = ingredients.find(i => i.id === inlineEdit.id);
    if (!item) return;
    const ok = await updateIngredient(inlineEdit.id, {
      ...item,
      purchase_price:    inlineEdit.purchase_price,
      purchase_quantity: inlineEdit.purchase_quantity,
      purchase_unit:     inlineEdit.purchase_unit,
    });
    if (ok !== null) setInlineEdit(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const savedItem = editing
      ? await updateIngredient(editing.id, form)
      : await createIngredient(form, activeLocationId);
    
    if (savedItem) {
      // Save location-specific inventory
      const invData = Object.entries(locationInventory).map(([locId, data]) => ({
        location_id: locId,
        ingredient_id: savedItem.id,
        stock_quantity: data.stock_quantity,
        min_stock: data.min_stock
      }));

      if (invData.length > 0) {
        await saveInventory(invData);
      }

      setIsOpen(false);
    }
  };

  const handleLinkIngredients = async (selectedIds) => {
    for (const id of selectedIds) {
      await linkItem('inventory', activeLocationId, id);
    }
    fetchIngredients(activeLocationId);
    setIsLinkModalOpen(false);
  };

  const handleUnlinkIngredient = async (id) => {
    if (window.confirm('¿Desvincular este insumo de esta sede?')) {
      await unlinkItem('inventory', activeLocationId, id);
      fetchIngredients(activeLocationId);
    }
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fi = (k, v) => setInlineEdit(prev => ({ ...prev, [k]: v }));

  const handlePurchaseUnitChange = (unit) => {
    let usageUnit = form.usage_unit;
    let purchaseQuantity = form.purchase_quantity;

    switch (unit) {
      case 'Kilogramos':
        usageUnit = 'Gramo';
        purchaseQuantity = 1000;
        break;
      case 'Litros':
        usageUnit = 'Mililitro';
        purchaseQuantity = 1000;
        break;
      case 'Libras':
        usageUnit = 'Gramo';
        purchaseQuantity = 500; // Using LatAm commercial standard
        break;
      case 'Gramos':
        usageUnit = 'Gramo';
        purchaseQuantity = '';
        break;
      case 'Mililitros':
        usageUnit = 'Mililitro';
        purchaseQuantity = '';
        break;
      case 'Unidades':
      case 'Paquetes':
      case 'Cajas':
      case 'Botellas':
      case 'Latas':
        usageUnit = 'Unidad';
        purchaseQuantity = 1;
        break;
      case 'Onzas':
        usageUnit = 'Onza';
        purchaseQuantity = '';
        break;
      default:
        break;
    }

    setForm(prev => ({
      ...prev,
      purchase_unit: unit,
      usage_unit: usageUnit,
      purchase_quantity: purchaseQuantity
    }));
  };

  if (loading && !ingredients.length)
    return <div className="py-16 text-center text-sm text-gray-400 font-medium">Cargando…</div>;

  return (
    <>
      {/* Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Total Insumos */}
        <div 
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
          onClick={() => {
            setSearch('');
            setCatFilter('all');
            setShowZeroOnly(false);
            setShowZeroWasteOnly(false);
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Insumos Activos</span>
            <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center text-base group-hover:bg-slate-200/70 transition-colors">
              <Icon icon="heroicons:archive-box" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight">{ingredients.length}</h4>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <Icon icon="heroicons:arrow-trending-up" className="text-xs" />
              Sincronizado
            </span>
          </div>
        </div>

        {/* Alertas Stock */}
        <div 
          className={`p-4 rounded-xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
            lowStockCount > 0 
              ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300' 
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`} 
          onClick={() => {
            if (lowStockCount > 0) {
              setSearch('stock_bajo');
              setShowZeroOnly(false);
              setShowZeroWasteOnly(false);
            }
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alertas de Stock</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
              lowStockCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <Icon icon={lowStockCount > 0 ? "heroicons:exclamation-triangle" : "heroicons:check-badge"} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className={`text-2xl font-black tracking-tight ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{lowStockCount}</h4>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              lowStockCount > 0 
                ? 'text-rose-700 bg-rose-50 border-rose-200' 
                : 'text-emerald-700 bg-emerald-50 border-emerald-100'
            }`}>
              {lowStockCount > 0 ? 'Stock crítico' : 'Niveles óptimos'}
            </span>
          </div>
        </div>

        {/* Valor Inventario */}
        <div 
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
          onClick={() => {
            setSearch('high_value');
            setShowZeroOnly(false);
            setShowZeroWasteOnly(false);
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Valorado</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center text-base group-hover:bg-blue-100/70 transition-colors">
              <Icon icon="heroicons:currency-dollar" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              ${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h4>
            <span className="text-[11px] font-medium text-slate-400">En almacén</span>
          </div>
        </div>

        {/* Sin Costo */}
        <div 
          className={`p-4 rounded-xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
            zeroCostCount > 0 
              ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300' 
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`} 
          onClick={() => {
            if (zeroCostCount > 0) {
              setShowZeroOnly(!showZeroOnly);
              setShowZeroWasteOnly(false);
              setSearch('');
            }
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sin Costo</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
              zeroCostCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Icon icon="heroicons:no-symbol" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className={`text-2xl font-black tracking-tight ${zeroCostCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{zeroCostCount}</h4>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              zeroCostCount > 0 
                ? 'text-amber-700 bg-amber-50 border-amber-200' 
                : 'text-slate-500 bg-slate-100 border-slate-200'
            }`}>
              {zeroCostCount > 0 ? 'Por fijar' : 'Completo'}
            </span>
          </div>
        </div>

        {/* IA Zero-Waste Card */}
        <div 
          className={`p-4 rounded-xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
            showZeroWasteOnly
              ? 'bg-emerald-900 text-white border-emerald-800 ring-2 ring-emerald-500/30'
              : 'bg-gradient-to-br from-emerald-50/60 to-teal-50/30 border-emerald-200 hover:border-emerald-300'
          }`} 
          onClick={() => {
            setShowZeroWasteOnly(!showZeroWasteOnly);
            setShowZeroOnly(false);
            setSearch('');
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${showZeroWasteOnly ? 'text-emerald-200' : 'text-emerald-800'}`}>
              IA Zero-Waste
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
              showZeroWasteOnly ? 'bg-white/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Sparkles size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className={`text-2xl font-black tracking-tight ${showZeroWasteOnly ? 'text-white' : 'text-emerald-950'}`}>
              {zeroWasteCount}
            </h4>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              showZeroWasteOnly
                ? 'text-emerald-100 bg-emerald-800 border-emerald-700'
                : 'text-emerald-800 bg-emerald-100 border-emerald-200'
            }`}>
              {showZeroWasteOnly ? 'Filtrando' : 'Aprovechables'}
            </span>
          </div>
        </div>
      </div>

      {/* Onboarding Tip Banner */}
      {showInvTip && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs animate-fade-in relative">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
            <Lightbulb size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-bold text-slate-900 mb-0.5">Gestión de Insumos por Sede</p>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Los insumos se crean a nivel de marca y se vinculan a la sede activa. Si necesitas un insumo existente en otra sede, usa <strong className="font-semibold text-slate-800">"Vincular del Catálogo"</strong>. Registrar costos aquí permite calcular márgenes reales en recetas.
            </p>
          </div>
          <button onClick={dismissInvTip} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Segmented Filter: Insumos de Compra vs Subrecetas */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit mb-4 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            typeFilter === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({ingredients.length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('raw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            typeFilter === 'raw'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📦</span> Insumos de Compra ({rawCount})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('subrecipe')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            typeFilter === 'subrecipe'
              ? 'bg-white text-amber-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🍳</span> Subrecetas / Mise en Place ({subrecipeCount})
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 w-full lg:w-auto">
          <div className="relative flex-1 w-full sm:min-w-[280px]">
            <Icon 
              icon="heroicons:magnifying-glass" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" 
            />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
            />
          </div>
          <div className="relative w-full sm:w-52">
            <Icon 
              icon="heroicons:funnel" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" 
            />
            <select 
              value={catFilter} 
              onChange={e => setCatFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-52">
            <Icon 
              icon="heroicons:truck" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" 
            />
            <select 
              value={providerFilter} 
              onChange={e => setProviderFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todos los proveedores</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-52">
            <Icon 
              icon="heroicons:bars-arrow-down" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" 
            />
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
            >
              <option value="name_asc">Nombre (A → Z)</option>
              <option value="name_desc">Nombre (Z → A)</option>
              <option value="category">Por Categoría</option>
              <option value="stock_asc">Menor Stock (Críticos)</option>
              <option value="stock_desc">Mayor Stock</option>
              <option value="recent">Recién Actualizados</option>
              <option value="value_desc">Mayor Valor Total</option>
            </select>
            <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto shrink-0">
          {!isAllLocations && (
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200 shadow-2xs w-full sm:w-auto"
            >
              <LinkIcon size={14} className="text-slate-500" />
              Vincular del Catálogo
            </button>
          )}
          <button
            type="button"
            onClick={() => setBatchModalItem({ is_subrecipe: true })}
            className="flex items-center justify-center gap-1.5 px-3.5 h-9 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-md w-full sm:w-auto shrink-0"
            title="Preparar bache de subreceta / mise en place y descontar bodega"
          >
            <span>🍳</span>
            <span>Preparar Bache</span>
          </button>
          <PrimaryButton onClick={openCreate} className="h-9 px-4 text-xs font-semibold w-full sm:w-auto gap-1.5">
            <Icon icon="heroicons:plus" className="text-sm" />
            Nuevo Insumo
          </PrimaryButton>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <TableContainer className="rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden bg-white">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <Th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Insumo / SKU</Th>
                <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría / Prov.</Th>
                <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Unit.</Th>
                <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock / Alerta</Th>
                <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Stock</Th>
                <Th className="py-3 px-3 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1 bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    <Sparkles size={11} /> Zero-Waste IA
                  </span>
                </Th>
                <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Última Act.</Th>
                <Th right className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => {
                const cat      = categories.find(c => c.id === item.category_id);
                const stockLow = item.stock_current <= item.stock_min;
                const hasZero  = !item.unit_cost || item.unit_cost === 0;
                const isInline = inlineEdit?.id === item.id;
                const isDelConf= confirmDelete === item.id;
                const isSubrecipe = Boolean(item.is_subrecipe) || (item.name || '').toLowerCase().includes('(subreceta)');

                // ── Delete confirmation row
                if (isDelConf) return (
                  <tr key={item.id} className="bg-rose-50/60 border-y border-rose-100">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-rose-100 rounded-md flex items-center justify-center text-rose-600 text-sm">
                            <Icon icon="heroicons:trash" />
                          </div>
                          <p className="text-xs font-bold text-rose-800">
                            ¿Eliminar <span className="underline decoration-rose-300">{item.name}</span> del inventario?
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { deleteIngredient(item.id); setConfirmDelete(null); }}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shadow-2xs transition-all">
                            Sí, Eliminar
                          </button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );

                // ── Inline cost editor row
                if (isInline) return (
                  <tr key={item.id} className="bg-blue-50/40 border-y border-blue-100">
                    <td className="px-4 py-3" colSpan={8}>
                      <div className="flex flex-wrap items-end gap-3 text-xs">
                        <div className="flex-1 min-w-[140px]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Insumo</p>
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium capitalize">{item.usage_unit}</p>
                        </div>
                        <div className="flex-1 min-w-[110px]">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Precio compra</label>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-xs">$</span>
                            <input
                              autoFocus
                              type="number"
                              value={inlineEdit.purchase_price}
                              onChange={e => fi('purchase_price', Number(e.target.value))}
                              className="w-24 px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-[90px]">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Cant. interna</label>
                          <input
                            type="number"
                            value={inlineEdit.purchase_quantity}
                            onChange={e => fi('purchase_quantity', Number(e.target.value))}
                            className="w-20 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        <div className="flex-1 min-w-[90px]">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Unidad compra</label>
                          <input
                            type="text"
                            value={inlineEdit.purchase_unit}
                            onChange={e => fi('purchase_unit', e.target.value)}
                            className="w-20 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        {/* Live cost preview */}
                        <div className="flex-1 min-w-[110px] text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Costo unitario</p>
                          <p className={`text-base font-extrabold tabular-nums ${
                            inlineUnitCost > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}>
                            ${inlineUnitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            <span className="text-[10px] text-slate-400 font-medium ml-1">/{item.usage_unit}</span>
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={saveInlineCost}
                            className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-all shadow-2xs">
                            Guardar
                          </button>
                          <button onClick={() => setInlineEdit(null)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all">
                            Cancelar
                          </button>
                          <button onClick={() => openEdit(item)}
                            className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-all">
                            Editar todo…
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );

                // ── Normal row
                return (
                  <tr key={item.id} className={`group transition-colors ${
                    hasZero ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/70'
                  } ${!item.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    {/* Name column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 border ${
                            item.is_active ? 'bg-slate-100 text-slate-700 border-slate-200/80' : 'bg-slate-50 text-slate-400 border-slate-200/50'
                          }`}>
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[220px]">{item.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.usage_unit || 'unidad'}</span>
                            {isSubrecipe && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.2 rounded font-bold">
                                🍳 Subreceta
                              </span>
                            )}
                            {item.recipe_usage_count > 0 && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                                {item.recipe_usage_count} receta{item.recipe_usage_count === 1 ? '' : 's'} · {item.recipe_required_quantity} {item.usage_unit}
                              </span>
                            )}
                            {item.sku && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-semibold border border-slate-200/60">
                                {item.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category / Provider column */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        <div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase border border-slate-200/60 inline-block">
                            {cat?.name || 'Sin Categ.'}
                          </span>
                        </div>
                        {item.provider_id && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold truncate max-w-[140px]">
                            <Icon icon="heroicons:truck" className="text-xs shrink-0" />
                            <span className="truncate">{providers.find(p => p.id === item.provider_id)?.name || 'Proveedor'}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cost column */}
                    <td className="py-3 px-3">
                      {hasZero ? (
                        <button
                          onClick={() => openInlineEdit(item)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-[11px] font-semibold transition-all border border-amber-200/80 shadow-2xs"
                        >
                          <Icon icon="heroicons:currency-dollar" className="text-xs" />
                          Fijar precio
                        </button>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                            ${(item.unit_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Por {item.usage_unit || 'u'}</span>
                        </div>
                      )}
                    </td>

                    {/* Stock column */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 max-w-[130px]">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold tabular-nums ${stockLow ? 'text-rose-600' : 'text-slate-900'}`}>
                            {item.stock_current} <span className="text-[10px] font-semibold text-slate-400">{item.usage_unit}</span>
                          </span>
                          {stockLow && (
                            <span className="flex items-center justify-center h-4 w-4 bg-rose-500 text-white rounded-full">
                              <Icon icon="heroicons:exclamation-circle" className="text-[10px]" />
                            </span>
                          )}
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                          {(() => {
                            const percentage = Math.min(100, (item.stock_current / Math.max(1, item.stock_min * 2)) * 100);
                            const isCritical = item.stock_current <= item.stock_min;
                            const isWarning = item.stock_current <= item.stock_min * 1.5;
                            
                            let colorClass = 'bg-emerald-600';
                            if (isCritical) colorClass = 'bg-rose-500';
                            else if (isWarning) colorClass = 'bg-amber-400';

                            return (
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                                style={{ width: `${percentage}%` }}
                              />
                            );
                          })()}
                        </div>
                        <p className="text-[9px] font-semibold text-slate-400">Mín: {item.stock_min}</p>
                      </div>
                    </td>

                    {/* Valor Stock column */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                          ${((item.unit_cost || 0) * (item.stock_current || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">Valor total</p>
                      </div>
                    </td>

                    {/* Zero-Waste IA column */}
                    <td className="py-3 px-3">
                      {(() => {
                        if (!item.has_merma) {
                          return (
                            <span className="text-[11px] text-slate-300 font-medium">
                              —
                            </span>
                          );
                        }
                        const zw = getZeroWasteSuggestion(item.name) || {
                          badge: 'Merma Activa',
                          suggestion: `Insumo con ${item.merma_percent || 20}% de merma configurada para rescate y sub-recetas.`,
                          potentialSaving: `${item.merma_percent || 20}% de merma`
                        };
                        return (
                          <div className="group/zw relative inline-block">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100 transition-colors cursor-help">
                              <Leaf size={12} className="text-emerald-600 shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold leading-tight truncate max-w-[120px]">{zw.badge}</span>
                                <span className="text-[9px] text-emerald-600 font-medium leading-none">{zw.potentialSaving}</span>
                              </div>
                            </div>
                            {/* Hover tooltip with full culinary idea */}
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/zw:block z-50 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-left border border-slate-800 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                              <div className="flex items-center gap-1.5 mb-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                <Sparkles size={12} />
                                Rescate IA Zero-Waste
                              </div>
                              <p className="text-xs text-slate-200 font-normal leading-relaxed">
                                {zw.suggestion}
                              </p>
                              <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-emerald-300 font-semibold">
                                <span>Rendimiento estimado</span>
                                <span>+{zw.potentialSaving}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Last updated column */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-500 font-medium text-xs">
                        <Icon icon="heroicons:clock" className="text-xs text-slate-400" />
                        <span>{formatRelativeTime(item.updated_at)}</span>
                      </div>
                    </td>

                    {/* Actions column - ALWAYS VISIBLE */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isSubrecipe && (
                          <button
                            onClick={() => setBatchModalItem(item)}
                            title="Preparar bache de esta subreceta"
                            className="flex items-center gap-1 px-2.5 h-7 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md border border-amber-300 shadow-2xs transition-all mr-0.5"
                          >
                            <span>🍳</span>
                            <span>Preparar</span>
                          </button>
                        )}
                        <button
                          onClick={() => toggleIngredientStatus(item.id, item.is_active)}
                          title={item.is_active ? "Insumo activo (clic para desactivar)" : "Insumo inactivo (clic para activar)"}
                          className={`h-7 px-2 flex items-center gap-1 text-[11px] font-bold rounded-lg border transition-all ${
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200 hover:text-slate-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{item.is_active ? 'Activo' : 'Inactivo'}</span>
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          title="Editar insumo"
                          className="h-7 px-2.5 flex items-center gap-1 text-xs font-bold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-lg border border-slate-200/90 shadow-2xs transition-all"
                        >
                          <Icon icon="heroicons:pencil-square" className="text-sm text-slate-400" />
                          <span>Editar</span>
                        </button>
                        <button 
                          onClick={() => { setConfirmDelete(item.id); setInlineEdit(null); }}
                          title="Eliminar insumo"
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200/80 bg-white transition-all shadow-2xs"
                        >
                          <Icon icon="heroicons:trash" className="text-sm" />
                        </button>
                        {!isAllLocations && (
                          <button
                            onClick={() => handleUnlinkIngredient(item.id)}
                            title="Desvincular de esta sede"
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200/80 bg-white transition-all shadow-2xs"
                          >
                            <Icon icon="heroicons:link-slash" className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-xs text-slate-400 font-medium">
                  {showZeroOnly ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon icon="heroicons:check-badge" className="text-2xl text-emerald-500" />
                      <span>¡Todos tus insumos tienen un costo definido!</span>
                    </div>
                  ) : search === 'stock_bajo' ? (
                     <div className="flex flex-col items-center gap-1.5">
                      <Icon icon="heroicons:check-circle" className="text-2xl text-emerald-500" />
                      <span>No hay insumos con stock bajo. ¡Buen trabajo!</span>
                    </div>
                  ) : search === 'high_value' ? (
                    <div className="flex flex-col items-center gap-1.5">
                     <Icon icon="heroicons:information-circle" className="text-2xl text-blue-500" />
                     <span>No hay insumos con valor significativamente alto actualmente.</span>
                   </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon icon="heroicons:magnifying-glass" className="text-2xl text-slate-300" />
                      <span>No se encontraron insumos que coincidan con la búsqueda.</span>
                    </div>
                  )}
                </td></tr>
              )}
            </tbody>
          </table>
        </TableContainer>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3 mt-4">
        {filtered.map(item => {
          const cat = categories.find(c => c.id === item.category_id);
          const stockLow = item.stock_current <= item.stock_min;
          const hasZero = !item.unit_cost || item.unit_cost === 0;
          const isInline = inlineEdit?.id === item.id;
          const isDelConf = confirmDelete === item.id;
          const isSubrecipe = Boolean(item.is_subrecipe) || (item.name || '').toLowerCase().includes('(subreceta)');

          if (isDelConf) return (
            <div key={item.id} className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 flex flex-col gap-2.5 animate-fade-in">
              <p className="text-xs font-bold text-rose-800">¿Eliminar {item.name} del inventario?</p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => { deleteIngredient(item.id); setConfirmDelete(null); }} className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold uppercase shadow-2xs">Eliminar</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-medium">Cancelar</button>
              </div>
            </div>
          );

          if (isInline) return (
            <div key={item.id} className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 flex flex-col gap-2.5 animate-fade-in text-xs">
              <p className="font-bold text-slate-900">{item.name}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Precio Compra ($)</label>
                  <input type="number" value={inlineEdit.purchase_price} onChange={e => fi('purchase_price', Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-100 bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cant. ({inlineEdit.purchase_unit})</label>
                  <input type="number" value={inlineEdit.purchase_quantity} onChange={e => fi('purchase_quantity', Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-100 bg-white" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-1 pt-2 border-t border-blue-100">
                <p className="font-extrabold text-emerald-800">Costo: ${inlineUnitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setInlineEdit(null)} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600">Cancelar</button>
                  <button onClick={saveInlineCost} className="px-3 py-1 bg-emerald-800 rounded-lg text-xs font-semibold text-white shadow-2xs">Guardar</button>
                </div>
              </div>
            </div>
          );

          return (
            <div key={item.id} className={`bg-white p-3.5 rounded-xl border shadow-2xs flex flex-col gap-2.5 transition-all ${hasZero ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/90'}`}>
              <div className="flex gap-2.5 items-center">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${item.is_active ? 'bg-slate-100 text-slate-700 border-slate-200/80' : 'bg-slate-50 text-slate-400 border-slate-200/50'}`}>
                    {item.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{cat?.name || 'Sin Categoría'}</span>
                    {isSubrecipe && (
                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                        🍳 Subreceta
                      </span>
                    )}
                    {item.provider_id && (
                      <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 font-semibold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Icon icon="heroicons:truck" className="text-[10px]" />
                        {providers.find(p => p.id === item.provider_id)?.name || 'Proveedor'}
                      </span>
                    )}
                    {item.sku && <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono font-semibold border border-slate-200/60">{item.sku}</span>}
                    {hasZero && <span className="text-[9px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded uppercase">Falta Costo</span>}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight truncate mt-0.5">{item.name}</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Costo Unitario</p>
                  <p className="text-xs font-extrabold text-slate-900">${(item.unit_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-medium">/{item.usage_unit}</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Stock</p>
                  <p className={`text-xs font-extrabold flex items-center gap-1 ${stockLow ? 'text-rose-600' : 'text-slate-900'}`}>
                    {item.stock_current} <span className="text-[10px] font-semibold text-slate-400">{item.usage_unit}</span>
                  </p>
                </div>
              </div>

              {(() => {
                if (!item.has_merma) return null;
                const zw = getZeroWasteSuggestion(item.name) || {
                  badge: 'Merma Activa',
                  suggestion: `Insumo con ${item.merma_percent || 20}% de merma configurada para rescate y sub-recetas.`,
                  potentialSaving: `${item.merma_percent || 20}% de merma`
                };
                return (
                  <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/90 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        <Sparkles size={11} className="text-emerald-600" />
                        Zero-Waste: {zw.badge}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                        +{zw.potentialSaving}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-normal leading-relaxed">
                      {zw.suggestion}
                    </p>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-1">
                <div>
                  {hasZero && (
                    <button onClick={() => openInlineEdit(item)} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                      Fijar Precio
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isSubrecipe && (
                    <button
                      onClick={() => setBatchModalItem(item)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md border border-amber-300 shadow-2xs mr-1"
                    >
                      <span>🍳 Preparar</span>
                    </button>
                  )}
                  <button
                    onClick={() => toggleIngredientStatus(item.id, item.is_active)}
                    title={item.is_active ? "Insumo activo (clic para desactivar)" : "Insumo inactivo (clic para activar)"}
                    className={`h-7 px-2 flex items-center gap-1 text-[11px] font-bold rounded-lg border transition-all ${
                      item.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{item.is_active ? 'Activo' : 'Inactivo'}</span>
                  </button>
                  <button onClick={() => openEdit(item)} title="Editar" className="h-7 px-2.5 flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <Icon icon="heroicons:pencil-square" className="text-sm text-slate-400" />
                    <span>Editar</span>
                  </button>
                  <button onClick={() => setConfirmDelete(item.id)} title="Eliminar" className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <Icon icon="heroicons:trash" className="text-sm" />
                  </button>
                  {!isAllLocations && (
                    <button onClick={() => handleUnlinkIngredient(item.id)} title="Desvincular" className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-amber-600 bg-white border border-slate-200 rounded-md shadow-2xs">
                      <Icon icon="heroicons:link-slash" className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-start justify-center z-[100] p-0 md:p-4 overflow-hidden backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] md:my-8 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 border border-slate-200">
            <div className="shrink-0">
              <ModalHeader
                title={editing ? 'Editar insumo' : 'Nuevo insumo'}
                subtitle={editing ? editing.name : 'Completa los datos del nuevo insumo.'}
                onClose={() => setIsOpen(false)}
              />
              <div className="px-5 md:px-7 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Costo para recetas</p>
                  <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                    ${unitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-xs text-slate-400 font-medium ml-1">/{form.usage_unit || 'unidad'}</span>
                  </p>
                </div>
                {/* Switch Activo / Inactivo */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-xs font-bold block ${form.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {form.is_active ? 'Insumo Activo' : 'Insumo Inactivo'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {form.is_active ? 'Visible en bodega y recetas' : 'Aparece tenue / desactivado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => f('is_active', !form.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                      form.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                      form.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="px-5 md:px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Nombre">
                  <TextInput required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej. Aguacate, Café, Pollo" />
                </FormField>
                <FormField label="SKU / Código">
                  <TextInput value={form.sku} onChange={e => f('sku', e.target.value.toUpperCase())} placeholder="INS-001" />
                </FormField>
                <FormField label="URL de Foto / Imagen (Opcional)">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <TextInput 
                        value={form.image_url || ''} 
                        onChange={e => f('image_url', e.target.value)} 
                        placeholder="https://... (Foto del producto / empaque)" 
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Pega el enlace de una foto para identificar este insumo en bodega y recetas.
                      </p>
                    </div>
                    {form.image_url ? (
                      <div className="relative group shrink-0">
                        <img
                          src={form.image_url}
                          alt="Vista previa"
                          className="w-13 h-13 rounded-xl object-cover border border-slate-200 bg-white shadow-2xs"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://placehold.co/100x100/f1f5f9/94a3b8?text=Error';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => f('image_url', '')}
                          title="Quitar foto"
                          className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-13 h-13 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-300 shrink-0" title="Sin foto aún">
                        <Icon icon="heroicons:photo" className="text-lg" />
                        <span className="text-[8px] font-semibold">Sin foto</span>
                      </div>
                    )}
                  </div>
                </FormField>
                <FormField label="Categoría">
                  <select required value={form.category_id} onChange={e => f('category_id', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none">
                    <option value="">Seleccionar…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Proveedor (Opcional)">
                  <select value={form.provider_id} onChange={e => f('provider_id', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none">
                    <option value="">Sin proveedor</option>
                    {providers?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Unidad de uso en Recetas">
                  <select required value={form.usage_unit} onChange={e => f('usage_unit', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none">
                    <option value="">Seleccionar unidad...</option>
                    <option value="Gramo">Gramo (g)</option>
                    <option value="Mililitro">Mililitro (ml)</option>
                    <option value="Unidad">Unidad (u)</option>
                    <option value="Onza">Onza (oz)</option>
                    <option value="Kilogramo">Kilogramo (kg)</option>
                    <option value="Litro">Litro (L)</option>
                    <option value="Libra">Libra (lb)</option>
                  </select>
                </FormField>

                {/* Purchase calculator */}
                <div className="md:col-span-2 grid grid-cols-3 gap-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                  <FormField label="Precio de compra">
                    <TextInput type="number" required value={form.purchase_price === 0 ? '' : form.purchase_price} onChange={e => f('purchase_price', Number(e.target.value))} placeholder="Ej: 5000" />
                  </FormField>
                  <FormField label="¿Cómo se compra?">
                    <select required value={form.purchase_unit} onChange={e => handlePurchaseUnitChange(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none shadow-sm">
                      <option value="">Seleccionar...</option>
                      <option value="Gramos">Gramos</option>
                      <option value="Kilogramos">Kilogramos</option>
                      <option value="Mililitros">Mililitros</option>
                      <option value="Litros">Litros</option>
                      <option value="Unidades">Unidades</option>
                      <option value="Paquetes">Paquetes</option>
                      <option value="Cajas">Cajas</option>
                      <option value="Botellas">Botellas</option>
                      <option value="Latas">Latas</option>
                      <option value="Libras">Libras</option>
                      <option value="Onzas">Onzas</option>
                    </select>
                  </FormField>
                  <FormField label={`¿Cuántos ${form.usage_unit || 'g/ml'} trae?`}>
                    <TextInput type="number" required value={form.purchase_quantity === 0 ? '' : form.purchase_quantity} onChange={e => f('purchase_quantity', Number(e.target.value))} placeholder={`Ej: 1000`} />
                  </FormField>
                </div>

                <FormField label="Stock actual (General)">
                  <TextInput type="number" value={form.stock_current} onChange={e => f('stock_current', Number(e.target.value))} />
                </FormField>
                <FormField label="Stock mínimo (General)">
                  <TextInput type="number" value={form.stock_min} onChange={e => f('stock_min', Number(e.target.value))} />
                </FormField>

                {/* Per-location inventory section */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <Icon icon="heroicons:map-pin" className="text-gray-400 text-lg" />
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Stock por Sede</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {locations.map(loc => (
                      <div key={loc.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{loc.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{loc.city}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Stock</label>
                            <TextInput 
                              type="number" 
                              className="h-9 text-xs"
                              value={locationInventory[loc.id]?.stock_quantity ?? ''}
                              placeholder={form.stock_current.toString()}
                              onChange={e => setLocationInventory({
                                ...locationInventory,
                                [loc.id]: {
                                  ...locationInventory[loc.id],
                                  stock_quantity: e.target.value
                                }
                              })}
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Min.</label>
                            <TextInput 
                              type="number" 
                              className="h-9 text-xs"
                              value={locationInventory[loc.id]?.min_stock ?? ''}
                              placeholder={form.stock_min.toString()}
                              onChange={e => setLocationInventory({
                                ...locationInventory,
                                [loc.id]: {
                                  ...locationInventory[loc.id],
                                  min_stock: e.target.value
                                }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modifier toggle & Profit Margin */}
                <div className="md:col-span-2 flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Disponible como adicional/extra</p>
                      <p className="text-[12px] text-gray-400 font-medium mt-0.5">El cliente podrá añadirlo a su pedido por un costo extra.</p>
                    </div>
                    <button type="button" onClick={() => f('is_modifier', !form.is_modifier)}
                      className={`w-10 h-5 rounded-full relative transition-all ${form.is_modifier ? 'bg-[#2f4131]' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_modifier ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {form.is_modifier && (
                    <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label={`Tamaño Porción (${form.usage_unit || '...'})`}>
                         <TextInput type="number" required value={form.portion_size} onChange={e => f('portion_size', Number(e.target.value))} placeholder="Ej: 50" />
                      </FormField>
                      <FormField label="Precio Venta Cliente">
                        <TextInput type="number" required value={form.selling_price} onChange={e => f('selling_price', Number(e.target.value))} placeholder="Ej: 1500" />
                      </FormField>

                      {/* Calculated Profit Margin Display */}
                      <div className="flex flex-col justify-center">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-1">Margen de Ganancia</span>
                        <div className="flex items-baseline gap-2">
                          {(() => {
                            const portionCost = unitCost * (form.portion_size || 50);
                            const sellPrice = form.selling_price || 0;
                            const profit = sellPrice - portionCost;
                            const marginPercent = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
                            
                            return (
                              <>
                                <span className={`text-xl font-bold tabular-nums ${marginPercent > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {marginPercent.toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                  (Costo: ${portionCost.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Zero-Waste AI & Merma Switch */}
                <div className="md:col-span-2 flex flex-col p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                          Insumo con Merma Aprovechable (Zero-Waste)
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-800 px-1.5 py-0.2 rounded">Add-on IA</span>
                        </p>
                        <p className="text-xs text-slate-600 font-normal mt-0.5">
                          Activa este switch si este insumo genera recortes, tallos, pieles o huesos que el restaurante puede aprovechar en sub-recetas.
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => f('has_merma', !form.has_merma)}
                      className={`w-11 h-6 rounded-full relative transition-all cursor-pointer ${form.has_merma ? 'bg-emerald-700' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.has_merma ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {form.has_merma && (
                    <div className="pt-3 mt-2 border-t border-emerald-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                          % Estimado de Merma / Descarte
                        </label>
                        <div className="flex items-center gap-2">
                          <TextInput 
                            type="number" 
                            min="1" 
                            max="90" 
                            value={form.merma_percent || 20} 
                            onChange={e => f('merma_percent', Number(e.target.value))} 
                            placeholder="Ej: 25" 
                            className="w-28 text-xs font-bold"
                          />
                          <span className="text-xs font-bold text-emerald-800">% del peso total</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 text-xs text-slate-700 flex flex-col justify-center">
                        <p className="font-bold text-emerald-900 mb-0.5 flex items-center gap-1">
                          <Leaf size={12} className="text-emerald-600" />
                          Sugerencia Gastronómica Activa
                        </p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {getZeroWasteSuggestion(form.name)?.suggestion || 
                           'Aluna IA detectará cómo transformar estos excedentes en fondos, caldos, encurtidos o salsas para elevar tu rentabilidad.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Sticky Footer */}
              <div className="shrink-0 px-5 md:px-7 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 mt-auto bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                <SecondaryButton type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 order-2 sm:order-1">Cancelar</SecondaryButton>
                <PrimaryButton type="submit" className="flex-[2] py-3 order-1 sm:order-2">{editing ? 'Guardar cambios' : 'Crear insumo'}</PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Link Modal */}
      <LinkCatalogModal 
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          fetchIngredients(activeLocationId);
        }}
        type="inventory"
        locationId={activeLocationId}
        locationName={activeLocation?.name || 'Sede'}
      />

      {/* Batch Production Modal for Subrecipes */}
      <BatchProductionModal
        isOpen={Boolean(batchModalItem)}
        onClose={() => setBatchModalItem(null)}
        targetItem={batchModalItem}
        activeLocationId={activeLocationId}
        onProduced={() => fetchIngredients(activeLocationId)}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 2 — CATEGORÍAS
// ═══════════════════════════════════════════════════════
function CategoriasTab({ ingredients = [] }) {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useIngredientCategories();

  const [newName,        setNewName]        = useState('');
  const [editingId,      setEditingId]      = useState(null);
  const [editingName,    setEditingName]    = useState('');
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [search,         setSearch]         = useState('');

  const filtered = useMemo(() =>
    categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );

  const getCategoryCount = (catId) => ingredients.filter(i => i.category_id === catId).length;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const ok = await createCategory(newName.trim());
    if (ok) setNewName('');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) return;
    const ok = await updateCategory(editingId, editingName.trim());
    if (ok) setEditingId(null);
  };

  if (loading && !categories.length)
    return <div className="py-16 text-center text-sm text-gray-400 font-medium tracking-widest uppercase">Cargando categorías…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Create Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">Categorías de Insumos</h2>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            Organiza tus insumos para clasificar compras, reportes y mermas de almacén.
          </p>
          
          <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Nueva Categoría</h3>
            <div className="space-y-2.5">
              <TextInput
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej. Proteínas, Lácteos..."
                className="bg-slate-50 border-slate-200 focus:bg-white text-xs"
              />
              <PrimaryButton onClick={handleCreate} className="w-full justify-center text-xs h-9">
                Crear Categoría
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-2xs border border-slate-200/90">
            <div className="relative flex-1">
              <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              {filtered.length} Categorías
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((cat) => {
              const itemCount = getCategoryCount(cat.id);
              const isEditing = editingId === cat.id;
              const isDeleting = confirmDelete === cat.id;

              return (
                <div key={cat.id} className={`p-4 rounded-xl border transition-all ${
                  isEditing ? 'border-emerald-500 bg-emerald-50/20 shadow-2xs' : 
                  isDeleting ? 'border-rose-300 bg-rose-50/40 shadow-2xs' :
                  'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                }`}>
                  {isEditing ? (
                    <div className="space-y-2.5 animate-fade-in">
                      <TextInput
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                        className="bg-white text-xs"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="flex-1 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg">✕</button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    <div className="text-center space-y-2.5 animate-fade-in">
                      <p className="text-xs font-bold text-rose-800">¿Eliminar "{cat.name}"?</p>
                      <div className="flex gap-2">
                        <button onClick={() => deleteCategory(cat.id).then(() => setConfirmDelete(null))} className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-2xs">Eliminar</button>
                        <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <Icon icon="heroicons:tag" className="text-base" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name); setConfirmDelete(null); }}
                            title="Editar categoría"
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200/80 bg-white transition-colors shadow-2xs">
                            <Icon icon="heroicons:pencil-square" className="text-sm" />
                          </button>
                          <button onClick={() => { setConfirmDelete(cat.id); setEditingId(null); }}
                            title="Eliminar categoría"
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200/80 bg-white transition-colors shadow-2xs">
                            <Icon icon="heroicons:trash" className="text-sm" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{cat.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-semibold text-slate-600 rounded-md uppercase tracking-wider border border-slate-200/60">
                          {itemCount} {itemCount === 1 ? 'Insumo' : 'Insumos'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Icon icon="heroicons:tag" className="text-3xl text-slate-300 mb-2 mx-auto" />
                <p className="text-xs font-medium text-slate-400">No se encontraron categorías</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 3 — PROVEEDORES
// ═══════════════════════════════════════════════════════
function ProveedoresTab({ ingredients = [] }) {
  const { providers, loading, createProvider, updateProvider, deleteProvider } = useAdminProviders();
  const [editingId, setEditingId] = useState(null);
  
  // New States
  const [newName, setNewName] = useState('');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [newDeliveryDays, setNewDeliveryDays] = useState('');
  const [newMinOrderAmount, setNewMinOrderAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit States
  const [editingForm, setEditingForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null); // For details modal

  const filtered = useMemo(() =>
    providers.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [providers, search]
  );

  const getProviderItemCount = (provId) => ingredients.filter(i => i.provider_id === provId).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const ok = await createProvider({ 
      name: newName.trim(), 
      phone: newContactInfo.trim(),
      delivery_days: newDeliveryDays.trim(),
      min_order_amount: parseFloat(newMinOrderAmount) || null,
      notes: newNotes.trim()
    });
    if (ok) {
      setNewName(''); setNewContactInfo(''); setNewDeliveryDays(''); setNewMinOrderAmount(''); setNewNotes('');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingForm.name.trim()) return;
    const ok = await updateProvider(editingId, { 
      name: editingForm.name.trim(), 
      phone: editingForm.phone?.trim(),
      delivery_days: editingForm.delivery_days?.trim(),
      min_order_amount: parseFloat(editingForm.min_order_amount) || null,
      notes: editingForm.notes?.trim()
    });
    if (ok) setEditingId(null);
  };

  const startEdit = (prov) => {
    setEditingId(prov.id);
    setEditingForm({
      name: prov.name || '',
      phone: prov.phone || '',
      delivery_days: prov.delivery_days || '',
      min_order_amount: prov.min_order_amount || '',
      notes: prov.notes || ''
    });
    setConfirmDelete(null);
  };

  if (loading && !providers.length)
    return <div className="py-16 text-center text-sm text-gray-400 font-medium tracking-widest uppercase">Cargando proveedores…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">Proveedores de Alimentos</h2>
          <p className="text-xs text-slate-500 font-normal">Gestiona contactos comerciales, días de visita y montos mínimos de pedido.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 pl-3 rounded-xl shadow-2xs border border-slate-200/90 w-full sm:w-80">
          <Icon icon="heroicons:magnifying-glass" className="text-slate-400 text-sm shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proveedor..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none py-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Form Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden sticky top-24">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nuevo Proveedor</h3>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-3 text-xs">
              <FormField label="Razón Social">
                <TextInput required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre del proveedor" className="text-xs" />
              </FormField>
              <FormField label="WhatsApp / Tel">
                <TextInput value={newContactInfo} onChange={e => setNewContactInfo(e.target.value)} placeholder="Ej. 300..." className="text-xs" />
              </FormField>
              <FormField label="Días de Visita">
                <TextInput value={newDeliveryDays} onChange={e => setNewDeliveryDays(e.target.value)} placeholder="Lunes, Miércoles..." className="text-xs" />
              </FormField>
              <FormField label="Monto Mínimo ($)">
                <TextInput type="number" value={newMinOrderAmount} onChange={e => setNewMinOrderAmount(e.target.value)} placeholder="Mínimo pedido" className="text-xs" />
              </FormField>
              <FormField label="Notas Internas">
                <TextInput value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Horarios, Cuentas..." className="text-xs" />
              </FormField>
              <PrimaryButton type="submit" className="w-full justify-center text-xs h-9">Agregar Proveedor</PrimaryButton>
            </form>
          </div>
        </div>

        {/* Suppliers Cards Grid */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((prov) => {
              const itemCount = getProviderItemCount(prov.id);
              const isEditing = editingId === prov.id;
              const isDeleting = confirmDelete === prov.id;

              if (isEditing) return (
                <div key={prov.id} className="bg-emerald-50/20 border border-emerald-300 rounded-xl p-4 space-y-3 animate-fade-in shadow-2xs text-xs">
                   <div className="flex items-center gap-2 mb-1">
                     <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-md flex items-center justify-center">
                       <Icon icon="heroicons:pencil-square" className="text-sm" />
                     </div>
                     <h4 className="text-xs font-bold text-slate-900 uppercase">Editando Proveedor</h4>
                   </div>
                   
                   <FormField label="Razón Social">
                     <TextInput value={editingForm.name} onChange={e => setEditingForm({...editingForm, name: e.target.value})} className="text-xs" />
                   </FormField>
                   
                   <div className="grid grid-cols-2 gap-3">
                     <FormField label="WhatsApp / Tel">
                       <TextInput value={editingForm.phone} onChange={e => setEditingForm({...editingForm, phone: e.target.value})} className="text-xs" />
                     </FormField>
                     <FormField label="Días de Entrega">
                       <TextInput value={editingForm.delivery_days} onChange={e => setEditingForm({...editingForm, delivery_days: e.target.value})} className="text-xs" />
                     </FormField>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <FormField label="Monto Mínimo ($)">
                       <TextInput type="number" value={editingForm.min_order_amount} onChange={e => setEditingForm({...editingForm, min_order_amount: e.target.value})} className="text-xs" />
                     </FormField>
                     <FormField label="Notas Internas">
                       <TextInput value={editingForm.notes} onChange={e => setEditingForm({...editingForm, notes: e.target.value})} placeholder="Horarios, cuentas..." className="text-xs" />
                     </FormField>
                   </div>

                   <div className="flex justify-end gap-2 pt-2 border-t border-emerald-100">
                     <button 
                       onClick={() => setEditingId(null)} 
                       className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                     >
                       Cancelar
                     </button>
                     <PrimaryButton onClick={handleSaveEdit} className="px-4 text-xs h-8">
                       Guardar Cambios
                     </PrimaryButton>
                   </div>
                </div>
              );

              if (isDeleting) return (
                <div key={prov.id} className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 text-center animate-fade-in shadow-2xs">
                  <div className="w-9 h-9 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Icon icon="heroicons:trash" className="text-lg" />
                  </div>
                  <h4 className="text-xs font-bold text-rose-900 mb-1">¿Eliminar Proveedor?</h4>
                  <p className="text-[11px] text-rose-600 mb-3 font-medium">Esta acción desvinculará {itemCount} insumos.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">No, conservar</button>
                    <button onClick={() => deleteProvider(prov.id).then(() => setConfirmDelete(null))} className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-2xs">Sí, eliminar</button>
                  </div>
                </div>
              );

              return (
                <div key={prov.id} className="bg-white border border-slate-200/90 rounded-xl p-4 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <Icon icon="heroicons:building-office" className="text-lg" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{prov.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">{itemCount} Insumos</span>
                            {prov.min_order_amount && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 uppercase">
                                Min: ${parseFloat(prov.min_order_amount).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(prov)} title="Editar proveedor" className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200/80 bg-white transition-colors shadow-2xs"><Icon icon="heroicons:pencil-square" className="text-sm" /></button>
                        <button onClick={() => setConfirmDelete(prov.id)} title="Eliminar proveedor" className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200/80 bg-white transition-colors shadow-2xs"><Icon icon="heroicons:trash" className="text-sm" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Días Entrega</p>
                        <p className="text-xs font-semibold text-slate-700 truncate">{prov.delivery_days || 'No definido'}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Contacto Directo</p>
                        <p className="text-xs font-semibold text-slate-700 truncate">{prov.phone || 'Sin número'}</p>
                      </div>
                    </div>

                    {prov.notes && (
                      <div className="mb-3 p-2 bg-amber-50/40 border border-amber-100 rounded-lg">
                        <p className="text-[11px] italic text-amber-800 leading-snug">"{prov.notes}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    {prov.phone && (
                      <a 
                        href={`https://wa.me/${prov.phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-1 text-xs font-semibold shadow-2xs hover:bg-emerald-700 transition-colors"
                      >
                        <Icon icon="ic:baseline-whatsapp" className="text-sm" />
                        WhatsApp
                      </a>
                    )}
                    <button 
                      onClick={() => setSelectedProvider(prov)}
                      className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-1 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      Detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="py-20 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <Icon icon="heroicons:truck" className="text-4xl text-slate-300 mb-2 mx-auto" />
               <p className="text-xs font-medium text-slate-400">No hay proveedores que coincidan con la búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedProvider && (
        <Modal onClose={() => setSelectedProvider(null)}>
          <ModalHeader 
            title={selectedProvider.name} 
            subtitle="Detalles del Proveedor e Insumos Vinculados"
            onClose={() => setSelectedProvider(null)}
          />
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">WhatsApp / Tel</p>
                <p className="text-xs font-bold text-slate-900">{selectedProvider.phone || 'No registrado'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Días Entrega</p>
                <p className="text-xs font-bold text-slate-900">{selectedProvider.delivery_days || 'No definido'}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Monto Mínimo</p>
                <p className="text-xs font-extrabold text-emerald-800">
                  {selectedProvider.min_order_amount ? `$${parseFloat(selectedProvider.min_order_amount).toLocaleString()}` : 'Sin mínimo'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedProvider.notes && (
              <div className="p-3.5 bg-amber-50/40 border border-amber-100 rounded-xl">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Icon icon="heroicons:pencil-square" /> Notas Internas
                </p>
                <p className="text-xs text-amber-900 leading-relaxed font-normal">
                  {selectedProvider.notes}
                </p>
              </div>
            )}

            {/* Linked Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon icon="heroicons:archive-box" className="text-sm text-slate-500" />
                  Insumos Vinculados
                </h4>
                <Badge>{ingredients.filter(i => i.provider_id === selectedProvider.id).length} ítems</Badge>
              </div>

              <div className="space-y-2">
                {ingredients.filter(i => i.provider_id === selectedProvider.id).map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-slate-100 rounded-md flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-200/60">
                        {ing.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{ing.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Stock: {ing.stock_current} {ing.usage_unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-extrabold text-slate-900 tabular-nums">${(ing.unit_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
                       <p className="text-[10px] text-slate-400 font-medium">Costo unitario</p>
                    </div>
                  </div>
                ))}
                {ingredients.filter(i => i.provider_id === selectedProvider.id).length === 0 && (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs font-medium text-slate-400 italic">No hay insumos vinculados a este proveedor aún.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-7 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
             <SecondaryButton onClick={() => setSelectedProvider(null)}>Cerrar</SecondaryButton>
          </div>
        </Modal>
      )}

    </div>
  );
}
