import { useEffect, useRef, useState } from 'react';
import Portal from './Portal';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useCart } from '../context/CartContext';
import { formatCOP as cop } from '../utils/money';
import { toast } from './Toast';
import { getProductImage } from "../utils/images";
import { MILK_OPTIONS } from "../data/options";

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
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const focusables = el.querySelectorAll(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  const { id, title, subtitle, price } = product;
  const image = getProductImage(product);
  const isCoffee =
    product?.category === "coffee" ||
    /capuch|latte|espresso|cafe/i.test(product?.title || product?.name || "");
  const [milk, setMilk] = useState("entera");
  const milkDelta = isCoffee
    ? MILK_OPTIONS.find((m) => m.id === milk)?.delta || 0
    : 0;
  const basePrice = Number(price);
  const finalPrice = basePrice + milkDelta;
  const canAdd = !!id && Number.isFinite(finalPrice) && finalPrice > 0;

  const handleAdd = () => {
    if (!canAdd) {
      toast("Producto no disponible");
      return;
    }
    const payload = isCoffee
      ? { ...product, milk, price: finalPrice }
      : { ...product, price: finalPrice };
    addItem(payload);
    onAdd?.(payload);
    onClose?.();
  };

  return (
    <Portal>
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100]">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onClose?.()}
        />
        <div
          ref={modalRef}
          tabIndex={-1}
          className="pointer-events-auto relative z-[110] mx-auto my-6 max-w-screen-sm w-[calc(100%-1.5rem)] focus-visible:outline-none"
        >
          <div className="relative rounded-2xl bg-white shadow-xl">
            <button
              type="button"
              onClick={() => onClose?.()}
              aria-label="Cerrar"
              className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-black/5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
            >
              ×
            </button>
            <div className="p-5">
              <img
                src={image}
                alt={title || product?.name || "Producto"}
                loading="lazy"
                decoding="async"
                className="w-full h-48 object-cover rounded-xl mb-3"
              />
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
              {subtitle && <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>}
              {isCoffee && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Leche</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MILK_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMilk(opt.id)}
                        aria-pressed={milk === opt.id}
                        className={`px-3 h-9 rounded-full border text-sm ${
                          milk === opt.id
                            ? "bg-[#2f4131] text-white border-[#2f4131]"
                            : "bg-white border-black/10"
                        }`}
                      >
                        {opt.label}
                        {opt.delta
                          ? ` (+$${opt.delta.toLocaleString("es-CO")})`
                          : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {Number.isFinite(finalPrice) && (
                <p className="mt-2 font-semibold text-neutral-900">{cop(finalPrice)}</p>
              )}
              <button
                type="button"
                onClick={handleAdd}
                disabled={!canAdd}
                aria-disabled={!canAdd}
                className="mt-4 w-full h-10 rounded-xl bg-[#2f4131] text-white hover:bg-[#243326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131] disabled:bg-neutral-400 disabled:text-white/80"
              >
                {canAdd ? 'Agregar' : 'Producto no disponible'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
