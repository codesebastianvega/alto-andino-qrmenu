import { useEffect, useState, useRef } from "react";
import { formatCOP } from "@/utils/money";
import { Icon } from "@iconify-icon/react";

export default function FloatingCartBar({ items, total, onOpen }) {
  const [animateTotal, setAnimateTotal] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevTotal = useRef(total);
  const cartCount = items?.length || 0;

  // Slide-up entrance when items appear
  useEffect(() => {
    if (cartCount > 0) {
      // Small delay so the animation is perceptible
      const t = setTimeout(() => setVisible(true), 60);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [cartCount]);

  // Bounce when total changes
  useEffect(() => {
    if (total > 0 && total !== prevTotal.current) {
      setAnimateTotal(true);
      const timeout = setTimeout(() => setAnimateTotal(false), 500);
      prevTotal.current = total;
      return () => clearTimeout(timeout);
    }
  }, [total]);

  if (cartCount === 0) return null;

  return (
    <div
      data-aa-cartbar
      className="fixed right-5 bottom-[96px] md:bottom-8 z-[70] pointer-events-none flex"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}
    >
      <button
        onClick={onOpen}
        className={`pointer-events-auto inline-flex items-center gap-4 rounded-full bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 px-6 py-3.5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A] ${
          visible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        } ${animateTotal ? "scale-[1.03]" : ""}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Icon icon="solar:cart-large-4-bold" className="text-[20px] text-white/90" />
            <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#1A1A1A]/90">
              {cartCount}
            </span>
          </div>
          <span className="text-[14px] font-medium text-white/90">
            {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        {/* Divisor */}
        <div className="w-px h-4 bg-white/20"></div>

        {/* Precio */}
        <span className="text-[15px] font-bold tabular-nums tracking-tight">
          {formatCOP(total)}
        </span>
      </button>
    </div>
  );
}