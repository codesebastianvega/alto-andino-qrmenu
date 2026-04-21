import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { UserPlus, AlertCircle, Store, Coffee, Cake, Zap, ShoppingBag, Grid, ArrowLeft, Mail, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, SpotlightCard, MagneticButton } from '../../components/aluna/animations';

// Plan IDs from DB
const PLAN_IDS = {
  emprendedor: 'c782ae70-f342-448a-81f2-05a5cfd3ed83',
  esencial: '64b69a3f-cba9-4569-84ea-4154f9fe1e95',
  profesional: 'ed869093-1a43-4bc1-94d6-ed773e1af1df',
  enterprise: '282dc250-c791-4a7d-a4ab-d0d107fc2550',
};

const PLAN_LABELS = {
  emprendedor: { name: 'Emprendedor', color: '#6B7280', bg: '#F3F4F6' },
  esencial:    { name: 'Esencial', color: '#2D6A4F', bg: '#ECFDF5' },
  profesional: { name: 'Profesional ⭐', color: '#1d4ed8', bg: '#EFF6FF' },
  enterprise:  { name: 'Enterprise', color: '#7c3aed', bg: '#F5F3FF' },
};

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurante', Icon: Store },
  { value: 'cafe',       label: 'Cafetería',   Icon: Coffee },
  { value: 'bakery',     label: 'Panadería',   Icon: Cake },
  { value: 'dark_kitchen', label: 'Dark Kitchen', Icon: Zap },
  { value: 'store',      label: 'Tienda',      Icon: ShoppingBag },
  { value: 'other',      label: 'Otro',        Icon: Grid },
];

export default function RegisterPage() {
  const { signUp } = useAuth();

  // Read plan from URL search query (?plan=profesional)
  const getPlanFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('plan') || 'emprendedor';
  };

  const [selectedPlan] = useState(getPlanFromUrl);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    restaurantName: '',
    businessType: 'restaurant',
  });

  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      return setError('Las contraseñas no coinciden');
    }
    if (formData.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);

    try {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.restaurantName } }
      });

      if (authError) throw authError;
      const user = authData?.user;
      if (!user) throw new Error('Error al registrar usuario');

      // Resolve plan_id
      const planId = PLAN_IDS[selectedPlan] || PLAN_IDS.emprendedor;

      // 2. Crear Brand
      const brandSlug = formData.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .insert({
          name: formData.restaurantName,
          slug: brandSlug,
          owner_id: user.id,
          is_active: true,
          plan_id: planId,
          business_type: formData.businessType,
        })
        .select()
        .single();

      if (brandError) {
        console.error('Error creando brand:', brandError);
        throw new Error('No se pudo crear el negocio. ' + brandError.message);
      }

      const brandId = brandData.id;

      // 3. Actualizar perfil con brand_id y rol owner
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'owner', brand_id: brandId, full_name: formData.restaurantName })
        .eq('id', user.id);

      if (profileError) console.error('Error actualizando profile:', profileError);

      // 4. Crear restaurant_settings por defecto
      const { error: rsError } = await supabase
        .from('restaurant_settings')
        .insert({ brand_id: brandId, business_name: formData.restaurantName });

      if (rsError) console.error('Error creando restaurant_settings:', rsError);

      // 5. Crear home_settings por defecto
      const { error: hsError } = await supabase
        .from('home_settings')
        .insert({ brand_id: brandId });

      if (hsError) console.error('Error creando home_settings:', hsError);

      // 6. Crear staff "Admin Principal" con PIN 1234
      const { error: staffError } = await supabase
        .from('staff')
        .insert({ name: 'Admin Principal', role: 'admin', pin: '1234', brand_id: brandId });

      if (staffError) console.error('Error creando staff:', staffError);

      setSuccess(true);

    } catch (err) {
      setError(err.message || 'Error al completar el registro.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const planLabel = PLAN_LABELS[selectedPlan] || PLAN_LABELS.emprendedor;

  // ── Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#060606] relative flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#1A3A2C,transparent_60%)] opacity-30"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4A853]/10 blur-[120px] rounded-full animate-pulse"></div>
        </div>

        <FadeIn direction="up" className="w-full max-w-md relative z-10">
          <SpotlightCard className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none"></div>
            
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>

            <h2 className="text-3xl font-light text-white mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ¡Bienvenido a Aluna!
            </h2>
            <p className="text-white/60 mb-2">
              Tu negocio <strong className="text-[#D4A853]">{formData.restaurantName}</strong> ha sido creado.
            </p>
            <p className="text-white/40 text-sm mb-10 leading-relaxed">
              Hemos enviado un correo de verificación. Activa tu cuenta para comenzar a configurar tu menú digital.
            </p>

            <Link
              to="/login"
              className="w-full group relative flex items-center justify-center gap-2 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                Ir a Iniciar Sesión <ArrowLeft className="w-4 h-4 rotate-180" />
              </span>
            </Link>
          </SpotlightCard>
        </FadeIn>
      </div>
    );
  }

  // ── Register form
  return (
    <div className="min-h-screen bg-[#060606] relative flex flex-col items-center justify-center p-4 overflow-hidden py-20">
      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#1A3A2C,transparent_60%)] opacity-30"></div>
        <div className="absolute inset-0" style={{ 
          backgroundImage: `linear-gradient(#ffffff03 1px, transparent 1px), linear-gradient(90deg, #ffffff03 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Dynamic Glow Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#D4A853]/10 blur-[150px] rounded-full"
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#2D6A4F]/20 blur-[120px] rounded-full"
        />
      </div>

      <FadeIn direction="up" className="w-full max-w-lg relative z-10">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a inicio
        </Link>

        {/* Branding */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            <span className="text-5xl text-white tracking-[0.2em] font-light block" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ALUNA
            </span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#D4A853] to-transparent mx-auto opacity-60 mt-3"></div>
          </motion.div>
          <h2 className="mt-6 text-2xl font-medium text-white/90">
            Crea tu negocio
          </h2>
          <p className="mt-2 text-white/40 text-sm">
            Estás a un paso de revolucionar tu experiencia gastronómica.
          </p>
        </div>

        {/* Plan Selection Preview */}
        {selectedPlan && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-center"
          >
            <div 
              className="px-6 py-2 rounded-2xl border backdrop-blur-xl flex items-center gap-3"
              style={{ borderColor: `${planLabel.color}40`, backgroundColor: `${planLabel.color}10` }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: planLabel.color }}></div>
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'white' }}>
                Plan {planLabel.name}
              </span>
            </div>
          </motion.div>
        )}

        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <SpotlightCard className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none"></div>
            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 mb-2"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nombre del negocio */}
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2 ml-1">
                  Nombre de tu Negocio
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#D4A853] transition-colors">
                    <Store className="h-4 w-4" />
                  </div>
                  <input
                    name="restaurantName"
                    type="text"
                    required
                    value={formData.restaurantName}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853]/50 transition-all text-sm"
                    placeholder="Ej: La Postrería de Aluna"
                  />
                </div>
              </div>

              {/* Tipo de negocio */}
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-3 ml-1">
                  Tipo de Negocio
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {BUSINESS_TYPES.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, businessType: value })}
                      className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border text-[10px] uppercase font-bold tracking-tight transition-all ${
                        formData.businessType === value
                          ? 'border-[#D4A853] bg-[#D4A853]/10 text-[#D4A853]'
                          : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#D4A853] transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853]/50 transition-all text-sm"
                    placeholder="hola@tu-negocio.com"
                  />
                </div>
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2 ml-1">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#D4A853] transition-colors">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853]/50 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2 ml-1">
                    Confirmar
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#D4A853] transition-colors">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      name="passwordConfirm"
                      type="password"
                      required
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853]/50 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <MagneticButton className="w-full">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group h-14 rounded-2xl bg-white text-[#0A0A0A] font-bold text-sm overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
                      {loading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                          Creando tu imperio...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5" />
                          Lanzar mi negocio gratis
                        </>
                      )}
                    </div>
                  </button>
                </MagneticButton>
              </div>
            </form>
          </SpotlightCard>
        </motion.div>

        <p className="mt-10 text-center text-sm text-white/40">
          ¿Ya eres parte de Aluna?{' '}
          <Link to="/login" className="font-bold text-[#D4A853] hover:text-white transition-colors">
            Inicia sesión aquí
          </Link>
        </p>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-white/20">
          <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Setup instantáneo</span>
          <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Seguridad bancaria</span>
          <span className="flex items-center gap-2"><Coffee className="w-3 h-3" /> Soporte 24/7</span>
        </div>
      </FadeIn>
    </div>
  );
}
