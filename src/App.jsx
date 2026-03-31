// src/App.jsx
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useMenuData } from "./context/MenuDataContext";

import { FEATURE_TABS, PUBLIC_URL } from "./config/featureFlags";

// Admin
import AdminLayout from "./components/admin/AdminLayout";

// Layout / UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductLists from "./components/ProductLists";
import SearchBar from "./components/SearchBar";
import HeroHeadline from "./components/HeroHeadline";
import MenuHero from "./components/MenuHero";
const GuideModal = lazy(() => import("./components/GuideModal"));
const DietaryGuide = lazy(() => import("./components/DietaryGuide"));
const FloatingCartBar = lazy(() => import("./components/FloatingCartBar"));
const CartModal = lazy(() => import("./components/CartModal"));
const QrPoster = lazy(() => import("./components/QrPoster"));
const StockAdmin = lazy(() => import("./components/StockAdmin"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));

// Hash Routing Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ExperiencesPage = lazy(() => import("./pages/ExperiencesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
import BottomTabBar from "./components/navigation/BottomTabBar";

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
  teasAndChai,
  moreInfusions,
} from "./data/menuItems";
import { getStockState, slugify } from "./utils/stock";

// Póster QR
import Toast from "./components/Toast";


export default function App() {
  const [open, setOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const cart = useCart();
  const { categories: dbCategories } = useMenuData();

  const isValidCat = (cat) => cat === "todos" || dbCategories.some(c => c.slug === cat);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function handleCategorySelect(cat) {
    const slug = typeof cat === "string" ? cat : cat.id;
    setSelectedCategory(slug);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("cat");
    if (p && isValidCat(p)) setSelectedCategory(p);

    const mesa = params.get("mesa");
    if (mesa) {
      sessionStorage.setItem("aa_current_mesa", mesa);
    }
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
        return st === "in" || st === "low";
      }).length;

    const result = {
      desayunos: count(breakfastItems),
      bowls: count([preBowl]),
      platos: count(mainDishes),
      sandwiches: count(
        sandwichItems?.map((it) => ({ id: "sandwich:" + it.key, name: it.name })) || [],
      ),
      smoothies: count([...(smoothies || []), ...(funcionales || [])]),
      cafe: count([...(coffees || []), ...(infusions || []), ...(teasAndChai || []), ...(moreInfusions || [])]),
      bebidasfrias: count([...(sodas || []), ...(otherDrinks || [])]),
      postres: count(dessertBaseItems),
    };

    result.todos = Object.values(result).reduce((sum, count) => sum + count, 0);

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

  // ✅ Modo demo (?demo=1) – se oculta header, footer, bottom bar
  const isDemo = (() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") === "1";
  })();

  if (isQr) {
    const publicUrl = PUBLIC_URL || window.location.origin;
    return (
      <Suspense fallback={<div />}>
        <QrPoster url={publicUrl} />
      </Suspense>
    );
  }

  // Check for admin routes: #admin (new panel) or ?admin=1 (old stock admin)
  const isNewAdminPanel = currentHash === '#admin';
  
  // Detect hash routing for order tracking #order/UUID
  const orderTrackingId = currentHash.startsWith('#order/') ? currentHash.replace('#order/', '') : null;

  const isOldStockAdmin = (() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "1";
  })();

  if (isNewAdminPanel) {
    return <AdminLayout />;
  }

  if (orderTrackingId) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div></div>}>
        <OrderStatus orderId={orderTrackingId} />
      </Suspense>
    );
  }

  if (isOldStockAdmin) {
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
  const isLandingView = !currentHash || currentHash === '' || currentHash === '#' || currentHash === '#inicio';
  const isMenuView = currentHash === '#menu';
  
  // Detect if user is in "Ordering Mode" (QR, table in session, or explicit menu hash)
  const isOrderingMode = isMenuView || !!sessionStorage.getItem("aa_current_mesa") || new URLSearchParams(window.location.search).get("mesa");

  return (
    <>
      <div className="bg-[#F5F5F7] leading-snug text-alto-text min-h-screen">
        {!isDemo && <Header onCartOpen={() => setOpen(true)} onGuideOpen={() => setOpenGuide(true)} currentHash={currentHash} />}

        {isLandingView && !isOrderingMode && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div></div>}>
            <LandingPage />
          </Suspense>
        )}

        {currentHash === '#experiencias' && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div></div>}>
            <ExperiencesPage />
          </Suspense>
        )}

        {currentHash === '#perfil' && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div></div>}>
            <ProfilePage />
          </Suspense>
        )}

        {/* Menu normal: Si estamos en modo orden o hash explícito #menu, o si NO es la vista landing */}
        {(isOrderingMode || isMenuView || (!isLandingView && currentHash !== '#experiencias' && currentHash !== '#perfil' && currentHash !== '#admin' && !orderTrackingId)) && (
          <main
            className={`mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl px-5 ${isDemo ? 'pt-4 pb-20 sm:px-6 md:px-8' : 'pt-24 sm:px-6 sm:pt-24 md:px-8 md:pt-24'}`}
          >
            <MenuHero 
              query={query}
              setQuery={setQuery}
              activeCategory={selectedCategory}
              setActiveCategory={handleCategorySelect}
              categories={dbCategories}
            />
            <ProductLists
              query={query}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              counts={counts}
              featureTabs={FEATURE_TABS}
              hideNav={true}
            />

            {!isDemo && <Footer hasCartBar={hasFloatingCartBar} />}
          </main>
        )}

        {!isDemo && <BottomTabBar currentHash={currentHash} />}

        {/* Barra flotante y Drawer del carrito */}
        <Suspense fallback={<div />}>
          <FloatingCartBar items={cart.items} total={cart.total} onOpen={() => setOpen(true)} />
        </Suspense>
        <Suspense fallback={<div />}>
          <CartModal open={open} onClose={() => setOpen(false)} />
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
