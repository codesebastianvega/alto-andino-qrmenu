import React from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';
import { parseCustomerInfo } from '../../../hooks/useCRM';

export function getMethodStyle(name = '', type = '') {
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
  if (key.includes('daviplata')) {
    return {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: 'solar:smartphone-transfer-bold',
      iconColor: 'text-rose-600',
      badge: 'bg-rose-500',
      text: 'text-rose-800',
    };
  }
  if (key.includes('bancolombia')) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'solar:card-bold',
      iconColor: 'text-amber-700',
      badge: 'bg-amber-600',
      text: 'text-amber-900',
    };
  }
  if (key.includes('tarjeta') || key.includes('card') || key.includes('débito') || key.includes('crédito') || key.includes('datafono') || key.includes('bold')) {
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'solar:card-bold',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-500',
      text: 'text-blue-800',
    };
  }
  if (key.includes('transfer') || key.includes('nequi') || key.includes('bre-b') || key.includes('breb')) {
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

export function KPICard({ icon, iconBg, iconColor, label, value, sub, highlight = false, onClick = null, actionHint = null }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 md:p-5 flex flex-col justify-between min-h-[105px] transition-all ${
        onClick ? 'cursor-pointer hover:border-purple-300 hover:shadow-md active:scale-[0.99]' : ''
      } ${
        highlight
          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 shadow-xs'
          : 'bg-white border-gray-100 shadow-2xs'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg} shrink-0`}>
          <Icon icon={icon} className={`text-base ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className={`text-xl md:text-2xl font-black tracking-tight ${highlight ? 'text-emerald-950' : 'text-gray-900'}`}>{value}</p>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          {sub && <p className={`text-[10px] font-bold ${highlight ? 'text-emerald-700' : 'text-gray-400'}`}>{sub}</p>}
          {actionHint && (
            <span className="text-[10px] font-black text-purple-600 flex items-center gap-0.5 ml-auto">
              {actionHint}
              <Icon icon="solar:alt-arrow-right-bold" className="text-xs" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PaymentMethodCard({ method }) {
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

export function getCleanCustomerInfo(order) {
  let rawName = order.customer_name || '';
  let address = order.delivery_address || '';
  let notes = order.delivery_notes || '';

  if (!rawName || rawName.toLowerCase().includes('cliente mostrador') || rawName.toLowerCase().includes('cliente sin nombre')) {
    const match = notes.match(/cuenta por cobrar:\s*([^\[\]\n\r]+)/i);
    if (match && match[1]) {
      rawName = match[1].trim();
    }
  }

  const parsed = parseCustomerInfo(rawName, address, notes);
  const cleanName = parsed.cleanName !== 'Sin nombre' ? parsed.cleanName : (rawName || 'Cliente sin nombre');

  return {
    cleanName,
    phone: order.customer_phone || '',
    address: parsed.address || address,
    notes: parsed.notes || notes
  };
}

export function ShiftStatusBanner({
  activeShift,
  initialCash = 0,
  onOpenShift,
  onPrintReportX,
  onCloseShift,
}) {
  if (!activeShift) {
    return (
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
          className="px-5 py-3 rounded-2xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#2f4131]/20 transition-all shrink-0 cursor-pointer"
        >
          <Icon icon="solar:cash-out-bold-duotone" className="text-base text-emerald-300" />
          Abrir Turno de Caja
        </button>
      </div>
    );
  }

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
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        <button
          onClick={onPrintReportX}
          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-xs font-black border border-gray-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          title="Corte de caja preliminar sin cerrar"
        >
          <Icon icon="solar:printer-bold" className="text-sm text-gray-600" />
          Reporte X (Corte Parcial)
        </button>

        <button
          onClick={onCloseShift}
          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Icon icon="solar:safe-square-bold" className="text-sm text-amber-400" />
          Cerrar Turno & Arqueo
        </button>
      </div>
    </div>
  );
}
