import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../hooks/useLocations';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, MapPin, Phone, Building2, ExternalLink, Trash2 } from 'lucide-react';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminSedes({ isEmbedded = false }) {
  const { isFeatureLocked } = useAuth();
  const { locations, loading, createLocation, updateLocation, deleteLocation } = useLocations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [activeTab, setActiveTab] = useState('info');
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp: '',
    maps_url: '',
    is_main: false,
    is_active: true,
    operational_modes: ['dine_in', 'takeaway'],
    delivery_radius_km: 5,
    independent_payments: false
  });

  const handleOpenModal = (loc = null) => {
    setActiveTab('info');
    if (loc) {
      setEditingLocation(loc);
      setForm({
        name: loc.name || '',
        address: loc.address || '',
        phone: loc.phone || '',
        whatsapp: loc.whatsapp || '',
        maps_url: loc.maps_url || '',
        is_main: loc.is_main || false,
        is_active: loc.is_active ?? true,
        operational_modes: loc.operational_modes || ['dine_in', 'takeaway'],
        delivery_radius_km: loc.delivery_radius_km || 5,
        independent_payments: loc.independent_payments || false
      });
    } else {
      setEditingLocation(null);
      setForm({
        name: '',
        address: '',
        phone: '',
        whatsapp: '',
        maps_url: '',
        is_main: locations.length === 0,
        is_active: true,
        operational_modes: ['dine_in', 'takeaway'],
        delivery_radius_km: 5,
        independent_payments: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let res;
      if (editingLocation) {
        res = await updateLocation(editingLocation.id, form);
        if (res.error) throw res.error;
        toast.success('Sede actualizada');
      } else {
        res = await createLocation(form);
        if (res.error) throw res.error;
        toast.success('Sede creada correctamente');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar sede');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta sede?')) return;
    try {
      const { error } = await deleteLocation(id);
      if (error) throw error;
      toast.success('Sede eliminada');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo eliminar la sede');
    }
  };

  const isMultiLocationLocked = isFeatureLocked('multi_location');
  const canAddMore = !isMultiLocationLocked || locations.length === 0;

  if (loading && locations.length === 0) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando sedes...
    </div>
  );

  return (
    <div className={isEmbedded ? "animate-fadeUp" : "p-4 sm:p-10 max-w-[1600px] mx-auto space-y-10"}>
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fadeUp">
          <PageHeader
            badge="Infraestructura"
            title="Sedes y Locales"
            subtitle="Gestiona las ubicaciones físicas de tu marca y centraliza tu operación."
          />
          <div className="flex flex-col items-end gap-3 self-start md:self-auto">
            <PrimaryButton 
              onClick={() => handleOpenModal()} 
              disabled={!canAddMore}
              className="rounded-[1.5rem] px-8 py-4 shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[12px]"
            >
              <Icon icon="solar:shop-2-bold" className="w-5 h-5 mr-3" />
              Nueva Sede
            </PrimaryButton>
            {!canAddMore && (
              <p className="text-[10px] font-black text-amber-500 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 flex items-center gap-2 uppercase tracking-tight italic animate-pulse">
                <Icon icon="solar:lock-bold" /> Tu plan Pro permite sedes ilimitadas
              </p>
            )}
          </div>
        </div>
      )}

      {isEmbedded && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Tus Puntos de Venta</h3>
            <p className="text-[12px] text-gray-400 font-medium">Controla la información y visibilidad de cada sede.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PrimaryButton 
              onClick={() => handleOpenModal()} 
              disabled={!canAddMore}
              className="rounded-2xl py-3 px-6 shadow-lg shadow-gray-100 text-[11px] font-black uppercase tracking-widest transition-transform active:scale-95"
            >
              <Icon icon="solar:add-circle-bold" className="w-4 h-4 mr-2" />
              Añadir Sede
            </PrimaryButton>
            {!canAddMore && (
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter italic">Mejorar plan para más sedes</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {locations.map((loc) => (
          <div key={loc.id} className={`glass-glow bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-50/50 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group overflow-hidden flex flex-col relative ${!loc.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            
            {/* Status Floating Badge */}
            <div className="absolute top-6 right-6 z-10">
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${
                  loc.is_active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400'
               }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${loc.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  {loc.is_active ? 'Activa' : 'Inactiva'}
               </div>
            </div>

            <div className="p-8 flex-1 space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-inner relative transition-transform group-hover:scale-110 duration-500 ${loc.is_main ? 'bg-gray-900 text-white shadow-xl rotate-3' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Building2 size={24} />
                  {loc.is_main && (
                    <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                      <Icon icon="solar:star-bold" className="text-[12px]" />
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <h4 className="text-lg font-black text-gray-900 leading-none uppercase italic tracking-tight mb-2 pr-12">{loc.name}</h4>
                  {loc.is_main && (
                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em]">Sede Principal</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-50 group-hover:bg-white group-hover:border-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                    <MapPin size={16} />
                  </div>
                  <p className="text-[13px] text-gray-500 font-black leading-tight">{loc.address || 'Sin dirección registrada'}</p>
                </div>

                {loc.phone && (
                  <div className="flex items-center gap-4 px-4">
                    <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-gray-300">
                      <Phone size={16} />
                    </div>
                    <p className="text-[13px] text-gray-400 font-bold tracking-widest">{loc.phone}</p>
                  </div>
                )}

                {loc.whatsapp && (
                  <div className="flex items-center gap-4 px-4">
                    <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-emerald-400">
                      <Icon icon="solar:whatsapp-bold" width="18" />
                    </div>
                    <p className="text-[13px] text-emerald-600 font-black tracking-widest">{loc.whatsapp}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between group-hover:bg-gray-50 transition-colors">
               <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(loc)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-900 hover:text-white rounded-xl text-gray-600 text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border border-gray-100"
                  >
                    <Icon icon="solar:pen-new-square-linear" className="text-lg" />
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(loc.id)} 
                    className="p-2.5 bg-white hover:bg-rose-50 rounded-xl text-gray-300 hover:text-rose-500 transition-all border border-gray-100"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>

               {loc.maps_url && (
                  <a 
                    href={loc.maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:scale-110 active:scale-90 transition-all shadow-lg shadow-emerald-100/50"
                  >
                    <ExternalLink size={18} />
                  </a>
               )}
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full glass-glow bg-white rounded-[3rem] border-4 border-dashed border-gray-50 p-20 flex flex-col items-center justify-center text-center group">
             <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 shadow-inner ring-8 ring-white group-hover:scale-110 transition-transform duration-500">
                <Icon icon="solar:map-point-remove-broken" className="text-gray-300" width="48" />
             </div>
             <h4 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">No hay sedes operativas</h4>
             <p className="text-sm text-gray-400 mt-4 max-w-[320px] font-medium leading-relaxed italic uppercase tracking-tighter">Centraliza tus inventarios y pedidos añadiendo la ubicación física de tu punto de venta.</p>
             <button onClick={() => handleOpenModal()} className="mt-10 bg-gray-900 text-white font-black py-4 px-10 rounded-[1.5rem] shadow-2xl shadow-gray-200 hover:bg-indigo-600 transition-all text-[12px] uppercase tracking-widest">Crear Sede Principal</button>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 flex flex-col max-h-[90vh]">
              <div className="px-10 pt-8 pb-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">{editingLocation ? 'Gestionar Sede' : 'Nueva Sede'}</h3>
                    <p className="text-[12px] text-gray-500 font-medium italic mt-1 uppercase tracking-tight">Parametrización operativa por punto de venta.</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full hover:bg-rose-50 flex items-center justify-center text-gray-300 hover:text-rose-500 transition-all border border-gray-100 hover:border-rose-100">
                    <Icon icon="solar:close-circle-bold" width="32" />
                 </button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex px-10 gap-8 border-b border-gray-50 bg-gray-50/30 shrink-0">
                {[
                  { id: 'info', label: 'Información', icon: 'solar:info-circle-bold' },
                  { id: 'hours', label: 'Horarios', icon: 'solar:clock-circle-bold' },
                  { id: 'ops', label: 'Operación', icon: 'solar:settings-minimalistic-bold' },
                  { id: 'payments', label: 'Pagos', icon: 'solar:card-2-bold' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${
                      activeTab === tab.id 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Icon icon={tab.icon} className="text-lg" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                 {activeTab === 'info' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <FormField label="Identificación de la Sede">
                            <TextInput 
                                value={form.name} 
                                onChange={(e) => setForm({...form, name: e.target.value})} 
                                placeholder="Ej. Sede Norte Gourmet"
                                required
                                className="text-lg font-black py-4 px-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white"
                            />
                          </FormField>
                          <FormField label="WhatsApp de Pedidos">
                            <TextInput 
                                value={form.whatsapp} 
                                onChange={(e) => setForm({...form, whatsapp: e.target.value})} 
                                placeholder="+57 321 456 7890"
                                className="text-lg font-black py-4 px-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white text-emerald-600"
                            />
                          </FormField>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField label="Teléfono Fijo / Local">
                          <TextInput 
                              value={form.phone} 
                              onChange={(e) => setForm({...form, phone: e.target.value})} 
                              placeholder="601 234 5678"
                              className="text-lg font-black py-4 px-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white"
                          />
                        </FormField>
                        <FormField label="Enlace de Google Maps">
                          <TextInput 
                              value={form.maps_url} 
                              onChange={(e) => setForm({...form, maps_url: e.target.value})} 
                              placeholder="https://maps.app.goo.gl/..."
                              className="text-lg font-black py-4 px-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white"
                          />
                        </FormField>
                      </div>

                      <FormField label="Dirección Física">
                          <TextInput 
                            value={form.address} 
                            onChange={(e) => setForm({...form, address: e.target.value})} 
                            placeholder="Calle 123 # 45-67, Ciudad"
                            className="font-bold py-4 px-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white"
                          />
                      </FormField>

                      <div className="flex flex-col sm:flex-row gap-6">
                        <label className={`flex-1 flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer group ${form.is_main ? 'bg-gray-900 border-gray-900 text-white shadow-xl' : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'}`}>
                          <input 
                            type="checkbox" 
                            checked={form.is_main} 
                            onChange={(e) => setForm({...form, is_main: e.target.checked})} 
                            className="sr-only"
                          />
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${form.is_main ? 'bg-white/10' : 'bg-gray-50 text-gray-300'}`}>
                              <Icon icon="solar:star-bold" className="text-xl" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[12px] font-black uppercase tracking-widest leading-none mb-1">Operación Base</span>
                              <span className={`text-[9px] font-bold uppercase ${form.is_main ? 'text-indigo-300' : 'text-gray-300'}`}>Punto principal</span>
                          </div>
                        </label>

                        <label className={`flex-1 flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer group ${form.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xl shadow-emerald-50' : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'}`}>
                          <input 
                            type="checkbox" 
                            checked={form.is_active} 
                            onChange={(e) => setForm({...form, is_active: e.target.checked})} 
                            className="sr-only"
                          />
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${form.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-300'}`}>
                              <Icon icon="solar:check-read-bold" className="text-xl" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[12px] font-black uppercase tracking-widest leading-none mb-1">Estado OnLine</span>
                              <span className={`text-[9px] font-bold uppercase ${form.is_active ? 'text-emerald-500' : 'text-gray-300'}`}>Visible al cliente</span>
                          </div>
                        </label>
                      </div>
                    </div>
                 )}

                 {activeTab === 'hours' && (
                   <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                        <Icon icon="solar:clock-circle-bold-duotone" width="40" />
                     </div>
                     <h4 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Gestión de Horarios</h4>
                     <p className="text-sm text-gray-400 mt-2 max-w-[300px] font-medium leading-relaxed uppercase tracking-tighter">
                       {editingLocation 
                        ? "Configura los horarios específicos para esta sede. Por defecto hereda los de la marca." 
                        : "Los horarios se heredarán automáticamente de la sede principal al crearla."}
                     </p>
                     <div className="mt-8 px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <Icon icon="solar:info-circle-bold" className="text-amber-500" />
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight">Próximamente: Editor visual de horarios por sede</span>
                     </div>
                   </div>
                 )}

                 {activeTab === 'ops' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                         <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                           <Icon icon="solar:delivery-bold" /> Modos de Operación
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { id: 'dine_in', label: 'En Local', icon: 'solar:plate-bold' },
                              { id: 'takeaway', label: 'Para Llevar', icon: 'solar:bag-3-bold' },
                              { id: 'delivery', label: 'Delivery', icon: 'solar:delivery-bold' }
                            ].map(mode => (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => {
                                  const modes = form.operational_modes || [];
                                  if (modes.includes(mode.id)) {
                                    setForm({...form, operational_modes: modes.filter(m => m !== mode.id)});
                                  } else {
                                    setForm({...form, operational_modes: [...modes, mode.id]});
                                  }
                                }}
                                className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
                                  form.operational_modes?.includes(mode.id)
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                }`}
                              >
                                <Icon icon={mode.icon} width="24" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                              </button>
                            ))}
                         </div>
                       </div>

                       <FormField label="Radio de Cobertura Delivery (Kilómetros)">
                          <div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border-2 border-gray-100">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <Icon icon="solar:radius-bold" width="24" />
                             </div>
                             <input 
                                type="range" 
                                min="1" 
                                max="50" 
                                step="0.5"
                                value={form.delivery_radius_km}
                                onChange={(e) => setForm({...form, delivery_radius_km: parseFloat(e.target.value)})}
                                className="flex-1 accent-indigo-600 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                             />
                             <div className="w-16 text-center">
                                <span className="text-lg font-black text-gray-900">{form.delivery_radius_km}</span>
                                <span className="text-[10px] font-bold text-gray-400 block -mt-1 uppercase tracking-tight">km</span>
                             </div>
                          </div>
                       </FormField>
                    </div>
                 )}

                 {activeTab === 'payments' && (
                   <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${form.independent_payments ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                         <div className="flex items-center justify-between gap-6">
                            <div className="flex-1">
                               <h4 className="text-sm font-black text-gray-900 uppercase italic tracking-tight mb-1">Pagos Independientes</h4>
                               <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                 {form.independent_payments 
                                  ? "Esta sede gestiona sus propios métodos de pago (Cuentas bancarias, pasarelas, etc)." 
                                  : "Esta sede utilizará los métodos de pago configurados a nivel de marca."}
                               </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setForm({...form, independent_payments: !form.independent_payments})}
                              className={`w-16 h-8 rounded-full transition-all relative ${form.independent_payments ? 'bg-indigo-600' : 'bg-gray-300'}`}
                            >
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${form.independent_payments ? 'right-1' : 'left-1'}`} />
                            </button>
                         </div>
                      </div>

                      {form.independent_payments && (
                        <div className="p-8 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center opacity-70">
                           <Icon icon="solar:bank-bold-duotone" width="32" className="text-gray-300 mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">
                             La configuración detallada de cuentas <br/> aparecerá aquí próximamente.
                           </p>
                        </div>
                      )}
                   </div>
                 )}

                 <div className="pt-8 border-t border-gray-100 flex gap-4 shrink-0">
                    <SecondaryButton type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-[1.5rem] py-5 border-gray-100 font-black uppercase tracking-widest text-[11px] text-gray-400">
                       Cancelar
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSubmitting} className="flex-[2] rounded-[1.5rem] py-5 shadow-2xl shadow-indigo-100 font-black uppercase tracking-widest text-[11px]">
                       {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                         <div className="flex items-center justify-center gap-3">
                           <Icon icon="solar:diskette-bold-duotone" className="text-xl" />
                           {editingLocation ? 'Guardar Cambios' : 'Crear Sede'}
                         </div>
                       )}
                    </PrimaryButton>
                 </div>
              </form>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
}
