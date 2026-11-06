import React from 'react';
import { motion } from 'framer-motion';
import { Beaker, Shield, Star, Globe } from 'lucide-react';
import {
  Icons,
  ADMIN_ROLES,
  CARTA_ITEMS,
  PROD_ITEMS,
  ADMIN_ITEMS,
  WEB_ITEMS,
  NavSection
} from './AdminNavConfig';

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  logoUrl,
  user,
  currentPage,
  handleSelectPage,
  planLoading,
  can,
  newOrdersCount,
  preparingOrdersCount,
  missingAlerts,
  activeBrand,
  isTrialActive,
  activePlan,
  trialAlreadyUsed,
  startTrial,
  setShowPlanSelector
}) {
  return (
    <aside
      className={`hidden lg:flex fixed left-0 top-0 bottom-0 bg-[#0F170F] border-r border-white/5 flex-col z-50 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-[240px]'
      }`}
    >
      <div className="flex flex-col h-full">
        {isCollapsed && (
          <div className="flex items-center h-20 justify-center shrink-0">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 drop-shadow-md">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-5 px-4 space-y-6">
          {ADMIN_ROLES.includes(user.role) && (
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectPage('analytics', 'Centro de Inteligencia', 'advanced_analytics')}
                className={`w-full group relative overflow-hidden transition-all duration-500 ${isCollapsed ? 'h-14' : 'h-[92px]'} rounded-2xl flex items-center ${
                  currentPage === 'analytics'
                    ? 'bg-white/[0.08] shadow-lg shadow-brand-primary/5'
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                } ${!planLoading && !can('advanced_analytics') && !isCollapsed ? 'opacity-70 grayscale-[0.4]' : ''}`}
              >
                <div className="absolute inset-0 backdrop-blur-xl pointer-events-none" />
                <div className={`absolute inset-0 rounded-2xl border transition-all duration-500 ${
                  currentPage === 'analytics' ? 'border-brand-primary/30' : 'border-white/[0.05] group-hover:border-white/10'
                }`} />
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                  <motion.div
                    animate={{ opacity: [0.03, 0.08, 0.03], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--color-brand-primary)_0%,_transparent_60%)] opacity-[0.05]"
                  />
                </div>
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 6, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-[-25deg] pointer-events-none"
                />
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-500">
                  <svg width="100%" height="100%" viewBox="0 0 120 40" preserveAspectRatio="none">
                    <motion.path
                      d="M0 30 Q 15 35, 30 20 T 60 25 T 90 15 T 120 22"
                      fill="none"
                      stroke="var(--color-brand-primary)"
                      strokeWidth="1.2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />
                  </svg>
                </div>

                <div className={`relative z-10 flex items-center w-full ${isCollapsed ? 'justify-center' : 'px-5 gap-4'}`}>
                  <div className="relative group/icon flex shrink-0 items-center justify-center">
                    <div
                      className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-500 relative ${
                        currentPage === 'analytics'
                          ? 'bg-brand-primary/20 text-brand-primary'
                          : 'bg-white/5 text-white/40 group-hover:text-white/80 group-hover:bg-white/10'
                      }`}
                      style={currentPage === 'analytics' ? { boxShadow: '0 0 20px -5px var(--color-brand-primary)' } : {}}
                    >
                      <div className={`absolute inset-0 rounded-full border transition-colors duration-500 ${
                        currentPage === 'analytics' ? 'border-brand-primary/40' : 'border-white/[0.08]'
                      }`} />
                      <Icons.Strategy />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-60"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary shadow-[0_0_10px_var(--color-brand-primary)] border border-[#0d0d0d]"></span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-[14px] font-bold leading-none tracking-tight transition-colors duration-300 ${
                          currentPage === 'analytics' ? 'text-white' : 'text-white/60 group-hover:text-white'
                        }`}>
                          Inteligencia
                        </p>
                        {!planLoading && !can('advanced_analytics') && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-500/60 shrink-0">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="h-[2px] w-8 rounded-full overflow-hidden bg-white/10 relative">
                          <motion.div
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 w-1/2 bg-brand-primary/80"
                          />
                        </div>
                        <p className={`text-[9px] font-medium uppercase tracking-[0.2em] transition-colors duration-300 truncate ${
                          currentPage === 'analytics' ? 'text-white/80' : 'text-white/30 group-hover:text-white/50'
                        }`}>
                          Análisis
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.button>

              {/* Finanzas & Contabilidad Card */}
              <button
                onClick={() => handleSelectPage('finance', 'Finanzas & Contabilidad')}
                className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-11'} rounded-xl border border-white/5 flex items-center ${
                  currentPage === 'finance'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-950/20'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentPage === 'finance' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                    <Icons.Finance />
                  </div>
                  {!isCollapsed && (
                    <div className="text-left flex-1 flex items-center justify-between">
                      <p className={`text-[12px] font-bold leading-none ${currentPage === 'finance' ? 'text-white' : 'text-white/60'}`}>
                        Finanzas
                      </p>
                      <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        PRO
                      </span>
                    </div>
                  )}
                </div>
              </button>

              {/* Carta & Opciones Card */}
              <button
                onClick={() => handleSelectPage('live_menu', 'Carta & Opciones')}
                className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-11'} rounded-xl border border-white/5 flex items-center ${
                  currentPage === 'live_menu'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-950/20'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentPage === 'live_menu' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                    <Icons.LiveMenu />
                  </div>
                  {!isCollapsed && (
                    <div className="text-left flex-1">
                      <p className={`text-[12px] font-bold leading-none ${currentPage === 'live_menu' ? 'text-white' : 'text-white/60'}`}>Carta & Opciones</p>
                    </div>
                  )}
                </div>
              </button>

              {/* Campañas & Descuentos Card */}
              <button
                onClick={() => handleSelectPage('promotions', 'Campañas & Descuentos')}
                className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-11'} rounded-xl border border-white/5 flex items-center ${
                  currentPage === 'promotions'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-md shadow-rose-950/20'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentPage === 'promotions' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                    <Icons.Promotions />
                  </div>
                  {!isCollapsed && (
                    <div className="text-left flex-1">
                      <p className={`text-[12px] font-bold leading-none ${currentPage === 'promotions' ? 'text-white' : 'text-white/60'}`}>Campañas & Descuentos</p>
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* 2. SECCION OPERACION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              {!isCollapsed && <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Operación</span>}
              <div className="h-px flex-1 bg-white/5 ml-3" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {user.role !== 'kitchen' && (
                <button
                  onClick={() => handleSelectPage('orders', 'Pedidos')}
                  className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-14'} rounded-xl border border-white/5 flex items-center ${
                    currentPage === 'orders'
                      ? 'bg-gradient-to-r from-blue-900/40 to-blue-950/40 border-blue-500/20 ring-1 ring-blue-500/20 shadow-lg shadow-blue-950/40'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === 'orders' ? 'bg-blue-400/20 text-blue-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                      <Icons.Orders />
                    </div>
                    {!isCollapsed && (
                      <div className="text-left flex-1">
                        <p className={`text-[13px] font-bold leading-none ${currentPage === 'orders' ? 'text-white' : 'text-white/60'}`}>Pedidos</p>
                        <p className="text-[9px] text-white/30 font-medium mt-1">Gestión en Vivo</p>
                      </div>
                    )}
                  </div>
                </button>
              )}

              {user.role !== 'waiter' && (
                <button
                  onClick={() => handleSelectPage('kitchen', 'Cocina', 'kitchen_display')}
                  className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-14'} rounded-xl border border-white/5 flex items-center ${
                    currentPage === 'kitchen'
                      ? 'bg-gradient-to-r from-orange-900/40 to-orange-950/40 border-orange-500/20 ring-1 ring-orange-500/20 shadow-lg shadow-orange-950/40'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                  } ${!planLoading && !can('kitchen_display') ? 'opacity-70 grayscale-[0.4]' : ''}`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === 'kitchen' ? 'bg-orange-400/20 text-orange-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                      <div className="relative">
                        <Icons.Kitchen />
                        {!planLoading && can('kitchen_display') && (newOrdersCount + preparingOrdersCount) > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />}
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="text-left flex-1 flex justify-between items-center pr-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className={`text-[13px] font-bold leading-none ${currentPage === 'kitchen' ? 'text-white' : 'text-white/60'}`}>Cocina</p>
                            {!planLoading && !can('kitchen_display') && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-500">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            )}
                          </div>
                          <p className="text-[9px] text-white/30 font-medium mt-1">Pantalla de Producción</p>
                        </div>
                        {!planLoading && can('kitchen_display') && (newOrdersCount > 0 || preparingOrdersCount > 0) && (
                          <div className="flex items-center gap-1">
                            {newOrdersCount > 0 && (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-blue-500 text-white text-[10px] font-black h-4 px-1.5 flex items-center justify-center rounded-sm shadow-sm">
                                {newOrdersCount}
                              </motion.span>
                            )}
                            {preparingOrdersCount > 0 && (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-orange-500 text-white text-[10px] font-black h-4 px-1.5 flex items-center justify-center rounded-sm shadow-sm">
                                {preparingOrdersCount}
                              </motion.span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )}

              {user.role !== 'waiter' && (
                <button
                  onClick={() => handleSelectPage('bar', 'Barra (BDS)', 'bar_display')}
                  className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-14'} rounded-xl border border-white/5 flex items-center ${
                    currentPage === 'bar'
                      ? 'bg-gradient-to-r from-cyan-900/40 to-cyan-950/40 border-cyan-500/20 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-950/40'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                  } ${!planLoading && !can('bar_display') ? 'opacity-70 grayscale-[0.4]' : ''}`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === 'bar' ? 'bg-cyan-400/20 text-cyan-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                      <div className="relative">
                        <Icons.Bar />
                        {!planLoading && can('bar_display') && (newOrdersCount + preparingOrdersCount) > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />}
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="text-left flex-1 flex justify-between items-center pr-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className={`text-[13px] font-bold leading-none ${currentPage === 'bar' ? 'text-white' : 'text-white/60'}`}>Barra (BDS)</p>
                            {!planLoading && !can('bar_display') && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-500">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            )}
                          </div>
                          <p className="text-[9px] text-white/30 font-medium mt-1">Coctelería & Bebidas</p>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )}

              {user.role !== 'kitchen' && (
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
              )}

              {(ADMIN_ROLES.includes(user.role) || user.role === 'cashier') && (
                <button
                  onClick={() => handleSelectPage('operations', 'Turno & Caja')}
                  className={`w-full group relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-14'} rounded-xl border border-white/5 flex items-center ${
                    currentPage === 'operations'
                      ? 'bg-gradient-to-r from-violet-900/40 to-violet-950/40 border-violet-500/20 ring-1 ring-violet-500/20 shadow-lg shadow-violet-950/40'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-4 gap-3'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentPage === 'operations' ? 'bg-violet-400/20 text-violet-400' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                      <Icons.Cash />
                    </div>
                    {!isCollapsed && (
                      <div className="text-left flex-1">
                        <p className={`text-[13px] font-bold leading-none ${currentPage === 'operations' ? 'text-white' : 'text-white/60'}`}>Turno & Caja</p>
                        <p className="text-[9px] text-white/30 font-medium mt-1">Caja & Turno en Vivo</p>
                      </div>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>

          {ADMIN_ROLES.includes(user.role) && (
            <NavSection title="Administración de Carta" items={CARTA_ITEMS} current={currentPage} onSelect={handleSelectPage} collapsed={isCollapsed} userRole={user.role} planLoading={planLoading} can={can} missingAlerts={missingAlerts} />
          )}
          {(ADMIN_ROLES.includes(user.role) || user.role === 'kitchen') && (
            <NavSection title="Producción e Inventario" items={PROD_ITEMS} current={currentPage} onSelect={handleSelectPage} collapsed={isCollapsed} userRole={user.role} planLoading={planLoading} can={can} missingAlerts={missingAlerts} />
          )}
          {ADMIN_ROLES.includes(user.role) && (
            <>
              <NavSection title="Administración de Staff & Locales" items={ADMIN_ITEMS} current={currentPage} onSelect={handleSelectPage} collapsed={isCollapsed} userRole={user.role} planLoading={planLoading} can={can} missingAlerts={missingAlerts} />
              <NavSection title="Presencia Web" items={WEB_ITEMS} current={currentPage} onSelect={handleSelectPage} collapsed={isCollapsed} userRole={user.role} planLoading={planLoading} can={can} missingAlerts={missingAlerts} />
            </>
          )}

          {/* SECCIÓN: CUENTA Y EXTRAS */}
          <div className="pt-2 pb-6">
            {!isCollapsed ? (
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3 px-4 block">
                Cuenta & Extras
              </span>
            ) : (
              <div className="h-px bg-white/5 my-4 mx-4" />
            )}
            <div className="space-y-1.5 px-2">
              {ADMIN_ROLES.includes(user.role) && (
                <button
                  type="button"
                  onClick={() => handleSelectPage('aluna_lab')}
                  className={`group relative mb-3 flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${currentPage === 'aluna_lab' ? 'border-emerald-300/50 bg-emerald-400/15' : 'border-emerald-300/20 bg-white/[0.04] hover:border-emerald-300/50 hover:bg-white/[0.08]'} shadow-[0_0_26px_rgba(52,211,153,0.08)]`}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-cyan-300/5 to-violet-400/10 opacity-70" />
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.18)]"><Beaker size={17} /></span>
                  {!isCollapsed ? <span className="relative min-w-0"><span className="flex items-center gap-2 text-[13px] font-black text-white">Aluna Lab <span className="rounded-full bg-violet-400/15 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-violet-200">Beta</span></span><span className="mt-0.5 block text-[9px] font-medium text-white/35">Canvas gastronómico</span></span> : null}
                </button>
              )}
              {user?.role === 'superadmin' && (
                <a
                  href="/superadmin"
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 overflow-hidden ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Shield className="shrink-0 w-[15px] h-[15px] text-white/40 group-hover:text-white transition-colors" />
                  {!isCollapsed && <span>Panel Superadmin</span>}
                </a>
              )}
              <button
                onClick={() => setShowPlanSelector(true)}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 text-white/60 hover:text-amber-100 bg-white/5 hover:bg-white/10 border border-white/5 overflow-hidden ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Star className="shrink-0 w-[15px] h-[15px] text-amber-500/50 group-hover:text-amber-400 transition-colors" />
                {!isCollapsed && <span>Mi Plan / Upgrade</span>}
              </button>
              <a
                href={activeBrand?.slug ? `/${activeBrand.slug}/` : '/'}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 overflow-hidden ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Globe className="shrink-0 w-[15px] h-[15px] text-white/40 group-hover:text-white transition-colors" />
                {!isCollapsed && <span>Ver Menú Público</span>}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom: Plan / Trial / Collapse */}
        <div className="mt-auto border-t border-white/5 bg-black/10">
          {!planLoading && activeBrand && (() => {
            const daysLeft = activeBrand.trial_end_date ? Math.max(0, Math.ceil((new Date(activeBrand.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
            const isPaid = activeBrand?.payment_verified === true || activeBrand?.payment_verified === 'true';

            if (isPaid) {
              return isCollapsed ? (
                <div className="flex justify-center py-4 border-b border-white/5"><div className="w-2 h-2 rounded-full bg-emerald-500" title="Cuenta Activa" /></div>
              ) : (
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Cuenta Activa</span>
                </div>
              );
            }
            if (daysLeft > 0) {
              return isCollapsed ? (
                <div className="flex justify-center py-4 border-b border-white/5"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title={`Prueba: ${daysLeft} días`} /></div>
              ) : (
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Prueba Activa: {daysLeft} días</span>
                </div>
              );
            }
            return isCollapsed ? (
              <div className="flex justify-center py-4 border-b border-white/5"><div className="w-2 h-2 rounded-full bg-red-500" title="Pago Pendiente" /></div>
            ) : (
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Pago Pendiente</span>
              </div>
            );
          })()}

          {!planLoading && !isTrialActive && !activePlan && !isCollapsed && trialAlreadyUsed && (
            <button onClick={() => setShowPlanSelector(true)} className="w-full px-4 py-2.5 text-left group">
              <div className="rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/10 border border-emerald-500/30 px-3 py-2 flex items-center gap-2 hover:from-emerald-500/30 transition-all">
                <span className="text-base">⭐</span>
                <div>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.18em]">Suscripción</p>
                  <p className="text-[11px] font-semibold text-white/80">Elegir o Activar Plan</p>
                </div>
              </div>
            </button>
          )}

          {!planLoading && !isTrialActive && !activePlan && !isCollapsed && !trialAlreadyUsed && (
            <button
              onClick={async () => {
                const { error } = await startTrial();
                if (error) alert('Error al iniciar prueba: ' + error.message);
              }}
              className="w-full px-4 py-2.5 text-left group"
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
  );
}
