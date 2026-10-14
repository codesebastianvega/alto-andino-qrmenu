import { useEffect } from 'react';

/**
 * Hook para inyectar dinámicamente el Web App Manifest y metadatos PWA
 * según la marca activa (BOKU, Alto Andino, etc.).
 *
 * Resuelve el problema de bordes blancos en Android generando un icono
 * maskable de sangrado completo (full-bleed) con el color de la marca
 * como fondo y el logo centrado en la zona segura (safe zone).
 */
export function useDynamicPWA({ brand, restaurantSettings }) {
  useEffect(() => {
    if (!brand && !restaurantSettings) return;

    const brandName = restaurantSettings?.business_name || brand?.name || "BOKU BENTO";
    const brandShortName = brand?.short_name || brandName;
    const isBoku = brand?.slug === 'boku-bento' || brandName.toLowerCase().includes('boku');
    const brandLogo = isBoku ? '/boku-icon-512.png' : (brand?.logo_url || restaurantSettings?.logo_url || "/boku-icon-192.png");
    const themeColor = isBoku ? '#bc0e0e' : (brand?.theme_color || restaurantSettings?.primary_color || "#bc0e0e");

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

    // 3. Actualizar Favicon
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = isBoku ? '/boku-icon-192.png' : brandLogo;

    let appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIconLink) {
      appleIconLink = document.createElement('link');
      appleIconLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleIconLink);
    }
    appleIconLink.href = isBoku ? '/boku-icon-512.png' : brandLogo;

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    if (isBoku) {
      manifestLink.href = '/manifest.webmanifest';
      return;
    }

    let isCancelled = false;
    let blobManifestUrl = null;
    let maskableBlobUrl = null;

    // Helper: generar icono maskable full-bleed con fondo sólido del color de la marca
    const generateMaskableAndManifest = async () => {
      let maskableUrl = brandLogo;

      try {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Fondo sólido con el color de la marca (elimina bordes blancos en Android e iOS)
          ctx.fillStyle = themeColor;
          ctx.fillRect(0, 0, size, size);

          // Centrar el logo dentro de la zona segura del maskable (82% del tamaño)
          await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const scale = 0.82;
              const w = size * scale;
              const h = (img.naturalHeight / img.naturalWidth) * w;
              const x = (size - w) / 2;
              const y = (size - h) / 2;
              ctx.drawImage(img, x, y, w, h);
              resolve();
            };
            img.onerror = () => resolve(); // Si falla CORS, continúa con fallback
            img.src = brandLogo;
          });

          const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
          if (blob && !isCancelled) {
            maskableBlobUrl = URL.createObjectURL(blob);
            maskableUrl = maskableBlobUrl;
          }
        }
      } catch (err) {
        console.warn('PWA: No se pudo generar icono maskable dinámico', err);
      }

      if (isCancelled) return;

      // Asignar icono con fondo sólido a apple-touch-icon para iOS
      appleIconLink.href = maskableUrl;

      // 4. Crear Manifest PWA Dinámico en formato Blob con background_color = themeColor
      const manifestObject = {
        name: brandName,
        short_name: brandShortName,
        description: `Menú digital y pedidos para ${brandName}`,
        start_url: window.location.pathname + window.location.search,
        display: "standalone",
        background_color: themeColor,
        theme_color: themeColor,
        icons: [
          {
            src: brandLogo,
            sizes: "192x192 512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: maskableUrl,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      };

      const stringManifest = JSON.stringify(manifestObject);
      const manifestBlob = new Blob([stringManifest], { type: 'application/json' });
      blobManifestUrl = URL.createObjectURL(manifestBlob);

      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = blobManifestUrl;
    };

    generateMaskableAndManifest();

    return () => {
      isCancelled = true;
      if (blobManifestUrl) URL.revokeObjectURL(blobManifestUrl);
      if (maskableBlobUrl) URL.revokeObjectURL(maskableBlobUrl);
    };
  }, [brand, restaurantSettings]);
}
