import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { useLocation } from '../context/LocationContext';
import { useLocations } from '../hooks/useLocations';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton, SelectInput, Switch } from '../components/admin/ui';
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
  cashier: 'Caja',
  promoter: 'Impulsador'
};

const RoleIcons = {
  admin: 'solar:shield-user-bold',
  waiter: 'solar:user-bold',
  kitchen: 'solar:chef-hat-bold',
  cashier: 'solar:cassette-bold',
  promoter: 'solar:flag-bold'
};

const RoleColors = {
  admin: {
    bg: 'bg-indigo-600',
    text: 'text-white',
    light: 'bg-indigo-50',
    border: 'border-indigo-100',
    accent: 'text-indigo-700'
  },
  waiter: {
    bg: 'bg-blue-600',
    text: 'text-white',
    light: 'bg-blue-50',
    border: 'border-blue-100',
    accent: 'text-blue-700'
  },
  kitchen: {
    bg: 'bg-amber-500',
    text: 'text-white',
    light: 'bg-amber-50',
    border: 'border-amber-100',
    accent: 'text-amber-800'
  },
  cashier: {
    bg: 'bg-emerald-600',
    text: 'text-white',
    light: 'bg-emerald-50',
    border: 'border-emerald-100',
    accent: 'text-emerald-700'
  },
  promoter: {
    bg: 'bg-purple-600',
    text: 'text-white',
    light: 'bg-purple-50',
    border: 'border-purple-100',
    accent: 'text-purple-700'
  }
};

export default function AdminStaff({ isEmbedded = false }) {
  const { staffList, loading, createStaff, updateStaff, deleteStaff } = useStaff();
  const { locations, loading: loadingLocs } = useLocations();
  const { activeLocationId, isAllLocations } = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', 
    role: 'kitchen', 
    pin: '',
    location_ids: [],
    access_all_locations: false,
    is_active: true,
    commission_rate: 0
  });

  const openModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({ 
        name: staff.name || '', 
        role: staff.role || 'kitchen', 
        pin: staff.pin || '',
        location_ids: staff.location_ids || [],
        access_all_locations: staff.access_all_locations || false,
        is_active: staff.is_active ?? true,
        commission_rate: staff.commission_rate || 0
      });
    } else {
      setEditingStaff(null);
      const defaultLocs = (!isAllLocations && activeLocationId) ? [activeLocationId] : [];
      setFormData({ 
        name: '', 
        role: 'kitchen', 
        pin: '',
        location_ids: defaultLocs,
        access_all_locations: isAllLocations,
        is_active: true,
        commission_rate: 0
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
    <div className={isEmbedded ? "animate-fadeUp space-y-6" : "p-4 sm:p-10 max-w-[1600px] mx-auto space-y-8"}>
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100 animate-fadeUp">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Operaciones
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Equipo de Trabajo</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Gestiona el acceso de tus colaboradores y asigna roles operativos con PIN.</p>
          </div>
          <button 
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer self-start md:self-auto"
          >
            <Icon icon="solar:user-plus-bold" className="text-base" />
            <span>Vincular Staff</span>
          </button>
        </div>
      )}

      {isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Equipo Registrado</h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {staffList.length} {staffList.length === 1 ? 'colaborador' : 'colaboradores'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Asigna PINs y permisos operativos por rol.</p>
          </div>
          <button 
            type="button"
            onClick={() => openModal()} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Icon icon="solar:user-plus-bold" className="text-base" />
            <span>Añadir Staff</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {staffList.map((staff) => {
          const assignedLocs = staff.access_all_locations 
            ? 'Todas las sedes' 
            : (staff.location_ids?.length > 0 
                ? locations.filter(l => staff.location_ids.includes(l.id)).map(l => l.name).join(', ')
                : 'Sin asignar');
          const roleCfg = RoleColors[staff.role] || RoleColors.waiter;
          
          return (
            <div 
              key={staff.id} 
              className="bg-white rounded-2xl border border-gray-200/80 hover:border-gray-300 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 sm:p-6 space-y-4">
                {/* Header: Avatar, Name, Role & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${roleCfg.bg} ${roleCfg.text}`}>
                      <Icon icon={RoleIcons[staff.role] || RoleIcons.waiter} className="text-lg" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 tracking-tight truncate leading-snug">
                        {staff.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleCfg.light} ${roleCfg.accent}`}>
                          {RoleNames[staff.role]}
                        </span>
                        {staff.role === 'promoter' && staff.commission_rate > 0 && (
                          <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100/80">
                            {staff.commission_rate}% com.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    staff.is_active 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {staff.is_active ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2.5 text-xs text-gray-600 bg-gray-50/70 px-3 py-2 rounded-xl border border-gray-100">
                    <Building2 size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate font-medium" title={assignedLocs}>{assignedLocs}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Key size={13} className="text-gray-400 shrink-0" />
                      <span className="text-[11px] font-medium text-gray-600">Acceso PIN</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      ))}
                      <span className="text-[10px] font-mono text-gray-400 ml-1.5">4 dígitos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                <button 
                  type="button"
                  onClick={() => openModal(staff)} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
                >
                  <Icon icon="solar:pen-new-square-linear" className="text-sm" />
                  <span>Editar</span>
                </button>

                <button 
                  type="button"
                  onClick={() => handleDelete(staff.id, staff.name)} 
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
                  title="Eliminar colaborador"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}

        {staffList.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mb-4 border border-gray-200">
              <Icon icon="solar:user-bold" className="text-2xl" />
            </div>
            <h4 className="text-base font-bold text-gray-900 tracking-tight">Sin personal vinculado</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">Registra a tus meseros, cocineros y cajeros para que puedan operar el sistema con su PIN.</p>
            <button 
              type="button"
              onClick={() => openModal()} 
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Icon icon="solar:user-plus-bold" className="text-base" />
              <span>Añadir Colaborador</span>
            </button>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/60">
                  <Icon icon="solar:shield-user-bold" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    {editingStaff ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Acceso y seguridad operativa por rol.</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Nombre *">
                    <TextInput 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="Ej. Alexander Martínez"
                      required
                    />
                  </FormField>
                  <FormField label="Rol Operativo *">
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

                {formData.role === 'promoter' && (
                  <FormField label="Comisión por Venta (%)">
                    <TextInput 
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.commission_rate} 
                      onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value) || 0})} 
                      placeholder="Ej. 5.0"
                    />
                  </FormField>
                )}

                {/* PIN Security input */}
                <FormField label="PIN de Seguridad (4 dígitos numéricos) *">
                  <div className="relative">
                    <input 
                      type="password"
                      inputMode="numeric"
                      value={formData.pin} 
                      onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} 
                      placeholder="••••"
                      maxLength={4}
                      required
                      className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono tracking-widest text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#2f4131] focus:bg-white outline-none transition-all"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Icon icon="solar:lock-password-bold" className="text-base" />
                    </div>
                  </div>
                </FormField>

                {/* Sede Assignment */}
                <div className="space-y-3 pt-1">
                  <div 
                    onClick={() => setFormData({...formData, access_all_locations: !formData.access_all_locations})}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      formData.access_all_locations 
                        ? 'bg-indigo-50/60 border-indigo-200/80 shadow-2xs' 
                        : 'bg-white border-gray-200/80 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        formData.access_all_locations ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon icon="solar:global-bold" className="text-lg" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">Acceso Global</p>
                        <p className="text-[11px] text-gray-500">Operar en todas las sedes del negocio</p>
                      </div>
                    </div>
                    <Switch 
                      checked={formData.access_all_locations} 
                      onChange={(val) => setFormData({...formData, access_all_locations: val})} 
                    />
                  </div>

                  {!formData.access_all_locations && (
                    <FormField label="Sedes Autorizadas">
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                        {locations.map(loc => {
                          const isSelected = formData.location_ids?.includes(loc.id);
                          return (
                            <div 
                              key={loc.id}
                              onClick={() => {
                                const newIds = isSelected
                                  ? formData.location_ids.filter(id => id !== loc.id)
                                  : [...(formData.location_ids || []), loc.id];
                                setFormData({...formData, location_ids: newIds});
                              }}
                              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-blue-50/80 border-blue-200 text-blue-800' 
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Building2 size={13} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                                <span className="truncate">{loc.name}</span>
                              </div>
                              <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                {isSelected ? 'Autorizado' : 'Excluido'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </FormField>
                  )}
                </div>

                {/* State toggle: Permitir Acceso */}
                <div 
                  onClick={() => setFormData({...formData, is_active: !formData.is_active})}
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
                      <Icon icon={formData.is_active ? "solar:shield-check-bold" : "solar:shield-warning-bold"} className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">Habilitar Acceso</p>
                      <p className="text-[11px] text-gray-500">Permitir inicio de sesión con PIN en el POS</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.is_active} 
                    onChange={(val) => setFormData({...formData, is_active: val})} 
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
                      <span>{editingStaff ? 'Actualizar Colaborador' : 'Crear Colaborador'}</span>
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
