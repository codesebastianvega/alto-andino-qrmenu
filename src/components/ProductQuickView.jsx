import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../context/CartContext";
import { formatCOP } from "../utils/money";

export default function ProductQuickView({ product, open, onClose }) {
  const { addItem } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const { productId, title, subtitle, price, image } = product;

  const handleAdd = () => {
    addItem?.({ productId, name: title, price, image });
    onClose?.();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-w-sm w-[92%] rounded-2xl bg-white ring-1 ring-neutral-200 shadow-lg">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-black/5 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
        >
          ×
        </button>
        {image && (
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-48 object-cover rounded-t-2xl"
          />
        )}
        <div className="p-5">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>}
          {typeof price !== "undefined" && (
            <p className="mt-2 font-semibold text-neutral-900">{formatCOP(price)}</p>
          )}
          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 w-full h-10 rounded-xl bg-[#2f4131] text-white hover:bg-[#243326] focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

