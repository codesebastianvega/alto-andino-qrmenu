import React from 'react';
import { ShoppingBag, ShoppingCart, X } from 'lucide-react';

export default function UpgradeHeader({
  activeBrand,
  currency,
  setCurrency,
  billingCycle,
  setBillingCycle,
  cartCount,
  isCartOpenMobile,
  setIsCartOpenMobile,
  onClose
}) {
  return (
    <header className="bg-white px-5 sm:px-7 py-3.5 border-b border-gray-200/80 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
      {/* Logo & Marca de la Tienda */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/20">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-gray-900 tracking-tight">
              Aluna Marketplace
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              Tienda Oficial
            </span>
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">
            Planes y módulos para potenciar a{' '}
            <span className="font-bold text-gray-800">
              {activeBrand?.name || 'tu restaurante'}
            </span>
          </p>
        </div>
      </div>

      {/* Controles de Tienda (Moneda, Facturación, Carrito y Salir) */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Selector Moneda (COP / USD) */}
        <div className="flex items-center p-0.5 rounded-xl bg-gray-100 border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setCurrency('COP')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              currency === 'COP'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🇨🇴 COP
          </button>
          <button
            type="button"
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              currency === 'USD'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🇺🇸 USD
          </button>
        </div>

        {/* Switch Mensual / Anual */}
        <div className="flex items-center p-0.5 rounded-xl bg-gray-100 border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Anual</span>
            <span className="text-[9px] bg-emerald-400 text-emerald-950 px-1.5 py-0.2 rounded-full font-black">
              -20%
            </span>
          </button>
        </div>

        {/* Botón Carrito en Móvil */}
        <button
          type="button"
          onClick={() => setIsCartOpenMobile(!isCartOpenMobile)}
          className="lg:hidden relative p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 cursor-pointer"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all ml-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
