// src/App.jsx
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { CATEGORIES_LIST } from "./config/categories";
import { FEATURE_TABS, PUBLIC_URL } from "./config/featureFlags";

// Layout / UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductLists from "./components/ProductLists";
import SearchBar from "./components/SearchBar";
import HeroHeadline from "./components/HeroHeadline";
import PromoBannerCarousel from "./components/PromoBannerCarousel";
// Componentes con carga diferida
const GuideModal = lazy(() => import("./components/GuideModal"));
const DietaryGuide = lazy(() => import("./components/DietaryGuide"));
const FloatingCartBar = lazy(() => import("./components/FloatingCartBar"));
const CartDrawer = lazy(() => import("./components/CartDrawer"));
const QrPoster = lazy(() => import("./components/QrPoster"));
const StockAdmin = lazy(() => import("./components/StockAdmin"));

// Carrito
import { useCart } from "./context/CartContext";
import {
  breakfastItems,
  mainDishes,
  dessertBaseItems,
  preBowl,
  smoothies,
  funcionales,
  coffees,
  infusions,
  sodas,
  otherDrinks,
  sandwichItems,
} from "./data/menuItems";
import { getStockState, slugify } from "./utils/stock";

// Póster QR
import Toast from "./components/Toast";

const CATS = ["todos", ...CATEGORIES_LIST.map((c) => c.id)];
const isValidCat = (cat) => CATS.includes(cat);

export default function App() {
  const [open, setOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const cart = useCart();

  function handleCategorySelect(cat) {
    const slug = typeof cat === "string" ? cat : cat.id;
    setSelectedCategory(slug);
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("cat");
    if (p && isValidCat(p)) setSelectedCategory(p);
  }, []);

  useEffect(() => {
    if (!isValidCat(selectedCategory)) setSelectedCategory("todos");
  }, [selectedCategory]);

  useEffect(() => {
    if (!FEATURE_TABS) return;
    const url = new URL(window.location.href);
    url.searchParams.set("cat", selectedCategory);
    window.history.replaceState(null, "", url);
  }, [FEATURE_TABS, selectedCategory]);

  const counts = useMemo(() => {
    const count = (items = []) =>
      items.filter((p) => {
        const pid = p.id || p.productId || (p.key ? "sandwich:" + p.key : slugify(p.name));
        const st = getStockState(pid);
        return st === "ok" || st === "low";
      }).length;

    const result = {
      desayunos: count(breakfastItems),
      bowls: count([preBowl]),
      platos: count(mainDishes),
      sandwiches: count(
        sandwichItems?.map((it) => ({ id: "sandwich:" + it.key, name: it.name })) || [],
      ),
      smoothies: count([...(smoothies || []), ...(funcionales || [])]),
      cafe: count([...(coffees || []), ...(infusions || [])]),
      bebidasfrias: count([...(sodas || []), ...(otherDrinks || [])]),
      postres: count(dessertBaseItems),
    };

    result.todos = CATS.filter((c) => c !== "todos").reduce(
      (sum, cat) => sum + (result[cat] || 0),
      0,
    );

    return result;
  }, [
    breakfastItems,
    preBowl,
    mainDishes,
    sandwichItems,
    smoothies,
    funcionales,
    coffees,
    infusions,
    sodas,
    otherDrinks,
    dessertBaseItems,
  ]);

  // ✅ Modo póster QR (?qr=1) – se muestra SOLO el QR
  const isQr = (() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("qr") === "1";
  })();

  if (isQr) {
    const publicUrl = PUBLIC_URL || window.location.origin;
    return (
      <Suspense fallback={<div />}>
        <QrPoster url={publicUrl} />
      </Suspense>
    );
  }

  const isAdmin = (() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "1";
  })();

  if (isAdmin) {
    return (
      <div className="bg-alto-beige leading-snug text-alto-text">
        <main className="mx-auto max-w-3xl px-5 pt-5 sm:px-6 md:px-8">
          <Suspense fallback={<div />}>
            <StockAdmin />
          </Suspense>
        </main>
      </div>
    );
  }

  const hasFloatingCartBar = cart.items && cart.items.length > 0;

  // ✅ Modo menú normal
  return (
    <>
      <div className="bg-alto-beige leading-snug text-alto-text overflow-x-hidden">
        <Header onCartOpen={() => setOpen(true)} onGuideOpen={() => setOpenGuide(true)} />

        <main
          className={`mx-auto max-w-3xl px-5 pt-5 sm:px-6 sm:pt-6 md:px-8 md:pt-8 ${
            hasFloatingCartBar ? "pb-24" : "pb-8"
          }`}
        >
          <div className="mb-6 mt-2">
            <HeroHeadline />
            <SearchBar value={query} onQueryChange={setQuery} />
          </div>
          <PromoBannerCarousel />
          <ProductLists
            query={query}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            counts={counts}
            featureTabs={FEATURE_TABS}
          />

          <Footer />
        </main>

        {/* Barra flotante y Drawer del carrito */}
        <Suspense fallback={<div />}>
          <FloatingCartBar items={cart.items} total={cart.total} onOpen={() => setOpen(true)} />
        </Suspense>
        <Suspense fallback={<div />}>
          <CartDrawer open={open} onClose={() => setOpen(false)} />
        </Suspense>

        <Suspense fallback={<div />}>
          <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
            <Suspense fallback={<div />}>
              <DietaryGuide />
            </Suspense>
          </GuideModal>
        </Suspense>
        <Toast />
      </div>
    </>
  );
}