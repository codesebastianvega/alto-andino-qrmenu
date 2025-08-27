// src/hooks/useLockBodyScroll.js
import { useLayoutEffect } from "react";

/**
 * Bloquea el scroll del <body> mientras `enabled` sea true.
 * Restaura exactamente los estilos previos al desactivar o desmontar.
 */
export function useLockBodyScroll(enabled = true, { reserveScrollbarGap = true } = {}) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const body = document.body;
    const html = document.documentElement;

    // Guardar estado previo
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    // Calcular ancho del scrollbar para evitar “salto” de layout
    const scrollBarWidth = window.innerWidth - html.clientWidth;
    if (reserveScrollbarGap && scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Bloquear scroll
    body.style.overflow = "hidden";

    // Cleanup al desactivar/desmontar
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [enabled, reserveScrollbarGap]);
}

export default useLockBodyScroll;
