import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { WHATSAPP_CONFIG } from '../../config/whatsapp';
import { 
  Check, 
  ArrowLeft, 
  Zap, 
  Star, 
  Crown, 
  ShieldCheck,
  Building2,
  Mail,
  User,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { usePlan } from '../../hooks/usePlan';
import { supabase } from '../../config/supabase';

const IconMap = {
  zap: (className) => <Zap className={className} />,
  star: (className) => <Star className={className} />,
  crown: (className) => <Crown className={className} />,
  'building-2': (className) => <Building2 className={className} />
};

const getCheckoutUIConfig = (name) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('emprendedor')) return { color: '#6B7280', icon: 'zap' };
  if (lowerName.includes('esencial')) return { color: '#2D6A4F', icon: 'star' };
  if (lowerName.includes('profesional')) return { color: '#1d4ed8', icon: 'crown' };
  if (lowerName.includes('premium')) return { color: '#fbbf24', icon: 'crown' };
  if (lowerName.includes('enterprise')) return { color: '#7c3aed', icon: 'building-2' };
  return { color: '#4ade80', icon: 'zap' };
};

export default function UniversalCheckout({ onSelectPage }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeBrand, profile, user: authUser } = useAuth();
  const { restaurantSettings } = useMenuData();
  const { startTrial, trialAlreadyUsed, isTrialActive } = usePlan();
  
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Robust plan detection
  const planParam = searchParams.get('plan') || new URLSearchParams(window.location.search).get('plan');

  const [selectedMethod, setSelectedMethod] = useState(trialAlreadyUsed ? 'whatsapp' : 'trial'); // trial, whatsapp
  const [step, setStep] = useState('form'); // form, processing, success
  const [processingStatus, setProcessingStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    businessName: '',
    whatsapp: '',
    country: 'Colombia'
  });

  // Switch default method if trial already used
  useEffect(() => {
    if (trialAlreadyUsed && selectedMethod === 'trial') {
      setSelectedMethod('whatsapp');
    }
  }, [trialAlreadyUsed]);

  useEffect(() => {
    async function fetchPlan() {
      setLoadingPlan(true);
      try {
        let fetchedData = null;
        if (planParam) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planParam);
          if (isUuid) {
            const { data, error } = await supabase.from('plans').select('*, features:plan_features(*)').eq('id', planParam).maybeSingle();
            if (error) console.error('Supabase query error (UUID):', error);
            fetchedData = data;
          } else {
            const { data, error } = await supabase.from('plans').select('*, features:plan_features(*)').ilike('name', `%${planParam}%`).limit(1);
            if (error) console.error('Supabase query error (ilike):', error);
            fetchedData = data?.[0];
          }
        } else {
          const { data, error } = await supabase.from('plans').select('*, features:plan_features(*)').ilike('name', '%profesional%').limit(1);
          if (error) console.error('Supabase query error (default):', error);
          fetchedData = data?.[0];
        }

        if (fetchedData) {
          const uiConfig = getCheckoutUIConfig(fetchedData.name);
          const formattedFeatures = (fetchedData.features || [])
            .filter(f => f.is_included)
            .sort((a,b) => a.sort_order - b.sort_order)
            .map(f => f.display_name);

          setPlan({
            ...fetchedData,
            features: formattedFeatures,
            price: fetchedData.price_monthly,
            color: uiConfig.color,
            icon: uiConfig.icon
          });
        } else {
          throw new Error("No plan data found in database");
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
        // Fallback Plan
        const isEmprendedor = planParam?.toLowerCase().includes('emprendedor');
        const isPremium = planParam?.toLowerCase().includes('premium');
        
        setPlan({ 
          name: isEmprendedor ? 'Emprendedor' : isPremium ? 'Premium' : 'Profesional', 
          price: isEmprendedor ? 0 : isPremium ? 129000 : 59000, 
          features: ['Menú digital avanzado', 'Panel administrativo', 'Soporte prioritario'], 
          color: isEmprendedor ? '#6B7280' : isPremium ? '#fbbf24' : '#1d4ed8', 
          icon: isEmprendedor ? 'zap' : isPremium ? 'crown' : 'star' 
        });
      } finally {
        setLoadingPlan(false);
      }
    }
    fetchPlan();
  }, [planParam]);

  useEffect(() => {
    // Pre-fill data if user is logged in
    if (authUser || profile || activeBrand || restaurantSettings) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || profile?.full_name || '',
        email: prev.email || authUser?.email || '',
        businessName: prev.businessName || activeBrand?.name || restaurantSettings?.business_name || '',
        whatsapp: prev.whatsapp || profile?.phone || ''
      }));
    }
  }, [authUser, profile, activeBrand, restaurantSettings]);

  const planIcon = plan ? (IconMap[plan.icon]?.(`w-6 h-6`) || <Zap className="w-6 h-6" />) : <Zap className="w-6 h-6" />;

  const handleBack = () => {
    if (window.location.pathname.startsWith('/admin')) {
      navigate('/admin');
    } else {
      navigate(-1);
    }
  };

  const generateWhatsAppMessage = (refCode = '') => {
    const codeTag = refCode ? ` [Ref: ${refCode}]` : '';
    const priceText = plan?.price ? `$${Number(plan.price).toLocaleString()} COP / mes` : 'A convenir';
    return `¡Hola Aluna Soporte! 👋 Quiero activar el Plan *${plan?.name || 'Profesional'}* para mi negocio *${formData.businessName || 'mi restaurante'}*${codeTag}.

📋 *Datos del Restaurante:*
- Titular: ${formData.fullName}
- Correo: ${formData.email}
- WhatsApp: ${formData.whatsapp}
- Plan solicitado: *${plan?.name || 'Profesional'}* (${priceText})

💳 *Coordinación de Pago:*
Por favor envíenme los datos de cuenta (Bancolombia, Nequi, Daviplata o pasarela Wompi) para formalizar el pago y activar mi cuenta de inmediato. ¡Muchas gracias!`;
  };

  const handleWhatsAppRedirect = (refCode = trackingId) => {
    const text = generateWhatsAppMessage(refCode);
    const url = `https://wa.me/${WHATSAPP_CONFIG.MAIN_CONTACT}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleActivate = async () => {
    if (isSubmitting) return;
    setActivationError('');
    setIsSubmitting(true);
    setStep('processing');
    
    try {
      if (selectedMethod === 'trial') {
        if (trialAlreadyUsed) {
          throw new Error('Este negocio ya utilizó su periodo de prueba de 21 días. Elige la opción de Activar Plan con Soporte para coordinar tu suscripción.');
        }

        setProcessingStatus('Activando tu periodo de prueba de 21 días...');
        const { error } = await startTrial();
        if (error) throw error;

        // Log SaaS lead in background
        try {
          await supabase.from('leads').insert({
            name: formData.fullName,
            email: formData.email,
            restaurant_name: formData.businessName,
            phone: formData.whatsapp,
            plan_interest: 'Prueba Gratis (21 Días)',
            status: 'converted',
            source: 'checkout',
            brand_id: null,
            notes: `Prueba de 21 días iniciada desde Checkout para ${formData.businessName}.`
          });
        } catch (leadErr) {
          console.warn('Non-fatal lead insert warning:', leadErr);
        }

        await new Promise(resolve => setTimeout(resolve, 1200));
        setStep('success');
      } else {
        // Assisted Activation / WhatsApp Flow
        setProcessingStatus('Registrando solicitud de activación...');
        const newTrackingId = `ALU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        setTrackingId(newTrackingId);

        // Record lead in Supabase for SuperAdmin to view and track
        try {
          await supabase.from('leads').insert({
            name: formData.fullName,
            email: formData.email,
            restaurant_name: formData.businessName,
            phone: formData.whatsapp,
            plan_interest: plan.name,
            status: 'pending_activation',
            source: 'checkout',
            brand_id: null, // Keep null so it appears in SuperAdmin SaaS Leads dashboard
            notes: `Solicitud de Activación [${newTrackingId}]: Plan ${plan.name} ($${Number(plan.price || 0).toLocaleString()} COP/mes). Titular: ${formData.fullName}. WhatsApp: ${formData.whatsapp}. Esperando coordinación de pago vía Nequi, Daviplata, Bancolombia o Wompi.`
          });
        } catch (leadError) {
          console.warn('Leads recording warning:', leadError);
        }

        setProcessingStatus('Conectando con Soporte Aluna para coordinar el pago...');
        await new Promise(resolve => setTimeout(resolve, 900));

        // Open WhatsApp automatically
        handleWhatsAppRedirect(newTrackingId);

        setStep('success');
      }
    } catch (err) {
      console.error('Checkout Activation Error:', err);
      setActivationError(err?.message || 'No pudimos procesar tu solicitud. Intenta de nuevo o escríbenos a soporte.');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black text-white overflow-y-auto selection:bg-brand-primary selection:text-black">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center p-4 md:p-8">
        {/* Header Navigation */}
        <div className="w-full max-w-5xl flex justify-between items-center mb-8 relative z-10">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-all text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-black" />
            </div>
            <span className="font-black text-xl tracking-tighter">ALUNA</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/40 text-[11px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              Activación Asistida y Segura
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loadingPlan ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center items-center py-20"
            >
              <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
            </motion.div>
          ) : step === 'form' && plan && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Side: Summary */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-2">
                  <span className="text-brand-primary font-black uppercase tracking-widest text-[10px] px-2.5 py-0.5 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                    Suscripción Aluna Restaurantes
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black leading-[1.05] tracking-tighter">
                    Activa tu Plan <br />
                    <span className="text-brand-primary">{plan.name}</span>
                  </h1>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity" style={{ color: plan.color }}>
                    {planIcon}
                  </div>
                  
                  <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-2xl font-black">${plan.price?.toLocaleString()}</span>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">/ Mes COP</span>
                  </div>

                  <ul className="space-y-2.5 mb-5">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-white/60">
                        <div className="w-4 h-4 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-brand-primary" />
                        </div>
                        <span className="text-xs font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Activación</span>
                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Disponible de Inmediato
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed font-medium">
                    <p className="font-bold mb-0.5">Integración Wompi en Proceso</p>
                    <p className="text-white/70">
                      Mientras habilitamos los pagos directos con tarjeta en línea, nuestro equipo de soporte gestiona y activa tu plan vía WhatsApp con <strong>Nequi, Daviplata o Bancolombia</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="lg:col-span-7">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 shadow-2xl relative overflow-hidden">
                  <h2 className="text-lg font-bold mb-5 flex items-center justify-between">
                    <span>Información de tu Restaurante</span>
                    <span className="text-[10px] text-white/40 font-normal">Paso 1 de 2</span>
                  </h2>

                  {activationError && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      <span>{activationError}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nombre del Responsable</label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="text" 
                          value={formData.fullName}
                          onChange={e => setFormData({...formData, fullName: e.target.value})}
                          placeholder="Tu nombre completo..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-primary/50 focus:bg-white/[0.08] transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Correo Electrónico</label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          placeholder="tu@restaurante.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-primary/50 focus:bg-white/[0.08] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nombre del Negocio</label>
                      <div className="relative group">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="text" 
                          value={formData.businessName}
                          onChange={e => setFormData({...formData, businessName: e.target.value})}
                          placeholder="Nombre del restaurante..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-primary/50 focus:bg-white/[0.08] transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">WhatsApp de Contacto</label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="tel" 
                          value={formData.whatsapp}
                          onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                          placeholder="+57 300 000 0000"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-primary/50 focus:bg-white/[0.08] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-1">Modalidad de Activación</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Trial (if available) */}
                      <button 
                        type="button"
                        onClick={() => {
                          if (trialAlreadyUsed) {
                            setActivationError('Este negocio ya utilizó su prueba gratuita de 21 días. Por favor elige Activar Plan con Soporte.');
                            return;
                          }
                          setActivationError('');
                          setSelectedMethod('trial');
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-left relative ${
                          selectedMethod === 'trial' 
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-lg shadow-brand-primary/10' 
                            : trialAlreadyUsed 
                              ? 'bg-white/[0.02] border-white/5 text-white/25 cursor-not-allowed opacity-60' 
                              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wider text-center">
                            Prueba Gratis 21 Días
                          </span>
                        </div>
                        <span className="text-[10px] text-center font-medium opacity-80">
                          {trialAlreadyUsed ? 'Ya disfrutada por este negocio' : 'Sin tarjeta · Acceso inmediato'}
                        </span>
                        {trialAlreadyUsed && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                            Usado
                          </span>
                        )}
                      </button>

                      {/* Option 2: Assisted Activation via Support */}
                      <button 
                        type="button"
                        onClick={() => {
                          setActivationError('');
                          setSelectedMethod('whatsapp');
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-left ${
                          selectedMethod === 'whatsapp' 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon icon="logos:whatsapp-icon" className="w-5 h-5 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wider text-center">
                            Activar Plan con Soporte
                          </span>
                        </div>
                        <span className="text-[10px] text-center font-medium opacity-80">
                          Nequi · Bancolombia · Daviplata
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                          Recomendado
                        </span>
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleActivate}
                    disabled={!formData.fullName || !formData.email || isSubmitting}
                    className="w-full py-4 bg-white text-black rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-brand-primary transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-white/10"
                  >
                    {isSubmitting ? (
                      <Icon icon="eos-icons:loading" className="w-5 h-5" />
                    ) : (
                      <>
                        {selectedMethod === 'trial' ? (
                          <>
                            <Zap className="w-4 h-4 fill-current" />
                            Comenzar Prueba Gratis (21 Días)
                          </>
                        ) : (
                          <>
                            <Icon icon="logos:whatsapp-icon" className="w-4 h-4" />
                            Solicitar Activación Plan {plan.name}
                          </>
                        )}
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-white/30 mt-3">
                    {selectedMethod === 'trial' 
                      ? 'Sin compromisos. Cancela o cambia de plan en cualquier momento.'
                      : 'Un asesor de Aluna (+57 322 228 5900) activará tu suscripción al confirmar el comprobante.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="max-w-md w-full text-center space-y-8 py-20"
            >
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-brand-primary rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                   {selectedMethod === 'trial' ? (
                     <Zap className="w-8 h-8 text-brand-primary animate-pulse" />
                   ) : (
                     <Icon icon="logos:whatsapp-icon" className="w-8 h-8 animate-pulse" />
                   )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">
                  {selectedMethod === 'trial' ? 'Activando Acceso Total' : 'Preparando Activación'}
                </h3>
                <p className="text-white/40 text-sm font-medium animate-pulse">{processingStatus}</p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-lg w-full text-center space-y-6 py-6"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center relative">
                   <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                   <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-7 h-7 text-black stroke-[3px]" />
                   </div>
                </div>
              </div>

              {selectedMethod === 'trial' ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-brand-primary/15 text-brand-primary rounded-full border border-brand-primary/30">
                    21 Días de Acceso Completo
                  </span>
                  <h2 className="text-3xl font-black">¡Prueba Gratuita Activada!</h2>
                  <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto">
                    Tu restaurante ya tiene todas las funcionalidades desbloqueadas. Empieza a configurar tus productos, sedes y domicilios.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/30">
                    Solicitud Registrada con Éxito
                  </span>
                  <h2 className="text-3xl font-black">¡Casi listo! Contacta a Soporte</h2>
                  <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
                    Hemos registrado tu solicitud para el <strong className="text-white">Plan {plan.name}</strong> ({formData.businessName}).
                  </p>
                  {trackingId && (
                    <div className="inline-block px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 font-mono text-xs text-brand-primary font-bold">
                      Referencia: {trackingId}
                    </div>
                  )}
                </div>
              )}

              {selectedMethod === 'whatsapp' && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>Activación Directa por WhatsApp</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Nuestro equipo de soporte (+57 322 228 5900) coordinará contigo el medio de pago (Nequi, Daviplata o Bancolombia) mientras se habilita la pasarela en línea Wompi, y activará tu cuenta de inmediato.
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {selectedMethod === 'whatsapp' ? (
                  <>
                    <button 
                      onClick={() => handleWhatsAppRedirect(trackingId)}
                      className="w-full py-4 bg-emerald-500 text-black hover:bg-emerald-400 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <Icon icon="logos:whatsapp-icon" className="w-5 h-5" />
                      Abrir WhatsApp con Soporte (+57 322 228 5900)
                    </button>
                    
                    <button 
                      onClick={() => {
                        const slug = activeBrand?.slug || profile?.brand_slug || '';
                        window.location.href = slug ? `/${slug}/?admin_page=dashboard#admin` : '/admin';
                      }}
                      className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-white/50" />
                      Ir a mi Panel de Control
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        const slug = activeBrand?.slug || profile?.brand_slug || '';
                        window.location.href = slug ? `/${slug}/?admin_page=dashboard#admin` : '/admin';
                      }}
                      className="w-full py-4 bg-white text-black hover:bg-brand-primary rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      Ir al Panel de Control
                    </button>

                    <button 
                      onClick={() => handleWhatsAppRedirect()}
                      className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Icon icon="logos:whatsapp-icon" className="w-4 h-4" />
                      ¿Tienes dudas? Escríbenos a WhatsApp
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
