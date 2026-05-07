import { useState } from 'react';
import { supabase } from '../config/supabase';

export function useLocationOverrides() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function upsertWithFallback(table, rows, onConflict, conflictKeys) {
    if (!rows?.length) return { error: null };

    const attempt = await supabase.from(table).upsert(rows, { onConflict });
    if (!attempt.error) return { error: null };

    const needsFallback =
      attempt.error.code === '42P10' ||
      attempt.error.message?.includes('no unique or exclusion constraint');

    if (!needsFallback) {
      return { error: attempt.error };
    }

    for (const row of rows) {
      const match = conflictKeys.reduce((query, key) => query.eq(key, row[key]), supabase.from(table).select('id').limit(1));
      const existing = await match.maybeSingle();
      if (existing.error) return { error: existing.error };

      if (existing.data?.id) {
        const { error: updateError } = await supabase
          .from(table)
          .update(row)
          .eq('id', existing.data.id);
        if (updateError) return { error: updateError };
      } else {
        const { error: insertError } = await supabase
          .from(table)
          .insert([row]);
        if (insertError) return { error: insertError };
      }
    }

    return { error: null };
  }

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
    if (!locationId || locationId === 'all') return [];
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
      const { error } = await upsertWithFallback(
        'location_categories',
        overrides.map(o => ({
          category_id: categoryId,
          location_id: o.location_id,
          is_active: o.is_active
        })),
        'location_id,category_id',
        ['location_id', 'category_id']
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
        // Separate prices to upsert vs prices to delete
        const validPrices = overrides.prices.filter(p => p.price !== null && p.price !== undefined && p.price !== '');
        const pricesToDelete = overrides.prices.filter(p => p.price === null || p.price === undefined || p.price === '');

        if (validPrices.length > 0) {
          promises.push(
            upsertWithFallback(
              'location_product_prices',
              validPrices.map(p => ({
                product_id: productId,
                location_id: p.location_id,
                price: p.price
              })),
              'location_id,product_id',
              ['location_id', 'product_id']
            )
          );
        }

        if (pricesToDelete.length > 0) {
          promises.push(
            supabase.from('location_product_prices')
              .delete()
              .eq('product_id', productId)
              .in('location_id', pricesToDelete.map(p => p.location_id))
          );
        }
      }

      if (overrides.status?.length) {
        promises.push(
          upsertWithFallback(
            'location_product_status',
            overrides.status.map(s => ({
              product_id: productId,
              location_id: s.location_id,
              is_active: s.is_active,
              stock_status: s.stock_status
            })),
            'location_id,product_id',
            ['location_id', 'product_id']
          )
        );
      }

      const results = await Promise.all(promises);
      const firstError = results.find(r => r.error);
      if (firstError) throw firstError.error;

      return { error: null };
    } catch (err) {
      console.error('Error saving product overrides:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }

  async function updateLocationStock(locationId, ingredientId, stock_quantity) {
    if (!locationId || locationId === 'all') return { data: null, error: new Error('Please select a specific location first') };
    try {
      const row = {
        location_id: locationId,
        ingredient_id: ingredientId,
        stock_quantity
      };
      const { error } = await upsertWithFallback(
        'location_inventory',
        [row],
        'location_id,ingredient_id',
        ['location_id', 'ingredient_id']
      );
      if (error) throw error;
      const { data, error: fetchError } = await supabase
        .from('location_inventory')
        .select('*')
        .eq('location_id', locationId)
        .eq('ingredient_id', ingredientId)
        .maybeSingle();
      if (fetchError) throw fetchError;
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
