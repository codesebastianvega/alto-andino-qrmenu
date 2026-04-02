import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, Check, Store, Info, Upload, Palette, Globe } from 'lucide-react';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminBranding({ isEmbedded = false }) {
  const { activePlan } = useAuth();
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase.from('restaurant_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
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

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
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
          .insert([payload])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      if (result.data) setSettings(result.data);

      toast.success('¡Branding guardado correctamente!');
    } catch (err) {
      console.error('Error saving branding:', err);
      toast.error('Error guardando configuración de branding');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const isAdvancedLocked = activePlan?.name === 'Emprendedor';

  const handleFileUpload = async (e, type) => {
    if (type === 'favicon' && isAdvancedLocked) {
        toast.error('Actualiza tu plan para personalizar el favicon');
        return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `landing_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setSettingsForm(prev => ({ ...prev, [`${type}_url`]: publicData.publicUrl }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} subido correctamente`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Error subiendo ${type}`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
      e.target.value = '';
    }
  };

  if (loadingSettings) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className={isEmbedded ? "" : "p-8 max-w-7xl mx-auto space-y-10"}>
      {!isEmbedded && (
        <PageHeader
          badge="Configuración Visual"
          title="Identidad de Marca"
          subtitle="Define cómo ven tus clientes tu menú y landing page."
        >
          <PrimaryButton onClick={handleSaveSettings} disabled={isSubmittingSettings}>
             {isSubmittingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
             Guardar Cambios
          </PrimaryButton>
        </PageHeader>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Forms */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Section: Basic Identity */}
           <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                     <Store size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-900 leading-tight">Identidad del Negocio</h3>
                     <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">Nombre y logotipos principales</p>
                  </div>
               </div>
               {!isEmbedded && (
                   <PrimaryButton onClick={handleSaveSettings} disabled={isSubmittingSettings} className="py-2 px-4 text-xs">
                      {isSubmittingSettings ? 'Guardando...' : 'Guardar Identidad'}
                   </PrimaryButton>
               )}
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FormField label="Nombre Comercial">
                  <TextInput
                    value={settingsForm.business_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, business_name: e.target.value })}
                    placeholder="Ej. Mi Restaurante Gourmet"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <Info size={10} /> Se muestra en la pestaña del navegador y el pie de página.
                  </p>
                </FormField>

                <div className="relative">
                    <FormField label="Favicon (Icono de Pestaña)">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                        <TextInput
                            disabled={isAdvancedLocked}
                            value={settingsForm.favicon_url}
                            onChange={(e) => setSettingsForm({ ...settingsForm, favicon_url: e.target.value })}
                            placeholder={isAdvancedLocked ? "Solo en plan Esencial..." : "URL del icono..."}
                            className="text-xs font-mono"
                        />
                        <label className={`shrink-0 p-2.5 bg-gray-100 rounded-xl transition-colors ${isAdvancedLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer'}`}>
                            {uploadingFavicon ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Upload size={18} className="text-gray-600" />}
                            {!isAdvancedLocked && <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} disabled={uploadingFavicon} />}
                        </label>
                        </div>
                        {settingsForm.favicon_url && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 w-fit">
                            <img src={settingsForm.favicon_url} className="w-6 h-6 object-contain" alt="Favicon" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PREVISUALIZACIÓN</span>
                        </div>
                        )}
                        {isAdvancedLocked && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                <Icon icon="solar:crown-minimalistic-bold" />
                                <span>Requiere Plan Esencial</span>
                            </div>
                        )}
                    </div>
                    </FormField>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-6 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 group">
                 <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Logotipo Principal</p>
                 <div className="relative w-full aspect-video max-h-40 rounded-xl overflow-hidden bg-white border border-gray-100 shadow-inner flex items-center justify-center p-6 group-hover:border-brand-primary/30 transition-colors">
                    {settingsForm.logo_url ? (
                       <img src={settingsForm.logo_url} className="max-w-full max-h-full object-contain drop-shadow-sm" alt="Logo" />
                    ) : (
                       <div className="flex flex-col items-center gap-2 text-gray-300">
                          <Palette size={40} strokeWidth={1} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Sin Logo</span>
                       </div>
                    )}
                 </div>
                 <label className="w-full">
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]">
                       {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                       {settingsForm.logo_url ? 'Cambiar Logotipo' : 'Subir Logotipo'}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} />
                 </label>
              </div>
            </div>
          </section>

          {/* Section: Menu Palette */}
          <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
               <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                  <Palette size={20} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Paleta de Colores</h3>
                  <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">Colores que definen la experiencia del usuario</p>
               </div>
            </div>
            
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                 {/* Main Colors Group */}
                 <div className="space-y-6">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#2f4131] flex items-center gap-2">
                        Principales (Menú)
                        <span className="bg-[#2f4131]/10 text-[#2f4131] text-[8px] px-1.5 py-0.5 rounded-full border border-[#2f4131]/10">Básico</span>
                    </p>
                    <div className="space-y-5">
                       <ColorInput 
                         label="Primario (Botones, Iconos)"
                         value={settingsForm.primary_color}
                         onChange={(val) => setSettingsForm({...settingsForm, primary_color: val})}
                       />
                       <ColorInput 
                         label="Secundario (Incentivos, Ofertas)"
                         value={settingsForm.theme_secondary}
                         onChange={(val) => setSettingsForm({...settingsForm, theme_secondary: val})}
                         disabled={isAdvancedLocked}
                         isPremium={isAdvancedLocked}
                       />
                    </div>
                 </div>

                 {/* Web Colors Group */}
                 <div className="space-y-6 relative group">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#2f4131] flex items-center gap-2">
                        Entorno y Web
                        {isAdvancedLocked && <Icon icon="solar:lock-bold" className="text-amber-500 scale-90" />}
                    </p>
                    <div className={`space-y-5 transition-all ${isAdvancedLocked ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
                       <ColorInput 
                         label="Fondo de Pantalla"
                         value={settingsForm.theme_background}
                         onChange={(val) => setSettingsForm({...settingsForm, theme_background: val})}
                       />
                       <ColorInput 
                         label="Tarjetas y Contenedores"
                         value={settingsForm.theme_card_bg}
                         onChange={(val) => setSettingsForm({...settingsForm, theme_card_bg: val})}
                       />
                    </div>
                    {isAdvancedLocked && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">Requiere Plan Esencial</span>
                        </div>
                    )}
                 </div>

                 <div className="space-y-6 relative group">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#2f4131] flex items-center gap-2">
                        Tipografía y Footer
                        {isAdvancedLocked && <Icon icon="solar:lock-bold" className="text-amber-500 scale-90" />}
                    </p>
                    <div className={`space-y-5 transition-all ${isAdvancedLocked ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
                       <ColorInput 
                         label="Texto Principal"
                         value={settingsForm.theme_text}
                         onChange={(val) => setSettingsForm({...settingsForm, theme_text: val})}
                       />
                       <ColorInput 
                         label="Fondo de Pie de Página"
                         value={settingsForm.theme_footer_bg}
                         onChange={(val) => setSettingsForm({...settingsForm, theme_footer_bg: val})}
                       />
                    </div>
                    {isAdvancedLocked && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
                             <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">Requiere Plan Esencial</span>
                        </div>
                    )}
                 </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Interactive Preview */}
        <div className="xl:col-span-4 sticky top-24 space-y-6">
           <div className="bg-[#0F170F] rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden border-8 border-[#1C2B1E]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-[#1C2B1E] rounded-b-2xl z-10" />
              
              <div 
                className="aspect-[9/19] rounded-[2rem] overflow-hidden flex flex-col transition-all duration-500"
                style={{ backgroundColor: settingsForm.theme_background }}
              >
                 {/* Internal Preview UI */}
                 <div className="p-5 flex justify-center py-8">
                    {settingsForm.logo_url ? (
                       <img src={settingsForm.logo_url} className="h-10 object-contain" alt="Preview logo" />
                    ) : (
                       <span className="text-lg font-black tracking-tighter" style={{ color: settingsForm.theme_text }}>{settingsForm.business_name || 'BRAND'}</span>
                    )}
                 </div>

                 <div className="p-5 space-y-6 flex-1">
                    <div className="h-32 rounded-2xl p-4 flex flex-col justify-end" style={{ backgroundColor: settingsForm.theme_secondary }}>
                       <div className="w-1/2 h-2 bg-white/20 rounded-full" />
                       <div className="w-full h-4 bg-white/40 rounded-full mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                       {[1, 2].map(i => (
                          <div 
                            key={i} 
                            className="aspect-square rounded-2xl shadow-sm p-3 flex flex-col justify-between transition-all"
                            style={{ backgroundColor: settingsForm.theme_card_bg }}
                          >
                             <div className="w-full aspect-square rounded-lg bg-gray-100" />
                             <div className="space-y-1.5 mt-2">
                                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: settingsForm.theme_text + '20' }} />
                                <div className="w-1/2 h-2 rounded-full" style={{ backgroundColor: settingsForm.primary_color }} />
                             </div>
                          </div>
                       ))}
                    </div>

                    <div className="mt-8 flex justify-center">
                       <div 
                        className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10"
                        style={{ backgroundColor: settingsForm.primary_color, color: '#FFFFFF' }}
                      >
                        Hacer Pedido
                      </div>
                    </div>
                 </div>

                 <div className="p-8 text-center" style={{ backgroundColor: settingsForm.theme_footer_bg }}>
                    <div className="w-1/3 h-1 bg-white/10 rounded-full mx-auto" />
                    <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] mt-4">© 2026 {settingsForm.business_name}</p>
                 </div>
              </div>
           </div>

           <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Globe size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-900">Aplicación de Cambios</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Los cambios de color se aplican inmediatamente en tu menú digital y landing page. Asegúrate de mantener un buen contraste para garantizar la legibilidad.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange, disabled = false, isPremium = false }) {
  return (
    <div className={`group relative ${disabled ? 'cursor-not-allowed' : ''}`}>
       <div className="flex items-center justify-between mb-2.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest transition-colors group-focus-within:text-brand-primary">{label}</label>
            {isPremium && (
                <div className="flex items-center gap-1 text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 uppercase tracking-widest">
                    <Icon icon="solar:crown-minimalistic-bold" />
                    PREMIUM
                </div>
            )}
       </div>
       <div className={`flex items-center gap-3 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
          <div className="relative group/picker">
            <input 
              type="color" 
              value={value} 
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-12 rounded-xl border border-gray-100 p-0.5 cursor-pointer appearance-none bg-white shadow-sm hover:shadow-md transition-all active:scale-95"
            />
            <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-black/5" />
          </div>
          <div className="relative flex-1">
             <TextInput 
               value={value} 
               disabled={disabled}
               onChange={(e) => onChange(e.target.value)}
               placeholder="#000000"
               className="font-mono text-xs uppercase pl-4"
             />
             <div 
               className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-black/5" 
               style={{ backgroundColor: value }} 
             />
          </div>
       </div>
    </div>
  );
}
