import { useRef, useState } from "react";

/**
 * Contenedor swipeable que revela un botón de eliminar a la derecha.
 * Mantiene la interacción de clicks normal. No toca la lógica del carrito.
 */
export default function SwipeRevealItem({ children, onDelete, deleteWidth = 72 }) {
  const [tx, setTx] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  const begin = (x) => { dragging.current = true; startX.current = x; };
  const move = (x) => {
    if (!dragging.current) return;
    const d = Math.min(0, x - startX.current);        // solo hacia la izquierda
    setTx(Math.max(d, -deleteWidth));                  // límite
  };
  const end = () => {
    dragging.current = false;
    // snap: si pasó el 60%, dejar abierto; si no, cerrar
    setTx((cur) => (Math.abs(cur) > deleteWidth * 0.6 ? -deleteWidth : 0));
  };

  return (
    <div className="relative">
      {/* Zona de borrar (siempre presente detrás) */}
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-[72px] grid place-items-center rounded-xl
                   bg-red-500 text-white font-medium shadow-md"
        aria-label="Eliminar"
      >
        🗑
      </button>

      {/* Contenido desplazable */}
      <div
        className="transition-[transform] duration-200 will-change-transform"
        style={{ transform: `translateX(${tx}px)` }}
        // touch
        onTouchStart={(e) => begin(e.touches[0].clientX)}
        onTouchMove={(e) => move(e.touches[0].clientX)}
        onTouchEnd={end}
        // mouse (soporte desktop)
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
