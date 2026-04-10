import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import AdminProducts from '../../pages/AdminProducts';
import AdminCategories from '../../pages/AdminCategories';
import AdminModifiers from '../../pages/AdminModifiers';
import AdminExperiences from '../../pages/AdminExperiences';
import AdminRecipes from '../../pages/AdminRecipes';
import AdminBranding from '../../pages/AdminBranding';
import AdminSettings from '../../pages/AdminSettings';
import AdminAllergens from '../../pages/AdminAllergens';
import AdminModifierGroups from '../../pages/AdminModifierGroups';
import AdminTables from '../../pages/AdminTables';
import AdminOrders from '../../pages/AdminOrders';
import AdminKitchen from '../../pages/AdminKitchen';
import AdminDashboard from '../../pages/AdminDashboard';
import AdminWaiter from '../../pages/AdminWaiter';
import AdminStaff from '../../pages/AdminStaff';
import AdminSedes from '../../pages/AdminSedes';
import AdminPinLogin from './AdminPinLogin';
import AdminWebContent from '../../pages/AdminWebContent';
import BrandSwitcher from './BrandSwitcher';
import LockOverlay from './LockOverlay';
import { useMenuData } from '../../context/MenuDataContext';

// ─── SVG Icon set (no emojis in nav) ─────────────────────────────────────────
const Icons = {
  Products: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Categories: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18"/>
    </svg>
  ),
  Modifiers: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Recipes: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  Experiences: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Branding: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  Orders: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
    </svg>
  ),
  Kitchen: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.5 4 6.5 2 2 3 5.5 3 5.5s.5 2 0 3.5c-.5 1.5-2 3-4.5 3.5s-4.5-.5-5.5-1.5c-1-1-1.5-2.5-1.5-3.5 0-1 0-2 .5-3Z"/>
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Staff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Allergens: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  ),
  Tables: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="4" rx="1"/>
      <path d="M6 7v14M18 7v14M12 7v14M4 14h16"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Home: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Web: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  Waiter: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.8V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.2"/><path d="M2 13h4"/><path d="M2 18h4"/><path d="M2 8h4"/><path d="M18 13h4"/><path d="M18 18h4"/><path d="M18 8h4"/>
    </svg>
  ),
};

const CARTA_ITEMS = [
  { id: 'products',   label: 'Productos',   Icon: Icons.Products, roles: ['admin'] },
  { id: 'categories', label: 'Categorías',  Icon: Icons.Categories, roles: ['admin'] },
  { id: 'modifier_groups', label: 'Extras y Opciones', Icon: Icons.Modifiers, roles: ['admin'] },
  { id: 'tables',     label: 'Mesas y QRs', Icon: Icons.Tables, roles: ['admin'] },
  { id: 'allergens',  label: 'Dietas y Alérgenos', Icon: Icons.Allergens, roles: ['admin'] },
];

const WEB_ITEMS = [
  { id: 'web', label: 'Gestión Web', Icon: Icons.Web, roles: ['admin'], feature: 'landing_page' },
];

const PROD_ITEMS = [
  { id: 'recipes',   label: 'Recetas',      Icon: Icons.Recipes, roles: ['admin', 'kitchen'], feature: 'inventory' },
  { id: 'inventory', label: 'Inventario',      Icon: Icons.Modifiers, roles: ['admin', 'kitchen'] },
];

const ADJUST_ITEMS = [
  { id: 'branding',    label: 'Identidad Visual', Icon: Icons.Branding, roles: ['admin'] },
  { id: 'settings',    label: 'Ajustes Generales', Icon: Icons.Settings, roles: ['admin'] },
];
export default function AdminLayout() {
  // Read page from URL or default to orders
  const getInitialPage = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('admin_page') || 'orders';
  };

  const { user: authUser, profile, loading: authLoading, isFeatureLocked, activeBrand, activePlan } = useAuth();
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(getInitialPage); 
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('');
  
  const { restaurantSettings } = useMenuData();

  const handleSelectPage = (pageId, label, featureKey) => {
    if (featureKey && isFeatureLocked(featureKey)) {
      setLockedFeatureName(label);
      setShowUpgradeModal(true);
      return;
    }
    setShowUpgradeModal(false);
    setCurrentPage(pageId);
  };

  const logoUrl = activeBrand?.logo_url || restaurantSettings?.logo_url || "/logoalto.png";
  const restaurantName = activeBrand?.name || restaurantSettings?.business_name || "Mi Negocio";

  // If there's an authenticated Supabase session with owner/superadmin role,
  // auto-login them without requiring PIN
  useEffect(() => {
    if (authLoading) return;
    if (authUser && profile && (profile.role === 'owner' || profile.role === 'superadmin' || profile.role === 'admin')) {
      // Already authenticated — set as admin user, skip PIN screen
      setUser({
        id: authUser.id,
        name: profile.full_name || authUser.email || 'Admin',
        role: 'admin',
        auth_session: true, // flag to signal this is a Supabase auth session, not PIN
      });
    } else if (!authUser) {
      // Check sessionStorage for PIN-based login (staff without Supabase account)
      const savedSession = sessionStorage.getItem('aa_admin_session');
      if (savedSession) {
        try {
          const savedUser = JSON.parse(savedSession);
          setUser(savedUser);
        } catch (e) {
          sessionStorage.removeItem('aa_admin_session');
        }
      }
    }
  }, [authUser, profile, authLoading]);

  // Sync page state with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin_page') !== currentPage) {
      params.set('admin_page', currentPage);
      const targetPath = activeBrand?.slug ? `/${activeBrand.slug}/` : window.location.pathname;
      window.history.replaceState(null, '', `${targetPath}?${params.toString()}${window.location.hash}`);
    }
  }, [currentPage, activeBrand]);

  // Auto-redirect if user's role doesn't have access to "orders"
  useEffect(() => {
    if (user && user.role === 'kitchen' && currentPage !== 'kitchen') {
      setCurrentPage('kitchen');
    }
  }, [user, currentPage]);

  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'preparing']);
      
      setPendingOrdersCount(count || 0);
    };

    fetchPendingCount();

    const channel = supabase.channel('layout_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Render helper for navigation sections
  const NavSection = ({ title, items, current, onSelect, collapsed }) => {
    const allowed = items.filter(item => !item.roles || item.roles.includes(user.role));
    if (allowed.length === 0) return null;

    return (
      <div className="py-2">
        {!collapsed ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-4 mb-2 block">
            {title}
          </span>
        ) : (
          <div className="h-px bg-white/5 mx-2 my-4" />
        )}
        <div className="space-y-0.5 px-2">
          {allowed.map((item) => {
            const Icon = Icons[item.id.charAt(0).toUpperCase() + item.id.slice(1)] || item.Icon;
            const isActive = current === item.id;
            const isLocked = item.feature && isFeatureLocked(item.feature);
            
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id, item.label, item.feature)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                  collapsed ? 'justify-center px-0' : ''
                } ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm shadow-black/20'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                } ${isLocked ? 'opacity-60 grayscale-[0.5]' : ''}`}
              >
                <span className={`shrink-0 ${isActive ? 'text-brand-secondary' : ''}`}>
                  <Icon />
                </span>
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    {item.label}
                    {isLocked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500/80">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    )}
                  </span>
                )}
                {collapsed && isLocked && (
                    <div className="absolute top-1 right-1">
                       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-500">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const currentItemLabel = [...WEB_ITEMS, ...CARTA_ITEMS, ...PROD_ITEMS, ...ADJUST_ITEMS, 
    {id: 'dashboard', label: 'Dashboard'}, 
    {id: 'orders', label: 'Pedidos'}, 
    {id: 'kitchen', label: 'Cocina'}
  ].find(i => i.id === currentPage)?.label || 'Panel';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F170F]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7db87a]"></div>
      </div>
    );
  }

  if (!user) {
    // Only show PIN login for staff (no active Supabase session)
    // Owners/admins with Supabase auth are auto-logged in via the useEffect above
    return <AdminPinLogin onLogin={setUser} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F4F4F2]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-[#0F170F] border-r border-white/5 flex flex-col z-50 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-[240px]'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`flex items-center h-20 px-5 gap-3 shrink-0 ${isCollapsed ? 'justify-center px-0' : ''}`}>
             {!isCollapsed ? (
               <BrandSwitcher />
             ) : (
               <div className="w-10 h-10 flex items-center justify-center shrink-0 drop-shadow-md">
                 <img src={logoUrl} alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
               </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
            {/* ── SEGMENTO ESPECIAL: OPERACIONES (TARJETAS) ── */}
            <div className={`px-4 mb-6 space-y-3 ${isCollapsed ? 'px-2' : ''}`}>
               {!isCollapsed && <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-1 mb-2 block">Operaciones</span>}
               
               {/* Dashboard Card */}
               {true && (
                 <button 
                   onClick={() => handleSelectPage('dashboard', 'Dashboard', 'basic_analytics')}
                   className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-14'} rounded-xl border border-white/5 flex items-center ${
                     currentPage === 'dashboard' 
                      ? 'bg-gradient-to-r from-brand-primary/80 to-brand-primary border-white/10 ring-1 ring-white/10 shadow-lg shadow-black/40' 
                      : 'bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10'
                   } ${isFeatureLocked('basic_analytics') ? 'opacity-60 grayscale-[0.3]' : ''}`}
                 >
                   <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === 'dashboard' ? 'bg-brand-secondary/20 text-brand-secondary' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                         <Icons.Dashboard />
                      </div>
                      {!isCollapsed && (
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-[13px] font-bold leading-none ${currentPage === 'dashboard' ? 'text-white' : 'text-white/60'}`}>Dashboard</p>
                            {isFeatureLocked('basic_analytics') && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-500">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            )}
                          </div>
                          <p className="text-[9px] text-white/30 font-medium mt-1">Métricas y Resumen</p>
                        </div>
                      )}
                   </div>
                 </button>
               )}

               {/* Pedidos Card */}
               {true && (
                 <button 
                   onClick={() => handleSelectPage('orders', 'Pedidos', 'table_management')}
                   className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-14'} rounded-xl border border-white/5 flex items-center ${
                     currentPage === 'orders' 
                      ? 'bg-gradient-to-r from-blue-900/40 to-blue-950/40 border-blue-500/20 ring-1 ring-blue-500/20 shadow-lg shadow-blue-950/40' 
                      : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                   } ${isFeatureLocked('table_management') ? 'opacity-60 grayscale-[0.3]' : ''}`}
                 >
                   <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === 'orders' ? 'bg-blue-400/20 text-blue-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                         <Icons.Orders />
                      </div>
                      {!isCollapsed && (
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-[13px] font-bold leading-none ${currentPage === 'orders' ? 'text-white' : 'text-white/60'}`}>Pedidos</p>
                            {isFeatureLocked('table_management') && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-500">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            )}
                          </div>
                          <p className="text-[9px] text-white/30 font-medium mt-1">Gestión Activa</p>
                        </div>
                      )}
                   </div>
                 </button>
               )}

               {/* Cocina Card */}
               <button 
                 onClick={() => handleSelectPage('kitchen', 'Cocina', 'kitchen_display')}
                 className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-14'} rounded-xl border border-white/5 flex items-center ${
                   currentPage === 'kitchen' 
                    ? 'bg-gradient-to-r from-orange-900/40 to-orange-950/40 border-orange-500/20 ring-1 ring-orange-500/20 shadow-lg shadow-orange-950/40' 
                    : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                 } ${isFeatureLocked('kitchen_display') ? 'opacity-60' : ''}`}
               >
                 <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === 'kitchen' ? 'bg-orange-400/20 text-orange-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                       <div className="relative">
                          <Icons.Kitchen />
                          {!isFeatureLocked('kitchen_display') && pendingOrdersCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />}
                       </div>
                    </div>
                    {!isCollapsed && (
                      <div className="text-left flex-1 flex justify-between items-center pr-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className={`text-[13px] font-bold leading-none ${currentPage === 'kitchen' ? 'text-white' : 'text-white/60'}`}>Cocina</p>
                            {isFeatureLocked('kitchen_display') && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-500">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            )}
                          </div>
                          <p className="text-[9px] text-white/30 font-medium mt-1">Monitor de Producción</p>
                        </div>
                        {pendingOrdersCount > 0 && !isFeatureLocked('kitchen_display') && (
                          <span className="bg-orange-500 text-white text-[10px] font-black h-5 px-1.5 flex items-center justify-center rounded-md">
                            {pendingOrdersCount}
                          </span>
                        )}
                      </div>
                    )}
                 </div>
               </button>

               {/* Toma de Pedidos (POS) Card */}
               <button 
                 onClick={() => handleSelectPage('waiter', 'Toma de Pedidos')}
                 className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-14'} rounded-xl border border-white/5 flex items-center ${
                   currentPage === 'waiter' 
                    ? 'bg-gradient-to-r from-emerald-900/40 to-emerald-950/40 border-emerald-500/20 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-950/40' 
                    : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                 }`}
               >
                 <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === 'waiter' ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                       <Icons.Waiter />
                    </div>
                    {!isCollapsed && (
                      <div className="text-left flex-1">
                        <p className={`text-[13px] font-bold leading-none ${currentPage === 'waiter' ? 'text-white' : 'text-white/60'}`}>Toma de Pedidos</p>
                        <p className="text-[9px] text-white/30 font-medium mt-1">POS / Modo Mesero</p>
                      </div>
                    )}
                 </div>
               </button>
            </div>

            {/* SECCIONES ESTANDAR */}
            <div className="h-px bg-white/5 mx-6 my-2" />
            
            <NavSection title="Web y Páginas" items={WEB_ITEMS} current={currentPage} onSelect={handleSelectPage} collapsed={isCollapsed} />
            <NavSection title="Administración de Carta" items={CARTA_ITEMS} current={currentPage} onSelect={handleSelectPage} collapsed={isCollapsed} />
            <NavSection title="Producción e Inventario" items={PROD_ITEMS} current={currentPage} onSelect={handleSelectPage} collapsed={isCollapsed} />
            <NavSection title="Configuración" items={ADJUST_ITEMS} current={currentPage} onSelect={handleSelectPage} collapsed={isCollapsed} />
          </div>

          {/* User Section / Collapse toggle */}
          <div className="mt-auto border-t border-white/5 bg-black/10">
             <a
               href="/"
               className={`flex items-center gap-2.5 px-5 py-3 text-[13px] font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all ${isCollapsed ? 'justify-center px-0' : ''}`}
             >
                <Icons.Home />
                {!isCollapsed && <span>Ver Menú Público</span>}
             </a>
             <button
               onClick={() => setIsCollapsed(!isCollapsed)}
               className="w-full h-12 flex items-center px-5 gap-3 text-white/30 hover:text-white/60 transition-colors border-t border-white/5"
             >
               <span className="shrink-0">
                 {isCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
               </span>
               {!isCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest">Colapsar Sidebar</span>}
             </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-[240px]'
        }`}
      >
        <header className="h-16 bg-white border-b border-gray-200/60 sticky top-0 z-40 flex items-center justify-between px-8 shadow-sm shadow-black/[0.02]">
          <div className="flex items-center gap-5">
             <h2 className="text-lg font-bold text-gray-900 tracking-tight pr-4">{currentItemLabel}</h2>
             {activePlan && (
               <div className="flex items-center gap-2 px-2.5 py-1 bg-brand-primary/5 border border-brand-primary/10 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Plan {activePlan.name}</span>
               </div>
             )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[13px] font-semibold text-gray-800 leading-tight">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{user.role}</div>
            </div>
            <button 
              onClick={async () => {
                sessionStorage.removeItem('aa_admin_session');
                if (user.auth_session) {
                  await supabase.auth.signOut();
                  window.location.hash = '';
                  window.location.reload();
                } else {
                  setUser(null);
                }
              }}
              className="w-8 h-8 rounded-full bg-[#1C2B1E] flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 relative">
          {currentPage === 'web'         && <AdminWebContent />}
          {currentPage === 'products'    && <AdminProducts />}
          {currentPage === 'categories'  && <AdminCategories />}
          {currentPage === 'allergens'   && <AdminAllergens />}
          { currentPage === 'recipes'     && <AdminRecipes /> }
          { currentPage === 'modifier_groups' && <AdminModifierGroups /> }
          { currentPage === 'inventory'   && <AdminModifiers /> }
          { currentPage === 'tables'      && <AdminTables /> }
          { currentPage === 'orders'      && <AdminOrders /> }
          { currentPage === 'kitchen'     && <AdminKitchen /> }
          { currentPage === 'branding'    && <AdminBranding /> }
          { currentPage === 'settings'    && <AdminSettings /> }
          { currentPage === 'staff'       && <AdminStaff /> }
          { currentPage === 'sedes'       && <AdminSedes /> }
          { currentPage === 'dashboard'   && <AdminDashboard /> }
          { currentPage === 'waiter'      && <AdminWaiter /> }

          {/* Feature Lock Overlay */}
          <LockOverlay 
            isVisible={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            featureName={lockedFeatureName}
            planNeeded={
              lockedFeatureName === 'Identidad Visual' ? 'Emprendedor' : 
              (lockedFeatureName === 'Gestión Web' || lockedFeatureName === 'Dashboard' || lockedFeatureName === 'Personal / Staff') ? 'Esencial' : 
              'Profesional'
            }
          />
        </div>
      </main>
    </div>
  );
}
