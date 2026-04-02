import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, MapPin, Phone, Building2, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminSedes({ isEmbedded = false }) {
  const { activeBrand, isFeatureLocked } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    maps_url: '',
    is_main: false,
    is_active: true
  });

  useEffect(() => {
    if (activeBrand?.id) {
      fetchLocations();
    }
  }, [activeBrand?.id]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar sedes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (loc = null) => {
    if (loc) {
      setEditingLocation(loc);
      setForm({
        name: loc.name || '',
        address: loc.address || '',
        phone: loc.phone || '',
        maps_url: loc.maps_url || '',
        is_main: loc.is_main || false,
        is_active: loc.is_active ?? true
      });
    } else {
      setEditingLocation(null);
      setForm({
        name: '',
        address: '',
        phone: '',
        maps_url: '',
        is_main: locations.length === 0,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBrand?.id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        brand_id: activeBrand.id,
        updated_at: new Date()
      };

      if (editingLocation) {
        const { error } = await supabase
          .from('locations')
          .update(payload)
          .eq('id', editingLocation.id);
        if (error) throw error;
        toast.success('Sede actualizada');
      } else {
        const { error } = await supabase
          .from('locations')
          .insert([payload]);
        if (error) throw error;
        toast.success('Sede creada correctamente');
      }

      setIsModalOpen(false);
      fetchLocations();
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
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Sede eliminada');
      fetchLocations();
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
    <div className={isEmbedded ? "" : "p-4 sm:p-8 max-w-7xl mx-auto space-y-8"}>
      {!isEmbedded && (
        <PageHeader
          badge="Administración"
          title="Sedes y Locales"
          subtitle="Gestiona las ubicaciones físicas de tu negocio."
        >
          <PrimaryButton onClick={() => handleOpenModal()} disabled={!canAddMore}>
            <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-2" />
            Nueva Sede
          </PrimaryButton>
        </PageHeader>
      )}

      {isEmbedded && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Tus Locales</h3>
            <p className="text-[12px] text-gray-500 font-medium">Listado de sedes activas para el menú digital.</p>
          </div>
          <PrimaryButton 
            onClick={() => handleOpenModal()} 
            disabled={!canAddMore}
            className="py-2 px-4 shadow-sm"
          >
            <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-2" />
            Añadir Sede
          </PrimaryButton>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
            <div className="p-6 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#2f4131]/10 flex items-center justify-center text-[#2f4131]">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">{loc.name}</h4>
                    {loc.is_main && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-[#2f4131] bg-[#2f4131]/5 px-2 py-0.5 rounded-full mt-1 border border-[#2f4131]/10 tracking-widest italic">
                        <Icon icon="heroicons:check-badge" className="text-[10px]" /> Principal
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(loc)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                    <Icon icon="solar:pen-new-square-linear" width="18" />
                  </button>
                  <button onClick={() => handleDelete(loc.id)} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-gray-300 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{loc.address || 'Sin dirección registrada'}</p>
                </div>
                {loc.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-gray-300 shrink-0" />
                    <p className="text-xs text-gray-500 font-medium">{loc.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${loc.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{loc.is_active ? 'Activa' : 'Inactiva'}</span>
               </div>
               {loc.maps_url && (
                  <a 
                    href={loc.maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-[#2f4131] flex items-center gap-1 hover:underline tracking-widest italic"
                  >
                    VER EN MAPA <ExternalLink size={10} />
                  </a>
               )}
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border-2 border-dashed border-gray-100 p-12 flex flex-col items-center justify-center text-center opacity-60">
             <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Icon icon="solar:map-point-remove-linear" className="text-gray-300" width="32" />
             </div>
             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No hay sedes registradas</h4>
             <p className="text-xs text-gray-400 mt-2 max-w-[200px]">Comienza añadiendo la ubicación principal de tu negocio.</p>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Location */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{editingLocation ? 'Editar Sede' : 'Nueva Sede'}</h3>
                    <p className="text-xs text-gray-500 font-medium">Información de contacto y ubicación.</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-all shadow-sm">
                    <Icon icon="solar:close-circle-linear" width="24" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Nombre de la Sede">
                       <TextInput 
                          value={form.name} 
                          onChange={(e) => setForm({...form, name: e.target.value})} 
                          placeholder="Ej. Sede Central"
                          required
                       />
                    </FormField>
                    <FormField label="Teléfono (Opcional)">
                       <TextInput 
                          value={form.phone} 
                          onChange={(e) => setForm({...form, phone: e.target.value})} 
                          placeholder="Ej. +57 321..."
                       />
                    </FormField>
                 </div>

                 <FormField label="Dirección Física">
                    <TextInput 
                       value={form.address} 
                       onChange={(e) => setForm({...form, address: e.target.value})} 
                       placeholder="Ej. Calle 10 #20-30"
                    />
                 </FormField>

                 <FormField label="URL Google Maps (Opcional)">
                    <TextInput 
                       value={form.maps_url} 
                       onChange={(e) => setForm({...form, maps_url: e.target.value})} 
                       placeholder="https://maps.app.goo.gl/..."
                       className="font-mono text-[11px]"
                    />
                 </FormField>

                 <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <label className="flex-1 flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all group">
                       <input 
                         type="checkbox" 
                         checked={form.is_main} 
                         onChange={(e) => setForm({...form, is_main: e.target.checked})} 
                         className="w-5 h-5 rounded-lg border-gray-300 text-[#2f4131] focus:ring-[#2f4131]"
                       />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase text-gray-600 tracking-wider">Sede Principal</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Por defecto</span>
                       </div>
                    </label>

                    <label className="flex-1 flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all group">
                       <input 
                         type="checkbox" 
                         checked={form.is_active} 
                         onChange={(e) => setForm({...form, is_active: e.target.checked})} 
                         className="w-5 h-5 rounded-lg border-gray-300 text-[#2f4131] focus:ring-[#2f4131]"
                       />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase text-gray-600 tracking-wider">Sede Activa</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Visible</span>
                       </div>
                    </label>
                 </div>

                 <div className="pt-6 border-t border-gray-100 flex gap-3">
                    <SecondaryButton type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl py-3 border-gray-200">
                       Cancelar
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSubmitting} className="flex-[2] rounded-2xl py-3 shadow-xl">
                       {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Icon icon="solar:check-read-linear" className="w-4 h-4 mr-2" />}
                       {editingLocation ? 'Guardar Cambios' : 'Crear Sede'}
                    </PrimaryButton>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
