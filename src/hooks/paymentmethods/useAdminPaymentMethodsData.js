import { useState, useMemo } from 'react';
import { usePaymentMethods } from '../usePaymentMethods';
import { useLocations } from '../useLocations';
import { useLocationPayments } from '../useLocationPayments';
import { toast as toastFn } from '../../components/Toast';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export const PAYMENT_TYPES = [
  { id: 'cash', label: 'Efectivo', icon: 'solar:money-bag-bold', bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80' },
  { id: 'transfer', label: 'Transferencia', icon: 'solar:transfer-horizontal-bold', bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80' },
  { id: 'card', label: 'Tarjeta', icon: 'solar:card-2-bold', bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/80' },
  { id: 'digital_wallet', label: 'Billetera Digital', icon: 'solar:wallet-bold', bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/80' },
  { id: 'other', label: 'Otro', icon: 'solar:bill-list-bold', bg: 'bg-gray-600', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200/80' }
];

export const initialPaymentFormData = {
  name: '',
  type: 'cash',
  icon: 'solar:money-bag-bold',
  is_active: true,
  details: {
    bank_name: '',
    account_number: '',
    account_type: 'Ahorros',
    holder_name: '',
    holder_id: '',
    bre_b_key: '',
    instructions: ''
  }
};

export function useAdminPaymentMethodsData() {
  const { 
    paymentMethods: brandMethods, 
    loading: loadingBrand, 
    createPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod 
  } = usePaymentMethods();
  
  const { locations, loading: loadingLocs, updateLocation } = useLocations();
  
  const [activeContext, setActiveContext] = useState('brand');
  const selectedLocation = useMemo(() => 
    activeContext === 'brand' ? null : locations.find(l => l.id === activeContext)
  , [activeContext, locations]);

  const { 
    locationPayments, 
    loading: loadingLocPayments,
    togglePaymentMethod: toggleLocMethod,
  } = useLocationPayments(selectedLocation?.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingIsolation, setIsChangingIsolation] = useState(false);

  const [formData, setFormData] = useState(initialPaymentFormData);

  const openModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name || '',
        type: method.type || 'cash',
        icon: method.icon || 'solar:money-bag-bold',
        is_active: method.is_active ?? true,
        details: {
          bank_name: method.details?.bank_name || '',
          account_number: method.details?.account_number || '',
          account_type: method.details?.account_type || 'Ahorros',
          holder_name: method.details?.holder_name || '',
          holder_id: method.details?.holder_id || '',
          bre_b_key: method.details?.bre_b_key || '',
          instructions: method.details?.instructions || ''
        }
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: 'transfer',
        icon: 'solar:transfer-horizontal-bold',
        is_active: true,
        details: {
          bank_name: 'Nequi',
          account_number: '',
          account_type: 'Billetera Digital',
          holder_name: '',
          holder_id: '',
          bre_b_key: '',
          instructions: ''
        }
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

  const isLoading = loadingBrand || loadingLocs;

  return {
    brandMethods,
    locations,
    activeContext,
    setActiveContext,
    selectedLocation,
    locationPayments,
    loadingLocPayments,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    editingMethod,
    isSaving,
    isChangingIsolation,
    formData,
    setFormData,
    openModal,
    handleTypeChange,
    handleSubmit,
    handleDelete,
    toggleBrandStatus,
    handleToggleIsolation,
    handleToggleLocStatus
  };
}
