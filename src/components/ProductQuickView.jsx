import { useEffect, useRef, useState } from "react";
import Portal from "./Portal";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useCart } from "@/context/CartContext";
import { formatCOP } from "@/utils/money";
import { toast } from "./Toast";
import { getProductImage } from "@/utils/images";
import { MILK_OPTIONS, isMilkEligible } from "@/config/milkOptions";

export default function ProductQuickView({ open, product, onClose, onAdd }) {
  useLockBodyScroll(open);
  const { addItem } = useCart();
  const modalRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;
    const el = modalRef.current;
    el?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const focusables = el.querySelectorAll(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0],
          last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  const title = product?.title || product?.name || "";
  const subtitle = product?.subtitle;
  const { id } = product;
  const image = getProductImage(product);

  const isCoffee = isMilkEligible(product);

  const [milk, setMilk] = useState("entera");
  const milkDelta = isCoffee
    ? MILK_OPTIONS.find((m) => m.id === milk)?.priceDelta || 0
    : 0;

  const basePrice = Number(product?.price || 0);
  const finalPrice = basePrice + milkDelta;
  const canAdd = !!id && Number.isFinite(basePrice) && basePrice > 0;

  const handleAdd = () => {
    if (!canAdd) {
      toast("Producto no disponible");
      return;
    }
    const payload = isCoffee ? { ...product, milk } : product;
    addItem({ ...payload, price: finalPrice }, 1);
    onAdd?.();
    onClose?.();
  };

  // Helper para aplicar delay escalonado
  const stagger = (i) => ({
    animation: `fadeUp 0.35s ease-out forwards`,
    animationDelay: `${i * 80}ms`,
    opacity: 0,
  });

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        {/* Fondo */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ease-out"
          onClick={() => onClose?.()}
        />
        {/* Contenedor con fade+scale */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`pointer-events-auto relative z-[110] mx-auto w-[calc(100%-1.5rem)] max-w-screen-sm transform transition-all duration-200 ease-out focus-visible:outline-none ${
            open ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="relative rounded-2xl bg-white shadow-xl p-5">
            <button
              type="button"
              onClick={() => onClose?.()}
              aria-label="Cerrar"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
            >
              ×
            </button>

            {/* Elementos animados en secuencia */}
            <img
              src={image}
              alt={title || product?.name || "Producto"}
              loading="lazy"
              decoding="async"
              className="mb-3 h-48 w-full rounded-xl object-cover"
              style={stagger(0)}
            />

            <h2
              className="text-lg font-semibold text-neutral-900"
              style={stagger(1)}
            >
              {title}
            </h2>

            {subtitle && (
              <p
                className="mt-1 text-sm text-neutral-600"
                style={stagger(2)}
              >
                {subtitle}
              </p>
            )}

            {isCoffee && (
              <div className="mt-3" style={stagger(3)}>
                <p className="text-sm font-medium">Leche</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MILK_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMilk(opt.id)}
                      aria-pressed={milk === opt.id}
                      className={`h-9 rounded-full border px-3 text-sm transition-all duration-150 ease-out ${
                        milk === opt.id
                          ? "border-[#2f4131] bg-[#2f4131] text-white shadow-md scale-105"
                          : "border-black/10 bg-white text-neutral-900 hover:scale-105 dark:border-white/10 dark:bg-neutral-800 dark:text-white"
                      }`}
                    >
                      {opt.label}
                      {opt.priceDelta ? ` (+${formatCOP(opt.priceDelta)})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {Number.isFinite(finalPrice) && (
              <p
                className="mt-2 font-semibold text-neutral-900"
                style={stagger(4)}
              >
                {formatCOP(finalPrice)}
              </p>
            )}

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              aria-disabled={!canAdd}
              style={stagger(5)}
              className="mt-4 h-10 w-full rounded-xl bg-[#2f4131] text-white transition-colors duration-150 hover:bg-[#243326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 disabled:bg-neutral-400 disabled:text-white/80"
            >
              {canAdd ? "Agregar" : "Producto no disponible"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}