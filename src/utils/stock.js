// TODO(F6): eliminar si no se usa
import { useRef, useEffect, useCallback, useMemo } from "react";

export default function useSwipeTabs({ onPrev, onNext, threshold = 40 } = {}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const triggered = useRef(false);
  const onPrevRef = useRef(onPrev);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onPrevRef.current = onPrev;
  }, [onPrev]);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  const onTouchStart = useCallback((e) => {
    if (triggered.current) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    startX.current = t.clientX;
    startY.current = t.clientY;
  }, []);

  const onTouchMove = useCallback(
    (e) => {
      if (triggered.current) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        triggered.current = true;
        if (dx > 0) {
          onPrevRef.current?.();
        } else {
          onNextRef.current?.();
        }
      }
    },
    [threshold],
  );

  const onTouchEnd = useCallback(() => {
    triggered.current = false;
  }, []);

  return useMemo(
    () => ({ onTouchStart, onTouchMove, onTouchEnd }),
    [onTouchStart, onTouchMove, onTouchEnd],
  );
}