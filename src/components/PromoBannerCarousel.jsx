import { useEffect, useMemo, useRef, useState } from "react";
import { banners as buildBanners } from "../data/banners";
import { resolveProductById } from "../utils/resolver";
import { useCart } from "../context/CartContext";
import ProductQuickView from "./ProductQuickView";
import PetFriendlyModal from "./PetFriendlyModal";
import StoryModal from "./StoryModal";
import { toast } from "./Toast";
import { cop } from "../utils/money";
import { productStories } from "../data/stories";

export default function PromoBannerCarousel() {
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState(null);
  const [petOpen, setPetOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [story, setStory] = useState(null);
  const trackRef = useRef(null);

  const items = useMemo(() => {
    return (buildBanners(import.meta.env) || []).map((item) => {
      const product = item.productId ? resolveProductById(item.productId) : null;
      return { ...item, product };
    });
  }, []);

  const count = items.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const el = trackRef.current;
    if (!el) return;
    const id = setInterval(() => {
      const next = (index + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 6000);
    return () => clearInterval(id);
  }, [paused, count, index]);

  const handleAction = (action, product, productId) => {
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
    } else if (action === "story" || action === "recipe") {
      const st = productStories[productId];
      if (!st) {
        toast("Aún no tenemos historia para este producto");
        return;
      }
      setStory(st);
      setStoryOpen(true);
    } else if (action === "link:reviews") {
      const url = import.meta.env.VITE_GOOGLE_REVIEWS_URL;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const onTouchStart = () => {
    setPaused(true);
  };

  const onTouchEnd = () => {
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
          ref={trackRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
          onScroll={() => {
            const el = trackRef.current;
            if (!el) return;
            const newIndex = Math.round(el.scrollLeft / el.clientWidth);
            setIndex(newIndex);
          }}
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
                className="relative w-full flex-shrink-0 h-44 sm:h-56 snap-center"
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
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAction(item.ctas?.primary?.action, product, item.productId)}
                        aria-label={addLabel}
                        disabled={!canAdd}
                        aria-disabled={!canAdd}
                        className="px-3 h-8 rounded-lg bg-[#2f4131] text-white text-sm font-medium hover:bg-[#243326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131] disabled:bg-neutral-400 disabled:text-white/80"
                      >
                        {addLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(item.ctas?.secondary?.action, product, item.productId)}
                        aria-label={viewLabel}
                        disabled={!product}
                        aria-disabled={!product}
                        className="px-3 h-8 rounded-lg bg-white/90 text-neutral-900 text-sm font-medium hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131] disabled:bg-neutral-100 disabled:text-neutral-400"
                      >
                        {viewLabel}
                      </button>
                      {productStories[item.productId] && (
                        <button
                          type="button"
                          onClick={() => handleAction("story", product, item.productId)}
                          aria-label={productStories[item.productId].ctaLabel || "Historia"}
                          className="px-3 h-8 rounded-lg bg-white/90 text-neutral-900 text-sm font-medium hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
                        >
                          {productStories[item.productId].ctaLabel || "Historia"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3">
                      {item.ctas?.primary && (
                        <button
                          type="button"
                          onClick={() => handleAction(item.ctas.primary.action, product, item.productId)}
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

              onClick={() => {
                const el = trackRef.current;
                if (el) {
                  el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
                }
              }}
              aria-label={`Ir al slide ${i + 1}`}
              className="pointer-events-auto h-8 w-8 rounded-full grid place-items-center focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  i === index ? "bg-white/80" : "bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <ProductQuickView
        open={quickOpen}
        product={quickProduct}
        onClose={() => setQuickOpen(false)}
      />
      <PetFriendlyModal open={petOpen} onClose={() => setPetOpen(false)} />
      <StoryModal open={storyOpen} story={story} onClose={() => setStoryOpen(false)} />
    </div>
  );
}
