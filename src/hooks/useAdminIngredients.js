import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export function useAdminIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ingredients')
        .select('*');

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      const { data, error } = await query
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      toast('Error al cargar insumos');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId]);

  useEffect(() => {
    if (activeBrandId) {
      fetchIngredients();
    } else {
      setLoading(false);
    }
  }, [activeBrandId, fetchIngredients]);

  const createIngredient = async (ingredientData) => {
    try {
      const purchasePrice = parseFloat(ingredientData.purchase_price) || 0;
      const purchaseQuantity = parseFloat(ingredientData.purchase_quantity) || 1;
      const unitCost = purchasePrice / purchaseQuantity;

      const cleanData = {
        name: ingredientData.name,
        description: ingredientData.description || null,
        sku: ingredientData.sku || null,
        category: ingredientData.category || null,
        category_id: ingredientData.category_id || null,
        provider_id: ingredientData.provider_id || null,
        purchase_price: purchasePrice,
        purchase_quantity: purchaseQuantity,
        purchase_unit: ingredientData.purchase_unit || 'Unidad',
        usage_unit: ingredientData.usage_unit || 'unidad',
        unit_cost: unitCost,
        selling_price: parseFloat(ingredientData.selling_price) || 0,
        portion_size: parseFloat(ingredientData.portion_size) || 50,
        is_modifier: Boolean(ingredientData.is_modifier),
        is_active: ingredientData.is_active ?? true,
        stock_current: parseFloat(ingredientData.stock_current) || 0,
        stock_min: parseFloat(ingredientData.stock_min) || 0,
        brand_id: activeBrandId,
      };

      const { data, error } = await supabase
        .from('ingredients')
        .insert([cleanData])
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
      const purchasePrice = parseFloat(ingredientData.purchase_price) || 0;
      const purchaseQuantity = parseFloat(ingredientData.purchase_quantity) || 1;
      const unitCost = purchasePrice / purchaseQuantity;

      const cleanData = {
        name: ingredientData.name,
        description: ingredientData.description || null,
        sku: ingredientData.sku || null,
        category: ingredientData.category || null,
        category_id: ingredientData.category_id || null,
        provider_id: ingredientData.provider_id || null,
        purchase_price: purchasePrice,
        purchase_quantity: purchaseQuantity,
        purchase_unit: ingredientData.purchase_unit || 'Unidad',
        usage_unit: ingredientData.usage_unit || 'unidad',
        unit_cost: unitCost,
        selling_price: parseFloat(ingredientData.selling_price) || 0,
        portion_size: parseFloat(ingredientData.portion_size) || 50,
        is_modifier: Boolean(ingredientData.is_modifier),
        is_active: ingredientData.is_active ?? true,
        stock_current: parseFloat(ingredientData.stock_current) || 0,
        stock_min: parseFloat(ingredientData.stock_min) || 0,
        brand_id: activeBrandId,
      };

      const { data, error } = await supabase
        .from('ingredients')
        .update(cleanData)
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
