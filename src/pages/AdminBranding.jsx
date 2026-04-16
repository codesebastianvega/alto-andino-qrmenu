import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2, Upload, Palette, Type } from 'lucide-react';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

const FONT_OPTIONS = [
  { label: 'Inter (Sans Serif)', value: 'Inter' },
  { label: 'Roboto (Moderno)', value: 'Roboto' },
  { label: 'Outfit (Premium)', value: 'Outfit' },
  { label: 'Playfair Display (Elegante)', value: 'Playfair Display' },
  { label: 'Montserrat (Geométrico)', value: 'Montserrat' },
];

export default function AdminBranding({ isEmbedded = false }) {
  const { activeBrand, activePlan, isFeatureLocked } = useAuth();
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
    favicon_url: '',
    font_family: 'Inter'
  });

  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Fetch settings whenever activeBrand changes
  useEffect(() => {
    if (activeBrand?.id) {
      fetchSettings();
    }
  }, [activeBrand?.id]);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
        setSettingsForm({
          business_name: data.business_name || activeBrand.name || '',
          primary_color: data.primary_color || '#7db87a',
          logo_url: data.logo_url || activeBrand.logo_url || '',
          theme_secondary: data.theme_secondary || '#E6B05C',
          theme_background: data.theme_background || '#FAFAFA',
          theme_card_bg: data.theme_card_bg || '#FFFFFF',
          theme_text: data.theme_text || '#1A1A1A',
          theme_footer_bg: data.theme_footer_bg || '#1A2421',
          favicon_url: data.favicon_url || '',
          font_family: data.font_family || 'Inter'
        });
      } else {
        // Initialize form with brand defaults if no settings found
        setSettingsForm(prev => ({
          ...prev,
          business_name: activeBrand.name || '',
          logo_url: activeBrand.logo_url || ''
        }));
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
    if (!activeBrand?.id) return;

    setIsSubmittingSettings(true);
    try {
      const payload = {
        brand_id: activeBrand.id,
        business_name: settingsForm.business_name,
        primary_color: settingsForm.primary_color,
        logo_url: settingsForm.logo_url,
        theme_secondary: settingsForm.theme_secondary,
        theme_background: settingsForm.theme_background,
        theme_card_bg: settingsForm.theme_card_bg,
        theme_text: settingsForm.theme_text,
        theme_footer_bg: settingsForm.theme_footer_bg,
        favicon_url: settingsForm.favicon_url,
        font_family: settingsForm.font_family,
        updated_at: new Date()
      };

      const { data, error } = await supabase
        .from('restaurant_settings')
        .upsert(payload, { onConflict: 'brand_id' })
        .select()
        .single();

      if (error) throw error;
      if (data) setSettings(data);

      toast.success('¡Branding guardado correctamente!');
    } catch (err) {
      console.error('Error saving branding:', err);
      toast.error('Error guardando configuración de branding');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  // Plan gating logic - Lock advanced features for "Emprendedor" plan
  const isLocked = isFeatureLocked('branding');
  // Specifically requested by user: Emprendedor is restricted
  const isEmprendedor = activePlan?.name === 'Emprendedor';
  const isAdvancedLocked = isEmprendedor;

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
      const fileName = `${activeBrand.id}/${type}_${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products') // Using 'products' bucket as per existing code, or 'branding' if preferred
        .upload(filePath, file, { upsert: true });

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
      if (e.target) e.target.value = '';
    }
  };

  if (loadingSettings) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> 
      Cargando configuración...
    </div>
  );

  return (
    <div className={isEmbedded ? "" : "p-4 sm:p-8 max-w-7xl mx-auto space-y-8"}>
      {!isEmbedded && (
        <PageHeader
          badge="Configuración Visual"
          title="Identidad de Marca"
          subtitle={`Ajusta la apariencia visual de ${activeBrand?.name || 'tu marca'}.`}
        >
          <PrimaryButton onClick={handleSaveSettings} disabled={isSubmittingSettings}>
             {isSubmittingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Icon icon="solar:check-read-linear" className="w-4 h-4 mr-2" />}
             Guardar Todo
          </PrimaryButton>
        </PageHeader>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Forms */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Section: Basic Identity */}
           <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                     <Icon icon="solar:shop-2-bold-duotone" width="20" />
                  </div>
                  <div>
                     <h3 className="text-base font-bold text-gray-900 leading-tight">Identidad Visual</h3>
                     <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">Logotipos y Favicon</p>
                  </div>
               </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FormField label="Nombre del Negocio">
                  <TextInput
                    value={settingsForm.business_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, business_name: e.target.value })}
                    placeholder="Ej. Mi Restaurante Gourmet"
                  />
                </FormField>

                <div className="relative">
                    <FormField 
                      label={
                        <div className="flex items-center justify-between w-full">
                          <span>Favicon (Pestaña Navegador)</span>
                          {isAdvancedLocked && (
                            <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1 font-black">
                              <Icon icon="solar:crown-minimalistic-bold" /> PRO
                            </span>
                          )}
                        </div>
                      }
                    >
                    <div className="space-y-3">
                        <div className="flex gap-2">
                        <TextInput
                            disabled={isAdvancedLocked}
                            value={settingsForm.favicon_url}
                            onChange={(e) => setSettingsForm({ ...settingsForm, favicon_url: e.target.value })}
                            placeholder={isAdvancedLocked ? "Incluido en Plan Esencial..." : "URL del favicon..."}
                            className="text-xs font-mono"
                        />
                        <label className={`shrink-0 p-2.5 bg-gray-100 rounded-xl transition-colors ${isAdvancedLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer'}`}>
                            {uploadingFavicon ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Upload size={18} className="text-gray-600" />}
                            {!isAdvancedLocked && <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} disabled={uploadingFavicon} />}
                        </label>
                        </div>
                    </div>
                    </FormField>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-5 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 group">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logotipo Principal</p>
                 <div className="relative w-full aspect-video max-h-32 rounded-xl overflow-hidden bg-white border border-gray-100 shadow-inner flex items-center justify-center p-6 transition-all group-hover:border-brand-primary/30">
                    {settingsForm.logo_url ? (
                       <img src={settingsForm.logo_url} className="max-w-full max-h-full object-contain drop-shadow-sm" alt="Logo" />
                    ) : (
                       <Icon icon="solar:gallery-wide-linear" className="text-gray-200" width="48" />
                    )}
                 </div>
                 <label className="w-full">
                    <div className="flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]">
                       {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Icon icon="solar:upload-linear" width="14" />}
                       {settingsForm.logo_url ? 'Cambiar Logo' : 'Subir Logo'}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} />
                 </label>
              </div>
            </div>
          </section>

          {/* Section: Palette & Fonts */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
               <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Icon icon="solar:cosmetic-linear" width="20" />
               </div>
               <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">Colores y Tipografía</h3>
                  <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">Personalización Avanzada</p>
               </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Typography */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                       <Type size={14} /> Tipografía Principal
                    </p>
                    {isAdvancedLocked && (
                        <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 uppercase font-black">Plan Esencial</span>
                    )}
                 </div>
                 <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 ${isAdvancedLocked ? 'opacity-40 grayscale-[0.5] pointer-events-none' : ''}`}>
                    {FONT_OPTIONS.map((font) => (
                       <button
                         key={font.value}
                         onClick={() => setSettingsForm({...settingsForm, font_family: font.value})}
                         className={`p-3 rounded-xl border text-left transition-all ${
                            settingsForm.font_family === font.value 
                            ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary' 
                            : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'
                         }`}
                         style={{ fontFamily: font.value }}
                       >
                          <div className="flex items-center justify-between">
                             <span className="text-xs font-bold truncate">{font.label.split(' ')[0]}</span>
                             {settingsForm.font_family === font.value && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">ABCabc</p>
                       </button>
                    ))}
                 </div>
              </div>

              <div className="h-px bg-gray-50" />

              {/* Color Grid (2 Columns) */}
              <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Palette size={14} /> Paleta de Colores
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    <ColorInput 
                      label="Color de Énfasis"
                      value={settingsForm.primary_color}
                      onChange={(val) => setSettingsForm({...settingsForm, primary_color: val})}
                    />
                    <ColorInput 
                      label="Color Secundario"
                      value={settingsForm.theme_secondary}
                      onChange={(val) => setSettingsForm({...settingsForm, theme_secondary: val})}
                      disabled={isAdvancedLocked}
                      isPremium={isAdvancedLocked}
                    />
                    <ColorInput 
                      label="Fondo de la App"
                      value={settingsForm.theme_background}
                      onChange={(val) => setSettingsForm({...settingsForm, theme_background: val})}
                      disabled={isAdvancedLocked}
                      isPremium={isAdvancedLocked}
                    />
                    <ColorInput 
                      label="Texto General"
                      value={settingsForm.theme_text}
                      onChange={(val) => setSettingsForm({...settingsForm, theme_text: val})}
                      disabled={isAdvancedLocked}
                      isPremium={isAdvancedLocked}
                    />
                    <ColorInput 
                      label="Tarjetas / Cards"
                      value={settingsForm.theme_card_bg}
                      onChange={(val) => setSettingsForm({...settingsForm, theme_card_bg: val})}
                      disabled={isAdvancedLocked}
                      isPremium={isAdvancedLocked}
                    />
                    <ColorInput 
                      label="Pie de Página"
                      value={settingsForm.theme_footer_bg}
                      onChange={(val) => setSettingsForm({...settingsForm, theme_footer_bg: val})}
                      disabled={isAdvancedLocked}
                      isPremium={isAdvancedLocked}
                    />
                 </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Previsualización */}
        <div className="xl:col-span-4 lg:sticky top-24 space-y-6">
           <div className="bg-[#0F170F] rounded-[3rem] p-3 shadow-2xl relative overflow-hidden border-8 border-[#1C2B1E]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-5 bg-[#1C2B1E] rounded-b-2xl z-20" />
              
              <div 
                className="aspect-[9/18.5] rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-500 relative"
                style={{ backgroundColor: settingsForm.theme_background, fontFamily: settingsForm.font_family }}
              >
                 {/* Internal Preview UI */}
                 <div className="p-6 flex justify-center py-10">
                    {settingsForm.logo_url ? (
                       <img src={settingsForm.logo_url} className="h-10 object-contain" alt="Preview logo" />
                    ) : (
                       <span className="text-base font-black tracking-tighter uppercase" style={{ color: settingsForm.theme_text }}>{settingsForm.business_name || 'BRAND'}</span>
                    )}
                 </div>

                 <div className="px-6 flex-1 space-y-6">
                    <div className="h-28 rounded-2xl p-4 flex flex-col justify-end overflow-hidden relative shadow-sm" style={{ backgroundColor: settingsForm.theme_secondary }}>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                       <div className="relative z-10 space-y-2">
                          <div className="w-1/3 h-1.5 bg-white/30 rounded-full" />
                          <div className="w-full h-3.5 bg-white/50 rounded-full" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       {[1, 2].map(i => (
                          <div 
                            key={i} 
                            className="aspect-[4/5] rounded-2xl shadow-sm p-3 flex flex-col justify-between transition-all border border-gray-100/50"
                            style={{ backgroundColor: settingsForm.theme_card_bg }}
                          >
                             <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-gray-200">
                                <Icon icon="solar:plate-linear" width="24" />
                             </div>
                             <div className="space-y-2 mt-2">
                                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: settingsForm.theme_text + '20' }} />
                                <div className="w-3/4 h-2 rounded-full" style={{ backgroundColor: settingsForm.primary_color }} />
                             </div>
                          </div>
                       ))}
                    </div>

                    <div className="pt-4 flex justify-center">
                       <div 
                        className="px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-transform hover:scale-105 active:scale-95"
                        style={{ backgroundColor: settingsForm.primary_color, color: '#FFFFFF' }}
                      >
                        Hacer Pedido
                      </div>
                    </div>
                 </div>

                 <div className="p-8 text-center" style={{ backgroundColor: settingsForm.theme_footer_bg }}>
                    <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />
                    <p className="text-[7px] text-white/30 uppercase font-black tracking-[0.3em] mt-5">Power by ALUNA</p>
                 </div>
              </div>
           </div>

           <div className="bg-brand-primary/5 rounded-3xl p-6 border border-brand-primary/10">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <Icon icon="solar:magic-stick-3-bold-duotone" width="20" />
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Previsualización Live</h4>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed font-medium">
                      Simulación en tiempo real de tu menú móvil. Recuerda guardar los cambios para aplicarlos.
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
       <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{label}</label>
            {isPremium && (
                <div className="flex items-center gap-1 text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter italic">
                   PRO
                </div>
            )}
       </div>
       <div className={`flex items-center gap-2 ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
          <div className="relative shrink-0">
            <input 
              type="color" 
              value={value} 
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              className="w-11 h-11 rounded-1.5xl border border-gray-100 p-0.5 cursor-pointer appearance-none bg-white shadow-sm hover:shadow-md transition-all active:scale-95"
            />
            <div className="absolute inset-0 rounded-1.5xl pointer-events-none ring-1 ring-inset ring-black/5" />
          </div>
          <div className="relative flex-1">
             <TextInput 
               value={value} 
               disabled={disabled}
               onChange={(e) => onChange(e.target.value)}
               placeholder="#000000"
               className="font-mono text-xs uppercase pl-3 pr-8 !h-11"
             />
             <div 
               className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-black/5 shadow-inner" 
               style={{ backgroundColor: value }} 
             />
          </div>
       </div>
    </div>
  );
}
