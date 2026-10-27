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

    // Do NOT run dynamic PWA manifest inside admin panels
    if (window.location.hash.includes('#admin') || window.location.pathname.startsWith('/admin')) {
      return;
    }

    const brandName = restaurantSettings?.business_name || brand?.name || "Aluna";
    const brandShortName = brand?.short_name || brandName;
    const isBoku = brand?.slug === 'boku-bento' || brandName.toLowerCase().includes('boku');
    const brandLogo = isBoku ? '/boku-icon-512.png' : (brand?.logo_url || restaurantSettings?.logo_url || "/favicon.png");
    const themeColor = isBoku ? '#bc0e0e' : (brand?.theme_color || restaurantSettings?.primary_color || "#2f4131");

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
    // Actualizar favicon según la marca (BOKU usa su logo favicon oficial)
    if (isBoku) {
      faviconLink.href = '/boku-favicon.png';
    } else if (restaurantSettings?.favicon_url) {
      faviconLink.href = restaurantSettings.favicon_url;
    }

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
      manifestLink.href = '/manifest-boku.webmanifest';
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

          try {
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl && !isCancelled) {
              maskableUrl = dataUrl;
            }
          } catch (canvasErr) {
            maskableUrl = brandLogo;
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
        start_url: brand?.slug ? `/${brand.slug}/` : '/',
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
