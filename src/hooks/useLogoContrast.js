import { useState, useEffect } from 'react';

const contrastCache = new Map();

/**
 * Hook que analiza dinámicamente si los píxeles visibles de un logo PNG transparente
 * son predominantemente claros (blancos/crema) u oscuros (negros/grises).
 * 
 * Retorna:
 * - 'light': Logo con letras claras/blancas -> Requiere contenedor con fondo OSCURO (bg-neutral-900)
 * - 'dark': Logo con letras oscuras/negras -> Requiere contenedor con fondo CLARO (bg-white)
 */
export function useLogoContrast(logoUrl, fallback = 'light') {
  const [contrast, setContrast] = useState(() => {
    if (logoUrl && contrastCache.has(logoUrl)) {
      return contrastCache.get(logoUrl);
    }
    return fallback;
  });

  useEffect(() => {
    if (!logoUrl) return;

    if (contrastCache.has(logoUrl)) {
      setContrast(contrastCache.get(logoUrl));
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 32, 32);
        const imgData = ctx.getImageData(0, 0, 32, 32).data;

        let totalLuminance = 0;
        let visiblePixels = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const alpha = imgData[i + 3];
          // Solo consideramos píxeles que no sean transparentes
          if (alpha > 40) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            // Fórmula perceptual ITU-R BT.709
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            totalLuminance += lum;
            visiblePixels++;
          }
        }

        let detected = fallback;
        if (visiblePixels > 0) {
          const avgLum = totalLuminance / visiblePixels;
          // Si el promedio es mayor a 130, el logo es claro (blanco/crema/pastel)
          detected = avgLum > 130 ? 'light' : 'dark';
        }

        contrastCache.set(logoUrl, detected);
        if (isMounted) {
          setContrast(detected);
        }
      } catch (e) {
        // En caso de bloqueo CORS al leer canvas, usamos fallback seguro
        contrastCache.set(logoUrl, fallback);
        if (isMounted) setContrast(fallback);
      }
    };

    img.onerror = () => {
      contrastCache.set(logoUrl, fallback);
      if (isMounted) setContrast(fallback);
    };

    img.src = logoUrl;

    return () => {
      isMounted = false;
    };
  }, [logoUrl, fallback]);

  return contrast;
}
