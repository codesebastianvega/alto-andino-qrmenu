import React, { useState, useEffect } from 'react';
import AdminStaff from './AdminStaff';
import AdminSedes from './AdminSedes';
import AdminPaymentMethods from './AdminPaymentMethods';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminSettings() {
  const { isFeatureLocked, activePlan, activeBrand } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ 
    whatsapp_number_orders: '',
    is_service_fee_enabled: false,
    service_fee_percentage: 10,
    pay_before_service: false,
    payment_requirement_stage: 'none',
    target_prep_time_mins: 15,
    inactivity_threshold_mins: 30,
    hide_sales_from_staff: false
  });
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  const [hours, setHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [isSubmittingHours, setIsSubmittingHours] = useState(false);

  useEffect(() => {
    if (activeBrand?.id) {
      fetchSettings();
      fetchHours();
    }
  }, [activeBrand?.id]);

  const fetchSettings = async () => {
    if (!activeBrand?.id) return;
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings(data);
        setSettingsForm({
          whatsapp_number_orders: data.whatsapp_number_orders || '',
          is_service_fee_enabled: data.is_service_fee_enabled ?? false,
          service_fee_percentage: data.service_fee_percentage ?? 10,
          pay_before_service: data.pay_before_service ?? false,
          payment_requirement_stage: data.payment_requirement_stage || 'none',
          target_prep_time_mins: data.target_prep_time_mins ?? 15,
          inactivity_threshold_mins: data.inactivity_threshold_mins ?? 30,
          hide_sales_from_staff: data.hide_sales_from_staff ?? false,
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
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      setHours(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar horarios');
    } finally {
      setLoadingHours(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSubmittingSettings(true);
    try {
      const payload = {
        brand_id: activeBrand.id,
        whatsapp_number_orders: settingsForm.whatsapp_number_orders,
        is_service_fee_enabled: settingsForm.is_service_fee_enabled,
        service_fee_percentage: settingsForm.service_fee_percentage,
        pay_before_service: settingsForm.payment_requirement_stage === 'pre_delivery',
        payment_requirement_stage: settingsForm.payment_requirement_stage,
        target_prep_time_mins: settingsForm.target_prep_time_mins,
        inactivity_threshold_mins: settingsForm.inactivity_threshold_mins,
        hide_sales_from_staff: settingsForm.hide_sales_from_staff,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('restaurant_settings')
        .upsert(payload, { onConflict: 'brand_id' });

      if (error) throw error;
      
      toast.success('Configuración guardada');
      fetchSettings();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando configuración');
    } finally {
      setIsSubmittingSettings(false);
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
      const { error } = await supabase.from('business_hours').upsert(
        hours.map(h => ({
          id: h.id, // Include ID for existing rows
          brand_id: activeBrand.id,
          day_of_week: h.day_of_week,
          open_time: h.open_time,
          close_time: h.close_time,
          is_closed: h.is_closed,
          updated_at: new Date()
        })),
        { onConflict: 'brand_id, day_of_week' }
      );
      if (error) throw error;
      toast.success('Horarios actualizados');
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
        <div className="sticky top-6 z-[40] animate-fadeUp" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-center">
            <div className="glass-glow bg-white/80 backdrop-blur-2xl p-1.5 rounded-[2rem] border border-white/60 shadow-2xl shadow-gray-200/50 flex items-center gap-1 min-w-fit">
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
                
                {/* ── WhatsApp Module */}
                <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-50/50 relative overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                        <Icon icon="logos:whatsapp-icon" className="text-3xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Recepción Directa</h3>
                        <p className="text-[12px] text-gray-400 font-medium">WhatsApp donde recibirás las comandas digitales.</p>
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
                      <FormField label="Número de WhatsApp">
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
                           El número debe incluir el prefijo internacional (ej. +57 para Colombia).
                        </p>
                      </FormField>
                    </div>

                    <div className="flex justify-end pt-2">
                      <PrimaryButton type="submit" disabled={isSubmittingSettings} className="rounded-2xl px-10 py-4 shadow-xl shadow-gray-200">
                        {isSubmittingSettings ? 'Sincronizando...' : 'Guardar Configuración'}
                      </PrimaryButton>
                    </div>
                  </form>
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
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${
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
                              className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
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
