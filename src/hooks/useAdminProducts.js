import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export const useAdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeBrand } = useAuth();
  const activeBrandId = activeBrand?.id;
  const isMountedRef = useRef(false);
  const isRealtimeActiveRef = useRef(false);

  const fetchProducts = useCallback(async (locationId = 'all', options = {}) => {
    const { signal } = options;
    try {
      if (signal?.aborted) return;
      if (isMountedRef.current) setLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          location_product_status(*),
          location_product_prices(*)
        `);

      if (activeBrandId) {
        query = query.eq('brand_id', activeBrandId);
      }

      if (signal) {
        query = query.abortSignal(signal);
      }

      // We no longer filter out products that don't have a status record for the location.
      // Instead, we fetch all and let the UI handle the "Inherit" state.
      // if (locationId && locationId !== 'all') { ... }

      const { data, error } = await query
        .order('sort_order', { ascending: true })
        .order('name');

      if (signal?.aborted || !isMountedRef.current) return;
      
      if (error) throw error;

      // If a product exists in the brand, it's visible in the admin list.
      const fetchedProducts = data || [];
      setProducts(fetchedProducts);
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError') return;
      console.error('Error fetching products:', err);
      if (isMountedRef.current) setError(err.message);
    } finally {
      if (!signal?.aborted && isMountedRef.current) setLoading(false);
    }
  }, [activeBrandId]);

  useEffect(() => {
    isMountedRef.current = true;
    isRealtimeActiveRef.current = true;

    if (!activeBrandId) {
      setLoading(false);
      return () => {
        isMountedRef.current = false;
        isRealtimeActiveRef.current = false;
      };
    }

    const abortController = new AbortController();

    fetchProducts('all', { signal: abortController.signal });

    // Real-time listener for products
    const channel = supabase
      .channel(`admin-products-${activeBrandId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
        console.log('Realtime: Product change detected', payload);
        fetchProducts('all', { signal: abortController.signal });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'location_product_prices'
      }, (payload) => {
        console.log('Realtime: Price override change detected', payload);
        fetchProducts('all', { signal: abortController.signal });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'location_product_status'
      }, (payload) => {
        console.log('Realtime: Status override change detected', payload);
        fetchProducts('all', { signal: abortController.signal });
      })
      .subscribe((status) => {
        console.log(`Realtime: Subscription status for products: ${status}`);
        if (status === 'CHANNEL_ERROR' && isRealtimeActiveRef.current) {
          console.debug('Realtime: Products channel unavailable; falling back to manual refresh');
        }
      });

    return () => {
      isMountedRef.current = false;
      isRealtimeActiveRef.current = false;
      abortController.abort();
      supabase.removeChannel(channel);
    };
  }, [activeBrandId, fetchProducts]);

  const createProduct = async (productData) => {
    try {
      setLoading(true);
      
      // We clean up fields that might not exist in the DB yet or need normalization
      const cleanData = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        cost: parseFloat(productData.cost) || 0,
        margin: parseFloat(productData.price) > 0 ? ((parseFloat(productData.price) - (parseFloat(productData.cost) || 0)) / parseFloat(productData.price)) * 100 : 0,
        category_id: productData.category_id,
        stock_status: productData.stock_status || 'in',
        image_url: productData.image_url,
        tags: productData.tags || [],
        is_active: productData.is_active ?? true,
        is_addon: productData.is_addon || false,
        recipe_id: productData.recipe_id || null,
        variants: productData.variants || [],
        modifier_groups: productData.modifier_groups || [],
        config_options: productData.config_options || {},
        is_upsell: productData.is_upsell || false,
        requires_kitchen: productData.requires_kitchen ?? true,
         packaging_fee: parseFloat(productData.packaging_fee) || 0,
        subcategory: productData.subcategory || null,
        brand_concept: productData.brand_concept || null,
        brand_id: activeBrandId,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert([cleanData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Producto creado con éxito');
      await fetchProducts();
      return data;
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Error al crear producto: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      setLoading(true);

      const cleanData = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        cost: parseFloat(productData.cost) || 0,
        margin: parseFloat(productData.price) > 0 ? ((parseFloat(productData.price) - (parseFloat(productData.cost) || 0)) / parseFloat(productData.price)) * 100 : 0,
        category_id: productData.category_id,
        stock_status: productData.stock_status || 'in',
        image_url: productData.image_url,
        tags: productData.tags || [],
        is_active: productData.is_active ?? true,
        is_addon: productData.is_addon || false,
        recipe_id: productData.recipe_id || null,
        variants: productData.variants || [],
        modifier_groups: productData.modifier_groups || [],
        config_options: productData.config_options || {},
        is_upsell: productData.is_upsell || false,
        requires_kitchen: productData.requires_kitchen ?? true,
         packaging_fee: parseFloat(productData.packaging_fee) || 0,
        subcategory: productData.subcategory || null,
        brand_concept: productData.brand_concept || null,
        brand_id: activeBrandId,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .update(cleanData)
        .eq('id', id)
        .eq('brand_id', activeBrandId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Producto actualizado con éxito');
      await fetchProducts();
      return data;
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Error al actualizar producto: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('brand_id', activeBrandId);

      if (error) throw error;
      
      toast.success('Producto eliminado con éxito');
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Error al eliminar producto');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    console.log('toggleActive called for id:', id, 'currentStatus:', currentStatus);
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .eq('brand_id', activeBrandId);

      if (error) throw error;
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error toggling active status:', err);
      toast.error('Error al cambiar estado');
      return false;
    }
  };

  const toggleStock = async (id, currentStatus) => {
    const next = currentStatus === 'in' ? 'out' : 'in';
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_status: next })
        .eq('id', id)
        .eq('brand_id', activeBrandId);
      if (error) throw error;
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error toggling stock status:', err);
      toast.error('Error al cambiar disponibilidad');
      return false;
    }
  };

  const reorderProducts = async (orderedProducts) => {
    try {
      // Optimistic update
      setProducts(prev => {
        const updated = [...prev];
        orderedProducts.forEach((p, i) => {
          const idx = updated.findIndex(u => u.id === p.id);
          if (idx !== -1) updated[idx] = { ...updated[idx], sort_order: i };
        });
        return updated;
      });

      // Batch update in DB
      const updates = orderedProducts.map((p, i) =>
        supabase.from('products').update({ sort_order: i }).eq('id', p.id).eq('brand_id', activeBrandId)
      );
      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;

      toast.success('Orden guardado');
      return true;
    } catch (err) {
      console.error('Error reordering products:', err);
      toast.error('Error al reordenar');
      await fetchProducts();
      return false;
    }
  };

  const bulkUpdateCosts = async (updates) => {
    try {
      setLoading(true);
      
      // Separate calls to promise.all for batch update
      // Supabase doesn't support batch update with different values easily in one call without RPC
      // but we can use multiple update calls since it's a restricted number of products
      const updatePromises = updates.map(u => 
        supabase
          .from('products')
          .update({ cost: u.cost, margin: u.margin })
          .eq('id', u.id)
          .eq('brand_id', activeBrandId)
      );

      const results = await Promise.all(updatePromises);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;

      toast.success('Costos actualizados con éxito');
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error bulk updating costs:', err);
      toast.error('Error al actualizar costos');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleActive,
    toggleStock,
    reorderProducts,
    bulkUpdateCosts,
    refreshProducts: fetchProducts
  };
};
