/**
 * CompleteProfilePage.jsx
 * 
 * Esta página se muestra cuando un usuario inicia sesión con Google
 * pero aún no tiene un negocio registrado en Aluna.
 * 
 * Flujo:
 * 1. Usuario hace click en "Continuar con Google" en /login
 * 2. Supabase autentica al usuario vía OAuth
 * 3. AuthContext detecta que no tiene brand → needsOnboarding = true
 * 4. App redirige a /completar-registro
 * 5. Este wizard crea el negocio y su marca
 * 6. Redirige al dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import {
  Store, Coffee, Cake, Zap, ShoppingBag, Grid,
  AlertCircle, CheckCircle2, ChevronRight, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, SpotlightCard, MagneticButton } from '../../components/aluna/animations';

const PLAN_IDS = {
  emprendedor: 'c782ae70-f342-448a-81f2-05a5cfd3ed83',
};

const BUSINESS_TYPES = [
  { value: 'restaurant',   label: 'Restaurante',  Icon: Store },
  { value: 'cafe',         label: 'Cafetería',    Icon: Coffee },
  { value: 'bakery',       label: 'Panadería',    Icon: Cake },
  { value: 'dark_kitchen', label: 'Dark Kitchen', Icon: Zap },
  { value: 'store',        label: 'Tienda',       Icon: ShoppingBag },
  { value: 'other',        label: 'Otro',         Icon: Grid },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function CompleteProfilePage() {
  const { user, needsOnboarding, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    // Pre-llenamos si el usuario venía de /registro
    restaurantName: sessionStorage.getItem('aluna_pending_name') || '',
    businessType:   sessionStorage.getItem('aluna_pending_type') || 'restaurant',
  });
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake]   = useState(false);

  // Forzar título de pestaña
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Completar Registro | Aluna";
    return () => { document.title = prevTitle; };
  }, []);

  // Si ya tiene negocio, redirigir al panel
  useEffect(() => {
    if (!needsOnboarding && !loading && user) {
      navigate('/', { replace: true });
    }
  }, [needsOnboarding, loading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.restaurantName.trim()) {
      setError('Por favor ingresa el nombre de tu negocio.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const planId = PLAN_IDS.emprendedor;

      // 1. Crear Brand
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

      // 2. Actualizar perfil
      await supabase
        .from('profiles')
        .update({ role: 'owner', brand_id: brandId, full_name: formData.restaurantName })
        .eq('id', user.id);

      // 3. Crear restaurant_settings
      await supabase.from('restaurant_settings').insert({
        brand_id: brandId,
        business_name: formData.restaurantName,
      });

      // 4. Crear home_settings
      await supabase.from('home_settings').insert({ brand_id: brandId });

      // 5. Crear staff Admin
      await supabase.from('staff').insert({
        name: 'Admin Principal', role: 'admin', pin: '1234', brand_id: brandId,
      });

      setSuccess(true);

      // Limpiar datos temporales del sessionStorage
      sessionStorage.removeItem('aluna_pending_name');
      sessionStorage.removeItem('aluna_pending_type');
      sessionStorage.removeItem('aluna_pending_plan');

      // Refrescar el contexto y redirigir
      await refreshProfile(user.id);
      setTimeout(() => navigate('/', { replace: true }), 2000);

    } catch (err) {
      setError(err.message || 'Error al crear el negocio.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const Background = () => (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img src="/assets/images/auth-bg.png" alt="" className="w-full h-full object-cover scale-110 blur-sm" />
      <div className="absolute inset-0 bg-stone-900/50"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/30 via-transparent to-stone-900/40"></div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        <Background />
        <FadeIn direction="up" className="w-full max-w-md relative z-10">
          <SpotlightCard className="bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-[2.5rem] p-10 text-center shadow-2xl">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-light text-stone-900 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ¡Listo!
            </h2>
            <p className="text-stone-500 text-sm">Tu negocio fue creado. Redirigiendo al panel...</p>
          </SpotlightCard>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      <Background />

      <FadeIn direction="up" className="w-full max-w-md relative z-10">
        {/* Branding */}
        <div className="text-center mb-6">
          <span className="text-4xl text-white tracking-[0.2em] font-light block drop-shadow-md" style={{ fontFamily: "'DM Serif Display', serif" }}>
            ALUNA
          </span>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#D4A853] to-transparent mx-auto mt-2"></div>
          <h2 className="mt-4 text-xl font-semibold text-white drop-shadow-sm">Un último paso</h2>
          <p className="mt-1 text-white/60 text-sm">
            {user?.user_metadata?.full_name ? `Hola, ${user.user_metadata.full_name.split(' ')[0]}! ` : ''}
            Cuéntanos sobre tu negocio.
          </p>
        </div>

        <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
          <SpotlightCard
            className="bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-[2.5rem] p-8 shadow-2xl"
            spotlightColor="rgba(212,168,83,0.08)"
          >
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

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    type="text"
                    required
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
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
                          : 'border-stone-200 text-stone-500 hover:border-[#D4A853]/40 hover:text-stone-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <MagneticButton className="w-full">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group h-12 rounded-2xl bg-stone-900 text-white font-bold text-sm overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg"
                  >
                    <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span> Creando...</>
                      ) : (
                        <>Crear mi negocio <ChevronRight className="h-4 w-4" /></>
                      )}
                    </div>
                  </button>
                </MagneticButton>
              </div>
            </form>
          </SpotlightCard>
        </motion.div>
      </FadeIn>
    </div>
  );
}
