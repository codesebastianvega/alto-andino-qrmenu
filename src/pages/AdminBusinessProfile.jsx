import React, { useState, useEffect, useCallback } from 'react';
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

// Converts any string to a valid URL slug
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')                      // remove non-alphanumeric
    .trim()
    .replace(/[\s_]+/g, '-')                            // spaces → hyphens
    .replace(/-+/g, '-');                               // collapse multiple hyphens
}

export default function AdminBusinessProfile({ isEmbedded = false }) {
  const { activeBrand, refreshProfile, user } = useAuth();
  const [loadingSettings, setLoadingSettings] = useState(false);

  // ─── Brand Identity State ────────────────────────────────────────────────────
  const [brandForm, setBrandForm] = useState({ name: '', slug: '' });
  const [originalSlug, setOriginalSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken'
  const [slugCheckTimeout, setSlugCheckTimeout] = useState(null);
  
  const [profileForm, setProfileForm] = useState({ 
    contact_email: '',
    contact_phone: '',
    city: '',
    country: '',
    address: '',
    description: '',
    legal_name: '',
    legal_id: '',
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
      const { data: bData, error } = await supabase
        .from('brands')
        .select('name, slug, email, phone, city, country, address, description')
        .eq('id', activeBrand.id)
        .single();

      if (error) throw error;

      // Set brand identity
      setBrandForm({ name: bData?.name || '', slug: bData?.slug || '' });
      setOriginalSlug(bData?.slug || '');
      setSlugStatus('idle');
      
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
        address: bData?.address || '',
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

  // ─── Slug availability check (debounced) ────────────────────────────────────
  const checkSlugAvailability = useCallback(async (slug) => {
    if (!slug || slug === originalSlug) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    const { data, error } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', slug)
      .neq('id', activeBrand.id)
      .maybeSingle();
    if (error) { setSlugStatus('idle'); return; }
    setSlugStatus(data ? 'taken' : 'available');
  }, [activeBrand?.id, originalSlug]);

  const handleSlugChange = (raw) => {
    const clean = toSlug(raw);
    setBrandForm(prev => ({ ...prev, slug: clean }));
    setSlugStatus('checking');
    if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
    const t = setTimeout(() => checkSlugAvailability(clean), 600);
    setSlugCheckTimeout(t);
  };

  const handleNameChange = (name) => {
    setBrandForm(prev => ({
      ...prev,
      name,
      // Auto-generate slug only if user hasn't manually changed it yet
      slug: prev.slug === originalSlug ? toSlug(name) : prev.slug,
    }));
    if (brandForm.slug === originalSlug) {
      const autoSlug = toSlug(name);
      if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
      const t = setTimeout(() => checkSlugAvailability(autoSlug), 600);
      setSlugCheckTimeout(t);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!activeBrand?.id) return;

    // Validate brand identity fields
    if (!brandForm.name.trim()) {
      toast.error('El nombre de la marca no puede estar vacío.');
      return;
    }
    if (!brandForm.slug.trim()) {
      toast.error('El slug no puede estar vacío.');
      return;
    }
    if (slugStatus === 'taken') {
      toast.error('Ese slug ya está en uso. Elige uno diferente.');
      return;
    }
    if (slugStatus === 'checking') {
      toast.error('Espera mientras verificamos el slug...');
      return;
    }

    setIsSubmitting(true);
    try {
      const brandPayload = {
        name: brandForm.name.trim(),
        slug: brandForm.slug.trim(),
        email: profileForm.contact_email,
        phone: profileForm.contact_phone,
        city: profileForm.city,
        country: profileForm.country,
        address: profileForm.address,
        description: profileForm.description,
      };

      const { error: brandError } = await supabase
        .from('brands')
        .update(brandPayload)
        .eq('id', activeBrand.id);

      if (brandError) {
        // Handle unique slug violation from DB
        if (brandError.code === '23505') {
          toast.error('Ese slug ya está en uso. Elige uno diferente.');
          setSlugStatus('taken');
          return;
        }
        throw brandError;
      }

      // Update slug tracking state
      setOriginalSlug(brandForm.slug.trim());
      setSlugStatus('idle');

      try {
        await supabase.from('restaurant_settings')
          .update({ legal_name: profileForm.legal_name, legal_id: profileForm.legal_id })
          .eq('brand_id', activeBrand.id);
      } catch (e) {
        console.warn('Legal fields not yet implemented in DB', e);
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
             {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon icon="solar:check-read-linear" className="w-4 h-4" />}
             Guardar Todo
          </PrimaryButton>
        </PageHeader>
      )}

      <div className="grid grid-cols-1 gap-8 items-start">
        <div className="space-y-8">

          {/* ── Section: Brand Identity (NEW) ── */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
              <div className="w-9 h-9 rounded-xl bg-[#2f4131]/10 flex items-center justify-center text-[#2f4131]">
                <Icon icon="solar:star-bold-duotone" width="20" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Identidad de Marca</h3>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">Nombre público y URL del menú QR</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand Name */}
              <div>
                <FormField label="Nombre de la Marca">
                  <TextInput
                    value={brandForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej. Alto Andino"
                  />
                </FormField>
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                  Slug (URL del menú)
                </label>
                <div className="relative">
                  <div className="flex items-center bg-[#f9f9f9] border border-black/5 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#2f4131] transition-all">
                    <span className="pl-4 pr-1 text-xs text-gray-400 font-medium whitespace-nowrap shrink-0">aluna.app/</span>
                    <input
                      type="text"
                      value={brandForm.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="mi-restaurante"
                      className="flex-1 bg-transparent py-3 pr-10 text-sm font-medium text-gray-900 outline-none"
                    />
                    {/* Status icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {slugStatus === 'checking' && (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                      {slugStatus === 'available' && (
                        <Icon icon="solar:check-circle-bold" className="text-emerald-500 text-lg" />
                      )}
                      {slugStatus === 'taken' && (
                        <Icon icon="solar:close-circle-bold" className="text-red-500 text-lg" />
                      )}
                    </div>
                  </div>
                </div>
                {/* Status message */}
                <div className="mt-1.5 min-h-[18px]">
                  {slugStatus === 'available' && (
                    <p className="text-[11px] font-bold text-emerald-600">✓ Slug disponible</p>
                  )}
                  {slugStatus === 'taken' && (
                    <p className="text-[11px] font-bold text-red-500">✗ Este slug ya está en uso</p>
                  )}
                  {slugStatus === 'idle' && brandForm.slug && (
                    <p className="text-[11px] text-gray-400">Sin cambios</p>
                  )}
                </div>
              </div>

              {/* URL Preview */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                  <Icon icon="solar:link-bold" className="text-gray-400 text-base shrink-0" />
                  <span className="text-xs text-gray-400 font-medium">Vista previa del menú:</span>
                  <span className="text-xs font-bold text-[#2f4131] break-all">
                    {window.location.origin}/#/menu/{brandForm.slug || '...'}
                  </span>
                </div>
              </div>
            </div>
          </section>

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

                <div className={`relative transition-all md:col-span-2 ${!profileForm.address ? 'bg-red-50/30 p-4 rounded-2xl border border-red-200' : ''}`}>
                  {!profileForm.address && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-100/50 px-2 py-1 rounded-lg">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      Falta
                    </div>
                  )}
                  <FormField label="Dirección Completa">
                    <TextInput
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Ej. Calle 123 #45-67, Local 1"
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
