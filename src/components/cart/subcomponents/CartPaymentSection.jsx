import React from "react";
import { Icon } from "@iconify/react";
import { cartToast } from "../helpers/cartHelpers";

export default function CartPaymentSection({
  isPOSMode,
  isLeadRequired,
  availablePaymentTypes = [],
  customerPaymentType,
  setCustomerPaymentType,
  cashTenderedType,
  setCashTenderedType,
  customCashAmount,
  setCustomCashAmount,
  effectiveCashAmount,
  finalTotal,
  cashChange,
  transferMethods = [],
  idSuffix = "",
  isPaid,
  setIsPaid,
  activeMethods = [],
  paymentMethod,
  setPaymentMethod,
  formatCOP,
}) {
  const toggleId = `paid-toggle-${idSuffix}`;

  return (
    <>
      {/* Customer Payment Method Section */}
      {!isPOSMode && isLeadRequired && (
        <div className="p-4 bg-white rounded-2xl border border-amber-200/90 shadow-sm space-y-3.5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
              <Icon icon="heroicons:credit-card" className="text-sm text-amber-600" />
              Método de Pago
            </label>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              REQUERIDO
            </span>
          </div>

          {/* Options grid */}
          <div
            className={`grid gap-2 ${
              availablePaymentTypes.length === 1
                ? "grid-cols-1"
                : availablePaymentTypes.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            {availablePaymentTypes.map((pt) => {
              const isSelected = customerPaymentType === pt.id;
              const colorStyles =
                pt.color === "emerald"
                  ? {
                      selected: "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm scale-[1.02]",
                      iconBg: "bg-emerald-600 text-white",
                    }
                  : pt.color === "blue"
                  ? {
                      selected: "border-blue-600 bg-blue-50 text-blue-950 shadow-sm scale-[1.02]",
                      iconBg: "bg-blue-600 text-white",
                    }
                  : {
                      selected: "border-indigo-600 bg-indigo-50 text-indigo-950 shadow-sm scale-[1.02]",
                      iconBg: "bg-indigo-600 text-white",
                    };

              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setCustomerPaymentType(pt.id)}
                  className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border-2 transition-all gap-0.5 sm:gap-1 text-center min-w-0 cursor-pointer ${
                    isSelected
                      ? colorStyles.selected
                      : "border-neutral-200 bg-neutral-50/70 text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected ? colorStyles.iconBg : "bg-neutral-200/80 text-neutral-600"
                    }`}
                  >
                    <Icon icon={pt.icon} className="text-lg" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black tracking-tight truncate max-w-full">
                    {pt.label}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-neutral-400 font-semibold leading-none">
                    {pt.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-panel: EFECTIVO */}
          {customerPaymentType === "cash" && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-900">¿Con cuánto vas a pagar?</span>
                <span className="text-[10px] text-emerald-700 font-medium">para alistar tu cambio</span>
              </div>

              {/* Denomination quick pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashTenderedType("exact")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    cashTenderedType === "exact"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50"
                  }`}
                >
                  Exacto
                </button>
                <button
                  type="button"
                  onClick={() => setCashTenderedType("50000")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    cashTenderedType === "50000"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50"
                  }`}
                >
                  $50.000
                </button>
                <button
                  type="button"
                  onClick={() => setCashTenderedType("100000")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    cashTenderedType === "100000"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50"
                  }`}
                >
                  $100.000
                </button>
                <button
                  type="button"
                  onClick={() => setCashTenderedType("custom")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    cashTenderedType === "custom"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50"
                  }`}
                >
                  Otro
                </button>
              </div>

              {/* Custom Cash Input */}
              {cashTenderedType === "custom" && (
                <div className="flex items-center gap-2 bg-white px-3 h-10 rounded-lg border border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-400/30">
                  <span className="text-emerald-700 font-bold text-sm">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={`Ingresa el monto (mínimo ${formatCOP(finalTotal)})`}
                    value={customCashAmount}
                    onChange={(e) => setCustomCashAmount(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-neutral-900 placeholder:text-neutral-300"
                  />
                </div>
              )}

              {/* Dynamic Change indicator pill */}
              {cashTenderedType === "exact" ? (
                <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5 pt-0.5">
                  <Icon icon="heroicons:check-circle" className="text-emerald-600 text-base" />
                  <span>
                    Pagas el valor exacto: <strong>{formatCOP(finalTotal)}</strong> (no necesitas cambio).
                  </span>
                </div>
              ) : effectiveCashAmount > finalTotal ? (
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-[11px] font-bold text-emerald-900 flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <Icon icon="heroicons:sparkles" className="text-base text-emerald-600" />
                    Llevarte de cambio:
                  </span>
                  <span className="text-sm font-black text-emerald-700 tabular-nums">
                    {formatCOP(cashChange)}
                  </span>
                </div>
              ) : effectiveCashAmount === finalTotal ? (
                <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5 pt-0.5">
                  <Icon icon="heroicons:check-circle" className="text-emerald-600 text-base" />
                  <span>
                    Pagas el valor exacto: <strong>{formatCOP(finalTotal)}</strong>.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] font-bold text-red-700 flex items-center gap-1.5">
                  <Icon icon="heroicons:exclamation-triangle" className="text-base text-red-500 flex-shrink-0" />
                  <span>
                    El monto (${formatCOP(effectiveCashAmount)}) debe ser mayor o igual al total ({formatCOP(finalTotal)}).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sub-panel: TRANSFERENCIA / NEQUI / BRE-B */}
          {customerPaymentType === "transfer" && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <Icon icon="heroicons:device-phone-mobile" className="text-base text-blue-600" />
                  Transferencia Nequi o Llave Bre-B
                </p>
              </div>

              {/* List configured transfer accounts */}
              {transferMethods.length > 0 ? (
                <div className="space-y-2">
                  {transferMethods.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 bg-white rounded-lg border border-blue-200/80 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {m.details?.bank_name || m.name} ({m.details?.account_type || "Billetera Digital"})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (m.details?.account_number) {
                              navigator.clipboard.writeText(m.details.account_number);
                              cartToast.success("Número de cuenta copiado");
                            }
                          }}
                          className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer touch-manipulation"
                          title="Copiar número"
                        >
                          <Icon icon="heroicons:clipboard" className="text-xs" />
                          <span>Copiar</span>
                        </button>
                      </div>
                      <div className="flex items-baseline justify-between text-xs font-mono font-bold text-slate-900">
                        <span className="text-sm tracking-wide text-blue-950 font-black">
                          {m.details?.account_number}
                        </span>
                        {m.details?.holder_name && (
                          <span className="text-[10px] font-sans font-medium text-slate-500">
                            Titular: {m.details.holder_name}
                          </span>
                        )}
                      </div>
                      {m.details?.bre_b_key && (
                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                          <span className="font-semibold text-emerald-700">⚡ Llave Bre-B:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-900 text-xs">
                              {m.details.bre_b_key}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(m.details.bre_b_key);
                                cartToast.success("Llave Bre-B copiada");
                              }}
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer touch-manipulation"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-blue-800/90 leading-relaxed font-medium">
                  Transfiere a nuestra cuenta Nequi o Llave Bre-B. Al confirmar tu pedido te compartiremos los datos y número para reportar el comprobante de pago.
                </p>
              )}
            </div>
          )}

          {/* Sub-panel: DATÁFONO */}
          {customerPaymentType === "card" && (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1.5 animate-in fade-in duration-200">
              <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                <Icon icon="heroicons:credit-card" className="text-base text-indigo-600" />
                Cobro con Datáfono al entregar
              </p>
              <p className="text-[11px] text-indigo-800/90 leading-relaxed font-medium">
                El domiciliario llevará un datáfono inalámbrico para cobrarte en físico con tu tarjeta débito o crédito (Visa, Mastercard, etc.).
              </p>
            </div>
          )}
        </div>
      )}

      {/* POS Controls */}
      {isPOSMode && (
        <div className="flex flex-col gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <label
              htmlFor={toggleId}
              className={`text-xs font-black cursor-pointer transition-colors uppercase tracking-widest ${
                isPaid ? "text-emerald-600" : "text-neutral-500"
              }`}
            >
              {isPaid ? "PAGO RECIBIDO" : "PENDIENTE DE PAGO"}
            </label>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                id={toggleId}
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </div>
          </div>

          {isPaid && (
            <div className="pt-3 border-t border-neutral-200 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Método de Pago</p>
              <div className="grid grid-cols-2 gap-2">
                {activeMethods.length > 0 ? (
                  activeMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === method.id
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                          : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >
                      <Icon icon={method.icon || "heroicons:banknotes"} className="text-sm" />
                      {method.name}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-2 text-center text-[10px] text-neutral-400 bg-neutral-50 rounded-lg border border-dashed border-neutral-200 uppercase font-black">
                    Sin métodos de pago
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
