import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput } from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';

// Import sub-pages to use as tabs
import AdminTables from './AdminTables';
import AdminStaff from './AdminStaff';
import AdminBranding from './AdminBranding';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ whatsapp_number_orders: '' });
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  const [hours, setHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [isSubmittingHours, setIsSubmittingHours] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchHours();
  }, []);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase.from('restaurant_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error; // ignore no rows
      if (data) {
        setSettings(data);
        setSettingsForm({
          whatsapp_number_orders: data.whatsapp_number_orders || ''
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
    setLoadingHours(true);
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
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
      if (settings?.id) {
        const { error } = await supabase.from('restaurant_settings')
          .update({
            whatsapp_number_orders: settingsForm.whatsapp_number_orders,
            updated_at: new Date()
          })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('restaurant_settings')
          .insert([{ whatsapp_number_orders: settingsForm.whatsapp_number_orders }]);
        if (error) throw error;
      }
      toast.success('Configuración general guardada');
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
          day_of_week: h.day_of_week,
          open_time: h.open_time,
          close_time: h.close_time,
          is_closed: h.is_closed,
          updated_at: new Date()
        })),
        { onConflict: 'day_of_week' }
      );
      if (error) throw error;
      toast.success('Horarios guardados correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error guardando horarios');
    } finally {
      setIsSubmittingHours(false);
    }
  };

  const getDayName = (day) => {
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return names[day];
  };

  const TABS = [
    { id: 'general', label: 'General', icon: 'heroicons:cog-6-tooth' },
    { id: 'tables', label: 'Mesas', icon: 'heroicons:square-3-stack-3d' },
    { id: 'staff', label: 'Personal', icon: 'heroicons:users' },
    { id: 'branding', label: 'Branding', icon: 'heroicons:paint-brush' },
  ];

  if (loadingSettings || loadingHours) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F2]">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          badge="Configuración"
          title="Ajustes del Sistema"
          subtitle="Gestiona mesas, personal, apariencia y parámetros operativos."
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200 w-fit shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#2f4131] text-white shadow-md shadow-[#2f4131]/20'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon icon={tab.icon} className="text-lg" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Pedidos */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm h-fit">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Configuración de Pedidos</h3>
                  <p className="text-[12px] text-gray-500 mt-1 font-medium">Controla a dónde llegan los pedidos de tus clientes.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="p-8 space-y-7">
                  <FormField label="WhatsApp de Recepción">
                    <TextInput
                      value={settingsForm.whatsapp_number_orders}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number_orders: e.target.value })}
                      placeholder="Ej. +573001234567"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                      Asegúrate de incluir el código de país (ej. +57).
                    </p>
                  </FormField>

                  <div className="pt-5 border-t border-gray-100 flex justify-end">
                    <PrimaryButton 
                      type="submit" 
                      disabled={isSubmittingSettings}
                      className="rounded-xl px-8"
                    >
                      {isSubmittingSettings ? 'Guardando...' : 'Guardar Ajustes'}
                    </PrimaryButton>
                  </div>
                </form>
              </div>

              {/* Horarios */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Horarios de Atención</h3>
                    <p className="text-[12px] text-gray-500 mt-1 font-medium">Define tus horas de servicio al público.</p>
                  </div>
                  <PrimaryButton 
                    onClick={handleSaveHours}
                    disabled={isSubmittingHours}
                    className="py-1.5 px-4 text-[11px] rounded-lg"
                  >
                    {isSubmittingHours ? 'Guardando...' : 'Guardar Horarios'}
                  </PrimaryButton>
                </div>

                <div className="p-8">
                  <div className="space-y-3">
                    {hours.map((h, index) => (
                      <div key={h.day_of_week} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${h.is_closed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm hover:border-[#7db87a]/30'}`}>
                        <div className="w-24 font-bold text-gray-700 text-[13px] uppercase tracking-wide">
                          {getDayName(h.day_of_week)}
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <input 
                              type="time" 
                              value={h.open_time || '08:00'} 
                              onChange={(e) => handleUpdateHour(index, 'open_time', e.target.value)}
                              disabled={h.is_closed}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#7db87a]/20 outline-none disabled:opacity-30"
                            />
                            <span className="text-gray-300 font-bold">-</span>
                            <input 
                              type="time" 
                              value={h.close_time || '22:00'} 
                              onChange={(e) => handleUpdateHour(index, 'close_time', e.target.value)}
                              disabled={h.is_closed}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#7db87a]/20 outline-none disabled:opacity-30"
                            />
                          </div>

                          <button 
                            onClick={() => handleUpdateHour(index, 'is_closed', !h.is_closed)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                              h.is_closed 
                                ? 'bg-red-50 border-red-100 text-red-600 font-black' 
                                : 'bg-green-50 border-green-100 text-green-600 font-black'
                            } text-[10px] uppercase tracking-wider`}
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

          {activeTab === 'tables' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AdminTables isEmbedded={true} />
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AdminStaff isEmbedded={true} />
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AdminBranding isEmbedded={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
