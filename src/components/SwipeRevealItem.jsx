import { useRef, useState } from "react";

/**
 * SwipeRevealItem: revela un panel de borrar a la derecha, full-height,
 * manteniendo el contenido con bordes redondeados continuos.
 */
export default function SwipeRevealItem({ children, onDelete, deleteWidth = 84 }) {
  const [tx, setTx] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  const begin = (x) => { dragging.current = true; startX.current = x; };
  const move = (x) => {
    if (!dragging.current) return;
    const d = Math.min(0, x - startX.current);         // solo izquierda
    setTx(Math.max(d, -deleteWidth));
  };
  const end = () => {
    dragging.current = false;
    setTx((cur) => (Math.abs(cur) > deleteWidth * 0.6 ? -deleteWidth : 0));
  };

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Panel rojo detrás: full-height */}
      <button
        type="button"
        onClick={onDelete}
        className="absolute inset-y-0 right-0 w-[84px] grid place-items-center bg-red-500 text-white"
        aria-label="Eliminar"
      >
        {/* Trash SVG para continuidad visual */}
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>

      {/* Contenido swipeable */}
      <div
        className="transition-[transform] duration-200 will-change-transform"
        style={{ transform: `translateX(${tx}px)` }}
        onTouchStart={(e) => begin(e.touches[0].clientX)}
        onTouchMove={(e) => move(e.touches[0].clientX)}
        onTouchEnd={end}
        onMouseDown={(e) => begin(e.clientX)}
        onMouseMove={(e) => dragging.current && move(e.clientX)}
        onMouseUp={end}
        onMouseLeave={end}
      >
        {children}
      </div>
    </div>
  );
}
