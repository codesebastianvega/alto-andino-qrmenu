import { useState, useMemo } from 'react';
import { useAdminProviders } from '../../../hooks/useAdminProviders';
import { FormField, TextInput, PrimaryButton, SecondaryButton, Modal, ModalHeader, Badge } from '../ui';
import { Icon } from '@iconify-icon/react';

export function ProveedoresTab({ ingredients = [] }) {
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
      setNewName('');
      setNewContactInfo('');
      setNewDeliveryDays('');
      setNewMinOrderAmount('');
      setNewNotes('');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingForm.name?.trim()) return;
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

  if (loading && !providers.length) {
    return (
      <div className="py-16 text-center text-sm text-gray-400 font-medium tracking-widest uppercase">
        Cargando proveedores…
      </div>
    );
  }

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
                <TextInput value={newDeliveryDays} onChange={e => setNewDeliveryDays(e.target.value)} placeholder="Ej. Martes y Jueves" className="text-xs" />
              </FormField>
              <FormField label="Monto Mínimo de Pedido ($)">
                <TextInput type="number" value={newMinOrderAmount} onChange={e => setNewMinOrderAmount(e.target.value)} placeholder="Ej. 150000" className="text-xs" />
              </FormField>
              <FormField label="Notas Internas">
                <TextInput value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Condiciones comerciales, horarios..." className="text-xs" />
              </FormField>
              <PrimaryButton type="submit" className="w-full justify-center text-xs h-9 mt-2">
                Registrar Proveedor
              </PrimaryButton>
            </form>
          </div>
        </div>

        {/* Providers Cards Grid */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(prov => {
              const itemCount = getProviderItemCount(prov.id);
              const isEditing = editingId === prov.id;
              const isDeleting = confirmDelete === prov.id;

              if (isEditing) {
                return (
                  <div key={prov.id} className="bg-emerald-50/20 border border-emerald-300 rounded-xl p-4 space-y-3 animate-fade-in shadow-2xs text-xs">
                    <FormField label="Razón Social">
                      <TextInput autoFocus value={editingForm.name} onChange={e => setEditingForm({...editingForm, name: e.target.value})} className="text-xs" />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="WhatsApp / Tel">
                        <TextInput value={editingForm.phone} onChange={e => setEditingForm({...editingForm, phone: e.target.value})} className="text-xs" />
                      </FormField>
                      <FormField label="Días de Visita">
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
              }

              if (isDeleting) {
                return (
                  <div key={prov.id} className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 text-center animate-fade-in shadow-2xs">
                    <div className="w-9 h-9 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Icon icon="heroicons:trash" className="text-lg" />
                    </div>
                    <h4 className="text-xs font-bold text-rose-900 mb-1">¿Eliminar Proveedor?</h4>
                    <p className="text-[11px] text-rose-600 mb-3 font-medium">Esta acción desvinculará {itemCount} insumos.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                        No, conservar
                      </button>
                      <button onClick={() => deleteProvider(prov.id).then(() => setConfirmDelete(null))} className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-2xs">
                        Sí, eliminar
                      </button>
                    </div>
                  </div>
                );
              }

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
                        <button
                          onClick={() => startEdit(prov)}
                          title="Editar proveedor"
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200/80 bg-white transition-colors shadow-2xs"
                        >
                          <Icon icon="heroicons:pencil-square" className="text-sm" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(prov.id)}
                          title="Eliminar proveedor"
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200/80 bg-white transition-colors shadow-2xs"
                        >
                          <Icon icon="heroicons:trash" className="text-sm" />
                        </button>
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
                <Badge>{ingredients.filter(i => i.provider_id === selectedProvider.id).length} Ítems</Badge>
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
                      <p className="text-xs font-extrabold text-slate-900 tabular-nums">
                        ${(ing.unit_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </p>
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
