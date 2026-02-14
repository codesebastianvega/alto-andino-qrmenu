import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast as toastFn } from '../components/Toast';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export const useAdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug)
        `)
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async (productData) => {
    try {
      setLoading(true);
      
      // We clean up fields that might not exist in the DB yet or need normalization
      const cleanData = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        cost: parseFloat(productData.cost) || 0,
        category_id: productData.category_id,
        stock_status: productData.stock_status || 'in',
        image_url: productData.image_url,
        tags: productData.tags || [],
        is_active: productData.is_active ?? true,
        is_addon: productData.is_addon || false,
        recipe_id: productData.recipe_id || null,
        variants: productData.variants || [],
        modifier_groups: productData.modifier_groups || [],
        config_options: productData.config_options || {}
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
        category_id: productData.category_id,
        stock_status: productData.stock_status || 'in',
        image_url: productData.image_url,
        tags: productData.tags || [],
        is_active: productData.is_active ?? true,
        is_addon: productData.is_addon || false,
        recipe_id: productData.recipe_id || null,
        variants: productData.variants || [],
        modifier_groups: productData.modifier_groups || [],
        config_options: productData.config_options || {}
      };

      const { data, error } = await supabase
        .from('products')
        .update(cleanData)
        .eq('id', id)
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
        .eq('id', id);

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
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error toggling active status:', err);
      toast.error('Error al cambiar estado');
      return false;
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
    refreshProducts: fetchProducts
  };
};
