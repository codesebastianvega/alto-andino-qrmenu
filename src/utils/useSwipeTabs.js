import { useRef } from "react";

export default function useSwipeTabs({ onPrev, onNext, threshold = 40 } = {}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const triggered = useRef(false);

  function onTouchStart(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;
    startX.current = t.clientX;
    startY.current = t.clientY;
    triggered.current = false;
  }

  function onTouchMove(e) {
    if (triggered.current) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      triggered.current = true;
      if (dx > 0) {
        onPrev?.();
      } else {
        onNext?.();
      }
    }
  }

  function onTouchEnd() {
    triggered.current = false;
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

