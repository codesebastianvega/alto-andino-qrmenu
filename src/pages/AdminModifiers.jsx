import { useState, useEffect, useMemo } from 'react';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useIngredientCategories } from '../hooks/useIngredientCategories';
import { useAdminProviders } from '../hooks/useAdminProviders';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  TableContainer, Th, SearchInput, SelectInput,
  Modal, ModalHeader, FormField, TextInput
} from '../components/admin/ui';

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const TABS = [
  { id: 'insumos',    label: 'Insumos' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'proveedores', label: 'Proveedores' },
];

export default function AdminModifiers() {
  const [activeTab, setActiveTab] = useState('insumos');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        badge="Producción"
        title="Inventario de Insumos"
        subtitle="Costos unitarios, stock y materias primas."
      />

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-[#2f4131] border-[#2f4131]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'insumos'    && <InsumosTab />}
      {activeTab === 'categorias' && <CategoriasTab />}
      {activeTab === 'proveedores' && <ProveedoresTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 1 — INSUMOS
// ═══════════════════════════════════════════════════════
function InsumosTab() {
  const {
    ingredients, loading, fetchIngredients,
    createIngredient, updateIngredient, deleteIngredient
  } = useAdminIngredients();

  const { categories } = useIngredientCategories();
  const { providers, fetchProviders } = useAdminProviders();

  const [isOpen,        setIsOpen]        = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [search,        setSearch]        = useState('');
  const [catFilter,     setCatFilter]     = useState('all');
  const [showZeroOnly,  setShowZeroOnly]  = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  // Group low stock items
  const lowStockItems = useMemo(() => ingredients.filter(i => i.stock_current <= i.stock_min), [ingredients]);
  const groupedByProvider = useMemo(() => {
    return lowStockItems.reduce((acc, item) => {
      const pId = item.provider_id || 'sin-proveedor';
      if (!acc[pId]) acc[pId] = [];
      acc[pId].push(item);
      return acc;
    }, {});
  }, [lowStockItems]);
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
      {/* Stats / alert bar */}
      {zeroCostCount > 0 && (
        <div className="mb-4 flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {zeroCostCount} insumo{zeroCostCount !== 1 ? 's' : ''} sin precio definido
              </p>
              <p className="text-[12px] text-amber-600 font-medium">Esto afecta el cálculo de márgenes en recetas.</p>
            </div>
          </div>
          <button
            onClick={() => setShowZeroOnly(v => !v)}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              showZeroOnly
                ? 'bg-amber-500 text-white shadow-inner'
                : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {showZeroOnly ? '✓ Mostrando solo sin precio' : 'Ver solo sin precio'}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex-1">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o SKU…" />
        </div>
        <SelectInput value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-full md:w-48">
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectInput>
        <button
          onClick={() => setIsShoppingListOpen(true)}
          className="px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-all flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          Lista Compras {lowStockItems.length > 0 && <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">{lowStockItems.length}</span>}
        </button>
        <PrimaryButton onClick={openCreate}>+ Nuevo insumo</PrimaryButton>
      </div>

      <TableContainer>
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              <Th>Insumo</Th>
              <Th>Status / Categoría</Th>
              <Th>Costo/unidad</Th>
              <Th>Precio venta</Th>
              <Th>Stock</Th>
              <Th right>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(item => {
              const cat      = categories.find(c => c.id === item.category_id);
              const stockLow = item.stock_current <= item.stock_min;
              const hasZero  = !item.unit_cost || item.unit_cost === 0;
              const isInline = inlineEdit?.id === item.id;
              const isDelConf= confirmDelete === item.id;

              // ── Delete confirmation row
              if (isDelConf) return (
                <tr key={item.id}>
                  <td colSpan={6} className="px-5 py-3 bg-red-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-red-700">
                        ¿Eliminar <strong>"{item.name}"</strong>? Esta acción no se puede deshacer.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => { deleteIngredient(item.id); setConfirmDelete(null); }}
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
                <tr key={item.id} className={`group transition-colors ${
                  hasZero ? 'hover:bg-amber-50/30 bg-amber-50/10' : 'hover:bg-gray-50/60'
                }`}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-[11px] text-gray-400 font-medium capitalize mt-0.5">{item.usage_unit || 'unidad'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="gray">{cat?.name || 'Sin categ.'}</Badge>
                      {stockLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          BAJO STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          OK
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {hasZero ? (
                      <button
                        onClick={() => openInlineEdit(item)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-[12px] font-semibold transition-all"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Fijar precio
                      </button>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                          ${(item.unit_cost || 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium ml-1">/{item.usage_unit || 'u'}</span>
                      </>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {item.is_modifier ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 tabular-nums">
                          ${(item.selling_price || 0).toLocaleString()}
                        </p>
                        <Badge variant="blue">Extra vendible</Badge>
                      </div>
                    ) : (
                      <span className="text-[12px] text-gray-300 font-medium">Uso interno</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold tabular-nums ${stockLow ? 'text-red-500' : 'text-gray-900'}`}>
                        {item.stock_current}
                      </span>
                      <div className="w-10 h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stockLow ? 'bg-red-400' : 'bg-green-400'}`}
                          style={{ width: `${Math.min(100, (item.stock_current / Math.max(1, item.stock_min)) * 50)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasZero && (
                        <button onClick={() => openInlineEdit(item)}
                          className="px-3 py-1.5 text-[12px] font-semibold text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                          Fijar precio
                        </button>
                      )}
                      <button onClick={() => openEdit(item)}
                        className="px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        Editar
                      </button>
                      <button onClick={() => { setConfirmDelete(item.id); setInlineEdit(null); }}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                        <TrashIcon />
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

      {/* Shopping List Modal */}
      {isShoppingListOpen && (
        <Modal title="Lista de Compras Inteligente" onClose={() => setIsShoppingListOpen(false)}>
          <div className="space-y-6">
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <div>
                <h4 className="font-semibold text-sm mb-1">Insumos con bajo stock</h4>
                <p className="text-[13px] opacity-90">Agrupados por proveedor para enviar pedidos fácilmente por WhatsApp.</p>
              </div>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-medium">
                Todo parece estar en orden. No hay insumos con stock crítico. 🎉
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {Object.entries(groupedByProvider).map(([provId, items]) => {
                  const provider = providers.find(p => p.id === provId);
                  const provName = provider ? provider.name : 'Sin Proveedor Asignado';
                  
                  const message = `Hola${provider ? ` ${provider.name}` : ''}, necesito hacer el siguiente pedido:\n` + items.map(i => `- ${i.name}`).join('\n');
                  const waLink = provider?.contact_info
                    ? `https://wa.me/${provider.contact_info.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
                    : `https://wa.me/?text=${encodeURIComponent(message)}`;

                  return (
                    <div key={provId} className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                          {provName}
                        </h3>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[12px] font-semibold bg-[#25D366]/10 text-[#075E54] hover:bg-[#25D366]/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.662-2.06r-.006-.002c-.173-.298-.018-.46.13-.608.134-.134.298-.348.446-.522.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Enviar Pedido
                        </a>
                      </div>
                      <div className="p-4">
                        <ul className="space-y-3">
                          {items.map(i => (
                            <li key={i.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="font-semibold text-gray-800">{i.name}</span>
                              </div>
                              <div className="flex gap-4 text-gray-500 text-[12px]">
                                <span>Stock: <strong className="text-red-600">{i.stock_current}</strong></span>
                                {i.stock_ideal && <span>Ideal: <strong>{i.stock_ideal}</strong></span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
  const [editingName, setEditingName] = useState('');
  const [editingContactInfo, setEditingContactInfo] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [newName, setNewName] = useState('');
  const [newContactInfo, setNewContactInfo] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const ok = await createProvider({ name: newName.trim(), contact_info: newContactInfo.trim() });
    if (ok) {
      setNewName('');
      setNewContactInfo('');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) return;
    const ok = await updateProvider(editingId, { name: editingName.trim(), contact_info: editingContactInfo.trim() });
    if (ok) setEditingId(null);
  };

  const handleDelete = async (id) => {
    const ok = await deleteProvider(id);
    if (ok) setConfirmDelete(null);
  };

  if (loading && !providers.length)
    return <div className="py-16 text-center text-sm text-gray-400 font-medium">Cargando proveedores…</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Formulario de creación */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Añadir nuevo proveedor</h3>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <FormField label="Nombre del Proveedor">
              <TextInput required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Frutas Pérez" />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="Contacto / WhatsApp (Opcional)">
              <TextInput value={newContactInfo} onChange={e => setNewContactInfo(e.target.value)} placeholder="Ej. 3001234567 o Dirección" />
            </FormField>
          </div>
          <div className="pb-1">
            <PrimaryButton type="submit">Agregar</PrimaryButton>
          </div>
        </form>
      </div>

      {/* Lista de proveedores */}
      {providers.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400 font-medium">
          No hay proveedores registrados.<br/>
          Crea el primero para empezar a organizar tus compras.
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {providers.map((prov, i) => (
            <div key={prov.id}>
              {editingId === prov.id ? (
                <div className="flex items-center gap-2 p-3">
                  <span className="text-[11px] text-gray-300 font-medium w-6 text-center shrink-0">{i + 1}</span>
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 px-4 py-2 bg-gray-50 border-2 border-[#2f4131] rounded-xl text-sm font-medium focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editingContactInfo}
                    onChange={e => setEditingContactInfo(e.target.value)}
                    placeholder="Contacto (Opcional)"
                    className="flex-1 px-4 py-2 bg-gray-50 border-2 border-[#2f4131] rounded-xl text-sm font-medium focus:outline-none"
                  />
                  <PrimaryButton onClick={handleSaveEdit}>Guardar</PrimaryButton>
                  <SecondaryButton onClick={() => setEditingId(null)}>✕</SecondaryButton>
                </div>
              ) : confirmDelete === prov.id ? (
                <div className="flex items-center justify-between p-3 bg-red-50">
                  <p className="text-sm font-medium text-red-700">
                    ¿Eliminar <strong>"{prov.name}"</strong>?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(prov.id)}
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
                  <div className="flex-1 flex flex-col">
                    <span className="text-sm font-medium text-gray-800">{prov.name}</span>
                    {prov.contact_info && <span className="text-[11px] text-gray-500">{prov.contact_info}</span>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingId(prov.id); setEditingName(prov.name); setEditingContactInfo(prov.contact_info || ''); setConfirmDelete(null); }}
                      className="px-2.5 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(prov.id); setEditingId(null); }}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <TrashIcon />
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
