import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';

const TABLE_MAP = {
  product: 'location_product_status',
  products: 'location_product_status',
  category: 'location_categories',
  categories: 'location_categories',
  recipe: 'location_recipes',
  recipes: 'location_recipes',
  inventory: 'location_inventory',
  ingredient: 'location_inventory',
  modifier_group: 'location_modifier_groups'
};

const ID_FIELD_MAP = {
  product: 'product_id',
  products: 'product_id',
  category: 'category_id',
  categories: 'category_id',
  recipe: 'recipe_id',
  recipes: 'recipe_id',
  inventory: 'ingredient_id',
  ingredient: 'ingredient_id',
  modifier_group: 'modifier_group_id'
};

export const useLinkCatalog = (locationId, type) => {
  const [loading, setLoading] = useState(false);
  const [linkedIds, setLinkedIds] = useState([]);

  const fetchLinkedIds = useCallback(async (overridingType, overridingLocId) => {
    const t = overridingType || type;
    const l = overridingLocId || locationId;
    
    // Supabase will throw a 400 if we query a UUID column with 'all'
    if (!t || !l || l === 'all' || l === 'undefined' || l === 'null') {
      console.log(`[useLinkCatalog] Skipping fetch for type: ${t}, location: ${l}`);
      setLinkedIds([]);
      setLoading(false);
      return [];
    }

    const tableName = TABLE_MAP[t];
    const idField = ID_FIELD_MAP[t];

    if (!tableName || !idField) {
      console.error(`[useLinkCatalog] No configuration for type: ${t}`);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      console.log(`[useLinkCatalog] Fetching linked IDs for ${t} in location ${l} using table ${tableName}`);

      const { data, error } = await supabase
        .from(tableName)
        .select(idField)
        .eq('location_id', l);

      if (error) throw error;
      
      const ids = data.map(item => item[idField]);
      if (!overridingType && !overridingLocId) {
        setLinkedIds(ids);
      }
      return ids;
    } catch (error) {
      console.error(`Error fetching linked ${t}:`, error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [locationId, type]);

  const linkItem = useCallback(async (overridingType, overridingLocId, overridingItemId) => {
    // Handle both (type, locId, itemId) and (itemId) signatures
    let t, l, itemId;
    if (overridingItemId !== undefined) {
      t = overridingType;
      l = overridingLocId;
      itemId = overridingItemId;
    } else {
      t = type;
      l = locationId;
      itemId = overridingType; // itemId is first arg if only one provided
    }

    if (!t || !l || l === 'all') return { success: false, error: 'No location selected' };

    try {
      setLoading(true);
      const tableName = TABLE_MAP[t];
      const idField = ID_FIELD_MAP[t];

      if (!tableName || !idField) throw new Error('Invalid item type');

      const payload = {
        location_id: l,
        [idField]: itemId
      };

      // Solo incluimos is_active para las tablas que tienen esa columna
      if (['location_product_status', 'location_categories', 'location_recipes'].includes(tableName)) {
        payload.is_active = true;
      }

      const { error } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: `location_id,${idField}` });

      if (error) throw error;
      
      if (!overridingLocId) await fetchLinkedIds();
      return { success: true };
    } catch (error) {
      console.error(`Error linking ${t}:`, error);
      toast.error('Error al vincular el elemento');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [locationId, type, fetchLinkedIds]);

  const unlinkItem = useCallback(async (overridingType, overridingLocId, overridingItemId) => {
    // Handle both (type, locId, itemId) and (itemId) signatures
    let t, l, itemId;
    if (overridingItemId !== undefined) {
      t = overridingType;
      l = overridingLocId;
      itemId = overridingItemId;
    } else {
      t = type;
      l = locationId;
      itemId = overridingType;
    }

    if (!t || !l || l === 'all') return { success: false, error: 'No location selected' };

    try {
      setLoading(true);
      const tableName = TABLE_MAP[t];
      const idField = ID_FIELD_MAP[t];

      if (!tableName || !idField) throw new Error('Invalid item type');

      const { error } = await supabase
        .from(tableName)
        .delete()
        .match({ location_id: l, [idField]: itemId });

      if (error) throw error;
      
      if (!overridingLocId) await fetchLinkedIds();
      return { success: true };
    } catch (error) {
      console.error(`Error unlinking ${t}:`, error);
      toast.error('Error al desvincular el elemento');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [locationId, type, fetchLinkedIds]);

  // Initial fetch if params provided
  useEffect(() => {
    if (locationId && type) {
      fetchLinkedIds();
    }
  }, [locationId, type, fetchLinkedIds]);

  return {
    loading,
    isLoading: loading, // Alias for backward compatibility/modal
    linkedIds,
    linkItem,
    unlinkItem,
    fetchLinkedIds,
    refresh: fetchLinkedIds // Alias for modal
  };
};
