import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Crown, ArrowRight, Zap } from 'lucide-react';

const LockOverlay = ({ 
  featureName = "esta función profesional", 
  isVisible, 
  onClose,
  planNeeded = "Esencial"
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[6px] p-6 rounded-3xl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white/90 dark:bg-zinc-900/90 border border-white/20 dark:border-zinc-800/50 shadow-2xl rounded-3xl p-8 max-w-md w-full relative overflow-hidden"
        >
          {/* Background Decorative Gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl shadow-[0_0_100px_rgba(245,158,11,0.2)]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl shadow-[0_0_100px_rgba(59,130,246,0.2)]" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-500/15 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>

            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
              Función Premium
            </h3>

            <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              El {featureName} está disponible a partir del plan <span className="font-semibold text-zinc-900 dark:text-zinc-200">{planNeeded}</span>. 
              Sube de nivel tu negocio para desbloquear todo el potencial de Aluna.
            </p>

            {/* Benefits List */}
            <div className="w-full space-y-3 mb-8">
              {[
                "Gestión administrativa avanzada",
                "Personalización visual completa",
                "Analytics y reportes detallados",
                "Soporte prioritario"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-left bg-zinc-100/50 dark:bg-white/5 p-3 rounded-xl border border-zinc-200/50 dark:border-white/5 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3 h-3 text-green-500" />
                  </div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => window.location.hash = '#plans'}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-xl"
              >
                <Crown className="w-5 h-5 fill-current" />
                Actualizar Plan
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button 
                onClick={onClose}
                className="w-full py-3 text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white transition-colors"
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
