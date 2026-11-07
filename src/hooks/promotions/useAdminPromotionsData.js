import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { useLocations } from '../../context/LocationContext';
import { useMenuData } from '../../context/MenuDataContext';
import { getDefaultBrandCoupons } from '../../utils/couponSecurity';

export const initialPromotionFormState = {
  name: '',
  type: 'free_delivery', // 'free_delivery' | 'percentage_discount' | 'fixed_discount'
  value: 0,
  target: 'delivery', // 'delivery' | 'all' | 'category' | 'product'
  target_ids: [],
  min_order_amount: 0,
  code: '',
  start_date: new Date().toISOString().slice(0, 16),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  is_active: true,
  show_banner: true,
  banner_message: '🎉 ¡Semana de Apertura! Domicilio 100% GRATIS en todos tus pedidos',
  banner_bg_color: '#047857',
  banner_text_color: '#ffffff',
  location_id: ''
};

export function useAdminPromotionsData() {
  const { activeBrand, profile } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const { activeLocationId, isAllLocations, locations } = useLocations();
  const { allCategories = [], getAllProducts, refetchPromotions } = useMenuData();
  const allProducts = useMemo(() => getAllProducts?.() || [], [getAllProducts]);

  const activeBrandId = activeBrand?.id || brandFromContext?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initialPromotionFormState);

  const fetchPromotions = useCallback(async () => {
    if (!activeBrandId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let query = supabase
        .from('promotions')
        .select('*')
        .eq('brand_id', activeBrandId)
        .order('created_at', { ascending: false });

      if (!isAllLocations && activeLocationId) {
        query = query.or(`location_id.eq.${activeLocationId},location_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      const dbList = data || [];
      const existingCodes = new Set(dbList.map(p => (p.code || '').trim().toUpperCase()).filter(Boolean));
      const defaultCoupons = getDefaultBrandCoupons(activeBrandId).filter(
        dc => !existingCodes.has((dc.code || '').trim().toUpperCase())
      );
      setPromotions([...dbList, ...defaultCoupons]);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      toast.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId, isAllLocations, activeLocationId]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const applyTemplate = (templateType) => {
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (templateType === 'free_delivery_opening') {
      setFormData({
        ...initialPromotionFormState,
        name: 'Semana de Apertura: Domicilio Gratis',
        type: 'free_delivery',
        target: 'delivery',
        value: 0,
        min_order_amount: 0,
        banner_message: '🎉 ¡Semana de Apertura! Domicilio 100% GRATIS en todos tus pedidos',
        banner_bg_color: '#047857',
        start_date: now.toISOString().slice(0, 16),
        end_date: oneWeek.toISOString().slice(0, 16),
        is_active: true,
        show_banner: true
      });
    } else if (templateType === 'ten_percent_store') {
      setFormData({
        ...initialPromotionFormState,
        name: '10% de Descuento de Lanzamiento',
        type: 'percentage_discount',
        target: 'all',
        value: 10,
        min_order_amount: 25000,
        banner_message: '✨ ¡10% de Descuento en toda la carta por tiempo limitado!',
        banner_bg_color: '#1e3a8a',
        start_date: now.toISOString().slice(0, 16),
        end_date: oneWeek.toISOString().slice(0, 16),
        is_active: true,
        show_banner: true
      });
    } else if (templateType === 'category_discount') {
      const firstCat = allCategories[0];
      setFormData({
        ...initialPromotionFormState,
        name: `20% OFF en ${firstCat?.name || 'Categoría Destacada'}`,
        type: 'percentage_discount',
        target: 'category',
        target_ids: firstCat ? [firstCat.id] : [],
        value: 20,
        min_order_amount: 0,
        banner_message: `🍱 ¡20% OFF en ${firstCat?.name || 'platos seleccionados'} hoy!`,
        banner_bg_color: '#9333ea',
        start_date: now.toISOString().slice(0, 16),
        end_date: oneWeek.toISOString().slice(0, 16),
        is_active: true,
        show_banner: true
      });
    } else if (templateType === 'social_coupon') {
      setFormData({
        ...initialPromotionFormState,
        name: 'Cupón Personalizado de Carrito (10% OFF)',
        type: 'percentage_discount',
        target: 'all',
        value: 10,
        code: 'BOKU10',
        min_order_amount: 20000,
        banner_message: '🎟️ Usa el código BOKU10 en tu carrito y recibe 10% OFF',
        banner_bg_color: '#b45309',
        start_date: now.toISOString().slice(0, 16),
        end_date: oneWeek.toISOString().slice(0, 16),
        is_active: true,
        show_banner: false
      });
    } else if (templateType === 'free_delivery_coupon') {
      setFormData({
        ...initialPromotionFormState,
        name: 'Cupón Domicilio Gratis en Carrito',
        type: 'free_delivery',
        target: 'delivery',
        value: 0,
        code: 'DOMIGRATIS',
        min_order_amount: 25000,
        banner_message: '🛵 Cupón DOMIGRATIS: Domicilio sin costo en tu pedido',
        banner_bg_color: '#047857',
        start_date: now.toISOString().slice(0, 16),
        end_date: oneWeek.toISOString().slice(0, 16),
        is_active: true,
        show_banner: false
      });
    }

    setEditingPromo(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (promo) => {
    const newStatus = !promo.is_active;
    setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: newStatus } : p));

    if (promo.is_default_template) {
      try {
        const storageKey = `aa_disabled_default_coupons_${activeBrandId}`;
        const raw = localStorage.getItem(storageKey);
        const disabledList = raw ? JSON.parse(raw) : [];
        const codeUpper = (promo.code || '').trim().toUpperCase();
        const updated = newStatus
          ? disabledList.filter(c => c !== codeUpper)
          : Array.from(new Set([...disabledList, codeUpper]));
        localStorage.setItem(storageKey, JSON.stringify(updated));
        refetchPromotions?.();
        toast.success(newStatus ? `Cupón ${codeUpper} activado 🚀` : `Cupón ${codeUpper} pausado`);
      } catch (e) {
        console.error('Error toggling default coupon:', e);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', promo.id);

      if (error) throw error;
      refetchPromotions?.();
      toast.success(newStatus ? 'Campaña activada con éxito 🚀' : 'Campaña pausada');
    } catch (err) {
      console.error('Error toggling promo:', err);
      toast.error('No se pudo actualizar el estado');
      fetchPromotions();
    }
  };

  const handleDeletePromo = async (promoId) => {
    const targetPromo = promotions.find(p => p.id === promoId);
    if (targetPromo?.is_default_template) {
      handleToggleActive(targetPromo);
      return;
    }
    if (!window.confirm('¿Seguro que deseas eliminar esta campaña?')) return;
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', promoId);
      if (error) throw error;
      setPromotions(prev => prev.filter(p => p.id !== promoId));
      refetchPromotions?.();
      toast.success('Campaña eliminada');
    } catch (err) {
      console.error('Error deleting promo:', err);
      toast.error('Error al eliminar');
    }
  };

  const handleEditPromo = (promo) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name || '',
      type: promo.type || 'free_delivery',
      value: promo.value || 0,
      target: promo.target || 'delivery',
      target_ids: promo.target_ids || [],
      min_order_amount: promo.min_order_amount || 0,
      code: promo.code || '',
      start_date: promo.start_date ? new Date(promo.start_date).toISOString().slice(0, 16) : '',
      end_date: promo.end_date ? new Date(promo.end_date).toISOString().slice(0, 16) : '',
      is_active: promo.is_active ?? true,
      show_banner: promo.show_banner ?? true,
      banner_message: promo.banner_message || '',
      banner_bg_color: promo.banner_bg_color || '#047857',
      banner_text_color: promo.banner_text_color || '#ffffff',
      location_id: promo.location_id || ''
    });
    setIsModalOpen(true);
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Por favor escribe un nombre para la campaña');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        brand_id: activeBrandId,
        location_id: formData.location_id || null,
        name: formData.name.trim(),
        type: formData.type,
        value: Number(formData.value) || 0,
        target: formData.target,
        target_ids: formData.target_ids || [],
        min_order_amount: Number(formData.min_order_amount) || 0,
        code: formData.code?.trim() ? formData.code.trim().toUpperCase() : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        is_active: formData.is_active,
        show_banner: formData.show_banner,
        banner_message: formData.banner_message?.trim() || null,
        banner_bg_color: formData.banner_bg_color || '#047857',
        banner_text_color: formData.banner_text_color || '#ffffff',
        updated_at: new Date().toISOString()
      };

      if (editingPromo && !editingPromo.is_default_template) {
        const { error } = await supabase
          .from('promotions')
          .update(payload)
          .eq('id', editingPromo.id);
        if (error) throw error;
        toast.success('Campaña actualizada ✨');
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([payload]);
        if (error) throw error;
        toast.success('¡Campaña / Cupón guardado con éxito! 🎉');
      }

      setIsModalOpen(false);
      setEditingPromo(null);
      fetchPromotions();
      refetchPromotions?.();
    } catch (err) {
      console.error('Error saving promotion:', err);
      toast.error('Error al guardar la campaña');
    } finally {
      setIsSaving(false);
    }
  };

  const getPromoStatus = (promo) => {
    if (!promo.is_active) return { label: 'Inactiva', color: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
    const now = new Date();
    if (promo.start_date && new Date(promo.start_date) > now) {
      return { label: 'Programada', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (promo.end_date && new Date(promo.end_date) < now) {
      return { label: 'Vencida', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: 'En Vivo', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' };
  };

  const activeCount = promotions.filter(p => p.is_active && (!p.end_date || new Date(p.end_date) >= new Date())).length;

  return {
    promotions,
    loading,
    isModalOpen,
    setIsModalOpen,
    editingPromo,
    setEditingPromo,
    isSaving,
    formData,
    setFormData,
    initialFormState: initialPromotionFormState,
    activeBrand,
    activeBrandId,
    brandFromContext,
    allCategories,
    allProducts,
    locations,
    activeCount,
    applyTemplate,
    handleToggleActive,
    handleDeletePromo,
    handleEditPromo,
    handleSavePromo,
    getPromoStatus,
    fetchPromotions
  };
}
