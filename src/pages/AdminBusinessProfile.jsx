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
    <div className={isEmbedded ? "" : "min-h-screen bg-[#FDFDFB] text-gray-900 selection:bg-indigo-100 italic-none"}>
      <div className={isEmbedded ? "" : "p-4 sm:p-10 max-w-[1600px] mx-auto space-y-10"}>
        {!isEmbedded && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fadeUp">
            <PageHeader
              badge="Gestión del Negocio"
              title="Perfil Comercial"
              subtitle={`Gestiona la identidad pública, información de contacto y datos legales de ${activeBrand?.name || 'tu marca'}.`}
            />

            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200/80 px-4 py-2.5 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-100/60">
                   <Icon icon="solar:shop-2-bold" className="text-base" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Marca Activa</p>
                  <p className="text-xs font-bold text-gray-900">{activeBrand?.name || 'Cargando...'}</p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleSaveProfile} 
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:diskette-bold-duotone" className="text-base" />
                    <span>Guardar Todo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 items-start">
          <div className="space-y-6">

            {/* ── Section: Brand Identity ── */}
            <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden animate-fadeUp">
              <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/60">
                  <Icon icon="solar:star-bold-duotone" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Identidad de Marca</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Nombre público y dirección URL única para tu menú digital y códigos QR</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brand Name */}
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Nombre de la Marca
                  </label>
                  <input
                    type="text"
                    value={brandForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej. Alto Andino"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">Nombre principal que identificarán tus clientes en cartas y comandas.</p>
                </div>

                {/* Slug */}
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Slug (URL del menú)
                  </label>
                  <div className="relative">
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all shadow-2xs">
                      <span className="pl-3.5 pr-1 text-xs text-gray-400 font-semibold whitespace-nowrap shrink-0">aluna.app/</span>
                      <input
                        type="text"
                        value={brandForm.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="mi-restaurante"
                        className="flex-1 bg-transparent py-2.5 pr-10 text-sm font-medium text-gray-900 outline-none"
                      />
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
                  <div className="mt-1.5 min-h-[18px]">
                    {slugStatus === 'available' && (
                      <p className="text-[11px] font-semibold text-emerald-600">✓ Slug disponible</p>
                    )}
                    {slugStatus === 'taken' && (
                      <p className="text-[11px] font-semibold text-red-500">✗ Este slug ya está en uso</p>
                    )}
                    {slugStatus === 'idle' && brandForm.slug && (
                      <p className="text-[11px] text-gray-400">Identificador en los códigos QR impresos y enlaces directos</p>
                    )}
                  </div>
                </div>

                {/* URL Preview */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200/70 rounded-xl px-4 py-3">
                    <Icon icon="solar:link-bold" className="text-gray-400 text-base shrink-0" />
                    <span className="text-xs text-gray-500 font-medium">Vista previa del menú:</span>
                    <span className="text-xs font-semibold text-emerald-800 break-all select-all font-mono">
                      {window.location.origin}/#/menu/{brandForm.slug || '...'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Section: Public Information ── */}
            <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden animate-fadeUp" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100/60">
                  <Icon icon="solar:document-text-bold-duotone" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Contacto Público</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Información visible para tus clientes y comunicación de pedidos</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Email Público de Contacto</label>
                    {!profileForm.contact_email && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">Recomendado</span>
                    )}
                  </div>
                  <input
                    type="email"
                    value={profileForm.contact_email}
                    onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })}
                    placeholder="contacto@minegocio.com"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">Correo para soporte o consultas que verán tus comensales.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Teléfono Público / WhatsApp</label>
                    {!profileForm.contact_phone && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">Recomendado</span>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={profileForm.contact_phone}
                    onChange={(e) => setProfileForm({ ...profileForm, contact_phone: e.target.value })}
                    placeholder="+57 300 000 0000"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">Línea directa para confirmaciones de domicilios o reservas.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Ciudad</label>
                    {!profileForm.city && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">Recomendado</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    placeholder="Ej. Bogotá"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">Ciudad principal de operación de la marca.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 block">País</label>
                    {!profileForm.country && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">Recomendado</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileForm.country}
                    onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                    placeholder="Ej. Colombia"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">País para configuración regional y moneda.</p>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Dirección Principal</label>
                    {!profileForm.address && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">Recomendado</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Ej. Calle 123 #45-67, Local 1"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">Dirección de la sede principal o punto de despacho.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Descripción del Negocio</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    placeholder="Escribe una breve descripción de tu propuesta culinaria para que tus comensales te conozcan..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all resize-none min-h-[110px] shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Aparece en la biografía del menú digital y en la landing page del restaurante.</p>
                </div>
              </div>
            </section>

            {/* ── Section: Legal Information ── */}
            <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden animate-fadeUp" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60">
                  <Icon icon="solar:shield-check-bold-duotone" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Información Legal y Tributaria</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Datos tributarios y legales para facturación electrónica y recibos (Opcional)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Razón Social</label>
                  <input
                    type="text"
                    value={profileForm.legal_name}
                    onChange={(e) => setProfileForm({ ...profileForm, legal_name: e.target.value })}
                    placeholder="Ej. Restaurantes del Sur S.A.S."
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">Nombre legal de la persona natural o jurídica propietaria.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Identificación Tributaria (NIT / RUT / RUC)</label>
                  <input
                    type="text"
                    value={profileForm.legal_id}
                    onChange={(e) => setProfileForm({ ...profileForm, legal_id: e.target.value })}
                    placeholder="Ej. 900.000.000-1"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">Número de identificación tributaria para comprobantes fiscales.</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
