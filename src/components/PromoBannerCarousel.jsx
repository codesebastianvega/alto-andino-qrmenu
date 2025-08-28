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
      const url = "https://g.page/r/CUlqcqk_KCXBEBM/review";
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="my-4 md:my-6">
      <div
        className="relative overflow-hidden rounded-2xl"
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
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
          {items.map((item) => {
            const { product } = item;
            const price = Number(product?.price);
            const canAdd = !!product && Number.isFinite(price) && price > 0;
            const addLabel = item.ctas?.primary?.label || "Agregar";
            const viewLabel = item.ctas?.secondary?.label || "Ver";
            return (
              <div
                key={item.id}
                className="relative h-32 w-full flex-shrink-0 snap-center sm:h-40"
                style={{ backgroundColor: item.bgColor || "#2f4131" }}
              >
                {/* Gradiente superior para legibilidad del título */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/45 via-black/20 to-transparent" />
                <div className="pointer-events-auto relative z-20 flex h-full w-full flex-col justify-start p-3 sm:p-4">
                  <div className={`flex items-center justify-between gap-3 ${item.type === "product" && canAdd ? "pr-24" : ""}`}>
                    <div className="min-w-0">
                      <h3 className="truncate text-base sm:text-lg font-semibold leading-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{item.title}</h3>
                      {item.subtitle && (
                        <p className="mt-0.5 line-clamp-2 text-xs sm:text-sm leading-snug text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">{item.subtitle}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {item.type === "product" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAction(item.ctas?.primary?.action, product, item.productId)}
                            aria-label={addLabel}
                            disabled={!canAdd}
                            aria-disabled={!canAdd}
                            className="h-8 rounded-lg bg-white/90 px-3 text-sm font-medium text-neutral-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:bg-neutral-400 disabled:text-white/80"
                          >
                            {addLabel}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(item.ctas?.secondary?.action, product, item.productId)}
                            aria-label={viewLabel}
                            disabled={!product}
                            aria-disabled={!product}
                            className="h-8 rounded-lg bg-transparent px-3 text-sm font-medium text-white ring-1 ring-inset ring-white/70 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
                          >
                            {viewLabel}
                          </button>
                        </>
                      ) : (
                        item.ctas?.primary && (
                          <button
                            type="button"
                            onClick={() => handleAction(item.ctas.primary.action, product, item.productId)}
                            aria-label={item.ctas.primary.label || "Ver"}
                            className="h-8 rounded-lg bg-white/90 px-3 text-sm font-medium text-neutral-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            {item.ctas.primary.label || "Ver"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
                {item.type === "product" && canAdd && (
                  <div
                    aria-label="Precio"
                    tabIndex={-1}
                    className="absolute right-3 top-3 z-30 rounded-full bg-white/85 px-3 py-1 text-sm font-medium text-[#2f4131] shadow-sm backdrop-blur md:right-4 md:top-4"
                  >
                    {formatCOP(price)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dots desactivados para no interferir con CTAs */}
      </div>

      <ProductQuickView open={quickOpen} product={quickProduct} onClose={() => setQuickOpen(false)} />
      <PetFriendlyModal open={petOpen} onClose={() => setPetOpen(false)} />
      <StoryModal open={storyOpen} story={story} onClose={() => setStoryOpen(false)} />
    </div>
  );
}
