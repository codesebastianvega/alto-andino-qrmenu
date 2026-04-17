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
      
      // Fetch products to count usage
      const { data: productsData } = await supabase
        .from('products')
        .select('modifier_groups')
        .eq('brand_id', activeBrandId);

      // Order options by sort_order and add usage count
      const sortedData = (data || []).map(group => {
        const usageCount = (productsData || []).filter(p => 
          Array.isArray(p.modifier_groups) && p.modifier_groups.includes(group.id)
        ).length;

        return {
          ...group,
          usage_count: usageCount,
          options: (group.options || []).sort((a, b) => a.sort_order - b.sort_order)
        };
      });
      
      setModifierGroups(sortedData);
    } catch (err) {
      console.error('Error fetching modifier groups:', err);
      toast.error('Error cargando los modificadores');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId]);

  const duplicateGroup = async (group) => {
    try {
      setLoading(true);
      // 1. Create the new group
      const newGroupData = {
        name: `${group.name} (Copia)`,
        description: group.description,
        is_required: group.is_required,
        min_select: group.min_select,
        max_select: group.max_select,
        is_submodifier: group.is_submodifier,
        brand_id: activeBrandId
      };

      const { data: newGroup, error: groupError } = await supabase
        .from('modifier_groups')
        .insert([newGroupData])
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Clone the options
      if (group.options && group.options.length > 0) {
        const newOptionsData = group.options.map(opt => ({
          group_id: newGroup.id,
          name: opt.name,
          price: opt.price,
          ingredient_id: opt.ingredient_id,
          nested_group_id: opt.nested_group_id,
          emoji: opt.emoji,
          image_url: opt.image_url,
          sort_order: opt.sort_order
        }));

        const { error: optionsError } = await supabase
          .from('modifier_options')
          .insert(newOptionsData);

        if (optionsError) throw optionsError;
      }

      toast.success('Grupo duplicado correctamente');
      fetchModifierGroups();
      return true;
    } catch (err) {
      console.error('Error duplicating group:', err);
      toast.error('Error al duplicar grupo');
      return false;
    } finally {
      setLoading(false);
    }
  };

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
    duplicateGroup,
    createOption,
    updateOption,
    deleteOption
  };
};
