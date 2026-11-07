import React from 'react';
import { Search, AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { PageHeader } from '../ui';
import DailySpecialModal from '../DailySpecialModal';

export default function LiveMenuHeaderControls({
  totalOffItems,
  onlyOffFilter,
  setOnlyOffFilter,
  setShowEmergencyModal,
  setEmergencyAction,
  isDailySpecialOpen,
  setIsDailySpecialOpen,
  refreshProducts,
  activeTab,
  setActiveTab,
  onProductsCount,
  offProducts = [],
  modifierGroupsCount = 0,
  searchQuery,
  setSearchQuery,
  setSelectedProductId
}) {
  return (
    <>
      {/* ─── Standard Centered Page Header ─── */}
      <PageHeader
        badge="Operación en Vivo"
        title="Carta & Opciones"
        subtitle="Control táctil de disponibilidad inmediata para platos y modificadores."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gestor de Almuerzos & Menú del Día */}
          <button
            onClick={() => setIsDailySpecialOpen(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-2 transition-all active:scale-95 border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer"
            title="Configurar Almuerzos de Hoy y Menú del Día"
          >
            <span className="text-base">🍱</span>
            <span>Almuerzos & Menú del Día</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </button>

          {totalOffItems > 0 && (
            <button
              onClick={() => setOnlyOffFilter(!onlyOffFilter)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                onlyOffFilter 
                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{totalOffItems} {totalOffItems === 1 ? 'apagado' : 'apagados'}</span>
            </button>
          )}

          <button
            onClick={() => { setEmergencyAction('pause'); setShowEmergencyModal(true); }}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-gray-200 hover:border-rose-200 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Pausar disponibilidad de toda la carta en caso de congestión de pedidos"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">Pausar Toda la Carta</span>
            <span className="sm:hidden">Pausar</span>
          </button>

          <button
            onClick={() => { setEmergencyAction('resume'); setShowEmergencyModal(true); }}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-200 hover:border-emerald-200 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reactivar disponibilidad de toda la carta"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Reactivar Toda la Carta</span>
            <span className="sm:hidden">Reactivar</span>
          </button>
        </div>
      </PageHeader>

      <DailySpecialModal 
        isOpen={isDailySpecialOpen} 
        onClose={() => setIsDailySpecialOpen(false)} 
        onSaved={refreshProducts} 
      />

      {/* ─── Control Bar: Buscador + Selector de Modos ─── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3.5">
        
        {/* Modos Principales (Platos vs Modificadores) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('products'); setSelectedProductId(null); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#2f4131] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700'
            }`}
          >
            <span>🍱 Platos & Menú</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {onProductsCount} activos · {offProducts.length} agotados
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('modifiers'); setSelectedProductId(null); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'modifiers'
                ? 'bg-[#2f4131] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700'
            }`}
          >
            <span>⚙️ Modificadores</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'modifiers' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {modifierGroupsCount} grupos
            </span>
          </button>
        </div>

        {/* Buscador Omnibox */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'products' ? "Buscar platos..." : "Buscar modificadores..."}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs font-semibold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131] transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
