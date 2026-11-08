import React from 'react';
import { Check, ShoppingCart, ArrowRight } from 'lucide-react';
import { openWhatsApp } from '../upgradeStoreData';

export default function UpgradeProductCard({
  product,
  effectiveCurrentPlanSlug,
  isInCart,
  billingCycle,
  getDisplayPrice,
  getAnnualPrice,
  onToggleCart
}) {
  const isPlan = product.type === 'plan';
  const isEnterprise = product.type === 'enterprise';
  const isCurrentPlan = isPlan && product.slug === effectiveCurrentPlanSlug;
  const isAlreadyIncluded = !isPlan && product.includedIn?.includes(effectiveCurrentPlanSlug);
  const Icon = product.icon;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
        product.isFeatured
          ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
          : isInCart
            ? 'bg-emerald-50/40 border-emerald-400 shadow-sm'
            : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs'
      }`}
    >
      <div>
        {/* Top Row: Icon + Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`p-2.5 rounded-xl border ${product.iconBg}`}>
            <Icon className="w-5 h-5" />
          </span>

          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {product.badge && (
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${product.badgeColor}`}>
                {product.badge}
              </span>
            )}
            {isCurrentPlan && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Tu Plan Actual
              </span>
            )}
            {isAlreadyIncluded && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Incluido en tu Plan
              </span>
            )}
          </div>
        </div>

        {/* Título & Descripción */}
        <h3 className="text-base font-black text-gray-900 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-4 min-h-[36px]">
          {product.description}
        </p>

        {/* Precio */}
        <div className="py-2.5 border-y border-gray-100 mb-4">
          {isEnterprise ? (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-gray-900">A medida</span>
              <span className="text-[11px] text-gray-400">según sedes</span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                  {getDisplayPrice(product.copMonthly, product.usdMonthly)}
                </span>
                <span className="text-xs text-gray-500 font-bold">/ mes</span>
              </div>

              {billingCycle === 'annual' ? (
                <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-gray-100">
                  <span className="text-gray-500 font-medium">
                    Cobro anual: <strong className="text-gray-900">{getAnnualPrice(product.copMonthly, product.usdMonthly)}/año</strong>
                  </span>
                  <span className="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                    Ahorras 20%
                  </span>
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Facturación mensual sin compromiso
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lista de Bullets Positivos */}
        <div className="space-y-1.5 mb-5">
          {product.bullets.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-tight font-medium">{bullet}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Acción tipo Ecommerce */}
      <div>
        {isCurrentPlan ? (
          <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-black text-center border border-gray-200">
            ✓ Plan Activo en tu Restaurante
          </div>
        ) : isAlreadyIncluded ? (
          <div className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
            Ya disfrutas este módulo
          </div>
        ) : isEnterprise ? (
          <button
            type="button"
            onClick={() => openWhatsApp('¡Hola! Me gustaría cotizar Aluna Enterprise a medida para mi grupo de restaurantes.')}
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Cotizar con Ventas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : isPlan ? (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onToggleCart(product.id)}
              className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                isInCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Plan en Carrito (Quitar)</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Añadir Plan al Carrito</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToggleCart(product.id)}
            className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isInCart
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>En el Carrito (Quitar)</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>+ Añadir al Carrito</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
