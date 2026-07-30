import { useEffect } from 'react';

/**
 * Hook para inyectar dinámicamente el Web App Manifest y metadatos PWA
 * según la marca activa (BOKU, Alto Andino, etc.).
 * Esto permite que al presionar "Agregar a pantalla de inicio" o "Instalar App",
 * se instale con el nombre, logo y color específico de la marca.
 */
export function useDynamicPWA({ brand, restaurantSettings }) {
  useEffect(() => {
    if (!brand && !restaurantSettings) return;

    const brandName = restaurantSettings?.business_name || brand?.name || "Aluna";
    const brandShortName = brand?.short_name || brandName;
    const brandLogo = brand?.logo_url || restaurantSettings?.logo_url || "/favicon.png";
    const themeColor = brand?.theme_color || restaurantSettings?.primary_color || "#111827";

    // 1. Actualizar título del documento
    document.title = `${brandName} | Menú Digital`;

    // 2. Actualizar meta theme-color para la barra del navegador móvil
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);

    // 3. Actualizar Favicon & Apple Touch Icon para iOS / Android shortcuts
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = brandLogo;

    let appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIconLink) {
      appleIconLink = document.createElement('link');
      appleIconLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleIconLink);
    }
    appleIconLink.href = brandLogo;

    // 4. Crear Manifest PWA Dinámico en formato Blob
    const manifestObject = {
      name: brandName,
      short_name: brandShortName,
      description: `Menú digital y pedidos para ${brandName}`,
      start_url: window.location.pathname + window.location.search,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: themeColor,
      icons: [
        {
          src: brandLogo,
          sizes: "192x192 512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };

    const stringManifest = JSON.stringify(manifestObject);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    const previousUrl = manifestLink.href;
    manifestLink.href = manifestUrl;

    return () => {
      if (previousUrl && previousUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previousUrl);
      }
    };
  }, [brand, restaurantSettings]);
}
