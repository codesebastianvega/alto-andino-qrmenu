import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function POSHeader({
  order,
  customerName,
  customerPhone,
  loyaltyStats,
  isSearchingCustomer,
  inputFocus,
  setInputFocus,
  remainingOrderBalance,
  onClose
}) {
  return (
    <div className="px-6 lg:px-8 py-3.5 lg:py-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-20">
      <div className="flex items-center gap-3.5">
        <div className="h-11 w-11 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
          <Icon icon="solar:calculator-minimalistic-bold" className="text-2xl text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-base lg:text-xl font-black text-gray-900 leading-none uppercase tracking-tight">
              CAJA / PUNTO DE VENTA
            </h2>
            <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
              PANTALLA COMPLETA
            </span>
          </div>
          <p className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider">
            PEDIDO #{order?.id?.slice(0, 4).toUpperCase()} • {customerName || order?.customer_name || 'MOSTRADOR'}
          </p>
        </div>
      </div>

      <div className="hidden lg:block flex-1 max-w-sm mx-auto px-6">
        <div
          onClick={() => setInputFocus('customer_phone')}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
            inputFocus === 'customer_phone'
              ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/10'
              : 'bg-slate-50 border-gray-200 hover:border-slate-300'
          }`}
        >
          <div className="shrink-0 relative">
            <Icon
              icon={
                loyaltyStats.medal === 'emerald'
                  ? 'solar:dialog-2-bold'
                  : loyaltyStats.medal === 'gold'
                  ? 'solar:medal-bold'
                  : 'solar:phone-bold'
              }
              className={`text-xl ${
                loyaltyStats.medal === 'emerald'
                  ? 'text-emerald-500'
                  : loyaltyStats.medal === 'gold'
                  ? 'text-amber-500'
                  : 'text-gray-400'
              }`}
            />
            {loyaltyStats.medal && (
              <div
                className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                  loyaltyStats.medal === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
              IDENTIFICAR CLIENTE
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs lg:text-sm font-black text-gray-900 tabular-nums">
                {customerPhone || '____-____'}
              </span>
              {loyaltyStats.medal === 'emerald' && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-50 to-teal-50 px-2 py-0.5 rounded-lg border border-emerald-100 shadow-sm shadow-emerald-500/10">
                  <Icon icon="solar:star-bold" className="text-emerald-500 text-xs" />
                  <span className="text-[9px] font-black text-emerald-700 uppercase">VIP EMERALD</span>
                </div>
              )}
              {loyaltyStats.medal === 'gold' && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-0.5 rounded-lg border border-amber-100 shadow-sm shadow-amber-500/10">
                  <Icon icon="solar:medal-star-bold" className="text-amber-500 text-xs" />
                  <span className="text-[9px] font-black text-amber-700 uppercase">CUSTOMER GOLD</span>
                </div>
              )}
            </div>
          </div>
          {isSearchingCustomer && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="text-right">
          <p className="text-[9px] lg:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
            SALDO TOTAL ORDEN
          </p>
          <p className="text-xl lg:text-3xl font-black text-[#2f4131] leading-none">
            ${remainingOrderBalance.toLocaleString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="h-10 w-10 lg:h-11 lg:w-11 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all text-gray-500 shadow-sm border border-slate-200 shrink-0"
          title="Cerrar Caja (Esc)"
        >
          <Icon icon="heroicons:x-mark" className="text-2xl" />
        </button>
      </div>
    </div>
  );
}
