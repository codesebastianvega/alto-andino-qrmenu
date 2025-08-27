import { useRef, useState } from "react";

/**
 * SwipeRevealItem: revela un panel de borrar a la derecha, full-height,
 * con animación de entrada y rebote elástico al soltar.
 */
export default function SwipeRevealItem({ children, onDelete, deleteWidth = 84 }) {
  const [tx, setTx] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);

  const begin = (x) => {
    dragging.current = true;
    startX.current = x;
    setShowDelete(true);
  };

  const move = (x) => {
    if (!dragging.current) return;
    const d = Math.min(0, x - startX.current); // solo arrastre a la izquierda
    setTx(Math.max(d, -deleteWidth * 1.3)); // permite un poco más para el rebote
  };

  const end = () => {
    dragging.current = false;
    setTx((cur) => {
      // si abrió suficiente, mantener abierto, si no, cerrar
      if (Math.abs(cur) > deleteWidth * 0.6) {
        // rebote: ir más allá y volver
        setTx(-deleteWidth * 1.05);
        setTimeout(() => setTx(-deleteWidth), 120);
        return -deleteWidth;
      } else {
        // cerrar con animación
        setTimeout(() => setShowDelete(false), 150);
        return 0;
      }
    });
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Panel rojo detrás */}
      <button
        type="button"
        onClick={onDelete}
        className={`absolute inset-y-0 right-0 grid w-[84px] place-items-center bg-red-500 text-white transition-all duration-200 ease-out ${
          showDelete ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
        aria-label="Eliminar"
        style={{ pointerEvents: tx < 0 ? "auto" : "none" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: showDelete ? "rotate(0deg)" : "rotate(-20deg)" }}
        >
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
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