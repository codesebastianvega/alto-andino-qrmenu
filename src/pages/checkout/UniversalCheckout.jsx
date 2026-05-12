import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { supabase } from '../../config/supabase';
import { 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Star, 
  Crown, 
  Loader2, 
  Globe, 
  Phone,
  User,
  Mail,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

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

export default function UniversalCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeBrand, profile, user: authUser, refreshProfile } = useAuth();
  const { restaurantSettings } = useMenuData();
  
  const planId = searchParams.get('plan') || 'profesional';
  const plan = PLAN_DATA[planId] || PLAN_DATA.profesional;

  const [selectedMethod, setSelectedMethod] = useState('whatsapp'); // whatsapp, card
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

  // Auto-redirect effect when reaching success step
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        handleWhatsAppRedirect();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const statuses = [
    'Validando información del negocio...',
    'Cifrando datos de contacto...',
    'Configurando privilegios del Plan ' + plan.name + '...',
    'Preparando entorno administrativo...',
    '¡Todo listo!'
  ];

  const handleActivate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStep('processing');
    
    try {
      // "Mago de Oz" Activation Logic: UI ONLY
      // No DB mutations as per instructions.
      
      // Simulate high-end processing for UX
      for (const status of statuses) {
        setProcessingStatus(status);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setStep('success');
    } catch (err) {
      console.error('Checkout Activation Error:', err);
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const ownerName = formData.fullName || profile?.full_name || 'Nuevo Usuario';
    const brandName = formData.businessName;
    const bId = activeBrand?.id || 'Nuevo Registro';
    const planName = plan.name;
    const email = formData.email;
    const transactionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const message = `¡Hola! Soy ${ownerName} (${email}) de ${brandName}. Acabo de activar el Plan ${planName} (Prueba 21 días). \n\nID Transacción: ${transactionId}\nID Marca: ${bId}\n\nPor favor, ayúdenme con la configuración final.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/573024564817?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const isFormValid = formData.businessName && formData.whatsapp && formData.fullName && formData.email;

  return (
    <div className="min-h-screen bg-[#0A0F0A] text-white flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-brand-primary selection:text-black">
      
      {/* --- SIDEBAR SUMMARY (LEFT) --- */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="lg:w-[40%] bg-gradient-to-br from-[#0F170F] to-[#050805] p-8 lg:p-12 flex flex-col justify-between border-r border-white/5 relative overflow-hidden"
      >
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/10 blur-[140px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[140px] rounded-full" />
        </div>

        <div className="relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-all mb-12 text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver a planes
          </button>

          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Checkout Seguro & Encriptado
            </div>

            <div className="space-y-3">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  {step === 'success' ? '¡Activación Exitosa!' : <>Activa tu Plan <br /><span className="text-brand-primary drop-shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.3)]">{plan.name}</span></>}
                </h1>
              </motion.div>
              <p className="text-white/50 text-lg leading-relaxed">
                {step === 'success' 
                  ? 'Tu período de prueba ha comenzado. Bienvenido a la elite de la gastronomía digital.' 
                  : 'Estás a un paso de transformar la gestión de tu restaurante.'}
              </p>
            </div>

            <div className="py-8 border-y border-white/5 space-y-5">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">${plan.price}</span>
                <span className="text-white/40 text-sm font-medium uppercase tracking-widest">/ mes (COP)</span>
              </div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 rounded-[24px] shadow-lg shadow-emerald-950/20"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black block">PROMO DE LANZAMIENTO</span>
                  <span className="text-xs text-emerald-400/80">Incluye 21 días de prueba Full Access sin costo</span>
                </div>
              </motion.div>
            </div>

            <div className="space-y-6 pt-4">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Experiencia {plan.name} Incluye:</p>
              <ul className="grid grid-cols-1 gap-3">
                {plan.features.map((feature, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Check className="w-4 h-4 text-brand-primary" />
                    </div>
                    <span className="text-[13px] font-medium text-white/80">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Testimonial or Trust phrase */}
            <div className="pt-8 border-t border-white/5">
                <div className="flex gap-1 text-amber-500 mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <p className="text-sm italic text-white/40 leading-relaxed">
                    "La mejor inversión para mi restaurante. El soporte es increíble y la interfaz es de otro planeta."
                </p>
                <p className="text-[10px] font-bold text-brand-primary mt-2 uppercase tracking-wider">— Chef Carlos, Aluna Bistro</p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group overflow-hidden">
               <motion.img 
                whileHover={{ scale: 1.1, rotate: 5 }}
                src="/logoalto.png" 
                alt="Aluna" 
                className="w-9 h-9 object-contain filter brightness-0 invert opacity-60 group-hover:opacity-100 transition-opacity" 
               />
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Respaldo tecnológico</p>
              <p className="text-sm font-bold text-white/90">Aluna | Restaurantes de Nueva Generación</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- CONTENT SECTION (RIGHT) --- */}
      <div className="flex-1 bg-[#0A0F0A] p-8 lg:p-24 flex items-center justify-center relative overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div 
              key="form"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="max-w-2xl w-full space-y-10 relative z-10 py-12 lg:py-0"
            >
              <div className="space-y-2">
                <h2 className="text-4xl lg:text-5xl font-black tracking-tight">Finaliza tu registro</h2>
                <p className="text-white/50 text-lg">Personaliza tu cuenta y activa tu panel administrativo.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* User Data */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Información del Negocio</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-1">Tu Nombre</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="text" 
                          placeholder="Sebastian Vega"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-brand-primary/40 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-1">Nombre del Restaurante</label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="text" 
                          placeholder="Aluna Bistro"
                          value={formData.businessName}
                          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-brand-primary/40 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-1">Email Corporativo</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="email" 
                          placeholder="tu@negocio.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-brand-primary/40 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-1">WhatsApp de contacto</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="tel" 
                          placeholder="+57 300..."
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-brand-primary/40 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-1">País de operación</label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                        <select 
                          value={formData.country}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-brand-primary/40 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="Colombia" className="bg-[#0A0F0A]">Colombia</option>
                          <option value="Global" className="bg-[#0A0F0A]">Global / Otro</option>
                        </select>
                        <Icon icon="solar:alt-arrow-down-linear" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Método de Activación</h3>
                  
                  <div className="space-y-4">
                    {/* WhatsApp Option (Selected) */}
                    <div 
                      onClick={() => setSelectedMethod('whatsapp')}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedMethod === 'whatsapp' 
                          ? 'bg-emerald-500/10 border-emerald-500/50' 
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMethod === 'whatsapp' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40'}`}>
                             <Icon icon="logos:whatsapp-icon" className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Activar vía WhatsApp</p>
                            <p className="text-[10px] text-white/40">Soporte personalizado 24/7</p>
                          </div>
                        </div>
                        {selectedMethod === 'whatsapp' && <Check className="w-5 h-5 text-emerald-500" />}
                      </div>
                    </div>

                    {/* Credit Card Option (Disabled/Coming Soon) */}
                    <div className="relative group">
                        <div className="absolute -top-2 -right-2 z-20 px-2 py-0.5 bg-brand-primary text-black text-[8px] font-black rounded-full shadow-lg">PRÓXIMAMENTE</div>
                        <div className="p-5 rounded-2xl border-2 border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed overflow-hidden relative">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                                    <Icon icon="solar:card-2-bold" className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Tarjeta de Crédito / Débito</p>
                                    <p className="text-[10px] text-white/40">Pago automático recurrente</p>
                                </div>
                            </div>
                            {/* Glassmorphism card mockup */}
                            <div className="mt-4 h-12 bg-gradient-to-r from-white/5 to-white/10 rounded-xl flex items-center px-4 gap-2 border border-white/5">
                                <div className="w-8 h-4 bg-white/10 rounded" />
                                <div className="w-12 h-4 bg-white/10 rounded" />
                                <div className="flex-1" />
                                <div className="w-8 h-8 bg-white/10 rounded-full" />
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-6 pt-4">
                <motion.button 
                    whileHover={isFormValid ? { scale: 1.01, y: -2 } : {}}
                    whileTap={isFormValid ? { scale: 0.99 } : {}}
                    onClick={handleActivate}
                    disabled={isSubmitting || !isFormValid}
                    className={`w-full py-5 rounded-[24px] font-black text-lg flex flex-col items-center justify-center transition-all relative overflow-hidden group/btn ${
                    !isFormValid 
                        ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                        : 'bg-white text-black shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)]'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {isSubmitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Icon icon="logos:whatsapp-icon" className="w-6 h-6" />
                                <span>Activar Prueba de 21 Días</span>
                            </>
                        )}
                    </div>
                    {!isSubmitting && <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Sincronizar con Soporte Aluna</span>}
                </motion.button>

                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-6 opacity-30 grayscale contrast-125">
                        <Icon icon="logos:visa" className="h-4" />
                        <Icon icon="logos:mastercard" className="h-6" />
                        <Icon icon="logos:stripe" className="h-6" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Pagos procesados por Stripe & Wompi (Próximamente)
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              className="text-center space-y-8"
            >
              <div className="relative flex justify-center">
                <div className="w-24 h-24 border-4 border-brand-primary/10 rounded-full" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 w-24 h-24 border-t-4 border-brand-primary rounded-full"
                />
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
                  onClick={() => navigate('/admin/dashboard')}
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

        {/* Floating background gradient orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden">
           <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full animate-pulse" />
           <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        </div>
      </div>
    </div>
  );
}
