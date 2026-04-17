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
  { id: 'inventario',    label: 'Inventario' },
  { id: 'gestion',       label: 'Categorías & Proveedores' },
  { id: 'lista_compras', label: 'Lista de Compras' },
];

export default function AdminModifiers() {
  const [activeTab, setActiveTab] = useState('inventario');

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Tabs area starts directly */}

      {/* Sub-tabs */}
      <div className="flex bg-gray-50 p-1.5 mb-8 rounded-2xl w-fit mx-auto border border-gray-100 shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-white text-[#2f4131] shadow-md border border-gray-100'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inventario'    && <InsumosTab />}
      {activeTab === 'gestion'       && <GestionSharedTab />}
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
// TAB GESTIÓN COMPARTIDA (Categorías y Proveedores)
// ═══════════════════════════════════════════════════════
function GestionSharedTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-fade-in">
      <div>
        <CategoriasTab />
      </div>
      <div>
        <ProveedoresTab />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 1 — INVENTARIO (Antes Insumos)
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
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                          (i.sku || '').toLowerCase().includes(search.toLowerCase());
      const matchCat    = catFilter === 'all' || i.category_id === catFilter;
      const matchZero   = !showZeroOnly || !i.unit_cost || i.unit_cost === 0;
      return matchSearch && matchCat && matchZero;
    }),
    [ingredients, search, catFilter, showZeroOnly]
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
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2f4131]/10 rounded-2xl flex items-center justify-center text-[#2f4131] group-hover:scale-110 transition-transform">
              <Icon icon="heroicons:archive-box" className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Insumos</p>
              <h4 className="text-2xl font-black text-gray-900">{ingredients.length}</h4>
            </div>
          </div>
        </div>

        {/* Alertas Stock */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${lowStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon icon={lowStockCount > 0 ? "heroicons:exclamation-triangle" : "heroicons:check-badge"} className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Alertas de Stock</p>
              <h4 className={`text-2xl font-black ${lowStockCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{lowStockCount}</h4>
            </div>
          </div>
        </div>

        {/* Valor Inventario */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Icon icon="heroicons:currency-dollar" className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Valor Inventario</p>
              <h4 className="text-2xl font-black text-gray-900">
                ${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h4>
            </div>
          </div>
        </div>

        {/* Sin Costo */}
        <div className={`${zeroCostCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'} p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition-all group cursor-pointer`} onClick={() => zeroCostCount > 0 && setShowZeroOnly(!showZeroOnly)}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${zeroCostCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon icon="heroicons:no-symbol" className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sin Costo</p>
              <h4 className={`text-2xl font-black ${zeroCostCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{zeroCostCount}</h4>
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
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${stockLow ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-[#2f4131]'}`}
                          style={{ width: `${Math.min(100, (item.stock_current / Math.max(1, item.stock_min)) * 50)}%` }}
                        />
                      </div>
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
              <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-gray-400 font-medium">
                {showZeroOnly ? 'Sin resultados con precio $0 — ¡todos tienen costo definido!' : 'Sin resultados.'}
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
function CategoriasTab() {
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

  const handleDelete = async (id) => {
    await deleteCategory(id);
    setConfirmDelete(null);
  };

  return (
    <div className="max-w-2xl">
      {/* Header + create */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">Categorías</p>
          <p className="text-[12px] text-gray-400 font-medium mt-0.5">{categories.length} categorías registradas</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <TextInput
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nueva categoría…"
            className="sm:w-52"
          />
          <PrimaryButton onClick={handleCreate}>Crear</PrimaryButton>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrar categorías…" />
      </div>

      {/* List */}
      {loading && !categories.length ? (
        <div className="py-12 text-center text-sm text-gray-400">Cargando…</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400 font-medium">
              {search ? 'Sin coincidencias.' : 'Aún no hay categorías.'}
            </div>
          )}
          {filtered.map((cat, i) => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <div className="flex items-center gap-2 p-3">
                  <span className="text-[11px] text-gray-300 font-medium w-6 text-center shrink-0">{i + 1}</span>
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 px-4 py-2 bg-gray-50 border-2 border-[#2f4131] rounded-xl text-sm font-medium focus:outline-none"
                  />
                  <PrimaryButton onClick={handleSaveEdit}>Guardar</PrimaryButton>
                  <SecondaryButton onClick={() => setEditingId(null)}>✕</SecondaryButton>
                </div>
              ) : confirmDelete === cat.id ? (
                <div className="flex items-center justify-between p-3 bg-red-50">
                  <p className="text-sm font-medium text-red-700">
                    ¿Eliminar <strong>"{cat.name}"</strong>?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(cat.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[12px] font-semibold hover:bg-red-700 transition-all">
                      Eliminar
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-[12px] font-semibold hover:bg-gray-50 transition-all">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50/60 transition-colors">
                  <span className="text-[11px] text-gray-300 font-medium w-6 text-center shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingId(cat.id); setEditingName(cat.name); setConfirmDelete(null); }}
                      className="px-2.5 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      Renombrar
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(cat.id); setEditingId(null); }}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 3 — PROVEEDORES
// ═══════════════════════════════════════════════════════
function ProveedoresTab() {
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

  const handleDelete = async (id) => {
    const ok = await deleteProvider(id);
    if (ok) setConfirmDelete(null);
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
    return <div className="py-16 text-center text-sm text-gray-400 font-medium">Cargando proveedores…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Proveedores</p>
          <p className="text-[12px] text-gray-400 font-medium mt-0.5">{providers.length} proveedores registrados</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Añadir nuevo proveedor</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 items-end">
          <FormField label="Nombre (Obligatorio)">
            <TextInput required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Frutas Pérez" />
          </FormField>
          <FormField label="Contacto / WhatsApp">
            <TextInput value={newContactInfo} onChange={e => setNewContactInfo(e.target.value)} placeholder="Ej. 3001234567" />
          </FormField>
          <FormField label="Días de Entrega">
            <TextInput value={newDeliveryDays} onChange={e => setNewDeliveryDays(e.target.value)} placeholder="Ej. Lunes y Jueves" />
          </FormField>
          <FormField label="Pedido Mínimo ($)">
            <TextInput type="number" step="0.01" value={newMinOrderAmount} onChange={e => setNewMinOrderAmount(e.target.value)} placeholder="Ej. 150000" />
          </FormField>
          <FormField label="Notas (Cuentas bancarias, horarios...)">
            <TextInput value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Notas adicionales..." />
          </FormField>
          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit">Agregar Proveedor</PrimaryButton>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {providers.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 font-medium">
            No hay proveedores registrados.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {providers.map((prov, i) => (
              <div key={prov.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                {editingId === prov.id ? (
                  <div className="grid grid-cols-1 gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <FormField label="Nombre"><TextInput value={editingForm.name} onChange={e => setEditingForm({...editingForm, name: e.target.value})} /></FormField>
                    <FormField label="Contacto"><TextInput value={editingForm.phone} onChange={e => setEditingForm({...editingForm, phone: e.target.value})} /></FormField>
                    <FormField label="Días Entrega"><TextInput value={editingForm.delivery_days} onChange={e => setEditingForm({...editingForm, delivery_days: e.target.value})} /></FormField>
                    <FormField label="Pedido Mín ($)"><TextInput type="number" value={editingForm.min_order_amount} onChange={e => setEditingForm({...editingForm, min_order_amount: e.target.value})} /></FormField>
                    <FormField label="Notas"><TextInput value={editingForm.notes} onChange={e => setEditingForm({...editingForm, notes: e.target.value})} /></FormField>
                    <div className="flex justify-end gap-2 mt-2">
                      <SecondaryButton onClick={() => setEditingId(null)}>Cancelar</SecondaryButton>
                      <PrimaryButton onClick={handleSaveEdit}>Guardar</PrimaryButton>
                    </div>
                  </div>
                ) : confirmDelete === prov.id ? (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-sm font-medium text-red-700">¿Eliminar proveedor?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-bold">Cancelar</button>
                      <button onClick={() => handleDelete(prov.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">Eliminar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] text-gray-300 font-bold w-5">{i + 1}.</span>
                        <h4 className="text-sm font-bold text-gray-900">{prov.name}</h4>
                        {prov.phone && <Badge variant="gray">{prov.phone}</Badge>}
                      </div>
                      <div className="text-xs text-gray-500 pl-7 space-y-1">
                        {prov.delivery_days && <p>📦 Entregas: <span className="font-medium text-gray-700">{prov.delivery_days}</span></p>}
                        {prov.min_order_amount && <p>💰 Min. Pedido: <span className="font-medium text-gray-700">${parseFloat(prov.min_order_amount).toLocaleString()}</span></p>}
                        {prov.notes && <p className="italic">📝 {prov.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 pl-7 sm:pl-0">
                      <button onClick={() => startEdit(prov)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Editar</button>
                      <button onClick={() => setConfirmDelete(prov.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
