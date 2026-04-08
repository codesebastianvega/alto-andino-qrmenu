import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export const useAdminModifierGroups = () => {
  const [modifierGroups, setModifierGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const fetchModifierGroups = useCallback(async () => {
    if (!activeBrandId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('modifier_groups')
        .select(`
          *,
          options:modifier_options!modifier_options_group_id_fkey(*)
        `)
        .eq('brand_id', activeBrandId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Order options by sort_order
      const sortedData = (data || []).map(group => ({
        ...group,
        options: (group.options || []).sort((a, b) => a.sort_order - b.sort_order)
      }));
      
      setModifierGroups(sortedData);
    } catch (err) {
      console.error('Error fetching modifier groups:', err);
      toast.error('Error cargando los modificadores');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId]);

  const createGroup = async (groupData) => {
    try {
      const { data, error } = await supabase
        .from('modifier_groups')
        .insert([{ ...groupData, brand_id: activeBrandId }])
        .select()
        .single();
      if (error) throw error;
      toast.success('Grupo creado');
      fetchModifierGroups();
      return data;
    } catch (err) {
      toast.error('Error al crear grupo');
      return null;
    }
  };

  const updateGroup = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('modifier_groups')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      toast.success('Grupo actualizado');
      fetchModifierGroups();
      return true;
    } catch (err) {
      toast.error('Error al actualizar grupo');
      return false;
    }
  };

  const deleteGroup = async (id) => {
    try {
      const { error } = await supabase
        .from('modifier_groups')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Grupo eliminado');
      fetchModifierGroups();
      return true;
    } catch (err) {
      toast.error('Error al eliminar grupo');
      return false;
    }
  };

  const createOption = async (optionData) => {
    try {
      const { error } = await supabase
        .from('modifier_options')
        .insert([optionData]);
      if (error) throw error;
      toast.success('Opción agregada');
      fetchModifierGroups();
      return true;
    } catch (err) {
      toast.error('Error al agregar opción: ' + err.message);
      return false;
    }
  };

  const updateOption = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('modifier_options')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      toast.success('Opción actualizada');
      fetchModifierGroups();
      return true;
    } catch (err) {
      toast.error('Error al actualizar opción: ' + err.message);
      return false;
    }
  };

  const deleteOption = async (id) => {
    try {
      const { error } = await supabase
        .from('modifier_options')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Opción eliminada');
      fetchModifierGroups();
      return true;
    } catch (err) {
      toast.error('Error al eliminar opción');
      return false;
    }
  };

  return {
    modifierGroups,
    loading,
    fetchModifierGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    createOption,
    updateOption,
    deleteOption
  };
};
