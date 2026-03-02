import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';

export function useAdminIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      toast('Error al cargar insumos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createIngredient = async (ingredientData) => {
    try {
      // Calculate unit cost before saving
      const purchasePrice = parseFloat(ingredientData.purchase_price) || 0;
      const purchaseQuantity = parseFloat(ingredientData.purchase_quantity) || 1;
      const unitCost = purchasePrice / purchaseQuantity;

      const { data, error } = await supabase
        .from('ingredients')
        .insert([{
          ...ingredientData,
          category_id: ingredientData.category_id || null, // Normalize empty string to null
          provider_id: ingredientData.provider_id || null,
          unit_cost: unitCost,
          selling_price: parseFloat(ingredientData.selling_price) || 0,
          portion_size: parseFloat(ingredientData.portion_size) || 50,
          is_modifier: Boolean(ingredientData.is_modifier)
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase create ingredient error:', error);
        throw error;
      }
      toast('Insumo creado correctamente');
      fetchIngredients();
      return data;
    } catch (err) {
      console.error('Error in useAdminIngredients createIngredient:', err);
      toast('Error al crear insumo: ' + err.message);
      return null;
    }
  };

  const updateIngredient = async (id, ingredientData) => {
    try {
      // Calculate unit cost before saving
      const purchasePrice = parseFloat(ingredientData.purchase_price) || 0;
      const purchaseQuantity = parseFloat(ingredientData.purchase_quantity) || 1;
      const unitCost = purchasePrice / purchaseQuantity;

      const { data, error } = await supabase
        .from('ingredients')
        .update({
          ...ingredientData,
          category_id: ingredientData.category_id || null, // Normalize empty string to null
          provider_id: ingredientData.provider_id || null,
          unit_cost: unitCost,
          selling_price: parseFloat(ingredientData.selling_price) || 0,
          portion_size: parseFloat(ingredientData.portion_size) || 50,
          is_modifier: Boolean(ingredientData.is_modifier)
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update ingredient error:', error);
        throw error;
      }
      toast('Insumo actualizado');
      fetchIngredients();
      return data;
    } catch (err) {
      console.error('Error in useAdminIngredients updateIngredient:', err);
      toast('Error al actualizar: ' + err.message);
      return null;
    }
  };

  const deleteIngredient = async (id) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Insumo eliminado');
      fetchIngredients();
      return true;
    } catch (err) {
      toast('Error al eliminar insumo');
      return false;
    }
  };

  return {
    ingredients,
    loading,
    fetchIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient
  };
}
