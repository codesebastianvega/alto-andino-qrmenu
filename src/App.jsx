import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useMenuData } from "./context/MenuDataContext";
import { useBrand } from "./context/BrandContext";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENTES ---
import BrandWelcome from "./components/BrandWelcome";

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
const AdminOnboarding = lazy(() => import("./pages/AdminOnboarding"));
import { useAuth } from "./context/AuthContext";
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
  const { brand_slug } = useParams();
  const { brand: activeBrandFromContext, loadingBrand } = useBrand();
  const { activeBrand: activeBrandFromAuth, profile } = useAuth();
  
  // En el panel de admin, priorizamos SIEMPRE la marca de la sesión activa
  const isNewAdminPanel = window.location.hash.startsWith('#admin');
  const activeBrand = isNewAdminPanel ? (activeBrandFromAuth || activeBrandFromContext) : (activeBrandFromContext || activeBrandFromAuth);
  
  const [open, setOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [query, setQuery] = useState("");
  const cart = useCart();
  const { categories: dbCategories, restaurantSettings, homeSettings, loading: menuLoading } = useMenuData();

  useEffect(() => {
    // En el panel de admin, priorizamos el nombre de la marca de la sesión
    // En el menú público, priorizamos la configuración de branding de la base de datos
    const brandName = isNewAdminPanel 
      ? (activeBrand?.name || "Administración")
      : (restaurantSettings?.business_name || activeBrand?.name || "Aluna");
      
    document.title = brandName;

    // Update favicon
    const faviconUrl = restaurantSettings?.favicon_url || "/favicon.ico";
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [restaurantSettings, activeBrand]);

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

  // ✅ View Detection & UI States
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [window.location.search]);
  
  const isQr = searchParams.get("qr") === "1";
  const isDemo = searchParams.get("demo") === "1";
  const isOldStockAdmin = searchParams.get("admin") === "1";
  
  // (isNewAdminPanel already declared above)
  const isOnboardingView = currentHash === '#admin/onboarding';
  const orderTrackingId = currentHash.startsWith('#order/') ? currentHash.replace('#order/', '') : null;
  
  const isLandingView = !currentHash || currentHash === '' || currentHash === '#' || currentHash === '#inicio';
  const isMenuView = currentHash === '#menu';
  const isAuthView = currentHash === '#login' || currentHash === '#registro';
  const isOrderingMode = isMenuView || !!sessionStorage.getItem("aa_current_mesa") || searchParams.get("mesa");

  // ✅ Welcome Experience State
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Only show welcome if explicitly in the public menu (not in admin or other views)
    const isPublicMenu = !isNewAdminPanel && !isOnboardingView && !orderTrackingId && !isQr;
    
    if (isPublicMenu && activeBrand && !loadingBrand) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
  }, [brand_slug, isNewAdminPanel, isOnboardingView, orderTrackingId, activeBrand, loadingBrand, isQr]);

  const handleStartExperience = () => {
    setShowWelcome(false);
  };

  // ✅ Bloquear scroll cuando la bienvenida está activa
  useEffect(() => {
    if (showWelcome) {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    } else {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    };
  }, [showWelcome]);



  useEffect(() => {
    if (!FEATURE_TABS) return;
    const url = new URL(window.location.href);
    
    // Ensure slug in URL matches intended brand
    if (activeBrand?.slug) {
      url.pathname = `/${activeBrand.slug}/`;
    }

    if (selectedCategory === "todos") {
      url.searchParams.delete("cat");
    } else {
      url.searchParams.set("cat", selectedCategory);
    }
    
    window.history.replaceState(null, "", url);
  }, [FEATURE_TABS, selectedCategory, activeBrand, isNewAdminPanel]);

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

  // Redirection Logic for Onboarding
  useEffect(() => {
    // Only redirect if explicitly false, not null or loading
    if (isNewAdminPanel && activeBrand && activeBrand.onboarding_completed === false) {
      window.location.hash = '#admin/onboarding';
    }
    if (isOnboardingView && activeBrand && activeBrand.onboarding_completed === true) {
      window.location.hash = '#admin';
    }
  }, [isNewAdminPanel, isOnboardingView, activeBrand]);


  if (loadingBrand || (brand_slug && menuLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
        <p className="text-brand-text/50 font-medium animate-pulse text-sm">Preparando experiencia...</p>
      </div>
    );
  }

  // Si se especificó un slug pero no se encontró la marca
  if (brand_slug && !activeBrand && !loadingBrand) {
    return <Navigate to="/" replace />;
  }

  if (isOnboardingView) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><Loader2 className="animate-spin text-[#7db87a]" /></div>}>
        <AdminOnboarding />
      </Suspense>
    );
  }

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
  if (isQr) {
    const publicUrl = PUBLIC_URL || window.location.origin;
    return (
      <Suspense fallback={<div />}>
        <QrPoster url={publicUrl} />
      </Suspense>
    );
  }

  return (
    <div 
      className="leading-snug text-alto-text min-h-screen transition-colors duration-500"
      style={{ 
        backgroundColor: restaurantSettings?.theme_background || "#F5F5F7"
      }}
    >
      <AnimatePresence>
        {showWelcome && (
          <BrandWelcome 
            brandName={activeBrand?.name}
            logoUrl={restaurantSettings?.logo_url}
            bgUrl={homeSettings?.welcome_bg_img}
            mesa={new URLSearchParams(window.location.search).get('mesa')}
            onStart={handleStartExperience}
          />
        )}
      </AnimatePresence>

      {!isDemo && !isAuthView && <Header onCartOpen={() => setOpen(true)} onGuideOpen={() => setOpenGuide(true)} currentHash={currentHash} />}


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

        {currentHash === '#login' && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div></div>}>
            <LoginPage />
          </Suspense>
        )}

        {currentHash === '#registro' && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div></div>}>
            <RegisterPage />
          </Suspense>
        )}

        {/* Menu normal: Si estamos en modo orden o hash explícito #menu, o si NO es la vista landing */}
        {(isOrderingMode || isMenuView || (!isLandingView && currentHash !== '#experiencias' && currentHash !== '#perfil' && currentHash !== '#admin' && !orderTrackingId)) && (
          <main
            className={`mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl px-5 ${isDemo ? 'pt-12 pb-20 sm:px-6 md:px-8' : 'pt-24 sm:px-6 sm:pt-24 md:px-8 md:pt-24'}`}
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
  );
}
