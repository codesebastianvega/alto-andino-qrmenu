import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput } from '../components/admin/ui';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ whatsapp_number_orders: '' });
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  useEffect(() => {
    fetchSettings();
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

  if (loadingSettings) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        badge="Negocio"
        title="Ajustes Generales"
        subtitle="Configura parámetros operativos globales del restaurante."
      />

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm max-w-3xl">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">Configuración de Pedidos</h3>
          <p className="text-[13px] text-gray-500 mt-0.5">Controla a dónde llegan los pedidos de tus clientes.</p>
        </div>

        <form onSubmit={handleSaveSettings} className="p-8 space-y-7">
          <FormField label="WhatsApp de Recepción de Pedidos">
            <TextInput
              value={settingsForm.whatsapp_number_orders}
              onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number_orders: e.target.value })}
              placeholder="Ej. +573001234567"
            />
            <p className="text-xs text-gray-500 mt-2">
              Si se deja vacío, se usará el número configurado en el enviador actual de WhatsApp o en los ajustes básicos. Asegúrate de incluir el código de país (ej. +57).
            </p>
          </FormField>

          <div className="pt-5 border-t border-gray-100 flex justify-end">
            <PrimaryButton 
              type="submit" 
              disabled={isSubmittingSettings}
            >
              {isSubmittingSettings ? 'Guardando...' : 'Guardar Ajustes'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
