import React from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';

export default function SettleFiadoModal({
  settlingOrder,
  onClose,
  paymentType,
  setPaymentType,
  customAmount,
  setCustomAmount,
  applyDiscount,
  setApplyDiscount,
  discountAmount,
  setDiscountAmount,
  discountReason,
  setDiscountReason,
  selectedPocket,
  setSelectedPocket,
  showDaviplata,
  showBancolombia,
  showDatafono,
  extraCustomPockets = [],
  isSubmitting,
  onConfirm,
}) {
  if (!settlingOrder) return null;

  const disc = applyDiscount ? Math.max(0, Number(discountAmount) || 0) : 0;
  const payAmt = paymentType === 'full'
    ? Math.max(0, settlingOrder.balance - disc)
    : Math.min(Number(customAmount) || 0, Math.max(0, settlingOrder.balance - disc));
  const remaining = Math.max(0, settlingOrder.balance - disc - payAmt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-[#2f4131] to-[#1e2a20] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl text-emerald-300">
              <Icon icon="solar:wallet-money-bold" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight">
                Registrar Cobro / Abono
              </h3>
              <p className="text-xs text-emerald-200/80 font-medium">
                {settlingOrder.cleanName} • Pedido #{settlingOrder.order.id.slice(0, 4).toUpperCase()}
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

        {/* Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-5">
          {/* Tarjeta de Saldo */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                Saldo Actual Adeudado
              </span>
              <span className="text-2xl font-black text-emerald-950">
                {formatCOP(settlingOrder.balance)}
              </span>
            </div>
            {settlingOrder.prevPaid > 0 && (
              <div className="text-right text-xs font-bold text-emerald-800">
                Abonado previo: {formatCOP(settlingOrder.prevPaid)}
              </div>
            )}
          </div>

          {/* Selector de Tipo de Pago: Total o Abono */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
              1. Monto a Registrar
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('full');
                  setCustomAmount(String(settlingOrder.balance));
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentType === 'full'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs ring-2 ring-emerald-600/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-xs font-black text-gray-900 block">Pago Total</span>
                <span className="text-sm font-black text-emerald-700 block mt-0.5">
                  {formatCOP(settlingOrder.balance)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentType('partial');
                  setCustomAmount('');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentType === 'partial'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs ring-2 ring-emerald-600/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-xs font-black text-gray-900 block">Abono Parcial</span>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">
                  Paga una parte del saldo
                </span>
              </button>
            </div>

            {paymentType === 'partial' && (
              <div className="mt-3">
                <label className="text-[11px] font-bold text-gray-600 mb-1 block">
                  ¿Cuánto abona el cliente hoy?
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Ej: 10000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-base font-black text-gray-900 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Descuento Especial / Cortesía */}
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applyDiscount}
                onChange={(e) => setApplyDiscount(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
              />
              <div>
                <span className="text-xs font-black text-gray-800 block">
                  ¿Aplicar Descuento o Cortesía?
                </span>
                <span className="text-[11px] text-gray-500 block">
                  Para amigos, familia, empleados o acuerdos especiales
                </span>
              </div>
            </label>

            {applyDiscount && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200/80 animate-in fade-in">
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-1">
                    Valor del Descuento ($)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 3000"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-emerald-600 text-sm font-black text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-1">
                    Motivo / Justificación
                  </label>
                  <select
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-emerald-600 text-xs font-bold text-gray-800 outline-none bg-white"
                  >
                    <option value="cortesia">Cortesía de la casa</option>
                    <option value="amigo">Amigo / Familia</option>
                    <option value="empleado">Consumo de Empleado</option>
                    <option value="convenio">Convenio Empresarial</option>
                    <option value="fidelidad">Cliente Frecuente</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Selector de Bolsillo de Destino */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
              2. ¿A qué bolsillo ingresa el dinero?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPocket('efectivo')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedPocket === 'efectivo'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon icon="solar:wallet-money-bold" className="text-base" />
                <span>Efectivo (Gaveta)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPocket('nequi')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedPocket === 'nequi'
                    ? 'bg-[#200020] text-pink-300 border-[#200020] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon icon="solar:smartphone-bold" className="text-base text-pink-400" />
                <span>Nequi / Bre-B</span>
              </button>

              {showDaviplata && (
                <button
                  type="button"
                  onClick={() => setSelectedPocket('daviplata')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    selectedPocket === 'daviplata'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon icon="solar:smartphone-bold" className="text-base" />
                  <span>Daviplata</span>
                </button>
              )}

              {showBancolombia && (
                <button
                  type="button"
                  onClick={() => setSelectedPocket('bancolombia')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    selectedPocket === 'bancolombia'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon icon="solar:card-bold" className="text-base" />
                  <span>Bancolombia QR</span>
                </button>
              )}

              {showDatafono && (
                <button
                  type="button"
                  onClick={() => setSelectedPocket('datafono')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    selectedPocket === 'datafono'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon icon="solar:card-bold" className="text-base" />
                  <span>Datáfono / Bold</span>
                </button>
              )}

              {extraCustomPockets.map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedPocket(acc.name)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    selectedPocket === acc.name
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon icon="solar:wallet-2-bold" className="text-base" />
                  <span className="truncate">{acc.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cálculo en Vivo */}
          <div className="p-3.5 rounded-2xl bg-gray-100 border border-gray-200 text-xs space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Saldo inicial adeudado:</span>
              <span className="font-bold">{formatCOP(settlingOrder.balance)}</span>
            </div>
            {disc > 0 && (
              <div className="flex justify-between text-blue-700 font-bold">
                <span>Descuento aplicado:</span>
                <span>-{formatCOP(disc)}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-800 font-black">
              <span>Pago a registrar ahora:</span>
              <span>{formatCOP(payAmt)}</span>
            </div>
            <div className="flex justify-between text-purple-900 font-black pt-1 border-t border-gray-200">
              <span>Saldo restante tras este pago:</span>
              <span>{remaining === 0 ? '✅ $0 (PAGADO TOTAL)' : formatCOP(remaining)}</span>
            </div>
          </div>
        </div>

        {/* Footer de Confirmación */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#243326] text-white font-black text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Icon icon="solar:restart-bold" className="animate-spin text-sm" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Icon icon="solar:check-circle-bold" className="text-emerald-300 text-sm" />
                <span>Confirmar Registro</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
