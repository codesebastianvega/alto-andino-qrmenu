import { useState, useEffect } from 'react';
import { Loader2, Upload, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../config/supabase';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput } from '../components/admin/ui';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminBranding({ isEmbedded = false }) {
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ 
    business_name: '', 
    primary_color: '#7db87a', 
    logo_url: '',
    theme_secondary: '#E6B05C',
    theme_background: '#FAFAFA',
    theme_card_bg: '#FFFFFF',
    theme_text: '#1A1A1A',
    theme_footer_bg: '#1A2421',
    favicon_url: ''
  });
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [currentBanner, setCurrentBanner] = useState({ title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '', is_active: true, type: 'info', bg_color: '#2f4131', product_id: '' });

  useEffect(() => {
    fetchSettings();
    fetchBanners();
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
          logo_url: data.logo_url || '',
          theme_secondary: data.theme_secondary || '#E6B05C',
          theme_background: data.theme_background || '#FAFAFA',
          theme_card_bg: data.theme_card_bg || '#FFFFFF',
          theme_text: data.theme_text || '#1A1A1A',
          theme_footer_bg: data.theme_footer_bg || '#1A2421',
          favicon_url: data.favicon_url || ''
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar configuración de branding');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar banners');
    } finally {
      setLoadingBanners(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSubmittingSettings(true);
    try {
      const payload = {
        business_name: settingsForm.business_name,
        primary_color: settingsForm.primary_color,
        logo_url: settingsForm.logo_url,
        theme_secondary: settingsForm.theme_secondary,
        theme_background: settingsForm.theme_background,
        theme_card_bg: settingsForm.theme_card_bg,
        theme_text: settingsForm.theme_text,
        theme_footer_bg: settingsForm.theme_footer_bg,
        favicon_url: settingsForm.favicon_url,
        updated_at: new Date()
      };

      let result;
      if (settings?.id) {
        result = await supabase.from('restaurant_settings')
          .update(payload)
          .eq('id', settings.id)
          .select()
          .single();
      } else {
        result = await supabase.from('restaurant_settings')
          .insert([{ ...settingsForm }])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Update local state directly from the returned data — no re-fetch needed
      if (result.data) {
        setSettings(result.data);
        setSettingsForm({
          business_name: result.data.business_name || '',
          primary_color: result.data.primary_color || '#7db87a',
          logo_url: result.data.logo_url || '',
          theme_secondary: result.data.theme_secondary || '#E6B05C',
          theme_background: result.data.theme_background || '#FAFAFA',
          theme_card_bg: result.data.theme_card_bg || '#FFFFFF',
          theme_text: result.data.theme_text || '#1A1A1A',
          theme_footer_bg: result.data.theme_footer_bg || '#1A2421',
          favicon_url: result.data.favicon_url || ''
        });
      }

      toast.success('¡Branding guardado correctamente!');
    } catch (err) {
      console.error('Error saving branding:', err);
      toast.error('Error guardando configuración de branding: ' + (err.message || 'desconocido'));
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `landing_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setSettingsForm(prev => ({ ...prev, logo_url: publicData.publicUrl }));
      toast.success('Logo subido correctamente');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Error subiendo logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon_${Date.now()}.${fileExt}`;
      const filePath = `landing_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setSettingsForm(prev => ({ ...prev, favicon_url: publicData.publicUrl }));
      toast.success('Favicon subido correctamente');
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast.error('Error subiendo favicon');
    } finally {
      setUploadingFavicon(false);
      e.target.value = '';
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setIsSubmittingBanner(true);
    try {
      let savePayload = { ...currentBanner };
      // Map empty string product_id to null
      if (savePayload.type !== 'product' || !savePayload.product_id) {
        savePayload.product_id = null;
      }

      let result;
      if (currentBanner.id) {
        result = await supabase.from('promo_banners').update({
          ...savePayload,
          updated_at: new Date()
        }).eq('id', currentBanner.id);
      } else {
        result = await supabase.from('promo_banners').insert([savePayload]);
      }
      if (result.error) throw result.error;
      toast.success(currentBanner.id ? 'Banner actualizado' : 'Banner creado');
      setShowBannerForm(false);
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar banner');
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar este banner?')) return;
    try {
      const { error } = await supabase.from('promo_banners').delete().eq('id', id);
      if (error) throw error;
      toast.success('Banner eliminado');
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar banner');
    }
  };

  if (loadingSettings) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className={isEmbedded ? "" : "p-8 max-w-7xl mx-auto space-y-8"}>
      {!isEmbedded && (
        <PageHeader
          badge="Negocio"
          title="Branding y Diseño"
          subtitle="Personaliza la identidad visual del menú digital."
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identidad */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm h-fit">
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-base font-semibold text-gray-900">Identidad del Local</h3>
          </div>
          
          <form onSubmit={handleSaveSettings} className="p-8 space-y-7">
            <FormField label="Nombre del Restaurante">
              <TextInput
                value={settingsForm.business_name}
                onChange={(e) => setSettingsForm({ ...settingsForm, business_name: e.target.value })}
                placeholder="Ej. Mi Restaurante"
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
                  className="font-mono text-xs"
                />
              </div>
            </FormField>

            <FormField label="Color Secundario (Destacados)">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settingsForm.theme_secondary}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_secondary: e.target.value })}
                  className="h-11 w-12 border border-gray-200 rounded-xl cursor-pointer p-1"
                />
                <TextInput
                  value={settingsForm.theme_secondary}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_secondary: e.target.value })}
                  placeholder="#E6B05C"
                  className="font-mono text-xs"
                />
              </div>
            </FormField>

            <FormField label="Color de Fondo Web">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settingsForm.theme_background}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_background: e.target.value })}
                  className="h-11 w-12 border border-gray-200 rounded-xl cursor-pointer p-1"
                />
                <TextInput
                  value={settingsForm.theme_background}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_background: e.target.value })}
                  placeholder="#FAFAFA"
                  className="font-mono text-xs"
                />
              </div>
            </FormField>

            <FormField label="Color de Tarjetas / Contenedores">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settingsForm.theme_card_bg}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_card_bg: e.target.value })}
                  className="h-11 w-12 border border-gray-200 rounded-xl cursor-pointer p-1"
                />
                <TextInput
                  value={settingsForm.theme_card_bg}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_card_bg: e.target.value })}
                  placeholder="#FFFFFF"
                  className="font-mono text-xs"
                />
              </div>
            </FormField>

            <FormField label="Color de Texto Principal">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settingsForm.theme_text}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_text: e.target.value })}
                  className="h-11 w-12 border border-gray-200 rounded-xl cursor-pointer p-1"
                />
                <TextInput
                  value={settingsForm.theme_text}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_text: e.target.value })}
                  placeholder="#1A1A1A"
                  className="font-mono text-xs"
                />
              </div>
            </FormField>

            <FormField label="Color de Footer">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settingsForm.theme_footer_bg}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_footer_bg: e.target.value })}
                  className="h-11 w-12 border border-gray-200 rounded-xl cursor-pointer p-1"
                />
                <TextInput
                  value={settingsForm.theme_footer_bg}
                  onChange={(e) => setSettingsForm({ ...settingsForm, theme_footer_bg: e.target.value })}
                  placeholder="#1A2421"
                  className="font-mono text-xs"
                />
              </div>
            </FormField>

            <FormField label="URL del Logo">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <TextInput
                    type="text"
                    value={settingsForm.logo_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                    placeholder="https://tudominio.com/logo.png o /img/logo.png"
                  />
                  <label className={`shrink-0 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadingLogo ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Subir Logo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>
                {settingsForm.logo_url && (
                  <div className="w-fit max-w-[200px] h-20 rounded-xl overflow-hidden border border-gray-200 relative bg-gray-50 flex items-center justify-center p-2">
                     <img src={settingsForm.logo_url} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Favicon (ícono de pestaña)">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <TextInput
                    type="text"
                    value={settingsForm.favicon_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, favicon_url: e.target.value })}
                    placeholder="https://tudominio.com/favicon.png o /favicon.png"
                  />
                  <label className={`shrink-0 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadingFavicon ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    {uploadingFavicon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Subir Favicon</span>
                    <input 
                      type="file" 
                      accept="image/png,image/x-icon,image/svg+xml,image/ico" 
                      className="hidden" 
                      onChange={handleFaviconUpload}
                      disabled={uploadingFavicon}
                    />
                  </label>
                </div>
                {settingsForm.favicon_url && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 relative bg-gray-50 flex items-center justify-center p-1">
                      <img src={settingsForm.favicon_url} alt="Favicon preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <span className="text-xs text-gray-400">Vista previa del favicon</span>
                  </div>
                )}
              </div>
            </FormField>

            <div className="pt-5 border-t border-gray-100 flex justify-end">
              <PrimaryButton 
                type="submit" 
                disabled={isSubmittingSettings}
              >
                {isSubmittingSettings ? 'Guardando...' : 'Guardar'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
