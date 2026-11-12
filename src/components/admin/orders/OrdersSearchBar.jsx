import React from 'react';
import { Icon } from '@iconify-icon/react';
import soundService from '../../../utils/soundService';
import { toast } from '../../Toast';

export const OrdersSearchBar = ({
  searchQuery,
  setSearchQuery,
  filteredOrdersCount,
  isSoundLoopActive,
  setIsSoundLoopActive,
  incomingOrdersQueue,
  isAlertModalOpen,
  setIsAlertModalOpen,
  fiadosCount,
  totalCarteraAmount,
  setIsFiadosDrawerOpen,
  dateRange,
  setDateRange,
  setIsManualOrderModalOpen,
  fetchOrders,
  loading
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-3">
      {/* Quick Order Search Input */}
      <div className="relative flex-1 max-w-md">
        <Icon 
          icon="solar:magnifer-linear" 
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" 
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por #ID (ej: c955), mesa, cliente o teléfono..."
          className="w-full pl-10 pr-9 py-2.5 text-xs font-semibold rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131] shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
          >
            <Icon icon="heroicons:x-mark" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 justify-end shrink-0 flex-wrap">
        {/* Botón Silenciar Alarma Continua si está sonando */}
        {isSoundLoopActive ? (
          <button
            type="button"
            onClick={() => {
              soundService.stopNewOrderLoop();
              setIsSoundLoopActive(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-2xl text-xs font-black shadow-md animate-pulse border border-yellow-500 transition-all shrink-0 cursor-pointer"
            title="Silenciar sonido de la alarma continua"
          >
            <Icon icon="heroicons:speaker-wave" className="text-base animate-bounce" />
            <span className="hidden sm:inline">Silenciar Alarma</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              soundService.setSoundEnabled(true);
              soundService.unlockAudio();
              soundService.playNewOrder();
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
              }
              toast('🔊 Alarma de pedidos activa y probada', { icon: '🔔' });
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-2xl text-xs font-bold border border-gray-200 hover:border-emerald-300 shadow-2xs transition-all shrink-0 cursor-pointer"
            title="Probar y desbloquear el sonido de alarma de nuevos pedidos en este navegador"
          >
            <Icon icon="heroicons:speaker-wave" className="text-base text-emerald-600" />
            <span className="hidden sm:inline">Probar Alarma</span>
          </button>
        )}

        {/* Botón Acceso Rápido a Pedidos Nuevos Pendientes */}
        {incomingOrdersQueue.length > 0 && !isAlertModalOpen && (
          <button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black shadow-md animate-bounce border border-red-700 transition-all shrink-0 cursor-pointer"
            title="Abrir ventana para revisar y aceptar pedidos entrantes"
          >
            <Icon icon="heroicons:bell-alert" className="text-base" />
            <span>{incomingOrdersQueue.length} Nuevo{incomingOrdersQueue.length > 1 ? 's' : ''} por atender</span>
          </button>
        )}

        {searchQuery && (
          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
            {filteredOrdersCount} resultado{filteredOrdersCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* Botón Filtro Rápido Fiados / Cuentas por Cobrar */}
        {fiadosCount > 0 && (
          <button
            type="button"
            onClick={() => setIsFiadosDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all border shrink-0 cursor-pointer bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-950 border-amber-300 shadow-xs active:scale-95"
            title="Abrir cartera de fiados y cuentas por cobrar"
          >
            <Icon icon="heroicons:user-group" className="text-base text-amber-700" />
            <span>🤝 Fiados ({fiadosCount}) • ${totalCarteraAmount.toLocaleString()}</span>
          </button>
        )}

        {/* Time Range Selector */}
        <div className="flex bg-white border border-gray-100 p-1 rounded-2xl shadow-sm overflow-hidden">
          {[
            { id: 'today', label: 'Hoy' },
            { id: '7d', label: '7 Días' },
            { id: '30d', label: '30 Días' },
            { id: 'all', label: 'Total' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                dateRange === range.id 
                  ? 'bg-[#2f4131] text-white shadow-md shadow-[#2f4131]/20' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsManualOrderModalOpen(true)}
          className="flex items-center gap-2 px-3.5 md:px-4 py-2.5 bg-[#2f4131] hover:bg-[#233125] text-white rounded-2xl text-xs font-black shadow-md shadow-[#2f4131]/20 transition-all shrink-0 cursor-pointer active:scale-95"
          title="Crear un pedido manual rápido recibido por WhatsApp o mostrador"
        >
          <Icon icon="heroicons:plus-circle" className="text-base text-amber-400" />
          <span>+ Nuevo Pedido (WhatsApp / Mostrador)</span>
        </button>

        <button 
          onClick={fetchOrders} 
          className="p-2.5 md:p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm flex items-center gap-2 font-bold text-xs md:text-sm"
        >
          <Icon icon="heroicons:arrow-path" className={`text-lg md:text-xl ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </div>
  );
};

export default OrdersSearchBar;
