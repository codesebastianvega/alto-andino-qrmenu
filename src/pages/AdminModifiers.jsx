import { useState, useEffect, useMemo } from 'react';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useIngredientCategories } from '../hooks/useIngredientCategories';
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
    selling_price: 0, is_modifier: false, category_id: '', is_active: true
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchIngredients(); }, [fetchIngredients]);

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
      category_id: item.category_id || '', is_active: item.is_active
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="md:col-span-2">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o SKU…" />
        </div>
        <SelectInput value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectInput>
        <PrimaryButton onClick={openCreate}>+ Nuevo insumo</PrimaryButton>
      </div>

      <TableContainer>
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              <Th>Insumo</Th>
              <Th>Categoría / SKU</Th>
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
                    <Badge variant="gray">{cat?.name || 'Sin categ.'}</Badge>
                    {item.sku && (
                      <p className="text-[10px] font-mono text-gray-400 mt-1">{item.sku}</p>
                    )}
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Costo unitario calculado</p>
              <p className="text-2xl font-semibold text-[#2f4131] tabular-nums mt-0.5">
                ${unitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-sm text-gray-400 font-medium ml-1">/{form.usage_unit || 'u'}</span>
              </p>
            </div>
            <p className="text-[12px] text-gray-400 font-medium max-w-[220px] text-right leading-snug">
              Si compraste 1 {form.purchase_unit} por ${form.purchase_price?.toLocaleString() || 0} con {form.purchase_quantity} unidades internas.
            </p>
          </div>

          <form onSubmit={handleSave}>
            <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Nombre">
                <TextInput required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej. Café espresso" />
              </FormField>
              <FormField label="SKU / Código">
                <TextInput value={form.sku} onChange={e => f('sku', e.target.value.toUpperCase())} placeholder="CF-001" />
              </FormField>
              <FormField label="Categoría">
                <select required value={form.category_id} onChange={e => f('category_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none">
                  <option value="">Seleccionar…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Unidad de uso (para recetas)">
                <TextInput value={form.usage_unit} onChange={e => f('usage_unit', e.target.value)} placeholder="ml, gr, oz…" />
              </FormField>

              {/* Purchase calculator */}
              <div className="md:col-span-2 grid grid-cols-3 gap-4 p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                <FormField label="Precio de compra">
                  <TextInput type="number" value={form.purchase_price} onChange={e => f('purchase_price', Number(e.target.value))} />
                </FormField>
                <FormField label="Unidad de compra">
                  <TextInput value={form.purchase_unit} onChange={e => f('purchase_unit', e.target.value)} placeholder="Litro, Caja…" />
                </FormField>
                <FormField label="Cant. interna en compra">
                  <TextInput type="number" value={form.purchase_quantity} onChange={e => f('purchase_quantity', Number(e.target.value))} />
                </FormField>
              </div>

              <FormField label="Stock actual">
                <TextInput type="number" value={form.stock_current} onChange={e => f('stock_current', Number(e.target.value))} />
              </FormField>
              <FormField label="Stock mínimo (alerta)">
                <TextInput type="number" value={form.stock_min} onChange={e => f('stock_min', Number(e.target.value))} />
              </FormField>

              {/* Modifier toggle */}
              <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Disponible como adicional/extra</p>
                  <p className="text-[12px] text-gray-400 font-medium mt-0.5">El cliente podrá añadirlo a su pedido.</p>
                </div>
                <div className="flex items-center gap-4">
                  {form.is_modifier && (
                    <FormField label="Precio venta">
                      <TextInput type="number" value={form.selling_price} onChange={e => f('selling_price', Number(e.target.value))} className="w-28" />
                    </FormField>
                  )}
                  <button type="button" onClick={() => f('is_modifier', !form.is_modifier)}
                    className={`w-10 h-5 rounded-full relative transition-all ${form.is_modifier ? 'bg-[#2f4131]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_modifier ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
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
