import React from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallBanner({
  show,
  brandName,
  logoUrl,
  isIOS,
  onInstall,
  onDismiss,
}) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: -80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        aria-label="Instalación de aplicación oficial"
        className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] z-[120] pt-[env(safe-area-inset-top,0px)] pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-2xl shadow-black/15 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
          {/* Logo or Icon */}
          <div className="relative shrink-0">
            {logoUrl ? (
              <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 p-1.5 shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-neutral-900 text-amber-400 flex items-center justify-center font-bold shadow-md border border-neutral-800">
                <Smartphone size={22} />
              </div>
            )}
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-sm">
              App
            </span>
          </div>

          {/* Texts */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 truncate">
                {brandName}
              </h4>
              <Sparkles size={12} className="text-amber-500 shrink-0" />
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium leading-tight truncate">
              {isIOS ? 'Agrega la app oficial a tu iPhone' : 'Instala la app para pedir más rápido'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onInstall}
              className="bg-neutral-900 text-white font-bold text-xs px-3 sm:px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-neutral-900/10 hover:bg-black active:scale-95 transition-all"
            >
              <Download size={14} />
              <span>{isIOS ? 'Agregar' : 'Instalar'}</span>
            </button>

            <button
              onClick={onDismiss}
              aria-label="Cerrar aviso"
              className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
