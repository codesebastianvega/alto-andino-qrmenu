import { supabase } from '@/config/supabase';
import { toast } from '@/components/Toast';

export function useOrderDetailActions({
  selectedOrder,
  setSelectedOrder,
  fetchOrders,
  activeBrand,
  applyDiscount,
  updateOrderStatus,
  selectedPaymentMethod
}) {
  const handleAssignFiado = async () => {
    if (!selectedOrder) return;
    const debtor = window.prompt(
      'Nombre del deudor / persona a quien se fía:',
      selectedOrder.customer_name || 'Cliente'
    );
    if (debtor === null) return;
    const cleanName = debtor.trim() || selectedOrder.customer_name || 'Cliente';
    const currentNotes = selectedOrder.delivery_notes || '';
    const updatedNotes = currentNotes
      ? `${currentNotes} | [🤝 FIADO - Cuenta por cobrar: ${cleanName}]`
      : `[🤝 FIADO - Cuenta por cobrar: ${cleanName}]`;

    const { error } = await supabase
      .from('orders')
      .update({
        payment_method: 'fiado',
        payment_status: 'pending',
        customer_name: cleanName,
        delivery_notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedOrder.id);

    if (error) {
      toast.error('Error al asignar fiado: ' + error.message);
    } else {
      toast.success(`🤝 Pedido asignado como fiado a ${cleanName}`);
      setSelectedOrder?.((prev) => ({
        ...prev,
        payment_method: 'fiado',
        payment_status: 'pending',
        customer_name: cleanName,
        delivery_notes: updatedNotes
      }));
      fetchOrders?.();
    }
  };

  const handleDirectPayment = async (method = 'efectivo') => {
    if (!selectedOrder) return;
    const total = Number(selectedOrder.total_amount || 0);
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_method: method,
        paid_amount: total,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedOrder.id);

    if (error) {
      toast.error('Error al marcar pagado: ' + error.message);
    } else {
      const label = method === 'efectivo' ? 'Efectivo' : 'Nequi';
      toast.success(`🎉 Pedido marcado como Pagado en ${label}`);
      setSelectedOrder?.((prev) => ({
        ...prev,
        payment_status: 'paid',
        payment_method: method,
        paid_amount: total
      }));
      fetchOrders?.();
    }
  };

  const handleCustomerArrivalAlert = () => {
    if (!selectedOrder?.customer_phone) return;
    const cleanP = selectedOrder.customer_phone.replace(/\D/g, '');
    const phone = cleanP.startsWith('57') ? cleanP : `57${cleanP}`;
    const shortNum = `#${selectedOrder.id.slice(0, 4).toUpperCase()}`;
    const brand = activeBrand?.name || 'Boku Bento';
    const msg = `🛵 ¡Hola ${selectedOrder.customer_name || ''}! Ya nos encontramos afuera de tu dirección (*${selectedOrder.delivery_address || ''}*) con tu pedido ${shortNum} caliente y listo de ${brand}.\n\n¿Podrías salir a recibirlo, por favor? ¡Muchas gracias! 🙌`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSendDriverLink = () => {
    if (!selectedOrder) return;
    const driverUrl = `${window.location.origin}/domi/${selectedOrder.id}`;
    const shortNum = `#${selectedOrder.id.slice(0, 4).toUpperCase()}`;
    const brand = activeBrand?.name || 'Boku Bento';
    const msg = `🛵 *DOMICILIO ASIGNADO - ${brand}*\n📦 *Pedido ${shortNum}*\n👤 *Cliente:* ${selectedOrder.customer_name || 'Sin nombre'}\n📞 *Teléfono:* ${selectedOrder.customer_phone || ''}\n📍 *Dirección:* ${selectedOrder.delivery_address || ''}\n${selectedOrder.delivery_notes ? `📝 *Nota:* ${selectedOrder.delivery_notes}\n` : ''}💰 *Cobro:* ${selectedOrder.payment_status === 'paid' ? 'YA PAGADO (No cobrar dinero)' : `$${Number(selectedOrder.total_amount || 0).toLocaleString()} (${selectedOrder.payment_method || 'Cobro contra entrega'})`}\n\n📲 *Abre la app de entrega aquí (Mapa y llamada rápida):*\n${driverUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(driverUrl);
    }
    toast.success('¡Enlace de entrega copiado! Abriendo WhatsApp...');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleApplyCourtesyDiscount = async (pct) => {
    if (!selectedOrder) return;
    await applyDiscount?.(selectedOrder.id, pct);
    if (selectedOrder.status === 'waiting_payment') {
      await updateOrderStatus?.(selectedOrder.id, "new", {
        payment_status: "paid",
        payment_method: selectedPaymentMethod
      });
    }
  };

  return {
    handleAssignFiado,
    handleDirectPayment,
    handleCustomerArrivalAlert,
    handleSendDriverLink,
    handleApplyCourtesyDiscount
  };
}
