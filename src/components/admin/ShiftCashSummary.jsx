import React from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';

function getMethodStyle(name = '', type = '') {
  const key = (name + type).toLowerCase();
  if (key.includes('efectivo') || key.includes('cash')) {
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'solar:wallet-money-bold',
      iconColor: 'text-emerald-600',
      badge: 'bg-emerald-500',
      text: 'text-emerald-800',
    };
  }
  if (key.includes('tarjeta') || key.includes('card') || key.includes('débito') || key.includes('crédito') || key.includes('datafono')) {
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'solar:card-bold',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-500',
      text: 'text-blue-800',
    };
  }
  if (key.includes('transfer') || key.includes('nequi')) {
    return {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'solar:smartphone-transfer-bold',
      iconColor: 'text-purple-600',
      badge: 'bg-purple-500',
      text: 'text-purple-800',
    };
  }
  if (key.includes('fiado')) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'solar:hand-stars-bold',
      iconColor: 'text-amber-600',
      badge: 'bg-amber-500',
      text: 'text-amber-800',
    };
  }
  return {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'solar:dollar-minimalistic-bold',
    iconColor: 'text-gray-500',
    badge: 'bg-gray-400',
    text: 'text-gray-700',
  };
}

function KPICard({ icon, iconBg, iconColor, label, value, sub, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-4 md:p-5 flex flex-col justify-between min-h-[105px] transition-all ${
      highlight 
        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 shadow-xs' 
        : 'bg-white border-gray-100 shadow-2xs'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg} shrink-0`}>
          <Icon icon={icon} className={`text-base ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className={`text-xl md:text-2xl font-black tracking-tight ${highlight ? 'text-emerald-950' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className={`text-[10px] font-bold mt-0.5 ${highlight ? 'text-emerald-700' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    </div>
  );
}

function PaymentMethodCard({ method }) {
  const style = getMethodStyle(method.name, method.type);
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3.5 ${style.bg} ${style.border}`}>
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0">
        <Icon icon={style.icon} className={`text-xl ${style.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-black uppercase tracking-wider ${style.text}`}>{method.name}</p>
        <p className="text-base font-black text-gray-900">{formatCOP(method.total)}</p>
      </div>
      <span className={`text-[10px] font-black text-white px-2 py-1 rounded-lg shrink-0 ${style.badge}`}>
        {method.count} {method.count === 1 ? 'pago' : 'pagos'}
      </span>
    </div>
  );
}

export default function ShiftCashSummary({
  metrics = {},
  orders = [],
  activeShift = null,
  onOpenShift,
  onCloseShift,
  onPrintReportX,
  onSettleFiado
}) {
  const {
    totalRevenue    = 0,
    totalTips       = 0,
    avgTicket       = 0,
    cancelledAmount = 0,
    cancelledCount  = 0,
    deliveredCount  = 0,
    activeCount     = 0,
    byPaymentMethod = [],
    initialCash     = 0,
    expectedCash    = 0,
    totalCashSales  = 0,
    totalTransferSales = 0,
    fiadosList      = [],
    totalFiados     = 0,
  } = metrics;

  return (
    <section className="space-y-6">
      {/* ── Banner de Estado de Turno ────────────────────────────────────────── */}
      {!activeShift ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl text-amber-700 shrink-0 shadow-xs">
              <Icon icon="solar:lock-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wide text-amber-900">
                  Caja Cerrada en esta Sede
                </h3>
              </div>
              <p className="text-xs text-amber-800/80 font-medium mt-0.5 max-w-xl">
                Abre el turno operativo del día para registrar la base en efectivo y llevar la trazabilidad exacta de gaveta sin descuadres.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenShift}
            className="px-5 py-3 rounded-2xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#2f4131]/20 transition-all shrink-0"
          >
            <Icon icon="solar:cash-out-bold-duotone" className="text-base text-emerald-300" />
            Abrir Turno de Caja
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 rounded-3xl p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl text-emerald-800 shrink-0 shadow-xs">
              <Icon icon="solar:shop-2-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Turno #{activeShift.shift_number || 1} en curso
                </span>
                <span className="text-xs text-emerald-950 font-bold">
                  Responsable: {activeShift.opened_by}
                </span>
              </div>
              {(() => {
                const openedDate = new Date(activeShift.opened_at);
                const now = new Date();
                const isSameDay = (
                  openedDate.getFullYear() === now.getFullYear() &&
                  openedDate.getMonth() === now.getMonth() &&
                  openedDate.getDate() === now.getDate()
                );
                const formattedTime = openedDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                const formattedDate = openedDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: openedDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });

                return (
                  <div>
                    <p className="text-xs text-emerald-800 font-medium mt-1">
                      Iniciado {isSameDay ? `hoy a las ${formattedTime}` : `el ${formattedDate} a las ${formattedTime}`} • Base inicial: {formatCOP(initialCash)}
                      {activeShift.opening_notes && ` • Nota: "${activeShift.opening_notes}"`}
                    </p>
                    {!isSameDay && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 text-amber-900 border border-amber-300/80 text-[11px] font-bold">
                        <Icon icon="solar:danger-triangle-bold" className="text-amber-600 text-sm shrink-0" />
                        <span>Turno abierto de fecha anterior ({formattedDate}). Cierra este turno para realizar arqueo y abrir el de hoy.</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={onPrintReportX}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-xs font-black border border-gray-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              title="Corte de caja preliminar sin cerrar"
            >
              <Icon icon="solar:printer-bold" className="text-sm text-gray-600" />
              Reporte X (Corte Parcial)
            </button>

            <button
              onClick={onCloseShift}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Icon icon="solar:safe-square-bold" className="text-sm text-amber-400" />
              Cerrar Turno & Arqueo
            </button>
          </div>
        </div>
      )}

      {/* ── KPIs Financieros Principales ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KPICard
          icon="solar:wallet-money-bold"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          label="Efectivo en Gaveta"
          value={formatCOP(expectedCash)}
          sub={`Base (${formatCOP(initialCash)}) + Ventas (${formatCOP(totalCashSales)})`}
          highlight={true}
        />
        <KPICard
          icon="solar:smartphone-bold"
          iconBg="bg-purple-100"
          iconColor="text-purple-700"
          label="Nequi / Bre-B"
          value={formatCOP(totalTransferSales)}
          sub="Dinero en banco"
        />
        <KPICard
          icon="solar:hand-money-bold"
          iconBg="bg-amber-100"
          iconColor="text-amber-800"
          label="Cuentas por Cobrar"
          value={formatCOP(totalFiados)}
          sub={`${fiadosList.length} ${fiadosList.length === 1 ? 'fiado pendiente' : 'fiados pendientes'}`}
          highlight={fiadosList.length > 0}
        />
        <KPICard
          icon="solar:chart-2-bold"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total Facturado"
          value={formatCOP(totalRevenue)}
          sub={`${deliveredCount} pedidos entregados`}
        />
        <KPICard
          icon="solar:ticket-sale-bold"
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          label="Ticket Promedio"
          value={formatCOP(avgTicket)}
          sub="Por pedido finalizado"
        />
      </div>

      {/* ── Desglose por Método de Pago ──────────────────────────────────────── */}
      {byPaymentMethod.length > 0 ? (
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Desglose de Ingresos Recibidos en este Turno
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {byPaymentMethod.map(method => (
              <PaymentMethodCard key={method.name} method={method} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400 bg-gray-50/50 rounded-2xl border border-gray-100">
          <Icon icon="solar:bill-cross-bold" className="text-3xl mb-1 text-gray-300" />
          <p className="text-xs font-bold text-gray-400">Sin pagos confirmados todavía en este turno</p>
        </div>
      )}

      {/* ── Cuentas por Cobrar & Fiados del Turno ────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
              <Icon icon="solar:hand-money-bold" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <span>Cuentas por Cobrar & Fiados</span>
                {fiadosList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black">
                    {fiadosList.length}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Alimentos despachados con pago pendiente. No descuadran el efectivo físico de gaveta.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Saldo Pendiente de Cobro</span>
            <span className="text-base md:text-lg font-black text-purple-900">{formatCOP(totalFiados)}</span>
          </div>
        </div>

        {fiadosList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fiadosList.map(order => (
              <div 
                key={order.id} 
                className="p-4 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/40 via-white to-purple-50/20 flex flex-col justify-between gap-3 shadow-2xs hover:border-purple-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5 truncate">
                      <Icon icon="solar:user-bold" className="text-purple-600 text-sm shrink-0" />
                      <span className="truncate">{order.customer_name || 'Cliente sin nombre'}</span>
                    </span>
                    <span className="text-sm font-black text-purple-900 shrink-0">
                      {formatCOP(order.total_amount || 0)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 font-bold flex-wrap">
                    <span>#{order.id.slice(0, 4).toUpperCase()}</span>
                    <span>•</span>
                    <span>{new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="uppercase text-amber-700 font-black">
                      {order.status === 'delivered' ? 'Entregado' : order.status}
                    </span>
                  </div>

                  {order.delivery_notes && (
                    <p className="mt-2 text-[11px] font-medium text-purple-900 bg-purple-100/60 p-2 rounded-xl border border-purple-200/60 line-clamp-2">
                      {order.delivery_notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-purple-100 flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0">Cobrar:</span>
                  <button
                    type="button"
                    onClick={() => onSettleFiado && onSettleFiado(order.id, 'efectivo')}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Registrar pago en efectivo (se suma al esperado de gaveta)"
                  >
                    <Icon icon="solar:wallet-money-bold" className="text-xs" />
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => onSettleFiado && onSettleFiado(order.id, 'nequi')}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-[#200020] hover:bg-[#350035] text-white text-[11px] font-black flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Registrar pago recibido en Nequi / Bre-B"
                  >
                    <Icon icon="solar:smartphone-bold" className="text-xs text-pink-400" />
                    Nequi
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-emerald-800 text-xs font-bold">
            <Icon icon="solar:check-circle-bold" className="text-xl text-emerald-600 shrink-0" />
            <span>Todo al día. No hay cuentas por cobrar ni fiados pendientes en este turno.</span>
          </div>
        )}
      </div>

      {/* ── Alerta de Pedidos en Curso ────────────────────────────────────────── */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <p className="text-xs font-bold text-amber-900">
            Hay {activeCount} pedido{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''} en curso. Recuerda cobrarlos o entregarlos antes de hacer el arqueo final.
          </p>
        </div>
      )}
    </section>
  );
}
