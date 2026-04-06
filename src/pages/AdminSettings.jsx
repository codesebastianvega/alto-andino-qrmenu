import React, { useState, useEffect } from 'react';
import AdminStaff from './AdminStaff';
import AdminSedes from './AdminSedes';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminSettings() {
  const { isFeatureLocked, activePlan, activeBrand } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ 
    whatsapp_number_orders: '',
    is_service_fee_enabled: false,
    service_fee_percentage: 10
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
          service_fee_percentage: data.service_fee_percentage ?? 10
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
  ];

  if (loadingSettings || loadingHours) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F2]">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          badge="Configuración"
          title="Ajustes del Sistema"
          subtitle="Gestiona la operación, sedes y personal de tu marca."
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit shadow-sm overflow-x-auto">
          {TABS.map((tab) => {
            const isLocked = tab.feature && isFeatureLocked(tab.feature);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'bg-[#2f4131] text-white shadow-md shadow-[#2f4131]/20'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon icon={tab.icon} className={`text-lg ${isLocked && activeTab !== tab.id ? 'opacity-40' : ''}`} />
                {tab.label}
                {isLocked && (
                  <div className="ml-1.5 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                    <Icon icon="heroicons:lock-closed" className="text-[10px] text-amber-600" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm h-fit">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Configuración de Pedidos</h3>
                  <p className="text-[12px] text-gray-500 mt-1 font-medium">Control operativo de recepción de pedidos.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="p-8 space-y-7">
                  <FormField label="WhatsApp de Recepción">
                    <TextInput
                      value={settingsForm.whatsapp_number_orders}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number_orders: e.target.value })}
                      placeholder="Ej. +573001234567"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 font-medium italic">Incluye el código de país (ej. +57).</p>
                  </FormField>

                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">Servicio Voluntario (Propina)</h4>
                    <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={settingsForm.is_service_fee_enabled}
                            onChange={(e) => setSettingsForm({ ...settingsForm, is_service_fee_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2f4131]"></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Activar sugerencia de propina</span>
                      </label>

                      {settingsForm.is_service_fee_enabled && (
                        <FormField label="Porcentaje (%)">
                          <TextInput
                            type="number"
                            min="0"
                            max="100"
                            value={settingsForm.service_fee_percentage}
                            onChange={(e) => setSettingsForm({ ...settingsForm, service_fee_percentage: parseInt(e.target.value) || 0 })}
                            className="w-32"
                          />
                        </FormField>
                      )}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-100 flex justify-end">
                    <PrimaryButton type="submit" disabled={isSubmittingSettings} className="rounded-xl px-8 shadow-lg shadow-[#2f4131]/10">
                      {isSubmittingSettings ? 'Guardando...' : 'Guardar Ajustes'}
                    </PrimaryButton>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Horarios</h3>
                    <p className="text-[12px] text-gray-500 mt-1 font-medium">Define tus horas de servicio.</p>
                  </div>
                  <PrimaryButton onClick={handleSaveHours} disabled={isSubmittingHours} className="py-1.5 px-4 text-[11px] rounded-lg">
                    {isSubmittingHours ? 'Guardando...' : 'Guardar'}
                  </PrimaryButton>
                </div>

                <div className="p-8">
                  <div className="space-y-2">
                    {hours.map((h, index) => (
                      <div key={h.day_of_week} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${h.is_closed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
                        <div className="w-20 font-bold text-gray-700 text-[12px] uppercase tracking-wide italic">
                          {getDayName(h.day_of_week)}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="time" value={h.open_time || '08:00'} 
                              onChange={(e) => handleUpdateHour(index, 'open_time', e.target.value)}
                              disabled={h.is_closed}
                              className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-700 focus:ring-1 focus:ring-[#2f4131]/20 outline-none disabled:opacity-30"
                            />
                            <span className="text-gray-300 font-bold">-</span>
                            <input 
                              type="time" value={h.close_time || '22:00'} 
                              onChange={(e) => handleUpdateHour(index, 'close_time', e.target.value)}
                              disabled={h.is_closed}
                              className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-700 focus:ring-1 focus:ring-[#2f4131]/20 outline-none disabled:opacity-30"
                            />
                          </div>
                          <button 
                            onClick={() => handleUpdateHour(index, 'is_closed', !h.is_closed)}
                            className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${h.is_closed ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}
                          >
                            {h.is_closed ? 'Cerrado' : 'Abierto'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'sedes' || activeTab === 'staff') && (
            <div className="relative">
              <div className={isFeatureLocked(activeTab === 'sedes' ? 'multi_location' : 'staff') ? 'blur-sm pointer-events-none grayscale-[0.5] opacity-40' : ''}>
                {activeTab === 'sedes' ? <AdminSedes isEmbedded={true} /> : <AdminStaff isEmbedded={true} />}
              </div>
              
              {isFeatureLocked(activeTab === 'sedes' ? 'multi_location' : 'staff') && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-12 text-center">
                   <div className="bg-white/80 backdrop-blur-md p-10 rounded-[3rem] border border-white shadow-2xl flex flex-col items-center max-w-md ring-1 ring-black/[0.03]">
                      <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-amber-500 mb-6 border border-gray-100 shadow-xl relative scale-110">
                         <Icon icon="heroicons:lock-closed" className="text-4xl" />
                         <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tighter">
                           {activeTab === 'sedes' ? 'Pro' : 'Esencial'}
                         </div>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                        Módulo Bloqueado
                      </h3>
                      <p className="text-sm text-gray-500 mb-8 font-medium leading-relaxed italic">
                        {activeTab === 'sedes' 
                          ? 'La gestión multi-sede requiere el Plan Profesional para escalar tu operación.'
                          : 'Añade meseros y personal de cocina con accesos controlados (requiere Plan Esencial).'}
                      </p>
                      <button 
                        onClick={() => window.open('https://wa.me/573214815152?text=Hola!%20Deseo%20mejorar%20mi%20plan%20en%20Aluna', '_blank')}
                        className="bg-[#2f4131] text-white font-bold py-4 px-10 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-[15px] flex items-center gap-2"
                      >
                        <Icon icon="heroicons:rocket-launch" className="text-lg" />
                        Ver Planes de Mejora
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
