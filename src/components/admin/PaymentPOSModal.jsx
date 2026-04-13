import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../Toast';
import { useAuth } from '../../context/AuthContext';

/**
 * PaymentPOSModal Component
 * Handles granular payments for an order, including split payments and cash change calculation.
 */
export default function PaymentPOSModal({ order, onClose, onSuccess, paymentMethods }) {
  const { user, activeBrand } = useAuth();
  
  // Local state
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState(false);
  const [manualAmount, setManualAmount] = useState('');

  // Initialize payment method
  useEffect(() => {
    if (paymentMethods?.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0]);
    }
  }, [paymentMethods, paymentMethod]);

  // Calculate totals
  const unpaidItems = useMemo(() => {
    return order?.order_items?.filter(item => !item.is_paid) || [];
  }, [order]);

  const selectedTotal = useMemo(() => {
    if (customAmount) return parseFloat(manualAmount) || 0;
    
    return unpaidItems
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  }, [unpaidItems, selectedItemIds, customAmount, manualAmount]);

  const remainingBalance = useMemo(() => {
    const totalOrder = order.total_amount;
    const paidSoFar = order.paid_amount || 0;
    return Math.max(0, totalOrder - paidSoFar);
  }, [order]);

  // If no items are selected and not custom amount, default to full remaining balance
  const amountToPay = customAmount ? (parseFloat(manualAmount) || 0) : (selectedItemIds.length > 0 ? selectedTotal : remainingBalance);

  // Change calculation
  const isCash = paymentMethod?.name?.toLowerCase().includes('efectivo');
  const receivedNum = parseFloat(receivedAmount) || 0;
  const change = Math.max(0, receivedNum - amountToPay);

  // Keypad actions
  const handleKeyPress = (key) => {
    if (key === 'clear') {
      setReceivedAmount('');
      return;
    }
    if (key === '000') {
      setReceivedAmount(prev => prev + '000');
      return;
    }
    setReceivedAmount(prev => prev + key);
  };

  const handleQuickCash = (amount) => {
    setReceivedAmount(amount.toString());
  };

  // Selection handlers
  const toggleItem = (itemId) => {
    if (customAmount) setCustomAmount(false);
    setSelectedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const selectAllUnpaid = () => {
    if (customAmount) setCustomAmount(false);
    setSelectedItemIds(unpaidItems.map(i => i.id));
  };

  const clearSelection = () => {
    setSelectedItemIds([]);
    setCustomAmount(false);
  };

  const handleProcessPayment = async () => {
    if (amountToPay <= 0) {
      toast.error('Monto inválido');
      return;
    }

    if (isCash && receivedNum < amountToPay) {
      toast.error('Monto recibido insuficiente');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Insert into order_payments
      const { data: paymentData, error: paymentError } = await supabase
        .from('order_payments')
        .insert([{
          order_id: order.id,
          amount: amountToPay,
          method_id: paymentMethod.id,
          method_name: paymentMethod.name,
          item_ids: selectedItemIds.length > 0 ? selectedItemIds : null,
          change_amount: isCash ? change : 0,
          brand_id: activeBrand.id,
          processed_by: user.id
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Update order_items to set is_paid = true if items were selected
      if (selectedItemIds.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .update({ is_paid: true })
          .in('id', selectedItemIds);
        
        if (itemsError) throw itemsError;
      }

      toast.success('Pago procesado correctamente');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#2f4131] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Icon icon="heroicons:banknotes" className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-none mb-1">PROCESAR PAGO</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">PEDIDO #{order.id.slice(0,4)}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 bg-white hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-all text-gray-400 shadow-sm border border-gray-100"
          >
            <Icon icon="heroicons:x-mark" className="text-2xl" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Order Summary & Item Selection */}
          <div className="w-full md:w-1/2 border-r border-gray-100 flex flex-col bg-gray-50/30">
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-gray-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
                  <Icon icon="heroicons:shopping-bag" className="text-lg" />
                  Selección de Consumo
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={selectAllUnpaid}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase"
                  >
                    Todo
                  </button>
                  <span className="text-gray-300">•</span>
                  <button 
                    onClick={clearSelection}
                    className="text-[10px] font-black text-red-600 hover:text-red-700 uppercase"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {unpaidItems.length > 0 ? unpaidItems.map(item => (
                  <label 
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer group ${
                      selectedItemIds.includes(item.id)
                        ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100'
                        : 'bg-white border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedItemIds.includes(item.id)
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'bg-white border-gray-200'
                    }`}>
                      {selectedItemIds.includes(item.id) && <Icon icon="heroicons:check-16-solid" className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 uppercase tracking-tight truncate">{item.products?.name}</p>
                      <p className="text-[10px] font-bold text-gray-400">{item.quantity} unidades • ${(item.unit_price).toLocaleString()}/u</p>
                    </div>
                    <span className="font-black text-gray-900">${(item.quantity * item.unit_price).toLocaleString()}</span>
                  </label>
                )) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                    <Icon icon="heroicons:check-circle" className="text-5xl mb-4 text-emerald-600" />
                    <p className="text-sm font-black text-gray-600 uppercase tracking-widest">Todos los ítems ya están pagados</p>
                  </div>
                )}
              </div>

              {/* Paid Items (Read Only/Secondary) */}
              {order.order_items?.some(i => i.is_paid) && (
                <div className="mt-8">
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Pagados Previamente</h4>
                  <div className="space-y-2 opacity-60">
                    {order.order_items.filter(i => i.is_paid).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-100/50">
                        <div className="flex items-center gap-2">
                          <Icon icon="heroicons:check-circle-16-solid" className="text-emerald-500" />
                          <span className="text-xs font-bold text-gray-500 line-through">{item.products?.name}</span>
                        </div>
                        <span className="text-xs font-black text-gray-400">${(item.quantity * item.unit_price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total Section in Left Column */}
            <div className="p-6 bg-white border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>SALDO PENDIENTE TOTAL</span>
                  <span>${remainingBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl text-white">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Monto a Cobrar</span>
                    <span className="text-xs font-bold opacity-60">
                      {selectedItemIds.length > 0 ? `${selectedItemIds.length} productos seleccionados` : 'Monto total restante'}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-white">${amountToPay.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Methods & Keypad */}
          <div className="w-full md:w-1/2 flex flex-col bg-white">
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <h3 className="font-black text-gray-400 uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
                <Icon icon="heroicons:credit-card" className="text-lg" />
                Método de Pago
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {paymentMethods.map(method => (
                  <button 
                    key={method.id}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      paymentMethod?.id === method.id 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                        : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200'
                    }`}
                  >
                    <Icon icon={method.icon || (method.name?.toLowerCase().includes('efectivo') ? 'heroicons:banknotes' : 'heroicons:credit-card')} className="text-xl" />
                    <span className="text-xs font-black uppercase tracking-wider">{method.name}</span>
                  </button>
                ))}
              </div>

              {isCash && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recibido (Efectivo)</label>
                       {change > 0 && (
                         <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                           CAMBIO: ${change.toLocaleString()}
                         </span>
                       )}
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">$</div>
                      <input 
                        type="text" 
                        readOnly
                        value={receivedAmount}
                        placeholder="0.00"
                        className="w-full bg-gray-50 border-none rounded-3xl p-6 pl-10 text-3xl font-black text-gray-900 focus:ring-2 focus:ring-emerald-500 text-right"
                      />
                    </div>
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '0', '000', 'clear'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className={`py-4 rounded-2xl font-black text-xl transition-all active:scale-90 ${
                          key === 'clear' 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {key === 'clear' ? <Icon icon="heroicons:backspace" className="mx-auto" /> : key}
                      </button>
                    ))}
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex gap-2">
                    {[5000, 10000, 20000, 50000].map(val => (
                      <button
                        key={val}
                        onClick={() => handleQuickCash(val)}
                        className="flex-1 py-3 bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-50 transition-colors"
                      >
                        ${(val/1000)}K
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isCash && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <Icon icon="heroicons:credit-card" className="text-3xl text-gray-300" />
                  </div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest px-8">Confirmación manual de pago electrónico</p>
                </div>
              )}
            </div>

            {/* Final Action Button */}
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleProcessPayment}
                disabled={isProcessing || (isCash && receivedNum < amountToPay)}
                className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
                  isProcessing || (isCash && receivedNum < amountToPay)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                }`}
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Icon icon="heroicons:check-circle" className="text-2xl" />
                    COBRAR ${(amountToPay).toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
