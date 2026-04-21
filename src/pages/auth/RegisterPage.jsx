import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import {
  UserPlus, AlertCircle, Store, Coffee, Cake, Zap,
  ShoppingBag, Grid, ArrowLeft, Mail, Lock, CheckCircle2, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, SpotlightCard, MagneticButton } from '../../components/aluna/animations';

// Plan IDs from DB
const PLAN_IDS = {
  emprendedor: 'c782ae70-f342-448a-81f2-05a5cfd3ed83',
  esencial:    '64b69a3f-cba9-4569-84ea-4154f9fe1e95',
  profesional: 'ed869093-1a43-4bc1-94d6-ed773e1af1df',
  enterprise:  '282dc250-c791-4a7d-a4ab-d0d107fc2550',
};

const PLAN_LABELS = {
  emprendedor: { name: 'Emprendedor', color: '#6B7280' },
  esencial:    { name: 'Esencial',    color: '#2D6A4F' },
  profesional: { name: 'Profesional ⭐', color: '#1d4ed8' },
  enterprise:  { name: 'Enterprise', color: '#7c3aed' },
};

const BUSINESS_TYPES = [
  { value: 'restaurant',   label: 'Restaurante',  Icon: Store },
  { value: 'cafe',         label: 'Cafetería',    Icon: Coffee },
  { value: 'bakery',       label: 'Panadería',    Icon: Cake },
  { value: 'dark_kitchen', label: 'Dark Kitchen', Icon: Zap },
  { value: 'store',        label: 'Tienda',       Icon: ShoppingBag },
  { value: 'other',        label: 'Otro',         Icon: Grid },
];

// Slide animation variants
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center:       ({ x: 0, opacity: 1 }),
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function RegisterPage() {
  const { signUp } = useAuth();

  const getPlanFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('plan') || 'emprendedor';
  };

  const [selectedPlan] = useState(getPlanFromUrl);
  const [step, setStep] = useState(1);       // 1 or 2
  const [direction, setDirection] = useState(1);
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
  const [shake, setShake]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const goNext = (e) => {
    e.preventDefault();
    if (!formData.restaurantName.trim()) {
      setError('Por favor ingresa el nombre de tu negocio.');
      return;
    }
    setError(null);
    setDirection(1);
    setStep(2);
  };

  const goBack = () => {
    setError(null);
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      return setError('Las contraseñas no coinciden.');
    }
    if (formData.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
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

      if (brandError) throw new Error('No se pudo crear el negocio. ' + brandError.message);
      const brandId = brandData.id;

      // 3. Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'owner', brand_id: brandId, full_name: formData.restaurantName })
        .eq('id', user.id);
      if (profileError) console.error('Error actualizando profile:', profileError);

      // 4. Crear restaurant_settings
      const { error: rsError } = await supabase
        .from('restaurant_settings')
        .insert({ brand_id: brandId, business_name: formData.restaurantName });
      if (rsError) console.error('Error creando restaurant_settings:', rsError);

      // 5. Crear home_settings
      const { error: hsError } = await supabase
        .from('home_settings')
        .insert({ brand_id: brandId });
      if (hsError) console.error('Error creando home_settings:', hsError);

      // 6. Crear staff Admin
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

  // ── Background común
  const Background = () => (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img
        src="/assets/images/auth-bg.png"
        alt="Atmosphere"
        className="w-full h-full object-cover scale-110 blur-sm"
      />
      <div className="absolute inset-0 bg-stone-900/50"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/30 via-transparent to-stone-900/40"></div>
    </div>
  );

  // ── Success screen
  if (success) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
        <Background />
        <FadeIn direction="up" className="w-full max-w-md relative z-10">
          <SpotlightCard className="bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-light text-stone-900 mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ¡Bienvenido a Aluna!
            </h2>
            <p className="text-stone-600 mb-2">
              Tu negocio <strong className="text-[#D4A853]">{formData.restaurantName}</strong> ha sido creado.
            </p>
            <p className="text-stone-500 text-sm mb-10 leading-relaxed">
              Hemos enviado un correo de verificación. Activa tu cuenta para comenzar a configurar tu menú digital.
            </p>
            <Link
              to="/login"
              className="w-full group relative flex items-center justify-center gap-2 py-4 bg-stone-900 text-white font-bold rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                Ir a Iniciar Sesión <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </SpotlightCard>
        </FadeIn>
      </div>
    );
  }

  // ── Register wizard
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      <Background />

      <FadeIn direction="up" className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm group font-medium">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a inicio
        </Link>

        {/* Branding */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            <span className="text-4xl text-white tracking-[0.2em] font-light block drop-shadow-md" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ALUNA
            </span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#D4A853] to-transparent mx-auto mt-2"></div>
          </motion.div>
          <h2 className="mt-4 text-xl font-semibold text-white drop-shadow-sm">
            {step === 1 ? 'Crea tu negocio' : 'Tu cuenta de acceso'}
          </h2>
          <p className="mt-1 text-white/60 text-sm">
            {step === 1 ? 'Cuéntanos sobre tu local.' : 'Casi listo — configura tu acceso.'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <motion.div
                animate={{
                  width: s === step ? 32 : 8,
                  backgroundColor: s <= step ? '#D4A853' : 'rgba(255,255,255,0.3)',
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            </div>
          ))}
        </div>

        {/* Plan badge */}
        {planLabel && (
          <div className="flex justify-center mb-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
              style={{ borderColor: `${planLabel.color}50`, backgroundColor: `${planLabel.color}20`, color: planLabel.color }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: planLabel.color }}></div>
              Plan {planLabel.name}
            </div>
          </div>
        )}

        {/* Card */}
        <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
          <SpotlightCard
            className="bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            spotlightColor="rgba(212,168,83,0.08)"
          >
            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl bg-red-50 border border-red-100 p-3 mb-5"
                >
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Steps */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 1 ? (
                  <motion.form
                    key="step1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="space-y-5"
                    onSubmit={goNext}
                  >
                    {/* Nombre del negocio */}
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-2">
                        Nombre de tu Negocio
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                          <Store className="h-4 w-4" />
                        </div>
                        <input
                          name="restaurantName"
                          type="text"
                          required
                          value={formData.restaurantName}
                          onChange={handleChange}
                          className="block w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853] transition-all text-sm"
                          placeholder="Ej: La Postrería de Aluna"
                        />
                      </div>
                    </div>

                    {/* Tipo de negocio */}
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-3">
                        Tipo de Negocio
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {BUSINESS_TYPES.map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFormData({ ...formData, businessType: value })}
                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border text-[10px] uppercase font-bold tracking-tight transition-all ${
                              formData.businessType === value
                                ? 'border-[#D4A853] bg-[#D4A853]/10 text-stone-900 ring-2 ring-[#D4A853]/20'
                                : 'border-stone-200 text-stone-500 hover:border-[#D4A853]/40 hover:text-stone-800 hover:bg-stone-50'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Next button */}
                    <div className="pt-2">
                      <MagneticButton className="w-full">
                        <button
                          type="submit"
                          className="w-full relative group h-12 rounded-2xl bg-stone-900 text-white font-bold text-sm overflow-hidden transition-all active:scale-[0.98] shadow-lg"
                        >
                          <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                          <div className="relative z-10 flex items-center justify-center gap-2">
                            Siguiente <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                      </MagneticButton>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="step2"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="space-y-5"
                    onSubmit={handleSubmit}
                  >
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-2">
                        Correo Electrónico
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#D4A853] transition-colors">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="block w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853] transition-all text-sm"
                          placeholder="hola@tu-negocio.com"
                        />
                      </div>
                    </div>

                    {/* Contraseñas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-2">
                          Contraseña
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#D4A853] transition-colors">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-9 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853] transition-all text-sm"
                            placeholder="••••••••"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-2">
                          Confirmar
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#D4A853] transition-colors">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            name="passwordConfirm"
                            type={showConfirm ? 'text' : 'password'}
                            required
                            value={formData.passwordConfirm}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-9 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853] transition-all text-sm"
                            placeholder="••••••••"
                          />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 transition-colors">
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={goBack}
                        className="flex items-center justify-center gap-1 px-5 py-3 border border-stone-200 rounded-2xl text-stone-600 font-bold text-sm hover:bg-stone-50 hover:border-stone-300 transition-all"
                      >
                        <ArrowLeft className="h-4 w-4" /> Atrás
                      </button>
                      <MagneticButton className="flex-1">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full relative group h-12 rounded-2xl bg-stone-900 text-white font-bold text-sm overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg"
                        >
                          <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                          <div className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? (
                              <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                                Creando...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4" /> Lanzar mi negocio
                              </>
                            )}
                          </div>
                        </button>
                      </MagneticButton>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </SpotlightCard>
        </motion.div>

        <p className="mt-6 text-center text-sm text-white/80">
          ¿Ya eres parte de Aluna?{' '}
          <Link to="/login" className="font-bold text-[#D4A853] hover:text-white transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
