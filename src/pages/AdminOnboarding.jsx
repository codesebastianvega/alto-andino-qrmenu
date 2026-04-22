import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { 
  Store, 
  MapPin, 
  Phone, 
  Palette, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Upload, 
  Loader2,
  Globe,
  Zap,
  Briefcase
} from 'lucide-react';

export default function AdminOnboarding() {
  const { activeBrand } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    business_type: 'restaurant',
    whatsapp: '',
    phone: '',
    email: '',
    city: '',
    country: '',
    address: '',
    business_legal_name: '',
    tax_id: '',
    primary_color: '#7db87a',
    logo_url: '',
  });

  useEffect(() => {
    if (activeBrand) {
      setFormData(prev => ({
        ...prev,
        name: activeBrand.name || '',
        slug: activeBrand.slug || '',
        business_type: activeBrand.business_type || 'restaurant',
        whatsapp: activeBrand.whatsapp || '',
        phone: activeBrand.phone || '',
        email: activeBrand.email || '',
        city: activeBrand.city || '',
        country: activeBrand.country || '',
        address: activeBrand.address || '',
        logo_url: activeBrand.logo_url || '',
      }));
    }
  }, [activeBrand]);

  const handleNext = () => {
    // Validación por paso
    if (step === 1) {
      if (!formData.name || !formData.slug || !formData.business_type) {
        setError('Por favor completa todos los campos de Identidad.');
        return;
      }
    } else if (step === 2) {
      if (!formData.whatsapp || !formData.phone || !formData.email || !formData.city || !formData.country || !formData.address) {
        setError('Por favor completa todos los datos obligatorios de Contacto y Ubicación.');
        return;
      }
    }
    setError(null);
    setStep(s => s + 1);
  };
  
  const handleBack = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `brand_logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products') // Using products bucket as it exists
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicData.publicUrl }));
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError('No se pudo subir el logo. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!activeBrand?.id) throw new Error('No hay una marca activa seleccionada');

      // 1. Update Brand
      const { error: brandError } = await supabase
        .from('brands')
        .update({
          name: formData.name,
          slug: formData.slug,
          business_type: formData.business_type,
          whatsapp: formData.whatsapp,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          country: formData.country,
          address: formData.address,
          logo_url: formData.logo_url,
          onboarding_completed: true,
        })
        .eq('id', activeBrand.id);

      if (brandError) throw brandError;

      // 2. Update Restaurant Settings
      const { error: settingsError } = await supabase
        .from('restaurant_settings')
        .update({
          business_name: formData.name,
          business_legal_name: formData.business_legal_name,
          tax_id: formData.tax_id,
          primary_color: formData.primary_color,
          logo_url: formData.logo_url,
        })
        .eq('brand_id', activeBrand.id);

      if (settingsError) throw settingsError;

      // 3. Refresh context
      window.location.reload(); // Hard refresh to clear onboarding state and reload all data
    } catch (err) {
      console.error('Error in onboarding:', err);
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Identidad', icon: Store },
    { id: 2, title: 'Contacto', icon: Phone },
    { id: 3, title: 'Legal', icon: Briefcase },
    { id: 4, title: 'Estilo', icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Configura tu Negocio
          </h1>
          <p className="text-gray-400">Personaliza Aluna para que se adapte a tu marca en pocos minutos.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-10 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div 
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all whitespace-nowrap ${
                  step === s.id 
                    ? 'bg-[#7db87a] text-black font-bold' 
                    : step > s.id 
                      ? 'bg-white/10 text-white' 
                      : 'bg-white/5 text-gray-500'
                }`}
              >
                <s.icon size={16} />
                <span className="text-xs md:text-sm">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className="h-px w-4 md:w-8 bg-white/10 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
              <Loader2 className="w-10 h-10 text-[#7db87a] animate-spin" />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre Comercial *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#7db87a]/50 outline-none transition"
                    placeholder="Ej. Mi Gran Restaurante"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Slug (URL) *</label>
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <Globe size={14} className="text-gray-500 mr-2" />
                    <span className="text-[10px] md:text-xs text-gray-500 mr-1 hidden md:inline">aluna.app/</span>
                    <input 
                      type="text" 
                      value={formData.slug}
                      onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      className="bg-transparent flex-1 text-white outline-none w-full"
                      placeholder="mi-restaurante"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Negocio *</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {['restaurant', 'cafe', 'bakery', 'bar', 'store', 'other'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, business_type: type})}
                      className={`py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                        formData.business_type === type 
                          ? 'border-[#7db87a] bg-[#7db87a]/10 text-[#7db87a]' 
                          : 'border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      {type === 'restaurant' ? 'Rte' : type === 'bakery' ? 'Pan' : type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT & LOCATION */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* WhatsApp */}
                 <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">WhatsApp Pedidos *</label>
                  <input 
                    type="tel" 
                    value={formData.whatsapp}
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#25D366]/50 outline-none transition"
                    placeholder="Ej. +573001234567"
                  />
                  <p className="text-[10px] text-gray-500">Recibirá los pedidos directamente.</p>
                </div>

                {/* Correo */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Correo Público *</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#7db87a]/50 outline-none transition"
                    placeholder="contacto@minegocio.com"
                  />
                </div>
              </div>

               {/* Teléfono Staff */}
               <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Teléfono Secundario (Staff) *</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#7db87a]/50 outline-none transition"
                  placeholder="Teléfono fijo o móvil adicional"
                />
              </div>

              {/* País y Ciudad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">País *</label>
                  <input 
                    type="text" 
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#7db87a]/50 outline-none transition"
                    placeholder="Ej. Colombia"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Ciudad *</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#7db87a]/50 outline-none transition"
                    placeholder="Ej. Bogotá"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                  <MapPin size={14} /> Dirección Completa *
                </label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#7db87a]/50 outline-none transition"
                  placeholder="Ej. Av. Siempre Viva 123, Local 4"
                />
              </div>

            </div>
          )}

          {/* STEP 3: LEGAL INFO (OPTIONAL) */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Información Legal (Opcional)</h3>
                    <p className="text-gray-500 text-xs">Puedes llenar esto después. Es requerido para facturación o trámites formales.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Razón Social</label>
                    <input 
                      type="text" 
                      value={formData.business_legal_name}
                      onChange={e => setFormData({...formData, business_legal_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition"
                      placeholder="Ej. Inversiones Gastronómicas S.A.S."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">NIT / RUT</label>
                    <input 
                      type="text" 
                      value={formData.tax_id}
                      onChange={e => setFormData({...formData, tax_id: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition"
                      placeholder="Ej. 900.123.456-7"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: STYLE */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Logo de tu Marca</label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-8 bg-white/5 transition hover:border-[#7db87a]/50">
                    {formData.logo_url ? (
                      <div className="relative group">
                        <img src={formData.logo_url} alt="Logo" className="h-24 w-24 object-contain rounded-lg" />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition rounded-lg">
                          <Upload size={20} className="text-white" />
                          <input type="file" className="hidden" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer">
                        {uploading ? <Loader2 className="animate-spin text-gray-400 mb-2" /> : <Upload className="text-gray-400 mb-2" />}
                        <span className="text-xs text-gray-500 font-medium">Subir imagen</span>
                        <input type="file" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Color Oficial</label>
                  <p className="text-[10px] text-gray-500 mb-2">Este color definirá los botones de tu menú digital o portal.</p>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={formData.primary_color}
                      onChange={e => setFormData({...formData, primary_color: e.target.value})}
                      className="h-16 w-16 bg-transparent border-none cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className={`h-12 w-full rounded-xl flex items-center justify-center text-[10px] font-bold uppercase shadow-lg text-black`} style={{ backgroundColor: formData.primary_color }}>
                        Vista Previa Botón
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {['#7db87a', '#E6B05C', '#1d4ed8', '#7c3aed', '#f43f5e'].map(c => (
                      <button 
                        key={c}
                        onClick={() => setFormData({...formData, primary_color: c})}
                        className={`h-8 rounded-lg border border-white/10 transition hover:scale-110 ${formData.primary_color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full text-sm font-bold transition ${
                step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ChevronLeft size={18} />
              Atrás
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 md:px-8 py-3 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition"
              >
                Siguiente
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 md:px-8 py-3 bg-[#7db87a] text-black rounded-full text-sm font-bold hover:scale-105 transition"
              >
                Completar <span className="hidden md:inline">Configuración</span>
                <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Brand progress */}
        <p className="mt-6 text-center text-gray-600 text-[10px] font-medium tracking-[0.2em] uppercase">
          Potenciado por Aluna SaaS
        </p>
      </div>
    </div>
  );
}
