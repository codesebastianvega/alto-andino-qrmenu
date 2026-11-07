import React from "react";
import { Icon } from "@iconify/react";
import { QRCode } from "react-qr-code";
import { formatCOP } from "@/utils/money";
import { translateGroup, normalizeWhatsAppNumber } from "@/utils/formatters";
import { safeSessionStorage as sessionStorage } from "@/utils/safeStorage";
import { cartToast, getTable } from "../helpers/cartHelpers";

export default function CartSuccessView({
  showSuccess,
  isPOSMode,
  lastOrderId,
  fulfillmentType,
  confirmedOrderSnapshot,
  brandSlug,
  currentLocation,
  settings,
  menuBrand,
  customerPaymentType,
  isPaid,
  transferMethods = [],
  cashChange = 0,
  clearCart,
  resetStates,
  setShowSuccess,
  onClose,
}) {
  if (!showSuccess) return null;

  return (
    <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-start sm:justify-center p-4 sm:p-8 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] text-center animate-in fade-in zoom-in duration-300 rounded-t-[28px] sm:rounded-[32px] overflow-y-auto overflow-x-hidden min-h-[500px]">
      <div className="flex flex-col items-center justify-center py-4 sm:py-8 px-2 sm:px-6 text-center space-y-4 sm:space-y-6 animate-in fade-in zoom-in duration-300 w-full max-w-md mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100/50">
          <Icon icon="solar:check-circle-bold" className="text-5xl sm:text-6xl" />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 leading-tight">
            {isPOSMode ? "¡Pedido Confirmado!" : "¡Pedido Recibido!"}
          </h2>
          <p className="text-gray-500 font-medium text-base sm:text-lg">
            Tu pedido{" "}
            <span className="text-gray-900 font-black text-lg sm:text-xl">
              #{lastOrderId ? lastOrderId.slice(-4).toUpperCase() : ""}
            </span>{" "}
            ha sido registrado.
          </p>
        </div>

        {/* Mesa o Cliente info */}
        {fulfillmentType === "dine_in" && getTable() && (
          <div className="mt-2 sm:mt-4 inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mesa</span>
            <span className="text-base sm:text-lg font-black text-[#2f4131]">{getTable()}</span>
          </div>
        )}

        {/* Resumen Detallado de lo que pidió el cliente */}
        {confirmedOrderSnapshot && confirmedOrderSnapshot.items?.length > 0 && (
          <div className="w-full max-w-sm mx-auto bg-neutral-50/90 border border-neutral-200/90 rounded-2xl p-4 text-left shadow-sm space-y-3 mt-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-neutral-200/70 pb-2">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:bag-smile-bold" className="text-emerald-700 text-base" />
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
                  Lo que pediste
                </span>
              </div>
              <span className="text-xs font-black text-neutral-900">
                {formatCOP(confirmedOrderSnapshot.finalTotal)}
              </span>
            </div>
            {confirmedOrderSnapshot.discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/70">
                <span className="flex items-center gap-1">
                  <Icon icon="solar:ticket-sale-bold" />
                  <span>Descuento aplicado ({confirmedOrderSnapshot.appliedCoupon?.code || "Cupón"}):</span>
                </span>
                <span>-{formatCOP(confirmedOrderSnapshot.discountAmount)}</span>
              </div>
            )}
            <div className="divide-y divide-neutral-200/50 max-h-48 overflow-y-auto pr-1 space-y-2">
              {confirmedOrderSnapshot.items.map((it, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex justify-between items-start gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-neutral-900 leading-tight">
                      <span className="text-emerald-700 font-black mr-1">{it.qty || 1}x</span>
                      {it.name}
                    </p>
                    {it.options && Object.keys(it.options).length > 0 && (
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug">
                        {Object.entries(it.options)
                          .map(([k, v]) => `${translateGroup(k)}: ${Array.isArray(v) ? v.join(", ") : v}`)
                          .join(" • ")}
                      </p>
                    )}
                    {it.note && (
                      <p className="text-[10px] italic text-amber-700 mt-0.5">Nota: {it.note}</p>
                    )}
                  </div>
                  <span className="font-bold text-neutral-700 shrink-0 text-xs">
                    {formatCOP((it.unitPrice || 0) * (it.qty || 1))}
                  </span>
                </div>
              ))}
            </div>
            {confirmedOrderSnapshot.formattedAddress && (
              <div className="pt-2 border-t border-neutral-200/70 text-[11px] text-neutral-600 flex items-start gap-1.5">
                <Icon icon="solar:map-point-bold" className="text-emerald-600 shrink-0 text-sm mt-0.5" />
                <span className="truncate">{confirmedOrderSnapshot.formattedAddress}</span>
              </div>
            )}
            {confirmedOrderSnapshot.paymentMethodSummary && (
              <div className="text-[10px] font-semibold text-neutral-400 flex items-center justify-between">
                <span>Método: {confirmedOrderSnapshot.paymentMethodSummary}</span>
                <span className="capitalize">
                  {confirmedOrderSnapshot.fulfillmentType === "delivery"
                    ? "🛵 Domicilio"
                    : confirmedOrderSnapshot.fulfillmentType === "dine_in"
                    ? "🍽️ En Mesa"
                    : "🛍️ Para Llevar"}
                </span>
              </div>
            )}
          </div>
        )}

        {isPOSMode && (
          <div className="mt-4 sm:mt-8 p-4 sm:p-8 bg-white border border-gray-100 rounded-3xl sm:rounded-[3rem] shadow-2xl shadow-black/5 flex flex-col items-center gap-4 sm:gap-6 animate-in slide-in-from-bottom-6 delay-150 duration-700 w-full">
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">
                QR Seguimiento Cliente
              </p>
              <p className="text-xs sm:text-sm font-medium text-gray-400">
                Escanea para seguir el estado en tiempo real
              </p>
            </div>
            <div className="p-4 sm:p-8 bg-white rounded-2xl sm:rounded-[2.5rem] ring-8 sm:ring-[12px] ring-gray-50/50 flex items-center justify-center shadow-inner max-w-[200px] sm:max-w-none">
              <div className="relative">
                <QRCode
                  value={`${window.location.origin}/${brandSlug}/#order/${lastOrderId}`}
                  size={180}
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            </div>
          </div>
        )}

        {!isPOSMode && fulfillmentType !== "dine_in" && !isPaid && (() => {
          const proofPhone = normalizeWhatsAppNumber(
            currentLocation?.whatsapp ||
              settings?.whatsapp_number_orders ||
              menuBrand?.whatsapp_number ||
              menuBrand?.phone ||
              ""
          );
          const proofOrderCode = lastOrderId ? lastOrderId.slice(-4).toUpperCase() : "";
          const proofMsg = encodeURIComponent(
            `¡Hola! 👋 Envío el comprobante de pago de mi pedido #${proofOrderCode}. ✨`
          );
          const proofUrl = `https://wa.me/${proofPhone}?text=${proofMsg}`;

          // Transferencia (Nequi / Bre-B / Daviplata / Banco)
          if (customerPaymentType === "transfer") {
            const transferMethodsWithDetails = transferMethods;

            return (
              <div className="mt-4 sm:mt-6 w-full max-w-sm mx-auto space-y-3">
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 sm:p-5 text-center space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <Icon icon="solar:wallet-bold" className="text-xl sm:text-2xl text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-800 mb-0.5">Confirmación de Pago</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Para iniciar la preparación, realiza la transferencia a la siguiente cuenta y envía tu comprobante por WhatsApp:
                    </p>
                  </div>

                  {/* Destination accounts */}
                  {transferMethodsWithDetails.length > 0 && (
                    <div className="space-y-2 text-left bg-white p-3 rounded-xl border border-orange-200/80 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Cuentas para transferir:
                      </p>
                      {transferMethodsWithDetails.map((m) => (
                        <div key={m.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{m.details?.bank_name || m.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (m.details?.account_number) {
                                  navigator.clipboard.writeText(m.details.account_number);
                                  cartToast.success("Número copiado");
                                }
                              }}
                              className="text-[10px] font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              Copiar
                            </button>
                          </div>
                          <p className="font-mono font-bold text-slate-900 text-xs">{m.details?.account_number}</p>
                          {m.details?.holder_name && (
                            <p className="text-[10px] text-slate-500">Titular: {m.details.holder_name}</p>
                          )}
                          {m.details?.bre_b_key && (
                            <p className="text-[11px] font-semibold text-emerald-700 pt-0.5">
                              ⚡ Llave Bre-B:{" "}
                              <span className="font-mono font-bold text-emerald-900">{m.details.bre_b_key}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)] hover:-translate-y-0.5 transition-all"
                  >
                    <Icon icon="logos:whatsapp-icon" className="text-lg sm:text-xl" />
                    Enviar Comprobante
                  </a>
                </div>
              </div>
            );
          }

          // Efectivo
          if (customerPaymentType === "cash") {
            return (
              <div className="mt-4 sm:mt-6 w-full max-w-sm mx-auto">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2.5 sm:mb-3">
                    <Icon icon="solar:bill-list-bold" className="text-xl sm:text-2xl text-emerald-600" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-gray-800 mb-1">Pago en Efectivo al Recibir</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">
                    Ten listo tu dinero en efectivo al momento de recibir tu pedido.
                  </p>
                  {cashChange > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <span>💵 Tu cambio a devolver:</span>
                      <span className="font-black">{formatCOP(cashChange)}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-100/60 text-emerald-700 text-[11px] font-semibold">
                      <span>✅ Pago exacto al entregar</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Tarjeta física / Datáfono contra entrega
          if (customerPaymentType === "card") {
            return (
              <div className="mt-4 sm:mt-6 w-full max-w-sm mx-auto">
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 sm:p-5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2.5 sm:mb-3">
                    <Icon icon="solar:card-bold" className="text-xl sm:text-2xl text-indigo-600" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-gray-800 mb-1">Pago con Datáfono al Recibir</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    El repartidor o personal llevará el datáfono para procesar tu pago con tarjeta física al momento de la entrega.
                  </p>
                </div>
              </div>
            );
          }

          return null;
        })()}
      </div>

      <div className="w-full max-w-md mx-auto space-y-2.5 sm:space-y-3 pb-2">
        {isPOSMode ? (
          <>
            <button
              onClick={() => {
                clearCart();
                resetStates();
                sessionStorage.removeItem("aa_current_mesa");
                sessionStorage.removeItem("aa_pos_mode");
                sessionStorage.removeItem("aa_manual_type");
                const targetUrl = `/${brandSlug}/?admin_page=waiter#admin`;
                window.location.href = targetUrl;
              }}
              className="w-full bg-gray-900 text-white py-3.5 sm:py-5 min-h-[48px] rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-black/10 hover:bg-black cursor-pointer"
            >
              <Icon icon="solar:hamburger-menu-bold" className="text-lg sm:text-xl" />
              Ir al Mapa de Mesas
            </button>

            <button
              onClick={() => {
                clearCart();
                resetStates();
                setShowSuccess(false);
                onClose();
              }}
              className="w-full bg-white text-gray-900 border-2 border-gray-100 py-3.5 sm:py-5 min-h-[48px] rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-gray-50 hover:border-gray-200 cursor-pointer"
            >
              <Icon icon="solar:camera-add-bold" className="text-lg sm:text-xl" />
              Tomar Nuevo Pedido
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                window.location.href = `#order/${lastOrderId}`;
                setShowSuccess(false);
              }}
              className="w-full bg-[#2f4131] text-white py-3.5 sm:py-5 min-h-[48px] rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 sm:gap-3 transition-all active:scale-95 shadow-xl shadow-[#2f4131]/20 cursor-pointer"
            >
              Seguir Mi Pedido
              <Icon icon="solar:arrow-right-line-duotone" className="text-lg sm:text-xl" />
            </button>

            {/* Customer Support WhatsApp button */}
            {!isPOSMode &&
              (currentLocation?.whatsapp ||
                settings?.whatsapp_number_orders ||
                menuBrand?.whatsapp_number ||
                menuBrand?.phone) && (
                <button
                  type="button"
                  onClick={() => {
                    const rawPhone =
                      currentLocation?.whatsapp ||
                      settings?.whatsapp_number_orders ||
                      menuBrand?.whatsapp_number ||
                      menuBrand?.phone ||
                      "";
                    const cleanPhone = rawPhone.replace(/\D/g, "");
                    const orderNum = lastOrderId ? lastOrderId.slice(-4).toUpperCase() : "";
                    const text = encodeURIComponent(
                      `Hola, acabo de hacer el pedido #${orderNum} en ${
                        currentLocation?.business_name || settings?.business_name || "su restaurante"
                      } y tengo una consulta.`
                    );
                    const targetPhone = cleanPhone.startsWith("57") ? cleanPhone : `57${cleanPhone}`;
                    window.open(`https://wa.me/${targetPhone}?text=${text}`, "_blank");
                  }}
                  className="w-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 py-3 sm:py-4 min-h-[44px] rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 hover:bg-emerald-100/70 cursor-pointer"
                >
                  <Icon icon="logos:whatsapp-icon" className="text-lg sm:text-xl" />
                  ¿Dudas sobre tu pedido? Escríbenos
                </button>
              )}

            <button
              onClick={() => {
                setShowSuccess(false);
                onClose();
              }}
              className="w-full py-2.5 sm:py-4 text-xs sm:text-sm text-gray-400 font-bold hover:text-gray-600 transition-colors cursor-pointer"
            >
              Cerrar Menú
            </button>
          </>
        )}
      </div>
    </div>
  );
}
