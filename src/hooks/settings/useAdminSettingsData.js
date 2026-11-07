import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLocations } from '../../context/LocationContext';
import { useMenuData } from '../../context/MenuDataContext';
import { toast as toastFn } from '../../components/Toast';
import { getFulfillmentModes } from '../../constants/businessTypes';
import { sendTestTelegramNotification, detectTelegramChatId } from '../../utils/telegramNotify';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export function useAdminSettingsData() {
  const { isFeatureLocked, activePlan, activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocations();
  const menuData = useMenuData();
  const locations = menuData?.locations || [];
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

  // Daily Special / Bento del Día config state
  const [bentoProducts, setBentoProducts] = useState([]);
  const [isDailySpecialOpen, setIsDailySpecialOpen] = useState(false);
  const [bentoConfig, setBentoConfig] = useState({
    enabled: true,
    label: 'Plato del Día',
    promo_price: 19500,
    standard_price: 22000,
    schedule: {
      1: 'b0000b11-0000-4000-a000-000000000001',
      2: 'b0000b12-0000-4000-a000-000000000002',
      3: 'b0000b13-0000-4000-a000-000000000003',
      4: 'b0000b14-0000-4000-a000-000000000004',
      5: 'b0000b15-0000-4000-a000-000000000005',
      6: null,
      0: null
    },
    manual_override_product_id: null
  });

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

      // Fallback 2: If searching for all locations and no row with location_id IS NULL exists, find ANY existing row for this brand
      if (!data) {
        const anyRes = await supabase
          .from('restaurant_settings')
          .select('*')
          .eq('brand_id', activeBrand.id)
          .order('location_id', { ascending: true, nullsFirst: true })
          .limit(1)
          .maybeSingle();
        if (anyRes.data) {
          data = anyRes.data;
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

        const bentoConcept = (Array.isArray(effectiveConcepts) && effectiveConcepts.find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')))
          || (Array.isArray(brandLevelRow?.brand_concepts) && brandLevelRow.brand_concepts.find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')))
          || (Array.isArray(data?.brand_concepts) && data.brand_concepts.find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')))
          || null;

        const defaultLabel = activeBrand?.id === 'a63da806-a62a-49b9-a833-07e0976785ad' ? 'El Bento del Día' : 'Plato del Día';

        if (bentoConcept) {
          setBentoConfig({
            enabled: bentoConcept.enabled !== false,
            label: bentoConcept.label || defaultLabel,
            promo_price: bentoConcept.promo_price ?? 19500,
            standard_price: bentoConcept.standard_price ?? 22000,
            schedule: bentoConcept.schedule || {
              1: 'b0000b11-0000-4000-a000-000000000001',
              2: 'b0000b12-0000-4000-a000-000000000002',
              3: 'b0000b13-0000-4000-a000-000000000003',
              4: 'b0000b14-0000-4000-a000-000000000004',
              5: 'b0000b15-0000-4000-a000-000000000005',
              6: null,
              0: null
            },
            manual_override_product_id: bentoConcept.manual_override_product_id || null,
            secondary_product_ids: Array.isArray(bentoConcept.secondary_product_ids) ? bentoConcept.secondary_product_ids : [],
            secondary_schedule: bentoConcept.secondary_schedule || {},
            soup_name: bentoConcept.soup_name || 'Crema de verduras casera (16 oz)',
            drink_name: bentoConcept.drink_name || 'Bebida natural de la Casa (5 oz)'
          });
        } else {
          setBentoConfig(prev => ({
            ...prev,
            label: defaultLabel
          }));
        }
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

      // Fetch all active brand products for Daily Special selector
      if (activeBrand?.id) {
        const { data: bProds } = await supabase
          .from('products')
          .select('id, name, price, is_active, category:categories(name)')
          .eq('brand_id', activeBrand.id)
          .order('name');
        if (bProds) setBentoProducts(bProds);
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
      const singleLocId = (!isAllLocations && activeLocationId)
        ? activeLocationId
        : (locations?.length === 1 ? locations[0].id : null);

      let query = supabase
        .from('business_hours')
        .select('*')
        .eq('brand_id', activeBrand.id);

      if (singleLocId) {
        query = query.eq('location_id', singleLocId);
      } else {
        query = query.is('location_id', null);
      }

      let { data, error } = await query.order('day_of_week', { ascending: true });
      if (error) throw error;

      // Fallback
      if (!data || data.length === 0) {
        const fallbackRes = await supabase
          .from('business_hours')
          .select('*')
          .eq('brand_id', activeBrand.id)
          .order('day_of_week', { ascending: true });
        data = fallbackRes.data || [];
      }

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
        ? settings.brand_concepts.filter(c => c && c.id !== 'operations_model' && c.id !== 'telegram_dispatch' && c.id !== 'bento_del_dia_config')
        : [];

      const bentoConceptToSave = {
        id: 'bento_del_dia_config',
        label: bentoConfig.label?.trim() || (activeBrand?.id === 'a63da806-a62a-49b9-a833-07e0976785ad' ? 'El Bento del Día' : 'Plato del Día'),
        enabled: Boolean(bentoConfig.enabled),
        promo_price: Number(bentoConfig.promo_price) || 0,
        standard_price: Number(bentoConfig.standard_price) || 0,
        schedule: bentoConfig.schedule || {},
        secondary_schedule: bentoConfig.secondary_schedule || {},
        manual_override_product_id: bentoConfig.manual_override_product_id || null,
        secondary_product_ids: bentoConfig.secondary_product_ids || [],
        soup_name: bentoConfig.soup_name || 'Crema de verduras casera (16 oz)',
        drink_name: bentoConfig.drink_name || 'Bebida natural de la Casa (5 oz)'
      };

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
        brand_concepts: [operationsModel, telegramDispatch, bentoConceptToSave, ...currentConcepts],
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
        const { data: existingRow } = await supabase
          .from('restaurant_settings')
          .select('id')
          .eq('brand_id', activeBrand.id)
          .limit(1)
          .maybeSingle();

        if (existingRow?.id) {
          const { data: updateData, error: updateErr } = await supabase
            .from('restaurant_settings')
            .update(payload)
            .eq('id', existingRow.id)
            .select()
            .single();
          error = updateErr;
          if (updateData) setSettings(updateData);
        } else {
          const { data: insertData, error: insertErr } = await supabase
            .from('restaurant_settings')
            .insert(payload)
            .select()
            .single();
          error = insertErr;
          if (insertData) setSettings(insertData);
        }
      }

      if (error) throw error;

      // 1. Keep brand_concepts in sync across ALL rows for this brand
      if (activeBrand?.id) {
        await supabase
          .from('restaurant_settings')
          .update({
            brand_concepts: payload.brand_concepts,
            updated_at: new Date().toISOString()
          })
          .eq('brand_id', activeBrand.id);
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
      const targetLocId = (!isAllLocations && activeLocationId)
        ? activeLocationId
        : (locations?.length === 1 ? locations[0].id : null);

      const toUpdate = [];
      const toInsert = [];

      hours.forEach(h => {
        const payload = {
          brand_id: activeBrand.id,
          location_id: targetLocId,
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

      if (targetLocId && locations?.length === 1) {
        for (const h of hours) {
          await supabase.from('business_hours')
            .update({
              open_time: h.open_time,
              close_time: h.close_time,
              is_closed: h.is_closed,
              updated_at: new Date().toISOString()
            })
            .eq('brand_id', activeBrand.id)
            .is('location_id', null)
            .eq('day_of_week', h.day_of_week);
        }
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

  return {
    isFeatureLocked,
    activePlan,
    activeBrand,
    activeLocationId,
    isAllLocations,
    locations,
    activeTab,
    setActiveTab,
    settings,
    loadingSettings,
    settingsForm,
    setSettingsForm,
    isSubmittingSettings,
    isTestingTelegram,
    isDetectingChatId,
    showTelegramGuide,
    setShowTelegramGuide,
    hours,
    loadingHours,
    isSubmittingHours,
    bentoProducts,
    isDailySpecialOpen,
    setIsDailySpecialOpen,
    bentoConfig,
    setBentoConfig,
    handleSaveSettings,
    handleTestTelegram,
    handleDetectChatId,
    handleUpdateHour,
    handleSaveHours
  };
}
