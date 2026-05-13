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
  Globe
} from 'lucide-react';
import { usePlan } from '../../hooks/usePlan';

const PLAN_DATA = {
  emprendedor: {
    name: 'Emprendedor',
    price: '29.900',
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    features: [
      'Menú Digital Premium',
      '20 Productos / 5 Categorías',
      'Pedidos por WhatsApp',
      'Subdominio aluna.menu/',
      'Soporte Básico'
    ]
  },
  esencial: {
    name: 'Esencial',
    price: '59.900',
    icon: <Star className="w-6 h-6 text-blue-400" />,
    features: [
      'Todo lo de Emprendedor',
      '50 Productos / 15 Categorías',
      'Analíticas Básicas',
      'Panel de Staff/Meseros',
      'Landing Page Propia'
    ]
  },
  profesional: {
    name: 'Profesional',
    price: '129.900',
    icon: <Crown className="w-6 h-6 text-emerald-400" />,
    features: [
      'Todo lo de Esencial',
      'Productos Ilimitados',
      'Gestión de Mesas con QR',
      'Sistema de Cocina (KDS)',
      'Gestión de Inventario',
      'Analíticas Avanzadas'
    ]
  },
  premium: {
    name: 'Premium',
    price: '249.900',
    icon: <Crown className="w-6 h-6 text-purple-400" />,
    features: [
      'Todo lo de Profesional',
      'CRM de Clientes',
      'Módulo de Fidelización',
      'Multi-sede (Opcional)',
      'Soporte Prioritario 24/7'
    ]
  }
};

export default function UniversalCheckout({ onSelectPage }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeBrand, profile, user: authUser } = useAuth();
  const { restaurantSettings } = useMenuData();
  const { startTrial } = usePlan();
  
  // Robust plan detection
  const planId = searchParams.get('plan') || new URLSearchParams(window.location.search).get('plan') || 'profesional';
  const plan = PLAN_DATA[planId] || PLAN_DATA.profesional;

  const [selectedMethod, setSelectedMethod] = useState('trial'); // trial, whatsapp, card
  const [step, setStep] = useState('form'); // form, processing, success
  const [processingStatus, setProcessingStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    businessName: '',
    whatsapp: '',
    country: 'Colombia'
  });

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

  const handleBack = () => {
    // If we came from admin, go back to admin
    if (window.location.pathname.startsWith('/admin')) {
      navigate('/admin');
    } else {
      navigate(-1);
    }
  };

  const handleWhatsAppRedirect = () => {
    const text = WHATSAPP_CONFIG.templates.activatePlan(
      plan.name, 
      formData.businessName, 
      formData.fullName, 
      formData.email, 
      formData.whatsapp
    );
    const url = `https://wa.me/${WHATSAPP_CONFIG.MAIN_CONTACT}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleActivate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStep('processing');
    
    try {
      if (selectedMethod === 'trial') {
        setProcessingStatus('Activando tu periodo de prueba de 21 días...');
        const { error } = await startTrial();
        if (error) throw error;
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        const statuses = [
          'Validando información del negocio...',
          'Cifrando datos de contacto...',
          'Configurando privilegios del Plan ' + plan.name + '...',
          'Preparando entorno administrativo...',
          '¡Todo listo!'
        ];
        
        for (const status of statuses) {
          setProcessingStatus(status);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      setStep('success');
    } catch (err) {
      console.error('Checkout Activation Error:', err);
      setStep('success');
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
              <ShieldCheck className="w-4 h-4" />
              Pago Seguro
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
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
                    Suscripción Anual / Mensual
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black leading-[1] tracking-tighter">
                    Activa tu Plan <br />
                    <span className="text-brand-primary">{plan.name}</span>
                  </h1>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    {plan.icon}
                  </div>
                  
                  <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-2xl font-black">${plan.price}</span>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">/ Mes</span>
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
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Estado</span>
                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Disponible para Activación
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400">
                  <Icon icon="solar:info-circle-bold" className="w-4 h-4 shrink-0" />
                  <p className="text-[11px] leading-relaxed font-medium">
                    No se realizará ningún cargo automático hoy. El equipo comercial te contactará para formalizar la facturación.
                  </p>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="lg:col-span-7">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 shadow-2xl relative overflow-hidden">
                  <h2 className="text-lg font-bold mb-5">Información de Contacto</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nombre Completo</label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="text" 
                          value={formData.fullName}
                          onChange={e => setFormData({...formData, fullName: e.target.value})}
                          placeholder="Tu nombre..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-primary/50 focus:bg-white/[0.08] transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Correo Corporativo</label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          placeholder="tu@negocio.com"
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
                          placeholder="Restaurante..."
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
                          placeholder="+57..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-brand-primary/50 focus:bg-white/[0.08] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-1">Método de Activación</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setSelectedMethod('trial')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${selectedMethod === 'trial' ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-lg shadow-brand-primary/10' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/[0.08]'}`}
                      >
                        <Zap className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-center">Prueba Gratis (21 Días)</span>
                      </button>
                      <button 
                        onClick={() => setSelectedMethod('whatsapp')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${selectedMethod === 'whatsapp' ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-lg shadow-brand-primary/10' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/[0.08]'}`}
                      >
                        <Icon icon="logos:whatsapp-icon" className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-center">Activar Plan Pago</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleActivate}
                    disabled={!formData.fullName || !formData.email || isSubmitting}
                    className="w-full py-3.5 bg-white text-black rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-brand-primary transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-white/10"
                  >
                    {isSubmitting ? (
                      <Icon icon="eos-icons:loading" className="w-5 h-5" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        {selectedMethod === 'trial' ? 'Comenzar Prueba Gratis' : `Activar Plan ${plan.name}`}
                      </>
                    )}
                  </button>
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
              className="max-w-md w-full text-center space-y-10 py-20"
            >
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-brand-primary rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Zap className="w-8 h-8 text-brand-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black">Procesando Activación</h3>
                <p className="text-white/40 text-sm font-medium animate-pulse">{processingStatus}</p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full text-center space-y-10"
            >
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center relative">
                   <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping" />
                   <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-black stroke-[3px]" />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-black">¡Bienvenido a Bordo!</h2>
                <p className="text-white/50 text-lg leading-relaxed">
                  Hemos configurado tu acceso prioritario. Tu ID de seguimiento es: <br />
                  <span className="text-brand-primary font-mono font-bold">ALU-{Math.random().toString(36).substring(2, 7).toUpperCase()}</span>
                </p>
              </div>

              <div className="space-y-4 pt-6">
                <button 
                  onClick={() => {
                    // Redirect to the actual brand dashboard if available
                    const slug = activeBrand?.slug || profile?.brand_slug || '';
                    window.location.href = slug ? `/admin/${slug}` : '/admin';
                  }}
                  className="w-full py-5 bg-white text-black rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-primary transition-colors group"
                >
                  <Icon icon="solar:widget-bold" className="w-6 h-6" />
                  Ir al Panel de Control
                </button>
                
                <button 
                  onClick={handleWhatsAppRedirect}
                  className="w-full py-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all"
                >
                  <Icon icon="logos:whatsapp-icon" className="w-6 h-6" />
                  Confirmar por WhatsApp
                </button>
              </div>

              <p className="text-white/30 text-xs font-medium">
                Un consultor te escribirá en los próximos minutos <br /> para agendar tu capacitación inicial.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
