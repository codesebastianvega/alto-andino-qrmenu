import { useEffect, useMemo, useRef, useState } from "react";
import { banners as buildBanners } from "../data/banners";
import { resolveProductById } from "../utils/resolver";
import { useCart } from "../context/CartContext";
import ProductQuickView from "./ProductQuickView";
import Portal from "./Portal";
import { toast } from "./Toast";
import { cop } from "../utils/money";

export default function PromoBannerCarousel() {
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState(null);
  const [petOpen, setPetOpen] = useState(false);
  const startX = useRef(0);

  const items = useMemo(() => {
    return (buildBanners(import.meta.env) || []).map((item) => {
      const product = item.productId ? resolveProductById(item.productId) : null;
      return { ...item, product };
    });
  }, []);

  const count = items.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [paused, count]);

  const handleAction = (action, product) => {
    if (!action) return;
    if (action === "add") {
      if (product) {
        addItem(product, 1);
        toast();
      } else {
        toast("Producto no disponible");
      }
    } else if (action === "quickview") {
      if (product) {
        setQuickProduct(product);
        setQuickOpen(true);
      } else {
        toast("Producto no disponible");
      }
    } else if (action === "modal:petfriendly") {
      setPetOpen(true);
    } else if (action === "link:reviews") {
      const url = import.meta.env.VITE_GOOGLE_REVIEWS_URL;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const onTouchStart = (e) => {
    setPaused(true);
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(diff) > 40) {
      setIndex((i) => (diff > 0 ? (i - 1 + count) % count : (i + 1) % count));
    }
    setPaused(false);
  };

  return (
    <div className="my-4 md:my-6">
      <div
        className="relative rounded-2xl overflow-hidden"
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((item) => {
            const { product } = item;
            const price = Number(product?.price);
            const canAdd = !!product && Number.isFinite(price) && price > 0;
            const addLabel = item.ctas?.primary?.label || "Agregar";
            const viewLabel = item.ctas?.secondary?.label || "Ver";
            return (
              <div
                key={item.id}
                className="relative w-full flex-shrink-0 h-44 sm:h-56"
              >
                <img
                  src={item.image}
                  alt={item.alt || item.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
                <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
                <div className="relative z-30 pointer-events-auto flex h-full w-full flex-col justify-end p-4">
                  <h3 className="text-white text-lg font-semibold">{item.title}</h3>
                  {item.subtitle && (
                    <p className="text-white/90 text-sm">{item.subtitle}</p>
                  )}
                  {item.type === "product" ? (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(item.ctas?.primary?.action, product)}
                        aria-label={addLabel}
                        disabled={!canAdd}
                        aria-disabled={!canAdd}
                        className="px-3 h-8 rounded-lg bg-[#2f4131] text-white text-sm font-medium hover:bg-[#243326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131] disabled:bg-neutral-400 disabled:text-white/80"
                      >
                        {addLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(item.ctas?.secondary?.action, product)}
                        aria-label={viewLabel}
                        disabled={!product}
                        aria-disabled={!product}
                        className="px-3 h-8 rounded-lg bg-white/90 text-neutral-900 text-sm font-medium hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131] disabled:bg-neutral-100 disabled:text-neutral-400"
                      >
                        {viewLabel}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      {item.ctas?.primary && (
                        <button
                          type="button"
                          onClick={() => handleAction(item.ctas.primary.action, product)}
                          aria-label={item.ctas.primary.label || "Ver"}
                          className="px-3 h-8 rounded-lg bg-white/90 text-neutral-900 text-sm font-medium hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
                        >
                          {item.ctas.primary.label || "Ver"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {item.type === "product" && (
                  canAdd ? (
                    <div
                      aria-label="Precio"
                      tabIndex={-1}
                      className="absolute top-3 right-3 md:top-4 md:right-4 z-30 rounded-full px-3 py-1 text-sm bg-white/85 backdrop-blur shadow-sm text-[#2f4131] font-medium"
                    >
                      {cop(price)}
                    </div>
                  ) : (
                    !product && (
                      <div
                        aria-label="No disponible"
                        tabIndex={-1}
                        className="absolute top-3 right-3 md:top-4 md:right-4 z-30 rounded-full px-3 py-1 text-sm bg-white/85 backdrop-blur shadow-sm text-[#2f4131] font-medium"
                      >
                        No disponible
                      </div>
                    )
                  )
                )}
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al banner ${i + 1}`}
              className={`pointer-events-auto h-2 w-2 rounded-full ${i === index ? "bg-white/80" : "bg-white/40"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white`}
            />
          ))}
        </div>
      </div>

      <ProductQuickView
        open={quickOpen}
        product={quickProduct}
        onClose={() => setQuickOpen(false)}
      />

      <Portal>
        {petOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPetOpen(false)} />
            <div className="relative max-w-md w-[92%] rounded-2xl bg-[#FAF7F2] p-5 shadow-lg">
              <button
                type="button"
                onClick={() => setPetOpen(false)}
                aria-label="Cerrar"
                className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-black/5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
              >
                ×
              </button>
              <div className="p-4 text-center">
                <h2 className="text-base font-semibold text-[#2f4131] mb-2">Pet Friendly</h2>
                <p className="text-sm text-neutral-700">Tus mascotas son bienvenidas en Alto Andino.</p>
              </div>
            </div>
          </div>
        )}
      </Portal>
    </div>
  );
}
