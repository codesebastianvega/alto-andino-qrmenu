import React, { useState } from 'react';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton, SelectInput } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast as toastFn } from '../components/Toast';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

const PAYMENT_TYPES = [
  { id: 'cash', label: 'Efectivo', icon: 'solar:money-bag-bold' },
  { id: 'transfer', label: 'Transferencia Bancaria', icon: 'solar:transfer-horizontal-bold' },
  { id: 'card', label: 'Tarjeta de Crédito/Débito', icon: 'solar:card-2-bold' },
  { id: 'digital_wallet', label: 'Billetera Digital (Nequi/Daviplata)', icon: 'solar:wallet-bold' },
  { id: 'other', label: 'Otro', icon: 'solar:bill-list-bold' }
];

export default function AdminPaymentMethods() {
  const { paymentMethods, loading, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } = usePaymentMethods();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const toggleStatus = async (method) => {
    const { error } = await updatePaymentMethod(method.id, { is_active: !method.is_active });
    if (error) toast.error('Error al cambiar estado');
    else toast.success(method.is_active ? 'Medio de pago desactivado' : 'Medio de pago activado');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando medios de pago...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Medios de Pago</h3>
          <p className="text-[12px] text-gray-500 font-medium">Configura cómo tus clientes pueden pagar sus pedidos.</p>
        </div>
        <PrimaryButton onClick={() => openModal()} className="py-2.5 px-6 shadow-md">
          <Icon icon="solar:add-circle-bold" className="w-5 h-5 mr-2" />
          Añadir Medio
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentMethods.map((method) => (
          <div key={method.id} className={`bg-white rounded-[2rem] border transition-all group overflow-hidden flex flex-col ${method.is_active ? 'border-gray-100 shadow-sm hover:shadow-xl' : 'border-gray-200 opacity-60 grayscale'}`}>
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  method.type === 'cash' ? 'bg-emerald-500' :
                  method.type === 'transfer' ? 'bg-blue-500' :
                  method.type === 'card' ? 'bg-indigo-500' :
                  method.type === 'digital_wallet' ? 'bg-purple-500' : 'bg-gray-500'
                }`}>
                  <Icon icon={method.icon || 'solar:bill-list-bold'} width="32" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(method)} className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors border border-gray-100">
                    <Icon icon="solar:pen-new-square-linear" width="18" />
                  </button>
                  <button onClick={() => handleDelete(method.id, method.name)} className="w-9 h-9 flex items-center justify-center hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors border border-gray-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h4 className="font-black text-gray-900 text-lg leading-tight uppercase italic">{method.name}</h4>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1 italic">
                {PAYMENT_TYPES.find(t => t.id === method.type)?.label || 'Otro'}
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <button 
                onClick={() => toggleStatus(method)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${
                  method.is_active 
                    ? 'bg-green-50 border-green-100 text-green-600' 
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${method.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-400'}`} />
                {method.is_active ? 'Activado' : 'Desactivado'}
              </button>
              
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">ID: {method.id.slice(0, 8)}</span>
            </div>
          </div>
        ))}

        {paymentMethods.length === 0 && (
          <div className="col-span-full bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
              <Icon icon="solar:wallet-broken-linear" className="text-gray-300" width="40" />
            </div>
            <h4 className="text-lg font-black text-gray-400 uppercase tracking-tighter italic">Sin medios de pago</h4>
            <p className="text-sm text-gray-400 mt-2 max-w-[280px] font-medium italic">Configura métodos como Efectivo, Nequi o Transferencia para recibir pedidos.</p>
            <PrimaryButton onClick={() => openModal()} className="mt-8 px-8 rounded-2xl">
              Configurar primer medio
            </PrimaryButton>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">{editingMethod ? 'Editar Medio' : 'Nuevo Medio'}</h3>
                <p className="text-xs text-gray-500 font-medium italic mt-1">Personaliza el nombre e icono para el cliente.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-all shadow-sm border border-gray-100">
                <Icon icon="solar:close-circle-linear" width="28" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <FormField label="Tipo de Pago">
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleTypeChange(type.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                          formData.type === type.id
                            ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-lg shadow-[#2f4131]/20'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <Icon icon={type.icon} className="text-2xl shrink-0" />
                        <span className="text-[11px] font-black uppercase tracking-tight leading-tight">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Nombre para mostrar">
                  <TextInput
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Transferencia Nequi 312..."
                    required
                    className="text-lg font-bold py-4 rounded-2xl"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-medium italic uppercase tracking-wider">Este nombre será visible para el cliente al finalizar su pedido.</p>
                </FormField>

                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all group">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-6 h-6 rounded-lg border-gray-300 text-[#2f4131] focus:ring-[#2f4131]"
                  />
                  <label htmlFor="is_active" className="flex flex-col cursor-pointer select-none">
                    <span className="text-[13px] font-black uppercase text-gray-700 tracking-tight">Estado Activo</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase italic tracking-tighter">Mostrar este medio de pago a los clientes</span>
                  </label>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 flex gap-4">
                <SecondaryButton type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl py-4 border-gray-200 font-black uppercase tracking-widest text-[11px]">
                  Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isSaving} className="flex-[2] rounded-2xl py-4 shadow-xl shadow-[#2f4131]/20 font-black uppercase tracking-widest text-[11px]">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                    <div className="flex items-center justify-center gap-2">
                       <Icon icon="solar:check-read-linear" className="w-5 h-5" />
                       {editingMethod ? 'Actualizar Medio' : 'Crear Medio de Pago'}
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
