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
  if (key.includes('transfer') || key.includes('nequi') || key.includes('daviplata') || key.includes('bancolombia')) {
    return {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'solar:smartphone-transfer-bold',
      iconColor: 'text-purple-600',
      badge: 'bg-purple-500',
      text: 'text-purple-800',
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
  onPrintReportX
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
              <p className="text-xs text-emerald-800 font-medium mt-1">
                Iniciado a las {new Date(activeShift.opened_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} • Base inicial: {formatCOP(initialCash)}
                {activeShift.opening_notes && ` • Nota: "${activeShift.opening_notes}"`}
              </p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          icon="solar:chart-2-bold"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total Facturado"
          value={formatCOP(totalRevenue)}
          sub={`${deliveredCount} pedidos entregados`}
        />
        <KPICard
          icon="solar:ticket-sale-bold"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Ticket Promedio"
          value={formatCOP(avgTicket)}
          sub="Por pedido finalizado"
        />
        <KPICard
          icon="solar:hand-heart-bold"
          iconBg="bg-pink-50"
          iconColor="text-pink-500"
          label="Propinas"
          value={formatCOP(totalTips)}
          sub="Servicio voluntario"
        />
      </div>

      {/* ── Desglose por Método de Pago ──────────────────────────────────────── */}
      {byPaymentMethod.length > 0 ? (
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Desglose de Ingresos por Medio de Pago
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
          <p className="text-xs font-bold text-gray-400">Sin pagos registrados en este turno</p>
        </div>
      )}

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
