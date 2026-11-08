import { useState, useEffect, useCallback } from 'react';
import { toast } from '../components/Toast';

// Global shared state across component instances
let globalDeferredPrompt = typeof window !== 'undefined' ? (window.__pwaDeferredPrompt || null) : null;
const promptListeners = new Set();

if (typeof window !== 'undefined') {
  if (Array.isArray(window.__pwaListeners)) {
    window.__pwaListeners.push((prompt) => {
      globalDeferredPrompt = prompt;
      promptListeners.forEach((listener) => listener(prompt));
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.__pwaDeferredPrompt = e;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    window.__pwaDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

function checkIsStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function checkIsIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Un dispositivo Android JAMÁS debe detectarse como iOS
  if (/Android/i.test(ua)) return false;
  return (
    (/iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !window.MSStream
  );
}

function checkIsAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

function checkIsSamsung() {
  if (typeof navigator === 'undefined') return false;
  return /SamsungBrowser/i.test(navigator.userAgent || '');
}

function checkIsInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|WhatsApp|Line|Twitter|Snapchat|MicroMessenger|wv/i.test(ua);
}

const DISMISS_COOLDOWN_DAYS = 7;
const DISMISS_COOLDOWN_MS = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Hook para gestionar la instalación de la PWA.
 * En Android y PC: Instalación nativa directa en 1 clic (sin tutoriales).
 * En iOS (Safari): Guía interactiva manual requerida por Apple.
 */
export function usePWAInstall({ brandId, delayMs = 4000 } = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState(
    () => globalDeferredPrompt || (typeof window !== 'undefined' ? window.__pwaDeferredPrompt : null)
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSamsung, setIsSamsung] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const storageKey = `aluna_pwa_dismissed_${brandId || 'global'}`;

  // Verificar estado inicial al montar
  useEffect(() => {
    const standalone = checkIsStandalone();
    setIsInstalled(standalone);
    const ios = checkIsIOS();
    const android = checkIsAndroid();
    setIsIOS(ios);
    setIsAndroid(android);
    setIsSamsung(checkIsSamsung());
    setIsInAppBrowser(checkIsInAppBrowser());

    const updatePrompt = (prompt) => {
      setDeferredPrompt(prompt);
      // En Android, en cuanto el navegador entregue el prompt nativo, mostramos el banner de 1 clic
      if (prompt && !standalone) {
        setShowBanner(true);
      }
    };

    promptListeners.add(updatePrompt);

    // Si ya había un prompt capturado en window
    if (window.__pwaDeferredPrompt && !deferredPrompt) {
      updatePrompt(window.__pwaDeferredPrompt);
    }

    return () => {
      promptListeners.delete(updatePrompt);
    };
  }, [deferredPrompt]);

  // Control del temporizador para mostrar el banner
  useEffect(() => {
    if (isInstalled) return;

    // Verificar si el usuario ya descartó el aviso en los últimos 7 días
    try {
      const dismissedAt = localStorage.getItem(storageKey);
      if (dismissedAt) {
        const timeDiff = Date.now() - parseInt(dismissedAt, 10);
        if (timeDiff < DISMISS_COOLDOWN_MS) {
          return;
        }
      }
    } catch {}

    const timer = setTimeout(() => {
      if (!checkIsStandalone()) {
        const hasPrompt = !!deferredPrompt || !!globalDeferredPrompt || !!(typeof window !== 'undefined' && window.__pwaDeferredPrompt);
        // En iOS mostramos siempre porque no hay prompt programático
        // En Android/PC mostramos de inmediato si el prompt está listo
        if (checkIsIOS() || hasPrompt) {
          setShowBanner(true);
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isInstalled, storageKey, delayMs, deferredPrompt]);

  // Descartar banner con enfriamiento de 7 días
  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(storageKey, Date.now().toString());
    } catch {}
  }, [storageKey]);

  // Ejecutar instalación directa en 1 toque
  const promptInstall = useCallback(async () => {
    if (isInstalled) return;

    const activePrompt = deferredPrompt || globalDeferredPrompt || (typeof window !== 'undefined' ? window.__pwaDeferredPrompt : null);

    if (activePrompt) {
      // Android / Chrome / Edge / Desktop: Disparo NATIVO directo de 1 solo clic
      try {
        activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
        }
        globalDeferredPrompt = null;
        if (typeof window !== 'undefined') window.__pwaDeferredPrompt = null;
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error al solicitar instalación PWA:', err);
      }
    } else if (isIOS) {
      // ÚNICAMENTE en iOS Safari abrimos la guía manual porque Apple no tiene API
      setShowIOSGuide(true);
    } else {
      // En Android: NUNCA mostrar la ventana de instrucciones
      toast('Preparando instalador de un toque...');
    }
  }, [deferredPrompt, isIOS, isInstalled]);

  return {
    canInstall: !isInstalled && (!!deferredPrompt || !!globalDeferredPrompt || isIOS),
    isInstalled,
    isIOS,
    isAndroid,
    isSamsung,
    isInAppBrowser,
    showBanner,
    showIOSGuide,
    setShowIOSGuide,
    promptInstall,
    dismissBanner,
  };
}
