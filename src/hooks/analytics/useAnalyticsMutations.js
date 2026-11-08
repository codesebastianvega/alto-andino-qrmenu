import { supabase } from '../../config/supabase';
import { toast } from '../../components/Toast';

export function useAnalyticsMutations({
  fetchData,
  editingProductId,
  setEditingProductId,
  editValue,
  setEditValue,
  isSavingCost,
  setIsSavingCost,
  setShowBulkEditor
}) {
  const handleUpdateLeadStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success('Estado actualizado correctamente.');
      fetchData();
    } catch (err) {
      console.error('Error updating lead status:', err);
      toast.error('No se pudo actualizar el estado.');
    }
  };

  const handleQuickCostUpdate = async () => {
    if (!editingProductId || !editValue || isSavingCost) return;
    setIsSavingCost(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ cost: parseFloat(editValue) })
        .eq('id', editingProductId);

      if (error) throw error;

      setEditingProductId(null);
      setEditValue('');

      toast.success('Costo actualizado exitosamente.');
      await fetchData();
    } catch (err) {
      console.error('Error updating product cost:', err);
      toast.error('Error actualizando costo.');
    } finally {
      setIsSavingCost(false);
    }
  };

  const handleBulkSave = async (updates) => {
    setIsSavingCost(true);
    try {
      const updatePromises = updates.map(u =>
        supabase
          .from('products')
          .update({ cost: u.cost, margin: u.margin })
          .eq('id', u.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error).map(r => r.error);

      if (errors.length > 0) throw errors[0];

      setShowBulkEditor(false);
      toast.success('Costos masivos guardados exitosamente.');
      await fetchData();
    } catch (err) {
      console.error('Error in handleBulkSave:', err);
      toast.error('Error al guardar costos masivos.');
    } finally {
      setIsSavingCost(false);
    }
  };

  const handleSmartExport = () => {
    window.print();
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este prospecto?')) return;
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Prospecto eliminado.');
      fetchData();
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error('No se pudo eliminar.');
    }
  };

  return {
    handleUpdateLeadStatus,
    handleQuickCostUpdate,
    handleBulkSave,
    handleSmartExport,
    handleDeleteLead
  };
}
