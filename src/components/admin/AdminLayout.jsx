import { useState, useEffect, lazy, Suspense } from 'react';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeSessionStorage as sessionStorage } from '../../utils/safeStorage';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLocations } from '../../context/LocationContext';
import AdminPinLogin from './AdminPinLogin';
import ContextBreadcrumb from './ContextBreadcrumb';
import { Badge } from './ui';
import LockOverlay from './LockOverlay';
import UpgradeModal from './UpgradeModal';
import { useMenuData } from '../../context/MenuDataContext';
import { useBrand } from '../../context/BrandContext';
import { usePlan } from '../../hooks/usePlan';
import Toast, { toast as toastAlert } from '../Toast';
import AccountSuspendedOverlay from './AccountSuspendedOverlay';
import AlunaCopilot from './AlunaCopilot';
import StoreStatusControl from './StoreStatusControl';
import soundService from '../../utils/soundService';
import { useAdminModalBack } from '../../hooks/useAdminModalBack';
import { ALL_NAV_ITEMS } from './layout/AdminNavConfig';
import AdminSidebar from './layout/AdminSidebar';
import AdminMobileNavigation from './layout/AdminMobileNavigation';

const AdminLiveMenu = lazy(() => import('../../pages/AdminLiveMenu'));
const AdminProducts = lazy(() => import('../../pages/AdminProducts'));
const AdminCategories = lazy(() => import('../../pages/AdminCategories'));
const AdminModifiers = lazy(() => import('../../pages/AdminModifiers'));
const AdminExperiences = lazy(() => import('../../pages/AdminExperiences'));
const AdminRecipes = lazy(() => import('../../pages/AdminRecipes'));
const AdminSettings = lazy(() => import('../../pages/AdminSettings'));
const AdminModifierGroups = lazy(() => import('../../pages/AdminModifierGroups'));
const AdminTables = lazy(() => import('../../pages/AdminTables'));
const AdminDeliveryDrivers = lazy(() => import('../../pages/AdminDeliveryDrivers'));
const AdminOrders = lazy(() => import('../../pages/AdminOrders'));
const AdminOperations = lazy(() => import('../../pages/AdminOperations'));
const AdminKitchen = lazy(() => import('../../pages/AdminKitchen'));
const AdminBar = lazy(() => import('../../pages/AdminBar'));
const AdminDashboard = lazy(() => import('../../pages/AdminDashboard'));
const AdminAnalytics = lazy(() => import('../../pages/AdminAnalytics'));
const AdminFinance = lazy(() => import('../../pages/AdminFinance'));
const AdminPromotions = lazy(() => import('../../pages/AdminPromotions'));
const AdminWaiter = lazy(() => import('../../pages/AdminWaiter'));
const AdminStaff = lazy(() => import('../../pages/AdminStaff'));
const AdminSedes = lazy(() => import('../../pages/AdminSedes'));
const AdminWebContent = lazy(() => import('../../pages/AdminWebContent'));
const AdminMenuPrint = lazy(() => import('../../pages/AdminMenuPrint'));
const AdminBusinessProfile = lazy(() => import('../../pages/AdminBusinessProfile'));
const AdminProfile = lazy(() => import('../../pages/AdminProfile'));
const AlunaLab = lazy(() => import('../../pages/AlunaLab'));

function TabLoader() {
  return (
    <div className="flex items-center justify-center min-h-[55vh] w-full">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
    </div>
  );
}

export default function AdminLayout() {
  const getInitialPage = () => {
    const params = new URLSearchParams(window.location.search);
    const adminPageParam = params.get('admin_page');
    if (adminPageParam) return adminPageParam;
    if (window.location.pathname.includes('/checkout')) return 'checkout';
    return 'orders';
  };

  const { user: authUser, profile, loading: authLoading, activeBrand, activePlan } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const effectiveBrand = activeBrand || brandFromContext;
  const { can, loading: planLoading, isTrialActive, startTrial, trialAlreadyUsed } = usePlan();
  const { activeLocationId, activeLocation, isAllLocations } = useLocations();
  const [user, setUser] = useState(null);
  const activeBrandId = effectiveBrand?.id || profile?.brand_id || user?.brand_id || localStorage.getItem('aa_active_brand_id');
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [preparingOrdersCount, setPreparingOrdersCount] = useState(0);
  const [globalIncomingOrder, setGlobalIncomingOrder] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useAdminModalBack(isMobileDrawerOpen, () => setIsMobileDrawerOpen(false));
  useAdminModalBack(showUpgradeModal, () => setShowUpgradeModal(false));
  useAdminModalBack(showPlanSelector, () => setShowPlanSelector(false));

  const { restaurantSettings } = useMenuData();

  useEffect(() => {
    if (planLoading) return;
    const currentItem = ALL_NAV_ITEMS.find(item => item.id === currentPage);
    if (currentItem?.feature && !can(currentItem.feature)) {
      setLockedFeatureName(currentItem.label);
      setShowUpgradeModal(true);
    }
  }, [currentPage, can, planLoading]);

  const handleSelectPage = (pageId, label, featureKey) => {
    if (planLoading) return;
    if (featureKey && !can(featureKey)) {
      setLockedFeatureName(label);
      setShowUpgradeModal(true);
      return;
    }
    setShowUpgradeModal(false);
    setShowPlanSelector(false);
    if (pageId !== currentPage) {
      const params = new URLSearchParams(window.location.search);
      params.set('admin_page', pageId);
      const targetPath = effectiveBrand?.slug ? `/${effectiveBrand.slug}/` : window.location.pathname;
      window.history.pushState({ adminPage: pageId }, '', `${targetPath}?${params.toString()}${window.location.hash || '#admin'}`);
      setCurrentPage(pageId);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageInUrl = params.get('admin_page') || 'orders';
      if (pageInUrl !== currentPage) setCurrentPage(pageInUrl);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);

  useEffect(() => {
    const handleAlunaAction = (e) => {
      const pageId = e.detail?.target || e.detail?.pageId;
      if (pageId) handleSelectPage(pageId);
    };
    window.addEventListener('aluna:navigate', handleAlunaAction);
    window.addEventListener('aluna:prefill', handleAlunaAction);
    window.addEventListener('aluna:open-modal', handleAlunaAction);
    return () => {
      window.removeEventListener('aluna:navigate', handleAlunaAction);
      window.removeEventListener('aluna:prefill', handleAlunaAction);
      window.removeEventListener('aluna:open-modal', handleAlunaAction);
    };
  }, [can, planLoading]);

  const logoUrl = effectiveBrand?.logo_url || restaurantSettings?.logo_url || '/favicon.png';
  const restaurantName = effectiveBrand?.name || restaurantSettings?.business_name || 'Mi Negocio';

  useEffect(() => {
    if (authLoading) return;
    if (authUser && profile) {
      const isAdminRole = ['admin', 'owner', 'superadmin', 'encargado'].includes(profile.role);
      if (isAdminRole) {
        setUser({
          id: authUser.id,
          name: profile.full_name || authUser.email || 'Admin',
          role: profile.role,
          auth_session: true,
        });
      } else {
        setUser(null);
      }
    } else if (!authUser) {
      const savedSession = sessionStorage.getItem('aa_admin_session');
      if (savedSession) {
        try {
          setUser(JSON.parse(savedSession));
        } catch {
          sessionStorage.removeItem('aa_admin_session');
        }
      }
    }
  }, [authUser, profile, authLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let changed = false;
    if (params.get('admin_page') !== currentPage) {
      params.set('admin_page', currentPage);
      changed = true;
    }
    if (!isAllLocations && activeLocationId && params.get('location_id') !== activeLocationId) {
      params.set('location_id', activeLocationId);
      changed = true;
    } else if (isAllLocations && params.has('location_id')) {
      params.delete('location_id');
      params.delete('sede_id');
      changed = true;
    }
    if (changed) {
      const targetPath = effectiveBrand?.slug ? `/${effectiveBrand.slug}/` : window.location.pathname;
      window.history.replaceState(null, '', `${targetPath}?${params.toString()}${window.location.hash}`);
    }
  }, [currentPage, effectiveBrand, activeLocationId, isAllLocations]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'kitchen' && !['kitchen', 'bar', 'recipes', 'inventory'].includes(currentPage)) setCurrentPage('kitchen');
    else if (user.role === 'bar' && !['bar', 'kitchen', 'recipes'].includes(currentPage)) setCurrentPage('bar');
    else if (user.role === 'waiter' && !['waiter', 'orders', 'bar'].includes(currentPage)) setCurrentPage('waiter');
    else if (user.role === 'cashier' && !['operations', 'orders', 'waiter'].includes(currentPage)) setCurrentPage('operations');
    else if (user.role === 'promoter' && !['orders'].includes(currentPage)) setCurrentPage('orders');
  }, [user, currentPage]);

  useEffect(() => {
    if (!activeBrandId || (!isAllLocations && !activeLocationId)) return;

    let knownOrderIds = new Set();
    let isFirstCheck = true;

    const fetchPendingCount = async () => {
      let query = supabase
        .from('orders')
        .select('id, status, customer_name, total_amount, created_at')
        .eq('brand_id', activeBrandId)
        .in('status', ['new', 'preparing']);

      if (!isAllLocations && activeLocationId) query = query.eq('location_id', activeLocationId);

      const { data, error } = await query;
      if (!error && data) {
        const counts = data.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, { new: 0, preparing: 0 });
        setNewOrdersCount(counts.new);
        setPreparingOrdersCount(counts.preparing);

        if (isFirstCheck) {
          isFirstCheck = false;
          data.forEach(o => knownOrderIds.add(o.id));
        } else {
          const newUnseen = data.filter(o => o.status === 'new' && !knownOrderIds.has(o.id));
          data.forEach(o => knownOrderIds.add(o.id));
          if (newUnseen.length > 0) {
            const latestNew = newUnseen[0];
            soundService.startNewOrderLoop(3500);
            setGlobalIncomingOrder(latestNew);
            const shortCode = latestNew.id ? `#${latestNew.id.slice(0, 4).toUpperCase()}` : '';
            toastAlert(`🔔 ¡Nuevo pedido ${shortCode} recibido!`, { duration: 6000 });
          }
        }
      }
    };

    fetchPendingCount();
    const layoutPollInterval = setInterval(fetchPendingCount, 15000);

    const channel = supabase.channel(`layout_orders-${activeBrandId}-${activeLocationId || 'all'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `brand_id=eq.${activeBrandId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          knownOrderIds.add(payload.new.id);
          soundService.startNewOrderLoop(3500);
          setGlobalIncomingOrder(payload.new);
          const shortCode = payload.new.id ? `#${payload.new.id.slice(0, 4).toUpperCase()}` : '';
          toastAlert(`🔔 ¡Nuevo pedido ${shortCode} recibido!`, { duration: 6000 });
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`🔔 ¡Nuevo Pedido ${shortCode}!`, {
                body: `${payload.new.customer_name || 'Cliente'} - $${Number(payload.new.total_amount || 0).toLocaleString()}`,
                icon: '/boku-icon-192.png'
              });
            } catch {}
          }
        }
        setTimeout(() => fetchPendingCount(), 800);
      })
      .subscribe();

    return () => {
      clearInterval(layoutPollInterval);
      supabase.removeChannel(channel);
    };
  }, [activeBrandId, activeLocationId, isAllLocations]);

  const missingAlerts = {
    profile: !profile?.phone || !profile?.full_name,
    business_profile: !activeBrand?.email || !activeBrand?.phone || !activeBrand?.city || !activeBrand?.country,
    settings: !restaurantSettings?.whatsapp_number_orders
  };

  const currentItemLabel = ALL_NAV_ITEMS.find(i => i.id === currentPage)?.label || 'Panel';

  const handleSignOut = async () => {
    sessionStorage.removeItem('aa_admin_session');
    if (user?.auth_session) {
      try { await supabase.auth.signOut(); } catch {}
      window.location.href = '/';
    } else {
      setUser(null);
    }
  };

  if (authLoading || (authUser && !profile)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F170F] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-primary/20 rounded-full animate-pulse" />
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-brand-primary rounded-full animate-spin" />
        </div>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Verificando credenciales...</p>
      </div>
    );
  }

  if (!user) return <AdminPinLogin onLogin={setUser} />;

  if (currentPage === 'aluna_lab') {
    return (
      <Suspense fallback={<TabLoader />}>
        <AlunaLab brand={activeBrand || (activeBrandId ? { id: activeBrandId, name: restaurantName } : null)} onBack={() => handleSelectPage('products')} />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F4F2]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        logoUrl={logoUrl}
        user={user}
        currentPage={currentPage}
        handleSelectPage={handleSelectPage}
        planLoading={planLoading}
        can={can}
        newOrdersCount={newOrdersCount}
        preparingOrdersCount={preparingOrdersCount}
        missingAlerts={missingAlerts}
        activeBrand={activeBrand}
        isTrialActive={isTrialActive}
        activePlan={activePlan}
        trialAlreadyUsed={trialAlreadyUsed}
        startTrial={startTrial}
        setShowPlanSelector={setShowPlanSelector}
      />

      <main className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[240px]'} pb-[72px] lg:pb-0`}>
        <header className="h-16 bg-white border-b border-gray-200/60 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 shadow-sm shadow-black/[0.02]">
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden lg:block"><ContextBreadcrumb onNavigate={handleSelectPage} /></div>
            <div className="h-6 w-px bg-gray-200 hidden lg:block" />
            <div className="flex items-center gap-3">
              <h2 className="text-base lg:text-lg font-bold text-gray-900 tracking-tight">{currentItemLabel}</h2>
              <AnimatePresence mode="wait">
                {!isAllLocations && activeLocation && (
                  <motion.div key={activeLocation.id} initial={{ opacity: 0, x: -10, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center">
                    <Badge variant="indigo">
                      <div className="flex items-center gap-1"><MapPin size={10} className="text-indigo-400" /><span>{activeLocation.name}</span></div>
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {activeBrand && (() => {
              const daysLeft = activeBrand.trial_end_date ? Math.max(0, Math.ceil((new Date(activeBrand.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
              const isPaid = activeBrand?.payment_verified === true || activeBrand?.payment_verified === 'true';
              if (isPaid) return <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cuenta Activa</span></div>;
              if (daysLeft > 0) return <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /><span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Prueba Activa: {daysLeft} días</span></div>;
              return <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Pago Pendiente</span></div>;
            })()}
          </div>

          <div className="flex items-center gap-3">
            <StoreStatusControl />
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentPage('profile')}>
                <div className="text-right hidden sm:block">
                  <div className="text-[13px] font-semibold text-gray-800 leading-tight">{profile?.full_name || user.email}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{profile?.role || 'Propietario'}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold text-brand-primary">{(profile?.full_name || user.email)?.[0].toUpperCase()}</span>
                  )}
                </div>
              </div>
              <button onClick={handleSignOut} className="w-8 h-8 rounded-full bg-[#1C2B1E] flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer" title="Cerrar sesión">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {globalIncomingOrder && currentPage !== 'orders' && (
          <div className="bg-red-600 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg z-40 animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔔</span>
              <div className="text-xs sm:text-sm font-black">
                ¡NUEVO PEDIDO #{globalIncomingOrder.id?.slice(0, 4).toUpperCase()}! — {globalIncomingOrder.customer_name || 'Cliente'} (${Number(globalIncomingOrder.total_amount || 0).toLocaleString()})
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { soundService.stopNewOrderLoop(); setGlobalIncomingOrder(null); handleSelectPage('orders', 'Pedidos'); }} className="px-3.5 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shadow-sm cursor-pointer">
                Ir a Pedidos Ahora →
              </button>
              <button type="button" onClick={() => { soundService.stopNewOrderLoop(); setGlobalIncomingOrder(null); }} className="px-2.5 py-1.5 rounded-xl bg-red-800 hover:bg-red-900 text-white font-bold text-xs cursor-pointer">
                Silenciar
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 relative w-full max-w-full overflow-x-hidden pb-[calc(env(safe-area-inset-bottom,0px)+84px)] lg:pb-0">
          <Suspense fallback={<TabLoader />}>
            {currentPage === 'web' && <AdminWebContent />}
            {currentPage === 'live_menu' && <AdminLiveMenu />}
            {currentPage === 'products' && <AdminProducts />}
            {currentPage === 'categories' && <AdminCategories />}
            {currentPage === 'experiences' && <AdminExperiences />}
            {currentPage === 'recipes' && <AdminRecipes />}
            {currentPage === 'modifier_groups' && <AdminModifierGroups />}
            {currentPage === 'menu_print' && <AdminMenuPrint />}
            {currentPage === 'inventory' && <AdminModifiers />}
            {currentPage === 'tables' && <AdminTables />}
            {currentPage === 'delivery_drivers' && <AdminDeliveryDrivers />}
            {currentPage === 'orders' && <AdminOrders />}
            {currentPage === 'kitchen' && <AdminKitchen />}
            {currentPage === 'bar' && <AdminBar />}
            {currentPage === 'settings' && <AdminSettings />}
            {currentPage === 'staff' && <AdminStaff />}
            {currentPage === 'sedes' && <AdminSedes />}
            {currentPage === 'dashboard' && <AdminDashboard />}
            {currentPage === 'analytics' && <AdminAnalytics />}
            {currentPage === 'finance' && <AdminFinance />}
            {currentPage === 'promotions' && <AdminPromotions />}
            {currentPage === 'waiter' && <AdminWaiter />}
            {currentPage === 'operations' && <AdminOperations />}
            {currentPage === 'business_profile' && <AdminBusinessProfile />}
            {currentPage === 'profile' && <AdminProfile />}
          </Suspense>

          <LockOverlay
            isVisible={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            onUpgrade={() => { setShowUpgradeModal(false); setShowPlanSelector(true); }}
            featureName={lockedFeatureName}
            planNeeded={
              lockedFeatureName === 'Identidad Visual' ? 'Emprendedor' :
              (lockedFeatureName === 'Gestión Web' || lockedFeatureName === 'Dashboard' || lockedFeatureName === 'Personal / Staff') ? 'Esencial' : 'Profesional'
            }
            brandName={restaurantName}
          />

          <UpgradeModal
            isOpen={showPlanSelector}
            onClose={() => setShowPlanSelector(false)}
            currentPlanSlug={activePlan?.slug}
            onSelectPage={handleSelectPage}
            startTrial={startTrial}
            isTrialActive={isTrialActive}
            trialAlreadyUsed={trialAlreadyUsed}
          />
        </div>
      </main>

      <AdminMobileNavigation
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        logoUrl={logoUrl}
        restaurantName={restaurantName}
        activePlan={activePlan}
        user={user}
        profile={profile}
        currentPage={currentPage}
        handleSelectPage={handleSelectPage}
        setCurrentPage={setCurrentPage}
        planLoading={planLoading}
        can={can}
        missingAlerts={missingAlerts}
        activeBrand={activeBrand}
        isTrialActive={isTrialActive}
        trialAlreadyUsed={trialAlreadyUsed}
        startTrial={startTrial}
        setShowPlanSelector={setShowPlanSelector}
        newOrdersCount={newOrdersCount}
        preparingOrdersCount={preparingOrdersCount}
        onSignOut={handleSignOut}
      />

      <Toast />

      {authUser && user?.auth_session && ['admin', 'owner', 'superadmin', 'encargado'].includes(profile?.role) ? (
        <AlunaCopilot
          brand={activeBrand || (activeBrandId ? { id: activeBrandId, name: restaurantName } : null)}
          location={activeLocation}
          locationId={isAllLocations ? null : activeLocationId}
          onNavigate={(pageId) => handleSelectPage(pageId)}
          recipesEnabled={can('inventory')}
        />
      ) : null}

      {activeBrand?.is_active === false && <AccountSuspendedOverlay brandName={restaurantName} />}
    </div>
  );
}
