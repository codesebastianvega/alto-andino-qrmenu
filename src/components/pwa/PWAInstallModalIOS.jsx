import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, CheckCircle2, Smartphone, MoreVertical, Compass, Globe, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../Portal';

export default function PWAInstallModalIOS({ 
  open, 
  onClose, 
  brandName = "Restaurante", 
  logoUrl 
}) {
  // Detección automática del sistema operativo del visitante
  const isAndroidDevice = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');
  const [activeTab, setActiveTab] = useState(isAndroidDevice ? 'android' : 'ios');

  // Detectar si el usuario está dentro del Webview de WhatsApp, Instagram, Facebook, etc.
  const isInAppBrowser = typeof navigator !== 'undefined' && 
    /FBAN|FBAV|Instagram|WhatsApp|Line|Twitter|Snapchat|MicroMessenger|wv/i.test(navigator.userAgent || '');

  useEffect(() => {
    if (open) {
      setActiveTab(isAndroidDevice ? 'android' : 'ios');
    }
  }, [open, isAndroidDevice]);

  if (!open) return null;

  return (
    <Portal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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
            className="relative z-10 w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-neutral-800 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] sm:pb-6 overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
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
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-neutral-900 leading-tight truncate">
                    {activeTab === 'android' ? 'Instalar en Android' : 'Instalar en iPhone / iPad'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium truncate">
                    App oficial de {brandName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar guía"
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pestañas de Selección de Sistema Operativo */}
            <div className="mt-3.5 p-1 bg-neutral-100 rounded-2xl flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>🤖</span>
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>🍏</span>
                <span>iPhone (iOS)</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-0.5 space-y-3.5 mt-3.5">
              {/* Alerta de In-App Browser (si está dentro de WhatsApp / Facebook / Instagram) */}
              {isInAppBrowser && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                  <Globe size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold leading-snug">
                      Estás dentro del visor de WhatsApp o redes sociales
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5 leading-relaxed">
                      Para instalar la app, toca los tres puntos <strong>(⋮)</strong> arriba a la derecha y selecciona <strong>"Abrir en Chrome"</strong> o <strong>"Abrir en el navegador"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* PASOS PARA ANDROID */}
              {activeTab === 'android' && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    Sigue estos sencillos pasos en tu navegador de Android (Chrome / Samsung Internet):
                  </p>

                  {/* Paso 1 Android */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <MoreVertical size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
                        Paso 1
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Toca el menú de <span className="font-bold text-neutral-900">tres puntos (⋮)</span> en la esquina superior derecha del navegador.
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 Android */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <PlusSquare size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
                        Paso 2
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Selecciona <span className="font-bold text-blue-600">"Instalar aplicación"</span> o <span className="font-bold text-neutral-900">"Agregar a la pantalla principal"</span>.
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 Android */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
                        Paso 3
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Confirma tocando <span className="font-bold text-emerald-600">"Instalar"</span>. ¡La app aparecerá en tu teléfono con su propio ícono!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PASOS PARA IPHONE / IOS */}
              {activeTab === 'ios' && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    En Safari de iPhone / iPad, agrégala en 3 pasos rápidos:
                  </p>

                  {/* Paso 1 iOS */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Share size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
                        Paso 1
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Toca el botón <span className="font-bold text-blue-600">Compartir</span> (el cuadro con la flecha arriba) en la barra inferior de Safari.
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 iOS */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <PlusSquare size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-0.5">
                        Paso 2
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Desliza hacia abajo en el menú y selecciona <span className="font-bold text-neutral-900">"Agregar al inicio"</span> (+).
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 iOS */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
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
              )}
            </div>

            {/* Action button */}
            <div className="mt-4 pt-3 border-t border-neutral-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-neutral-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] hover:bg-black shadow-lg shadow-neutral-900/10 cursor-pointer"
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
