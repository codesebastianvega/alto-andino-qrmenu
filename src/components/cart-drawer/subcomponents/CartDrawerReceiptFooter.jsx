import React from "react";
import { Icon } from "@iconify-icon/react";
import { formatCOP } from "@/utils/money";
import { isRestaurantOpen } from "@/utils/businessHours";
import { safeStorage as localStorage } from "@/utils/safeStorage";

export default function CartDrawerReceiptFooter({
  items = [],
  total,
  packagingFeeTotal,
  fulfillmentType,
  setFulfillmentType,
  isTipEnabled,
  includeTip,
  setIncludeTip,
  tipPercentage,
  serviceFeeAmount,
  finalTotal,
  isWithinOrderLimit,
  isPOSMode,
  currentBusinessHours,
  menuBrand,
  showFulfillmentSelector,
  setShowFulfillmentSelector,
  isDarkKitchen,
  fulfillmentModes,
  scheduledTime,
  setScheduledTime,
  isLeadRequired,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  deliveryAddress,
  setDeliveryAddress,
  deliveryNotes,
  setDeliveryNotes,
  onConfirmOrder,
  isSubmitting,
  isLeadValid,
  onClose
}) {
  if (!items.length) return null;

  const isOpenStatus = isRestaurantOpen(currentBusinessHours, menuBrand?.config);

  return (
    <div className="flex-shrink-0 bg-white border-t border-neutral-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10 relative">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-neutral-100/60 border-dashed">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-neutral-500 font-medium">Subtotal</span>
          <span className="text-sm font-semibold text-neutral-700">{formatCOP(total)}</span>
        </div>

        {packagingFeeTotal > 0 &&
          (fulfillmentType === "takeaway" || fulfillmentType === "delivery") && (
            <div className="flex justify-between items-center mb-1 animate-in fade-in slide-in-from-right-2">
              <span className="text-sm text-neutral-500 font-medium">Empaque</span>
              <span className="text-sm font-semibold text-neutral-700">
                {formatCOP(packagingFeeTotal)}
              </span>
            </div>
          )}

        {isTipEnabled && (
          <div className="flex justify-between items-center mb-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={includeTip}
                  onChange={(e) => setIncludeTip(e.target.checked)}
                  className="w-4 h-4 text-[#2f4131] bg-gray-100 border-gray-300 rounded focus:ring-[#2f4131] cursor-pointer"
                />
              </div>
              <span className="text-sm text-neutral-500 font-medium group-hover:text-neutral-700 transition-colors">
                Incluir propina ({tipPercentage}%)
              </span>
            </label>
            <span className="text-sm font-semibold text-neutral-700">
              {includeTip ? formatCOP(serviceFeeAmount) : "-"}
            </span>
          </div>
        )}

        {!isTipEnabled && (
          <div className="flex justify-between items-center text-sm text-neutral-400">
            <span>Sin costo de servicio</span>
            <span>-</span>
          </div>
        )}
      </div>

      <div
        className="px-4 pt-3 pb-3 md:px-6 md:pt-4 md:pb-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-base md:text-lg font-bold text-neutral-900">Total</span>
          <span className="text-2xl md:text-3xl font-black tracking-tight text-[#2f4131]">
            {formatCOP(finalTotal)}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {!isWithinOrderLimit && !isPOSMode ? (
            <div className="bg-neutral-900 rounded-2xl p-5 flex items-start gap-3.5 animate-in fade-in slide-in-from-bottom-2 shadow-xl shadow-neutral-900/10">
              <div className="text-neutral-400 mt-0.5 flex-shrink-0">
                <Icon icon="heroicons:information-circle" className="text-2xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-100 leading-snug">
                  El restaurante ha alcanzado su límite de pedidos por este mes. Por favor, intenta de nuevo más tarde.
                </p>
              </div>
            </div>
          ) : !showFulfillmentSelector ? (
            <div className="flex flex-col gap-2">
              {!isOpenStatus.isOpen && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                  <Icon icon="heroicons:clock" className="text-lg" />
                  <span>{isOpenStatus.message}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowFulfillmentSelector(true)}
                disabled={!items.length || !isOpenStatus.isOpen}
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold shadow-lg bg-[#2f4131] hover:bg-[#202c21] text-white shadow-[#2f4131]/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 cursor-pointer"
              >
                {isOpenStatus.isOpen ? (
                  <>
                    {isDarkKitchen ? "Siguiente: Datos de Entrega" : "Siguiente: Tipo de Pedido"}
                    <Icon
                      icon={isDarkKitchen ? "heroicons:truck" : "heroicons:arrow-right"}
                      className="text-xl"
                    />
                  </>
                ) : (
                  "Restaurante Cerrado"
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
              {/* Fulfillment Picker / Dark Kitchen Mode */}
              {isDarkKitchen ? (
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFulfillmentType("delivery");
                        localStorage.setItem("aa_fulfillment_flow", "delivery");
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                        fulfillmentType !== "takeaway"
                          ? "border-[#2f4131] bg-[#2f4131]/10 text-[#2f4131] shadow-xs scale-[1.01]"
                          : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      <Icon icon="heroicons:truck" className="text-base text-amber-600" />
                      <span>🛵 A Domicilio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFulfillmentType("takeaway");
                        localStorage.setItem("aa_fulfillment_flow", "takeaway");
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                        fulfillmentType === "takeaway"
                          ? "border-[#2f4131] bg-[#2f4131]/10 text-[#2f4131] shadow-xs scale-[1.01]"
                          : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      <Icon icon="heroicons:shopping-bag" className="text-base text-amber-600" />
                      <span>🛍️ Recoger en Local</span>
                    </button>
                  </div>
                  {fulfillmentType === "takeaway" ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold">
                      ✓ Recoges en cocina · Sin costo de envío
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950">
                      <span className="text-xs font-bold">Entrega a Domicilio</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-950 px-2 py-0.5 rounded-md">
                        Dark Kitchen
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "dine_in", label: "En Mesa", icon: "heroicons:map-pin", enabled: fulfillmentModes.dine_in },
                    { id: "takeaway", label: "Para Llevar", icon: "heroicons:shopping-bag", enabled: fulfillmentModes.takeaway },
                    { id: "delivery", label: "Domicilio", icon: "heroicons:truck", enabled: fulfillmentModes.delivery },
                    { id: "scheduled", label: "Programado", icon: "heroicons:calendar", enabled: fulfillmentModes.scheduled }
                  ]
                    .filter((opt) => opt.enabled)
                    .map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFulfillmentType(opt.id)}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all gap-1 cursor-pointer ${
                          fulfillmentType === opt.id
                            ? "border-[#2f4131] bg-[#2f4131]/10 text-[#2f4131] shadow-sm scale-[1.02]"
                            : "border-neutral-100 bg-neutral-50 text-neutral-500 grayscale opacity-70"
                        }`}
                      >
                        <Icon icon={opt.icon} className="text-xl" />
                        <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                      </button>
                    ))}
                </div>
              )}

              {/* Dynamic Inputs based on selection */}
              {fulfillmentType === "scheduled" && (
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131] transition-all bg-white"
                />
              )}

              {isLeadRequired && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      {fulfillmentType === "delivery"
                        ? "Datos de Contacto y Entrega"
                        : "Datos de Contacto"}
                    </label>
                    <span className="text-[10px] font-bold text-amber-500 bg-white px-2 py-0.5 rounded-full border border-amber-100">
                      REQUERIDO
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre Completo"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        localStorage.setItem("aa_customer_name", e.target.value);
                      }}
                      className="flex-1 h-11 px-3.5 rounded-xl border border-amber-200 bg-white text-sm font-medium focus:ring-2 focus:ring-amber-200/50"
                    />
                    <input
                      type="tel"
                      placeholder="Celular"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        localStorage.setItem("aa_customer_phone", e.target.value);
                      }}
                      className="w-2/5 h-11 px-3.5 rounded-xl border border-amber-200 bg-white text-sm font-medium focus:ring-2 focus:ring-amber-200/50"
                    />
                  </div>
                  {fulfillmentType === "delivery" && (
                    <div className="space-y-2 pt-1 border-t border-amber-200/60">
                      <input
                        type="text"
                        placeholder="Dirección completa y barrio (ej: Calle 4 #5-20, Centro)"
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          localStorage.setItem("aa_delivery_address", e.target.value);
                        }}
                        className="w-full h-11 px-3.5 rounded-xl border border-amber-200 bg-white text-sm font-medium focus:ring-2 focus:ring-amber-200/50"
                      />
                      <input
                        type="text"
                        placeholder="Indicaciones (Apto, torre, conjunto, timbre)"
                        value={deliveryNotes}
                        onChange={(e) => {
                          setDeliveryNotes(e.target.value);
                          localStorage.setItem("aa_delivery_notes", e.target.value);
                        }}
                        className="w-full h-11 px-3.5 rounded-xl border border-amber-200 bg-white text-sm font-medium focus:ring-2 focus:ring-amber-200/50"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFulfillmentSelector(false)}
                  className="w-12 h-14 flex items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Icon icon="heroicons:arrow-left" className="text-xl" />
                </button>
                <button
                  type="button"
                  onClick={onConfirmOrder}
                  disabled={isSubmitting || !isLeadValid}
                  className={`flex-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                    !isLeadValid || isSubmitting
                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                      : "bg-[#2f4131] text-white shadow-[#2f4131]/20 hover:bg-[#202c21]"
                  }`}
                >
                  {isSubmitting ? (
                    <Icon icon="line-md:loading-loop" className="text-xl" />
                  ) : (
                    <>
                      <Icon icon="heroicons:sparkles" className="text-xl" />
                      Confirmar Pedido
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {!showFulfillmentSelector && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Seguir pidiendo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
