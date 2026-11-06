import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, Globe } from 'lucide-react';
import ContextBreadcrumb from '../ContextBreadcrumb';
import {
  Icons,
  ADMIN_ROLES,
  ESTRATEGIA_ITEMS,
  OPERACION_ITEMS,
  CARTA_ITEMS,
  PROD_ITEMS,
  ADMIN_ITEMS,
  WEB_ITEMS,
  NavSection
} from './AdminNavConfig';

export default function AdminMobileNavigation({
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  logoUrl,
  restaurantName,
  activePlan,
  user,
  profile,
  currentPage,
  handleSelectPage,
  setCurrentPage,
  planLoading,
  can,
  missingAlerts,
  activeBrand,
  isTrialActive,
  trialAlreadyUsed,
  startTrial,
  setShowPlanSelector,
  newOrdersCount,
  preparingOrdersCount,
  onSignOut
}) {
  return (
    <>
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[320px] bg-[#0F170F] z-[70] flex flex-col lg:hidden overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 drop-shadow-md">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-[14px] truncate">{restaurantName}</span>
                    {activePlan && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                        <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">Plan {activePlan.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 -mr-2 text-white/50 hover:text-white rounded-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 px-4 pb-20 space-y-5">
                <div className="mb-8">
                  <ContextBreadcrumb onNavigate={handleSelectPage} />
                </div>

                {ADMIN_ROLES.includes(user.role) && (
                  <NavSection
                    title="Estrategia"
                    items={ESTRATEGIA_ITEMS}
                    current={currentPage}
                    onSelect={(id, lbl, feat) => { handleSelectPage(id, lbl, feat); setIsMobileDrawerOpen(false); }}
                    collapsed={false}
                    userRole={user.role}
                    planLoading={planLoading}
                    can={can}
                    missingAlerts={missingAlerts}
                  />
                )}

                <NavSection
                  title="Operación"
                  items={OPERACION_ITEMS}
                  current={currentPage}
                  onSelect={(id, lbl, feat) => { handleSelectPage(id, lbl, feat); setIsMobileDrawerOpen(false); }}
                  collapsed={false}
                  userRole={user.role}
                  planLoading={planLoading}
                  can={can}
                  missingAlerts={missingAlerts}
                />

                {ADMIN_ROLES.includes(user.role) && (
                  <NavSection
                    title="Administración de Carta"
                    items={CARTA_ITEMS}
                    current={currentPage}
                    onSelect={(id, lbl, feat) => { handleSelectPage(id, lbl, feat); setIsMobileDrawerOpen(false); }}
                    collapsed={false}
                    userRole={user.role}
                    planLoading={planLoading}
                    can={can}
                    missingAlerts={missingAlerts}
                  />
                )}
                {(ADMIN_ROLES.includes(user.role) || user.role === 'kitchen') && (
                  <NavSection
                    title="Producción e Inventario"
                    items={PROD_ITEMS}
                    current={currentPage}
                    onSelect={(id, lbl, feat) => { handleSelectPage(id, lbl, feat); setIsMobileDrawerOpen(false); }}
                    collapsed={false}
                    userRole={user.role}
                    planLoading={planLoading}
                    can={can}
                    missingAlerts={missingAlerts}
                  />
                )}
                {ADMIN_ROLES.includes(user.role) && (
                  <>
                    <NavSection
                      title="Administración de Staff & Locales"
                      items={ADMIN_ITEMS}
                      current={currentPage}
                      onSelect={(id, lbl, feat) => { handleSelectPage(id, lbl, feat); setIsMobileDrawerOpen(false); }}
                      collapsed={false}
                      userRole={user.role}
                      planLoading={planLoading}
                      can={can}
                      missingAlerts={missingAlerts}
                    />
                    <NavSection
                      title="Presencia Web"
                      items={WEB_ITEMS}
                      current={currentPage}
                      onSelect={(id, lbl, feat) => { handleSelectPage(id, lbl, feat); setIsMobileDrawerOpen(false); }}
                      collapsed={false}
                      userRole={user.role}
                      planLoading={planLoading}
                      can={can}
                      missingAlerts={missingAlerts}
                    />
                  </>
                )}

                <div className="pt-2 pb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-2 mb-3 block">
                    Cuenta & Extras
                  </span>
                  <div className="space-y-1.5 px-1">
                    {user?.role === 'superadmin' && (
                      <a
                        href="/superadmin"
                        className="group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 overflow-hidden"
                      >
                        <Shield className="shrink-0 w-[16px] h-[16px] text-white/40 group-hover:text-white transition-colors" />
                        <span>Panel Superadmin</span>
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setShowPlanSelector(true);
                        setIsMobileDrawerOpen(false);
                      }}
                      className="group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 text-white/60 hover:text-amber-100 bg-white/5 hover:bg-white/10 border border-white/5 overflow-hidden"
                    >
                      <Star className="shrink-0 w-[16px] h-[16px] text-amber-500/50 group-hover:text-amber-400 transition-colors" />
                      <span>Mi Plan / Upgrade</span>
                    </button>
                    <a
                      href={activeBrand?.slug ? `/${activeBrand.slug}/` : '/'}
                      className="group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 overflow-hidden"
                    >
                      <Globe className="shrink-0 w-[16px] h-[16px] text-white/40 group-hover:text-white transition-colors" />
                      <span>Ver Menú Público</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-auto border-t border-gray-100/20 p-4 bg-black/10 shrink-0 space-y-3">
                {!planLoading && activeBrand && (() => {
                  const daysLeft = activeBrand.trial_end_date ? Math.max(0, Math.ceil((new Date(activeBrand.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
                  const isPaid = activeBrand?.payment_verified === true || activeBrand?.payment_verified === 'true';

                  if (isPaid) {
                    return (
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Cuenta Activa</span>
                      </div>
                    );
                  }
                  if (daysLeft > 0) {
                    return (
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Prueba Activa: {daysLeft} días</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Pago Pendiente</span>
                    </div>
                  );
                })()}

                {!planLoading && !isTrialActive && !activePlan && trialAlreadyUsed && (
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      setShowPlanSelector(true);
                    }}
                    className="w-full group text-left"
                  >
                    <div className="rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/10 border border-emerald-500/30 px-3 py-2 flex items-center gap-2 hover:from-emerald-500/30 transition-all">
                      <span className="text-base">⭐</span>
                      <div>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.18em]">Suscripción</p>
                        <p className="text-[11px] font-semibold text-white/80">Elegir o Activar Plan</p>
                      </div>
                    </div>
                  </button>
                )}

                {!planLoading && !isTrialActive && !activePlan && !trialAlreadyUsed && (
                  <button
                    onClick={async () => {
                      const { error } = await startTrial();
                      if (error) alert('Error al iniciar prueba: ' + error.message);
                    }}
                    className="w-full group text-left"
                  >
                    <div className="rounded-xl bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 border border-brand-primary/20 px-3 py-2 flex items-center gap-2 hover:from-brand-primary/30 transition-all">
                      <span className="text-base">🚀</span>
                      <div>
                        <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.18em]">Acceso Total Gratis</p>
                        <p className="text-[11px] font-semibold text-white/70">Iniciar prueba 21 días</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-[#0A0A0A] shrink-0">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => {
                      setCurrentPage('profile');
                      setIsMobileDrawerOpen(false);
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[13px] font-bold text-brand-primary">
                          {(profile?.full_name || user.email)?.[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-medium text-white truncate max-w-[150px]">
                        {profile?.full_name || user.email}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-brand-primary font-medium">Ver perfil</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors cursor-pointer text-white/70 shrink-0"
                    title="Cerrar sesión"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div data-aa-admin-bottombar className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[45] lg:hidden pb-[calc(env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-around h-[72px] px-2">
          {(ADMIN_ROLES.includes(user.role) || user.role === 'cashier') && (
            <button
              onClick={() => handleSelectPage('operations', 'Turno & Caja')}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer ${currentPage === 'operations' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="pointer-events-none flex items-center justify-center">
                <Icons.Cash />
              </div>
              <span className="text-[10px] font-medium pointer-events-none">Caja</span>
            </button>
          )}

          {user.role !== 'kitchen' && (
            <button
              onClick={() => handleSelectPage('waiter', 'Toma de Pedidos')}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer ${currentPage === 'waiter' ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="pointer-events-none flex items-center justify-center">
                <Icons.Waiter />
              </div>
              <span className="text-[10px] font-medium pointer-events-none">POS</span>
            </button>
          )}

          {user.role !== 'kitchen' && (
            <button
              onClick={() => handleSelectPage('orders', 'Pedidos')}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer ${currentPage === 'orders' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="relative pointer-events-none">
                <Icons.Orders />
              </div>
              <span className="text-[10px] font-medium pointer-events-none">Pedidos</span>
            </button>
          )}

          {user.role === 'bar' ? (
            <button
              onClick={() => handleSelectPage('bar', 'Barra (BDS)', 'bar_display')}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer ${currentPage === 'bar' ? 'text-cyan-400' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="relative pointer-events-none">
                <Icons.Bar />
              </div>
              <span className="text-[10px] font-medium pointer-events-none">Barra</span>
            </button>
          ) : user.role !== 'waiter' && (
            can('kitchen_display') ? (
              <button
                onClick={() => handleSelectPage('kitchen', 'Cocina', 'kitchen_display')}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer ${currentPage === 'kitchen' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className="relative pointer-events-none">
                  <Icons.Kitchen />
                  {!planLoading && (newOrdersCount + preparingOrdersCount) > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white pointer-events-none" />}
                </div>
                <span className="text-[10px] font-medium pointer-events-none">Cocina</span>
              </button>
            ) : (
              <button
                onClick={() => handleSelectPage('live_menu', 'Carta & Opciones')}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer ${currentPage === 'live_menu' || currentPage === 'products' ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className="relative pointer-events-none">
                  <Icons.LiveMenu />
                </div>
                <span className="text-[10px] font-medium pointer-events-none">Carta</span>
              </button>
            )
          )}

          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <div className="pointer-events-none flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </div>
            <span className="text-[10px] font-medium pointer-events-none">Menú</span>
          </button>
        </div>
      </div>
    </>
  );
}
