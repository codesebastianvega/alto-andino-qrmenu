import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function POSTendersColumn({
  paymentMethods = [],
  currentMethod,
  setCurrentMethod,
  setInputFocus,
  tenders = [],
  removeTender,
  totalTendered,
  pendingThreshold
}) {
  return (
    <div className="order-2 lg:col-span-4 lg:border-r border-b lg:border-b-0 border-gray-100 flex flex-col overflow-visible lg:overflow-hidden bg-white shrink-0">
      <div className="p-4 lg:p-6 overflow-y-visible lg:overflow-y-auto flex-1 space-y-4 lg:space-y-8 custom-scrollbar">
        <section>
          <h3 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3 lg:mb-5 flex items-center gap-2">
            <Icon icon="solar:wallet-bold" className="text-base text-emerald-600" /> MÉTODOS DE PAGO
          </h3>
          {/* Slider horizontal en móvil, Grid en escritorio */}
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-2 gap-3 no-scrollbar pb-2 lg:pb-0">
            {paymentMethods.map((method) => {
              const isSelected = currentMethod?.id === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    setCurrentMethod(method);
                    if (method.name.toLowerCase().includes('efectivo')) {
                      setInputFocus('received');
                    } else {
                      setInputFocus('manual_amount');
                    }
                  }}
                  className={`p-3 lg:p-4 rounded-[1.25rem] lg:rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2 group shrink-0 min-w-[110px] lg:min-w-0 ${
                    isSelected
                      ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-xl'
                      : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200'
                  }`}
                >
                  <Icon
                    icon={method.icon || 'solar:card-2-bold'}
                    className={`text-2xl ${isSelected ? 'text-emerald-400' : ''}`}
                  />
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-center">
                    {method.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="hidden lg:block">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Icon icon="solar:bill-list-bold" className="text-base" /> PAGOS REGISTRADOS
            </h3>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {tenders.length} PAGOS
            </span>
          </div>

          <div className="space-y-3">
            {tenders.length > 0 ? (
              tenders.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4 animate-in slide-in-from-right-4"
                >
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#2f4131]">
                    <Icon icon="solar:bill-check-bold" className="text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">
                      {t.name}
                    </p>
                    <p className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-widest">
                      RECIBIDO: ${t.received.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#2f4131]">${t.amount.toLocaleString()}</p>
                    <button
                      onClick={() => removeTender(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors mt-1"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center opacity-30">
                <Icon icon="solar:bill-list-bold" className="text-4xl mb-4 mx-auto" />
                <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest">
                  Esperando primer pago...
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-4 lg:p-6 bg-emerald-50 border-t border-emerald-100 shrink-0 hidden lg:block">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px] lg:text-xs font-black text-emerald-700 uppercase tracking-widest">
            TOTAL PAGADO
          </p>
          <p className="text-xl font-black text-emerald-900">${totalTendered.toLocaleString()}</p>
        </div>
        {pendingThreshold > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-[9px] lg:text-xs font-bold text-gray-400 uppercase tracking-widest">RESTANTE</p>
            <p className="text-[10px] lg:text-sm font-black text-orange-600">
              -${pendingThreshold.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
