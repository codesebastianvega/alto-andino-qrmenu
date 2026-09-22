import { useEffect, useState, useRef } from "react";
import { formatCOP } from "@/utils/money";
import { Icon } from "@iconify-icon/react";
import MiniCartWindow from "./MiniCartWindow";

export default function FloatingCartBar({ items, total, onOpen }) {
  const [animateTotal, setAnimateTotal] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const containerRef = useRef(null);
  const prevTotal = useRef(total);
  const cartCount = items?.length || 0;

  // Handle click outside & escape key to close mini cart
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowMiniCart(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowMiniCart(false);
      }
    };
    if (showMiniCart) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMiniCart]);

  // Slide-up entrance when items appear
  useEffect(() => {
    if (cartCount > 0) {
      const t = setTimeout(() => setVisible(true), 60);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      setShowMiniCart(false);
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

  const handleClick = () => {
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
      setShowMiniCart((prev) => !prev);
    } else {
      onOpen();
    }
  };

  const handleCheckout = () => {
    setShowMiniCart(false);
    onOpen();
  };

  return (
    <div
      ref={containerRef}
      data-aa-cartbar
      className="fixed right-5 bottom-[96px] md:bottom-8 z-[70] pointer-events-none flex flex-col items-end"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Desktop Mini Window (Shown only when toggled open) */}
      {showMiniCart && (
        <div className="hidden md:block mb-3 relative animate-in fade-in slide-in-from-bottom-2 duration-200">
          <MiniCartWindow 
            items={items} 
            total={total} 
            onCheckout={handleCheckout} 
            onClose={() => setShowMiniCart(false)}
          />
        </div>
      )}

      {/* Floating Cart Button (Both Mobile & Desktop) */}
      <button
        type="button"
        onClick={handleClick}
        aria-label="Abrir carrito de compras"
        className={`pointer-events-auto inline-flex items-center gap-4 rounded-full bg-[#1A1A1A]/95 backdrop-blur-md border border-white/15 px-6 py-3.5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A] ${
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
