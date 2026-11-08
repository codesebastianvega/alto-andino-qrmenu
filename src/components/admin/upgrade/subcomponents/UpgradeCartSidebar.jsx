import React from 'react';
import { ShoppingCart, ShoppingBag, Trash2, MessageCircle, ShieldCheck, X } from 'lucide-react';

export default function UpgradeCartSidebar({
  isCartOpenMobile,
  setIsCartOpenMobile,
  cartSummary,
  billingCycle,
  currency,
  onRemoveFromCart,
  onCheckout
}) {
  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-white border-l border-gray-200/80 p-5 flex flex-col justify-between shadow-2xl transition-transform lg:static lg:translate-x-0 ${
        isCartOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Header del Carrito */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Tu Carrito Aluna</h3>
              <p className="text-[10px] text-gray-400 font-medium">
                {cartSummary.count === 0
                  ? 'Sin módulos añadidos'
                  : `${cartSummary.count} artículo(s) seleccionado(s)`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpenMobile(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Items en Carrito */}
        <div className="py-4 space-y-2.5 max-h-[46vh] overflow-y-auto">
          {cartSummary.count === 0 ? (
            <div className="text-center py-10 px-4 space-y-2">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-700">Tu carrito está vacío</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Haz clic en <strong>"+ Añadir al Carrito"</strong> en cualquier módulo o add-on para calcular tu inversión.
              </p>
            </div>
          ) : (
            cartSummary.items.map(item => {
              const isAnnual = billingCycle === 'annual';
              const rawMonthly = currency === 'USD' ? item.usdMonthly : item.copMonthly;
              const discMonthly = isAnnual ? Math.round(rawMonthly * 0.8) : rawMonthly;
              const itemAnnualTotal = discMonthly * 12;

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-gray-900 truncate">
                      {item.name}
                    </p>
                    <div className="flex flex-col mt-0.5">
                      <span className="text-xs font-black text-emerald-700">
                        {isAnnual ? (
                          <>
                            {currency === 'USD'
                              ? `$${itemAnnualTotal} USD`
                              : `$${itemAnnualTotal.toLocaleString('es-CO')} COP`}
                            <span className="text-[10px] text-gray-400 font-normal"> / año</span>
                          </>
                        ) : (
                          <>
                            {currency === 'USD'
                              ? `$${discMonthly} USD`
                              : `$${discMonthly.toLocaleString('es-CO')} COP`}
                            <span className="text-[10px] text-gray-400 font-normal"> / mes</span>
                          </>
                        )}
                      </span>
                      {isAnnual && (
                        <span className="text-[10px] text-gray-500 font-medium">
                          Equivale a {currency === 'USD' ? `$${discMonthly}` : `$${discMonthly.toLocaleString('es-CO')}`}/mes (-20%)
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0 mt-0.5 cursor-pointer"
                    title="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Resumen de Pago & Botón de Checkout */}
      <div className="pt-4 border-t border-gray-100 space-y-3.5">
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>Ciclo seleccionado:</span>
            <span className="font-bold text-gray-800">
              {billingCycle === 'annual'
                ? 'Anual (12 meses con -20% OFF)'
                : 'Mensual (Mes a mes)'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>Moneda:</span>
            <span className="font-bold text-gray-800">
              {currency === 'USD' ? 'Dólares (USD)' : 'Pesos Colombianos (COP)'}
            </span>
          </div>

          {billingCycle === 'annual' ? (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center text-gray-600">
                <span>Equivalente por mes:</span>
                <span className="font-bold text-gray-800">
                  {cartSummary.formattedMonthly}{' '}
                  <span className="text-[10px] text-gray-400 font-normal">/ mes</span>
                </span>
              </div>

              {cartSummary.annualSavings > 0 && (
                <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-bold text-xs">
                  <span>Ahorro del 20% anual:</span>
                  <span>-{cartSummary.formattedSavings}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between pt-2 border-t border-gray-200">
                <div>
                  <span className="block font-black text-gray-900 text-sm">Total a pagar hoy:</span>
                  <span className="text-[10px] text-gray-400 font-medium">12 meses completos facturados</span>
                </div>
                <span className="text-xl font-black text-emerald-700 tracking-tight">
                  {cartSummary.formattedTotalPayable}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between pt-2 border-t border-gray-100 text-sm">
              <div>
                <span className="block font-black text-gray-900">Total a pagar hoy:</span>
                <span className="text-[10px] text-gray-400 font-medium">Facturación mensual</span>
              </div>
              <span className="text-xl font-black text-emerald-700 tracking-tight">
                {cartSummary.formattedTotalPayable}{' '}
                <span className="text-xs text-gray-400 font-normal">/ mes</span>
              </span>
            </div>
          )}
        </div>

        {/* Botón Principal de Checkout */}
        <button
          type="button"
          onClick={onCheckout}
          disabled={cartSummary.count === 0}
          className="w-full py-3.5 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            Confirmar y Activar ({billingCycle === 'annual' ? 'Pago Anual de 12 Meses' : 'Pago Mensual'})
          </span>
        </button>

        {/* Garantías al pie */}
        <div className="pt-2 text-center space-y-1">
          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Sin permanencia · Cancela cuando quieras</span>
          </p>
          <p className="text-[10px] text-gray-400">
            Activación instantánea en menos de 5 minutos
          </p>
        </div>
      </div>
    </aside>
  );
}
