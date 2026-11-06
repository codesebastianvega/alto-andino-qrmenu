import React from 'react';

export const Icons = {
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
  Bar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22h8M12 11v11M19 3l-7 8-7-8h14z" />
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
  Delivery: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6h4l3 6v5.5M5 17.5h10M9 6v11.5M12 6H5a2 2 0 0 0-2 2v9.5"/>
    </svg>
  ),
  Tables: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="4" rx="1"/>
      <path d="M6 7v14M18 7v14M12 7v14M4 14h16"/>
    </svg>
  ),
  Print: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
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
  Strategy: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  ),
  Profile: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Business: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>
    </svg>
  ),
  Finance: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <path d="M6 15h2M10 15h4" />
    </svg>
  ),
  Cash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  Promotions: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 12 12 21.5 2.5 12l9.5-9.5h9.5v9.5z"/>
      <circle cx="16.5" cy="7.5" r="1.5" fill="currentColor"/>
    </svg>
  ),
  LiveMenu: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16"/>
      <circle cx="8" cy="6" r="2" fill="currentColor"/>
      <circle cx="16" cy="12" r="2" fill="currentColor"/>
      <circle cx="10" cy="18" r="2" fill="currentColor"/>
    </svg>
  ),
};

export const ADMIN_ROLES = ['admin', 'owner', 'superadmin', 'encargado'];

export const ESTRATEGIA_ITEMS = [
  { id: 'analytics', label: 'Inteligencia', Icon: Icons.Strategy, roles: ADMIN_ROLES, feature: 'advanced_analytics' },
  { id: 'finance', label: 'Finanzas & Contabilidad', Icon: Icons.Finance, roles: ADMIN_ROLES },
  { id: 'live_menu', label: 'Carta & Opciones', Icon: Icons.LiveMenu, roles: ADMIN_ROLES },
  { id: 'promotions', label: 'Campañas & Descuentos', Icon: Icons.Promotions, roles: ADMIN_ROLES }
];

export const OPERACION_ITEMS = [
  { id: 'orders',     label: 'Pedidos',         Icon: Icons.Orders, roles: [...ADMIN_ROLES, 'waiter', 'cashier'] },
  { id: 'kitchen',    label: 'Cocina (KDS)',    Icon: Icons.Kitchen, roles: [...ADMIN_ROLES, 'kitchen'], feature: 'kitchen_display' },
  { id: 'bar',        label: 'Barra (BDS)',     Icon: Icons.Bar, roles: [...ADMIN_ROLES, 'kitchen', 'waiter', 'bar'], feature: 'bar_display' },
  { id: 'waiter',     label: 'Toma de Pedidos', Icon: Icons.Waiter, roles: [...ADMIN_ROLES, 'waiter', 'cashier'] },
  { id: 'operations', label: 'Turno & Caja',    Icon: Icons.Cash, roles: [...ADMIN_ROLES, 'cashier'] },
];

export const CARTA_ITEMS = [
  { id: 'products',        label: 'Carta Principal',   Icon: Icons.Products, roles: ADMIN_ROLES },
  { id: 'categories',      label: 'Categorías',         Icon: Icons.Categories, roles: ADMIN_ROLES },
  { id: 'modifier_groups', label: 'Extras y Opciones', Icon: Icons.Modifiers, roles: ADMIN_ROLES },
  { id: 'menu_print',      label: 'Imprimir Carta',    Icon: Icons.Print, roles: ADMIN_ROLES },
  { id: 'tables',          label: 'Mesas y QRs',       Icon: Icons.Tables, roles: ADMIN_ROLES, feature: 'table_management' },
  { id: 'delivery_drivers', label: 'Domiciliarios',    Icon: Icons.Delivery, roles: ADMIN_ROLES },
];

export const PROD_ITEMS = [
  { id: 'recipes',   label: 'Recetas',      Icon: Icons.Recipes, roles: [...ADMIN_ROLES, 'kitchen'], feature: 'inventory' },
  { id: 'inventory', label: 'Inventario',   Icon: Icons.Modifiers, roles: [...ADMIN_ROLES, 'kitchen'], feature: 'inventory' },
];

export const ADMIN_ITEMS = [
  { id: 'settings',   label: 'Ajustes de Operación', Icon: Icons.Settings, roles: ADMIN_ROLES },
  { id: 'business_profile', label: 'Perfil Comercial', Icon: Icons.Business, roles: ADMIN_ROLES },
];

export const WEB_ITEMS = [
  { id: 'web', label: 'Páginas y Web', Icon: Icons.Web, roles: ADMIN_ROLES, feature: 'landing_page' },
];

export const ALL_NAV_ITEMS = [
  ...WEB_ITEMS,
  ...CARTA_ITEMS,
  ...PROD_ITEMS,
  ...ADMIN_ITEMS,
  ...OPERACION_ITEMS,
  ...ESTRATEGIA_ITEMS
];

export function NavSection({ title, items, current, onSelect, collapsed, userRole, planLoading, can, missingAlerts = {} }) {
  const allowed = items.filter(item => !item.roles || item.roles.includes(userRole));
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
          const isLocked = !planLoading && item.feature && !can(item.feature);
          const hasAlert = missingAlerts[item.id] && !isActive;

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
              <div className="relative">
                <span className={`shrink-0 ${isActive ? 'text-brand-secondary' : ''}`}>
                  <Icon />
                </span>
                {collapsed && hasAlert && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border border-[#0F170F]"></span>
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between min-w-0">
                  <span className="flex items-center gap-2 truncate whitespace-nowrap">
                    {item.label}
                    {hasAlert && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </span>
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
}
