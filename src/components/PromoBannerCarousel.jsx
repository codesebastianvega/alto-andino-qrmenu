import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import ProductQuickView from "./ProductQuickView";
import GuideModal from "./GuideModal";

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
  const handleInfo = (b) => {
    if (b.id === "pet-friendly") setShowPet(true);
    else if (b.id === "reviews") {
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
    <div className="mt-4" aria-roledescription="carousel">
      <div
        className="relative overflow-hidden rounded-2xl"
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
            <div key={b.id} className="w-full flex-shrink-0 relative h-44 sm:h-56">
              <img
                src={b.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <h3 className="text-white text-lg font-semibold">{b.title}</h3>
                {b.subtitle && <p className="text-white/90 text-sm">{b.subtitle}</p>}
                {b.type === "product" ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(b)}
                      aria-label={"Ver " + b.title}
                      className="px-3 h-8 rounded-lg bg-white/90 text-neutral-900 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdd(b)}
                      aria-label={"Agregar " + b.title}
                      className="px-3 h-8 rounded-lg bg-[#2f4131] text-white text-sm font-medium hover:bg-[#243326] focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
                    >
                      Agregar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => handleInfo(b)}
                      aria-label={b.ctas?.primary?.label || "Ver"}
                      className="px-3 h-8 rounded-lg bg-white/90 text-neutral-900 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
                    >
                      {b.ctas?.primary?.label || "Ver"}
                    </button>
                  </div>
                )}
              </div>
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

