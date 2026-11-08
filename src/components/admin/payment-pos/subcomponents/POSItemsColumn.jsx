import React from 'react';
import { Icon } from '@iconify-icon/react';
import { resolveOrderItemName } from '../../../../utils/formatters';

export default function POSItemsColumn({
  order,
  paymentMode,
  setPaymentMode,
  setInputFocus,
  isSplitting,
  toggleSplitting,
  unpaidItems = [],
  selectedQuantities = {},
  updateItemQty,
  manualAmount,
  inputFocus,
  waiveServiceFee,
  setWaiveServiceFee,
  currentServiceFee,
  amountToCover
}) {
  return (
    <div className="order-1 lg:col-span-4 border-r border-gray-100 bg-gray-50/30 flex flex-col lg:overflow-hidden shrink-0 lg:shrink">
      <div className="p-4 border-b border-gray-100 bg-white space-y-3 shrink-0">
        {/* Mode Switcher */}
        <div className="flex p-1 bg-gray-100 rounded-2xl">
          <button
            onClick={() => {
              setPaymentMode('items');
              setInputFocus('received');
            }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2 ${
              paymentMode === 'items' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Icon icon="solar:bag-heart-bold" className="text-sm lg:text-lg" />
            Productos
          </button>
          <button
            onClick={() => {
              setPaymentMode('manual');
              setInputFocus('manual_amount');
            }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2 ${
              paymentMode === 'manual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Icon icon="solar:pen-new-square-bold" className="text-sm lg:text-lg" />
            Manual
          </button>
        </div>

        {/* Dividir Pago Toggle */}
        {paymentMode === 'items' && (
          <button
            onClick={toggleSplitting}
            className={`w-full py-3.5 rounded-2xl border-2 transition-all flex items-center justify-between px-5 group ${
              isSplitting
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                icon="solar:clipboard-list-bold"
                className={`text-xl ${isSplitting ? 'text-white' : 'text-emerald-500'}`}
              />
              <span className="text-sm font-black uppercase tracking-tight">Dividir Cuenta</span>
            </div>
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center border-2 ${
                isSplitting ? 'bg-white border-white' : 'border-gray-300'
              }`}
            >
              {isSplitting && <Icon icon="solar:check-circle-bold" className="text-emerald-600 text-lg" />}
            </div>
          </button>
        )}
      </div>

      {/* Lista de Productos / Manual */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[200px]">
        {paymentMode === 'items' ? (
          unpaidItems.length > 0 ? (
            unpaidItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-[2rem] border-2 transition-all ${
                  (selectedQuantities[item.id] || 0) > 0
                    ? 'bg-white border-emerald-500 shadow-sm'
                    : 'bg-gray-50 border-transparent opacity-50'
                }`}
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 uppercase truncate">
                      {resolveOrderItemName(item)}
                    </p>
                    <p className="text-xs font-bold text-gray-400">${item.unit_price.toLocaleString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900">
                      ${((selectedQuantities[item.id] || 0) * item.unit_price).toLocaleString()}
                    </p>
                    {isSplitting && (
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">
                        Cantidad: {selectedQuantities[item.id] || 0}
                      </p>
                    )}
                  </div>
                </div>

                {isSplitting && (
                  <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => updateItemQty(item.id, -1, item.quantity)}
                      className="h-10 w-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
                    >
                      <Icon icon="solar:minus-circle-bold" className="text-xl" />
                    </button>
                    <span className="text-lg font-black w-10 text-center">
                      {selectedQuantities[item.id] || 0}
                    </span>
                    <button
                      onClick={() => updateItemQty(item.id, 1, item.quantity)}
                      className="h-10 w-10 rounded-2xl bg-[#2f4131] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                    >
                      <Icon icon="solar:add-circle-bold" className="text-xl" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 py-12">
              <Icon icon="solar:box-minimalistic-bold" className="text-6xl mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">Sin productos pendientes</p>
            </div>
          )
        ) : (
          <div className="bg-white p-8 rounded-[3rem] border-2 border-emerald-500 shadow-xl shadow-emerald-100/30 text-center animate-in zoom-in-95">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">
              Ingresa Monto Manual
            </p>
            <div
              className="text-4xl font-black text-gray-900 tracking-tighter"
              onClick={() => setInputFocus('manual_amount')}
            >
              ${(parseFloat(manualAmount) || 0).toLocaleString()}
              {inputFocus === 'manual_amount' && <span className="animate-pulse text-emerald-600 ml-1">|</span>}
            </div>
          </div>
        )}

        {/* Already Paid Recap */}
        {order?.order_items?.some((i) => i.is_paid) && (
          <div className="pt-8 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              COBRADO ANTERIORMENTE
            </p>
            <div className="space-y-2">
              {order.order_items
                .filter((i) => i.is_paid)
                .map((i) => (
                  <div
                    key={i.id}
                    className="flex justify-between text-xs font-bold py-2 px-4 rounded-2xl bg-gray-50 text-gray-500"
                  >
                    <span>
                      {i.quantity}x {resolveOrderItemName(i)}
                    </span>
                    <span className="text-emerald-600 text-[10px] uppercase font-black">PAGADO</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Propina y Monto Seleccionado */}
      <div className="p-4 lg:p-6 bg-white border-t border-gray-100 space-y-4 shrink-0">
        {/* Service Fee Toggle */}
        {(order?.service_fee || 0) > 0 && (
          <button
            onClick={() => setWaiveServiceFee(!waiveServiceFee)}
            className={`w-full py-4 rounded-[2rem] border-2 transition-all flex items-center justify-between px-6 ${
              !waiveServiceFee
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon icon="solar:heart-bold" className="text-xl" />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">
                  Propina / Servicio (10%)
                </p>
                <p className="text-xs font-bold opacity-70">
                  {paymentMode === 'items' && currentServiceFee !== Number(order.service_fee)
                    ? `$${currentServiceFee.toLocaleString()} (Total: $${Number(order.service_fee).toLocaleString()})`
                    : `$${Number(order.service_fee).toLocaleString()}`}
                </p>
              </div>
            </div>
            <div
              className={`h-6 w-11 rounded-full p-1 transition-colors ${
                !waiveServiceFee ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`h-4 w-4 bg-white rounded-full transition-transform ${
                  !waiveServiceFee ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        )}

        <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-gray-200">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
            MONTO SELECCIONADO
          </p>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black tracking-tighter">${amountToCover.toLocaleString()}</p>
            {waiveServiceFee && <span className="text-[10px] font-bold text-orange-400 uppercase">Sin Servicio</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
