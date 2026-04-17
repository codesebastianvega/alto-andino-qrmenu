import { useState, useEffect, useMemo } from 'react';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useIngredientCategories } from '../hooks/useIngredientCategories';
import { useAdminProviders } from '../hooks/useAdminProviders';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  TableContainer, Th, SearchInput, SelectInput,
  Modal, ModalHeader, FormField, TextInput
} from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';

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
  const [activeTab, setActiveTab] = useState('inventario');
  const { ingredients } = useAdminIngredients();

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Tabs Menu */}
      <div className="flex bg-gray-50/50 backdrop-blur-xl p-1.5 mb-8 rounded-2xl w-fit mx-auto border border-gray-100 shadow-sm sticky top-4 z-50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-white text-[#2f4131] shadow-md border border-gray-100 ring-1 ring-gray-200/50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
            }`}
          >
            <Icon icon={tab.icon} className={activeTab === tab.id ? 'text-[#2f4131]' : 'text-gray-300'} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inventario'    && <InsumosTab />}
      {activeTab === 'categorias'    && <CategoriasTab ingredients={ingredients} />}
      {activeTab === 'proveedores'   && <ProveedoresTab ingredients={ingredients} />}
      {activeTab === 'lista_compras' && <ListaComprasTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB LISTA COMPRAS
// ═══════════════════════════════════════════════════════
import { ShoppingListBoard } from '../components/admin/ShoppingListBoard';

function ListaComprasTab() {
  const { ingredients, fetchIngredients } = useAdminIngredients();
  const { providers, fetchProviders } = useAdminProviders();

  useEffect(() => {
    fetchIngredients();
    fetchProviders();
  }, [fetchIngredients, fetchProviders]);

  return (
    <div className="animate-fade-in">
      <ShoppingListBoard ingredients={ingredients} providers={providers} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 1 — INVENTARIO
// ═══════════════════════════════════════════════════════
function InsumosTab() {
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
  const [showZeroOnly,  setShowZeroOnly]  = useState(false);
  // inlineEdit: { id, purchase_price, purchase_quantity, purchase_unit, usage_unit }
  const [inlineEdit,    setInlineEdit]    = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = {
    name: '', description: '', sku: '',
    purchase_price: 0, purchase_unit: 'Unidad', purchase_quantity: 1,
    usage_unit: 'unidad', stock_current: 0, stock_min: 0,
    selling_price: 0, is_modifier: false, category_id: '', provider_id: '', is_active: true
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchIngredients(); fetchProviders(); }, [fetchIngredients, fetchProviders]);

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
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const filtered = useMemo(() =>
    ingredients.filter(i => {
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
      
      const matchCat    = catFilter === 'all' || i.category_id === catFilter;
      const matchZero   = !showZeroOnly || !i.unit_cost || i.unit_cost === 0;
      return matchSearch && matchCat && matchZero;
    }),
    [ingredients, search, catFilter, showZeroOnly, totalInventoryValue]
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsOpen(true); };
  const openEdit   = (item) => {
    setEditing(item);
    setForm({
      name: item.name, description: item.description || '', sku: item.sku || '',
      purchase_price: item.purchase_price || 0, purchase_unit: item.purchase_unit || 'Unidad',
      purchase_quantity: item.purchase_quantity || 1, usage_unit: item.usage_unit || 'unidad',
      stock_current: item.stock_current || 0, stock_min: item.stock_min || 0,
      selling_price: item.selling_price || 0, is_modifier: item.is_modifier || false,
      category_id: item.category_id || '', provider_id: item.provider_id || '', is_active: item.is_active,
      portion_size: item.portion_size || 50
    });
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
    const ok = editing
      ? await updateIngredient(editing.id, form)
      : await createIngredient(form);
    if (ok) setIsOpen(false);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
        {/* Total Insumos */}
        <div 
          className="glass-glow p-6 rounded-[2rem] border border-white/20 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer"
          onClick={() => {
            setSearch('');
            setCatFilter('all');
            setShowZeroOnly(false);
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2f4131]/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-[#2f4131]/10 rounded-2xl flex items-center justify-center text-[#2f4131] group-hover:rotate-12 transition-transform">
              <Icon icon="heroicons:archive-box" className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Insumos Activos</p>
              <h4 className="text-3xl font-black text-gray-900">{ingredients.length}</h4>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <Icon icon="heroicons:arrow-trending-up" />
                Sincronizado
              </p>
            </div>
          </div>
        </div>

        {/* Alertas Stock */}
        <div 
          className={`glass-glow p-6 rounded-[2rem] border ${lowStockCount > 0 ? 'border-rose-200/50 bg-rose-50/10' : 'border-white/20'} shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer`} 
          onClick={() => {
            if (lowStockCount > 0) {
              setSearch('stock_bajo');
              setShowZeroOnly(false); // Clear conflicting filter
            }
          }}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 ${lowStockCount > 0 ? 'bg-rose-500/5' : 'bg-emerald-500/5'} rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 ${lowStockCount > 0 ? 'bg-rose-100/80 text-rose-600' : 'bg-emerald-100/80 text-emerald-600'} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-inner`}>
              <Icon icon={lowStockCount > 0 ? "heroicons:exclamation-triangle" : "heroicons:check-badge"} className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Nivel de Stock</p>
              <h4 className={`text-3xl font-black ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{lowStockCount}</h4>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">
                {lowStockCount > 0 ? 'Acción requerida' : 'Niveles óptimos'}
              </p>
            </div>
          </div>
        </div>

        {/* Valor Inventario */}
        <div 
          className="glass-glow p-6 rounded-[2rem] border border-white/20 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer"
          onClick={() => {
            setSearch('high_value');
            setShowZeroOnly(false);
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-transform shadow-inner">
              <Icon icon="heroicons:currency-dollar" className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Valor Real</p>
              <h4 className="text-3xl font-black text-gray-900 tabular-nums">
                ${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h4>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">En almacén</p>
            </div>
          </div>
        </div>

        {/* Sin Costo */}
        <div 
          className={`glass-glow p-6 rounded-[2rem] border ${zeroCostCount > 0 ? 'border-amber-200/50 bg-amber-50/10' : 'border-white/20'} shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer`} 
          onClick={() => {
            if (zeroCostCount > 0) {
              setShowZeroOnly(!showZeroOnly);
              setSearch(''); // Clear search to avoid clashing
            }
          }}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 ${zeroCostCount > 0 ? 'bg-amber-500/5' : 'bg-gray-500/5'} rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 ${zeroCostCount > 0 ? 'bg-amber-100/80 text-amber-600' : 'bg-gray-100/80 text-gray-400'} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-inner`}>
              <Icon icon="heroicons:no-symbol" className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Sin Costo</p>
              <h4 className={`text-3xl font-black ${zeroCostCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{zeroCostCount}</h4>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Pendientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8 bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full lg:w-auto">
          <div className="relative group flex-1 w-full sm:min-w-[300px]">
            <Icon 
              icon="heroicons:magnifying-glass" 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2f4131] transition-colors" 
            />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2f4131]/20 focus:bg-white transition-all shadow-sm group-hover:border-gray-200"
            />
          </div>
          <div className="relative group w-full sm:w-64">
             <Icon 
              icon="heroicons:funnel" 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2f4131] transition-colors" 
            />
            <select 
              value={catFilter} 
              onChange={e => setCatFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2f4131]/20 focus:bg-white transition-all shadow-sm group-hover:border-gray-200 appearance-none"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Icon icon="heroicons:chevron-down" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <PrimaryButton onClick={openCreate} className="h-11 px-6 w-full lg:w-auto">
          <Icon icon="heroicons:plus-circle" className="text-xl mr-2" />
          Nuevo Insumo
        </PrimaryButton>
      </div>

      <TableContainer className="rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden bg-white">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <Th className="py-4 pl-8">Insumo / SKU</Th>
              <Th className="py-4">Categoría / Prov.</Th>
              <Th className="py-4">Costo Unit.</Th>
              <Th className="py-4">Stock / Alerta</Th>
              <Th className="py-4">Valor Stock</Th>
              <Th className="py-4">Última Act.</Th>
              <Th right className="py-4 pr-8">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(item => {
              const cat      = categories.find(c => c.id === item.category_id);
              const stockLow = item.stock_current <= item.stock_min;
              const hasZero  = !item.unit_cost || item.unit_cost === 0;
              const isInline = inlineEdit?.id === item.id;
              const isDelConf= confirmDelete === item.id;

              // ── Delete confirmation row
              if (isDelConf) return (
                <tr key={item.id}>
                  <td colSpan={6} className="px-8 py-4 bg-red-50/50">
                    <div className="flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                          <Icon icon="heroicons:trash" />
                        </div>
                        <p className="text-sm font-bold text-red-700">
                          ¿Eliminar <span className="underline decoration-red-200 decoration-2">{item.name}</span> del inventario?
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { deleteIngredient(item.id); setConfirmDelete(null); }}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-sm transition-all">
                          Sí, Eliminar
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );

              // ── Inline cost editor row
              if (isInline) return (
                <tr key={item.id} className="bg-blue-50/40">
                  <td className="px-5 py-4" colSpan={6}>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex-1 min-w-[160px]">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Insumo</p>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-[11px] text-gray-400 font-medium capitalize">{item.usage_unit}</p>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Precio de compra</label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 text-sm">$</span>
                          <input
                            autoFocus
                            type="number"
                            value={inlineEdit.purchase_price}
                            onChange={e => fi('purchase_price', Number(e.target.value))}
                            className="w-28 px-3 py-2 bg-white border-2 border-blue-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-200 outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Cant. interna</label>
                        <input
                          type="number"
                          value={inlineEdit.purchase_quantity}
                          onChange={e => fi('purchase_quantity', Number(e.target.value))}
                          className="w-24 px-3 py-2 bg-white border-2 border-blue-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Unidad compra</label>
                        <input
                          type="text"
                          value={inlineEdit.purchase_unit}
                          onChange={e => fi('purchase_unit', e.target.value)}
                          className="w-24 px-3 py-2 bg-white border-2 border-blue-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                      </div>
                      {/* Live cost preview */}
                      <div className="flex-1 min-w-[120px] text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Costo unitario</p>
                        <p className={`text-xl font-semibold tabular-nums ${
                          inlineUnitCost > 0 ? 'text-[#2f4131]' : 'text-gray-300'
                        }`}>
                          ${inlineUnitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          <span className="text-[11px] text-gray-400 font-medium ml-1">/{item.usage_unit}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveInlineCost}
                          className="px-4 py-2 bg-[#2f4131] text-white rounded-xl text-[12px] font-semibold hover:opacity-90 transition-all">
                          Guardar
                        </button>
                        <button onClick={() => setInlineEdit(null)}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[12px] font-semibold hover:bg-gray-50 transition-all">
                          Cancelar
                        </button>
                        <button onClick={() => openEdit(item)}
                          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl text-[12px] font-semibold transition-all">
                          Editar todo…
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );

              // ── Normal row
              return (
                <tr key={item.id} className={`group transition-all ${
                  hasZero ? 'bg-amber-50/5 hover:bg-amber-50/20' : 'hover:bg-gray-50/80'
                } ${!item.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  {/* Name column */}
                  <td className="py-5 pl-8">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                        item.is_active ? 'bg-[#2f4131]/10 text-[#2f4131]' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {item.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.usage_unit || 'unidad'}</span>
                           {item.sku && (
                             <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono font-bold">
                               {item.sku}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category / Provider column */}
                  <td className="py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                           {cat?.name || 'Sin Categ.'}
                         </span>
                      </div>
                      {item.provider_id && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                           <Icon icon="heroicons:truck" className="text-xs" />
                           {providers.find(p => p.id === item.provider_id)?.name || 'Proveedor'}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Cost column */}
                  <td className="py-5">
                    {hasZero ? (
                      <button
                        onClick={() => openInlineEdit(item)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-100/50 hover:bg-amber-100 text-amber-700 rounded-xl text-[11px] font-bold transition-all border border-amber-200/50"
                      >
                        <Icon icon="heroicons:currency-dollar" className="text-sm" />
                        Fijar precio
                      </button>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 tabular-nums">
                          ${(item.unit_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Por {item.usage_unit || 'u'}</span>
                      </div>
                    )}
                  </td>

                  {/* Stock column */}
                  <td className="py-5">
                    <div className="flex flex-col gap-1.5 max-w-[140px]">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-black tabular-nums ${stockLow ? 'text-rose-500' : 'text-[#2f4131]'}`}>
                          {item.stock_current} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{item.usage_unit}</span>
                        </span>
                        {stockLow && (
                          <span className="flex items-center gap-1 justify-center h-5 w-5 bg-rose-500 text-white rounded-full animate-pulse shadow-lg shadow-rose-200">
                            <Icon icon="heroicons:exclamation-circle" className="text-xs" />
                          </span>
                        )}
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden shadow-inner border border-gray-100">
                        {(() => {
                          const percentage = Math.min(100, (item.stock_current / Math.max(1, item.stock_min * 2)) * 100);
                          const isCritical = item.stock_current <= item.stock_min;
                          const isWarning = item.stock_current <= item.stock_min * 1.5;
                          
                          let colorClass = 'bg-[#2f4131]';
                          if (isCritical) colorClass = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
                          else if (isWarning) colorClass = 'bg-amber-400';

                          return (
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                              style={{ width: `${percentage}%` }}
                            />
                          );
                        })()}
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Mín: {item.stock_min}</p>
                    </div>
                  </td>

                  {/* Valor Stock column */}
                  <td className="py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 tabular-nums">
                        ${((item.unit_cost || 0) * (item.stock_current || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Valor total</p>
                    </div>
                  </td>

                  {/* Last updated column */}
                  <td className="py-5">
                    <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                       <Icon icon="heroicons:clock" className="text-xs" />
                       <span className="text-xs">{formatRelativeTime(item.updated_at)}</span>
                    </div>
                  </td>

                  {/* Actions column */}
                  <td className="py-5 pr-8 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md bg-white border border-transparent hover:border-blue-100">
                        <Icon icon="heroicons:pencil-square" className="text-lg" />
                      </button>
                      <button onClick={() => { setConfirmDelete(item.id); setInlineEdit(null); }}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm hover:shadow-md bg-white border border-transparent hover:border-rose-100">
                        <Icon icon="heroicons:trash" className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-400 font-medium animate-fade-in">
                {showZeroOnly ? (
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="heroicons:check-badge" className="text-3xl text-emerald-500" />
                    <span>¡Todos tus insumos tienen un costo definido!</span>
                  </div>
                ) : search === 'stock_bajo' ? (
                   <div className="flex flex-col items-center gap-2">
                    <Icon icon="heroicons:check-circle" className="text-3xl text-emerald-500" />
                    <span>No hay insumos con stock bajo. ¡Buen trabajo!</span>
                  </div>
                ) : search === 'high_value' ? (
                  <div className="flex flex-col items-center gap-2">
                   <Icon icon="heroicons:information-circle" className="text-3xl text-blue-500" />
                   <span>No hay insumos con valor significativamente alto actualmente.</span>
                 </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="heroicons:magnifying-glass" className="text-3xl text-gray-300" />
                    <span>No se encontraron insumos que coincidan con la búsqueda.</span>
                  </div>
                )}
              </td></tr>
            )}
          </tbody>
        </table>
      </TableContainer>

      {/* Modal */}
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)} wide>
          <ModalHeader
            title={editing ? 'Editar insumo' : 'Nuevo insumo'}
            subtitle={editing ? editing.name : 'Completa los datos del nuevo insumo.'}
            onClose={() => setIsOpen(false)}
          />

          {/* Cost indicator banner */}
          <div className="px-7 py-4 bg-[#2f4131]/5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2f4131]">Costo para recetas</p>
              <p className="text-2xl font-semibold text-[#2f4131] tabular-nums mt-0.5">
                ${unitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-sm text-gray-500 font-medium ml-1">/{form.usage_unit || 'unidad de uso'}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-gray-500 font-medium max-w-[260px] leading-snug">
                Fórmula de costo: <br/>
                <span className="font-semibold text-gray-700">${form.purchase_price?.toLocaleString() || 0}</span> (compra) ÷ <span className="font-semibold text-gray-700">{form.purchase_quantity || 1}</span> (equivalencia)
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Nombre">
                <TextInput required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej. Aguacate, Café, Pollo" />
              </FormField>
              <FormField label="SKU / Código">
                <TextInput value={form.sku} onChange={e => f('sku', e.target.value.toUpperCase())} placeholder="INS-001" />
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

              <FormField label="Stock actual">
                <TextInput type="number" value={form.stock_current} onChange={e => f('stock_current', Number(e.target.value))} />
              </FormField>
              <FormField label="Stock mínimo (alerta)">
                <TextInput type="number" value={form.stock_min} onChange={e => f('stock_min', Number(e.target.value))} />
              </FormField>

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
            </div>

            <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
              <SecondaryButton type="button" onClick={() => setIsOpen(false)} className="flex-1">Cancelar</SecondaryButton>
              <PrimaryButton type="submit" className="flex-[2]">{editing ? 'Guardar cambios' : 'Crear insumo'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
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
    <div className="space-y-8 animate-fade-in">
      {/* Header & Create Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Categorías</h2>
          <p className="text-sm text-gray-500 font-medium">
            Organiza tus insumos para facilitar la gestión de inventario y costos.
          </p>
          
          <div className="mt-6 p-6 bg-[#2f4131]/5 rounded-[2rem] border border-[#2f4131]/10">
            <h3 className="text-xs font-bold text-[#2f4131] uppercase tracking-widest mb-4">Nueva Categoría</h3>
            <div className="space-y-3">
              <TextInput
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej. Proteínas, Lácteos..."
                className="bg-white border-transparent focus:border-[#2f4131] shadow-sm"
              />
              <PrimaryButton onClick={handleCreate} className="w-full justify-center">
                Crear Categoría
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Toolbar */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative flex-1 group">
              <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2f4131]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#2f4131]/10 outline-none transition-all"
              />
            </div>
            <div className="hidden sm:block text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {filtered.length} Total
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((cat) => {
              const itemCount = getCategoryCount(cat.id);
              const isEditing = editingId === cat.id;
              const isDeleting = confirmDelete === cat.id;

              return (
                <div key={cat.id} className={`group relative p-5 rounded-[1.5rem] border transition-all ${
                  isEditing ? 'border-emerald-500 bg-emerald-50/10' : 
                  isDeleting ? 'border-rose-500 bg-rose-50/10' :
                  'bg-white border-gray-100 hover:border-gray-300 hover:shadow-lg'
                }`}>
                  {isEditing ? (
                    <div className="space-y-3 animate-fade-in">
                      <TextInput
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                        className="bg-white"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="flex-1 py-2 bg-[#2f4131] text-white text-xs font-bold rounded-xl shadow-sm">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl">✕</button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    <div className="text-center space-y-3 animate-fade-in">
                      <p className="text-sm font-bold text-rose-700">¿Eliminar "{cat.name}"?</p>
                      <div className="flex gap-2">
                        <button onClick={() => deleteCategory(cat.id).then(() => setConfirmDelete(null))} className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-sm">Eliminar</button>
                        <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl text-center">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#2f4131]/10 group-hover:text-[#2f4131] transition-colors">
                          <Icon icon="heroicons:tag" className="text-xl" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name); setConfirmDelete(null); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <Icon icon="heroicons:pencil-square" />
                          </button>
                          <button onClick={() => { setConfirmDelete(cat.id); setEditingId(null); }}
                            className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                            <Icon icon="heroicons:trash" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 mb-1">{cat.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-500 rounded-md uppercase tracking-wider">
                          {itemCount} {itemCount === 1 ? 'Insumo' : 'Insumos'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                <Icon icon="heroicons:tag" className="text-4xl text-gray-200 mb-2 mx-auto" />
                <p className="text-sm font-bold text-gray-400">No se encontraron categorías</p>
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
    <div className="space-y-8 animate-fade-in">
      {/* Header & Control Panel */}
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Proveedores</h2>
          <p className="text-sm text-gray-500 font-medium">Gestiona tu red de suministros y contactos directos.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 pl-4 rounded-2xl shadow-sm border border-gray-100 min-w-0 lg:w-96">
          <Icon icon="heroicons:magnifying-glass" className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nombre del proveedor..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Form Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden sticky top-24">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Nuevo Contacto</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <FormField label="Razón Social">
                <TextInput required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre del proveedor" />
              </FormField>
              <FormField label="WhatsApp / Tel">
                <TextInput value={newContactInfo} onChange={e => setNewContactInfo(e.target.value)} placeholder="Ej. 300..." />
              </FormField>
              <FormField label="Días de Visita">
                <TextInput value={newDeliveryDays} onChange={e => setNewDeliveryDays(e.target.value)} placeholder="Lunes, Miércoles..." />
              </FormField>
              <FormField label="Monto Mínimo ($)">
                <TextInput type="number" value={newMinOrderAmount} onChange={e => setNewMinOrderAmount(e.target.value)} placeholder="Mínimo pedido" />
              </FormField>
              <FormField label="Notas Internas">
                <TextInput value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Horarios, Cuentas..." />
              </FormField>
              <PrimaryButton type="submit" className="w-full justify-center">Agregar Proveedor</PrimaryButton>
            </form>
          </div>
        </div>

        {/* Suppliers Cards Grid */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((prov) => {
              const itemCount = getProviderItemCount(prov.id);
              const isEditing = editingId === prov.id;
              const isDeleting = confirmDelete === prov.id;

              if (isEditing) return (
                <div key={prov.id} className="bg-emerald-50/10 border-2 border-emerald-200 rounded-[2rem] p-6 space-y-4 animate-fade-in shadow-xl">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                       <Icon icon="heroicons:pencil-square" className="text-xl" />
                     </div>
                     <h4 className="text-sm font-black text-gray-900 uppercase">Editando Proveedor</h4>
                   </div>
                   
                   <FormField label="Razón Social">
                     <TextInput value={editingForm.name} onChange={e => setEditingForm({...editingForm, name: e.target.value})} />
                   </FormField>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <FormField label="WhatsApp / Contacto">
                       <TextInput value={editingForm.phone} onChange={e => setEditingForm({...editingForm, phone: e.target.value})} />
                     </FormField>
                     <FormField label="Días de Entrega">
                       <TextInput value={editingForm.delivery_days} onChange={e => setEditingForm({...editingForm, delivery_days: e.target.value})} />
                     </FormField>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                     <FormField label="Monto Mínimo de Pedido ($)">
                       <TextInput type="number" value={editingForm.min_order_amount} onChange={e => setEditingForm({...editingForm, min_order_amount: e.target.value})} />
                     </FormField>
                     <FormField label="Notas Internas">
                       <TextInput value={editingForm.notes} onChange={e => setEditingForm({...editingForm, notes: e.target.value})} placeholder="Horarios, números de cuenta, etc." />
                     </FormField>
                   </div>

                   <div className="flex justify-end gap-3 pt-4 border-t border-emerald-100">
                     <button 
                       onClick={() => setEditingId(null)} 
                       className="px-6 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                     >
                       Cancelar
                     </button>
                     <PrimaryButton onClick={handleSaveEdit} className="px-8">
                       Guardar Cambios
                     </PrimaryButton>
                   </div>
                </div>
              );

              if (isDeleting) return (
                <div key={prov.id} className="bg-rose-50 border-2 border-rose-200 rounded-[2rem] p-6 text-center animate-fade-in">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="heroicons:trash" className="text-2xl" />
                  </div>
                  <h4 className="text-sm font-black text-rose-900 mb-2">¿Eliminar Proveedor?</h4>
                  <p className="text-xs text-rose-600 mb-6 font-medium">Esta acción desvinculará {itemCount} insumos.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-white border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">No, conservar</button>
                    <button onClick={() => deleteProvider(prov.id).then(() => setConfirmDelete(null))} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold">Sí, eliminar</button>
                  </div>
                </div>
              );

              return (
                <div key={prov.id} className="group glass-glow border border-gray-100 rounded-[2rem] p-6 hover:shadow-2xl hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-50 rounded-[1.25rem] flex items-center justify-center group-hover:bg-[#2f4131]/10 transition-colors">
                        <Icon icon="heroicons:building-office" className="text-2xl text-gray-400 group-hover:text-[#2f4131]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 group-hover:text-[#2f4131] transition-colors">{prov.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{itemCount} Productos</span>
                          {prov.min_order_amount && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                              Min: ${parseFloat(prov.min_order_amount).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(prov)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><Icon icon="heroicons:pencil-square" /></button>
                      <button onClick={() => setConfirmDelete(prov.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"><Icon icon="heroicons:trash" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50/50 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Días Entrega</p>
                      <p className="text-xs font-bold text-gray-700">{prov.delivery_days || 'No definido'}</p>
                    </div>
                    <div className="p-3 bg-gray-50/50 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Contacto Directo</p>
                      <p className="text-xs font-bold text-gray-700">{prov.phone || 'Sin número'}</p>
                    </div>
                  </div>

                  {prov.notes && (
                    <div className="mb-6 p-4 bg-amber-50/30 border border-amber-100/50 rounded-2xl">
                      <p className="text-[10px] italic text-amber-700 leading-relaxed font-medium">"{prov.notes}"</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {prov.phone && (
                      <a 
                        href={`https://wa.me/${prov.phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-[2] py-3 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:scale-[1.02] transition-all active:scale-95"
                      >
                        <Icon icon="ic:baseline-whatsapp" className="text-lg" />
                        WhatsApp
                      </a>
                    )}
                    <button 
                      onClick={() => setSelectedProvider(prov)}
                      className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                      Detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
               <Icon icon="heroicons:truck" className="text-5xl text-gray-200 mb-4 mx-auto" />
               <p className="text-base font-bold text-gray-400">No hay proveedores que coincidan con la búsqueda</p>
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
          <div className="p-7 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">WhatsApp</p>
                <p className="text-sm font-bold text-gray-900">{selectedProvider.phone || 'No registrado'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Días Entrega</p>
                <p className="text-sm font-bold text-gray-900">{selectedProvider.delivery_days || 'No definido'}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Monto Mínimo</p>
                <p className="text-sm font-bold text-emerald-700">
                  {selectedProvider.min_order_amount ? `$${parseFloat(selectedProvider.min_order_amount).toLocaleString()}` : 'Sin mínimo'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedProvider.notes && (
              <div className="p-5 bg-amber-50/30 border border-amber-100 rounded-2xl">
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Icon icon="heroicons:pencil-square" /> Notas Internas
                </p>
                <p className="text-sm text-amber-900 leading-relaxed font-medium">
                  {selectedProvider.notes}
                </p>
              </div>
            )}

            {/* Linked Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Icon icon="heroicons:archive-box" className="text-lg text-[#2f4131]" />
                  Insumos Vinculados
                </h4>
                <Badge>{ingredients.filter(i => i.provider_id === selectedProvider.id).length} ítems</Badge>
              </div>

              <div className="space-y-3">
                {ingredients.filter(i => i.provider_id === selectedProvider.id).map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-xs font-bold">
                        {ing.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ing.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Stock: {ing.stock_current} {ing.usage_unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-gray-900">${(ing.unit_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Costo unitario</p>
                    </div>
                  </div>
                ))}
                {ingredients.filter(i => i.provider_id === selectedProvider.id).length === 0 && (
                  <div className="py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-xs font-bold text-gray-400 italic">No hay insumos vinculados a este proveedor aún.</p>
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
