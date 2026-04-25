import React, { useState, useMemo, useEffect } from 'react';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useLocations } from '../hooks/useLocations';
import { useLocationPayments } from '../hooks/useLocationPayments';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, Trash2, Globe, MapPin, ShieldCheck, ShieldAlert, Sparkles, ChevronRight, Settings2 } from 'lucide-react';
import { toast as toastFn } from '../components/Toast';
import { supabase } from '../config/supabase';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

const PAYMENT_TYPES = [
  { id: 'cash', label: 'Efectivo', icon: 'solar:money-bag-bold', color: 'emerald' },
  { id: 'transfer', label: 'Transferencia', icon: 'solar:transfer-horizontal-bold', color: 'blue' },
  { id: 'card', label: 'Tarjeta', icon: 'solar:card-2-bold', color: 'indigo' },
  { id: 'digital_wallet', label: 'Billetera Digital', icon: 'solar:wallet-bold', color: 'purple' },
  { id: 'other', label: 'Otro', icon: 'solar:bill-list-bold', color: 'gray' }
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
    updateLocationPaymentConfig
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

  // --- RENDER HELPERS ---
  if (loadingBrand || loadingLocs) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
           <Loader2 className="w-10 h-10 animate-spin text-[#2f4131]" />
           <div className="absolute inset-0 blur-xl bg-[#2f4131]/20 rounded-full animate-pulse" />
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-[#2f4131]/60 italic">Cargando ecosistema de pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* --- CONTEXT SWITCHER (Vision Glass Tabs) --- */}
      <div className="relative">
        <div className="flex items-center gap-1 p-1 bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-100/50 shadow-sm overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveContext('brand')}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] transition-all whitespace-nowrap ${
              activeContext === 'brand' 
                ? 'bg-white shadow-lg border border-gray-100 text-[#2f4131]' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
            }`}
          >
            <Globe size={16} className={activeContext === 'brand' ? 'animate-pulse' : ''} />
            <span className="text-xs font-black uppercase tracking-widest italic">Global (Marca)</span>
          </button>
          
          <div className="w-[1px] h-6 bg-gray-200/50 mx-2" />

          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => setActiveContext(loc.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] transition-all whitespace-nowrap ${
                activeContext === loc.id 
                  ? 'bg-white shadow-lg border border-gray-100 text-[#2f4131]' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
              }`}
            >
              <MapPin size={16} />
              <span className="text-xs font-black uppercase tracking-widest italic">{loc.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="relative min-h-[400px]">
        {/* State: Branding Settings */}
        {activeContext === 'brand' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-gray-900 leading-none tracking-tight uppercase italic break-words">
                  Catálogo <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#2f4131] to-[#1a241b]">Global</span>
                </h1>
                <p className="mt-2 text-sm font-bold text-gray-400 uppercase tracking-wider italic">
                  Medios de pago disponibles para toda la marca.
                </p>
              </div>
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-[#2f4131] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#2f4131]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                Añadir Medio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        {/* State: Location Settings */}
        {activeContext !== 'brand' && selectedLocation && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Isolation Control Banner */}
            <div className={`relative overflow-hidden rounded-[2.5rem] border p-8 md:p-10 transition-all duration-700 ${
              selectedLocation.independent_payments 
                ? 'bg-white border-gray-100 shadow-2xl' 
                : 'bg-gradient-to-br from-gray-50 to-white border-gray-200/60'
            }`}>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#2f4131]/[0.03] rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      selectedLocation.independent_payments ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {selectedLocation.independent_payments ? <ShieldCheck size={24} /> : <Globe size={24} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
                        {selectedLocation.independent_payments ? 'Gestión Independiente' : 'Sincronizado con Marca'}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedLocation.independent_payments ? 'bg-amber-500' : 'bg-[#2f4131]'}`} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider italic">
                          Sede: {selectedLocation.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed font-semibold pr-4">
                    {selectedLocation.independent_payments 
                      ? 'Esta sede ignora la configuración global y utiliza su propio catálogo de medios de pago seleccionado. Ideal para franquicias o sucursales con cajas independientes.'
                      : 'Esta sede utiliza automáticamente todos los medios de pago configurados a nivel de Marca. Cualquier cambio global se reflejará aquí instantáneamente.'}
                  </p>
                </div>

                <button
                  onClick={handleToggleIsolation}
                  disabled={isChangingIsolation}
                  className={`group relative flex items-center gap-4 px-8 py-5 rounded-3xl font-black uppercase tracking-[0.1em] text-xs transition-all ${
                    selectedLocation.independent_payments 
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                      : 'bg-[#2f4131] text-white shadow-xl shadow-[#2f4131]/20 hover:scale-[1.02]'
                  }`}
                >
                  {isChangingIsolation ? <Loader2 size={18} className="animate-spin" /> : (
                    selectedLocation.independent_payments ? (
                      <>
                        <Globe size={18} />
                        Volver a Marca
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Gestionar por Sede
                      </>
                    )
                  )}
                  <ChevronRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Methods Selection for Sede */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500 ${
              !selectedLocation.independent_payments ? 'opacity-40 pointer-events-none filter blur-[2px]' : ''
            }`}>
              {brandMethods.map((method) => {
                const lp = locationPayments.find(p => p.payment_method_id === method.id);
                const isActiveHere = lp ? lp.is_active : false;
                
                return (
                  <div key={method.id} className={`relative bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden group ${
                    isActiveHere ? 'border-[#2f4131]/20 shadow-xl' : 'border-gray-100 opacity-60 grayscale-[0.5]'
                  }`}>
                    {/* Glass Overlay for disabled context */}
                    {!selectedLocation.independent_payments && (
                      <div className="absolute inset-0 z-10 bg-white/5 backdrop-blur-[1px] flex items-center justify-center" />
                    )}

                    <div className="p-8">
                       <div className="flex justify-between items-start mb-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:scale-110 ${
                          method.type === 'cash' ? 'bg-emerald-500 shadow-emerald-500/20' :
                          method.type === 'transfer' ? 'bg-blue-500 shadow-blue-500/20' :
                          method.type === 'card' ? 'bg-indigo-500 shadow-indigo-500/20' :
                          method.type === 'digital_wallet' ? 'bg-purple-500 shadow-purple-500/20' : 'bg-gray-500'
                        }`}>
                          <Icon icon={method.icon || 'solar:bill-list-bold'} width="36" />
                        </div>
                        
                        <div className="flex flex-col items-end">
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                             <span className="text-[10px] font-black uppercase text-gray-400">Tipo</span>
                             <span className="text-[10px] font-black uppercase text-gray-900 italic">
                                {PAYMENT_TYPES.find(t => t.id === method.type)?.label || 'Otro'}
                             </span>
                           </div>
                        </div>
                      </div>

                      <h4 className="font-black text-gray-900 text-2xl leading-tight uppercase italic break-words">{method.name}</h4>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">ID: {method.id.slice(0, 8)}</p>
                    </div>

                    <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                      <button 
                        onClick={() => handleToggleLocStatus(method)}
                        className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest ${
                          isActiveHere 
                            ? 'bg-white border-[#2f4131]/10 text-[#2f4131] shadow-sm' 
                            : 'bg-gray-100 border-gray-200 text-gray-400'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${isActiveHere ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                        {isActiveHere ? 'Activado en Sede' : 'No disponible'}
                      </button>
                      
                      {isActiveHere && !loadingLocPayments && (
                        <div className="flex items-center gap-2 text-emerald-600 animate-pulse">
                          <Settings2 size={16} />
                          <span className="text-[10px] font-bold uppercase italic">Local</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hint for non-active isolation */}
            {!selectedLocation.independent_payments && (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                 <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                    <Globe size={24} className="text-gray-300" />
                 </div>
                 <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.1em] italic">Catálogo en Modo Sincronización</h4>
                 <p className="max-w-xs text-xs text-gray-400 font-medium italic mt-2">
                    Para activar o desactivar medios específicos para esta sede, primero activa la <strong>Gestión Independiente</strong> arriba.
                 </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODAL (Vision Glass Style) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white/95 w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
             {/* Modal Header */}
             <div className="sticky top-0 z-10 px-10 py-10 border-b border-gray-100 bg-white/80 backdrop-blur-md flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-10 h-[2px] bg-emerald-500 rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Constructor</span>
                </div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                  {editingMethod ? 'Refinar' : 'Crear'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2f4131] to-emerald-600">Medio</span>
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="group w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 border border-gray-100"
              >
                <Icon icon="solar:close-circle-linear" width="32" className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-10 py-10 space-y-10">
              {/* Type Grid */}
              <div className="space-y-6">
                <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest italic ml-1">
                   <Sparkles size={14} className="text-emerald-500" />
                   Categoría de Transacción
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {PAYMENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeChange(type.id)}
                      className={`relative flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                        formData.type === type.id
                          ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-2xl shadow-[#2f4131]/20 scale-[1.02]'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        formData.type === type.id ? 'bg-white/20' : 'bg-gray-50'
                      }`}>
                        <Icon icon={type.icon} className="text-2xl" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{type.label}</span>
                      
                      {formData.type === type.id && (
                        <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full blur-xl animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-6">
                 <label className="block text-xs font-black uppercase text-gray-400 tracking-widest italic ml-1">
                   Identidad del Medio
                 </label>
                 <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Transferencia Nequi 312..."
                  required
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[2rem] px-8 py-6 text-xl font-black text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-[#2f4131]/5 transition-all uppercase"
                />
              </div>

              {/* Status Toggle */}
              <div className={`flex items-center gap-5 p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${
                formData.is_active ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-gray-50/50 border-gray-100'
              }`} onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  formData.is_active ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-200 text-gray-400'
                }`}>
                  <Icon icon={formData.is_active ? "solar:shield-check-bold" : "solar:shield-minus-bold"} width="32" />
                </div>
                <div className="flex-1">
                  <span className="block text-sm font-black uppercase text-gray-900 tracking-tight">Disponibilidad Inmediata</span>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase italic tracking-tight">Los clientes podrán seleccionar este medio al finalizar</span>
                </div>
                <div className={`w-14 h-8 rounded-full relative transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                   <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${formData.is_active ? 'left-7' : 'left-1'}`} />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-10 border-t border-gray-100 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 rounded-[2rem] py-5 border border-gray-100 font-black uppercase tracking-widest text-[11px] text-gray-400 hover:bg-gray-50 transition-colors italic"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="flex-[2] flex items-center justify-center gap-3 bg-[#2f4131] text-white rounded-[2rem] py-5 shadow-2xl shadow-[#2f4131]/30 font-black uppercase tracking-[0.15em] text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all italic disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                       <Icon icon="solar:check-read-linear" className="w-5 h-5" />
                       {editingMethod ? 'Guardar Cambios' : 'Desplegar Medio'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

function PaymentMethodCard({ method, onEdit, onDelete, onToggle }) {
  const typeInfo = PAYMENT_TYPES.find(t => t.id === method.type) || PAYMENT_TYPES[4];
  
  return (
    <div className={`relative bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden group hover:translate-y-[-4px] ${
      method.is_active ? 'border-gray-100 shadow-xl' : 'border-gray-100 opacity-60 grayscale-[0.8]'
    }`}>
      {/* Decorative Gradient Overlay */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl transition-opacity duration-700 opacity-20 group-hover:opacity-40 ${
        typeInfo.color === 'emerald' ? 'bg-emerald-400' :
        typeInfo.color === 'blue' ? 'bg-blue-400' :
        typeInfo.color === 'indigo' ? 'bg-indigo-400' :
        typeInfo.color === 'purple' ? 'bg-purple-400' : 'bg-gray-400'
      }`} />

      <div className="p-8 pb-4">
        <div className="flex justify-between items-start mb-6 w-full">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110 ${
            method.type === 'cash' ? 'bg-emerald-500 shadow-emerald-500/20' :
            method.type === 'transfer' ? 'bg-blue-500 shadow-blue-500/20' :
            method.type === 'card' ? 'bg-indigo-500 shadow-indigo-500/20' :
            method.type === 'digital_wallet' ? 'bg-purple-500 shadow-purple-500/20' : 'bg-gray-500'
          }`}>
            <Icon icon={method.icon || 'solar:bill-list-bold'} width="36" />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={onEdit} 
              className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 hover:shadow-lg transition-all"
              title="Editar"
            >
              <Icon icon="solar:pen-new-square-linear" width="22" />
            </button>
            <button 
              onClick={onDelete} 
              className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-lg transition-all"
              title="Eliminar"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="font-black text-gray-900 text-2xl leading-tight uppercase italic break-words">{method.name}</h4>
          <div className="flex items-center gap-1.5">
             <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em] italic">Ecosistema {typeInfo.label}</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 flex items-center justify-between">
        <button 
          onClick={onToggle}
          className={`group flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest ${
            method.is_active 
              ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-xl shadow-[#2f4131]/20' 
              : 'bg-gray-100 border-gray-100 text-gray-400'
          }`}
        >
          <div className={`w-2 h-2 rounded-full transition-all ${method.is_active ? 'bg-white shadow-[0_0_8px_white]' : 'bg-gray-400'}`} />
          {method.is_active ? 'Activado Global' : 'Desactivado'}
        </button>
        
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Referencia</span>
           <span className="text-[10px] font-black text-gray-400 uppercase italic">#{method.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="col-span-full relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-[4rem] border border-dashed border-gray-200 p-20 flex flex-col items-center justify-center text-center group">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="relative">
        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 shadow-inner ring-8 ring-white transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
          <Icon icon="solar:wallet-broken-linear" className="text-gray-300" width="48" />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">Ecosistema Vacío</h4>
          <p className="text-sm text-gray-400 max-w-[320px] font-medium leading-relaxed italic mx-auto">
            Aún no has configurado arterias de ingreso. Activa medios de pago para que tus clientes puedan concretar sus delicias.
          </p>
        </div>

        <button 
          onClick={onAdd} 
          className="mt-10 group flex items-center gap-4 bg-[#2f4131] text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-[#2f4131]/30 hover:scale-105 active:scale-95 transition-all italic"
        >
          Comenzar Configuración
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
