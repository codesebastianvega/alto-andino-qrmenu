import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput } from '../components/admin/ui';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminBranding() {
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ business_name: '', primary_color: '#7db87a', logo_url: '' });
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
          business_name: data.business_name || '',
          primary_color: data.primary_color || '#7db87a',
          logo_url: data.logo_url || ''
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar configuración de branding');
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
            business_name: settingsForm.business_name,
            primary_color: settingsForm.primary_color,
            logo_url: settingsForm.logo_url,
            updated_at: new Date()
          })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('restaurant_settings')
          .insert([settingsForm]);
        if (error) throw error;
      }
      toast.success('Branding guardado. Recarga la app para ver los cambios completos.');
      fetchSettings();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando configuración de branding');
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
        title="Branding y Diseño"
        subtitle="Personaliza la identidad visual de tu menú digital."
      />

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm max-w-3xl">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">Identidad del Local</h3>
          <p className="text-[13px] text-gray-500 mt-0.5">Estos datos aparecerán en la cabecera del menú digital del cliente.</p>
        </div>
        
        <form onSubmit={handleSaveSettings} className="p-8 space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            <FormField label="Nombre del Restaurante">
              <TextInput
                value={settingsForm.business_name}
                onChange={(e) => setSettingsForm({ ...settingsForm, business_name: e.target.value })}
                placeholder="Ej. Alto Andino"
                required
              />
            </FormField>
            
            <FormField label="Color Principal">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settingsForm.primary_color}
                  onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                  className="h-11 w-12 border border-gray-200 rounded-xl cursor-pointer p-1"
                />
                <TextInput
                  value={settingsForm.primary_color}
                  onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                  placeholder="#7db87a"
                  className="font-mono"
                />
              </div>
            </FormField>
          </div>

          <FormField label="URL del Logo (Opcional)">
            <TextInput
              type="url"
              value={settingsForm.logo_url}
              onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
              placeholder="https://tudominio.com/logo.png"
            />
            {settingsForm.logo_url && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl inline-block">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Vista Previa</p>
                <img src={settingsForm.logo_url} alt="Logo Preview" className="h-12 object-contain" onError={(e) => e.target.style.display='none'} />
              </div>
            )}
          </FormField>

          <div className="pt-5 border-t border-gray-100 flex justify-end">
            <PrimaryButton 
              type="submit" 
              disabled={isSubmittingSettings}
            >
              {isSubmittingSettings ? 'Guardando...' : 'Guardar Branding'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
