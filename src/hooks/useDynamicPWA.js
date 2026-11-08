import { useEffect } from 'react';

/**
 * Hook para inyectar metadatos PWA y Web App Manifest según la marca activa.
 * 
 * Cumple al 100% con los estándares de Chromium / Android WebAPK:
 * - Utiliza rutas HTTPS reales para el manifest (/manifest.webmanifest o /api/manifest?slug=...)
 * - Evita terminantemente URLs Blob o Data URIs en el manifest (las cuales invalidan
 *   el servicio WebAPK de Google y silencian el evento beforeinstallprompt).
 */
export function useDynamicPWA({ brand, restaurantSettings }) {
  useEffect(() => {
    if (!brand && !restaurantSettings) return;

    // No ejecutar en paneles de administración
    if (typeof window !== 'undefined' && (window.location.hash.includes('#admin') || window.location.pathname.startsWith('/admin'))) {
      return;
    }

    const brandName = restaurantSettings?.business_name || brand?.name || "Aluna";
    const isBoku = brand?.slug === 'boku-bento' || brandName.toLowerCase().includes('boku');
    const brandLogo = isBoku ? '/boku-icon-512.png' : (restaurantSettings?.logo_url || brand?.logo_url || "/icon-512.png");
    const themeColor = isBoku ? '#bc0e0e' : (brand?.theme_color || restaurantSettings?.primary_color || "#0A0A0A");

    // 1. Título del documento
    document.title = `${brandName} | Menú Digital`;

    // 2. Meta theme-color para la barra del navegador
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);

    // 3. Favicon y Apple Touch Icon
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    if (isBoku) {
      faviconLink.href = '/boku-favicon.png';
    } else if (restaurantSettings?.favicon_url) {
      faviconLink.href = restaurantSettings.favicon_url;
    } else {
      faviconLink.href = '/favicon.png';
    }

    let appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIconLink) {
      appleIconLink = document.createElement('link');
      appleIconLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleIconLink);
    }
    appleIconLink.href = brandLogo;

    // 4. Manifest link (siempre ruta HTTPS real)
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    if (isBoku) {
      manifestLink.href = '/manifest-boku.webmanifest';
    } else if (brand?.slug) {
      manifestLink.href = `/api/manifest?slug=${encodeURIComponent(brand.slug)}`;
    } else {
      manifestLink.href = '/manifest.webmanifest';
    }
  }, [brand, restaurantSettings]);
}
