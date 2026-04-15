import React, { useState } from 'react';
import { Icon } from '@iconify-icon/react';
import { toast } from '../Toast';

/**
 * Colores por tipo/nombre de método de pago.
 * Se usa el nombre del método o el tipo guardado en payment_methods.type
 */
function getMethodStyle(name = '', type = '') {
  const key = (name + type).toLowerCase();
  if (key.includes('efectivo') || key.includes('cash')) {
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'heroicons:banknotes',
      iconColor: 'text-emerald-600',
      badge: 'bg-emerald-500',
      text: 'text-emerald-700',
    };
  }
  if (key.includes('tarjeta') || key.includes('card') || key.includes('débito') || key.includes('crédito')) {
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'heroicons:credit-card',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-500',
      text: 'text-blue-700',
    };
  }
  if (key.includes('transfer') || key.includes('nequi') || key.includes('daviplata') || key.includes('bancolombia')) {
    return {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'heroicons:arrow-right-circle',
      iconColor: 'text-purple-600',
      badge: 'bg-purple-500',
      text: 'text-purple-700',
    };
  }
  // Default
  return {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'heroicons:currency-dollar',
    iconColor: 'text-gray-500',
    badge: 'bg-gray-400',
    text: 'text-gray-600',
  };
}

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val ?? 0);

// ──────────────────────────────────────────────────────────────────────────────

function KPICard({ icon, iconBg, iconColor, label, value, sub, pulse = false }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between min-h-[110px] ${pulse ? 'ring-2 ring-green-300 ring-offset-1' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon icon={icon} className={`text-lg ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
        {sub && <p className="text-[10px] font-bold text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PaymentMethodCard({ method }) {
  const style = getMethodStyle(method.name, method.type);
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 ${style.bg} ${style.border}`}>
      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Icon icon={style.icon} className={`text-xl ${style.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-black uppercase tracking-wider ${style.text}`}>{method.name}</p>
        <p className="text-lg font-black text-gray-900">{formatCOP(method.total)}</p>
      </div>
      <span className={`text-[10px] font-black text-white px-2 py-1 rounded-lg ${style.badge}`}>
        {method.count} {method.count === 1 ? 'pago' : 'pagos'}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export default function ShiftCashSummary({ metrics, orders = [], onCloseShift }) {
  const [exporting, setExporting] = useState(false);

  const {
    totalRevenue    = 0,
    totalTips       = 0,
    avgTicket       = 0,
    cancelledAmount = 0,
    cancelledCount  = 0,
    deliveredCount  = 0,
    activeCount     = 0,
    byPaymentMethod = [],
  } = metrics || {};

  const handleCloseShift = async () => {
    setExporting(true);
    try {
      // ── Construir CSV ──────────────────────────────────────────────────────
      const delivered = orders.filter(o => o.status === 'delivered');
      const headers = ['#Pedido', 'Cliente', 'Tipo', 'Total', 'Propina', 'Estado', 'Hora'];
      const rows = delivered.map(o => [
        o.id.slice(0, 6).toUpperCase(),
        o.customer_name || 'Sin nombre',
        o.fulfillment_type === 'dine_in' ? 'Mesa' : o.fulfillment_type === 'takeaway' ? 'Para Llevar' : 'Domicilio',
        o.total_amount,
        o.service_fee || 0,
        o.status,
        new Date(o.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      ]);

      const csvContent = [
        `# Cierre de Turno — ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`,
        `# Total: ${formatCOP(totalRevenue)} | Pedidos: ${deliveredCount} | Ticket Prom: ${formatCOP(avgTicket)}`,
        '',
        headers.join(','),
        ...rows.map(r => r.join(',')),
        '',
        `TOTAL,,,${totalRevenue},${totalTips},,`,
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cierre_turno_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast('Turno exportado correctamente ✅', { icon: '📊' });
      onCloseShift?.();
    } catch (err) {
      console.error('[ShiftCashSummary] export error:', err);
      toast.error('Error al exportar el turno');
    } finally {
      setExporting(false);
    }
  };

  const noData = deliveredCount === 0 && activeCount === 0;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <Icon icon="heroicons:banknotes" className="text-emerald-500 text-xl" />
            Caja del Turno
          </h2>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={handleCloseShift}
          disabled={exporting || noData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Icon icon="heroicons:arrow-down-tray" className="text-sm" />
          )}
          Cerrar Turno
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          icon="heroicons:banknotes"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Total Cobrado"
          value={formatCOP(totalRevenue)}
          sub={`${deliveredCount} pedidos entregados`}
          pulse={totalRevenue > 0}
        />
        <KPICard
          icon="heroicons:receipt-percent"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Ticket Promedio"
          value={formatCOP(avgTicket)}
          sub="Por pedido finalizado"
        />
        <KPICard
          icon="heroicons:heart"
          iconBg="bg-pink-50"
          iconColor="text-pink-500"
          label="Propinas"
          value={formatCOP(totalTips)}
          sub="Servicio voluntario"
        />
        <KPICard
          icon="heroicons:x-circle"
          iconBg="bg-red-50"
          iconColor="text-red-500"
          label="Cancelaciones"
          value={formatCOP(cancelledAmount)}
          sub={`${cancelledCount} pedido${cancelledCount !== 1 ? 's' : ''} cancelado${cancelledCount !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Desglose por método de pago */}
      {byPaymentMethod.length > 0 ? (
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Desglose por Método de Pago
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {byPaymentMethod.map(method => (
              <PaymentMethodCard key={method.name} method={method} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
          <Icon icon="heroicons:banknotes" className="text-4xl mb-2" />
          <p className="text-xs font-bold">Sin pagos registrados hoy</p>
        </div>
      )}

      {/* Indicador de pedidos activos */}
      {activeCount > 0 && (
        <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs font-bold text-amber-700">
            {activeCount} pedido{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''} en curso
          </p>
        </div>
      )}
    </section>
  );
}
