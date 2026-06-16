import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useParams, Navigate, useLocation } from "react-router-dom";
import { useMenuData } from "./context/MenuDataContext";
import { useBrand } from "./context/BrandContext";
import { useLocation as useAppLocation } from "./context/LocationContext";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "./components/ui/LoadingScreen";
import { supabase } from "./config/supabase";
import { trackAnalyticsEvent } from "./utils/analytics";
import { safeStorage as localStorage, safeSessionStorage as sessionStorage } from "./utils/safeStorage";

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
const OrderStatus = lazy(() => import("./pages/OrderStatus"));

// Hash Routing Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AlunaLanding = lazy(() => import("./pages/AlunaLanding"));
const ExperiencesPage = lazy(() => import("./pages/ExperiencesPage"));
// const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminOnboarding = lazy(() => import("./pages/AdminOnboarding"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const GlobalPortal = lazy(() => import("./components/admin/GlobalPortal"));
const UniversalCheckout = lazy(() => import("./pages/checkout/UniversalCheckout"));

// Legal Pages
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage"));
const CookiesPage = lazy(() => import("./pages/legal/CookiesPage"));

// Company Pages
const AboutPage = lazy(() => import("./pages/company/AboutPage"));
const ContactPage = lazy(() => import("./pages/company/ContactPage"));

import { useAuth } from "./context/AuthContext";
import BottomTabBar from "./components/navigation/BottomTabBar";
const CustomerSearch = lazy(() => import("./components/admin/CustomerSearch"));

// Carrito
import { useCart } from "./context/CartContext";

// Póster QR
import Toast from "./components/Toast";


export default function App() {
  const { brand_slug } = useParams();
  const { brand: activeBrandFromContext, loadingBrand } = useBrand();
  const { activeBrand: activeBrandFromAuth, profile, loading: authLoading, needsOnboarding } = useAuth();
  
  // Redirect Google OAuth users who signed in but have no business
  if (needsOnboarding && !authLoading) {
    return <Navigate to="/completar-registro" replace />;
  }
  
  // En el panel de admin, priorizamos SIEMPRE la marca de la sesión activa
  const isNewAdminPanel = window.location.hash.startsWith('#admin') || window.location.pathname.startsWith('/admin');
  const activeBrand = isNewAdminPanel ? (activeBrandFromAuth || activeBrandFromContext) : (activeBrandFromContext || activeBrandFromAuth);
  
  const [open, setOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const location = useLocation();
  const { activeLocation } = useAppLocation();
  const currentHash = location.hash;

  const [query, setQuery] = useState("");
  const cart = useCart();

  // ✅ Redirección automática al portal para usuarios autenticados
  useEffect(() => {
    // Si el usuario está autenticado y tenemos su perfil cargado
    if (profile && !authLoading) {
      const hash = window.location.hash;
      
      // Si estamos en una ruta de "entrada" (landing, login, registro o callback de auth)
      // y NO es una ruta de marca específica (brand_slug no existe)
      const isAuthPath = hash === '#login' || hash === '#registro' || hash === '' || hash === '#inicio' || hash.startsWith('#access_token') || hash.startsWith('#error');
      
      if (isAuthPath && !brand_slug) {
        console.log("Redirecting authenticated user to portal...");
        window.location.hash = '#portal';
      }
    }
  }, [profile, authLoading, brand_slug]);
  const [showPOSCustomerModal, setShowPOSCustomerModal] = useState(false);
  const [hasDismissedCustomerModal, setHasDismissedCustomerModal] = useState(false);
  const { categories: dbCategories, restaurantSettings, homeSettings, loading: menuLoading, currentLocation } = useMenuData();

  // ✅ View Detection & UI States (Moved up to avoid initialization errors)
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [window.location.search]);
  
  const isQr = searchParams.get("qr") === "1";
  const isDemo = searchParams.get("demo") === "1";
  
  // (isNewAdminPanel already declared above)
  const isOnboardingView = currentHash === '#admin/onboarding';
  const orderTrackingId = currentHash.startsWith('#order/') ? currentHash.replace('#order/', '') : null;
  
  // ✅ Simplified Hash Routing logic
  const isLandingView = !currentHash || currentHash === "" || currentHash === "#" || currentHash === "#inicio";
  const isExplicitInicio = currentHash === "#inicio";
  const isMenuView = currentHash === "#menu";
  
  // Global platform views that should NOT show the menu/header of a brand
  const isSpecialPlatformView = 
    currentHash.startsWith('#portal') || 
    currentHash === '#experiencias' || 
    currentHash === '#login' || 
    currentHash === '#registro' ||
    currentHash.startsWith('#access_token') ||
    currentHash === '#error_description' ||
    currentHash.startsWith('#error=') ||
    currentHash === '#terminos' ||
    currentHash === '#privacidad' ||
    currentHash === '#cookies' ||
    currentHash === '#nosotros' ||
    currentHash === '#contacto' ||
    currentHash.startsWith('#checkout');

  const isAuthView = currentHash === "#login" || 
                     currentHash === "#registro" || 
                     currentHash.startsWith('#access_token') ||
                     window.location.pathname.startsWith('/login') || 
                     window.location.pathname.startsWith('/registro');
  
  const isOrderingMode = isMenuView || !!localStorage.getItem("aa_current_mesa") || searchParams.get("mesa");
  const hasFloatingCartBar = !!brand_slug && (cart?.items?.length || 0) > 0;
  const shouldRenderPublicMenu =
    !isExplicitInicio &&
    !isSpecialPlatformView &&
    !orderTrackingId &&
    (isOrderingMode || isMenuView || (!isLandingView && !isNewAdminPanel));

  useEffect(() => {
    // En el panel de admin, priorizamos el nombre de la marca de la sesión
    // En el menú público, priorizamos la sede (si hay una activa) o la marca
    let brandName = "Aluna";
    let newTitle = "Aluna";
    
    if (isNewAdminPanel) {
      brandName = activeBrand?.name || "Administración";
      newTitle = brandName;
    } else {
      brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";
      
      // Si estamos en la landing global o portal, forzar Aluna
      if ((isLandingView || currentHash.startsWith('#portal')) && !brand_slug) {
        brandName = "Aluna";
        newTitle = currentHash.startsWith('#portal') ? `Portal | ${brandName}` : brandName;
      } else {
        // En vista pública de un restaurante, usar la sede activa si existe
        newTitle = currentLocation ? currentLocation.name : brandName;
      }
    }
      
    document.title = newTitle;

    // Update favicon
    const faviconUrl = isNewAdminPanel ? (activeBrand?.favicon_url || activeBrand?.logo_url || "/favicon.ico") : (restaurantSettings?.favicon_url || "/favicon.ico");
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [restaurantSettings, activeBrand, isLandingView, brand_slug, currentHash, isNewAdminPanel, currentLocation]);

  const isValidCat = (cat) => cat === "todos" || dbCategories.some(c => c.slug === cat);

  function handleCategorySelect(cat) {
    const slug = typeof cat === "string" ? cat : cat.id;
    setSelectedCategory(slug);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("cat");
    if (p && isValidCat(p)) setSelectedCategory(p);

    const mesa = params.get("mesa") || params.get("t");
    if (mesa) {
      localStorage.setItem("aa_current_mesa", mesa);
      // Keep sessionStorage for legacy or specific session-only needs, but localStorage is primary
      sessionStorage.setItem("aa_current_mesa", mesa);
    }

    const locId = params.get("l") || params.get("location");
    if (locId) {
      localStorage.setItem("aa_current_location_id", locId);
    }

    // Capture fulfillment flow from smart links
    const flow = params.get("flow") || params.get("type");
    if (flow) {
      localStorage.setItem("aa_fulfillment_flow", flow);
    }
  }, []);


  // ✅ Welcome Experience State — solo 1 vez cada 24h por marca
  const WELCOME_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 horas

  const [showWelcome, setShowWelcome] = useState(() => {
    // Check on mount if we should show welcome
    const key = `aluna_welcome_${brand_slug}`;
    const lastSeen = localStorage.getItem(key);
    if (lastSeen && Date.now() - Number(lastSeen) < 24 * 60 * 60 * 1000) {
      return false; // Seen within last 24h
    }
    return false; // Default false, useEffect will decide
  });

  useEffect(() => {
    const isPublicMenu = !isNewAdminPanel && !isOnboardingView && !orderTrackingId && !isQr;
    
    // Solo mostrar bienvenida si hay una marca activa Y estamos en su ruta específica (brand_slug presente)
    if (isPublicMenu && activeBrand && !loadingBrand && brand_slug) {
      const key = `aluna_welcome_${activeBrand.slug || brand_slug}`;
      const lastSeen = localStorage.getItem(key);
      const seenRecently = lastSeen && (Date.now() - Number(lastSeen) < WELCOME_COOLDOWN_MS);
      
      if (!seenRecently) {
        setShowWelcome(true);
      } else {
        setShowWelcome(false);
      }

      // --- ANALYTICS TRACKING ---
      const hasVisited = localStorage.getItem('aluna_tracked_visit');
      if (!hasVisited) {
        trackAnalyticsEvent('menu_visit', {
          brandId: activeBrand.id,
          locationId: activeLocation?.id || currentLocation?.id || null,
        });
        localStorage.setItem('aluna_tracked_visit', 'true');
      }

      const mesa = new URLSearchParams(window.location.search).get('mesa');
      if (mesa) {
        const hasTrackedScan = localStorage.getItem('aluna_tracked_qr');
        if (!hasTrackedScan) {
          trackAnalyticsEvent('qr_scan', {
            brandId: activeBrand.id,
            locationId: activeLocation?.id || currentLocation?.id || null,
            tableId: mesa,
            qrTable: mesa,
          });
          localStorage.setItem('aluna_tracked_qr', 'true');
        }
      }
    } else {
      setShowWelcome(false);
    }
  }, [brand_slug, isNewAdminPanel, isOnboardingView, orderTrackingId, activeBrand, loadingBrand, isQr]);

  // ✅ Trigger Customer Search Modal for Waiters
  useEffect(() => {
    const isPOS = sessionStorage.getItem("aa_pos_mode") === "true";
    const hasCustomer = sessionStorage.getItem("aa_current_customer");
    
    if (isMenuView && isPOS && !hasCustomer && !hasDismissedCustomerModal) {
      setShowPOSCustomerModal(true);
    }
    
    // Reset dismissal when leaving the menu, so next table selection prompts again
    if (!isMenuView) {
      setHasDismissedCustomerModal(false);
    }
  }, [isMenuView, hasDismissedCustomerModal]);

  const handlePOSCustomerSelect = (customer) => {
    if (customer) {
      sessionStorage.setItem("aa_current_customer", JSON.stringify({
        id: customer.id,
        name: customer.name,
        phone: customer.phone
      }));
    } else {
      sessionStorage.removeItem("aa_current_customer");
    }
    setShowPOSCustomerModal(false);
    setHasDismissedCustomerModal(true);
  };

  const handleStartExperience = (flow) => {
    // Guardar timestamp en localStorage para no volver a mostrar en 24h
    const key = `aluna_welcome_${activeBrand?.slug || brand_slug}`;
    localStorage.setItem(key, String(Date.now()));
    
    // Guardar el flujo seleccionado (dine_in, takeaway, delivery)
    if (flow) {
      localStorage.setItem("aa_fulfillment_flow", flow);
    }
    
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
    
    // Ensure slug in URL matches intended brand ONLY if we are in a brand context or admin
    const shouldForceSlug = (brand_slug || isNewAdminPanel) && activeBrand?.slug;
    const currentPath = url.pathname;
    const targetPath = shouldForceSlug ? `/${activeBrand.slug}/` : currentPath;

    // Check if anything actually needs to change before calling replaceState
    const currentCat = url.searchParams.get("cat") || "todos";
    const needsSlugUpdate = shouldForceSlug && currentPath !== targetPath;
    const needsCatUpdate = selectedCategory !== currentCat;

    if (needsSlugUpdate || needsCatUpdate) {
      if (shouldForceSlug) {
        url.pathname = targetPath;
      }

      if (selectedCategory === "todos") {
        url.searchParams.delete("cat");
      } else {
        url.searchParams.set("cat", selectedCategory);
      }
      
      window.history.replaceState(null, "", url);
    }
  }, [FEATURE_TABS, selectedCategory, activeBrand, isNewAdminPanel, brand_slug]);

  // Dynamic counts are now handled internally by ProductLists component
  const counts = useMemo(() => ({ todos: 0 }), []);

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


  // Render loading screen if still authenticating or loading critical brand data
  const isGlobalLoading = authLoading || loadingBrand || (brand_slug && menuLoading);

  // We use a small internal state to handle the fade-out duration
  const [actuallyDone, setActuallyDone] = useState(false);
  useEffect(() => {
    if (!isGlobalLoading) {
      const timer = setTimeout(() => setActuallyDone(true), 100);
      return () => clearTimeout(timer);
    } else {
      setActuallyDone(false);
    }
  }, [isGlobalLoading]);

  // If we specify a slug but the brand is missing after loading
  if (!isGlobalLoading && brand_slug && !activeBrand) {
    return <Navigate to="/" replace />;
  }

  return (
    <div 
      className="leading-snug text-alto-text min-h-screen relative transition-colors duration-500"
      style={{ 
        backgroundColor: restaurantSettings?.theme_background || "#F5F5F7"
      }}
    >
      <AnimatePresence mode="wait">
        {!actuallyDone && (
          <motion.div
            key="global-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999]"
          >
            <LoadingScreen 
              mode="splash" 
              brandLogo={activeBrand?.logo_url || restaurantSettings?.logo_url} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {actuallyDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="contents"
        >
          {/* Standalone Views (Portal, Onboarding, Checkout) */}
          {isOnboardingView && (
            <div className="relative min-h-screen">
              <AdminOnboarding />
            </div>
          )}

          {currentHash.startsWith('#checkout') && (
            <UniversalCheckout />
          )}

          {isNewAdminPanel && !isOnboardingView && (
            <AdminLayout />
          )}

          {orderTrackingId && (
            <Suspense fallback={<LoadingScreen mode="skeleton" />}>
              <OrderStatus orderId={orderTrackingId} />
            </Suspense>
          )}

          {/* Public Views */}
          {isQr && (
            <Suspense fallback={<div />}>
              <QrPoster url={PUBLIC_URL || window.location.origin} />
            </Suspense>
          )}

          {!isOnboardingView && !currentHash.startsWith('#checkout') && !isNewAdminPanel && !orderTrackingId && !isQr && (
            <>
              <AnimatePresence>
                {showWelcome && (
                  <BrandWelcome 
                    brandName={activeLocation?.name || activeBrand?.name}
                    logoUrl={restaurantSettings?.logo_url}
                    bgUrl={homeSettings?.welcome_bg_img}
                    mesa={new URLSearchParams(window.location.search).get('mesa')}
                    onStart={handleStartExperience}
                  />
                )}
              </AnimatePresence>

              {!isDemo && !isAuthView && brand_slug && brand_slug !== 'anonimo' && (
                <Header
                  onCartOpen={() => setOpen(true)}
                  onGuideOpen={() => setOpenGuide(true)}
                  cartCount={cart?.items?.length || 0}
                  currentHash={currentHash}
                />
              )}


        {/* Si es vista Landing Y (no estamos en modo pedido O es un hash explícito #inicio) */}
        {(isExplicitInicio || (isLandingView && !isOrderingMode)) && (
          <Suspense fallback={<LoadingScreen mode="skeleton" />}>
            {brand_slug ? (
              <LandingPage />
            ) : (
              <AlunaLanding />
            )}
          </Suspense>
        )}

        {(currentHash.startsWith('#portal') || currentHash.startsWith('#access_token')) && (
          <Suspense fallback={<LoadingScreen mode="splash" />}>
            {profile ? (
              <GlobalPortal />
            ) : (
              <LoadingScreen mode="splash" />
            )}
          </Suspense>
        )}

        {currentHash === '#experiencias' && (
          <Suspense fallback={<LoadingScreen mode="skeleton" />}>
            <ExperiencesPage />
          </Suspense>
        )}

        {/* Profile page hidden for MVP */}
        {/* currentHash === '#perfil' && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div></div>}>
            <ProfilePage />
          </Suspense>
        ) */}

        {currentHash === '#login' && (
          <Suspense fallback={<LoadingScreen mode="skeleton" />}>
            <LoginPage />
          </Suspense>
        )}

        {currentHash === '#registro' && (
          <Suspense fallback={<LoadingScreen mode="skeleton" />}>
            <RegisterPage />
          </Suspense>
        )}

        {currentHash === '#terminos' && (
          <Suspense fallback={<LoadingScreen mode="splash" />}>
            <TermsPage />
          </Suspense>
        )}
        
        {currentHash === '#privacidad' && (
          <Suspense fallback={<LoadingScreen mode="splash" />}>
            <PrivacyPage />
          </Suspense>
        )}
        
        {currentHash === '#cookies' && (
          <Suspense fallback={<LoadingScreen mode="splash" />}>
            <CookiesPage />
          </Suspense>
        )}

        {currentHash === '#nosotros' && (
          <Suspense fallback={<LoadingScreen mode="splash" />}>
            <AboutPage />
          </Suspense>
        )}

        {currentHash === '#contacto' && (
          <Suspense fallback={<LoadingScreen mode="splash" />}>
            <ContactPage />
          </Suspense>
        )}

        {/* Menu normal: Si estamos en modo orden o hash explícito #menu, o si NO es la vista landing. 
            IMPORTANTE: Excluimos vistas especiales (Portal, Auth, Perfil) y el hash explícito #inicio */}
        {shouldRenderPublicMenu && (
          <>
            <main
              className={`mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl px-5 ${isDemo ? 'pt-12 pb-20 sm:px-6 md:px-8' : 'pt-6 pb-24 sm:px-6 sm:pt-8 md:px-8 md:pt-24'}`}
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
                featureTabs={FEATURE_TABS}
                hideNav={true}
              />
            </main>
            {!isDemo && <Footer hasCartBar={hasFloatingCartBar} />}
          </>
        )}

          {!isDemo && brand_slug && (
            <BottomTabBar
              currentHash={currentHash}
              onAllergensOpen={() => setOpenGuide(true)}
            />
          )}

          {/* Barra flotante y Drawer del carrito */}
          <Suspense fallback={<div />}>
            {brand_slug && <FloatingCartBar items={cart.items} total={cart.total} onOpen={() => setOpen(true)} />}
          </Suspense>
          <Suspense fallback={<div />}>
            <CartModal open={open} onClose={() => setOpen(false)} />
          </Suspense>

          <Suspense fallback={<div />}>
            <CustomerSearch 
              open={showPOSCustomerModal}
              onClose={() => {
                setShowPOSCustomerModal(false);
                setHasDismissedCustomerModal(true);
              }}
              onSelect={handlePOSCustomerSelect}
              brandId={activeBrand?.id}
            />
          </Suspense>

          <Suspense fallback={<div />}>
            <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
              <Suspense fallback={<div />}>
                <DietaryGuide />
              </Suspense>
            </GuideModal>
          </Suspense>
        </>
      )}
        </motion.div>
      )}

      <Toast />
    </div>
  );
}
