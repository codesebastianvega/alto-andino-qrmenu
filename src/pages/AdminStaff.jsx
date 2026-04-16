import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { useLocations } from '../hooks/useLocations';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton, SelectInput } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, User, Key, Building2, Trash2, ShieldCheck, MoreVertical } from 'lucide-react';

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
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando personal...
      </div>
    );
  }

  return (
    <div className={isEmbedded ? "" : "p-4 sm:p-8 max-w-7xl mx-auto space-y-8"}>
      {!isEmbedded && (
        <PageHeader
          badge="Administración"
          title="Personal y Roles"
          subtitle="Gestiona el acceso de tus empleados al sistema."
        >
          <PrimaryButton onClick={() => openModal()}>
            <Icon icon="solar:user-plus-bold" className="w-4 h-4 mr-2" />
            Nuevo Empleado
          </PrimaryButton>
        </PageHeader>
      )}

      {isEmbedded && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Personal del Sistema</h3>
            <p className="text-[12px] text-gray-500 font-medium">Control operativos por sede y rol.</p>
          </div>
          <PrimaryButton 
            onClick={() => openModal()} 
            className="py-2 px-4 shadow-sm"
          >
            <Icon icon="solar:user-plus-bold" className="w-4 h-4 mr-2" />
            Añadir Staff
          </PrimaryButton>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {staffList.map((staff) => {
          const locName = locations.find(l => l.id === staff.location_id)?.name || 'Sin asignar';
          return (
            <div key={staff.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                      staff.role === 'admin' ? 'bg-[#2f4131]' : 
                      staff.role === 'waiter' ? 'bg-blue-500' : 
                      staff.role === 'kitchen' ? 'bg-amber-500' : 'bg-gray-500'
                    }`}>
                      <Icon icon={RoleIcons[staff.role] || RoleIcons.waiter} width="24" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">{staff.name}</h4>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1 italic">{RoleNames[staff.role]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(staff)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                      <Icon icon="solar:pen-new-square-linear" width="18" />
                    </button>
                    <button onClick={() => handleDelete(staff.id, staff.name)} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-3">
                    <Building2 size={14} className="text-gray-300 shrink-0" />
                    <p className="text-xs text-gray-500 font-medium">Sede: <span className="text-gray-900">{locName}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Key size={14} className="text-gray-300 shrink-0" />
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                       <span className="text-xs font-bold text-gray-400 tracking-widest font-mono">****</span>
                       <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">PIN</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${staff.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{staff.is_active ? 'En Línea' : 'Inactivo'}</span>
                 </div>
                 {staff.is_active && (
                    <span className="text-[9px] font-black text-[#2f4131]/40 uppercase tracking-widest italic">Acceso Permitido</span>
                 )}
              </div>
            </div>
          );
        })}

        {staffList.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border-2 border-dashed border-gray-100 p-12 flex flex-col items-center justify-center text-center opacity-60">
             <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Icon icon="solar:user-broken-linear" className="text-gray-300" width="32" />
             </div>
             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No hay personal registrado</h4>
             <p className="text-xs text-gray-400 mt-2 max-w-[200px]">Comienza añadiendo un administrador o mesero.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{editingStaff ? 'Editar Staff' : 'Nuevo Staff'}</h3>
                    <p className="text-xs text-gray-500 font-medium">Asigna rol, sede y clave de seguridad.</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-all shadow-sm">
                    <Icon icon="solar:close-circle-linear" width="24" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Nombre Completo">
                       <TextInput 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          placeholder="Ej. Juan Pérez"
                          required
                       />
                    </FormField>
                    <FormField label="Rol en el negocio">
                       <SelectInput 
                          value={formData.role} 
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                       >
                          {Object.entries(RoleNames).map(([key, label]) => (
                             <option key={key} value={key}>{label}</option>
                          ))}
                       </SelectInput>
                    </FormField>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Sede Asignada">
                       <SelectInput 
                          value={formData.location_id} 
                          onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                       >
                          <option value="">Seleccionar Sede...</option>
                          {locations.map(loc => (
                             <option key={loc.id} value={loc.id}>{loc.name} {loc.is_main ? '(Principal)' : ''}</option>
                          ))}
                       </SelectInput>
                    </FormField>
                    <FormField label="PIN Acceso (4 dígitos)">
                       <TextInput 
                          value={formData.pin} 
                          onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} 
                          placeholder="Ej. 1234"
                          maxLength={4}
                          required
                          className="font-mono text-center tracking-[0.5em] font-black text-lg bg-gray-50 border-gray-100"
                       />
                    </FormField>
                 </div>

                 <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all group">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active} 
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                      className="w-5 h-5 rounded-lg border-gray-300 text-[#2f4131] focus:ring-[#2f4131]"
                    />
                    <div className="flex flex-col">
                       <span className="text-[11px] font-black uppercase text-gray-600 tracking-wider">Estado Activo</span>
                       <span className="text-[9px] text-gray-400 font-bold uppercase italic">Permitir login con PIN</span>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-gray-100 flex gap-3">
                    <SecondaryButton type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl py-3 border-gray-200">
                       Cancelar
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSaving} className="flex-[2] rounded-2xl py-3 shadow-xl">
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Icon icon="solar:check-read-linear" className="w-4 h-4 mr-2" />}
                       {editingStaff ? 'Actualizar Staff' : 'Crear Usuario'}
                    </PrimaryButton>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
