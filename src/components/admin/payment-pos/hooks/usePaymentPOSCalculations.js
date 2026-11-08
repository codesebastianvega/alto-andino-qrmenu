import { useMemo } from 'react';

export function usePaymentPOSCalculations({
  order,
  waiveServiceFee,
  paymentMode,
  selectedQuantities = {},
  manualAmount = '',
  tenders = []
}) {
  const unpaidItems = useMemo(() => {
    return order?.order_items?.filter((item) => !item.is_paid) || [];
  }, [order]);

  const remainingOrderBalance = useMemo(() => {
    let total = order?.total_amount || 0;
    if (waiveServiceFee) total -= order?.service_fee || 0;
    const paid = order?.paid_amount || 0;
    return Math.max(0, total - paid);
  }, [order, waiveServiceFee]);

  const originalSubtotal = useMemo(() => {
    return order?.order_items?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) || 0;
  }, [order]);

  const currentServiceFee = useMemo(() => {
    if (waiveServiceFee || !order?.service_fee) return 0;
    if (paymentMode === 'manual') return 0;

    const selectedSubtotal = unpaidItems.reduce((sum, item) => {
      const q = selectedQuantities[item.id] || 0;
      return sum + q * item.unit_price;
    }, 0);

    const remainingUnpaidSubtotal = unpaidItems.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);

    // Safeguard: If paying all remaining items, service fee is the remaining order balance minus the selected subtotal
    if (selectedSubtotal === remainingUnpaidSubtotal) {
      const remainingFee = remainingOrderBalance - selectedSubtotal;
      return Math.max(0, Math.round(remainingFee * 100) / 100);
    }

    if (originalSubtotal > 0) {
      const fee = (selectedSubtotal / originalSubtotal) * Number(order.service_fee);
      return Math.round(fee * 100) / 100;
    }
    return 0;
  }, [paymentMode, selectedQuantities, unpaidItems, waiveServiceFee, order?.service_fee, originalSubtotal, remainingOrderBalance]);

  // Total amount selected for THIS specific transaction session
  const amountToCover = useMemo(() => {
    if (paymentMode === 'manual') return parseFloat(manualAmount) || 0;

    let subtotal = unpaidItems.reduce((sum, item) => {
      const q = selectedQuantities[item.id] || 0;
      return sum + q * item.unit_price;
    }, 0);

    if (!waiveServiceFee && (order?.service_fee || 0) > 0) {
      subtotal += currentServiceFee;
    }

    return subtotal;
  }, [paymentMode, manualAmount, selectedQuantities, unpaidItems, waiveServiceFee, order?.service_fee, currentServiceFee]);

  const totalTendered = useMemo(() => {
    return tenders.reduce((sum, t) => sum + t.amount, 0);
  }, [tenders]);

  const pendingThreshold = Math.max(0, amountToCover - totalTendered);

  return {
    unpaidItems,
    remainingOrderBalance,
    originalSubtotal,
    currentServiceFee,
    amountToCover,
    totalTendered,
    pendingThreshold
  };
}
