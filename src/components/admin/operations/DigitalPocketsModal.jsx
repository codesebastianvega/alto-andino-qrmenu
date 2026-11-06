import React from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';

export default function DigitalPocketsModal({
  isOpen,
  onClose,
  digitalPockets = {},
  totalDigitalAmount = 0,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl text-purple-200">
              <Icon icon="solar:card-bold" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black uppercase tracking-tight">
                Bancos & Bolsillos Digitales
              </h3>
              <p className="text-xs text-purple-200 font-medium">
                Arqueo por cuenta en este turno
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <Icon icon="solar:close-circle-bold" className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">
                Total Recaudado Digital
              </span>
              <span className="text-2xl font-black text-purple-950">
                {formatCOP(totalDigitalAmount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-purple-800">
                {Object.values(digitalPockets).reduce((acc, p) => acc + p.orders.length, 0)} pagos recibidos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {Object.values(digitalPockets).map(pocket => (
              <div
                key={pocket.id}
                className="p-4 rounded-2xl border border-gray-200 bg-white shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${
                      pocket.id === 'nequi' ? 'bg-[#200020] text-pink-400' :
                      pocket.id === 'daviplata' ? 'bg-rose-100 text-rose-600' :
                      pocket.id === 'bancolombia' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Icon icon={pocket.icon} />
                    </div>
                    <span className="text-xs font-black text-gray-900">{pocket.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">
                    {formatCOP(pocket.total)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Transacciones ({pocket.orders.length}):
                  </p>
                  {pocket.orders.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {pocket.orders.map(o => (
                        <div key={o.id} className="flex items-center justify-between text-[11px] py-1 border-b border-gray-50 last:border-0">
                          <span className="font-bold text-gray-700 truncate max-w-[130px]">
                            #{o.shortId} • {o.customerName}
                          </span>
                          <div className="text-right shrink-0">
                            <span className="font-black text-gray-900">{formatCOP(o.amount)}</span>
                            <span className="text-[9px] text-gray-400 ml-1.5">{o.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">Sin transacciones registradas</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-black transition-all cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
}
