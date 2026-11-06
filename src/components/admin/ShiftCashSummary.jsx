import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { formatCOP } from '@/utils/money';
import { printThermalCustomerAccountStatement } from '@/utils/thermalPrint';
import { resolveOrderItemName } from '@/utils/formatters';
import { toast } from '../Toast';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { KPICard, PaymentMethodCard, getCleanCustomerInfo, ShiftStatusBanner } from './operations/ShiftCashCards';
import ShiftReceivablesSection from './operations/ShiftReceivablesSection';
import DigitalPocketsModal from './operations/DigitalPocketsModal';
import SettleFiadoModal from './operations/SettleFiadoModal';

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
    avgTicket          = 0,
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

  const [isDigitalModalOpen, setIsDigitalModalOpen] = useState(false);
  const [settlingOrder, setSettlingOrder] = useState(null);

  const [paymentType, setPaymentType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('cortesia');
  const [selectedPocket, setSelectedPocket] = useState('efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <ShiftStatusBanner
        activeShift={activeShift}
        initialCash={initialCash}
        onOpenShift={onOpenShift}
        onPrintReportX={onPrintReportX}
        onCloseShift={onCloseShift}
      />

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

      {/* ── Cuentas por Cobrar & Fiados del Turno ────────────────────────────── */}
      <ShiftReceivablesSection
        fiadosList={fiadosList}
        fiadosByCustomer={fiadosByCustomer}
        totalFiados={totalFiados}
        onPrintCustomerStatement={handlePrintCustomerStatement}
        onSendWhatsAppStatement={handleSendWhatsAppStatement}
        onOpenSettleModal={openSettleModal}
      />

      {/* ── Alerta de Pedidos en Curso ────────────────────────────────────────── */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <p className="text-xs font-bold text-amber-900">
            Hay {activeCount} pedido{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''} en curso. Recuerda cobrarlos o entregarlos antes de hacer el arqueo final.
          </p>
        </div>
      )}

      {/* ── Modales de Detalle Digital y Cobro de Fiado ───────────────────────── */}
      <DigitalPocketsModal
        isOpen={isDigitalModalOpen}
        onClose={() => setIsDigitalModalOpen(false)}
        digitalPockets={digitalPockets}
        totalDigitalAmount={totalDigitalSales || totalTransferSales}
      />

      <SettleFiadoModal
        settlingOrder={settlingOrder}
        onClose={() => setSettlingOrder(null)}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        customAmount={customAmount}
        setCustomAmount={setCustomAmount}
        applyDiscount={applyDiscount}
        setApplyDiscount={setApplyDiscount}
        discountAmount={discountAmount}
        setDiscountAmount={setDiscountAmount}
        discountReason={discountReason}
        setDiscountReason={setDiscountReason}
        selectedPocket={selectedPocket}
        setSelectedPocket={setSelectedPocket}
        showDaviplata={showDaviplata}
        showBancolombia={showBancolombia}
        showDatafono={showDatafono}
        extraCustomPockets={extraCustomPockets}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmSettle}
      />
    </section>
  );
}
