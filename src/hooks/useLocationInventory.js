import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';

export const useLocationInventory = () => {
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async (filters) => {
    try {
      setLoading(true);
      let query = supabase.from('location_inventory').select('*');

      if (filters.ingredient_id) {
        query = query.eq('ingredient_id', filters.ingredient_id);
      }
      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveInventory = async (inventoryData) => {
    try {
      setLoading(true);
      
      // inventoryData should be an array of objects:
      // { location_id, ingredient_id, product_id, stock_quantity, min_stock }
      
      for (const item of inventoryData) {
        const { location_id, ingredient_id, product_id, stock_quantity, min_stock } = item;
        
        // Build the upsert query
        const upsertData = {
          location_id,
          stock_quantity: parseFloat(stock_quantity) || 0,
          min_stock: parseFloat(min_stock) || 0,
        };

        if (ingredient_id) upsertData.ingredient_id = ingredient_id;
        if (product_id) upsertData.product_id = product_id;

        // Determine the unique constraint matchers
        const matchers = { location_id };
        if (ingredient_id) matchers.ingredient_id = ingredient_id;
        if (product_id) matchers.product_id = product_id;

        // Check if record exists
        let query = supabase.from('location_inventory').select('id');
        Object.entries(matchers).forEach(([key, val]) => {
            query = query.eq(key, val);
        });
        
        const { data: existing } = await query.single();

        if (existing) {
          const { error } = await supabase
            .from('location_inventory')
            .update(upsertData)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('location_inventory')
            .insert([upsertData]);
          if (error) throw error;
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast.error('Error al guardar el inventario por sede');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchInventory,
    saveInventory
  };
};
