// src/App.jsx
import { useState } from "react";

// Layout / UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductLists from "./components/ProductLists";
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
        <div className="mb-6">
          <HeroHeadline />
          <SearchBar value={query} onQueryChange={setQuery} />
        </div>
        <PromoBannerCarousel banners={banners} />
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
