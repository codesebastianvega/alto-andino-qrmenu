import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function POSKeypadColumn({
  isCash,
  keypadTarget,
  receivedAmount,
  setReceivedAmount,
  pendingThreshold,
  handleKeyPress,
  isSplitting,
  tenders = [],
  addTender,
  handleFinalize,
  isProcessing,
  amountToCover
}) {
  return (
    <div className="order-3 lg:col-span-4 flex flex-col bg-gray-50/50 shrink-0 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] lg:shadow-none">
      <div className="p-4 lg:p-8 flex-1 flex flex-col space-y-4 lg:space-y-8">
        {/* Visualizer */}
        <div className="space-y-2 lg:space-y-4">
          <div className="flex justify-between items-end">
            <p
              className={`text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                keypadTarget === 'received' ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {isCash ? 'INGRESAR EFECTIVO RECIBIDO' : 'CONFIRMAR MONTO ELECTRÓNICO'}
            </p>
          </div>
          <div
            className={`bg-white rounded-[1.5rem] lg:rounded-[2.5rem] p-4 lg:p-8 border-2 transition-all shadow-md lg:shadow-xl text-right relative overflow-hidden group ${
              keypadTarget === 'received' ? 'border-blue-500 ring-2 lg:ring-4 ring-blue-50' : 'border-gray-100'
            }`}
          >
            <div className="absolute top-0 left-0 h-full w-1.5 lg:w-2 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute left-6 lg:left-8 top-1/2 -translate-y-1/2 text-xl lg:text-2xl font-black text-gray-200">
              $
            </span>
            <div className="text-2xl lg:text-4xl font-black text-gray-900 tracking-tighter">
              {(parseFloat(receivedAmount) || (isCash ? 0 : pendingThreshold)).toLocaleString()}
              {keypadTarget === 'received' && <span className="animate-pulse text-blue-500 ml-1">|</span>}
            </div>
          </div>

          {isCash && (
            <div className="flex items-center justify-between px-4 lg:px-6">
              <p className="text-[10px] lg:text-xs font-black text-gray-400 uppercase">CAMBIO ESTIMADO</p>
              <p className="text-xl lg:text-2xl font-black text-emerald-600">
                ${Math.max(0, (parseFloat(receivedAmount) || 0) - pendingThreshold).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="flex-1 flex flex-col space-y-3 lg:space-y-4">
          <div className="grid grid-cols-3 gap-2 flex-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '0', '000', 'clear'].map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`rounded-xl lg:rounded-2xl py-2 lg:py-0 font-black text-lg lg:text-xl transition-all active:scale-95 shadow-sm border border-gray-200 flex items-center justify-center ${
                  key === 'clear'
                    ? 'bg-red-50 text-red-500 border-red-100'
                    : 'bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                {key === 'clear' ? <Icon icon="solar:backspace-bold" /> : key}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {[10000, 20000, 50000].map((v) => (
              <button
                key={v}
                onClick={() => setReceivedAmount(v.toString())}
                className="flex-1 py-2.5 lg:py-3 bg-white border border-blue-200 rounded-xl text-[9px] lg:text-[10px] font-black text-blue-600 hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
              >
                ${v / 1000}K
              </button>
            ))}
            <button
              onClick={() => setReceivedAmount(pendingThreshold.toString())}
              className="flex-[1.5] py-2.5 lg:py-3 bg-blue-600 text-white rounded-xl text-[9px] lg:text-[10px] font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
            >
              TOTAL EXACTO
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 lg:gap-4 mt-2 lg:mt-0 pb-4 lg:pb-0">
          {(isSplitting || tenders.length > 0) && (
            <button
              onClick={addTender}
              disabled={
                (!isCash && pendingThreshold <= 0) ||
                (isCash && (!receivedAmount || parseFloat(receivedAmount) <= 0))
              }
              className={`flex-1 py-3.5 lg:py-6 rounded-[1.5rem] lg:rounded-[2rem] font-black text-xs lg:text-sm uppercase tracking-widest flex items-center justify-center gap-2 lg:gap-3 transition-all active:scale-95 shadow-lg lg:shadow-2xl ${
                (!isCash && pendingThreshold <= 0) ||
                (isCash && (!receivedAmount || parseFloat(receivedAmount) <= 0))
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-transparent'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:-translate-y-1'
              }`}
            >
              <Icon icon="solar:add-circle-bold" className="text-xl lg:text-2xl" />
              <span className="hidden sm:inline">AGREGAR PAGO</span>
            </button>
          )}
          <button
            onClick={handleFinalize}
            disabled={isProcessing || amountToCover <= 0}
            className={`w-full py-3.5 lg:py-6 rounded-[1.5rem] lg:rounded-[2.5rem] font-black text-sm lg:text-xl flex items-center justify-center gap-2 lg:gap-3 transition-all active:scale-95 shadow-lg lg:shadow-2xl ${
              isProcessing || amountToCover <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                : tenders.length === 0 && !isSplitting
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:-translate-y-1'
                : 'bg-gray-900 border-2 border-emerald-500 hover:bg-black text-white shadow-emerald-200/50 hover:-translate-y-1'
            }`}
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-white"></div>
            ) : (
              <>
                <Icon icon="solar:check-read-bold" className="text-xl lg:text-2xl" />
                COBRAR
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
