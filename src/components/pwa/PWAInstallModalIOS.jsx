import React from 'react';
import { X, Share, PlusSquare, CheckCircle2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../Portal';

export default function PWAInstallModalIOS({ open, onClose, brandName, logoUrl }) {
  if (!open) return null;

  return (
    <Portal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          {/* Backdrop click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl p-6 shadow-2xl text-neutral-800 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] sm:pb-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 p-1.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={logoUrl}
                      alt={brandName}
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 text-amber-400 flex items-center justify-center font-bold border border-neutral-800 shrink-0">
                    <Smartphone size={20} />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900 leading-tight">
                    Instalar en iPhone
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    App oficial de {brandName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar guía"
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-neutral-600 mt-4 mb-5 leading-relaxed">
              En Safari, puedes agregar la aplicación directamente a tu pantalla de inicio siguiendo estos 3 pasos sencillos:
            </p>

            {/* Steps */}
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Share size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
                    Paso 1
                  </span>
                  <p className="text-xs font-semibold text-neutral-800 leading-snug">
                    Toca el botón <span className="font-bold text-blue-600">Compartir</span> en la barra inferior de Safari.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <PlusSquare size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-0.5">
                    Paso 2
                  </span>
                  <p className="text-xs font-semibold text-neutral-800 leading-snug">
                    Desliza hacia abajo y selecciona <span className="font-bold text-neutral-900">"Agregar al inicio"</span>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
                    Paso 3
                  </span>
                  <p className="text-xs font-semibold text-neutral-800 leading-snug">
                    Toca <span className="font-bold text-emerald-600">"Agregar"</span> en la esquina superior derecha ¡y listo!
                  </p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full bg-neutral-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] hover:bg-black shadow-lg shadow-neutral-900/10"
              >
                ¡Entendido!
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
}
