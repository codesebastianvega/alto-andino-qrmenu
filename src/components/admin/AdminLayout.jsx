import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import AdminProducts from '../../pages/AdminProducts';
import AdminCategories from '../../pages/AdminCategories';
import AdminModifiers from '../../pages/AdminModifiers';
import AdminExperiences from '../../pages/AdminExperiences';
import AdminRecipes from '../../pages/AdminRecipes';
import AdminBranding from '../../pages/AdminBranding';
import AdminSettings from '../../pages/AdminSettings';
import AdminAllergens from '../../pages/AdminAllergens';
import AdminTables from '../../pages/AdminTables';
import AdminOrders from '../../pages/AdminOrders';
import AdminKitchen from '../../pages/AdminKitchen';

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
};

const MENU_ITEMS = [
  { id: 'sep-op', type: 'separator', label: 'Operación' },
  { id: 'orders',      label: 'Pedidos',      Icon: Icons.Orders },
  { id: 'kitchen',     label: 'Vista Cocina', Icon: Icons.Kitchen },
  { id: 'sep-menu', type: 'separator', label: 'Carta' },
  { id: 'products',   label: 'Productos',   Icon: Icons.Products },
  { id: 'categories', label: 'Categorías',  Icon: Icons.Categories },
  { id: 'allergens',  label: 'Dietas y Alérgenos', Icon: Icons.Allergens },
  { id: 'sep-prod', type: 'separator', label: 'Producción' },
  { id: 'recipes',   label: 'Recetas',      Icon: Icons.Recipes },
  { id: 'modifiers', label: 'Inventario',      Icon: Icons.Modifiers },
  { id: 'sep-biz', type: 'separator', label: 'Negocio' },
  { id: 'tables',    label: 'Mesas (QR)',   Icon: Icons.Tables },
  { id: 'experiences', label: 'Experiencias', Icon: Icons.Experiences, disabled: true },
  { id: 'branding',    label: 'Branding y Diseño', Icon: Icons.Branding },
  { id: 'dashboard',   label: 'Dashboard',    Icon: Icons.Dashboard,    disabled: true },
  { id: 'settings',    label: 'Ajustes Generales', Icon: Icons.Settings },
];

export default function AdminLayout() {
  const [currentPage, setCurrentPage] = useState('orders'); // Cambiado a orders por defecto
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

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

  const currentItem = MENU_ITEMS.find(i => i.id === currentPage);

  return (
    <div className="flex min-h-screen bg-[#F4F4F2]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-[#1C2B1E] flex flex-col z-50 transition-all duration-250 ${
          isCollapsed ? 'w-[60px]' : 'w-[220px]'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center h-16 border-b border-white/5 px-4 gap-3 shrink-0 ${isCollapsed ? 'justify-center px-0' : ''}`}>
            <div className="w-7 h-7 bg-[#4a6741] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white leading-none">A</span>
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-[13px] font-semibold text-white leading-none tracking-tight">Alto Andino</p>
                <p className="text-[10px] text-white/30 font-medium mt-0.5">Admin</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
            {MENU_ITEMS.map((item) => {
              if (item.type === 'separator') {
                return (
                  <div key={item.id} className="pt-5 pb-1.5">
                    {!isCollapsed ? (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/20 px-2">
                        {item.label}
                      </span>
                    ) : (
                      <div className="h-px bg-white/8 mx-2" />
                    )}
                  </div>
                );
              }

              const { Icon } = item;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => !item.disabled && setCurrentPage(item.id)}
                  title={isCollapsed ? item.label : ''}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : item.disabled
                        ? 'text-white/20 cursor-not-allowed'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-[#7db87a]' : ''}`}>
                    <Icon />
                  </span>
                  {!isCollapsed && (
                    <span className="flex-1 text-left truncate flex items-center justify-between pr-1">
                      <span>{item.label}</span>
                      {item.id === 'kitchen' && pendingOrdersCount > 0 && (
                        <span className="bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md animate-pulse">
                          {pendingOrdersCount}
                        </span>
                      )}
                      {item.disabled && (
                        <span className="ml-2 text-[9px] font-semibold text-white/20 align-middle">soon</span>
                      )}
                    </span>
                  )}
                  {!isCollapsed && isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#7db87a] shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/5 px-2 py-3 space-y-0.5 shrink-0">
            <a
              href="/"
              title={isCollapsed ? 'Ver Menú' : ''}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Icons.Home />
              {!isCollapsed && <span>Ver Menú</span>}
            </a>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              {isCollapsed ? <Icons.ChevronRight /> : <><Icons.ChevronLeft /><span>Colapsar</span></>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main
        className={`flex-1 min-h-screen flex flex-col transition-all duration-250 ${
          isCollapsed ? 'ml-[60px]' : 'ml-[220px]'
        }`}
      >
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-[12px] font-medium">Admin</span>
            <span className="text-gray-300">/</span>
            <span className="text-[13px] font-semibold text-gray-700">
              {currentItem?.label || 'Panel'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2f4131] flex items-center justify-center">
              <span className="text-white text-[11px] font-semibold">AA</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1">
          {currentPage === 'products'    && <AdminProducts />}
          {currentPage === 'categories'  && <AdminCategories />}
          {currentPage === 'allergens'   && <AdminAllergens />}
          { currentPage === 'experiences' && <AdminExperiences /> }
          { currentPage === 'recipes'     && <AdminRecipes /> }
          { currentPage === 'modifiers'   && <AdminModifiers /> }
          { currentPage === 'tables'      && <AdminTables /> }
          { currentPage === 'orders'      && <AdminOrders /> }
          { currentPage === 'kitchen'     && <AdminKitchen /> }
          { currentPage === 'branding'    && <AdminBranding /> }
          { currentPage === 'settings'    && <AdminSettings /> }
          {currentPage === 'dashboard'   && (
            <div className="flex items-center justify-center h-96 text-gray-300">
              <div className="text-center">
                <Icons.Dashboard />
                <p className="mt-4 text-sm font-medium">Dashboard · Próximamente</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
