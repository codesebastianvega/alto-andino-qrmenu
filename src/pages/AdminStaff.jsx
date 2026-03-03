import React, { useState } from 'react';
import { Icon } from '@iconify-icon/react';
import { useStaff } from '../hooks/useStaff';
import { toast } from '../components/Toast';

export default function AdminStaff() {
  const { staffList, loading, createStaff, updateStaff, deleteStaff } = useStaff();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: 'waiter', pin: '' });
  const [isSaving, setIsSaving] = useState(false);

  const RoleNames = {
    admin: 'Administrador',
    waiter: 'Mesero / POS',
    kitchen: 'Cocina',
    cashier: 'Caja'
  };

  const openModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({ name: staff.name, role: staff.role, pin: staff.pin });
    } else {
      setEditingStaff(null);
      setFormData({ name: '', role: 'waiter', pin: '' });
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
      toast('Usuario guardado correctamente', { icon: '✅' });
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`¿Estás seguro de eliminar a ${name}?`)) {
      const { error } = await deleteStaff(id);
      if (error) toast.error('Error al eliminar');
      else toast('Usuario eliminado');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-gray-50/30">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 border-l-4 border-[#2f4131] pl-4">PERSONAL Y ROLES</h1>
          <p className="text-gray-500 mt-1 font-medium pl-4">Gestión de accesos y PINs</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-[#2f4131] hover:bg-[#1a251b] text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <Icon icon="heroicons:plus" className="text-xl" /> Nuevo Empleado
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map(staff => (
          <div key={staff.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-lg">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{staff.name}</h3>
                  <p className="text-xs text-blue-600 font-bold mt-0.5">{RoleNames[staff.role]}</p>
                </div>
              </div>
              <div className="flex gap-2 text-gray-400">
                <button onClick={() => openModal(staff)} className="hover:text-[#2f4131] transition-colors p-1"><Icon icon="heroicons:pencil-square" className="text-xl" /></button>
                <button onClick={() => handleDelete(staff.id, staff.name)} className="hover:text-red-500 transition-colors p-1"><Icon icon="heroicons:trash" className="text-xl" /></button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
               <Icon icon="heroicons:key" className="text-gray-400" />
               <span className="text-sm font-bold text-gray-700 font-mono tracking-widest">{staff.pin.replace(/./g, '•')}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-gray-900">{editingStaff ? 'Editar' : 'Nuevo'} Empleado</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><Icon icon="heroicons:x-mark" className="text-2xl" /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre</label>
                 <input 
                   type="text" required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
                 />
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Rol</label>
                 <select 
                   value={formData.role}
                   onChange={e => setFormData({...formData, role: e.target.value})}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
                 >
                   {Object.entries(RoleNames).map(([key, label]) => (
                     <option key={key} value={key}>{label}</option>
                   ))}
                 </select>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">PIN (4 dígitos)</label>
                 <input 
                   type="text" required maxLength="4" pattern="\d{4}"
                   placeholder="Ej: 1234"
                   value={formData.pin}
                   onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-bold font-mono text-center tracking-widest text-lg text-gray-800"
                 />
                 <p className="text-[10px] text-gray-400 mt-1 px-1">Se usará como clave para acceder al panel.</p>
               </div>
               
               <div className="pt-4">
                 <button 
                   type="submit" disabled={isSaving}
                   className="w-full bg-[#4a6741] text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-[#3d5536] transition-colors"
                 >
                   {isSaving ? 'Guardando...' : 'Guardar'}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
