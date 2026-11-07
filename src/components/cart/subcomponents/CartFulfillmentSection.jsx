import React from "react";
import { Icon } from "@iconify/react";
import AddressInputWithMap from "../../delivery/AddressInputWithMap";

export default function CartFulfillmentSection({
  isDarkKitchen,
  fulfillmentType,
  setFulfillmentType,
  scheduledTime,
  setScheduledTime,
  fulfillmentModes,
  isLeadRequired,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  deliveryAddress,
  setDeliveryAddress,
  setDeliveryLocationInfo,
  deliveryNotes,
  setDeliveryNotes,
  currentLocation,
  total,
  freeDeliveryPromo,
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Fulfillment Picker / Dark Kitchen Mode */}
      {isDarkKitchen ? (
        <div className="flex flex-col gap-2.5">
          {/* Selector Domicilio vs Recoger en Tienda */}
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
                setScheduledTime("");
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
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-950">
              <Icon icon="heroicons:sparkles" className="text-lg text-emerald-600 shrink-0" />
              <div className="leading-tight">
                <p className="font-black text-emerald-900">¡Recoges en nuestra cocina sin costo de envío!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Te notificamos al WhatsApp cuando esté listo.</p>
              </div>
            </div>
          ) : (
            /* Selector de horario para Domicilio */
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFulfillmentType("delivery");
                  setScheduledTime("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                  fulfillmentType === "delivery" && !scheduledTime
                    ? "border-[#2f4131] bg-[#2f4131]/10 text-[#2f4131] shadow-xs scale-[1.02]"
                    : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                <Icon icon="heroicons:bolt" className="text-base text-amber-500" />
                <span>Lo antes posible</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFulfillmentType("scheduled");
                  if (!scheduledTime) {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + 45);
                    setScheduledTime(now.toISOString().slice(0, 16));
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all font-bold text-xs cursor-pointer ${
                  fulfillmentType === "scheduled" || scheduledTime
                    ? "border-[#2f4131] bg-[#2f4131]/10 text-[#2f4131] shadow-xs scale-[1.02]"
                    : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                <Icon icon="heroicons:calendar" className="text-base text-amber-500" />
                <span>Programar hora</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "dine_in", label: "En Mesa", icon: "heroicons:map-pin", enabled: fulfillmentModes?.dine_in },
            { id: "takeaway", label: "Para Llevar", icon: "heroicons:shopping-bag", enabled: fulfillmentModes?.takeaway },
            { id: "delivery", label: "Domicilio", icon: "heroicons:truck", enabled: fulfillmentModes?.delivery },
            { id: "scheduled", label: "Programado", icon: "heroicons:calendar", enabled: fulfillmentModes?.scheduled },
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

      {/* Bloque de hora programada con botones rápidos de hoy */}
      {(fulfillmentType === "scheduled" || Boolean(scheduledTime)) && (
        <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <Icon icon="heroicons:clock" className="text-sm text-amber-600" />
              ¿A qué hora deseas recibirlo hoy?
            </label>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Programado
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {["12:30", "13:00", "13:30", "14:00"].map((timeStr) => {
              const todayDate = new Date().toISOString().slice(0, 10);
              const fullIso = `${todayDate}T${timeStr}`;
              const isSelected = scheduledTime?.startsWith(fullIso);
              const displayHour =
                timeStr === "12:30"
                  ? "12:30 PM"
                  : timeStr === "13:00"
                  ? "1:00 PM"
                  : timeStr === "13:30"
                  ? "1:30 PM"
                  : "2:00 PM";
              return (
                <button
                  key={timeStr}
                  type="button"
                  onClick={() => {
                    setFulfillmentType("scheduled");
                    setScheduledTime(fullIso);
                  }}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-[#2f4131] text-white border-[#2f4131] shadow-xs"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {displayHour}
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <label className="text-[10px] font-semibold text-neutral-400 block mb-1">
              O elige otra hora personalizada:
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => {
                setFulfillmentType("scheduled");
                setScheduledTime(e.target.value);
              }}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131] transition-all bg-white"
            />
          </div>
        </div>
      )}

      {/* Unified Customer Leads Section */}
      {isLeadRequired && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm animate-in slide-in-from-top-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
              {fulfillmentType === "delivery" ? "Datos de Contacto y Entrega" : "Datos de Contacto"}
            </label>
            <span className="text-[10px] font-bold text-amber-500 bg-white px-2 py-0.5 rounded-full border border-amber-100">
              REQUERIDO
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 bg-white px-3 h-11 rounded-xl border border-amber-200 focus-within:ring-2 focus-within:ring-amber-200/50 transition-all">
              <Icon icon="heroicons:user" className="text-amber-500 text-lg flex-shrink-0" />
              <input
                type="text"
                placeholder="Nombre Completo"
                value={customerName || ""}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  localStorage.setItem("aa_customer_name", e.target.value);
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-base sm:text-sm font-medium placeholder:text-amber-300"
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-3 h-11 rounded-xl border border-amber-200 focus-within:ring-2 focus-within:ring-amber-200/50 transition-all">
              <Icon icon="heroicons:phone" className="text-amber-500 text-lg flex-shrink-0" />
              <input
                type="tel"
                placeholder="Celular / WhatsApp (ej: 310 123 4567)"
                value={customerPhone || ""}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  localStorage.setItem("aa_customer_phone", e.target.value);
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-base sm:text-sm font-medium placeholder:text-amber-300"
              />
            </div>
            {fulfillmentType === "delivery" && (
              <>
                <AddressInputWithMap
                  value={deliveryAddress || ""}
                  onChange={(newAddress) => {
                    setDeliveryAddress(newAddress);
                    localStorage.setItem("aa_delivery_address", newAddress);
                  }}
                  onLocationSelect={(info) => {
                    setDeliveryLocationInfo(info);
                  }}
                  currentLocation={currentLocation}
                  orderSubtotal={total}
                  freeDeliveryPromo={freeDeliveryPromo}
                />
                <div className="flex items-center gap-2 bg-white px-3 h-11 rounded-xl border border-amber-200 focus-within:ring-2 focus-within:ring-amber-200/50 transition-all">
                  <Icon icon="heroicons:chat-bubble-bottom-center-text" className="text-amber-500 text-lg flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Indicaciones (Apto, torre, conjunto, timbre)"
                    value={deliveryNotes || ""}
                    onChange={(e) => {
                      setDeliveryNotes(e.target.value);
                      localStorage.setItem("aa_delivery_notes", e.target.value);
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 text-base sm:text-sm font-medium placeholder:text-amber-300"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
