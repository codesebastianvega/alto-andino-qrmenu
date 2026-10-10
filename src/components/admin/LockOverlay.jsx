import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Crown, ArrowRight, Zap, MessageCircle, Sparkles } from 'lucide-react';

const WHATSAPP_SUPPORT = '573222285900';

const LockOverlay = ({ 
  featureName = "esta función profesional", 
  isVisible, 
  onClose,
  onUpgrade,
  planNeeded = "Esencial",
  brandName = ""
}) => {
  if (!isVisible) return null;

  const isKdsOrBds = 
    featureName?.toLowerCase().includes('cocina') || 
    featureName?.toLowerCase().includes('barra') || 
    featureName?.toLowerCase().includes('kds') || 
    featureName?.toLowerCase().includes('bds');

  const handleWhatsAppAddon = () => {
    const text = `¡Hola Aluna! 👋 Deseo activar el Add-on de *${featureName}* ($50.000 COP/mes) para mi restaurante *${brandName || 'mi negocio'}*. ¿Cómo coordinamos el pago y habilitación?`;
    window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[8px] p-4 sm:p-6 rounded-3xl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden"
        >
          {/* Background Decorative Gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl shadow-[0_0_100px_rgba(245,158,11,0.2)]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl shadow-[0_0_100px_rgba(16,185,129,0.2)]" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border shadow-sm ${
              isKdsOrBds 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-500/15 border-amber-500/20 text-amber-500'
            }`}>
              {isKdsOrBds ? <Sparkles className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-2">
              {isKdsOrBds ? `Módulo de ${featureName}` : 'Función Profesional'}
            </h3>

            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-5 leading-relaxed">
              Incluido en <span className="font-bold text-zinc-900 dark:text-zinc-200">Plan Profesional</span> y <span className="font-bold text-zinc-900 dark:text-zinc-200">Plan Premium</span>.
              {isKdsOrBds && ' También puedes adquirirlo de forma independiente sin cambiar de plan.'}
            </p>

            {/* Special Callout for KDS & BDS Add-on */}
            {isKdsOrBds ? (
              <div className="w-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Disponible como Add-on
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                    $50.000 / mes
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                  Mantén tu plan actual y habilita la pantalla en vivo de {featureName} por una tarifa fija mensual.
                </p>
              </div>
            ) : (
              /* Benefits List for generic locks */
              <div className="w-full space-y-2 mb-6">
                {[
                  "Gestión administrativa avanzada",
                  "Personalización visual y catálogo",
                  "Reportes y control operativo",
                  "Soporte prioritario"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-left bg-zinc-50 dark:bg-white/5 p-2.5 rounded-xl border border-zinc-100 dark:border-white/5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Zap className="w-2.5 h-2.5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col w-full gap-2.5">
              {isKdsOrBds && (
                <button 
                  onClick={handleWhatsAppAddon}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md shadow-emerald-950/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  Activar Add-on ($50.000/mes)
                </button>
              )}

              <button 
                onClick={onUpgrade}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all ${
                  isKdsOrBds 
                    ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-500" />
                {isKdsOrBds ? 'Ver Planes Completos (Incluido)' : 'Actualizar Plan'}
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={onClose}
                className="w-full py-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Tal vez más tarde
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LockOverlay;
