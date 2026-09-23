import React, { useState, useEffect } from 'react';
import AdminStaff from './AdminStaff';
import AdminSedes from './AdminSedes';
import AdminPaymentMethods from './AdminPaymentMethods';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../context/LocationContext';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';
import { BUSINESS_TYPES, getFulfillmentModes } from '../constants/businessTypes';
import { sendTestTelegramNotification, detectTelegramChatId } from '../utils/telegramNotify';
import { motion, AnimatePresence } from 'framer-motion';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminSettings() {
  const { isFeatureLocked, activePlan, activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocations();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ 
    whatsapp_number_orders: '',
    telegram_enabled: false,
    telegram_chat_id: '',
    telegram_bot_token: '',
    is_service_fee_enabled: false,
    service_fee_percentage: 10,
    pay_before_service: false,
    payment_requirement_stage: 'none',
    target_prep_time_mins: 15,
    inactivity_threshold_mins: 30,
    hide_sales_from_staff: false,
    kitchen_print_enabled: false,
    receipt_print_enabled: true,
    thermal_paper_width: '80',
    electronic_invoicing_status: 'coming_soon',
    business_type: 'restaurant',
    allow_delivery: true,
    allow_takeaway: true,
    allow_dine_in: true,
    allow_scheduled: true,
  });
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isDetectingChatId, setIsDetectingChatId] = useState(false);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  const [hours, setHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [isSubmittingHours, setIsSubmittingHours] = useState(false);

  useEffect(() => {
    if (activeBrand?.id) {
      fetchSettings();
      fetchHours();
    }
  }, [activeBrand?.id, activeLocationId, isAllLocations]);

  const fetchSettings = async () => {
    if (!activeBrand?.id) return;
    setLoadingSettings(true);
    try {
      let query = supabase
        .from('restaurant_settings')
        .select('*')
        .eq('brand_id', activeBrand.id);

      if (!isAllLocations && activeLocationId) {
        query = query.eq('location_id', activeLocationId);
      } else {
        query = query.is('location_id', null);
      }

      let { data, error } = await query.limit(1).maybeSingle();
      
      // Fallback: If no location-specific settings row is found, check for brand-level settings (location_id IS NULL)
      if (!data && !isAllLocations && activeLocationId) {
        const fallbackRes = await supabase
          .from('restaurant_settings')
          .select('*')
          .eq('brand_id', activeBrand.id)
          .is('location_id', null)
          .limit(1)
          .maybeSingle();
        if (fallbackRes.data) {
          data = fallbackRes.data;
        }
      }
      
      if (data) {
        setSettings(data);
        const modes = getFulfillmentModes(data);
        const telegramConcept = Array.isArray(data?.brand_concepts)
          ? data.brand_concepts.find(c => c && c.id === 'telegram_dispatch')
          : null;

        setSettingsForm({
          whatsapp_number_orders: data.whatsapp_number_orders || '',
          telegram_enabled: telegramConcept ? (telegramConcept.enabled ?? true) : Boolean(data.telegram_chat_id),
          telegram_chat_id: telegramConcept?.chat_id || data.telegram_chat_id || '',
          telegram_bot_token: telegramConcept?.bot_token || data.telegram_bot_token || '',
          is_service_fee_enabled: data.is_service_fee_enabled ?? false,
          service_fee_percentage: data.service_fee_percentage ?? 10,
          pay_before_service: data.pay_before_service ?? false,
          payment_requirement_stage: data.payment_requirement_stage || 'none',
          target_prep_time_mins: data.target_prep_time_mins ?? 15,
          inactivity_threshold_mins: data.inactivity_threshold_mins ?? 30,
          hide_sales_from_staff: data.hide_sales_from_staff ?? false,
          kitchen_print_enabled: data.kitchen_print_enabled ?? false,
          receipt_print_enabled: data.receipt_print_enabled ?? true,
          thermal_paper_width: data.thermal_paper_width === '58' ? '50' : (data.thermal_paper_width || '80'),
          electronic_invoicing_status: data.electronic_invoicing_status || 'coming_soon',
          business_type: modes.business_type,
          allow_delivery: modes.delivery,
          allow_takeaway: modes.takeaway,
          allow_dine_in: modes.dine_in,
          allow_scheduled: modes.scheduled,
        });
      } else {
        setSettings(null);
        setSettingsForm({
          whatsapp_number_orders: '',
          telegram_enabled: false,
          telegram_chat_id: '',
          telegram_bot_token: '',
          is_service_fee_enabled: false,
          service_fee_percentage: 10,
          pay_before_service: false,
          payment_requirement_stage: 'none',
          target_prep_time_mins: 15,
          inactivity_threshold_mins: 30,
          hide_sales_from_staff: false,
          kitchen_print_enabled: false,
          receipt_print_enabled: true,
          thermal_paper_width: '80',
          electronic_invoicing_status: 'coming_soon',
          business_type: 'restaurant',
          allow_delivery: true,
          allow_takeaway: true,
          allow_dine_in: true,
          allow_scheduled: true,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar configuración');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchHours = async () => {
    if (!activeBrand?.id) return;
    setLoadingHours(true);
    try {
      let query = supabase
        .from('business_hours')
        .select('*')
        .eq('brand_id', activeBrand.id);

      if (!isAllLocations && activeLocationId) {
        query = query.eq('location_id', activeLocationId);
      } else {
        query = query.is('location_id', null);
      }

      const { data, error } = await query.order('day_of_week', { ascending: true });
      if (error) throw error;
      
      let loadedHours = data || [];
      if (loadedHours.length === 0) {
        loadedHours = Array.from({ length: 7 }, (_, i) => ({
          day_of_week: i,
          open_time: '08:00',
          close_time: '22:00',
          is_closed: false
        }));
      }
      setHours(loadedHours);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar horarios');
    } finally {
      setLoadingHours(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setIsSubmittingSettings(true);
    try {
      const currentConcepts = Array.isArray(settings?.brand_concepts)
        ? settings.brand_concepts.filter(c => c && c.id !== 'operations_model' && c.id !== 'telegram_dispatch')
        : [];
      
      const operationsModel = {
        id: 'operations_model',
        business_type: settingsForm.business_type,
        fulfillment_modes: {
          business_type: settingsForm.business_type,
          allow_delivery: settingsForm.allow_delivery,
          allow_takeaway: settingsForm.allow_takeaway,
          allow_dine_in: settingsForm.allow_dine_in,
          allow_scheduled: settingsForm.allow_scheduled,
        }
      };

      const telegramDispatch = {
        id: 'telegram_dispatch',
        enabled: Boolean(settingsForm.telegram_enabled),
        chat_id: settingsForm.telegram_chat_id ? String(settingsForm.telegram_chat_id).trim() : '',
        bot_token: settingsForm.telegram_bot_token ? String(settingsForm.telegram_bot_token).trim() : null
      };

      const payload = {
        brand_id: activeBrand.id,
        ...(!isAllLocations && activeLocationId ? { location_id: activeLocationId } : { location_id: null }),
        whatsapp_number_orders: settingsForm.whatsapp_number_orders,
        is_service_fee_enabled: settingsForm.is_service_fee_enabled,
        service_fee_percentage: settingsForm.service_fee_percentage,
        pay_before_service: settingsForm.payment_requirement_stage === 'pre_delivery',
        payment_requirement_stage: settingsForm.payment_requirement_stage,
        target_prep_time_mins: settingsForm.target_prep_time_mins,
        inactivity_threshold_mins: settingsForm.inactivity_threshold_mins,
        hide_sales_from_staff: settingsForm.hide_sales_from_staff,
        kitchen_print_enabled: settingsForm.kitchen_print_enabled,
        receipt_print_enabled: settingsForm.receipt_print_enabled,
        thermal_paper_width: settingsForm.thermal_paper_width,
        electronic_invoicing_status: settingsForm.electronic_invoicing_status,
        brand_concepts: [operationsModel, telegramDispatch, ...currentConcepts],
        updated_at: new Date().toISOString()
      };

      let error;
      if (settings?.id) {
        const { error: updateErr } = await supabase
          .from('restaurant_settings')
          .update(payload)
          .eq('id', settings.id);
        error = updateErr;
      } else {
        const { data: upsertData, error: upsertErr } = await supabase
          .from('restaurant_settings')
          .upsert(payload, { onConflict: 'brand_id' })
          .select()
          .single();
        error = upsertErr;
        if (upsertData) setSettings(upsertData);
      }

      if (error) throw error;
      
      // Also update locations table so DB location record matches
      if (settingsForm.whatsapp_number_orders) {
        if (!isAllLocations && activeLocationId) {
          await supabase.from('locations').update({ phone: settingsForm.whatsapp_number_orders, whatsapp: settingsForm.whatsapp_number_orders }).eq('id', activeLocationId);
        } else if (activeBrand?.id) {
          await supabase.from('locations').update({ phone: settingsForm.whatsapp_number_orders, whatsapp: settingsForm.whatsapp_number_orders }).eq('brand_id', activeBrand.id);
        }
      }

      toast.success('Configuración guardada correctamente');
      await fetchSettings();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando configuración');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!settingsForm.telegram_bot_token && !import.meta.env.VITE_TELEGRAM_BOT_TOKEN) {
      toast.error('Por favor ingresa primero el Token de tu Bot de Telegram (de @BotFather).');
      return;
    }
    if (!settingsForm.telegram_chat_id) {
      toast.error('Por favor ingresa primero el ID de Chat o Grupo de Telegram.');
      return;
    }
    setIsTestingTelegram(true);
    try {
      const res = await sendTestTelegramNotification({
        chatId: settingsForm.telegram_chat_id,
        brandName: activeBrand?.name || 'Tu Restaurante',
        botToken: settingsForm.telegram_bot_token || undefined
      });
      if (res.success) {
        toast.success('¡Comanda de prueba enviada con éxito a Telegram! Revisa tu chat.');
      } else {
        toast.error(`Error de Telegram: ${res.error || 'Verifica el ID y que el bot esté en el grupo.'}`);
      }
    } catch (err) {
      toast.error(`Error inesperado: ${err.message}`);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleDetectChatId = async () => {
    if (!settingsForm.telegram_bot_token) {
      toast.error('Por favor ingresa primero el Token de tu Bot de Telegram.');
      return;
    }
    setIsDetectingChatId(true);
    try {
      const res = await detectTelegramChatId(settingsForm.telegram_bot_token);
      if (res.success) {
        setSettingsForm(prev => ({
          ...prev,
          telegram_chat_id: res.chatId,
          telegram_enabled: true
        }));
        toast.success(`¡Grupo detectado con éxito! "${res.chatTitle}" (${res.chatId})`);
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err.message || 'Error al detectar el grupo.');
    } finally {
      setIsDetectingChatId(false);
    }
  };

  const handleUpdateHour = (index, field, value) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  const handleSaveHours = async () => {
    setIsSubmittingHours(true);
    try {
      const toUpdate = [];
      const toInsert = [];

      hours.forEach(h => {
        const payload = {
          brand_id: activeBrand.id,
          ...(!isAllLocations && activeLocationId ? { location_id: activeLocationId } : { location_id: null }),
          day_of_week: h.day_of_week,
          open_time: h.open_time,
          close_time: h.close_time,
          is_closed: h.is_closed,
          updated_at: new Date().toISOString()
        };
        if (h.id) {
          toUpdate.push({ ...payload, id: h.id });
        } else {
          toInsert.push(payload);
        }
      });

      if (toInsert.length > 0) {
        const { error } = await supabase.from('business_hours').insert(toInsert);
        if (error) throw error;
      }
      if (toUpdate.length > 0) {
        const { error } = await supabase.from('business_hours').upsert(toUpdate, { onConflict: 'id' });
        if (error) throw error;
      }

      toast.success('Horarios actualizados');
      await fetchHours();
      if (refetchMenuData) refetchMenuData();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando horarios');
    } finally {
      setIsSubmittingHours(false);
    }
  };

  const getDayName = (day) => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day];

  const TABS = [
    { id: 'general', label: 'Operación', icon: 'solar:settings-minimalistic-linear' },
    { id: 'sedes', label: 'Sedes y Locales', icon: 'solar:shop-2-linear', feature: 'multi_location' },
    { id: 'staff', label: 'Personal / Staff', icon: 'solar:users-group-rounded-linear', feature: 'staff' },
    { id: 'payments', label: 'Medios de Pago', icon: 'solar:card-2-linear' },
  ];

  if (loadingSettings || loadingHours) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-gray-900 selection:bg-indigo-100 italic-none">
      <div className="p-4 sm:p-10 max-w-[1600px] mx-auto space-y-12">
        
        {/* ── Global Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fadeUp">
          <PageHeader
            badge="Panel de Control"
            title="Ajustes de Sistema"
            subtitle="Configura la inteligencia operativa, sedes y el equipo de tu marca."
          />
          
          <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl p-2 rounded-2xl border border-white/80 shadow-sm self-start md:self-auto">
             <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                   <Icon icon="solar:rocket-2-linear" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tu Plan Actual</p>
                  <p className="text-[12px] font-black text-gray-900 uppercase italic">{activePlan?.name || 'Cargando...'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* ── Floating Tab Navigation (Vision OS Style) */}
        <div className="relative z-10 animate-fadeUp w-full" style={{ animationDelay: '100ms' }}>
          <div className="overflow-x-auto no-scrollbar pb-2 -mb-2 w-full">
            <div className="flex w-max mx-auto bg-white/80 backdrop-blur-2xl p-1.5 rounded-[2rem] border border-white/60 shadow-xl shadow-gray-200/30 gap-1 glass-glow">
              {TABS.map((tab) => {
                const isLocked = tab.feature && isFeatureLocked(tab.feature);
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.5rem] text-[13px] font-black transition-all relative group overflow-hidden ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-xl shadow-gray-300'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon icon={tab.icon} className={`text-lg transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="tracking-tight">{tab.label}</span>
                    {isLocked && (
                      <div className="ml-1 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200/50">
                        <Icon icon="heroicons:lock-closed-16-solid" className="text-[10px] text-amber-600" />
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tab Content Container */}
        <div className="mt-4 pb-20">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fadeUp" style={{ animationDelay: '200ms' }}>
              
              {/* LEFT: Operation Logic (Bento Layout) */}
              <div className="xl:col-span-7 space-y-8">
                
                {/* ── Business Model & Delivery Modes (Dark Kitchen vs Restaurant) */}
                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-50/50 relative overflow-hidden group">
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Icon icon="solar:shop-2-bold-duotone" className="text-3xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Modelo de Negocio</h3>
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                            {BUSINESS_TYPES.find(b => b.id === settingsForm.business_type)?.badge || 'Operación'}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-400 font-medium">Define cómo reciben y piden tus comensales (Dark Kitchen, Restaurante, etc.)</p>
                      </div>
                    </div>
                  </div>

                  {/* Selector de tipo de negocio predefinido */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 relative z-10">
                    {BUSINESS_TYPES.map(bType => {
                      const isSelected = settingsForm.business_type === bType.id;
                      return (
                        <button
                          key={bType.id}
                          type="button"
                          onClick={() => {
                            setSettingsForm(prev => ({
                              ...prev,
                              business_type: bType.id,
                              allow_delivery: bType.defaults.allow_delivery,
                              allow_takeaway: bType.defaults.allow_takeaway,
                              allow_dine_in: bType.defaults.allow_dine_in,
                              allow_scheduled: bType.defaults.allow_scheduled,
                            }));
                          }}
                          className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/40 text-gray-900 shadow-md ring-2 ring-indigo-500/20'
                              : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 text-gray-600 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon icon={bType.icon} className={`text-2xl ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                            {isSelected && (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight text-gray-900">{bType.name}</p>
                            <p className="text-[11px] text-gray-500 leading-snug mt-1">{bType.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Modalidades Activas (Toggles directos) */}
                  <div className="p-5 bg-gray-50/70 rounded-2xl border border-gray-100 relative z-10 space-y-4">
                    <p className="text-xs font-black text-gray-700 uppercase tracking-wide">Modalidades de Despacho Habilitadas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_delivery ? 'bg-white border-emerald-300 shadow-sm' : 'bg-transparent border-gray-200 opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={settingsForm.allow_delivery}
                          onChange={e => setSettingsForm({ ...settingsForm, allow_delivery: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">🛵 Domicilios</p>
                          <p className="text-[10px] text-gray-500">Pide dirección</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_takeaway ? 'bg-white border-emerald-300 shadow-sm' : 'bg-transparent border-gray-200 opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={settingsForm.allow_takeaway}
                          onChange={e => setSettingsForm({ ...settingsForm, allow_takeaway: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">🛍️ Para Llevar</p>
                          <p className="text-[10px] text-gray-500">Retiro en local</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_dine_in ? 'bg-white border-emerald-300 shadow-sm' : 'bg-transparent border-gray-200 opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={settingsForm.allow_dine_in}
                          onChange={e => setSettingsForm({ ...settingsForm, allow_dine_in: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">🍽️ En Mesa</p>
                          <p className="text-[10px] text-gray-500">Mesa física</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_scheduled ? 'bg-white border-emerald-300 shadow-sm' : 'bg-transparent border-gray-200 opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={settingsForm.allow_scheduled}
                          onChange={e => setSettingsForm({ ...settingsForm, allow_scheduled: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">📅 Programados</p>
                          <p className="text-[10px] text-gray-500">Fecha y hora</p>
                        </div>
                      </label>
                    </div>

                    {settingsForm.business_type === 'dark_kitchen' && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium">
                        <Icon icon="heroicons:sparkles" className="text-purple-600 shrink-0 text-base" />
                        <span><strong>Modo Dark Kitchen activo:</strong> Tu carta pública y carrito irán directo a pedir dirección de entrega, ocultando números de mesa y opciones de retiro.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── WhatsApp Module: Customer Support */}
                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-50/50 relative overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                        <Icon icon="logos:whatsapp-icon" className="text-3xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Atención al Cliente</h3>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Para Comensales
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-400 font-medium">WhatsApp visible para que tus comensales resuelvan dudas sobre su pedido.</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-6 relative z-10">
                    <div className={`relative bg-gray-50/50 p-6 rounded-[2rem] border ${!settingsForm.whatsapp_number_orders ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-100'} transition-all hover:bg-white focus-within:bg-white focus-within:ring-4 ${!settingsForm.whatsapp_number_orders ? 'focus-within:ring-red-50' : 'focus-within:ring-emerald-50'}`}>
                      {!settingsForm.whatsapp_number_orders && (
                        <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 shadow-sm">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          Falta Completar
                        </div>
                      )}
                      <FormField label="Número de WhatsApp para Soporte">
                        <div className="relative">
                          <TextInput
                            value={settingsForm.whatsapp_number_orders}
                            onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number_orders: e.target.value })}
                            placeholder="Ej. +573001234567"
                            className="bg-transparent border-none focus:ring-0 text-lg font-black tracking-widest text-[#2f4131] placeholder:text-gray-300 placeholder:font-medium p-0"
                          />
                        </div>
                        <p className={`text-[10px] mt-3 font-medium flex items-center gap-2 ${!settingsForm.whatsapp_number_orders ? 'text-red-400' : 'text-gray-400'}`}>
                           <Icon icon="heroicons:information-circle" className={!settingsForm.whatsapp_number_orders ? "text-red-500" : "text-emerald-500"} />
                           Tus comensales verán este canal en el seguimiento del pedido para escribirte si tienen preguntas.
                        </p>
                      </FormField>
                    </div>

                    <div className="flex justify-end pt-2">
                      <PrimaryButton type="submit" disabled={isSubmittingSettings} className="rounded-2xl px-10 py-4 shadow-xl shadow-gray-200">
                        {isSubmittingSettings ? 'Sincronizando...' : 'Guardar WhatsApp'}
                      </PrimaryButton>
                    </div>
                  </form>
                </div>

                {/* ── Telegram Module: Staff Kitchen Comandas (Add-on) */}
                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-50/50 relative overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-sky-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 shadow-sm">
                        <Icon icon="logos:telegram" className="text-3xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Comandas para Staff</h3>
                          <span className="text-[10px] font-black text-sky-700 bg-sky-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-sky-200">
                            <Icon icon="heroicons:bolt" className="text-xs text-sky-600" />
                            Add-on Cocina
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-400 font-medium">
                          Envía cada pedido confirmado automáticamente al grupo de Telegram de tus cocineros y repartidores.
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2.5 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200/60 self-start">
                      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                        {settingsForm.telegram_enabled ? 'Activo' : 'Pausado'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, telegram_enabled: !settingsForm.telegram_enabled })}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                          settingsForm.telegram_enabled ? 'bg-sky-500 justify-end' : 'bg-gray-200 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    {/* Botón Guía Rápida */}
                    <div className="flex items-center justify-between bg-sky-50/70 border border-sky-200/70 rounded-2xl p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className="text-xs font-bold text-sky-950">¿Cómo conectar tu grupo en 3 pasos?</p>
                          <p className="text-[11px] text-sky-700">Aprende a crear tu bot y obtener el ID de tu grupo de cocina.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                        className="text-xs font-bold text-sky-600 hover:text-sky-800 bg-white px-3.5 py-2 rounded-xl border border-sky-200 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Icon icon={showTelegramGuide ? "heroicons:chevron-up" : "heroicons:question-mark-circle"} className="text-sm" />
                        <span>{showTelegramGuide ? 'Ocultar guía' : 'Ver guía paso a paso'}</span>
                      </button>
                    </div>

                    {/* Contenido de la Guía Paso a Paso */}
                    <AnimatePresence>
                      {showTelegramGuide && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white rounded-3xl border border-sky-200/90 p-6 space-y-6 text-xs text-gray-700 shadow-md shadow-sky-500/5 overflow-hidden"
                        >
                          {/* Paso 1 */}
                          <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100/80 space-y-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-xl bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">1</span>
                              <div>
                                <h4 className="font-black text-gray-900 text-sm">Crea tu Bot Oficial en Telegram (1 minuto)</h4>
                                <p className="text-[11px] text-gray-500">Este bot llevará el nombre y foto de tu marca para entregar las comandas.</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1.5">
                                <p className="font-bold text-gray-800 text-[11px] flex items-center gap-1.5">
                                  <span>a. Abre</span>
                                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-black">@BotFather</a>
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  Envíale el comando <code className="bg-gray-100 text-pink-600 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">/newbot</code>.
                                </p>
                              </div>

                              <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1.5">
                                <p className="font-bold text-gray-800 text-[11px]">b. Escribe el Nombre del Bot</p>
                                <p className="text-[11px] text-gray-500">
                                  Es el nombre público visible (ej: <span className="font-semibold text-gray-700">Cocina {activeBrand?.name || 'Boku Bento'}</span>).
                                </p>
                              </div>

                              <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1.5 md:col-span-2">
                                <p className="font-bold text-gray-800 text-[11px] flex items-center gap-1.5">
                                  <span>c. Escribe el Usuario (Username)</span>
                                  <span className="bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">¡Regla Obligatoria!</span>
                                </p>
                                <p className="text-[11px] text-gray-600 leading-relaxed">
                                  Telegram exige que el nombre de usuario termine estrictamente en <code className="bg-amber-50 text-amber-800 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-200">bot</code> o <code className="bg-amber-50 text-amber-800 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-200">_bot</code> (ej: <span className="font-mono font-bold text-sky-800">{activeBrand?.slug ? `${activeBrand.slug.replace(/[^a-zA-Z0-9]/g, '')}bot` : 'BokuBentobot'}</span> o <span className="font-mono font-bold text-sky-800">cocina_{activeBrand?.slug ? activeBrand.slug.replace(/[^a-zA-Z0-9]/g, '') : 'marca'}_bot</span>).
                                </p>
                              </div>
                            </div>

                            {/* Preview del mensaje de éxito */}
                            <div className="bg-gray-900 text-gray-100 rounded-xl p-3 font-mono text-[10px] leading-relaxed relative overflow-hidden">
                              <div className="flex items-center justify-between text-gray-400 text-[9px] mb-1.5 border-b border-gray-800 pb-1">
                                <span>Respuesta de BotFather</span>
                                <span className="text-emerald-400 font-bold">✓ Éxito</span>
                              </div>
                              <p className="text-gray-300">Done! Congratulations on your new bot... Use this token to access the HTTP API:</p>
                              <p className="text-emerald-400 font-bold mt-1 bg-black/40 px-2 py-1 rounded inline-block">7123456789:AAGfuIeT-U78TBdup3hxyngmc...</p>
                              <p className="text-gray-400 text-[9px] mt-1.5">↳ Copia ese código completo y pégalo abajo en el campo <strong>"Token del Bot"</strong>.</p>
                            </div>
                          </div>

                          {/* Paso 2 */}
                          <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100/80 space-y-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-xl bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">2</span>
                              <div>
                                <h4 className="font-black text-gray-900 text-sm">Crea tu Grupo de Cocina y agrega a tu Bot</h4>
                                <p className="text-[11px] text-gray-500">Aquí llegará la comanda para tus cocineros y repartidores.</p>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-sky-100 text-[11px] text-gray-600 space-y-1">
                              <p>• En Telegram, pulsa <strong>Nuevo Grupo</strong> (ej: <em>"Cocina & Despacho - {activeBrand?.name || 'Mi Marca'}"</em>).</p>
                              <p>• Añade a tu personal y busca el bot que acabas de crear (por su usuario con <em>...bot</em>) para agregarlo al grupo.</p>
                              <p className="text-sky-700 font-medium">💡 <em>Tip:</em> Puedes nombrarlo Administrador del grupo para asegurarte de que lea y despache sin restricciones.</p>
                            </div>
                          </div>

                          {/* Paso 3 */}
                          <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100/80 space-y-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-xl bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">3</span>
                              <div>
                                <h4 className="font-black text-gray-900 text-sm">Pega tu Token y pulsa "Detectar ID Automáticamente"</h4>
                                <p className="text-[11px] text-gray-500">Aluna reconocerá tu grupo y rellenará el ID solo.</p>
                              </div>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border border-sky-100 text-[11px] text-gray-600 space-y-2">
                              <p>
                                <strong>1.</strong> Pega el Token de BotFather en el campo <strong>"1. Token del Bot de Telegram"</strong> de abajo.
                              </p>
                              <p>
                                <strong>2.</strong> En tu grupo de Telegram (donde agregaste al bot), envía cualquier mensaje (ej: <code className="bg-sky-50 text-sky-800 font-mono font-bold px-1.5 py-0.5 rounded border border-sky-200">hola</code> o <code className="bg-sky-50 text-sky-800 font-mono font-bold px-1.5 py-0.5 rounded border border-sky-200">/start</code>).
                              </p>
                              <p>
                                <strong>3.</strong> Pulsa el botón azul <strong>"🔍 Detectar ID Automáticamente"</strong> en el campo 2. <strong>¡Y listo! El ID se llena solo sin más.</strong>
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Status Banner */}
                    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                      settingsForm.telegram_enabled
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/80 border-amber-200 text-amber-900'
                    }`}>
                      <span className="flex h-2.5 w-2.5 relative shrink-0">
                        {settingsForm.telegram_enabled && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${settingsForm.telegram_enabled ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </span>
                      <span>
                        {settingsForm.telegram_enabled
                          ? 'Despacho en vivo ACTIVO: Cada nuevo pedido confirmado se enviará automáticamente al grupo de Telegram.'
                          : 'Despacho en PAUSA: El envío automático está pausado. Haz clic en el botón superior para activarlo.'}
                      </span>
                    </div>

                    {/* Campos de configuración */}
                    <div className="bg-sky-50/40 p-6 rounded-[2rem] border border-sky-100 space-y-5">
                      {/* Campo 1: Token del Bot */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                            <span>1. Token del Bot de Telegram</span>
                            <span className="text-[10px] text-sky-600 font-normal lowercase">(de @BotFather)</span>
                          </label>
                          <a
                            href="https://t.me/BotFather"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-800 underline flex items-center gap-1"
                          >
                            Abrir @BotFather
                          </a>
                        </div>
                        <TextInput
                          value={settingsForm.telegram_bot_token || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettingsForm(prev => ({
                              ...prev,
                              telegram_bot_token: val,
                              telegram_enabled: prev.telegram_enabled || Boolean(val.trim())
                            }));
                          }}
                          placeholder="Ej: 7123456789:AAFlkJg_v0fL9q2s9s..."
                          className="bg-white border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 text-xs font-mono p-3.5 w-full text-sky-950 placeholder:text-gray-300"
                        />
                        <p className="text-[10px] text-gray-400">
                          Identifica a tu bot para que las comandas lleguen con el nombre y logo de tu restaurante.
                        </p>
                      </div>

                      {/* Campo 2: Chat ID */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                            <span>2. ID de Chat o Grupo de Cocina</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleDetectChatId}
                            disabled={isDetectingChatId || !settingsForm.telegram_bot_token}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                              !settingsForm.telegram_bot_token || isDetectingChatId
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-500/20 cursor-pointer active:scale-95'
                            }`}
                          >
                            <Icon icon={isDetectingChatId ? "line-md:loading-loop" : "heroicons:sparkles"} className="text-xs" />
                            <span>{isDetectingChatId ? 'Buscando grupo...' : '🔍 Detectar ID Automáticamente'}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <TextInput
                            value={settingsForm.telegram_chat_id || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettingsForm(prev => ({
                                ...prev,
                                telegram_chat_id: val,
                                telegram_enabled: prev.telegram_enabled || Boolean(val.trim())
                              }));
                            }}
                            placeholder="Ej: -10023481928"
                            className="bg-white border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 text-sm font-mono font-bold tracking-wider text-sky-950 placeholder:text-gray-300 p-3.5 w-full"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 flex items-center justify-between">
                          <span>Identificador privado que inicia con <code className="font-bold text-sky-700">-100...</code></span>
                          <span className="text-sky-600 font-medium">💡 Escribe en tu grupo y pulsa "Detectar ID Automáticamente"</span>
                        </p>
                      </div>

                      {/* Botón de Prueba */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-sky-100/80 text-[11px] text-sky-900/80">
                        <p className="flex items-center gap-1.5">
                          <Icon icon="heroicons:information-circle" className="text-sky-500 text-sm shrink-0" />
                          <span>Envía una comanda simulada para verificar que tu bot y grupo estén bien conectados.</span>
                        </p>

                        <button
                          type="button"
                          onClick={handleTestTelegram}
                          disabled={isTestingTelegram || !settingsForm.telegram_chat_id}
                          className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            !settingsForm.telegram_chat_id || isTestingTelegram
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 active:scale-95'
                          }`}
                        >
                          {isTestingTelegram ? (
                            <>
                              <Icon icon="line-md:loading-loop" className="text-sm" />
                              <span>Enviando comanda...</span>
                            </>
                          ) : (
                            <>
                              <Icon icon="heroicons:beaker" className="text-sm" />
                              <span>🧪 Probar Comanda</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <PrimaryButton
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={isSubmittingSettings}
                        className="rounded-2xl px-10 py-4 shadow-xl shadow-gray-200"
                      >
                        {isSubmittingSettings ? 'Sincronizando...' : 'Guardar Configuración Telegram'}
                      </PrimaryButton>
                    </div>
                  </div>
                </div>

                {/* ── Payment Modes Module */}
                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-50/50 relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Icon icon="solar:card-search-linear" className="text-2xl" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Estrategia de Recaudo</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'none', label: 'Post-pago', desc: 'Flujo libre', icon: 'solar:bill-list-linear', color: 'gray' },
                      { id: 'pre_preparation', label: 'Pre-preparar', desc: 'Pago para cocina', icon: 'solar:shield-check-linear', color: 'emerald' },
                      { id: 'pre_delivery', label: 'Pre-entrega', desc: 'Pago para servir', icon: 'solar:box-minimalistic-linear', color: 'amber' }
                    ].map((option) => {
                      const isActive = settingsForm.payment_requirement_stage === option.id;
                      return (
                        <label 
                          key={option.id}
                          className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative ${
                            isActive 
                              ? `bg-gray-900 border-gray-900 text-white shadow-2xl scale-[1.02] z-10` 
                              : 'bg-white border-gray-50 hover:border-gray-200 text-gray-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_flow"
                            value={option.id}
                            checked={isActive}
                            onChange={(e) => setSettingsForm({ ...settingsForm, payment_requirement_stage: e.target.value })}
                            className="sr-only"
                          />
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isActive ? 'bg-white/10 text-white' : 'bg-gray-50 text-gray-400'}`}>
                            <Icon icon={option.icon} className="text-3xl" />
                          </div>
                          <div className="text-center">
                            <span className="text-[13px] font-black uppercase tracking-widest block mb-1">{option.label}</span>
                            <span className={`text-[9px] font-bold uppercase block tracking-tighter opacity-60`}>{option.desc}</span>
                          </div>
                          {isActive && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">Activo</div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-50/50">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Impresion y documentos</h4>
                      <p className="text-xs text-gray-400 mt-1">KDS principal, con impresion termica opcional.</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 px-3 py-2 rounded-full">Factura electronica · Proximamente</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="p-5 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer">
                      <input type="checkbox" checked={settingsForm.kitchen_print_enabled} onChange={(e) => setSettingsForm({ ...settingsForm, kitchen_print_enabled: e.target.checked })} className="mr-3" />
                      <span className="text-sm font-bold">Comanda opcional</span>
                      <p className="text-[10px] text-gray-400 mt-2">Para locales que no usen KDS.</p>
                    </label>
                    <label className="p-5 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer">
                      <input type="checkbox" checked={settingsForm.receipt_print_enabled} onChange={(e) => setSettingsForm({ ...settingsForm, receipt_print_enabled: e.target.checked })} className="mr-3" />
                      <span className="text-sm font-bold">Recibo / cuenta</span>
                      <p className="text-[10px] text-gray-400 mt-2">Documento interno, no fiscal.</p>
                    </label>
                    <label className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                      <span className="text-xs font-black uppercase text-gray-400">Papel termico</span>
                      <select value={settingsForm.thermal_paper_width} onChange={(e) => setSettingsForm({ ...settingsForm, thermal_paper_width: e.target.value })} className="mt-3 w-full rounded-xl border-gray-200 text-sm font-bold">
                        <option value="80">80 mm</option>
                        <option value="50">50 mm</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex justify-end mt-6"><PrimaryButton type="button" onClick={handleSaveSettings} disabled={isSubmittingSettings}>Guardar impresion</PrimaryButton></div>
                </div>

                {/* ── Kitchen & Table Intelligence Module (NEW) */}
                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-50/50 relative overflow-hidden group">
                  <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity" />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Icon icon="solar:globus-linear" className="text-2xl" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Inteligencia Operativa</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {/* Inactivity Threshold */}
                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 hover:bg-white transition-all group/item">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                <Icon icon="solar:clock-circle-linear" />
                             </div>
                             <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Umbral Inactividad</span>
                          </div>
                          <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{settingsForm.inactivity_threshold_mins} min</span>
                       </div>
                       <input 
                         type="range"
                         min="5"
                         max="120"
                         step="5"
                         value={settingsForm.inactivity_threshold_mins}
                         onChange={(e) => setSettingsForm({ ...settingsForm, inactivity_threshold_mins: parseInt(e.target.value) })}
                         className="w-full accent-orange-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                       />
                       <p className="text-[9px] text-gray-400 mt-4 font-bold uppercase leading-tight italic">Color naranja en Mapa de Mesas tras este tiempo sin pedidos.</p>
                    </div>

                    {/* Prep Target */}
                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 hover:bg-white transition-all group/item">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Icon icon="solar:chef-hat-broken" />
                             </div>
                             <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Meta de Cocina</span>
                          </div>
                          <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{settingsForm.target_prep_time_mins} min</span>
                       </div>
                       <input 
                         type="range"
                         min="1"
                         max="60"
                         step="1"
                         value={settingsForm.target_prep_time_mins}
                         onChange={(e) => setSettingsForm({ ...settingsForm, target_prep_time_mins: parseInt(e.target.value) })}
                         className="w-full accent-emerald-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                       />
                       <p className="text-[9px] text-gray-400 mt-4 font-bold uppercase leading-tight italic">Tiempo ideal de despacho para mantener indicadores en verde.</p>
                    </div>
                  </div>
                </div>

                {/* ── Economy & Privacy Module (Enhanced) */}
                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-50/50 relative overflow-hidden group">
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity" />
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                         <Icon icon="solar:hand-money-linear" className="text-2xl" />
                      </div>
                      <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Economía y Seguridad</h4>
                    </div>
                    <PrimaryButton type="button" onClick={handleSaveSettings} disabled={isSubmittingSettings} className="rounded-xl px-6 py-2 shadow-lg active:scale-95">
                      {isSubmittingSettings ? 'Sync...' : 'Guardar'}
                    </PrimaryButton>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {/* Tip Control */}
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 hover:bg-white transition-colors">
                      <div className="flex-1">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest block mb-1">Propina Sugerida</span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Fomentar el servicio en comandas digitales.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={settingsForm.is_service_fee_enabled}
                              onChange={(e) => setSettingsForm({ ...settingsForm, is_service_fee_enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                        </label>
                        {settingsForm.is_service_fee_enabled && (
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 ring-4 ring-indigo-50/50">
                             <input
                               type="number"
                               value={settingsForm.service_fee_percentage}
                               onChange={(e) => setSettingsForm({ ...settingsForm, service_fee_percentage: parseInt(e.target.value) || 0 })}
                               className="w-10 bg-transparent border-none p-0 text-center font-black text-indigo-600 focus:ring-0"
                             />
                             <span className="text-xs font-black text-gray-300">%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Privacy Control */}
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 hover:bg-white transition-colors">
                      <div className="flex-1">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest block mb-1">Privacidad de Ventas</span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Ocultar montos facturados al staff (solo Admin ve ventas).</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={settingsForm.hide_sales_from_staff}
                            onChange={(e) => setSettingsForm({ ...settingsForm, hide_sales_from_staff: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </div>
                        <Icon icon={settingsForm.hide_sales_from_staff ? "solar:eye-closed-linear" : "solar:eye-linear"} className={`text-lg ${settingsForm.hide_sales_from_staff ? 'text-rose-600' : 'text-gray-400'}`} />
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT: Service Schedule (Technical Schedule) */}
              <div className="xl:col-span-5">
                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col h-full overflow-hidden">
                  <div className="px-10 py-8 border-b border-gray-100 bg-gray-50/30 flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Horarios de Servicio</h3>
                      <p className="text-[12px] text-gray-400 mt-1 font-medium">Controla la disponibilidad del menú digital por día.</p>
                    </div>
                    <PrimaryButton onClick={handleSaveHours} disabled={isSubmittingHours} className="rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                      {isSubmittingHours ? 'Guardando' : 'Actualizar'}
                    </PrimaryButton>
                  </div>

                  <div className="p-8 flex-1">
                    <div className="space-y-2">
                      {hours.map((h, index) => {
                        const isClosed = h.is_closed;
                        return (
                          <div key={h.day_of_week} 
                            className={`flex flex-col xl:flex-row items-start xl:items-center justify-between p-4 rounded-2xl border transition-all gap-4 group ${
                              isClosed 
                                ? 'bg-gray-50/50 border-gray-100 opacity-60 grayscale' 
                                : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm'
                            }`}>
                            
                            <div className="flex items-center gap-4">
                              <div className={`w-10 font-black text-[12px] uppercase tracking-wider italic ${isClosed ? 'text-gray-400' : 'text-gray-900'}`}>
                                {getDayName(h.day_of_week).substring(0, 3)}
                              </div>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="time" 
                                  value={h.open_time || '08:00'} 
                                  onChange={(e) => handleUpdateHour(index, 'open_time', e.target.value)}
                                  disabled={isClosed}
                                  className="bg-gray-50 border-none rounded-lg px-2 py-1.5 text-[13px] font-black text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-50 outline-none disabled:opacity-30 tabular-nums w-20 text-center"
                                />
                                <span className="text-gray-200 text-xs">—</span>
                                <input 
                                  type="time" 
                                  value={h.close_time || '22:00'} 
                                  onChange={(e) => handleUpdateHour(index, 'close_time', e.target.value)}
                                  disabled={isClosed}
                                  className="bg-gray-50 border-none rounded-lg px-2 py-1.5 text-[13px] font-black text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-50 outline-none disabled:opacity-30 tabular-nums w-20 text-center"
                                />
                              </div>
                            </div>

                            <button 
                              onClick={() => handleUpdateHour(index, 'is_closed', !isClosed)}
                              className={`w-full xl:w-auto justify-center px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                                isClosed 
                                  ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-rose-50/50' 
                                  : 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-50/50'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isClosed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              {isClosed ? 'Cerrado' : 'Abierto'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="px-10 py-6 bg-indigo-50/30 border-t border-indigo-50 text-center">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Gestión de Disponibilidad Digital</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'sedes' || activeTab === 'staff') && (
            <div className="relative animate-fadeUp" style={{ animationDelay: '200ms' }}>
              <div className={`glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-10 min-h-[600px] shadow-2xl shadow-gray-100/50 ${isFeatureLocked(activeTab === 'sedes' ? 'multi_location' : 'staff') ? 'blur-sm pointer-events-none grayscale-[0.5] opacity-40' : ''}`}>
                {activeTab === 'sedes' ? <AdminSedes isEmbedded={true} /> : <AdminStaff isEmbedded={true} />}
              </div>
              
              {isFeatureLocked(activeTab === 'sedes' ? 'multi_location' : 'staff') && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-12 text-center translate-y-[-20%]">
                   <div className="bg-white/80 backdrop-blur-2xl p-12 rounded-[4rem] border border-white shadow-[0_32px_100px_-20px_rgba(0,0,0,0.1)] flex flex-col items-center max-w-md ring-1 ring-black/[0.03] scale-105">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-amber-500 mb-8 border border-white shadow-xl relative animate-bounce-slow">
                         <Icon icon="solar:lock-bold-duotone" className="text-5xl" />
                         <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-tight ring-4 ring-white">
                           {activeTab === 'sedes' ? 'Plan Pro' : 'Plan Esencial'}
                         </div>
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                        Módulo Bloqueado
                      </h3>
                      <p className="text-sm text-gray-400 mb-10 font-bold leading-relaxed italic uppercase tracking-tighter">
                        {activeTab === 'sedes' 
                          ? 'La gestión multi-sede requiere el Plan Profesional para escalar tu operación regional.'
                          : 'Añade meseros y personal de cocina con accesos controlados para mayor seguridad.'}
                      </p>
                      <button 
                        onClick={() => window.open('https://wa.me/573214815152?text=Hola!%20Deseo%20mejorar%20mi%20plan%20en%20Aluna', '_blank')}
                        className="bg-gray-900 text-white font-black py-5 px-12 rounded-[2rem] shadow-2xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all text-[14px] flex items-center gap-3 uppercase tracking-widest">
                        <Icon icon="solar:stars-line-duotone" className="text-xl" />
                        Desbloquear Función
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="animate-fadeUp" style={{ animationDelay: '200ms' }}>
               <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-10 min-h-[600px] shadow-2xl shadow-gray-100/50">
                  <AdminPaymentMethods />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
