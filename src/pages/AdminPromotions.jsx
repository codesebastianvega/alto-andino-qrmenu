import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { useLocations } from '../context/LocationContext';
import { useMenuData } from '../context/MenuDataContext';
import { formatCOP } from '../utils/money';

export default function AdminPromotions() {
  const { activeBrand, profile } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const { activeLocationId, isAllLocations, locations } = useLocations();
  const { allCategories = [], getAllProducts } = useMenuData();
  const allProducts = useMemo(() => getAllProducts?.() || [], [getAllProducts]);

  const activeBrandId = activeBrand?.id || brandFromContext?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const initialFormState = {
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

  const [formData, setFormData] = useState(initialFormState);

  // Fetch promotions
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
      setPromotions(data || []);
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

  // Quick 1-Click Launch Templates
  const applyTemplate = (templateType) => {
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (templateType === 'free_delivery_opening') {
      setFormData({
        ...initialFormState,
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
        ...initialFormState,
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
        ...initialFormState,
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
        ...initialFormState,
        name: 'Cupón Redes Sociales 15% OFF',
        type: 'percentage_discount',
        target: 'all',
        value: 15,
        code: 'BOKU15',
        min_order_amount: 30000,
        banner_message: '🎟️ Usa el código BOKU15 y recibe 15% OFF en tu orden',
        banner_bg_color: '#b45309',
        start_date: now.toISOString().slice(0, 16),
        end_date: oneWeek.toISOString().slice(0, 16),
        is_active: true,
        show_banner: true
      });
    }

    setEditingPromo(null);
    setIsModalOpen(true);
  };

  // Toggle active status
  const handleToggleActive = async (promo) => {
    const newStatus = !promo.is_active;
    // Optimistic update
    setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: newStatus } : p));

    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', promo.id);

      if (error) throw error;
      toast.success(newStatus ? 'Campaña activada con éxito 🚀' : 'Campaña pausada');
    } catch (err) {
      console.error('Error toggling promo:', err);
      toast.error('No se pudo actualizar el estado');
      fetchPromotions();
    }
  };

  // Delete promotion
  const handleDeletePromo = async (promoId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta campaña?')) return;
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', promoId);
      if (error) throw error;
      setPromotions(prev => prev.filter(p => p.id !== promoId));
      toast.success('Campaña eliminada');
    } catch (err) {
      console.error('Error deleting promo:', err);
      toast.error('Error al eliminar');
    }
  };

  // Open Edit Modal
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

  // Submit Save
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

      if (editingPromo) {
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
        toast.success('¡Campaña creada con éxito! 🎉');
      }

      setIsModalOpen(false);
      setEditingPromo(null);
      fetchPromotions();
    } catch (err) {
      console.error('Error saving promotion:', err);
      toast.error('Error al guardar la campaña');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for status badge
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl font-bold border border-amber-500/20 shadow-xs">
              🏷️
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Campañas & Descuentos
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 font-medium">
                Crea promociones estilo Rappi Ads: domicilio gratis, descuentos porcentuales y cupones de lanzamiento.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingPromo(null);
              setFormData(initialFormState);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Icon icon="heroicons:plus-circle" className="text-lg" />
            <span>Nueva Campaña</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Campañas Activas</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
            <span className="text-xs text-neutral-500">en vivo</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Domicilio Gratis</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-sm font-black px-2 py-0.5 rounded-full ${
              promotions.some(p => p.is_active && p.type === 'free_delivery')
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-neutral-100 text-neutral-600'
            }`}>
              {promotions.some(p => p.is_active && p.type === 'free_delivery') ? 'ACTIVO' : 'PAUSADO'}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Banner en Menú</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-sm font-black px-2 py-0.5 rounded-full ${
              promotions.some(p => p.is_active && p.show_banner)
                ? 'bg-blue-100 text-blue-800'
                : 'bg-neutral-100 text-neutral-600'
            }`}>
              {promotions.some(p => p.is_active && p.show_banner) ? 'VISIBLE' : 'OCULTO'}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Histórico</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-neutral-800">{promotions.length}</span>
            <span className="text-xs text-neutral-500">campañas</span>
          </div>
        </div>
      </div>

      {/* 1-Click Launch Templates (Rappi Ads Style) */}
      <div className="bg-gradient-to-br from-amber-50/80 via-emerald-50/40 to-neutral-50 p-5 rounded-2xl border border-amber-200/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="text-sm font-black text-neutral-800 uppercase tracking-wider">
              Plantillas Rápidas (1 Clic)
            </h2>
          </div>
          <span className="text-xs text-neutral-500 hidden sm:inline">Configuración pre-armada lista para encender</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => applyTemplate('free_delivery_opening')}
            className="p-3.5 bg-white hover:bg-emerald-50/60 border border-neutral-200/80 hover:border-emerald-300 rounded-xl text-left transition-all active:scale-95 group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🚚</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Apertura
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-800 group-hover:text-emerald-700 leading-tight">
              Semana Domicilio Gratis
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              $0 COP en envíos toda la semana de lanzamiento.
            </p>
          </button>

          <button
            onClick={() => applyTemplate('ten_percent_store')}
            className="p-3.5 bg-white hover:bg-blue-50/60 border border-neutral-200/80 hover:border-blue-300 rounded-xl text-left transition-all active:scale-95 group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🏷️</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                10% OFF
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-800 group-hover:text-blue-700 leading-tight">
              Toda la Tienda
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Descuento global para incentivar primeros pedidos.
            </p>
          </button>

          <button
            onClick={() => applyTemplate('category_discount')}
            className="p-3.5 bg-white hover:bg-purple-50/60 border border-neutral-200/80 hover:border-purple-300 rounded-xl text-left transition-all active:scale-95 group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🍱</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                Categoría
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-800 group-hover:text-purple-700 leading-tight">
              20% en Categoría
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Rotación rápida de Bentos, Bowls o Rolls.
            </p>
          </button>

          <button
            onClick={() => applyTemplate('social_coupon')}
            className="p-3.5 bg-white hover:bg-amber-50/60 border border-neutral-200/80 hover:border-amber-300 rounded-xl text-left transition-all active:scale-95 group shadow-xs cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🎟️</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Cupón
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-800 group-hover:text-amber-700 leading-tight">
              Cupón Redes (BOKU15)
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Código para compartir en historias de Instagram/TikTok.
            </p>
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Listado de Campañas ({promotions.length})
          </h3>
          <button 
            onClick={fetchPromotions}
            className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" />
            <span>Actualizar</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-400">
            <Icon icon="line-md:loading-loop" className="text-3xl mb-2 text-emerald-600" />
            <p className="text-xs font-medium">Cargando campañas promocionales...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 space-y-3">
            <Icon icon="solar:tag-price-bold" className="text-4xl text-neutral-300" />
            <p className="text-sm font-bold text-neutral-700">No hay campañas configuradas todavía</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Utiliza una plantilla rápida arriba para activar tu primera campaña de Domicilio Gratis o Descuento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {promotions.map((promo) => {
              const status = getPromoStatus(promo);
              return (
                <div key={promo.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 text-xl flex items-center justify-center shrink-0 border border-neutral-200">
                      {promo.type === 'free_delivery' ? '🚚' : promo.code ? '🎟️' : '🏷️'}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-neutral-900 leading-tight">
                          {promo.name}
                        </h4>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                        {promo.code && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            CUPÓN: {promo.code}
                          </span>
                        )}
                      </div>

                      {promo.banner_message && promo.show_banner && (
                        <div 
                          className="text-xs px-2.5 py-1 rounded-lg font-medium inline-block max-w-full truncate shadow-2xs"
                          style={{ backgroundColor: promo.banner_bg_color || '#047857', color: promo.banner_text_color || '#ffffff' }}
                        >
                          {promo.banner_message}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap pt-0.5">
                        <span>
                          <strong>Beneficio:</strong> {promo.type === 'free_delivery' ? 'Domicilio $0 COP' : `${promo.value}% OFF`}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Vigencia:</strong> {promo.end_date ? new Date(promo.end_date).toLocaleDateString('es-CO') : 'Sin vencimiento'}
                        </span>
                        {promo.min_order_amount > 0 && (
                          <>
                            <span>•</span>
                            <span><strong>Mínimo:</strong> {formatCOP(promo.min_order_amount)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Switch */}
                  <div className="flex items-center gap-3 justify-end self-end md:self-center shrink-0">
                    {/* Switch On/Off */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(promo)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        promo.is_active ? 'bg-emerald-600' : 'bg-neutral-300'
                      }`}
                      title={promo.is_active ? 'Desactivar campaña' : 'Activar campaña'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          promo.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleEditPromo(promo)}
                      className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/60 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Icon icon="heroicons:pencil-square" className="text-base" />
                    </button>

                    <button
                      onClick={() => handleDeletePromo(promo.id)}
                      className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Icon icon="heroicons:trash" className="text-base" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Creación / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 flex flex-col">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                <h3 className="text-base sm:text-lg font-black text-neutral-900">
                  {editingPromo ? 'Editar Campaña' : 'Nueva Campaña Promocional'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <Icon icon="heroicons:x-mark" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              {/* Nombre de la campaña */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Nombre de la Campaña *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Semana de Apertura: Domicilio Gratis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Tipo de Campaña */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'free_delivery', target: 'delivery' })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    formData.type === 'free_delivery'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>🚚</span> Domicilio Gratis
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">$0 COP en envíos</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'percentage_discount' })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    formData.type === 'percentage_discount'
                      ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/30'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>%</span> Porcentaje OFF
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Ej: 10%, 15%, 20%</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'fixed_discount' })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    formData.type === 'fixed_discount'
                      ? 'border-purple-500 bg-purple-50/60 ring-1 ring-purple-500/30'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>💲</span> Descuento Fijo
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Monto en pesos (COP)</p>
                </button>
              </div>

              {/* Valor del Descuento (si no es free_delivery) */}
              {formData.type !== 'free_delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      {formData.type === 'percentage_discount' ? 'Porcentaje de Descuento (%)' : 'Valor del Descuento (COP)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={formData.type === 'percentage_discount' ? 100 : 500000}
                      value={formData.value}
                      onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Monto Mínimo de Pedido (COP)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.min_order_amount}
                      onChange={e => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                      placeholder="0 = Sin mínimo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Código de Cupón Opcional */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Código de Cupón (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ej: BOKUAPERTURA (dejar vacío si aplica automáticamente)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold uppercase"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Si no ingresas código, la promoción se aplicará automáticamente a todos los pedidos que califiquen.
                </p>
              </div>

              {/* Vigencia (Fechas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Fecha de Inicio *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Fecha de Finalización</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  />
                </div>
              </div>

              {/* Banner Anuncio en Menú */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-900 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_banner}
                      onChange={e => setFormData({ ...formData, show_banner: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Mostrar Banner Anuncio en la Carta del Cliente</span>
                  </label>
                </div>

                {formData.show_banner && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Mensaje del Banner
                      </label>
                      <input
                        type="text"
                        value={formData.banner_message}
                        onChange={e => setFormData({ ...formData, banner_message: e.target.value })}
                        placeholder="🎉 ¡Semana de Apertura! Domicilio 100% GRATIS en todos tus pedidos"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">Color Fondo</label>
                        <input
                          type="color"
                          value={formData.banner_bg_color}
                          onChange={e => setFormData({ ...formData, banner_bg_color: e.target.value })}
                          className="w-10 h-10 p-0.5 rounded-lg border border-neutral-300 cursor-pointer bg-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">Previsualización</label>
                        <div
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-center truncate shadow-xs"
                          style={{ backgroundColor: formData.banner_bg_color, color: formData.banner_text_color }}
                        >
                          {formData.banner_message || 'Tu anuncio aquí'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones Guardar / Cancelar */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#243326] text-white font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Icon icon="line-md:loading-loop" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar y Aplicar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
