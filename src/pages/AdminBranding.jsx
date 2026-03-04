import { useState, useEffect } from 'react';
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
  const [settingsForm, setSettingsForm] = useState({ business_name: '', primary_color: '#7db87a', logo_url: '' });
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

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

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setIsSubmittingBanner(true);
    try {
      let savePayload = { ...currentBanner };
      // Map empty string product_id to null
      if (savePayload.type !== 'product' || !savePayload.product_id) {
        savePayload.product_id = null;
      }

      if (currentBanner.id) {
        ({ error } = await supabase.from('promo_banners').update({
          ...savePayload,
          updated_at: new Date()
        }).eq('id', currentBanner.id));
      } else {
        ({ error } = await supabase.from('promo_banners').insert([savePayload]));
      }
      if (error) throw error;
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
          subtitle="Personaliza la identidad visual y los banners del menú digital."
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
                  className="font-mono text-xs"
                />
              </div>
            </FormField>

            <FormField label="URL del Logo">
              <TextInput
                type="text"
                value={settingsForm.logo_url}
                onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                placeholder="https://tudominio.com/logo.png  o  /img/logo.png"
              />
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

        {/* Banners CRUD */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Banners Promocionales</h3>
              <p className="text-[13px] text-gray-500 mt-0.5">Gestiona los banners que aparecen en el Hero del menú.</p>
            </div>
            {!showBannerForm && (
              <PrimaryButton 
                onClick={() => {
                  setCurrentBanner({ title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '', is_active: true, type: 'info', bg_color: '#2f4131', product_id: '' });
                  setShowBannerForm(true);
                }}
                className="py-1.5 px-4 text-xs"
              >
                Nuevo Banner
              </PrimaryButton>
            )}
          </div>

          <div className="p-8">
            {showBannerForm ? (
              <form onSubmit={handleSaveBanner} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Título">
                    <TextInput 
                      value={currentBanner.title} 
                      onChange={e => setCurrentBanner({...currentBanner, title: e.target.value})}
                      required
                    />
                  </FormField>
                  <FormField label="Subtítulo">
                    <TextInput 
                      value={currentBanner.subtitle} 
                      onChange={e => setCurrentBanner({...currentBanner, subtitle: e.target.value})}
                    />
                  </FormField>
                  <FormField label="URL Imagen">
                    <TextInput 
                      value={currentBanner.image_url} 
                      onChange={e => setCurrentBanner({...currentBanner, image_url: e.target.value})}
                      required
                    />
                  </FormField>
                  <FormField label="Texto CTA (Botón)">
                    <TextInput 
                      value={currentBanner.cta_text} 
                      onChange={e => setCurrentBanner({...currentBanner, cta_text: e.target.value})}
                      placeholder="Ej. Ver Menú"
                    />
                  </FormField>
                  <FormField label="Tipo de Banner">
                    <select
                      value={currentBanner.type || 'info'}
                      onChange={e => setCurrentBanner({...currentBanner, type: e.target.value})}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="info">Informativo</option>
                      <option value="product">Producto (Destacado)</option>
                    </select>
                  </FormField>
                  
                  {currentBanner.type === 'product' && (
                    <FormField label="ID del Producto (Supabase UUID)">
                      <TextInput 
                        value={currentBanner.product_id || ''} 
                        onChange={e => setCurrentBanner({...currentBanner, product_id: e.target.value})}
                        placeholder="Ej. 123e4567-e89b-12d3..."
                      />
                    </FormField>
                  )}

                  <FormField label="Link CTA">
                    <TextInput 
                      value={currentBanner.cta_link} 
                      onChange={e => setCurrentBanner({...currentBanner, cta_link: e.target.value})}
                      placeholder="Ej. /categoria/algo o 'modal:petfriendly'"
                    />
                  </FormField>

                  <FormField label="Color de Fondo">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={currentBanner.bg_color || '#2f4131'}
                        onChange={(e) => setCurrentBanner({ ...currentBanner, bg_color: e.target.value })}
                        className="h-11 w-12 border border-gray-200 rounded-xl cursor-pointer p-1"
                      />
                      <TextInput
                        value={currentBanner.bg_color || '#2f4131'}
                        onChange={(e) => setCurrentBanner({ ...currentBanner, bg_color: e.target.value })}
                        placeholder="#2f4131"
                        className="font-mono text-xs"
                      />
                    </div>
                  </FormField>
                  <div className="flex items-center gap-4 pt-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={currentBanner.is_active} 
                        onChange={e => setCurrentBanner({...currentBanner, is_active: e.target.checked})}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-sm font-medium text-gray-700">Banner Activo</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setShowBannerForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                  <PrimaryButton type="submit" disabled={isSubmittingBanner}>
                    {isSubmittingBanner ? 'Guardando...' : currentBanner.id ? 'Actualizar' : 'Crear'}
                  </PrimaryButton>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {banners.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 italic text-sm">
                    No hay banners configurados.
                  </div>
                ) : (
                  banners.map(banner => (
                    <div key={banner.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/30">
                      <img src={banner.image_url} className="w-24 h-16 object-cover rounded-xl shadow-sm" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{banner.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{banner.subtitle}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setCurrentBanner(banner);
                            setShowBannerForm(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
