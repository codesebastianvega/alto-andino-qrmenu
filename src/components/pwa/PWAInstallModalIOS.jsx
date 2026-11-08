import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Smartphone, 
  MoreVertical, 
  Menu as MenuIcon,
  Globe, 
  ExternalLink,
  Copy,
  Check,
  Download,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../Portal';
import { toast } from '../Toast';

export default function PWAInstallModalIOS({ 
  open, 
  onClose, 
  brandName = "Restaurante", 
  logoUrl 
}) {
  const [copied, setCopied] = useState(false);

  // Detección precisa de entorno y navegador
  const isAndroidDevice = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');
  const isSamsungBrowser = typeof navigator !== 'undefined' && /SamsungBrowser/i.test(navigator.userAgent || '');
  const isInAppBrowser = typeof navigator !== 'undefined' && 
    /FBAN|FBAV|Instagram|WhatsApp|Line|Twitter|Snapchat|MicroMessenger|wv/i.test(navigator.userAgent || '');
  const isIOSDevice = typeof navigator !== 'undefined' && 
    ((/iPad|iPhone|iPod/.test(navigator.userAgent || '')) ||
     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  // Determinar pestaña inicial según el dispositivo real
  const getInitialTab = () => {
    if (isInAppBrowser) return 'inapp';
    if (isSamsungBrowser) return 'samsung';
    if (isAndroidDevice) return 'chrome';
    if (isIOSDevice) return 'ios';
    return 'chrome';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    if (open) {
      setActiveTab(getInitialTab());
      setCopied(false);
    }
  }, [open]);

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      toast('¡Enlace copiado! Pégalo en tu navegador');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast('No se pudo copiar el enlace');
    }
  };

  const handleOpenInChrome = () => {
    try {
      const cleanUrl = window.location.href.replace(/^https?:\/\//i, '');
      // Intent nativo de Android para abrir directamente en Google Chrome
      window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    } catch {
      handleCopyLink();
    }
  };

  if (!open) return null;

  return (
    <Portal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-neutral-800 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] sm:pb-6 overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {logoUrl ? (
                  <div className="w-11 h-11 rounded-2xl bg-neutral-900 border border-neutral-800 p-1.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={logoUrl}
                      alt={brandName}
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-amber-400 flex items-center justify-center font-bold border border-neutral-800 shrink-0 shadow-md">
                    <Smartphone size={22} />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-neutral-900 leading-tight truncate">
                    Instalar app oficial
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium truncate">
                    {brandName} • Acceso rápido sin descargas
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

            {/* Pestañas de Selección Inteligente */}
            <div className="mt-3.5 p-1 bg-neutral-100/90 rounded-2xl flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
              {isInAppBrowser && (
                <button
                  type="button"
                  onClick={() => setActiveTab('inapp')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'inapp'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setActiveTab('chrome')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'chrome'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>🤖</span>
                <span>Chrome</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('samsung')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'samsung'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>📱</span>
                <span>Samsung</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>🍏</span>
                <span>iPhone</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-0.5 space-y-3.5 mt-3.5">
              
              {/* ── PESTAÑA: WHATSAPP / IN-APP BROWSER ── */}
              {activeTab === 'inapp' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-950 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Globe size={16} />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-emerald-900 leading-tight">
                          Estás navegando dentro de WhatsApp o redes sociales
                        </p>
                        <p className="text-[11px] text-emerald-800 font-medium mt-1 leading-relaxed">
                          Por seguridad, WhatsApp no permite instalar aplicaciones directamente en su visor interno. Debes abrir la página en tu navegador (Chrome o Samsung).
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleOpenInChrome}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        <span>Abrir en Google Chrome</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-900 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                        <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-neutral-700 text-xs space-y-1.5">
                    <p className="font-bold text-neutral-900 text-[11px] uppercase tracking-wide">
                      O si lo prefieres manualmente:
                    </p>
                    <p className="text-xs text-neutral-600 leading-snug">
                      1. Toca los <strong>tres puntos (⋮)</strong> que ves en la esquina superior o inferior.
                    </p>
                    <p className="text-xs text-neutral-600 leading-snug">
                      2. Selecciona <strong>"Abrir en Chrome"</strong> o <strong>"Abrir en el navegador"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* ── PESTAÑA: SAMSUNG GALAXY (Samsung Internet) ── */}
              {activeTab === 'samsung' && (
                <div className="space-y-2.5 animate-fade-in">
                  <div className="bg-purple-50/80 border border-purple-100 p-2.5 rounded-2xl text-purple-900 text-xs">
                    <p className="font-bold leading-tight">
                      En teléfonos Samsung, el menú está en la barra inferior 👇
                    </p>
                    <p className="text-[11px] text-purple-700 font-medium mt-0.5 leading-snug">
                      No saldrá arriba ni dirá "Instalar". Sigue estos sencillos pasos:
                    </p>
                  </div>

                  {/* Paso 1 Samsung */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-black">
                      <MenuIcon size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-0.5">
                        Paso 1
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        En la barra de <strong>abajo</strong>, toca el botón de menú con <span className="font-bold text-purple-700">tres líneas (☰)</span> o tres puntos en la esquina inferior derecha.
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 Samsung */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <PlusSquare size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-0.5">
                        Paso 2
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Toca la opción <span className="font-bold text-neutral-900">"Agregar página a"</span> (o el ícono con un signo +).
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 Samsung */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-0.5">
                        Paso 3
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Elige <span className="font-bold text-emerald-700">"Pantalla de inicio"</span> y luego confirma tocando <strong>"Añadir"</strong>. ¡Listo!
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 text-center font-medium">
                    💡 En algunos Samsung también verás una flecha de descarga o (+) en la barra superior al lado del nombre de la página.
                  </p>
                </div>
              )}

              {/* ── PESTAÑA: GOOGLE CHROME (Android) ── */}
              {activeTab === 'chrome' && (
                <div className="space-y-2.5 animate-fade-in">
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    En Google Chrome en tu Android:
                  </p>

                  {/* Paso 1 Chrome */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <MoreVertical size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
                        Paso 1
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Toca el menú de <span className="font-bold text-neutral-900">tres puntos (⋮)</span> (arriba a la derecha o abajo en la barra de tu navegador).
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 Chrome */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Download size={18} />
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

                  {/* Paso 3 Chrome */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
                        Paso 3
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Confirma tocando <span className="font-bold text-emerald-600">"Instalar"</span>. La app quedará guardada en tu teléfono con su propio ícono como cualquier app.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PESTAÑA: IPHONE / IOS ── */}
              {activeTab === 'ios' && (
                <div className="space-y-2.5 animate-fade-in">
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    En Safari de iPhone / iPad:
                  </p>

                  {/* Paso 1 iOS */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Share size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
                        Paso 1
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Toca el botón <span className="font-bold text-blue-600">Compartir</span> (el cuadrado con la flecha hacia arriba) en la barra inferior de Safari.
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 iOS */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <PlusSquare size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-0.5">
                        Paso 2
                      </span>
                      <p className="text-xs font-semibold text-neutral-800 leading-snug">
                        Desliza las opciones hacia abajo y toca <span className="font-bold text-neutral-900">"Agregar al inicio"</span> (+).
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 iOS */}
                  <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
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

            {/* Footer Action */}
            <div className="mt-4 pt-3 border-t border-neutral-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-neutral-900 text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] hover:bg-black shadow-lg shadow-neutral-900/10 cursor-pointer"
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
