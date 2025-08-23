import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import ProductQuickView from "./ProductQuickView";
import GuideModal from "./GuideModal";
import { COP as cop } from "../utils/money";

export default function PromoBannerCarousel({ banners = [] }) {
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [quickProduct, setQuickProduct] = useState(null);
  const [showPet, setShowPet] = useState(false);
  const startX = useRef(0);

  const count = banners.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [paused, count]);

  const handleAdd = (b) => {
    if (!b?.productId) return;
    addItem?.({ productId: b.productId, name: b.title, price: b.price, image: b.image });
  };
  const handleView = (b) => setQuickProduct(b);
  const handleInfo = (action) => {
    if (action === "modal:petfriendly") setShowPet(true);
    else if (action === "link:reviews") {
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
    <div
      className="mt-4 -mx-5 sm:-mx-6 md:-mx-8 px-5 sm:px-6 md:px-8 relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#efe7dc] to-transparent"
      aria-roledescription="carousel"
    >
      <div
        className="relative"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          maskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b) => (
            <div
              key={b.id}
              className="w-full flex-shrink-0 h-44 sm:h-56 relative rounded-2xl overflow-hidden"
            >
              <img
                src={b.image}
                alt={b.alt}
                loading="lazy"
                referrerPolicy="no-referrer"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <h3 className="text-white text-lg font-semibold">{b.title}</h3>
                {b.subtitle && <p className="text-white/90 text-sm">{b.subtitle}</p>}
                {b.type === "product" ? (
                  <div className="mt-2 flex gap-2">
                    {b.ctas?.secondary && (
                      <button
                        type="button"
                        onClick={() => handleView(b)}
                        aria-label={b.ctas.secondary.label || "Ver"}
                        className="px-3 h-8 rounded-lg bg-white/90 text-neutral-900 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
                      >
                        {b.ctas.secondary.label || "Ver"}
                      </button>
                    )}
                    {b.productId && b.ctas?.primary && (
                      <button
                        type="button"
                        onClick={() => handleAdd(b)}
                        aria-label={b.ctas.primary.label || "Agregar"}
                        className="px-3 h-8 rounded-lg bg-[#2f4131] text-white text-sm font-medium hover:bg-[#243326] focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
                      >
                        {b.ctas.primary.label || "Agregar"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    {b.ctas?.primary && (
                      <button
                        type="button"
                        onClick={() => handleInfo(b.ctas.primary.action)}
                        aria-label={b.ctas.primary.label || "Ver"}
                        className="px-3 h-8 rounded-lg bg-white/90 text-neutral-900 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
                      >
                        {b.ctas.primary.label || "Ver"}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {b.type === "product" && b.price != null && !Number.isNaN(Number(b.price)) && (
                <div
                  aria-label="Precio"
                  tabIndex={-1}
                  className="absolute top-3 right-3 md:top-4 md:right-4 rounded-full px-3 py-1 text-sm bg-white/85 backdrop-blur text-[#2f4131] font-medium"
                >
                  {cop(b.price)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ir al banner ${i + 1}`}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"} focus:outline-none focus:ring-2 focus:ring-white`}
            />
          ))}
        </div>
      </div>

      <ProductQuickView
        open={!!quickProduct}
        onClose={() => setQuickProduct(null)}
        product={
          quickProduct && {
            productId: quickProduct.productId,
            title: quickProduct.title,
            subtitle: quickProduct.subtitle,
            price: quickProduct.price,
            image: quickProduct.image,
          }
        }
      />

      <GuideModal open={showPet} onClose={() => setShowPet(false)}>
        <div className="p-4 text-center">
          <h2 className="text-base font-semibold text-[#2f4131] mb-2">Pet Friendly</h2>
          <p className="text-sm text-neutral-700">
            Tus mascotas son bienvenidas en Alto Andino.
          </p>
        </div>
      </GuideModal>
    </div>
  );
}

