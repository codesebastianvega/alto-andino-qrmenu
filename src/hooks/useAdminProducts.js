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
    const { signal, silent = false } = options;
    try {
      if (signal?.aborted) return;
      if (isMountedRef.current && !silent) setLoading(true);
      
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
      let fetchedProducts = [...(data || [])];

      // Auto-provisioning y sincronización de Bentos para BOKU BENTO
      if (activeBrandId === 'a63da806-a62a-49b9-a833-07e0976785ad') {
        // Auto-provisioning Poke Tori Katsu
        const hasToriKatsu = fetchedProducts.some(p => p.id === 'b0000b25-0000-4000-a000-000000000025' || /tori\s*katsu/i.test(p.name));
        if (!hasToriKatsu) {
          const newToriKatsuObj = {
            id: 'b0000b25-0000-4000-a000-000000000025',
            brand_id: activeBrandId,
            name: 'Poke Tori Katsu (Pechuga Crocante)',
            description: 'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde de cebollín. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
            price: 22000,
            cost: 8500,
            margin: 61.36,
            category_id: '6316a6dc-8a4c-4cc1-874b-4f3d362ed635',
            image_url: '/img/products/boku-tori-katsu.webp',
            is_active: true,
            stock_status: 'in',
            available_portions: 50,
            requires_kitchen: true,
            station: 'kitchen',
            subcategory: 'Bowls Poke Fresco',
            category: { name: 'BOKU Bowls', slug: 'boku-bowls' },
            location_product_status: [],
            location_product_prices: [],
            modifier_groups: ['b0000b20-0000-4000-a000-000000000002', 'b0000b20-0000-4000-a000-000000000001']
          };
          fetchedProducts.unshift(newToriKatsuObj);

          supabase.from('products').upsert([{
            id: newToriKatsuObj.id,
            brand_id: activeBrandId,
            name: newToriKatsuObj.name,
            description: newToriKatsuObj.description,
            price: newToriKatsuObj.price,
            cost: newToriKatsuObj.cost,
            margin: newToriKatsuObj.margin,
            category_id: newToriKatsuObj.category_id,
            image_url: newToriKatsuObj.image_url,
            is_active: true,
            stock_status: 'in',
            available_portions: 50,
            requires_kitchen: true,
            station: 'kitchen',
            subcategory: 'Bowls Poke Fresco',
            modifier_groups: ['b0000b20-0000-4000-a000-000000000002', 'b0000b20-0000-4000-a000-000000000001']
          }], { onConflict: 'id' }).then(({ error: upErr }) => {
            if (upErr) console.warn('Poke Tori Katsu DB auto-insert notice:', upErr.message);
          });
        }

        const hasMedit = fetchedProducts.some(p => p.id === 'b0000b18-0000-4000-a000-000000000018' || /mediterr[aá]neo/i.test(p.name));
        if (!hasMedit) {
          const newBentoObj = {
            id: 'b0000b18-0000-4000-a000-000000000018',
            brand_id: activeBrandId,
            name: 'Bento Mediterráneo (Fresco y Balanceado)',
            description: 'Arroz blanco con perejil, hummus casero cremoso de garbanzo con aceite y páprika, champiñones al ajillo, pepino fresco, tomates cherry y rábano crocante. 👉 Proteína a elección (al limón): Filete de merluza dorada o pechuga de pollo al wok. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
            price: 19000,
            cost: 7500,
            margin: 60.53,
            category_id: 'b0000c01-0000-4000-a000-000000000001',
            image_url: '/bento-mediterraneo.jpg',
            is_active: true,
            stock_status: 'in',
            requires_kitchen: true,
            station: 'kitchen',
            subcategory: 'Bentos Caseros',
            category: { name: 'BOKU Bentos Caseros', slug: 'boku-bentos' },
            location_product_status: [],
            location_product_prices: []
          };
          fetchedProducts.unshift(newBentoObj);

          // Inserción en base de datos con las credenciales autenticadas del administrador
          supabase.from('products').upsert([{
            id: newBentoObj.id,
            brand_id: activeBrandId,
            name: newBentoObj.name,
            description: newBentoObj.description,
            price: newBentoObj.price,
            cost: newBentoObj.cost,
            margin: newBentoObj.margin,
            category_id: newBentoObj.category_id,
            image_url: newBentoObj.image_url,
            is_active: true,
            stock_status: 'in',
            requires_kitchen: true,
            station: 'kitchen',
            subcategory: 'Bentos Caseros',
            modifier_groups: ['b0000b20-0000-4000-a000-000000000002', 'b0000b20-0000-4000-a000-000000000001']
          }], { onConflict: 'id' }).then(({ error: upErr }) => {
            if (upErr) console.warn('Bento Mediterraneo DB auto-insert notice:', upErr.message);
          });
        }

        // Sincronizar Bento Criollo con su nuevo nombre y subcategoría
        const criolloIndex = fetchedProducts.findIndex(p => p.id === 'b0000b11-0000-4000-a000-000000000001' || /criollo/i.test(p.name));
        if (criolloIndex >= 0) {
          const criolloProd = fetchedProducts[criolloIndex];
          if (criolloProd.name.includes('Mini Paisa Bowl') || criolloProd.subcategory !== 'Bentos Caseros') {
            fetchedProducts[criolloIndex] = {
              ...criolloProd,
              name: 'Bento Criollo Antioqueño (La Paisa)',
              subcategory: 'Bentos Caseros'
            };
            supabase.from('products').update({
              name: 'Bento Criollo Antioqueño (La Paisa)',
              description: 'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
              subcategory: 'Bentos Caseros'
            }).eq('id', criolloProd.id).then(() => {});
          }
        }
      }

      setProducts(fetchedProducts);
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError') return;
      console.error('Error fetching products:', err);
      if (isMountedRef.current) setError(err.message);
    } finally {
      if (!signal?.aborted && isMountedRef.current && !silent) setLoading(false);
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
        fetchProducts('all', { signal: abortController.signal, silent: true });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'location_product_prices'
      }, (payload) => {
        console.log('Realtime: Price override change detected', payload);
        fetchProducts('all', { signal: abortController.signal, silent: true });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'location_product_status'
      }, (payload) => {
        console.log('Realtime: Status override change detected', payload);
        fetchProducts('all', { signal: abortController.signal, silent: true });
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
        ingredient_id: productData.ingredient_id || null,
        variants: productData.variants || [],
        modifier_groups: productData.modifier_groups || [],
        config_options: productData.config_options || {},
        is_upsell: productData.is_upsell || false,
        requires_kitchen: productData.requires_kitchen ?? true,
        station: productData.station || (productData.requires_kitchen === false ? 'none' : 'kitchen'),
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
        ingredient_id: productData.ingredient_id || null,
        variants: productData.variants || [],
        modifier_groups: productData.modifier_groups || [],
        config_options: productData.config_options || {},
        is_upsell: productData.is_upsell || false,
        requires_kitchen: productData.requires_kitchen ?? true,
        station: productData.station || (productData.requires_kitchen === false ? 'none' : 'kitchen'),
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
      
      // Sincronizar location_product_status para que sedes y tabletas reflejen el cambio
      if (cleanData.stock_status) {
        await supabase
          .from('location_product_status')
          .update({ stock_status: cleanData.stock_status, updated_at: new Date().toISOString() })
          .eq('product_id', id);
      }

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
    const nextStatus = !currentStatus;

    // 1. Actualización optimista inmediata en UI (0ms)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: nextStatus } : p));

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: nextStatus })
        .eq('id', id)
        .eq('brand_id', activeBrandId);

      if (error) throw error;
      await fetchProducts('all', { silent: true });
      return true;
    } catch (err) {
      console.error('Error toggling active status:', err);
      // Revertir optimismo en caso de fallo
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: currentStatus } : p));
      toast.error('Error al cambiar visibilidad');
      return false;
    }
  };

  const toggleStock = async (id, currentStatus) => {
    const next = currentStatus === 'in' ? 'out' : 'in';

    // 1. Actualización optimista inmediata en UI (0ms)
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updatedStatus = (p.location_product_status || []).map(lps => ({
          ...lps,
          stock_status: next
        }));
        return { ...p, stock_status: next, location_product_status: updatedStatus };
      }
      return p;
    }));

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_status: next })
        .eq('id', id)
        .eq('brand_id', activeBrandId);
      if (error) throw error;

      // Sincronizar location_product_status para que sedes y tabletas reflejen el cambio de inmediato
      await supabase
        .from('location_product_status')
        .update({ stock_status: next, updated_at: new Date().toISOString() })
        .eq('product_id', id);

      await fetchProducts('all', { silent: true });
      return true;
    } catch (err) {
      console.error('Error toggling stock status:', err);
      // Revertir optimismo en caso de fallo
      setProducts(prev => prev.map(p => {
        if (p.id === id) {
          const revertedStatus = (p.location_product_status || []).map(lps => ({
            ...lps,
            stock_status: currentStatus
          }));
          return { ...p, stock_status: currentStatus, location_product_status: revertedStatus };
        }
        return p;
      }));
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
