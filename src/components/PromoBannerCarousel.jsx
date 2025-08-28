import { useEffect, useMemo, useRef, useState } from "react";
import { banners as buildBanners } from "../data/banners";
import { resolveProductById } from "../utils/resolver";
import { useCart } from "../context/CartContext";
import ProductQuickView from "./ProductQuickView";
import PetFriendlyModal from "./PetFriendlyModal";
import StoryModal from "./StoryModal";
import { toast } from "./Toast";
import { formatCOP } from "../utils/money";
import { productStories } from "../data/stories";
import AAImage from "./ui/AAImage";

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
  const autoPausedRef = useRef(false);

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
    const id = setTimeout(() => {
      const next = (index + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 6000);
    return () => clearTimeout(id);
  }, [paused, count, index]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          autoPausedRef.current = true;
          setPaused(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        autoPausedRef.current = true;
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const resume = () => {
    autoPausedRef.current = false;
    setPaused(false);
  };

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
      const url = "https://g.page/r/CUlqcqk_KCXBEBM/review";
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const onTouchStart = () => {
    setPaused(true);
  };

  const onTouchEnd = () => {
    resume();
  };

  return (
    <div className="my-4 md:my-6">
      <div
        className="relative overflow-hidden rounded-2xl"
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={resume}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          onScroll={() => {
            const el = trackRef.current;
            if (!el) return;
            const newIndex = Math.round(el.scrollLeft / el.clientWidth);
            setIndex(newIndex);
          }}
        >
          {items.map((item, i) => {
            const { product } = item;
            const price = Number(product?.price);
            const canAdd = !!product && Number.isFinite(price) && price > 0;
            const addLabel = item.ctas?.primary?.label || "Agregar";
            const viewLabel = item.ctas?.secondary?.label || "Ver";
            return (
              <div key={item.id} className="relative h-44 w-full flex-shrink-0 snap-center sm:h-56">
                <AAImage
                  src={item.image}
                  alt={item.alt || item.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 z-0 h-full w-full object-cover"
                  priority={i === 0}
                />
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
                <div className="pointer-events-auto relative z-30 flex h-full w-full flex-col justify-end p-4">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  {item.subtitle && <p className="text-sm text-white/90">{item.subtitle}</p>}
                  {item.type === "product" ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(item.ctas?.primary?.action, product, item.productId)
                        }
                        aria-label={addLabel}
                        disabled={!canAdd}
                        aria-disabled={!canAdd}
                        className="h-8 rounded-lg bg-[#2f4131] px-3 text-sm font-medium text-white hover:bg-[#243326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 disabled:bg-neutral-400 disabled:text-white/80"
                      >
                        {addLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(item.ctas?.secondary?.action, product, item.productId)
                        }
                        aria-label={viewLabel}
                        disabled={!product}
                        aria-disabled={!product}
                        className="h-8 rounded-lg bg-white/90 px-3 text-sm font-medium text-neutral-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 disabled:bg-neutral-100 disabled:text-neutral-400"
                      >
                        {viewLabel}
                      </button>
                      {productStories[item.productId] && (
                        <button
                          type="button"
                          onClick={() => handleAction("story", product, item.productId)}
                          aria-label={productStories[item.productId].ctaLabel || "Historia"}
                          className="h-8 rounded-lg bg-white/90 px-3 text-sm font-medium text-neutral-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
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
                          onClick={() =>
                            handleAction(item.ctas.primary.action, product, item.productId)
                          }
                          aria-label={item.ctas.primary.label || "Ver"}
                          className="h-8 rounded-lg bg-white/90 px-3 text-sm font-medium text-neutral-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
                        >
                          {item.ctas.primary.label || "Ver"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {item.type === "product" &&
                  (canAdd ? (
                    <div
                      aria-label="Precio"
                      tabIndex={-1}
                      className="absolute right-3 top-3 z-30 rounded-full bg-white/85 px-3 py-1 text-sm font-medium text-[#2f4131] shadow-sm backdrop-blur md:right-4 md:top-4"
                    >
                      {formatCOP(price)}
                    </div>
                  ) : (
                    !product && (
                      <div
                        aria-label="No disponible"
                        tabIndex={-1}
                        className="absolute right-3 top-3 z-30 rounded-full bg-white/85 px-3 py-1 text-sm font-medium text-[#2f4131] shadow-sm backdrop-blur md:right-4 md:top-4"
                      >
                        No disponible
                      </div>
                    )
                  ))}
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-3">
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
              className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span
                className={`h-2 w-2 rounded-full ${i === index ? "bg-white/80" : "bg-white/40"}`}
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