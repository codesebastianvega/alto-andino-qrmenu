import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sparkles, Calendar, Plus, Trash2, Check, 
  Search, Utensils, AlertCircle, RefreshCw, ChefHat, Info
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatCOP } from '../../utils/money';
import { toast } from '../Toast';
import AAImage from '../ui/AAImage';

const DAYS_OF_WEEK = [
  { dayNum: 1, name: 'Lunes', short: 'Lun' },
  { dayNum: 2, name: 'Martes', short: 'Mar' },
  { dayNum: 3, name: 'Miércoles', short: 'Mié' },
  { dayNum: 4, name: 'Jueves', short: 'Jue' },
  { dayNum: 5, name: 'Viernes', short: 'Vie' },
  { dayNum: 6, name: 'Sábado', short: 'Sáb', isWeekend: true },
  { dayNum: 0, name: 'Domingo', short: 'Dom', isWeekend: true },
];

export default function DailySpecialModal({ isOpen, onClose, onSaved }) {
  const { activeBrand } = useAuth();
  
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'weekly' | 'combo'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  
  // Daily Special Concept State
  const [config, setConfig] = useState({
    enabled: true,
    label: 'El Bento del Día',
    promo_price: 19000,
    standard_price: 28000,
    manual_override_product_id: null,
    secondary_product_ids: [],
    custom_prices: {},
    schedule: {
      1: 'b0000b11-0000-4000-a000-000000000001',
      2: 'b0000b12-0000-4000-a000-000000000002',
      3: 'b0000b14-0000-4000-a000-000000000004',
      4: 'b0000b15-0000-4000-a000-000000000005',
      5: null,
      6: null,
      0: null
    },
    secondary_schedule: {},
    soup_name: 'Sopa de apio casera (16 oz)',
    drink_name: 'Limonada Verde Antioxidante (5 oz)'
  });

  // Search states for selectors
  const [primarySearch, setPrimarySearch] = useState('');
  const [secondarySearch, setSecondarySearch] = useState('');
  const [selectedSecondaryAddId, setSelectedSecondaryAddId] = useState('');

  // Day of week today (0 = Sun, 1 = Mon...)
  const todayDayNum = new Date().getDay();

  // Load config & all products (active AND inactive)
  useEffect(() => {
    if (!isOpen || !activeBrand?.id) return;
    
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch ALL products for brand (do not filter out is_active: false!)
        const { data: prods, error: pErr } = await supabase
          .from('products')
          .select('id, name, price, image_url, is_active, category_id, subcategory, categories:categories(name, slug)')
          .eq('brand_id', activeBrand.id)
          .order('name');
        
        if (pErr) throw pErr;
        if (isMounted) setProducts(prods || []);

        // 2. Fetch restaurant_settings brand_concepts safely
        const { data: rsRows, error: rsErr } = await supabase
          .from('restaurant_settings')
          .select('id, brand_id, location_id, brand_concepts')
          .eq('brand_id', activeBrand.id);

        if (rsErr) throw rsErr;

        // Prefer brand-level row (location_id is null) or first available row
        const rsData = (rsRows || []).find(r => !r.location_id && r.brand_concepts?.length > 0)
          || (rsRows || []).find(r => r.brand_concepts?.length > 0)
          || (rsRows || [])[0]
          || null;

        const concepts = Array.isArray(rsData?.brand_concepts) ? rsData.brand_concepts : [];
        const existingConcept = concepts.find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config'));

        if (existingConcept && isMounted) {
          setConfig(prev => ({
            ...prev,
            enabled: existingConcept.enabled !== false,
            label: existingConcept.label || (activeBrand.slug === 'boku-bento' ? 'El Bento del Día' : 'Plato del Día'),
            promo_price: existingConcept.promo_price ?? 19000,
            standard_price: existingConcept.standard_price ?? 28000,
            manual_override_product_id: existingConcept.manual_override_product_id || null,
            secondary_product_ids: Array.isArray(existingConcept.secondary_product_ids) 
              ? existingConcept.secondary_product_ids 
              : [],
            custom_prices: existingConcept.custom_prices || {},
            schedule: existingConcept.schedule || prev.schedule,
            secondary_schedule: existingConcept.secondary_schedule || {},
            soup_name: existingConcept.soup_name || 'Crema de verduras casera (16 oz)',
            drink_name: existingConcept.drink_name || 'Bebida natural de la Casa (5 oz)'
          }));
        }
      } catch (err) {
        console.error('Error loading daily special data:', err);
        toast.error('No se pudo cargar la configuración de almuerzos');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [isOpen, activeBrand?.id, activeBrand?.slug]);

  // Lookup helper for products
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  // Current primary special product
  const primaryProduct = useMemo(() => {
    const targetId = config.manual_override_product_id || config.schedule?.[todayDayNum];
    return targetId ? productMap.get(targetId) : null;
  }, [config.manual_override_product_id, config.schedule, todayDayNum, productMap]);

  // Current secondary special products
  const secondaryProducts = useMemo(() => {
    return (config.secondary_product_ids || [])
      .map(id => productMap.get(id))
      .filter(Boolean);
  }, [config.secondary_product_ids, productMap]);

  // Filtered products for primary selector
  const filteredPrimaryProducts = useMemo(() => {
    const q = primarySearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.categories?.name && p.categories.name.toLowerCase().includes(q))
    );
  }, [products, primarySearch]);

  // Filtered products for secondary selector (exclude primary and already added)
  const availableSecondaryProducts = useMemo(() => {
    const currentPrimaryId = config.manual_override_product_id || config.schedule?.[todayDayNum];
    const excludedIds = new Set([currentPrimaryId, ...(config.secondary_product_ids || [])]);
    const q = secondarySearch.toLowerCase().trim();
    
    return products
      .filter(p => !excludedIds.has(p.id))
      .filter(p => {
        if (!q) return true;
        return p.name.toLowerCase().includes(q) || 
               (p.categories?.name && p.categories.name.toLowerCase().includes(q));
      });
  }, [products, config.manual_override_product_id, config.schedule, todayDayNum, config.secondary_product_ids, secondarySearch]);

  // Handler: Add secondary product
  const handleAddSecondary = (productId) => {
    if (!productId) return;
    const prod = productMap.get(productId);
    const regularPublicPrice = Number(prod?.price) || 0;

    setConfig(prev => ({
      ...prev,
      secondary_product_ids: Array.from(new Set([...(prev.secondary_product_ids || []), productId])),
      custom_prices: {
        ...(prev.custom_prices || {}),
        [productId]: prev.custom_prices?.[productId] || {
          promo_price: regularPublicPrice,
          standard_price: regularPublicPrice
        }
      }
    }));
    setSelectedSecondaryAddId('');
    toast.success('Plato añadido a las opciones de almuerzo de hoy');
  };

  // Handler: Remove secondary product
  const handleRemoveSecondary = (productId) => {
    setConfig(prev => {
      const nextSecondary = (prev.secondary_product_ids || []).filter(id => id !== productId);
      const nextCustom = { ...(prev.custom_prices || {}) };
      delete nextCustom[productId];
      return {
        ...prev,
        secondary_product_ids: nextSecondary,
        custom_prices: nextCustom
      };
    });
  };

  // Handler: Save & Publish
  const handleSave = async () => {
    if (!activeBrand?.id) return;
    setSaving(true);
    try {
      // 1. Fetch current settings rows for this brand
      const { data: rsRows, error: fetchErr } = await supabase
        .from('restaurant_settings')
        .select('id, brand_id, location_id, brand_concepts')
        .eq('brand_id', activeBrand.id);

      if (fetchErr) throw fetchErr;

      const primaryRow = (rsRows || []).find(r => !r.location_id) || (rsRows || [])[0] || null;
      const existingConcepts = Array.isArray(primaryRow?.brand_concepts) ? primaryRow.brand_concepts : [];
      const filteredConcepts = existingConcepts.filter(c => c && c.id !== 'bento_del_dia_config' && c.id !== 'daily_special_config');

      const bentoConceptToSave = {
        id: 'bento_del_dia_config',
        label: config.label?.trim() || (activeBrand?.slug === 'boku-bento' ? 'El Bento del Día' : 'Plato del Día'),
        enabled: Boolean(config.enabled),
        promo_price: Number(config.promo_price) || 19000,
        standard_price: Number(config.standard_price) || 28000,
        manual_override_product_id: config.manual_override_product_id || null,
        secondary_product_ids: config.secondary_product_ids || [],
        custom_prices: config.custom_prices || {},
        schedule: config.schedule || {},
        secondary_schedule: config.secondary_schedule || {},
        soup_name: config.soup_name?.trim() || 'Crema de verduras casera (16 oz)',
        drink_name: config.drink_name?.trim() || 'Bebida natural de la Casa (5 oz)',
        updated_at: new Date().toISOString()
      };

      const updatedConcepts = [...filteredConcepts, bentoConceptToSave];

      if (rsRows && rsRows.length > 0) {
        // Update all settings rows for this brand to synchronize them without conflicts
        await Promise.all(
          rsRows.map(row => {
            const rowConcepts = Array.isArray(row.brand_concepts) ? row.brand_concepts : [];
            const rowFiltered = rowConcepts.filter(c => c && c.id !== 'bento_del_dia_config' && c.id !== 'daily_special_config');
            return supabase
              .from('restaurant_settings')
              .update({
                brand_concepts: [...rowFiltered, bentoConceptToSave],
                updated_at: new Date().toISOString()
              })
              .eq('id', row.id);
          })
        );
      } else {
        const { error: insErr } = await supabase
          .from('restaurant_settings')
          .insert({
            brand_id: activeBrand.id,
            brand_concepts: updatedConcepts
          });
        if (insErr) throw insErr;
      }

      // Also update home_settings hero banner if primary dish is selected
      try {
        const selectedPrimaryId = config.manual_override_product_id || config.schedule?.[todayDayNum];
        const selectedProd = selectedPrimaryId ? productMap.get(selectedPrimaryId) : null;
        if (selectedProd) {
          const starPromoPrice = config.custom_prices?.[selectedProd.id]?.promo_price ?? (Number(config.promo_price) || 19000);
          await supabase
            .from('home_settings')
            .update({
              hero_h1: `🍱 Bento del Día: ${selectedProd.name.replace(/\s*\(Especial del Día\)/i, '')} ($${Number(starPromoPrice).toLocaleString('es-CO')})`,
              hero_subtitle: `${selectedProd.description ? selectedProd.description.slice(0, 160) + '...' : ''} 🥣 Incluye ${config.soup_name || 'Crema'} + 🥤 ${config.drink_name || 'Jugo'}.`,
              updated_at: new Date().toISOString()
            })
            .eq('brand_id', activeBrand.id);
        }
      } catch (homeHeroErr) {
        console.warn('Non-blocking error updating home hero banner:', homeHeroErr);
      }

      toast.success('¡Almuerzos de Hoy y Menú del Día publicados con éxito!');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving daily special:', err);
      toast.error('Error al guardar la configuración: ' + (err.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const savingsAmount = Math.max(0, (config.standard_price || 0) - (config.promo_price || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🍱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Almuerzos & Menú del Día
                </h2>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  config.enabled ? 'bg-emerald-400 text-emerald-950 shadow-xs' : 'bg-neutral-800/60 text-white'
                }`}>
                  {config.enabled ? 'Activo en Carta' : 'Pausado'}
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                Control táctico en 15 segundos: plato estrella, platos prestados de otras categorías y combo incluido.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-neutral-200 px-4 sm:px-6 bg-neutral-50/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'border-amber-600 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles size={16} className={activeTab === 'today' ? 'text-amber-600' : 'text-neutral-400'} />
            <span>⚡ Almuerzo de Hoy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'weekly'
                ? 'border-amber-600 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Calendar size={16} className={activeTab === 'weekly' ? 'text-amber-600' : 'text-neutral-400'} />
            <span>📅 Programación Semanal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('combo')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'combo'
                ? 'border-amber-600 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Utensils size={16} className={activeTab === 'combo' ? 'text-amber-600' : 'text-neutral-400'} />
            <span>🥣 Combo & Precios</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <RefreshCw className="animate-spin text-amber-500" size={28} />
              <p className="text-sm font-medium">Cargando catálogo y configuración...</p>
            </div>
          ) : activeTab === 'today' ? (
            /* ═══════════════════════════════════════
               TAB 1: ALMUERZO DE HOY (RÁPIDO)
               ═══════════════════════════════════════ */
            <div className="space-y-6">
              {/* Quick Status Bar */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">
                      Almuerzos en Servicio Hoy: {DAYS_OF_WEEK.find(d => d.dayNum === todayDayNum)?.name}
                    </h3>
                    <p className="text-xs text-neutral-600">
                      {primaryProduct 
                        ? `Estrella: ${primaryProduct.name} + ${secondaryProducts.length} opción(es) adicional(es)` 
                        : 'No has seleccionado un plato estrella para hoy.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-600">Estado del servicio:</span>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      config.enabled ? 'bg-amber-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        config.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Grid 2 Columns: Plato Estrella (Hero) vs Más Opciones (Derecha) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ── COL 1: PLATO ESTRELLA DE HOY (Hero Izquierda) ── */}
                <div className="lg:col-span-6 bg-neutral-50/80 rounded-2xl p-4 sm:p-5 border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-neutral-900 tracking-tight">
                          1. Plato Estrella de Hoy (Hero Izquierda)
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          La tarjeta grande destacada en la portada del menú.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Selected Card Preview */}
                  {primaryProduct ? (
                    <div className="bg-white rounded-xl p-3.5 border border-amber-300/80 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                          {primaryProduct.image_url ? (
                            <img src={primaryProduct.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                              {primaryProduct.categories?.name || 'Plato'}
                            </span>
                            {!primaryProduct.is_active && (
                              <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                                ⏸️ Pausado en carta regular
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-bold text-neutral-900 truncate mt-0.5">
                            {primaryProduct.name}
                          </h5>
                          <p className="text-[10px] text-neutral-400">
                            Carta regular: {formatCOP(primaryProduct.price)}
                          </p>
                        </div>
                      </div>

                      {/* Configuración de Precio para el Plato Estrella */}
                      {(() => {
                        // El precio tachado hereda fielmente el precio del menú público de este plato
                        const regularMenuPrice = Number(primaryProduct.price) || 0;
                        const customVal = config.custom_prices?.[primaryProduct.id] || {};
                        const currentPromo = customVal.promo_price ?? (Number(config.promo_price) || 19000);
                        const currentStandard = customVal.standard_price ?? regularMenuPrice;

                        return (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-100 bg-amber-50/50 p-2 rounded-lg">
                            <div>
                              <label className="text-[9px] font-black uppercase text-amber-950 block mb-0.5">
                                Precio Almuerzo (COP)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  value={currentPromo}
                                  onChange={e => {
                                    const val = Number(e.target.value) || 0;
                                    setConfig(prev => ({
                                      ...prev,
                                      promo_price: val,
                                      custom_prices: {
                                        ...(prev.custom_prices || {}),
                                        [primaryProduct.id]: {
                                          ...(prev.custom_prices?.[primaryProduct.id] || {}),
                                          promo_price: val,
                                          standard_price: currentStandard
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full pl-6 pr-2 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-black text-amber-900 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-neutral-500 block mb-0.5">
                                Tachado Regular (COP)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  value={currentStandard}
                                  onChange={e => {
                                    const val = Number(e.target.value) || 0;
                                    setConfig(prev => ({
                                      ...prev,
                                      standard_price: val,
                                      custom_prices: {
                                        ...(prev.custom_prices || {}),
                                        [primaryProduct.id]: {
                                          ...(prev.custom_prices?.[primaryProduct.id] || {}),
                                          promo_price: currentPromo,
                                          standard_price: val
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full pl-6 pr-2 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-500 line-through focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-neutral-300 text-center text-xs text-neutral-400">
                      Ningún plato estrella asignado. Selecciona uno abajo.
                    </div>
                  )}

                  {/* Change/Select Dish Searchable Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                      Cambiar Plato Estrella de Hoy:
                    </label>
                    <select
                      value={config.manual_override_product_id || ''}
                      onChange={e => {
                        const val = e.target.value || null;
                        setConfig(prev => ({ ...prev, manual_override_product_id: val }));
                      }}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    >
                      <option value="">⚙️ Automático (según calendario semanal de hoy)</option>
                      {filteredPrimaryProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.categories?.name ? `[${p.categories.name}] ` : ''}{p.name} {!p.is_active ? '⏸️ (Pausado)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                      <Info size={12} className="text-amber-600 shrink-0" />
                      <span>
                        Puedes escoger cualquier plato (incluso si está oculto en la carta regular). El sistema lo activará para el almuerzo.
                      </span>
                    </p>
                  </div>
                </div>

                {/* ── COL 2: MÁS OPCIONES DEL DÍA (Derecha - Platos Prestados) ── */}
                <div className="lg:col-span-6 bg-neutral-50/80 rounded-2xl p-4 sm:p-5 border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🍝</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-neutral-900 tracking-tight">
                          2. Más Opciones del Día (Platos Prestados)
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          Platos de cualquier sección (Pastas, Bowls, etc.) ofrecidos en combo de almuerzo.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {secondaryProducts.length} activa(s)
                    </span>
                  </div>

                  {/* List of currently selected secondary options */}
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {secondaryProducts.map(p => {
                      // El precio tachado hereda fielmente el precio del menú público de cada plato
                      const regularMenuPrice = Number(p.price) || 0;
                      const customVal = config.custom_prices?.[p.id] || {};
                      const currentPromo = customVal.promo_price ?? regularMenuPrice;
                      const currentStandard = customVal.standard_price ?? regularMenuPrice;

                      return (
                        <div 
                          key={p.id}
                          className="bg-white rounded-xl p-3 border border-neutral-200 shadow-2xs space-y-2 group hover:border-amber-300 transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm">🍽️</div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-900 truncate">{p.name}</p>
                                <p className="text-[10px] text-neutral-500">
                                  Sección: <span className="font-semibold text-neutral-700">{p.categories?.name || 'Catálogo'}</span> (Carta: {formatCOP(p.price)})
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSecondary(p.id)}
                              className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                              title="Quitar de las opciones de almuerzo de hoy"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Inputs de Precio Individual para este plato */}
                          <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2 rounded-lg border border-neutral-200/70">
                            <div>
                              <label className="text-[9px] font-black uppercase text-amber-900 block mb-0.5">
                                Precio Almuerzo (COP)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px]">$</span>
                                <input
                                  type="number"
                                  value={currentPromo}
                                  onChange={e => {
                                    const val = Number(e.target.value) || 0;
                                    setConfig(prev => ({
                                      ...prev,
                                      custom_prices: {
                                        ...(prev.custom_prices || {}),
                                        [p.id]: {
                                          ...(prev.custom_prices?.[p.id] || {}),
                                          promo_price: val,
                                          standard_price: currentStandard
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full pl-5 pr-1.5 py-1 bg-white border border-neutral-300 rounded text-xs font-black text-amber-900 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-neutral-500 block mb-0.5">
                                Tachado Regular (COP)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px]">$</span>
                                <input
                                  type="number"
                                  value={currentStandard}
                                  onChange={e => {
                                    const val = Number(e.target.value) || 0;
                                    setConfig(prev => ({
                                      ...prev,
                                      custom_prices: {
                                        ...(prev.custom_prices || {}),
                                        [p.id]: {
                                          ...(prev.custom_prices?.[p.id] || {}),
                                          promo_price: currentPromo,
                                          standard_price: val
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full pl-5 pr-1.5 py-1 bg-white border border-neutral-300 rounded text-xs font-bold text-neutral-500 line-through focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {secondaryProducts.length === 0 && (
                      <div className="p-4 rounded-xl border border-dashed border-neutral-300 text-center text-xs text-neutral-400">
                        No hay platos adicionales hoy. El menú solo mostrará el plato estrella.
                      </div>
                    )}
                  </div>

                  {/* Add New Secondary Option Dropdown */}
                  <div className="pt-2 border-t border-neutral-200/80 space-y-2">
                    <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                      + Prestar un plato para el almuerzo de hoy:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedSecondaryAddId}
                        onChange={e => setSelectedSecondaryAddId(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer truncate"
                      >
                        <option value="">Selecciona un plato de la carta...</option>
                        {availableSecondaryProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.categories?.name ? `[${p.categories.name}] ` : ''}{p.name} ({formatCOP(p.price)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddSecondary(selectedSecondaryAddId)}
                        disabled={!selectedSecondaryAddId}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Añadir</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Ejemplo: Si seleccionas <strong>Pasta Alfredo</strong>, aparecerá en el almuerzo a {formatCOP(config.promo_price)} con sopa y jugo, y a la vez seguirá disponible en su categoría Pastas al precio normal.
                    </p>
                  </div>
                </div>

              </div>

              {/* Combo Summary Footer Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-amber-700 flex items-center justify-center font-black shadow-xs shrink-0">
                    💰
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                      Resumen del Combo de Almuerzo
                    </h5>
                    <p className="text-xs text-amber-900 mt-0.5">
                      Precio de Almuerzo: <strong>{formatCOP(config.promo_price)}</strong> (Antes: {formatCOP(config.standard_price)}) • {savingsAmount > 0 ? `Ahorras ${formatCOP(savingsAmount)}` : 'Precio Neto'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('combo')}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0"
                >
                  Modificar precios y acompañamientos ➔
                </button>
              </div>
            </div>
          ) : activeTab === 'weekly' ? (
            /* ═══════════════════════════════════════
               TAB 2: PROGRAMACIÓN SEMANAL AUTOMÁTICA
               ═══════════════════════════════════════ */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                <Calendar className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-neutral-600">
                  <p className="font-bold text-neutral-900 mb-0.5">
                    ¿Cómo funciona la rotación automática?
                  </p>
                  <p>
                    A la medianoche, el menú digital cambia automáticamente el plato estrella según este calendario.
                    Si dejas un día en "(Sin promoción)", no se mostrará plato del día ese día a menos que actives uno manual.
                    <strong> Puedes seleccionar platos aunque estén inactivos o pausados en el catálogo general.</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DAYS_OF_WEEK.map(day => {
                  const isToday = day.dayNum === todayDayNum;
                  const currentSelectedId = config.schedule?.[day.dayNum] || '';

                  return (
                    <div
                      key={day.dayNum}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isToday
                          ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                          : 'bg-white border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-neutral-900">{day.name}</span>
                          {day.isWeekend && (
                            <span className="text-[9px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                              Finde
                            </span>
                          )}
                        </div>
                        {isToday && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-full">
                            HOY 🔥
                          </span>
                        )}
                      </div>

                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Plato Estrella:
                      </label>
                      <select
                        value={currentSelectedId}
                        onChange={e => {
                          const val = e.target.value || null;
                          setConfig(prev => ({
                            ...prev,
                            schedule: {
                              ...prev.schedule,
                              [day.dayNum]: val
                            }
                          }));
                        }}
                        className={`w-full text-xs font-semibold rounded-xl border py-2 px-2.5 transition-all bg-white cursor-pointer ${
                          currentSelectedId ? 'border-amber-300 text-neutral-900' : 'border-neutral-200 text-neutral-400'
                        }`}
                      >
                        <option value="">(Sin plato del día)</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.categories?.name ? `[${p.categories.name}] ` : ''}{p.name} {!p.is_active ? '⏸️ (Pausado)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════
               TAB 3: COMBO, PRECIOS & ACOMPAÑAMIENTOS
               ═══════════════════════════════════════ */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Commercial Label */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                    🏷️ Nombre / Etiqueta Comercial
                  </label>
                  <input
                    type="text"
                    value={config.label || ''}
                    onChange={e => setConfig(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="Ej: El Bento del Día, Menú del Día"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Aparece en el badge de la carta y en la ventana de detalle del plato.
                  </p>
                </div>

                {/* Promo Price */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                    🔥 Precio Promo "Bento del Día" (COP)
                  </label>
                  <input
                    type="number"
                    value={config.promo_price || 0}
                    onChange={e => setConfig(prev => ({ ...prev, promo_price: Number(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="19000"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Precio exclusivo con descuento aplicado únicamente al plato estrella como Bento del Día.
                  </p>
                </div>

                {/* Standard Price */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                    🏷️ Precio Tachado de Referencia General (COP)
                  </label>
                  <input
                    type="number"
                    value={config.standard_price || 0}
                    onChange={e => setConfig(prev => ({ ...prev, standard_price: Number(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="22000"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Por defecto, cada plato hereda automáticamente su precio real del menú público.
                  </p>
                </div>

                {/* Soup Option Name */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                    🥣 Nombre de la Entrada de Hoy
                  </label>
                  <input
                    type="text"
                    value={config.soup_name || ''}
                    onChange={e => setConfig(prev => ({ ...prev, soup_name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="Ej: Crema de verduras casera (16 oz)"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Opción predeterminada en el grupo de Entrada Incluida.
                  </p>
                </div>

                {/* Drink Option Name */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                    🥤 Nombre de la Bebida de Hoy
                  </label>
                  <input
                    type="text"
                    value={config.drink_name || ''}
                    onChange={e => setConfig(prev => ({ ...prev, drink_name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="Ej: Bebida natural de la Casa (5 oz)"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Opción predeterminada en el grupo de Bebida Incluida.
                  </p>
                </div>
              </div>

              {/* Sección de Precios Específicos por Plato Activo Hoy */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>Precios Específicos por Plato en Almuerzo de Hoy</span>
                    </h4>
                    <p className="text-[11px] text-amber-900/80 font-medium">
                      Configura el precio combo individual de cada plato activo hoy (Bentos a $19.000, Pokes a $22.000, o cualquier valor personalizado).
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Fila para Plato Estrella */}
                  {primaryProduct && (() => {
                    const regularMenuPrice = Number(primaryProduct.price) || 0;
                    const customVal = config.custom_prices?.[primaryProduct.id] || {};
                    const currentPromo = customVal.promo_price ?? (Number(config.promo_price) || 19000);
                    const currentStandard = customVal.standard_price ?? regularMenuPrice;

                    return (
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm">⭐</span>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-neutral-900 truncate">
                              {primaryProduct.name} <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded ml-1">Estrella</span>
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              Sección: {primaryProduct.categories?.name || 'Bentos'} • Regular en carta: {formatCOP(primaryProduct.price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div>
                            <span className="text-[9px] font-bold text-neutral-500 uppercase block">Precio Combo:</span>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px]">$</span>
                              <input
                                type="number"
                                value={currentPromo}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  setConfig(prev => ({
                                    ...prev,
                                    promo_price: val,
                                    custom_prices: {
                                      ...(prev.custom_prices || {}),
                                      [primaryProduct.id]: {
                                        ...(prev.custom_prices?.[primaryProduct.id] || {}),
                                        promo_price: val,
                                        standard_price: currentStandard
                                      }
                                    }
                                  }));
                                }}
                                className="w-28 pl-5 pr-1.5 py-1 bg-white border border-neutral-300 rounded text-xs font-black text-amber-900 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-neutral-500 uppercase block">Tachado:</span>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px]">$</span>
                              <input
                                type="number"
                                value={currentStandard}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  setConfig(prev => ({
                                    ...prev,
                                    standard_price: val,
                                    custom_prices: {
                                      ...(prev.custom_prices || {}),
                                      [primaryProduct.id]: {
                                        ...(prev.custom_prices?.[primaryProduct.id] || {}),
                                        promo_price: currentPromo,
                                        standard_price: val
                                      }
                                    }
                                  }));
                                }}
                                className="w-28 pl-5 pr-1.5 py-1 bg-white border border-neutral-300 rounded text-xs font-bold text-neutral-500 line-through focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Filas para Platos Prestados / Secundarios */}
                  {secondaryProducts.map(p => {
                    const regularMenuPrice = Number(p.price) || 0;
                    const customVal = config.custom_prices?.[p.id] || {};
                    const currentPromo = customVal.promo_price ?? regularMenuPrice;
                    const currentStandard = customVal.standard_price ?? regularMenuPrice;

                    return (
                      <div key={p.id} className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm">🍝</span>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-neutral-900 truncate">
                              {p.name} <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded ml-1">Opción</span>
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              Sección: {p.categories?.name || 'Catálogo'} • Regular en carta: {formatCOP(p.price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div>
                            <span className="text-[9px] font-bold text-neutral-500 uppercase block">Precio Combo:</span>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px]">$</span>
                              <input
                                type="number"
                                value={currentPromo}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  setConfig(prev => ({
                                    ...prev,
                                    custom_prices: {
                                      ...(prev.custom_prices || {}),
                                      [p.id]: {
                                        ...(prev.custom_prices?.[p.id] || {}),
                                        promo_price: val,
                                        standard_price: currentStandard
                                      }
                                    }
                                  }));
                                }}
                                className="w-28 pl-5 pr-1.5 py-1 bg-white border border-neutral-300 rounded text-xs font-black text-amber-900 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-neutral-500 uppercase block">Tachado:</span>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px]">$</span>
                              <input
                                type="number"
                                value={currentStandard}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  setConfig(prev => ({
                                    ...prev,
                                    custom_prices: {
                                      ...(prev.custom_prices || {}),
                                      [p.id]: {
                                        ...(prev.custom_prices?.[p.id] || {}),
                                        promo_price: currentPromo,
                                        standard_price: val
                                      }
                                    }
                                  }));
                                }}
                                className="w-28 pl-5 pr-1.5 py-1 bg-white border border-neutral-300 rounded text-xs font-bold text-neutral-500 line-through focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {secondaryProducts.length === 0 && !primaryProduct && (
                    <div className="p-3 text-center text-xs text-neutral-400">
                      No hay platos configurados para el almuerzo de hoy.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <input
              type="checkbox"
              id="enableSpecialCheck"
              checked={config.enabled}
              onChange={e => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="enableSpecialCheck" className="text-xs font-bold text-neutral-700 cursor-pointer">
              Activar especial del día en el menú digital
            </label>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Guardar y Publicar en Carta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
