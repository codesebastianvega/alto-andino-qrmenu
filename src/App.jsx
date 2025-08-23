// src/App.jsx
import { useMemo, useState } from "react";

// Layout / UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductLists, {
  BREAKFAST_ITEMS,
  MAINS_ITEMS,
  DESSERT_BASE_ITEMS,
} from "./components/ProductLists";
import SearchBar from "./components/SearchBar";
import HeroHeadline from "./components/HeroHeadline";
import PromoBannerCarousel from "./components/PromoBannerCarousel";
import GuideModal from "./components/GuideModal";
import DietaryGuide from "./components/DietaryGuide";

// Carrito
import FloatingCartBar from "./components/FloatingCartBar";
import CartDrawer from "./components/CartDrawer";
import { useCart } from "./context/CartContext";
import { banners as buildBanners } from "./data/banners";
import { PREBOWL } from "./components/BowlsSection";
import { smoothies, funcionales } from "./components/SmoothiesSection";
import { COFFEES, INFUSIONS } from "./components/CoffeeSection";
import { SODAS, OTHERS } from "./components/ColdDrinksSection";
import { sandwichItems, sandwichPriceByItem } from "./components/Sandwiches";

// Póster QR
import QrPoster from "./components/QrPoster";
import Toast from "./components/Toast";

export default function App() {
  const [open, setOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const cart = useCart();
  const banners = buildBanners(import.meta.env);

  const productMap = useMemo(() => {
    const collections = [
      BREAKFAST_ITEMS,
      MAINS_ITEMS,
      DESSERT_BASE_ITEMS,
      [PREBOWL],
      smoothies,
      funcionales,
      COFFEES,
      INFUSIONS,
      SODAS,
      OTHERS,
    ];
    if (sandwichItems && sandwichPriceByItem) {
      const mapped = sandwichItems.map((it) => {
        const mapping = sandwichPriceByItem[it.key];
        const price = mapping?.unico ?? mapping?.clasico ?? mapping?.grande;
        return { id: "sandwich:" + it.key, name: it.name, price, desc: it.desc };
      });
      collections.push(mapped);
    }
    const map = {};
    for (const col of collections) {
      if (!Array.isArray(col)) continue;
      for (const p of col) {
        const pid = p.id || p.productId;
        if (!pid) continue;
        const prod = {
          ...p,
          id: pid,
          productId: pid,
          name: p.name || p.title,
          title: p.title || p.name,
          subtitle: p.desc || p.subtitle,
          price: p.price,
          image: p.image,
        };
        const ids = [p.id, p.productId].filter(Boolean);
        if (ids.length === 0) ids.push(pid);
        for (const ident of ids) {
          map[ident] = prod;
        }
      }
    }
    return map;
  }, [
    BREAKFAST_ITEMS,
    MAINS_ITEMS,
    DESSERT_BASE_ITEMS,
    PREBOWL,
    smoothies,
    funcionales,
    COFFEES,
    INFUSIONS,
    SODAS,
    OTHERS,
    sandwichItems,
    sandwichPriceByItem,
  ]);

  function resolveProductById(id) {
    if (!id) return null;
    return productMap[id] || null;
  }

  // ✅ Modo póster QR (?qr=1) – se muestra SOLO el QR
  const isQr = (() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("qr") === "1";
  })();
  if (isQr) {
    const publicUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    return <QrPoster url={publicUrl} />;
  }

  // ✅ Modo menú normal
  return (
    <div className="bg-alto-beige text-alto-text leading-snug">
      <Header onCartOpen={() => setOpen(true)} onGuideOpen={() => setOpenGuide(true)} />

      <div className="mx-auto max-w-3xl p-5 sm:p-6 md:p-8">
        <div className="mt-2 mb-6">
          <HeroHeadline />
          <SearchBar value={query} onQueryChange={setQuery} />
        </div>
        <PromoBannerCarousel items={banners} resolveProductById={resolveProductById} />
        <ProductLists
          query={query}
          activeCategoryId={activeCategoryId}
          onCategorySelect={(cat) => setActiveCategoryId(cat.id)}
        />

        <Footer />

        {/* Barra flotante y Drawer del carrito */}
        <FloatingCartBar
          items={cart.items}
          total={cart.total}
          onOpen={() => setOpen(true)}
        />
        <CartDrawer open={open} onClose={() => setOpen(false)} />
      </div>

      <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
        <DietaryGuide />
      </GuideModal>
      <Toast />
    </div>
  );
}
