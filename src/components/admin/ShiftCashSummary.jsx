import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';
import { parseCustomerInfo } from '../../hooks/useCRM';
import { printThermalDocument, printThermalCustomerAccountStatement } from '@/utils/thermalPrint';
import { resolveOrderItemName } from '@/utils/formatters';
import { toast } from '../Toast';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';

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

function KPICard({ icon, iconBg, iconColor, label, value, sub, highlight = false, onClick = null, actionHint = null }) {
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

// Extrae cliente limpio tanto del nombre como de notas de fiado
function getCleanCustomerInfo(order) {
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

export default function ShiftCashSummary({
  metrics = {},
  orders = [],
  activeShift = null,
  business = {},
  settings = {},
  onOpenShift,
  onCloseShift,
  onPrintReportX,
  onSettleFiado
}) {
  const {
    totalRevenue       = 0,
    totalCollected     = 0,
    totalTips          = 0,
    avgTicket          = 0,
    cancelledAmount    = 0,
    cancelledCount     = 0,
    deliveredCount     = 0,
    activeCount        = 0,
    byPaymentMethod    = [],
    initialCash        = 0,
    expectedCash       = 0,
    totalCashSales     = 0,
    totalDigitalSales  = 0,
    totalTransferSales = 0,
    fiadosList         = [],
    totalFiados        = 0,
  } = metrics;

  // Cargar medios de pago configurados en base de datos y bolsillos de Finanzas
  const { paymentMethods: brandMethods = [] } = usePaymentMethods(business?.id);

  const customFinanceAccounts = useMemo(() => {
    const fromBrand = business?.config?.financials?.accounts;
    if (Array.isArray(fromBrand) && fromBrand.length > 0) return fromBrand;
    if (business?.id && typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem(`aa_financials_${business.id}`) || '{}');
        if (Array.isArray(cached.accounts)) return cached.accounts;
      } catch {
        // ignore
      }
    }
    return [];
  }, [business]);

  const hasBrandMethod = (needle) => {
    const term = needle.toLowerCase();
    const inPaymentMethods = brandMethods.some(m => m.is_active !== false && ((m.name || '').toLowerCase().includes(term) || (m.type || '').toLowerCase().includes(term)));
    const inFinanceAccounts = customFinanceAccounts.some(a => (a.name || '').toLowerCase().includes(term));
    return inPaymentMethods || inFinanceAccounts;
  };

  const showBancolombia = hasBrandMethod('bancolombia') || orders.some(o => (o.payment_method || '').toLowerCase().includes('bancolombia'));
  const showDaviplata = hasBrandMethod('daviplata') || orders.some(o => (o.payment_method || '').toLowerCase().includes('daviplata'));
  const showDatafono = hasBrandMethod('datafono') || hasBrandMethod('bold') || hasBrandMethod('card') || hasBrandMethod('tarjeta') || orders.some(o => (o.payment_method || '').toLowerCase().includes('datafono') || (o.payment_method || '').toLowerCase().includes('bold'));

  // Bolsillos personalizados adicionales creados en Finanzas & Contabilidad
  const extraCustomPockets = useMemo(() => {
    return customFinanceAccounts.filter(acc => {
      if (acc.type === 'cash') return false;
      const lower = (acc.name || '').toLowerCase();
      if (lower.includes('nequi') || lower.includes('bre-b') || lower.includes('daviplata') || lower.includes('bancolombia') || lower.includes('datafono') || lower.includes('datáfono') || lower.includes('bold') || lower.includes('efectivo') || lower.includes('gaveta')) {
        return false;
      }
      return true;
    });
  }, [customFinanceAccounts]);

  // Estados de Modales
  const [isDigitalModalOpen, setIsDigitalModalOpen] = useState(false);
  const [settlingOrder, setSettlingOrder] = useState(null);

  // Estados del formulario de Cobro/Abono/Descuento
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'partial'
  const [customAmount, setCustomAmount] = useState('');
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('cortesia');
  const [selectedPocket, setSelectedPocket] = useState('efectivo'); // 'efectivo' | 'nequi' | 'daviplata' | 'datafono'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Desglose Dinámico de Bolsillos Digitales ─────────────────────────────
  const digitalPockets = useMemo(() => {
    const pockets = {
      nequi: {
        id: 'nequi',
        name: 'Nequi / Bre-B',
        icon: 'solar:smartphone-transfer-bold',
        color: 'purple',
        badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
        total: 0,
        orders: []
      }
    };

    if (showDaviplata) {
      pockets.daviplata = {
        id: 'daviplata',
        name: 'Daviplata',
        icon: 'solar:smartphone-transfer-bold',
        color: 'rose',
        badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
        total: 0,
        orders: []
      };
    }

    if (showBancolombia) {
      pockets.bancolombia = {
        id: 'bancolombia',
        name: 'Bancolombia QR / Transf.',
        icon: 'solar:card-bold',
        color: 'amber',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        total: 0,
        orders: []
      };
    }

    if (showDatafono) {
      pockets.datafono = {
        id: 'datafono',
        name: 'Datáfono / Bold',
        icon: 'solar:card-bold',
        color: 'blue',
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        total: 0,
        orders: []
      };
    }

    extraCustomPockets.forEach(acc => {
      pockets[acc.id] = {
        id: acc.id,
        name: acc.name,
        icon: 'solar:wallet-2-bold',
        color: 'indigo',
        badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        total: 0,
        orders: []
      };
    });

    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      if (order.payment_status !== 'paid' && Number(order.paid_amount || 0) <= 0) return;

      const pm = (order.payment_method || '').toLowerCase();
      if (pm.includes('ajuste histórico')) return;
      const amt = Number(order.paid_amount > 0 ? order.paid_amount : (order.total_amount || 0));

      let targetKey = null;
      if (pm.includes('nequi') || pm.includes('bre-b') || pm.includes('breb')) {
        targetKey = 'nequi';
      } else if (pm.includes('daviplata')) {
        targetKey = 'daviplata';
      } else if (pm.includes('bancolombia') || pm.includes('transfer')) {
        targetKey = 'bancolombia';
      } else if (pm.includes('tarjeta') || pm.includes('card') || pm.includes('datafono') || pm.includes('bold')) {
        targetKey = 'datafono';
      } else {
        const matchedCustom = extraCustomPockets.find(a => pm.includes((a.name || '').toLowerCase()) || pm === a.id.toLowerCase());
        if (matchedCustom) targetKey = matchedCustom.id;
      }

      if (targetKey && pockets[targetKey]) {
        pockets[targetKey].total += amt;
        pockets[targetKey].orders.push({
          id: order.id,
          shortId: order.id.slice(0, 4).toUpperCase(),
          customerName: getCleanCustomerInfo(order).cleanName,
          customerPhone: order.customer_phone,
          time: new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          amount: amt,
          deliveryNotes: order.delivery_notes
        });
      }
    });

    return pockets;
  }, [orders, showDaviplata, showBancolombia, showDatafono, extraCustomPockets]);

  // ─── Agrupación de Fiados por Cliente ──────────────────────────────────────
  const fiadosByCustomer = useMemo(() => {
    const groups = {};

    fiadosList.forEach(order => {
      const { cleanName, phone, address, notes } = getCleanCustomerInfo(order);
      const groupKey = (phone || cleanName).toLowerCase().trim() || order.id;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          cleanName,
          phone,
          address,
          notes,
          orders: [],
          totalDebt: 0,
          totalOriginal: 0,
          totalPaid: 0,
          totalDiscount: 0
        };
      }

      const orderTotal = Number(order.total_amount || 0);
      const paid = Number(order.paid_amount || 0);
      const pending = Math.max(0, orderTotal - paid);

      groups[groupKey].orders.push(order);
      groups[groupKey].totalDebt += pending;
      groups[groupKey].totalOriginal += orderTotal;
      groups[groupKey].totalPaid += paid;
      groups[groupKey].totalDiscount += Number(order.discount_amount || 0);
    });

    return Object.values(groups);
  }, [fiadosList]);

  // ─── Handlers de Impresión & WhatsApp ─────────────────────────────────────
  const handlePrintCustomerStatement = (customer) => {
    try {
      printThermalCustomerAccountStatement({
        customerName: customer.cleanName,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        orders: customer.orders,
        totalDebt: customer.totalDebt,
        width: settings?.thermal_paper_width || '80',
        businessName: business?.name || 'BOKU BENTO',
        business: business
      });
      toast.success(`🖨️ Estado de cuenta enviado a impresión para ${customer.cleanName}`);
    } catch (err) {
      console.error(err);
      toast.error('Error al generar impresión: ' + err.message);
    }
  };

  const handlePrintSingleOrder = (order) => {
    try {
      printThermalDocument({
        order,
        type: 'receipt',
        width: settings?.thermal_paper_width || '80',
        businessName: business?.name || 'BOKU BENTO',
        business: business
      });
      toast.success('🖨️ Recibo de pedido enviado a impresión');
    } catch (err) {
      console.error(err);
      toast.error('Error al imprimir recibo: ' + err.message);
    }
  };

  const handleSendWhatsAppStatement = (customer) => {
    if (!customer.phone) {
      toast.error('Este cliente no tiene teléfono registrado para enviar WhatsApp');
      return;
    }
    const cleanPhone = customer.phone.replace(/\D/g, '');
    const targetPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

    const ordersText = customer.orders.map(o => {
      const shortId = o.id.slice(0, 4).toUpperCase();
      const dateStr = new Date(o.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      const items = (o.order_items || []).map(i => `  • ${i.quantity}x ${resolveOrderItemName(i)}`).join('\n');
      const bal = Math.max(0, Number(o.total_amount || 0) - Number(o.paid_amount || 0));
      return `🍽️ *Pedido #${shortId}* (${dateStr}):\n${items || '  • Platos del pedido'}\n*Saldo:* $${bal.toLocaleString('es-CO')}`;
    }).join('\n\n');

    const message = `Hola ${customer.cleanName}! 👋 Te compartimos el resumen de tu cuenta en *${business?.name || 'BOKU BENTO'}*:\n\n${ordersText}\n\n━━━━━━━━━━━━━━━\n*TOTAL SALDO PENDIENTE:* $${customer.totalDebt.toLocaleString('es-CO')}\n━━━━━━━━━━━━━━━\n\nPuedes transferirnos a:\n🟣 *Nequi / Bre-B*: ${business?.phone || '321 911 1671'}\n\n¡Muchas gracias por tu preferencia y buen provecho! 🍱✨`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ─── Modal de Cobro / Abono / Descuento ───────────────────────────────────
  const openSettleModal = (order) => {
    const cleanCust = getCleanCustomerInfo(order);
    const originalTotal = Number(order.total_amount || 0);
    const prevPaid = Number(order.paid_amount || 0);
    const balance = Math.max(0, originalTotal - prevPaid);

    setSettlingOrder({
      order,
      cleanName: cleanCust.cleanName,
      originalTotal,
      prevPaid,
      balance
    });
    setPaymentType('full');
    setCustomAmount(String(balance));
    setApplyDiscount(false);
    setDiscountAmount('');
    setDiscountReason('cortesia');
    setSelectedPocket('efectivo');
  };

  const handleConfirmSettle = async () => {
    if (!settlingOrder || !onSettleFiado) return;
    setIsSubmitting(true);

    try {
      const discVal = applyDiscount ? Math.max(0, Number(discountAmount) || 0) : 0;
      const currentBalance = settlingOrder.balance;
      const effectiveBalance = Math.max(0, currentBalance - discVal);

      let paymentAmt = effectiveBalance;
      if (paymentType === 'partial') {
        const parsed = Number(customAmount) || 0;
        if (parsed <= 0) {
          toast.error('Ingresa un monto de abono válido mayor a 0');
          setIsSubmitting(false);
          return;
        }
        paymentAmt = Math.min(parsed, effectiveBalance);
      }

      await onSettleFiado(settlingOrder.order.id, selectedPocket, {
        amount: paymentAmt,
        discount: discVal,
        discountReason: applyDiscount ? discountReason : ''
      });

      setSettlingOrder(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="px-5 py-3 rounded-2xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#2f4131]/20 transition-all shrink-0 cursor-pointer"
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
          label="Bancos & Digital"
          value={formatCOP(totalDigitalSales || totalTransferSales)}
          sub={Object.values(digitalPockets).map(p => p.name).join(', ') || 'Nequi / Bre-B'}
          onClick={() => setIsDigitalModalOpen(true)}
          actionHint="Ver detalle"
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
          sub="Cobrado + Por Cobrar"
        />
        <KPICard
          icon="solar:ticket-sale-bold"
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          label="Ticket Promedio"
          value={formatCOP(avgTicket)}
          sub="Por pedido despachado"
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

      {/* ── Cuentas por Cobrar & Fiados del Turno (Agrupados por Cliente) ─────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shadow-xs">
              <Icon icon="solar:hand-money-bold" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <span>Cuentas por Cobrar & Fiados</span>
                {fiadosList.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-black">
                    {fiadosByCustomer.length} {fiadosByCustomer.length === 1 ? 'cliente' : 'clientes'} ({fiadosList.length} {fiadosList.length === 1 ? 'pedido' : 'pedidos'})
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Alimentos despachados con pago pendiente. Agrupados por cliente con historial, abonos y estado de cuenta.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Saldo Total Pendiente</span>
            <span className="text-lg md:text-xl font-black text-purple-900">{formatCOP(totalFiados)}</span>
          </div>
        </div>

        {fiadosByCustomer.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fiadosByCustomer.map(customer => (
              <div 
                key={customer.id} 
                className="p-5 rounded-3xl border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/20 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between gap-4"
              >
                {/* Header del Cliente */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                        {customer.cleanName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-gray-900 truncate">
                            {customer.cleanName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                            Fiado
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5 flex-wrap">
                          {customer.phone && (
                            <span className="flex items-center gap-1 font-bold text-gray-700">
                              <Icon icon="solar:phone-bold" className="text-xs text-purple-600" />
                              {customer.phone}
                            </span>
                          )}
                          {customer.address && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]" title={customer.address}>
                              <Icon icon="solar:map-point-bold" className="text-xs text-gray-400" />
                              <span className="truncate">{customer.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Adeudado</span>
                      <span className="text-base md:text-lg font-black text-purple-950">
                        {formatCOP(customer.totalDebt)}
                      </span>
                    </div>
                  </div>

                  {/* Desglose de Pedidos / Línea de Tiempo */}
                  <div className="mt-4 space-y-2.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Desglose de Pedidos ({customer.orders.length}):
                    </p>
                    <div className="space-y-2">
                      {customer.orders.map(order => {
                        const shortId = order.id.slice(0, 4).toUpperCase();
                        const timeStr = new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                        const orderTotal = Number(order.total_amount || 0);
                        const paid = Number(order.paid_amount || 0);
                        const discount = Number(order.discount_amount || 0);
                        const orderBalance = Math.max(0, orderTotal - paid);
                        const items = order.order_items || [];

                        return (
                          <div 
                            key={order.id}
                            className="p-3 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-purple-900">#{shortId}</span>
                                <span className="text-gray-400 font-bold">•</span>
                                <span className="text-gray-600 font-bold">{timeStr}</span>
                                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                                  {order.status === 'delivered' ? 'Entregado' : order.status}
                                </span>
                              </div>
                              <span className="font-black text-gray-900">
                                {formatCOP(orderBalance)}
                              </span>
                            </div>

                            {/* Platos de este pedido */}
                            {items.length > 0 && (
                              <div className="text-[11px] text-gray-600 pl-2 border-l-2 border-purple-200 space-y-0.5">
                                {items.map((it, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span>{it.quantity}x {resolveOrderItemName(it)}</span>
                                    <span className="font-bold text-gray-700">{formatCOP(Number(it.unit_price || 0) * Number(it.quantity || 1))}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Abonos o notas previas */}
                            <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-gray-400 font-medium">
                              {paid > 0 ? (
                                <span className="text-emerald-700 font-bold">
                                  Abonado: {formatCOP(paid)} (Saldo: {formatCOP(orderBalance)})
                                </span>
                              ) : (
                                <span>Sin abonos previos</span>
                              )}
                              {discount > 0 && (
                                <span className="text-blue-700 font-bold">
                                  Descuento: -{formatCOP(discount)}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => openSettleModal(order)}
                                className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] shadow-2xs transition-all active:scale-95 cursor-pointer ml-auto"
                              >
                                Cobrar / Abonar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Barra de Acciones del Cliente */}
                <div className="pt-3 border-t border-purple-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handlePrintCustomerStatement(customer)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Imprime la factura y estado de cuenta térmico con todo el desglose"
                    >
                      <Icon icon="solar:printer-bold" className="text-sm text-gray-600" />
                      <span>Imprimir Factura</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppStatement(customer)}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Envía el resumen detallado por WhatsApp para tranquilidad del cliente"
                    >
                      <Icon icon="solar:chat-round-dots-bold" className="text-sm text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {customer.orders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openSettleModal(customer.orders[0])}
                      className="px-3.5 py-2 rounded-xl bg-[#2f4131] hover:bg-[#243326] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Icon icon="solar:wallet-money-bold" className="text-sm text-emerald-300" />
                      <span>Registrar Pago</span>
                    </button>
                  )}
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

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: BANCOS & DIGITAL (DESGLOSE POR CUENTA Y ARQUEO)
      ════════════════════════════════════════════════════════════════════════ */}
      {isDigitalModalOpen && (
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
                    Arqueo por cuenta en este turno (Nequi, Daviplata, Bancolombia, Datáfono)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDigitalModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-6">
              {/* Resumen Total Digital */}
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">
                    Total Recaudado Digital
                  </span>
                  <span className="text-2xl font-black text-purple-950">
                    {formatCOP(totalDigitalSales || totalTransferSales)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-purple-800">
                    {Object.values(digitalPockets).reduce((acc, p) => acc + p.orders.length, 0)} pagos recibidos
                  </span>
                </div>
              </div>

              {/* Grid de las 4 Cuentas */}
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
                onClick={() => setIsDigitalModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-black transition-all cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: COBRO, ABONO PARCIAL Y DESCUENTO DE FIADO
      ════════════════════════════════════════════════════════════════════════ */}
      {settlingOrder && (
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
                onClick={() => setSettlingOrder(null)}
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
              {(() => {
                const disc = applyDiscount ? Math.max(0, Number(discountAmount) || 0) : 0;
                const newTotal = Math.max(0, settlingOrder.originalTotal - disc);
                const payAmt = paymentType === 'full' 
                  ? Math.max(0, settlingOrder.balance - disc) 
                  : Math.min(Number(customAmount) || 0, Math.max(0, settlingOrder.balance - disc));
                const remaining = Math.max(0, settlingOrder.balance - disc - payAmt);

                return (
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
                );
              })()}
            </div>

            {/* Footer de Confirmación */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSettlingOrder(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmSettle}
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
      )}
    </section>
  );
}
