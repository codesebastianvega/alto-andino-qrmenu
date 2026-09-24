import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useLocations } from '../hooks/useLocations';
import { useLocationPayments } from '../hooks/useLocationPayments';
import { FormField, TextInput, Switch } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, Trash2, Globe, MapPin, ShieldCheck, Settings2 } from 'lucide-react';
import { toast as toastFn } from '../components/Toast';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

const PAYMENT_TYPES = [
  { id: 'cash', label: 'Efectivo', icon: 'solar:money-bag-bold', bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80' },
  { id: 'transfer', label: 'Transferencia', icon: 'solar:transfer-horizontal-bold', bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80' },
  { id: 'card', label: 'Tarjeta', icon: 'solar:card-2-bold', bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/80' },
  { id: 'digital_wallet', label: 'Billetera Digital', icon: 'solar:wallet-bold', bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/80' },
  { id: 'other', label: 'Otro', icon: 'solar:bill-list-bold', bg: 'bg-gray-600', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200/80' }
];

export default function AdminPaymentMethods() {
  // --- DATA FETCHING ---
  const { 
    paymentMethods: brandMethods, 
    loading: loadingBrand, 
    createPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod 
  } = usePaymentMethods();
  
  const { locations, loading: loadingLocs, updateLocation } = useLocations();
  
  // View State: 'brand' or locationId
  const [activeContext, setActiveContext] = useState('brand');
  const selectedLocation = useMemo(() => 
    activeContext === 'brand' ? null : locations.find(l => l.id === activeContext)
  , [activeContext, locations]);

  const { 
    locationPayments, 
    loading: loadingLocPayments,
    togglePaymentMethod: toggleLocMethod,
  } = useLocationPayments(selectedLocation?.id);

  // --- UI STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingIsolation, setIsChangingIsolation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    icon: 'solar:money-bag-bold',
    is_active: true
  });

  const openModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name || '',
        type: method.type || 'cash',
        icon: method.icon || 'solar:money-bag-bold',
        is_active: method.is_active ?? true
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: 'cash',
        icon: 'solar:money-bag-bold',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleTypeChange = (typeId) => {
    const selectedType = PAYMENT_TYPES.find(t => t.id === typeId);
    setFormData({
      ...formData,
      type: typeId,
      icon: selectedType?.icon || 'solar:bill-list-bold'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSaving(true);
    let result;
    if (editingMethod) {
      result = await updatePaymentMethod(editingMethod.id, formData);
    } else {
      result = await createPaymentMethod(formData);
    }
    setIsSaving(false);

    if (result.error) {
      toast.error('Error al guardar: ' + result.error.message);
    } else {
      toast.success(editingMethod ? 'Medio de pago actualizado' : 'Medio de pago creado');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Estás seguro de eliminar "${name}"?`)) return;
    const { error } = await deletePaymentMethod(id);
    if (error) toast.error('Error al eliminar');
    else toast.success('Medio de pago eliminado');
  };

  const toggleBrandStatus = async (method) => {
    const { error } = await updatePaymentMethod(method.id, { is_active: !method.is_active });
    if (error) toast.error('Error al cambiar estado');
    else toast.success(method.is_active ? 'Medio de pago desactivado' : 'Medio de pago activado');
  };

  const handleToggleIsolation = async () => {
    if (!selectedLocation) return;
    setIsChangingIsolation(true);
    try {
      const newValue = !selectedLocation.independent_payments;
      const { error } = await updateLocation(selectedLocation.id, { 
        independent_payments: newValue 
      });
      if (error) throw error;
      toast.success(newValue ? 'Gestión independiente activada' : 'Gestión por marca activada');
    } catch (err) {
      toast.error('Error al cambiar modo de gestión');
    } finally {
      setIsChangingIsolation(false);
    }
  };

  const handleToggleLocStatus = async (method) => {
    if (!selectedLocation) return;
    const lp = locationPayments.find(p => p.payment_method_id === method.id);
    const currentlyActive = lp ? lp.is_active : false;
    
    const { error } = await toggleLocMethod(method.id, !currentlyActive);
    if (error) toast.error('Error al cambiar estado local');
    else toast.success(!currentlyActive ? 'Activado localmente' : 'Desactivado localmente');
  };

  if (loadingBrand || loadingLocs) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando medios de pago...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Context Switcher (Segmented Control) */}
      <div className="bg-gray-100/90 rounded-2xl p-1.5 border border-gray-200/70 inline-flex items-center gap-1 max-w-full overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveContext('brand')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeContext === 'brand' 
              ? 'bg-white text-gray-900 shadow-xs' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Globe size={14} className={activeContext === 'brand' ? 'text-[#2f4131]' : 'text-gray-400'} />
          <span>Global (Marca)</span>
        </button>
        
        <div className="w-px h-4 bg-gray-300/70 mx-1 shrink-0" />

        {locations.map(loc => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActiveContext(loc.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeContext === loc.id 
                ? 'bg-white text-gray-900 shadow-xs' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <MapPin size={14} className={activeContext === loc.id ? 'text-[#2f4131]' : 'text-gray-400'} />
            <span>{loc.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div>
        {/* Brand Context */}
        {activeContext === 'brand' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">Catálogo Global de Pagos</h3>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {brandMethods.length} {brandMethods.length === 1 ? 'método' : 'métodos'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Configura los medios de pago disponibles para toda la marca.</p>
              </div>
              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Icon icon="solar:add-circle-bold" className="text-base" />
                <span>Añadir Medio</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {brandMethods.map((method) => (
                <PaymentMethodCard 
                  key={method.id}
                  method={method}
                  onEdit={() => openModal(method)}
                  onDelete={() => handleDelete(method.id, method.name)}
                  onToggle={() => toggleBrandStatus(method)}
                />
              ))}
              
              {brandMethods.length === 0 && <EmptyState onAdd={() => openModal()} />}
            </div>
          </div>
        )}

        {/* Location Context */}
        {activeContext !== 'brand' && selectedLocation && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Isolation Control Banner */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedLocation.independent_payments ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {selectedLocation.independent_payments ? <ShieldCheck size={20} /> : <Globe size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-gray-900 tracking-tight">
                        {selectedLocation.independent_payments ? 'Gestión Independiente de Pagos' : 'Sincronizado con la Marca'}
                      </h4>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        Sede: {selectedLocation.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
                      {selectedLocation.independent_payments 
                        ? 'Esta sede gestiona su propio catálogo de medios de pago. Los cambios globales de la marca no afectarán a este punto.'
                        : 'Esta sede utiliza automáticamente todos los medios de pago globales de la marca.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleIsolation}
                disabled={isChangingIsolation}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedLocation.independent_payments 
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                    : 'bg-[#2f4131] hover:bg-[#253527] text-white shadow-xs'
                }`}
              >
                {isChangingIsolation ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  selectedLocation.independent_payments ? (
                    <>
                      <Globe size={14} />
                      <span>Sincronizar con Marca</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Gestionar por Sede</span>
                    </>
                  )
                )}
              </button>
            </div>

            {/* Methods Selection for Sede */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-all ${
              !selectedLocation.independent_payments ? 'opacity-40 pointer-events-none' : ''
            }`}>
              {brandMethods.map((method) => {
                const lp = locationPayments.find(p => p.payment_method_id === method.id);
                const isActiveHere = lp ? lp.is_active : false;
                const typeInfo = PAYMENT_TYPES.find(t => t.id === method.type) || PAYMENT_TYPES[4];
                
                return (
                  <div 
                    key={method.id} 
                    className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                      isActiveHere 
                        ? 'border-gray-200/80 shadow-xs' 
                        : 'border-gray-200/50 opacity-60'
                    }`}
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${typeInfo.bg}`}>
                            <Icon icon={method.icon || 'solar:bill-list-bold'} className="text-xl" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 tracking-tight truncate leading-snug">
                              {method.name}
                            </h4>
                            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 border ${typeInfo.light} ${typeInfo.text} ${typeInfo.border}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button 
                        type="button"
                        onClick={() => handleToggleLocStatus(method)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          isActiveHere 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${isActiveHere ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span>{isActiveHere ? 'Activo en Sede' : 'Inactivo'}</span>
                      </button>

                      {isActiveHere && !loadingLocPayments && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Settings2 size={13} />
                          <span>Local</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hint for non-active isolation */}
            {!selectedLocation.independent_payments && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mb-2 border border-gray-200">
                  <Globe size={18} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Catálogo Sincronizado</h4>
                <p className="max-w-sm text-xs text-gray-500 mt-1">
                  Para activar o desactivar medios específicos para esta sede, haz clic en <strong>Gestionar por Sede</strong> arriba.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Añadir / Editar Medio */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/60">
                  <Icon icon="solar:card-2-bold" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    {editingMethod ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Configura la categoría y nombre para tus comensales.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                {/* Type Selection */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Categoría de Transacción *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PAYMENT_TYPES.map((type) => {
                      const isSelected = formData.type === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleTypeChange(type.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                            isSelected
                              ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon icon={type.icon} className="text-base shrink-0" />
                          <span className="truncate">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name */}
                <FormField label="Nombre del Medio de Pago *">
                  <TextInput
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Transferencia Nequi 312..."
                    required
                  />
                </FormField>

                {/* Status Toggle */}
                <div 
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    formData.is_active 
                      ? 'bg-emerald-50/60 border-emerald-200/80 shadow-2xs' 
                      : 'bg-white border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      formData.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon icon={formData.is_active ? "solar:shield-check-bold" : "solar:shield-minus-bold"} className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">Disponibilidad Inmediata</p>
                      <p className="text-[11px] text-gray-500">Visible para clientes al finalizar la orden</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.is_active} 
                    onChange={(val) => setFormData({ ...formData, is_active: val })} 
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-2.5 rounded-b-2xl shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="px-5 py-2 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Icon icon="solar:diskette-bold-duotone" className="text-base" />
                      <span>{editingMethod ? 'Guardar Cambios' : 'Crear Medio'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

function PaymentMethodCard({ method, onEdit, onDelete, onToggle }) {
  const typeInfo = PAYMENT_TYPES.find(t => t.id === method.type) || PAYMENT_TYPES[4];
  
  return (
    <div className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
      method.is_active 
        ? 'border-gray-200/80 hover:border-gray-300 shadow-xs hover:shadow-sm' 
        : 'border-gray-200/50 opacity-60'
    }`}>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${typeInfo.bg}`}>
              <Icon icon={method.icon || 'solar:bill-list-bold'} className="text-xl" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-900 tracking-tight truncate leading-snug">
                {method.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${typeInfo.light} ${typeInfo.text} ${typeInfo.border}`}>
                  {typeInfo.label}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  #{method.id.slice(0, 6)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              type="button"
              onClick={onEdit} 
              className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
              title="Editar medio"
            >
              <Icon icon="solar:pen-new-square-linear" className="text-sm" />
            </button>
            <button 
              type="button"
              onClick={onDelete} 
              className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
              title="Eliminar medio"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
        <button 
          type="button"
          onClick={onToggle}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
            method.is_active 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${method.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          <span>{method.is_active ? 'Activo Global' : 'Inactivo'}</span>
        </button>

        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {method.is_active ? 'Visible en checkout' : 'Oculto'}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mb-4 border border-gray-200">
        <Icon icon="solar:wallet-bold" className="text-2xl" />
      </div>
      <h4 className="text-base font-bold text-gray-900 tracking-tight">Sin medios de pago configurados</h4>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">
        Registra tus opciones de cobro (Efectivo, Transferencia Nequi/Daviplata, Datáfono) para que los clientes puedan pagar.
      </p>
      <button 
        type="button"
        onClick={onAdd} 
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
      >
        <Icon icon="solar:add-circle-bold" className="text-base" />
        <span>Añadir Medio de Pago</span>
      </button>
    </div>
  );
}
