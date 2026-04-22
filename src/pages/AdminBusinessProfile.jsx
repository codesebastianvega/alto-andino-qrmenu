import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminBusinessProfile({ isEmbedded = false }) {
  const { activeBrand, refreshProfile, user } = useAuth();
  const [loadingSettings, setLoadingSettings] = useState(false);
  
  const [profileForm, setProfileForm] = useState({ 
    contact_email: '',
    contact_phone: '',
    city: '',
    country: '',
    description: '',
    // Legal fields (ready for future use or mapped to restaurant_settings if exists)
    legal_name: '',
    legal_id: '', // NIT/RUT
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeBrand?.id) {
      fetchProfile();
    }
  }, [activeBrand?.id]);

  const fetchProfile = async () => {
    setLoadingSettings(true);
    try {
      // First try to fetch from brands
      const { data: bData, error } = await supabase
        .from('brands')
        .select('email, phone, city, country, description')
        .eq('id', activeBrand.id)
        .single();

      if (error) throw error;
      
      // Attempt to load settings for legal fields (if they exist there)
      const { data: sData } = await supabase
        .from('restaurant_settings')
        .select('legal_name, legal_id')
        .eq('brand_id', activeBrand.id)
        .maybeSingle();

      setProfileForm({
        contact_email: bData?.email || '',
        contact_phone: bData?.phone || '',
        city: bData?.city || '',
        country: bData?.country || '',
        description: bData?.description || '',
        legal_name: sData?.legal_name || '',
        legal_id: sData?.legal_id || '',
      });
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar el perfil comercial');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!activeBrand?.id) return;

    setIsSubmitting(true);
    try {
      const brandPayload = {
        email: profileForm.contact_email,
        phone: profileForm.contact_phone,
        city: profileForm.city,
        country: profileForm.country,
        description: profileForm.description
      };

      const { error: brandError } = await supabase
        .from('brands')
        .update(brandPayload)
        .eq('id', activeBrand.id);

      if (brandError) throw brandError;
      
      // We also try to update legal info if columns exist in restaurant_settings. 
      // If it fails because columns don't exist, we catch and ignore temporarily 
      // since user said "eventualmente".
      try {
        await supabase.from('restaurant_settings')
          .update({ legal_name: profileForm.legal_name, legal_id: profileForm.legal_id })
          .eq('brand_id', activeBrand.id);
      } catch (e) {
         console.warn("Legal fields not yet implemented in DB", e);
      }

      toast.success('¡Perfil comercial guardado correctamente!');
      if (user) refreshProfile(user.id);
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Error guardando perfil comercial');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSettings) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> 
      Cargando perfil...
    </div>
  );

  return (
    <div className={isEmbedded ? "" : "p-4 sm:p-8 max-w-7xl mx-auto space-y-8"}>
      {!isEmbedded && (
        <PageHeader
          badge="Gestión del Negocio"
          title="Perfil Comercial"
          subtitle={`Gestiona la información pública y legal de ${activeBrand?.name || 'tu marca'}.`}
        >
          <PrimaryButton onClick={handleSaveProfile} disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Icon icon="solar:check-read-linear" className="w-4 h-4 mr-2" />}
             Guardar Todo
          </PrimaryButton>
        </PageHeader>
      )}

      <div className="grid grid-cols-1 gap-8 items-start">
        <div className="space-y-8">
          
          {/* Section: Public Information */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                     <Icon icon="solar:document-text-bold-duotone" width="20" />
                  </div>
                  <div>
                     <h3 className="text-base font-bold text-gray-900 leading-tight">Contacto Público</h3>
                     <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">Información visible para tus clientes</p>
                  </div>
               </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`relative transition-all ${!profileForm.contact_email ? 'bg-red-50/30 p-4 rounded-2xl border border-red-200' : ''}`}>
                  {!profileForm.contact_email && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-100/50 px-2 py-1 rounded-lg">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      Falta
                    </div>
                  )}
                  <FormField label="Email Público de Contacto">
                    <TextInput
                      value={profileForm.contact_email}
                      type="email"
                      onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })}
                      placeholder="contacto@minegocio.com"
                    />
                  </FormField>
                </div>

                <div className={`relative transition-all ${!profileForm.contact_phone ? 'bg-red-50/30 p-4 rounded-2xl border border-red-200' : ''}`}>
                  {!profileForm.contact_phone && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-100/50 px-2 py-1 rounded-lg">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      Falta
                    </div>
                  )}
                  <FormField label="Teléfono Público / WhatsApp">
                    <TextInput
                      value={profileForm.contact_phone}
                      type="tel"
                      onChange={(e) => setProfileForm({ ...profileForm, contact_phone: e.target.value })}
                      placeholder="+57 300 000 0000"
                    />
                  </FormField>
                </div>

                <div className={`relative transition-all ${!profileForm.city ? 'bg-red-50/30 p-4 rounded-2xl border border-red-200' : ''}`}>
                  {!profileForm.city && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-100/50 px-2 py-1 rounded-lg">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      Falta
                    </div>
                  )}
                  <FormField label="Ciudad">
                    <TextInput
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="Ej. Bogotá"
                    />
                  </FormField>
                </div>

                <div className={`relative transition-all ${!profileForm.country ? 'bg-red-50/30 p-4 rounded-2xl border border-red-200' : ''}`}>
                  {!profileForm.country && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-100/50 px-2 py-1 rounded-lg">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      Falta
                    </div>
                  )}
                  <FormField label="País">
                    <TextInput
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      placeholder="Ej. Colombia"
                    />
                  </FormField>
                </div>
                <div className="md:col-span-2 mt-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Descripción Corta</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    placeholder="Escribe una breve descripción de tu negocio para que tus clientes te conozcan..."
                    className="w-full bg-[#f9f9f9] border border-black/5 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all outline-none resize-none min-h-[100px]"
                  />
                </div>
            </div>
          </section>

          {/* Section: Legal Information */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                     <Icon icon="solar:shield-check-bold-duotone" width="20" />
                  </div>
                  <div>
                     <h3 className="text-base font-bold text-gray-900 leading-tight">Información Legal</h3>
                     <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">Datos tributarios y legales (Opcional por ahora)</p>
                  </div>
               </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Razón Social">
                  <TextInput
                    value={profileForm.legal_name}
                    onChange={(e) => setProfileForm({ ...profileForm, legal_name: e.target.value })}
                    placeholder="Ej. Restaurantes del Sur S.A.S."
                  />
                </FormField>

                <FormField label="Identificación Tributaria (NIT / RUT)">
                  <TextInput
                    value={profileForm.legal_id}
                    onChange={(e) => setProfileForm({ ...profileForm, legal_id: e.target.value })}
                    placeholder="Ej. 900.000.000-1"
                  />
                </FormField>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
