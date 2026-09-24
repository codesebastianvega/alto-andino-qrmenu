import React, { useState, useEffect } from 'react';
import AdminStaff from './AdminStaff';
import AdminSedes from './AdminSedes';
import AdminPaymentMethods from './AdminPaymentMethods';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../context/LocationContext';
import { useMenuData } from '../context/MenuDataContext';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton, Switch } from '../components/admin/ui';
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
  const menuData = useMenuData();
  const refetchMenuData = menuData?.refetchMenuData;
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
      
      // Fallback: Check for brand-level settings (location_id IS NULL)
      let brandLevelRow = null;
      if (!isAllLocations && activeLocationId) {
        const fallbackRes = await supabase
          .from('restaurant_settings')
          .select('*')
          .eq('brand_id', activeBrand.id)
          .is('location_id', null)
          .limit(1)
          .maybeSingle();
        brandLevelRow = fallbackRes.data;
        if (!data && brandLevelRow) {
          data = brandLevelRow;
        }
      }
      
      if (data) {
        setSettings(data);
        const hasOperationsModel = Array.isArray(data.brand_concepts) && data.brand_concepts.some(c => c && (c.id === 'operations_model' || c.fulfillment_modes));
        const effectiveConcepts = hasOperationsModel
          ? data.brand_concepts
          : (brandLevelRow?.brand_concepts || data.brand_concepts || []);

        const effectiveData = {
          ...data,
          brand_concepts: effectiveConcepts,
          business_type: data.business_type || activeBrand?.business_type,
          business_name: activeBrand?.name || data.business_name
        };

        const modes = getFulfillmentModes(effectiveData);
        const telegramConcept = (Array.isArray(effectiveConcepts) && effectiveConcepts.find(c => c && c.id === 'telegram_dispatch'))
          || (Array.isArray(brandLevelRow?.brand_concepts) && brandLevelRow.brand_concepts.find(c => c && c.id === 'telegram_dispatch'))
          || (Array.isArray(data?.brand_concepts) && data.brand_concepts.find(c => c && c.id === 'telegram_dispatch'))
          || null;

        setSettingsForm({
          whatsapp_number_orders: data.whatsapp_number_orders || brandLevelRow?.whatsapp_number_orders || '',
          telegram_enabled: telegramConcept ? (telegramConcept.enabled ?? true) : Boolean(data.telegram_chat_id || brandLevelRow?.telegram_chat_id),
          telegram_chat_id: telegramConcept?.chat_id || data.telegram_chat_id || brandLevelRow?.telegram_chat_id || '',
          telegram_bot_token: telegramConcept?.bot_token || data.telegram_bot_token || brandLevelRow?.telegram_bot_token || '',
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

      const existingTelegram = Array.isArray(settings?.brand_concepts)
        ? settings.brand_concepts.find(c => c && c.id === 'telegram_dispatch')
        : null;

      const telegramDispatch = {
        id: 'telegram_dispatch',
        enabled: settingsForm.telegram_chat_id 
          ? Boolean(settingsForm.telegram_enabled) 
          : (existingTelegram ? Boolean(existingTelegram.enabled) : Boolean(settingsForm.telegram_enabled)),
        chat_id: settingsForm.telegram_chat_id ? String(settingsForm.telegram_chat_id).trim() : (existingTelegram?.chat_id || ''),
        bot_token: settingsForm.telegram_bot_token ? String(settingsForm.telegram_bot_token).trim() : (existingTelegram?.bot_token || null)
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
      
      // 1. Also update brand-level restaurant_settings operations_model if editing a specific location
      if (!isAllLocations && activeLocationId && activeBrand?.id) {
        const { data: bRow } = await supabase
          .from('restaurant_settings')
          .select('id, brand_concepts')
          .eq('brand_id', activeBrand.id)
          .is('location_id', null)
          .maybeSingle();

        if (bRow?.id) {
          const bConcepts = Array.isArray(bRow.brand_concepts)
            ? bRow.brand_concepts.filter(c => c && c.id !== 'operations_model' && c.id !== 'telegram_dispatch')
            : [];
          await supabase
            .from('restaurant_settings')
            .update({
              brand_concepts: [operationsModel, telegramDispatch, ...bConcepts],
              updated_at: new Date().toISOString()
            })
            .eq('id', bRow.id);
        }
      }

      // 2. Synchronize brands.business_type
      if (activeBrand?.id && settingsForm.business_type) {
        await supabase
          .from('brands')
          .update({ business_type: settingsForm.business_type, updated_at: new Date().toISOString() })
          .eq('id', activeBrand.id);
      }

      // 3. Synchronize locations.operational_modes
      const activeModes = [];
      if (settingsForm.allow_dine_in) activeModes.push('dine_in');
      if (settingsForm.allow_takeaway) activeModes.push('takeaway');
      if (settingsForm.allow_delivery) activeModes.push('delivery');
      if (settingsForm.allow_scheduled) activeModes.push('scheduled');

      if (!isAllLocations && activeLocationId) {
        await supabase.from('locations').update({ operational_modes: activeModes, updated_at: new Date().toISOString() }).eq('id', activeLocationId);
      } else if (activeBrand?.id) {
        await supabase.from('locations').update({ operational_modes: activeModes, updated_at: new Date().toISOString() }).eq('brand_id', activeBrand.id);
      }

      // 4. Also update locations phone if whatsapp_number_orders is provided
      if (settingsForm.whatsapp_number_orders) {
        if (!isAllLocations && activeLocationId) {
          await supabase.from('locations').update({ phone: settingsForm.whatsapp_number_orders, whatsapp: settingsForm.whatsapp_number_orders }).eq('id', activeLocationId);
        } else if (activeBrand?.id) {
          await supabase.from('locations').update({ phone: settingsForm.whatsapp_number_orders, whatsapp: settingsForm.whatsapp_number_orders }).eq('brand_id', activeBrand.id);
        }
      }

      toast.success('Modelo de negocio y configuración guardados correctamente');
      await fetchSettings();
      if (refetchMenuData) refetchMenuData();
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
          
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200/80 px-4 py-2.5 shadow-2xs self-start md:self-auto">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
               <Icon icon="solar:rocket-2-linear" className="text-base" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Plan Actual</p>
              <p className="text-xs font-bold text-gray-900 uppercase">{activePlan?.name || 'Cargando...'}</p>
            </div>
          </div>
        </div>

        {/* ── Sleek Segmented Tab Navigation */}
        <div className="relative z-10 animate-fadeUp w-full" style={{ animationDelay: '100ms' }}>
          <div className="overflow-x-auto no-scrollbar pb-1 w-full flex justify-center">
            <div className="inline-flex items-center bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/70 shadow-xs gap-1">
              {TABS.map((tab) => {
                const isLocked = tab.feature && isFeatureLocked(tab.feature);
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon icon={tab.icon} className={`text-base ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                    {isLocked && (
                      <span className="ml-1 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200/50">
                        <Icon icon="heroicons:lock-closed-16-solid" className="text-[10px] text-amber-600" />
                      </span>
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
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fadeUp" style={{ animationDelay: '200ms' }}>
              
              {/* LEFT: Operation Logic (Bento Layout) */}
              <div className="xl:col-span-7 space-y-6">
                
                {/* ── Business Model & Delivery Modes (Dark Kitchen vs Restaurant) */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/60">
                        <Icon icon="solar:shop-2-bold" className="text-xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Modelo de Negocio</h3>
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100/80 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {BUSINESS_TYPES.find(b => b.id === settingsForm.business_type)?.badge || 'Operación'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Define cómo reciben y piden tus comensales (Dark Kitchen, Restaurante, etc.)</p>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleSaveSettings} 
                      disabled={isSubmittingSettings}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
                    >
                      {isSubmittingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:diskette-bold-duotone" className="text-base" />
                          <span>Guardar Modelo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Selector de tipo de negocio predefinido */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
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
                          className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#2f4131] bg-[#2f4131]/5 text-gray-900 shadow-2xs ring-1 ring-[#2f4131]'
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-500'}`}>
                              <Icon icon={bType.icon} className="text-base" />
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-semibold bg-[#2f4131] text-white px-2 py-0.5 rounded-md">
                                Activo
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 leading-snug">{bType.name}</p>
                            <p className="text-[11px] text-gray-500 leading-snug mt-1">{bType.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Modalidades Activas (Toggles directos) */}
                  <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/80 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Modalidades de Despacho Habilitadas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_delivery ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-transparent border-gray-200/70 opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={settingsForm.allow_delivery}
                          onChange={e => setSettingsForm({ ...settingsForm, allow_delivery: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">🛵 Domicilios</p>
                          <p className="text-[10px] text-gray-500">Pide dirección</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_takeaway ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-transparent border-gray-200/70 opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={settingsForm.allow_takeaway}
                          onChange={e => setSettingsForm({ ...settingsForm, allow_takeaway: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">🛍️ Para Llevar</p>
                          <p className="text-[10px] text-gray-500">Retiro en local</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_dine_in ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-transparent border-gray-200/70 opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={settingsForm.allow_dine_in}
                          onChange={e => setSettingsForm({ ...settingsForm, allow_dine_in: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">🍽️ En Mesa</p>
                          <p className="text-[10px] text-gray-500">Mesa física</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_scheduled ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-transparent border-gray-200/70 opacity-60'}`}>
                        <input
                          type="checkbox"
                          checked={settingsForm.allow_scheduled}
                          onChange={e => setSettingsForm({ ...settingsForm, allow_scheduled: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">📅 Programados</p>
                          <p className="text-[10px] text-gray-500">Fecha y hora</p>
                        </div>
                      </label>
                    </div>

                    {settingsForm.business_type === 'dark_kitchen' && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs font-medium">
                        <Icon icon="heroicons:sparkles" className="text-purple-600 shrink-0 text-base" />
                        <span><strong>Modo Dark Kitchen activo:</strong> Tu carta pública y carrito irán directo a pedir dirección de entrega, ocultando números de mesa y opciones de retiro.</span>
                      </div>
                    )}

                    <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-200/70">
                      <p className="text-[11px] text-gray-500">
                        Presiona <strong>Guardar Modelo</strong> para aplicar el cambio a tus sedes y al menú digital.
                      </p>
                      <button 
                        type="button" 
                        onClick={handleSaveSettings} 
                        disabled={isSubmittingSettings}
                        className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingSettings ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Telegram Module: Staff Kitchen Comandas (Add-on) */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100/60">
                        <Icon icon="logos:telegram" className="text-xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Comandas para Staff</h3>
                          <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                            Add-on Cocina
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Envía cada pedido confirmado automáticamente al grupo de Telegram de tu cocina y repartidores.
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-3 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200/80 self-start sm:self-auto shrink-0">
                      <span className="text-xs font-semibold text-gray-600">
                        {settingsForm.telegram_enabled ? 'Activo' : 'Pausado'}
                      </span>
                      <Switch 
                        checked={settingsForm.telegram_enabled}
                        onChange={(val) => setSettingsForm({ ...settingsForm, telegram_enabled: val })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Botón Guía Rápida */}
                    <div className="flex items-center justify-between bg-sky-50/60 border border-sky-200/70 rounded-xl p-3.5">
                      <div className="flex items-center gap-2.5">
                        <Icon icon="solar:lightbulb-bold" className="text-base text-sky-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-sky-950">¿Cómo conectar tu grupo en 3 pasos?</p>
                          <p className="text-[11px] text-sky-700">Aprende a crear tu bot y obtener el ID de tu grupo de cocina.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                        className="text-xs font-semibold text-sky-700 hover:text-sky-900 bg-white px-3 py-1.5 rounded-lg border border-sky-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Icon icon={showTelegramGuide ? "heroicons:chevron-up" : "heroicons:question-mark-circle"} className="text-sm" />
                        <span>{showTelegramGuide ? 'Ocultar guía' : 'Ver guía'}</span>
                      </button>
                    </div>

                    {/* Contenido de la Guía Paso a Paso */}
                    <AnimatePresence>
                      {showTelegramGuide && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white rounded-2xl border border-sky-200 p-5 space-y-4 text-xs text-gray-700 shadow-xs overflow-hidden"
                        >
                          {/* Paso 1 */}
                          <div className="bg-sky-50/40 rounded-xl p-3.5 border border-sky-100 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                              <div>
                                <h4 className="font-bold text-gray-900 text-xs">Crea tu Bot Oficial en Telegram (1 minuto)</h4>
                                <p className="text-[11px] text-gray-500">Llevará el nombre de tu restaurante para entregar las comandas.</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                              <div className="bg-white p-3 rounded-lg border border-sky-100 space-y-1">
                                <p className="font-semibold text-gray-800 text-[11px] flex items-center gap-1.5">
                                  <span>a. Abre</span>
                                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-bold">@BotFather</a>
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  Envíale el comando <code className="bg-gray-100 text-pink-600 font-mono font-semibold px-1 py-0.5 rounded text-[10px]">/newbot</code>.
                                </p>
                              </div>

                              <div className="bg-white p-3 rounded-lg border border-sky-100 space-y-1">
                                <p className="font-semibold text-gray-800 text-[11px]">b. Escribe el Nombre del Bot</p>
                                <p className="text-[11px] text-gray-500">
                                  Nombre público (ej: <span className="font-medium text-gray-700">Cocina {activeBrand?.name || 'Boku Bento'}</span>).
                                </p>
                              </div>

                              <div className="bg-white p-3 rounded-lg border border-sky-100 space-y-1 md:col-span-2">
                                <p className="font-semibold text-gray-800 text-[11px] flex items-center gap-1.5">
                                  <span>c. Escribe el Usuario (Username)</span>
                                  <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10px]">Obligatorio</span>
                                </p>
                                <p className="text-[11px] text-gray-600 leading-relaxed">
                                  Debe terminar estrictamente en <code className="bg-amber-50 text-amber-800 font-mono font-semibold px-1 py-0.5 rounded border border-amber-200">bot</code> o <code className="bg-amber-50 text-amber-800 font-mono font-semibold px-1 py-0.5 rounded border border-amber-200">_bot</code> (ej: <span className="font-mono font-semibold text-sky-800">{activeBrand?.slug ? `${activeBrand.slug.replace(/[^a-zA-Z0-9]/g, '')}bot` : 'BokuBentobot'}</span>).
                                </p>
                              </div>
                            </div>

                            <div className="bg-gray-900 text-gray-100 rounded-lg p-2.5 font-mono text-[10px] leading-relaxed">
                              <p className="text-gray-400 text-[9px] mb-1 border-b border-gray-800 pb-1">Token de BotFather:</p>
                              <p className="text-emerald-400 font-semibold">7123456789:AAGfuIeT-U78TBdup3hxyngmc...</p>
                              <p className="text-gray-400 text-[9px] mt-1">↳ Cópialo completo y pégalo abajo en <strong>"Token del Bot"</strong>.</p>
                            </div>
                          </div>

                          {/* Paso 2 */}
                          <div className="bg-sky-50/40 rounded-xl p-3.5 border border-sky-100 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                              <div>
                                <h4 className="font-bold text-gray-900 text-xs">Crea tu Grupo y agrega al Bot</h4>
                                <p className="text-[11px] text-gray-500">Aquí llegará la comanda para el equipo.</p>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-sky-100 text-[11px] text-gray-600 space-y-1">
                              <p>• En Telegram, pulsa <strong>Nuevo Grupo</strong> (ej: <em>"Cocina - {activeBrand?.name || 'Mi Marca'}"</em>).</p>
                              <p>• Añade al personal y busca el bot que creaste para agregarlo al grupo.</p>
                            </div>
                          </div>

                          {/* Paso 3 */}
                          <div className="bg-sky-50/40 rounded-xl p-3.5 border border-sky-100 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                              <div>
                                <h4 className="font-bold text-gray-900 text-xs">Pega tu Token y pulsa "Detectar ID Automáticamente"</h4>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-sky-100 text-[11px] text-gray-600 space-y-1.5">
                              <p>1. Pega el Token de BotFather en el campo de abajo.</p>
                              <p>2. Envía cualquier mensaje en tu grupo (ej: <code className="bg-sky-50 text-sky-800 font-mono font-semibold px-1 py-0.5 rounded border border-sky-200">hola</code>).</p>
                              <p>3. Pulsa <strong>"Detectar ID Automáticamente"</strong> y se llenará solo.</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Status Banner */}
                    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      settingsForm.telegram_enabled
                        ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900'
                        : 'bg-amber-50/80 border-amber-200/90 text-amber-900'
                    }`}>
                      <span className="flex h-2 w-2 relative shrink-0">
                        {settingsForm.telegram_enabled && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${settingsForm.telegram_enabled ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </span>
                      <span>
                        {settingsForm.telegram_enabled
                          ? 'Despacho en vivo ACTIVO: Cada nuevo pedido confirmado se enviará automáticamente al grupo.'
                          : 'Despacho en PAUSA: El envío automático está pausado.'}
                      </span>
                    </div>

                    {/* Campos de configuración */}
                    <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200/80 space-y-4">
                      {/* Campo 1: Token del Bot */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                            <span>1. Token del Bot de Telegram</span>
                            <span className="text-[10px] text-gray-400 font-normal lowercase">(de @BotFather)</span>
                          </label>
                          <a
                            href="https://t.me/BotFather"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 underline"
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
                          className="font-mono text-xs"
                        />
                      </div>

                      {/* Campo 2: Chat ID */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                            <span>2. ID de Chat o Grupo de Cocina</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleDetectChatId}
                            disabled={isDetectingChatId || !settingsForm.telegram_bot_token}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                              !settingsForm.telegram_bot_token || isDetectingChatId
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-2xs cursor-pointer'
                            }`}
                          >
                            <Icon icon={isDetectingChatId ? "line-md:loading-loop" : "heroicons:sparkles"} className="text-xs" />
                            <span>{isDetectingChatId ? 'Buscando...' : 'Detectar ID Automáticamente'}</span>
                          </button>
                        </div>
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
                          className="font-mono text-xs font-semibold"
                        />
                      </div>

                      {/* Botón de Prueba */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-200/70 text-[11px] text-gray-500">
                        <p>Envía una comanda simulada para verificar la conexión.</p>

                        <button
                          type="button"
                          onClick={handleTestTelegram}
                          disabled={isTestingTelegram || !settingsForm.telegram_chat_id}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            !settingsForm.telegram_chat_id || isTestingTelegram
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-sky-500 hover:bg-sky-600 text-white shadow-2xs'
                          }`}
                        >
                          {isTestingTelegram ? (
                            <>
                              <Icon icon="line-md:loading-loop" className="text-sm" />
                              <span>Enviando...</span>
                            </>
                          ) : (
                            <>
                              <Icon icon="heroicons:beaker" className="text-sm" />
                              <span>Probar Comanda</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={isSubmittingSettings}
                        className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingSettings ? 'Guardando...' : 'Guardar Configuración Telegram'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Payment Modes Module */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/60">
                         <Icon icon="solar:card-search-linear" className="text-xl" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Estrategia de Recaudo</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Momento en que se solicita el pago a los comensales.</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSaveSettings} 
                      disabled={isSubmittingSettings} 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
                    >
                      {isSubmittingSettings ? 'Guardando...' : 'Guardar Flujo'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'none', label: 'Post-pago', desc: 'Flujo libre al terminar de comer', icon: 'solar:bill-list-linear' },
                      { id: 'pre_preparation', label: 'Pre-preparación', desc: 'Comanda se prepara tras el pago', icon: 'solar:shield-check-linear' },
                      { id: 'pre_delivery', label: 'Pre-entrega', desc: 'Pago requerido antes de servir', icon: 'solar:box-minimalistic-linear' }
                    ].map((option) => {
                      const isActive = settingsForm.payment_requirement_stage === option.id;
                      return (
                        <label 
                          key={option.id}
                          className={`flex flex-col justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer relative ${
                            isActive 
                              ? 'border-[#2f4131] bg-[#2f4131]/5 text-gray-900 shadow-2xs ring-1 ring-[#2f4131]' 
                              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
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
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-500'}`}>
                              <Icon icon={option.icon} className="text-base" />
                            </div>
                            {isActive && (
                              <span className="text-[10px] font-semibold bg-[#2f4131] text-white px-2 py-0.5 rounded-md">
                                Activo
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900 block leading-snug">{option.label}</span>
                            <span className="text-[11px] text-gray-500 block leading-snug mt-0.5">{option.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* ── Impresión y documentos */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Impresión y Documentos</h4>
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md">
                          Factura electrónica (Próximamente)
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">KDS digital principal, con impresión térmica opcional.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${settingsForm.kitchen_print_enabled ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-900">Comanda opcional</span>
                        <input 
                          type="checkbox" 
                          checked={settingsForm.kitchen_print_enabled} 
                          onChange={(e) => setSettingsForm({ ...settingsForm, kitchen_print_enabled: e.target.checked })} 
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">Para locales que no utilicen KDS de cocina.</p>
                    </label>

                    <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${settingsForm.receipt_print_enabled ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-900">Recibo / cuenta</span>
                        <input 
                          type="checkbox" 
                          checked={settingsForm.receipt_print_enabled} 
                          onChange={(e) => setSettingsForm({ ...settingsForm, receipt_print_enabled: e.target.checked })} 
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">Documento interno para control de comensales.</p>
                    </label>

                    <div className="p-3.5 rounded-xl border border-gray-200 bg-white flex flex-col justify-between">
                      <span className="text-xs font-bold text-gray-900 mb-1">Papel térmico</span>
                      <select 
                        value={settingsForm.thermal_paper_width} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, thermal_paper_width: e.target.value })} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#2f4131]"
                      >
                        <option value="80">80 mm (Estándar)</option>
                        <option value="50">50 mm (Compacto)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-5">
                    <button 
                      type="button" 
                      onClick={handleSaveSettings} 
                      disabled={isSubmittingSettings}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingSettings ? 'Guardando...' : 'Guardar Impresión'}
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT: Service Schedule, Customer Support & Intelligence */}
              <div className="xl:col-span-5 space-y-6">
                
                {/* ── Horarios de Servicio */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Horarios de Servicio</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Controla la disponibilidad del menú digital por día.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={handleSaveHours} 
                      disabled={isSubmittingHours} 
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isSubmittingHours ? 'Guardando...' : 'Guardar Horarios'}
                    </button>
                  </div>

                  <div className="p-5 sm:p-6 space-y-2">
                    {hours.map((h, index) => {
                      const isClosed = h.is_closed;
                      return (
                        <div 
                          key={h.day_of_week} 
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border transition-all gap-3 ${
                            isClosed 
                              ? 'bg-gray-50/60 border-gray-200/60 opacity-60' 
                              : 'bg-white border-gray-200/80 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-12 text-xs font-bold uppercase tracking-wider ${isClosed ? 'text-gray-400' : 'text-gray-800'}`}>
                              {getDayName(h.day_of_week).substring(0, 3)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="time" 
                                value={h.open_time || '08:00'} 
                                onChange={(e) => handleUpdateHour(index, 'open_time', e.target.value)}
                                disabled={isClosed}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#2f4131] outline-none disabled:opacity-40 tabular-nums w-24 text-center cursor-pointer"
                              />
                              <span className="text-gray-400 text-xs">—</span>
                              <input 
                                type="time" 
                                value={h.close_time || '22:00'} 
                                onChange={(e) => handleUpdateHour(index, 'close_time', e.target.value)}
                                disabled={isClosed}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#2f4131] outline-none disabled:opacity-40 tabular-nums w-24 text-center cursor-pointer"
                              />
                            </div>
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleUpdateHour(index, 'is_closed', !isClosed)}
                            className={`w-full sm:w-auto px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isClosed 
                                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' 
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {isClosed ? 'Cerrado' : 'Abierto'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── WhatsApp Module: Customer Support */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Icon icon="logos:whatsapp-icon" className="text-xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">Atención al Cliente</h3>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                            Comensales
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Canal directo para que tus clientes resuelvan dudas sobre su pedido.</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Número de WhatsApp para Soporte
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Icon icon="solar:phone-calling-linear" className="text-base" />
                        </div>
                        <input
                          type="text"
                          value={settingsForm.whatsapp_number_orders}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number_orders: e.target.value })}
                          placeholder="Ej. +573001234567"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2f4131] focus:border-[#2f4131]"
                        />
                      </div>
                      <p className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${!settingsForm.whatsapp_number_orders ? 'text-amber-600' : 'text-gray-500'}`}>
                        <Icon icon="solar:info-circle-linear" className="text-sm shrink-0" />
                        <span>{settingsForm.whatsapp_number_orders ? 'Tus comensales verán este canal en el seguimiento de su orden.' : 'Pendiente: ingresa un número para habilitar soporte directo en pedidos.'}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {settingsForm.whatsapp_number_orders ? (
                        <a
                          href={`https://wa.me/${settingsForm.whatsapp_number_orders.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola! Tengo una duda sobre mi pedido en Boku Bento.')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                        >
                          <Icon icon="logos:whatsapp-icon" className="text-xs" />
                          <span>Probar enlace comensal</span>
                        </a>
                      ) : <div />}

                      <button
                        type="submit"
                        disabled={isSubmittingSettings}
                        className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingSettings ? 'Guardando...' : 'Guardar WhatsApp'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ── Kitchen & Table Intelligence Module */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Icon icon="solar:bolt-linear" className="text-xl" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Inteligencia Operativa</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Umbrales y métricas de desempeño para el KDS y mapa de mesas.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Inactivity Threshold */}
                    <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/70">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center text-sm">
                            <Icon icon="solar:clock-circle-linear" />
                          </div>
                          <span className="text-xs font-semibold text-gray-800">Alerta de Inactividad</span>
                        </div>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md tabular-nums">
                          {settingsForm.inactivity_threshold_mins} min
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={settingsForm.inactivity_threshold_mins}
                        onChange={(e) => setSettingsForm({ ...settingsForm, inactivity_threshold_mins: parseInt(e.target.value) })}
                        className="w-full accent-[#2f4131] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-500 mt-2">Alerta visual en mesas tras este tiempo sin ordenar.</p>
                    </div>

                    {/* Prep Target */}
                    <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/70">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center text-sm">
                            <Icon icon="solar:chef-hat-broken" />
                          </div>
                          <span className="text-xs font-semibold text-gray-800">Meta de Cocina</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md tabular-nums">
                          {settingsForm.target_prep_time_mins} min
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        value={settingsForm.target_prep_time_mins}
                        onChange={(e) => setSettingsForm({ ...settingsForm, target_prep_time_mins: parseInt(e.target.value) })}
                        className="w-full accent-emerald-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-500 mt-2">Tiempo ideal en cocina para mantener semáforo en verde.</p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button 
                      type="button" 
                      onClick={handleSaveSettings} 
                      disabled={isSubmittingSettings}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingSettings ? 'Guardando...' : 'Guardar Umbrales'}
                    </button>
                  </div>
                </div>

                {/* ── Economy & Privacy Module */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Icon icon="solar:hand-money-linear" className="text-xl" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Economía y Seguridad</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Propina voluntaria para el servicio y privacidad de métricas.</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSaveSettings} 
                      disabled={isSubmittingSettings}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingSettings ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Tip Control */}
                    <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Propina sugerida</span>
                        <p className="text-xs text-gray-500 mt-0.5">Sugerir porcentaje de servicio al cliente en órdenes digitales.</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {settingsForm.is_service_fee_enabled && (
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={settingsForm.service_fee_percentage}
                              onChange={(e) => setSettingsForm({ ...settingsForm, service_fee_percentage: parseInt(e.target.value) || 0 })}
                              className="w-12 bg-transparent border-none p-0 text-center text-xs font-bold text-gray-800 focus:outline-none focus:ring-0"
                            />
                            <span className="text-xs font-semibold text-gray-500">%</span>
                          </div>
                        )}
                        <Switch
                          checked={settingsForm.is_service_fee_enabled}
                          onChange={(val) => setSettingsForm({ ...settingsForm, is_service_fee_enabled: val })}
                        />
                      </div>
                    </div>

                    {/* Privacy Control */}
                    <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Privacidad de facturación</span>
                        <p className="text-xs text-gray-500 mt-0.5">Ocultar cifras de venta y total acumulado a perfiles de staff o meseros.</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Icon 
                          icon={settingsForm.hide_sales_from_staff ? "solar:eye-closed-linear" : "solar:eye-linear"} 
                          className={`text-lg ${settingsForm.hide_sales_from_staff ? 'text-amber-600' : 'text-gray-400'}`} 
                        />
                        <Switch
                          checked={settingsForm.hide_sales_from_staff}
                          onChange={(val) => setSettingsForm({ ...settingsForm, hide_sales_from_staff: val })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {(activeTab === 'sedes' || activeTab === 'staff') && (
            <div className="relative animate-fadeUp" style={{ animationDelay: '200ms' }}>
              <div className={`bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs ${isFeatureLocked(activeTab === 'sedes' ? 'multi_location' : 'staff') ? 'blur-sm pointer-events-none grayscale-[0.5] opacity-40' : ''}`}>
                {activeTab === 'sedes' ? <AdminSedes isEmbedded={true} /> : <AdminStaff isEmbedded={true} />}
              </div>
              
              {isFeatureLocked(activeTab === 'sedes' ? 'multi_location' : 'staff') && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
                   <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-xl flex flex-col items-center max-w-md ring-1 ring-black/[0.04]">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6 border border-amber-200/60 shadow-sm relative">
                         <Icon icon="solar:lock-bold-duotone" className="text-3xl" />
                         <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                           {activeTab === 'sedes' ? 'Plan Pro' : 'Plan Esencial'}
                         </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                        Módulo Bloqueado
                      </h3>
                      <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
                        {activeTab === 'sedes' 
                          ? 'La gestión multi-sede requiere el Plan Profesional para escalar tu operación regional.'
                          : 'Añade meseros y personal de cocina con accesos controlados para mayor seguridad.'}
                      </p>
                      <button 
                        onClick={() => window.open('https://wa.me/573214815152?text=Hola!%20Deseo%20mejorar%20mi%20plan%20en%20Aluna', '_blank')}
                        className="bg-gray-900 text-white font-semibold py-3 px-8 rounded-xl shadow-md hover:bg-gray-800 transition-all text-xs flex items-center gap-2 cursor-pointer">
                        <Icon icon="solar:stars-line-duotone" className="text-base" />
                        Desbloquear Función
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="animate-fadeUp" style={{ animationDelay: '200ms' }}>
               <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
                  <AdminPaymentMethods />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
