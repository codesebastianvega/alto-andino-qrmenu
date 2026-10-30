import { useEffect } from 'react';

const CLARITY_PROJECT_IDS = {
  'boku-bento': 'z5k4ivj9i5',
};

/**
 * Hook para inyectar Microsoft Clarity exclusivamente en marcas autorizadas
 * (Actualmente configurado de forma exclusiva para Boku Bento).
 */
export function useClarity({ brand, currentLocation }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. No trackear sesiones dentro del panel de administración
    const isAdmin = window.location.hash.includes('admin') || 
                    window.location.pathname.includes('/admin');
    if (isAdmin) return;

    // 2. Determinar el Project ID según la marca (desde el context o deducido de la URL)
    const urlSlug = window.location.pathname.split('/').filter(Boolean)[0];
    const brandSlug = brand?.slug || urlSlug;
    const clarityId = brand?.clarity_project_id || CLARITY_PROJECT_IDS[brandSlug];

    if (!clarityId) return;

    // 3. Si ya está inicializado, solo refrescar tags de sesión
    if (window.clarityInitialized) {
      if (typeof window.clarity === 'function') {
        window.clarity('set', 'brand', brand?.name || brandSlug);
        if (currentLocation?.name) {
          window.clarity('set', 'location', currentLocation.name);
        }
      }
      return;
    }

    // 4. Inyección oficial de Microsoft Clarity
    (function(c, l, a, r, i, t, y) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', clarityId);

    window.clarityInitialized = true;

    // 5. Configurar tags de segmentación inicial
    if (typeof window.clarity === 'function') {
      window.clarity('set', 'brand', brand?.name || brandSlug);
      if (currentLocation?.name) {
        window.clarity('set', 'location', currentLocation.name);
      }
      const searchParams = new URLSearchParams(window.location.search);
      const mesa = searchParams.get('mesa') || (typeof localStorage !== 'undefined' ? localStorage.getItem('aa_current_mesa') : null);
      if (mesa) {
        window.clarity('set', 'mesa', mesa);
      }
    }
  }, [brand, currentLocation]);
}
