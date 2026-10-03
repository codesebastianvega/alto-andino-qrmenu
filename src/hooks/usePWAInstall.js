import { useState, useEffect, useCallback } from 'react';

// Global shared state across component instances
let globalDeferredPrompt = null;
const promptListeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    globalDeferredPrompt = e;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
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
  return (
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !window.MSStream
  );
}

const DISMISS_COOLDOWN_DAYS = 7;
const DISMISS_COOLDOWN_MS = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Hook para gestionar la instalación de la PWA de la marca/restaurante.
 * Compatible con Android, Windows, Mac y con guía especial nativa para iOS (Safari).
 */
export function usePWAInstall({ brandId, delayMs = 6000 } = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const storageKey = `aluna_pwa_dismissed_${brandId || 'global'}`;

  // Verificar estado inicial al montar
  useEffect(() => {
    const standalone = checkIsStandalone();
    setIsInstalled(standalone);
    setIsIOS(checkIsIOS());

    const updatePrompt = (prompt) => {
      setDeferredPrompt(prompt);
    };

    promptListeners.add(updatePrompt);
    return () => {
      promptListeners.delete(updatePrompt);
    };
  }, []);

  // Control del temporizador inteligente para mostrar el banner
  useEffect(() => {
    if (isInstalled) return;

    // Verificar si el usuario ya descartó el aviso en los últimos 7 días
    try {
      const dismissedAt = localStorage.getItem(storageKey);
      if (dismissedAt) {
        const timeDiff = Date.now() - parseInt(dismissedAt, 10);
        if (timeDiff < DISMISS_COOLDOWN_MS) {
          return; // Sigue en periodo de descanso
        }
      }
    } catch {
      // Ignorar errores de localStorage
    }

    const timer = setTimeout(() => {
      // Mostrar solo si no está en modo standalone
      if (!checkIsStandalone()) {
        setShowBanner(true);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isInstalled, storageKey, delayMs]);

  // Descartar banner con enfriamiento de 7 días
  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(storageKey, Date.now().toString());
    } catch {
      // Ignorar errores de localStorage
    }
  }, [storageKey]);

  // Ejecutar instalación
  const promptInstall = useCallback(async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      // Android / Chrome / Edge / Desktop
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
        }
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error al solicitar instalación PWA:', err);
      }
    } else if (isIOS) {
      // En iOS Safari no existe prompt programático; abrimos la guía interactiva
      setShowIOSGuide(true);
    } else {
      // Fallback para navegadores que no admiten beforeinstallprompt (o ya se descartó)
      // Si estamos en un móvil no-iOS o desktop, podemos mostrar la guía
      setShowIOSGuide(true);
    }
  }, [deferredPrompt, isIOS, isInstalled]);

  return {
    canInstall: !isInstalled && (!!deferredPrompt || isIOS),
    isInstalled,
    isIOS,
    showBanner,
    showIOSGuide,
    setShowIOSGuide,
    promptInstall,
    dismissBanner,
  };
}
