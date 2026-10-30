import { useEffect } from 'react';
import { getAttribution } from '../utils/attribution';

export const CLARITY_PROJECT_IDS = {
  'boku-bento': 'z5k4ivj9i5',
};

/**
 * Hook para inyectar Microsoft Clarity exclusivamente en marcas autorizadas
 * (Actualmente configurado de forma exclusiva para Boku Bento o marcas con Addon activo).
 */
export function useClarity({ brand, currentLocation }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detectar si la URL trae parámetro de exclusión para personal/dueño
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('exclude_me') === 'true' || searchParams.get('internal') === 'true') {
      try { localStorage.setItem('aa_is_staff_device', 'true'); } catch {}
    }

    // 2. Si entra al panel de administración o tiene sesión de admin, marcar como dispositivo de equipo
    const isAdmin = window.location.hash.includes('admin') || 
                    window.location.pathname.includes('/admin');
    if (isAdmin) {
      try { localStorage.setItem('aa_is_staff_device', 'true'); } catch {}
      return;
    }

    // 3. Excluir dispositivos del equipo interno (PC del dueño, móvil de Sebastián, tablet del local)
    const isStaffDevice = (typeof localStorage !== 'undefined' && localStorage.getItem('aa_is_staff_device') === 'true') ||
                          (typeof localStorage !== 'undefined' && localStorage.getItem('aa_current_staff') !== null);
    if (isStaffDevice) {
      console.debug('[Clarity] Dispositivo del equipo detectado. Rastreo apagado.');
      return;
    }

    // 4. Determinar el Project ID según la marca (desde el context o deducido de la URL)
    const urlSlug = window.location.pathname.split('/').filter(Boolean)[0];
    const brandSlug = brand?.slug || urlSlug;
    const clarityId = brand?.clarity_project_id || CLARITY_PROJECT_IDS[brandSlug];

    if (!clarityId) return;

    // 5. Capturar atribución (volantes, mesas, campañas)
    const attr = getAttribution();

    // 6. Si ya está inicializado, solo refrescar tags de sesión
    if (window.clarityInitialized) {
      if (typeof window.clarity === 'function') {
        window.clarity('set', 'brand', brand?.name || brandSlug);
        if (currentLocation?.name) {
          window.clarity('set', 'location', currentLocation.name);
        }
        if (attr.source) {
          window.clarity('set', 'canal_origen', String(attr.source));
        }
        if (attr.campaign) {
          window.clarity('set', 'campaña', String(attr.campaign));
        }
        if (attr.mesa) {
          window.clarity('set', 'mesa', String(attr.mesa));
        }
      }
      return;
    }

    // 5. Inyección oficial de Microsoft Clarity
    (function(c, l, a, r, i, t, y) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', clarityId);

    window.clarityInitialized = true;

    // 6. Configurar tags de segmentación inicial
    if (typeof window.clarity === 'function') {
      window.clarity('set', 'brand', brand?.name || brandSlug);
      if (currentLocation?.name) {
        window.clarity('set', 'location', currentLocation.name);
      }
      if (attr.mesa) {
        window.clarity('set', 'mesa', String(attr.mesa));
      }
      if (attr.source) {
        window.clarity('set', 'canal_origen', String(attr.source));
      }
      if (attr.campaign) {
        window.clarity('set', 'campaña', String(attr.campaign));
      }
    }
  }, [brand, currentLocation]);
}
