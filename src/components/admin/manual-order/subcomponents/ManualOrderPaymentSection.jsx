import React from 'react';
import { Icon } from '@iconify-icon/react';
import { formatCOP } from '../../../../utils/money';

export default function ManualOrderPaymentSection({
  isPaid,
  setIsPaid,
  activePaymentMethods = [],
  paymentMethod,
  setPaymentMethod,
  cashTendered,
  setCashTendered,
  grandTotal,
  splitCashAmount,
  setSplitCashAmount,
  splitDigitalAmount,
  setSplitDigitalAmount,
  digitalAccountsList = [],
  selectedDigitalAccountId,
  setSelectedDigitalAccountId,
  setSplitDigitalMethod,
  splitDigitalMethod,
  pendingType,
  setPendingType,
  customerName
}) {
  return (
    <div className="p-3 bg-white rounded-2xl border border-neutral-200 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
          Estado del Pago
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsPaid(true)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              isPaid
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            ✓ Ya Pagado
          </button>
          <button
            type="button"
            onClick={() => setIsPaid(false)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              !isPaid
                ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-xs font-black'
                : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Por Cobrar
          </button>
        </div>
      </div>

      {isPaid ? (
        <div className="space-y-2.5 pt-1 border-t border-neutral-100 animate-in fade-in">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {activePaymentMethods.map(pm => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border shrink-0 transition-all cursor-pointer ${
                  paymentMethod === pm.id
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>

          {/* Calculadora de Vueltas / Cambio en Efectivo */}
          {paymentMethod === 'efectivo' && (
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-neutral-700 shrink-0">
                  Paga con efectivo:
                </label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">$</span>
                  <input
                    type="text"
                    value={cashTendered}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCashTendered(val ? Number(val).toLocaleString('es-CO') : '');
                    }}
                    placeholder={grandTotal.toLocaleString('es-CO')}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-black rounded-xl border border-neutral-300 bg-white text-right focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131]"
                  />
                </div>
              </div>

              {/* Chips rápidos de denominación colombiana */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashTendered(grandTotal.toLocaleString('es-CO'))}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  Exacto ({formatCOP(grandTotal)})
                </button>
                {grandTotal <= 20000 && (
                  <button
                    type="button"
                    onClick={() => setCashTendered((20000).toLocaleString('es-CO'))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                  >
                    $ 20.000
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCashTendered((50000).toLocaleString('es-CO'))}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  $ 50.000
                </button>
                <button
                  type="button"
                  onClick={() => setCashTendered((100000).toLocaleString('es-CO'))}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  $ 100.000
                </button>
              </div>

              {/* Cálculo instantáneo de vueltas */}
              {(() => {
                const tenderNum = Number(String(cashTendered).replace(/\D/g, '')) || 0;
                if (tenderNum >= grandTotal && grandTotal > 0) {
                  const change = tenderNum - grandTotal;
                  return (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-950">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Icon icon="heroicons:banknotes" className="text-base text-emerald-700" />
                        Cambio / Vueltas a entregar:
                      </span>
                      <span className="text-sm font-black text-emerald-800">{formatCOP(change)}</span>
                    </div>
                  );
                } else if (tenderNum > 0 && tenderNum < grandTotal) {
                  return (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Icon icon="heroicons:exclamation-circle" className="text-base text-amber-700" />
                        Falta por pagar:
                      </span>
                      <span className="text-sm font-black text-amber-800">{formatCOP(grandTotal - tenderNum)}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* ─── PAGO MIXTO / DIVIDIDO (Efectivo + Nequi/Transferencia) ─── */}
          {paymentMethod === 'split' && (
            <div className="p-3.5 bg-gradient-to-br from-amber-50/70 via-purple-50/40 to-neutral-50 rounded-2xl border border-purple-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">⚡</span>
                  <span className="text-xs font-black text-neutral-900 uppercase tracking-tight">
                    Pago Dividido (Mixto)
                  </span>
                </div>
                <span className="text-xs font-black text-neutral-900 bg-white px-2 py-0.5 rounded-lg border border-neutral-200 shadow-2xs">
                  Total: {formatCOP(grandTotal)}
                </span>
              </div>

              {/* Inputs de Efectivo y Nequi con balance automático */}
              <div className="grid grid-cols-2 gap-2">
                {/* Parte 1: Efectivo */}
                <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600 tracking-wider flex items-center gap-1">
                    <span>💵 Efectivo</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={splitCashAmount}
                      onChange={e => {
                        const num = Number(e.target.value.replace(/\D/g, '') || 0);
                        setSplitCashAmount(e.target.value ? num.toLocaleString('es-CO') : '');
                        const remaining = Math.max(0, grandTotal - num);
                        setSplitDigitalAmount(remaining > 0 ? remaining.toLocaleString('es-CO') : '0');
                      }}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-1.5 text-xs font-black text-neutral-900 rounded-lg border border-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Parte 2: Billetera Digital Real */}
                <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1">
                      <span>🟣 Billetera Digital</span>
                    </label>
                    <select
                      value={selectedDigitalAccountId}
                      onChange={e => {
                        setSelectedDigitalAccountId(e.target.value);
                        setSplitDigitalMethod(e.target.value);
                      }}
                      className="text-[10px] font-bold bg-neutral-100 border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-800 focus:outline-hidden cursor-pointer"
                    >
                      {digitalAccountsList.map(da => (
                        <option key={da.id} value={da.id}>{da.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={splitDigitalAmount}
                      onChange={e => {
                        const num = Number(e.target.value.replace(/\D/g, '') || 0);
                        setSplitDigitalAmount(e.target.value ? num.toLocaleString('es-CO') : '');
                        const remaining = Math.max(0, grandTotal - num);
                        setSplitCashAmount(remaining > 0 ? remaining.toLocaleString('es-CO') : '0');
                      }}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-1.5 text-xs font-black text-purple-950 rounded-lg border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Chips de ajuste rápido */}
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="text-neutral-500 font-bold">Atajos:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round(grandTotal / 2);
                      setSplitCashAmount(half.toLocaleString('es-CO'));
                      setSplitDigitalAmount((grandTotal - half).toLocaleString('es-CO'));
                    }}
                    className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 cursor-pointer"
                  >
                    50% / 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const roundCash = Math.floor(grandTotal / 10000) * 10000;
                      setSplitCashAmount(roundCash.toLocaleString('es-CO'));
                      setSplitDigitalAmount(Math.max(0, grandTotal - roundCash).toLocaleString('es-CO'));
                    }}
                    className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 cursor-pointer"
                  >
                    Redondear Efectivo
                  </button>
                </div>
              </div>

              {/* Verificación de Suma Total */}
              {(() => {
                const cashVal = Number(String(splitCashAmount).replace(/\D/g, '')) || 0;
                const digVal = Number(String(splitDigitalAmount).replace(/\D/g, '')) || 0;
                const totalSum = cashVal + digVal;
                const diff = grandTotal - totalSum;

                if (diff === 0 && grandTotal > 0) {
                  return (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between">
                      <span>✅ Total exacto cubierto</span>
                      <span>{formatCOP(cashVal)} EFECTIVO + {formatCOP(digVal)} {splitDigitalMethod === 'datafono' ? 'DATÁFONO' : 'NEQUI'}</span>
                    </div>
                  );
                } else if (diff > 0) {
                  return (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-between">
                      <span>⚠️ Faltan {formatCOP(diff)} por distribuir</span>
                      <span>Suma: {formatCOP(totalSum)}</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center justify-between">
                      <span>⚠️ Supera por {formatCOP(Math.abs(diff))}</span>
                      <span>Suma: {formatCOP(totalSum)}</span>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 pt-1 border-t border-neutral-100 animate-in fade-in">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPendingType('contra_entrega')}
              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                pendingType === 'contra_entrega'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon icon="heroicons:truck" className="text-sm" />
                <span>Contra Entrega</span>
              </div>
              <p className={`text-[10px] font-normal mt-0.5 ${pendingType === 'contra_entrega' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                Paga al recibir su pedido
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPendingType('fiado')}
              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                pendingType === 'fiado'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon icon="heroicons:user-group" className="text-sm" />
                <span>🤝 Fiado / Crédito</span>
              </div>
              <p className={`text-[10px] font-normal mt-0.5 ${pendingType === 'fiado' ? 'text-amber-100' : 'text-neutral-400'}`}>
                Hermana, empleado o cliente
              </p>
            </button>
          </div>

          {pendingType === 'fiado' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                <Icon icon="heroicons:information-circle" className="text-base text-amber-700" />
                <span>Cuenta por cobrar a: {customerName?.trim() || 'Cliente'}</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                El pedido se creará y los ingredientes se descuentan del inventario de una vez. Quedará marcado como <strong>🤝 FIADO</strong> para que lleves el saldo exacto y puedas registrar el pago cuando te cancelen.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
