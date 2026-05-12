import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X, Crown, Zap, Star, Shield, ArrowRight } from 'lucide-react';
import { usePlan } from '../../hooks/usePlan';

const PLAN_CARDS = [
  {
    id: 'emprendedor',
    name: 'Emprendedor',
    price: '29.900',
    color: 'from-amber-700/20 to-amber-900/20',
    borderColor: 'border-amber-700/30',
    iconColor: 'text-amber-500',
    badge: 'Inicio',
    limits: 'Hasta 60 pedidos/mes',
    features: [
      'Menú Digital Premium',
      '20 Productos / 5 Categorías',
      'Pedidos por WhatsApp',
      'Subdominio aluna.menu/',
      'Soporte Básico'
    ]
  },
  {
    id: 'esencial',
    name: 'Esencial',
    price: '59.900',
    color: 'from-blue-700/20 to-blue-900/20',
    borderColor: 'border-blue-700/30',
    iconColor: 'text-blue-400',
    badge: 'Crecimiento',
    limits: 'Hasta 250 pedidos/mes',
    features: [
      'Todo lo de Emprendedor',
      '50 Productos / 15 Categorías',
      'Analíticas Básicas',
      'Panel de Staff/Meseros',
      'Landing Page Propia'
    ]
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: '129.900',
    color: 'from-emerald-700/20 to-emerald-900/20',
    borderColor: 'border-emerald-500/50',
    iconColor: 'text-emerald-400',
    badge: 'Más Popular',
    highlight: true,
    limits: 'Hasta 800 pedidos/mes',
    features: [
      'Todo lo de Esencial',
      'Productos Ilimitados',
      'Gestión de Mesas con QR',
      'Sistema de Cocina (KDS)',
      'Gestión de Inventario',
      'Analíticas Avanzadas'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '249.900',
    color: 'from-purple-700/20 to-purple-900/20',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    badge: 'Alto Volumen',
    limits: 'Hasta 2.000 pedidos/mes',
    features: [
      'Todo lo de Profesional',
      'CRM de Clientes',
      'Módulo de Fidelización',
      'Multi-sede (Opcional)',
      'Soporte Prioritario 24/7'
    ]
  }
];

const UpgradeModal = ({ isOpen, onClose, currentPlanSlug }) => {
  if (!isOpen) return null;

  const navigate = useNavigate();

  const handleSelectPlan = (planId) => {
    console.log('Plan seleccionado:', planId);
    // Redirección al checkout usando el router de la aplicación
    navigate(`/admin/checkout?plan=${planId}`);
    onClose(); // Cerrar el modal después de la selección
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 lg:p-8"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#0A0F0A] border border-white/10 shadow-2xl rounded-[32px] w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col relative"
        >
          {/* Header */}
          <div className="p-8 lg:p-10 border-b border-white/5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-brand-primary/10 blur-[100px] -z-10" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-8 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-brand-primary/20">
              <Crown className="w-6 h-6 text-brand-primary" />
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 tracking-tight">
              Potencia tu Negocio con <span className="text-brand-primary">Aluna</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Selecciona el plan que mejor se adapte al volumen y necesidades de tu restaurante. Sin comisiones por venta.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLAN_CARDS.map((plan) => {
                const isCurrent = currentPlanSlug === plan.id;
                
                return (
                  <div 
                    key={plan.id}
                    className={`relative flex flex-col rounded-3xl border transition-all duration-300 ${
                      plan.highlight 
                        ? 'bg-white/[0.03] border-brand-primary/40 scale-[1.02] shadow-[0_0_40px_rgba(var(--brand-primary-rgb),0.1)]' 
                        : 'bg-white/[0.01] border-white/10 hover:border-white/20'
                    } ${isCurrent ? 'opacity-100 ring-2 ring-brand-primary/20' : ''}`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-primary text-black text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-lg">
                        RECOMENDADO
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full border border-white/10">
                        TU PLAN ACTUAL
                      </div>
                    )}

                    <div className="p-6 pb-0">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 ${plan.iconColor}`}>
                          {plan.badge}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-black text-white">${plan.price}</span>
                        <span className="text-white/40 text-xs">/mes</span>
                      </div>

                      <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/5 mb-6">
                        <div className="flex items-center gap-2">
                          <Zap className={`w-3.5 h-3.5 ${plan.iconColor}`} />
                          <span className="text-xs font-medium text-white/80">{plan.limits}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 px-6 space-y-3.5 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-1 shrink-0">
                            <Check className={`w-3.5 h-3.5 ${plan.iconColor}`} />
                          </div>
                          <span className="text-[13px] text-white/60 leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 pt-0">
                      <button 
                        disabled={isCurrent}
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          isCurrent 
                            ? 'bg-white/5 text-white/30 cursor-default border border-white/5' 
                            : plan.highlight
                              ? 'bg-brand-primary text-black hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand-primary/20'
                              : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
                        }`}
                      >
                        {isCurrent ? 'Plan Actual' : 'Seleccionar Plan'}
                        {!isCurrent && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>


            {/* AI Addon Footer */}
            <div className="mt-12 p-6 rounded-[24px] bg-gradient-to-r from-brand-primary/10 to-blue-500/10 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-blue-500/20 animate-pulse" />
                  <Star className="w-7 h-7 text-white relative z-10" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Módulo de IA Aluna (Add-on)</h4>
                  <p className="text-white/50 text-sm">Potencia tus ventas con nuestro Gerente Virtual y Mesero IA. +$49.900 COP / mes.</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all border border-white/10">
                Saber más sobre IA
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-black/50 border-t border-white/5 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-white/30">
              <Shield className="w-4 h-4" />
              <span className="text-[11px] font-medium uppercase tracking-widest">Seguro & Encriptado</span>
            </div>
            <div className="flex items-center gap-2 text-white/30">
              <Star className="w-4 h-4" />
              <span className="text-[11px] font-medium uppercase tracking-widest">Garantía de Satisfacción</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
