import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { useLocations } from '../hooks/useLocations';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton, SelectInput } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, Key, Building2, Trash2 } from 'lucide-react';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

const RoleNames = {
  admin: 'Administrador',
  waiter: 'Mesero / POS',
  kitchen: 'Cocina',
  cashier: 'Caja'
};

const RoleIcons = {
  admin: 'solar:shield-user-bold',
  waiter: 'solar:user-bold',
  kitchen: 'solar:chef-hat-bold',
  cashier: 'solar:cassette-bold'
};

const RoleColors = {
  admin: {
    bg: 'bg-gray-900',
    text: 'text-white',
    light: 'bg-gray-50',
    border: 'border-gray-100',
    accent: 'text-indigo-400'
  },
  waiter: {
    bg: 'bg-blue-600',
    text: 'text-white',
    light: 'bg-blue-50',
    border: 'border-blue-100',
    accent: 'text-blue-600'
  },
  kitchen: {
    bg: 'bg-amber-500',
    text: 'text-white',
    light: 'bg-amber-50',
    border: 'border-amber-100',
    accent: 'text-amber-600'
  },
  cashier: {
    bg: 'bg-emerald-600',
    text: 'text-white',
    light: 'bg-emerald-50',
    border: 'border-emerald-100',
    accent: 'text-emerald-600'
  }
};

export default function AdminStaff({ isEmbedded = false }) {
  const { staffList, loading, createStaff, updateStaff, deleteStaff } = useStaff();
  const { locations, loading: loadingLocs } = useLocations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', 
    role: 'waiter', 
    pin: '',
    location_id: '',
    is_active: true
  });

  const openModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({ 
        name: staff.name || '', 
        role: staff.role || 'waiter', 
        pin: staff.pin || '',
        location_id: staff.location_id || '',
        is_active: staff.is_active ?? true
      });
    } else {
      setEditingStaff(null);
      setFormData({ 
        name: '', 
        role: 'waiter', 
        pin: '',
        location_id: locations.find(l => l.is_main)?.id || (locations[0]?.id || ''),
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      toast.error('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }
    
    setIsSaving(true);
    let result;
    if (editingStaff) {
      result = await updateStaff(editingStaff.id, formData);
    } else {
      result = await createStaff(formData);
    }
    setIsSaving(false);

    if (result.error) {
      toast.error('Error guardando usuario: ' + result.error.message);
    } else {
      toast.success('Usuario guardado correctamente');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return;
    const { error } = await deleteStaff(id);
    if (error) toast.error('Error al eliminar');
    else toast.success('Usuario eliminado');
  };

  if (loading || loadingLocs) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando equipo...
      </div>
    );
  }

  return (
    <div className={isEmbedded ? "animate-fadeUp" : "p-4 sm:p-10 max-w-[1600px] mx-auto space-y-10"}>
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fadeUp">
          <PageHeader
            badge="Operaciones"
            title="Equipo de Trabajo"
            subtitle="Gestiona el acceso de tus colaboradores y asigna roles operativos."
          />
          <PrimaryButton 
            onClick={() => openModal()}
            className="rounded-[1.5rem] px-8 py-4 shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[12px] self-start md:self-auto"
          >
            <Icon icon="solar:user-plus-bold" className="w-5 h-5 mr-3" />
            Vincular Staff
          </PrimaryButton>
        </div>
      )}

      {isEmbedded && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Equipo Registrado</h3>
            <p className="text-[12px] text-gray-400 font-medium">Asigna PINs y permisos por rol.</p>
          </div>
          <PrimaryButton 
            onClick={() => openModal()} 
            className="rounded-2xl py-3 px-6 shadow-lg shadow-gray-100 text-[11px] font-black uppercase tracking-widest transition-transform active:scale-95"
          >
            <Icon icon="solar:user-plus-bold" className="w-4 h-4 mr-2" />
            Añadir Staff
          </PrimaryButton>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {staffList.map((staff) => {
          const locName = locations.find(l => l.id === staff.location_id)?.name || 'Sin asignar';
          const roleCfg = RoleColors[staff.role] || RoleColors.waiter;
          
          return (
            <div key={staff.id} className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-50/50 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group overflow-hidden flex flex-col relative">
              
              {/* Online Indicator Badge */}
              <div className="absolute top-6 right-6 z-10">
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    staff.is_active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400'
                 }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                    {staff.is_active ? 'En Línea' : 'Offline'}
                 </div>
              </div>

              <div className="p-8 flex-1 space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 duration-500 ${roleCfg.bg} ${roleCfg.text}`}>
                    <Icon icon={RoleIcons[staff.role] || RoleIcons.waiter} width="28" />
                  </div>
                  <div className="pt-1">
                    <h4 className="text-lg font-black text-gray-900 leading-tight uppercase italic tracking-tight mb-1 pr-16">{staff.name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-lg ${roleCfg.light} ${roleCfg.accent}`}>
                      {RoleNames[staff.role]}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-50 group-hover:bg-white group-hover:border-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                      <Building2 size={16} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-gray-300 uppercase leading-none mb-1">Sede de Operación</p>
                       <p className="text-[13px] text-gray-700 font-black">{locName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 px-4">
                    <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-gray-300">
                      <Key size={16} />
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex gap-1">
                          {[1,2,3,4].map(i => (
                             <div key={i} className="w-2 h-2 rounded-full bg-gray-200" />
                          ))}
                       </div>
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Acceso Protegido</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between group-hover:bg-gray-50 transition-colors">
                 <div className="flex gap-2">
                    <button 
                      onClick={() => openModal(staff)} 
                      className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-900 hover:text-white rounded-xl text-gray-600 text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border border-gray-100"
                    >
                      <Icon icon="solar:pen-new-square-linear" className="text-lg" />
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(staff.id, staff.name)} 
                      className="p-2.5 bg-white hover:bg-rose-50 rounded-xl text-gray-300 hover:text-rose-500 transition-all border border-gray-100"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>

                 {staff.is_active && (
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
                       <Icon icon="solar:shield-check-bold" width="20" />
                    </div>
                 )}
              </div>
            </div>
          );
        })}

        {staffList.length === 0 && (
          <div className="col-span-full glass-glow bg-white rounded-[3rem] border-4 border-dashed border-gray-50 p-20 flex flex-col items-center justify-center text-center group">
             <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 shadow-inner ring-8 ring-white group-hover:scale-110 transition-transform duration-500">
                <Icon icon="solar:user-broken-linear" className="text-gray-300" width="48" />
             </div>
             <h4 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">Sin personal vinculado</h4>
             <p className="text-sm text-gray-400 mt-4 max-w-[320px] font-medium leading-relaxed italic uppercase tracking-tighter">Registra a tus meseros y cocineros para que puedan operar el sistema con su PIN.</p>
             <button onClick={() => openModal()} className="mt-10 bg-gray-900 text-white font-black py-4 px-10 rounded-[1.5rem] shadow-2xl shadow-gray-200 hover:bg-indigo-600 transition-all text-[12px] uppercase tracking-widest">Añadir Miembro</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
              <div className="px-10 py-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">{editingStaff ? 'Editar Perfil' : 'Nuevo Staff'}</h3>
                    <p className="text-[12px] text-gray-500 font-medium italic mt-1 uppercase tracking-tight">Acceso y seguridad operativa.</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full hover:bg-rose-50 flex items-center justify-center text-gray-300 hover:text-rose-500 transition-all border border-gray-100 hover:border-rose-100">
                    <Icon icon="solar:close-circle-bold" width="32" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="Nombre del Colaborador">
                       <TextInput 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          placeholder="Ej. Alexander Martínez"
                          required
                          className="text-lg font-black py-4 px-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white"
                       />
                    </FormField>
                    <FormField label="Rol Administrativo">
                       <SelectInput 
                          value={formData.role} 
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="text-lg font-black py-4 px-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white"
                       >
                          {Object.entries(RoleNames).map(([key, label]) => (
                             <option key={key} value={key}>{label}</option>
                          ))}
                       </SelectInput>
                    </FormField>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField label="Asignación de Sede">
                       <SelectInput 
                          value={formData.location_id} 
                          onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                          className="font-bold py-4 px-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white"
                       >
                          <option value="">Seleccionar Local...</option>
                          {locations.map(loc => (
                             <option key={loc.id} value={loc.id}>{loc.name} {loc.is_main ? '🏛️' : ''}</option>
                          ))}
                       </SelectInput>
                    </FormField>
                    <FormField label="PIN de Seguridad (4 dígitos)">
                       <div className="relative">
                          <TextInput 
                            value={formData.pin} 
                            onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} 
                            placeholder="Ej. 1234"
                            maxLength={4}
                            required
                            className="font-mono text-center tracking-[1em] font-black text-2xl py-4 pr-4 pl-10 rounded-2xl bg-gray-50 border-indigo-100 text-indigo-600 focus:bg-white transition-all shadow-inner"
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300">
                             <Icon icon="solar:lock-password-bold" width="20" />
                          </div>
                       </div>
                    </FormField>
                 </div>

                 <div className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all cursor-pointer group ${formData.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xl shadow-emerald-50' : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500'}`}
                    onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                 >
                    <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${formData.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-300'}`}>
                       <Icon icon={formData.is_active ? "solar:shield-check-bold" : "solar:shield-warning-bold"} className="text-2xl" />
                    </div>
                    <div className="flex-1 select-none">
                       <span className="block text-[13px] font-black uppercase tracking-widest leading-none mb-1">Permitir Acceso</span>
                       <span className={`text-[10px] font-bold uppercase italic ${formData.is_active ? 'text-emerald-500' : 'text-gray-300'}`}>
                          Habilitar login con PIN en el POS
                       </span>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border-4 flex items-center justify-center transition-all ${formData.is_active ? 'bg-emerald-500 border-white rotate-0' : 'bg-transparent border-gray-100 rotate-45'}`}>
                       {formData.is_active && <Icon icon="solar:check-read-bold" className="text-white text-xs" />}
                    </div>
                 </div>

                 <div className="pt-8 border-t border-gray-100 flex gap-4">
                    <SecondaryButton type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-[1.5rem] py-5 border-gray-100 font-black uppercase tracking-widest text-[11px] text-gray-400">
                       Descartar
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSaving} className="flex-[2] rounded-[1.5rem] py-5 shadow-2xl shadow-indigo-100 font-black uppercase tracking-widest text-[11px]">
                       {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                         <div className="flex items-center justify-center gap-3">
                           <Icon icon="solar:diskette-bold-duotone" className="text-xl" />
                           {editingStaff ? 'Actualizar Staff' : 'Validar & Crear Staff'}
                         </div>
                       )}
                    </PrimaryButton>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
