import { formatCOP } from '@/utils/money';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const labelFulfillment = (value) => ({
  dine_in: 'Consumo en mesa', takeaway: 'Para recoger', delivery: 'Domicilio', scheduled: 'Programado'
}[value] || value || 'Pedido');

const labelPaymentStatus = (value) => ({ paid: 'Pagado', partial: 'Pago parcial', pending: 'Pendiente' }[value] || value || 'Pendiente');

const modifierText = (modifiers) => Object.entries(modifiers || {})
  .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
  .join(' · ');

const row = (label, value, className = '') => value !== undefined && value !== null && value !== ''
  ? `<div class="pair ${className}"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`
  : '';

export function printThermalDocument({ order, type = 'receipt', width = '80', businessName = 'Aluna', business = {} }) {
  const pageWidth = width === '80' ? '80mm' : '50mm';
  const compact = width !== '80';
  const items = order.order_items || [];
  const isKitchen = type === 'kitchen';
  const title = isKitchen ? 'COMANDA DE COCINA' : 'RECIBO / CUENTA';
  const shortId = order.id?.slice?.(0, 8)?.toUpperCase() || order.client_order_id || '';
  const itemsSubtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
  const serviceFee = Number(order.service_fee || 0);
  const discount = Number(order.discount_amount || 0);
  const total = Number(order.total_amount || 0);
  const otherCharges = Math.max(0, total + discount - itemsSubtotal - serviceFee);
  const paid = Number(order.paid_amount || 0);
  const balance = Math.max(0, total - paid);
  const payments = order.order_payments || [];
  const paymentNames = payments.map((payment) => payment.payment_method_name).filter(Boolean).join(' + ') || order.payment_method;
  const received = payments.reduce((sum, payment) => sum + Number(payment.received_amount || 0), 0);
  const change = payments.reduce((sum, payment) => sum + Number(payment.change_amount || 0), 0);
  const businessLabel = business.name || businessName;
  const taxId = business.nit || business.tax_id || business.document_number;
  const locationLabel = order.locations?.name;

  const itemRows = items.map((item) => {
    const name = item.products?.name || item.name || 'Producto';
    const quantity = Number(item.quantity || 0);
    const price = Number(item.unit_price || 0);
    return `<section class="product">
      <div class="item"><strong>${quantity} × ${escapeHtml(name)}</strong>${isKitchen ? '' : `<span>${formatCOP(quantity * price)}</span>`}</div>
      ${isKitchen ? '' : `<div class="unit">${formatCOP(price)} c/u</div>`}
      ${modifierText(item.modifiers) ? `<div class="detail">+ ${escapeHtml(modifierText(item.modifiers))}</div>` : ''}
      ${item.notes ? `<div class="note">NOTA: ${escapeHtml(item.notes)}</div>` : ''}
    </section>`;
  }).join('');

  const businessHeader = `<header class="center">
    <div class="brand">${escapeHtml(businessLabel)}</div>
    ${taxId ? `<div>NIT ${escapeHtml(taxId)}</div>` : ''}
    ${locationLabel ? `<div>${escapeHtml(locationLabel)}</div>` : ''}
    ${business.address ? `<div>${escapeHtml(business.address)}</div>` : ''}
    ${business.phone ? `<div>Tel. ${escapeHtml(business.phone)}</div>` : ''}
    <div class="document-title">${title}</div>
  </header>`;

  const orderInfo = `<section class="meta">
    ${row('Pedido', shortId, 'strong')}
    ${row('Fecha', new Date(order.created_at || Date.now()).toLocaleString('es-CO'))}
    ${row('Tipo', labelFulfillment(order.fulfillment_type))}
    ${row('Mesa', order.restaurant_tables?.table_number)}
    ${row('Cliente', order.customer_name)}
    ${row('Teléfono', order.customer_phone)}
    ${row('Programado', order.scheduled_time ? new Date(order.scheduled_time).toLocaleString('es-CO') : '')}
  </section>`;

  const totals = isKitchen ? '' : `<section class="totals">
    ${row('Subtotal', formatCOP(itemsSubtotal))}
    ${row('Servicio / propina', formatCOP(serviceFee))}
    ${row('Empaque / otros', formatCOP(otherCharges))}
    ${row('Descuento', discount ? `-${formatCOP(discount)}` : '')}
    ${row('TOTAL', formatCOP(total), 'grand-total')}
    ${row('Estado de pago', labelPaymentStatus(order.payment_status))}
    ${row('Medio de pago', paymentNames)}
    ${row('Pagado', paid ? formatCOP(paid) : '')}
    ${row('Recibido', received ? formatCOP(received) : '')}
    ${row('Cambio', change ? formatCOP(change) : '')}
    ${row('Saldo', balance ? formatCOP(balance) : '')}
  </section>`;

  const footer = isKitchen
    ? `<footer class="center kitchen-footer">${order.notes ? `<div class="note general-note">NOTA GENERAL: ${escapeHtml(order.notes)}</div>` : ''}<strong>Verificar modificadores y observaciones</strong></footer>`
    : `<footer class="center"><div>Gracias por tu compra</div><div class="legal">Documento interno. No reemplaza la factura electrónica de venta.</div></footer>`;

  const target = window.open('', '_blank', 'width=480,height=720');
  if (!target) throw new Error('El navegador bloqueó la ventana de impresión');
  target.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
    @page{size:${pageWidth} auto;margin:0}
    *{box-sizing:border-box}
    html,body{width:${pageWidth};max-width:${pageWidth};margin:0;padding:0;background:#fff;color:#000}
    body{padding:${compact ? '2.5mm' : '4mm'};font-family:ui-monospace,Consolas,"Courier New",monospace;font-size:${compact ? '9.5px' : '11.5px'};line-height:1.3}
    .center{text-align:center}.brand{font-size:1.35em;font-weight:900;text-transform:uppercase}.document-title{font-weight:900;margin-top:5px;letter-spacing:.08em}
    .meta,.totals,footer{border-top:1px dashed #000;margin-top:8px;padding-top:7px}.pair,.item{display:flex;justify-content:space-between;align-items:flex-start;gap:7px;margin:3px 0}.pair span:last-child,.item span{text-align:right}.strong{font-weight:900}
    .product{border-top:1px dotted #777;padding:6px 0}.product:first-child{border-top:0}.unit,.detail{padding-left:10px;font-size:.9em}.note{margin:4px 0;padding:4px;border:1px solid #000;font-weight:900}.general-note{font-size:1.1em}
    .grand-total{border-top:2px solid #000;border-bottom:2px solid #000;padding:6px 0;margin:6px 0;font-size:1.25em;font-weight:900}.legal{font-size:.85em;margin-top:7px}.kitchen-footer{font-size:1.05em}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>${businessHeader}${orderInfo}<main>${itemRows}</main>${totals}${footer}<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script></body></html>`);
  target.document.close();
}


export function printThermalShiftReport({ shift, metrics = {}, type = 'Z', width = '80', businessName = 'Aluna', business = {} }) {
  const pageWidth = width === '80' ? '80mm' : '50mm';
  const compact = width !== '80';
  const isZ = type === 'Z';
  const title = isZ ? 'CIERRE DE CAJA — REPORTE Z' : 'CORTE PARCIAL — REPORTE X';
  const shiftNumber = shift?.shift_number || 1;
  const businessLabel = business.name || businessName;
  const taxId = business.nit || business.tax_id || business.document_number;
  const locationLabel = shift?.locations?.name || business.address || '';

  const initialCash = Number(shift?.initial_cash || 0);
  const cashSales = Number(metrics.totalCashSales || 0);
  const cardSales = Number(metrics.totalCardSales || 0);
  const transferSales = Number(metrics.totalTransferSales || 0);
  const otherSales = Number(metrics.totalOtherSales || 0);
  const totalSales = Number(metrics.totalRevenue || 0);
  const totalTips = Number(metrics.totalTips || 0);
  const expectedCash = Number(shift?.expected_cash ?? (initialCash + cashSales));
  const actualCash = shift?.actual_cash != null ? Number(shift.actual_cash) : null;
  const cashDiff = shift?.cash_difference != null ? Number(shift.cash_difference) : null;

  const openedAtStr = shift?.opened_at ? new Date(shift.opened_at).toLocaleString('es-CO') : '-';
  const closedAtStr = isZ ? (shift?.closed_at ? new Date(shift.closed_at).toLocaleString('es-CO') : new Date().toLocaleString('es-CO')) : 'EN CURSO';

  let diffText = 'N/A';
  if (cashDiff !== null) {
    if (cashDiff === 0) diffText = '$0 (CUADRADA)';
    else if (cashDiff > 0) diffText = `+${formatCOP(cashDiff)} (SOBRANTE)`;
    else diffText = `${formatCOP(cashDiff)} (FALTANTE)`;
  }

  const businessHeader = `<header class="center">
    <div class="brand">${escapeHtml(businessLabel)}</div>
    ${taxId ? `<div>NIT ${escapeHtml(taxId)}</div>` : ''}
    ${locationLabel ? `<div>${escapeHtml(locationLabel)}</div>` : ''}
    <div class="document-title">${title}</div>
  </header>`;

  const metaSection = `<section class="meta">
    ${row('Turno #', String(shiftNumber), 'strong')}
    ${row('Apertura', openedAtStr)}
    ${row('Cierre', closedAtStr)}
    ${row('Cajero(a)', shift?.opened_by || 'Caja')}
    ${shift?.closed_by && isZ ? row('Cerrado por', shift.closed_by) : ''}
  </section>`;

  const cashAuditSection = `<section class="totals">
    <div class="pair strong" style="border-bottom: 1px dotted #000; padding-bottom: 3px; margin-bottom: 5px;">
      <span>ARQUEO DE EFECTIVO</span><span></span>
    </div>
    ${row('Base Inicial (+)', formatCOP(initialCash))}
    ${row('Ventas Efectivo (+)', formatCOP(cashSales))}
    ${row('Esperado en Gaveta (=)', formatCOP(expectedCash), 'strong')}
    ${actualCash !== null ? row('Efectivo Real Contado', formatCOP(actualCash), 'strong') : ''}
    ${diffText !== 'N/A' ? row('Diferencia / Cuadre', diffText, 'strong') : ''}
  </section>`;

  const paymentsSection = `<section class="totals">
    <div class="pair strong" style="border-bottom: 1px dotted #000; padding-bottom: 3px; margin-bottom: 5px;">
      <span>VENTAS POR MEDIO</span><span></span>
    </div>
    ${row('Efectivo', formatCOP(cashSales))}
    ${row('Tarjetas / POS', formatCOP(cardSales))}
    ${row('Nequi / Transferencia', formatCOP(transferSales))}
    ${otherSales > 0 ? row('Otros Medios', formatCOP(otherSales)) : ''}
  </section>`;

  const totalsSection = `<section class="totals">
    ${row('TOTAL FACTURADO', formatCOP(totalSales), 'grand-total')}
    ${row('Propinas recaudadas', formatCOP(totalTips))}
    ${row('Pedidos finalizados', String(metrics.deliveredCount || 0))}
    ${row('Pedidos cancelados', String(metrics.cancelledCount || 0))}
  </section>`;

  const footer = `<footer class="center">
    ${isZ ? `
      <div style="margin-top: 18px; text-align: left;">
        <div style="margin-bottom: 22px;">Firma Cajero(a): ___________________</div>
        <div>Firma Administrador(a): ______________</div>
      </div>
    ` : '<div>Documento informativo no definitivo.</div>'}
    <div class="legal" style="margin-top: 10px;">Aluna QR Menu — Sistema POS</div>
  </footer>`;

  const target = window.open('', '_blank', 'width=480,height=720');
  if (!target) throw new Error('El navegador bloqueó la ventana de impresión');
  target.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
    @page{size:${pageWidth} auto;margin:0}
    *{box-sizing:border-box}
    html,body{width:${pageWidth};max-width:${pageWidth};margin:0;padding:0;background:#fff;color:#000}
    body{padding:${compact ? '2.5mm' : '4mm'};font-family:ui-monospace,Consolas,"Courier New",monospace;font-size:${compact ? '9.5px' : '11.5px'};line-height:1.3}
    .center{text-align:center}.brand{font-size:1.35em;font-weight:900;text-transform:uppercase}.document-title{font-weight:900;margin-top:5px;letter-spacing:.08em}
    .meta,.totals,footer{border-top:1px dashed #000;margin-top:8px;padding-top:7px}.pair{display:flex;justify-content:space-between;align-items:flex-start;gap:7px;margin:3px 0}.pair span:last-child{text-align:right}.strong{font-weight:900}
    .grand-total{border-top:2px solid #000;border-bottom:2px solid #000;padding:6px 0;margin:6px 0;font-size:1.25em;font-weight:900}.legal{font-size:.85em;margin-top:7px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>${businessHeader}${metaSection}${cashAuditSection}${paymentsSection}${totalsSection}${footer}<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();};</script></body></html>`);
  target.document.close();
}
