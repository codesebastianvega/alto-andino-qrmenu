import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function ManualOrderCustomerSection({
  fulfillmentType,
  setFulfillmentType,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  deliveryAddress,
  setDeliveryAddress,
  deliveryFee,
  setDeliveryFee,
  customerSuggestions = [],
  showSuggestions,
  setShowSuggestions,
  handleSelectSuggestion
}) {
  return (
    <div className="p-3.5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
          <Icon icon="heroicons:user" className="text-amber-600" />
          Datos del Cliente
        </span>
        <div className="flex gap-1">
          {['delivery', 'takeaway'].map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setFulfillmentType(mode)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                fulfillmentType === mode
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-100 text-neutral-500 border-neutral-200'
              }`}
            >
              {mode === 'delivery' ? '🛵 Domicilio' : '🛍️ Recoger'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative space-y-1.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="text"
              value={customerName}
              onChange={e => {
                setCustomerName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Nombre (ej: Manuela Vega)"
              className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50 focus:bg-white focus:border-[#2f4131] outline-none"
            />
          </div>
          <div className="relative">
            <input
              type="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="WhatsApp (ej: 312...)"
              className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50 focus:bg-white focus:border-[#2f4131] outline-none"
            />
          </div>
        </div>

        {/* Dropdown de sugerencias de clientes recurrentes del CRM */}
        {showSuggestions && customerSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-neutral-100 max-h-48 overflow-y-auto">
            <div className="px-3 py-1.5 bg-neutral-50 text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Clientes recurrentes encontrados</span>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            {customerSuggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(sug)}
                className="w-full px-3 py-2 text-left hover:bg-emerald-50/60 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 truncate">
                    {sug.customer_name}
                  </p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1.5 truncate">
                    {sug.customer_phone && <span>📱 {sug.customer_phone}</span>}
                    {sug.delivery_address && <span>📍 {sug.delivery_address}</span>}
                  </p>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                  Cargar
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tip informativo de CRM para el operador */}
        {customerName && customerName !== 'Cliente WhatsApp' && !customerPhone && (
          <p className="text-[10px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
            <Icon icon="solar:info-circle-bold" className="shrink-0 text-amber-600 text-xs" />
            <span>💡 Agrega el WhatsApp para vincular a {customerName} con su historial de compras en el CRM.</span>
          </p>
        )}
      </div>

      {fulfillmentType === 'delivery' && (
        <div className="space-y-1.5 pt-0.5">
          <input
            type="text"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            placeholder="Dirección de entrega (ej: Cra 7 #3-15 Apto 402)"
            className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50 focus:bg-white"
          />
          <div className="flex items-center justify-between gap-2 bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-200">
            <span className="text-[11px] font-bold text-neutral-600 flex items-center gap-1 shrink-0">
              <Icon icon="heroicons:truck" className="text-emerald-600" />
              Valor Domicilio:
            </span>
            <div className="flex items-center gap-1">
              {[0, 3000, 4000, 5000].map(feeOpt => (
                <button
                  key={feeOpt}
                  type="button"
                  onClick={() => setDeliveryFee(feeOpt)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                    deliveryFee === feeOpt
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {feeOpt === 0 ? 'Gratis' : `$${(feeOpt / 1000).toFixed(0)}k`}
                </button>
              ))}
              <div className="relative w-20">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">
                  $
                </span>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={deliveryFee}
                  onChange={e => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full pl-4 pr-1 py-0.5 text-right font-black text-xs rounded-lg border border-neutral-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
