import { useState } from 'react';
import { supabase } from '../config/supabase';

export function useLocationOverrides() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getCategoryOverrides(categoryId) {
    try {
      const { data, error } = await supabase
        .from('location_categories')
        .select('*')
        .eq('category_id', categoryId);
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching category overrides:', err);
      return [];
    }
  }

  async function getProductOverrides(productId) {
    try {
      const [prices, status] = await Promise.all([
        supabase.from('location_product_prices').select('*').eq('product_id', productId),
        supabase.from('location_product_status').select('*').eq('product_id', productId)
      ]);

      if (prices.error) throw prices.error;
      if (status.error) throw status.error;

      return {
        prices: prices.data || [],
        status: status.data || []
      };
    } catch (err) {
      console.error('Error fetching product overrides:', err);
      return { prices: [], status: [] };
    }
  }

  async function getInventoryOverrides(locationId) {
    try {
      const { data, error } = await supabase
        .from('location_inventory')
        .select('*')
        .eq('location_id', locationId);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching inventory overrides:', err);
      return [];
    }
  }

  async function saveCategoryOverrides(categoryId, overrides) {
    if (!overrides?.length) return { error: null };
    setLoading(true);
    try {
      const { error } = await supabase
        .from('location_categories')
        .upsert(
          overrides.map(o => ({
            category_id: categoryId,
            location_id: o.location_id,
            is_active: o.is_active
          })),
          { onConflict: 'location_id,category_id' }
        );
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err };
    } finally {
      setLoading(false);
    }
  }

  async function saveProductOverrides(productId, overrides) {
    setLoading(true);
    try {
      const promises = [];
      
      if (overrides.prices?.length) {
        promises.push(
          supabase.from('location_product_prices').upsert(
            overrides.prices.map(p => ({
              product_id: productId,
              location_id: p.location_id,
              price: p.price
            })),
            { onConflict: 'location_id,product_id' }
          )
        );
      }

      if (overrides.status?.length) {
        promises.push(
          supabase.from('location_product_status').upsert(
            overrides.status.map(s => ({
              product_id: productId,
              location_id: s.location_id,
              is_active: s.is_active,
              stock_status: s.stock_status
            })),
            { onConflict: 'location_id,product_id' }
          )
        );
      }

      const results = await Promise.all(promises);
      const firstError = results.find(r => r.error);
      if (firstError) throw firstError.error;

      return { error: null };
    } catch (err) {
      return { error: err };
    } finally {
      setLoading(false);
    }
  }

  async function updateLocationStock(locationId, ingredientId, stock_quantity) {
    try {
      const { data, error } = await supabase
        .from('location_inventory')
        .upsert(
          {
            location_id: locationId,
            ingredient_id: ingredientId,
            stock_quantity
          },
          { onConflict: 'location_id,ingredient_id' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  return {
    loading,
    error,
    getCategoryOverrides,
    getProductOverrides,
    getInventoryOverrides,
    saveCategoryOverrides,
    saveProductOverrides,
    updateLocationStock
  };
}
