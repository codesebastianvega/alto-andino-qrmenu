import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../Toast';
import { useAuth } from '../../context/AuthContext';

/**
 * PaymentPOSModal Component
 * Handles granular payments (partial quantity), multi-method (tenders), 
 * and features a 3-column professional layout.
 */
export default function PaymentPOSModal({ order, onClose, onSuccess, paymentMethods }) {
  const { user, activeBrand } = useAuth();
  
  // -- State --
  const [isSplitting, setIsSplitting] = useState(false);
  const [waiveServiceFee, setWaiveServiceFee] = useState(false);
  
  // Selection
  const [selectedQuantities, setSelectedQuantities] = useState(() => {
    // Default to selecting all units of all unpaid items
    const initial = {};
    order?.order_items?.forEach(item => {
      if (!item.is_paid) initial[item.id] = item.quantity;
    });
    return initial;
  }); 

  const [manualAmount, setManualAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('items'); // 'items' or 'manual'
  const [tenders, setTenders] = useState([]); // [{ methodId, name, amount, received, change, isCash }]
  const [currentMethod, setCurrentMethod] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [inputFocus, setInputFocus] = useState('received'); // 'manual_amount' or 'received'

  // UI Flow
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [lastTransactionChange, setLastTransactionChange] = useState(0);

  // -- Initialization --
  useEffect(() => {
    if (paymentMethods?.length > 0 && !currentMethod) {
      const defaultMethod = paymentMethods.find(m => m.name.toLowerCase().includes('efectivo')) || paymentMethods[0];
      setCurrentMethod(defaultMethod);
    }
  }, [paymentMethods, currentMethod]);

  // -- Calculations --
  const unpaidItems = useMemo(() => {
    return order?.order_items?.filter(item => !item.is_paid) || [];
  }, [order]);

  const remainingOrderBalance = useMemo(() => {
    let total = order.total_amount;
    if (waiveServiceFee) total -= (order.service_fee || 0);
    const paid = order.paid_amount || 0;
    return Math.max(0, total - paid);
  }, [order, waiveServiceFee]);

  // Total amount selected for THIS specific transaction session
  const amountToCover = useMemo(() => {
    if (paymentMode === 'manual') return parseFloat(manualAmount) || 0;
    
    let subtotal = unpaidItems.reduce((sum, item) => {
      const q = selectedQuantities[item.id] || 0;
      return sum + (q * item.unit_price);
    }, 0);

    // If we are NOT splitting, we definitely include the service fee if available
    // BUT only if we are paying the FULL balance of selected items.
    // If the user chooses to waive it, we exclude it.
    if (!waiveServiceFee && order.service_fee > 0) {
        // If not splitting, add full fee. 
        // If splitting, we might want to add a proportional fee? 
        // User says "servico adicional 10%", usually added to the total.
        // Let's keep it simple: if not waving, add the tip.
        subtotal += Number(order.service_fee);
    }

    return subtotal;
  }, [paymentMode, manualAmount, selectedQuantities, unpaidItems, waiveServiceFee, order.service_fee]);

  const totalTendered = useMemo(() => {
    return tenders.reduce((sum, t) => sum + t.amount, 0);
  }, [tenders]);

  const pendingThreshold = Math.max(0, amountToCover - totalTendered);

  // Calculator Logic
  const isCash = currentMethod?.name?.toLowerCase().includes('efectivo');
  const keypadTarget = (paymentMode === 'manual' && inputFocus === 'manual_amount') ? 'manual' : 'received';
  
  const handleKeyPress = (key) => {
    const setter = (keypadTarget === 'manual') ? setManualAmount : setReceivedAmount;
    
    if (key === 'clear') {
      setter('');
      return;
    }
    if (key === '000') {
      setter(prev => prev + '000');
      return;
    }
    setter(prev => prev + key);
  };

  // -- List Handlers --
  const updateItemQty = (itemId, change, max) => {
    setPaymentMode('items');
    setSelectedQuantities(prev => {
      const curr = prev[itemId] || 0;
      const next = Math.max(0, Math.min(max, curr + change));
      return { ...prev, [itemId]: next };
    });
  };

  const toggleSplitting = () => {
    const nextVal = !isSplitting;
    setIsSplitting(nextVal);
    
    // Always reset to "all items selected" when turning splitting OFF
    // or when turning it ON (as a starting point) 
    const allSelected = {};
    order?.order_items?.forEach(item => {
      if (!item.is_paid) allSelected[item.id] = item.quantity;
    });
    setSelectedQuantities(allSelected);
  };

  const addTender = () => {
    if (!currentMethod) return;
    
    // The value from keypad is what we "intend" to pay or what we "received"
    const inputVal = parseFloat(receivedAmount) || 0;
    
    let amount = 0;
    let received = 0;
    let change = 0;

    if (isCash) {
       received = inputVal;
       if (received <= 0) {
         toast.error('Ingrese el monto recibido');
         return;
       }
       // Cap the amount that actually counts towards the balance
       amount = Math.min(received, pendingThreshold);
       change = received - amount;
    } else {
       // Electronic: typically received = amount, no change
       // Default to pendingThreshold if input is 0
       amount = inputVal > 0 ? Math.min(inputVal, pendingThreshold) : pendingThreshold;
       received = amount;
       change = 0;
    }

    if (amount <= 0 && pendingThreshold > 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    setTenders(prev => [...prev, {
      methodId: currentMethod.id,
      name: currentMethod.name,
      amount,
      received,
      change,
      isCash: !!isCash
    }]);

    setReceivedAmount('');
  };

  const removeTender = (index) => {
    setTenders(prev => prev.filter((_, i) => i !== index));
  };

  // -- Finalize --
  const handleFinalize = async () => {
    let finalTenders = [...tenders];
    
    // Auto-tender if none registered and amount is valid
    if (finalTenders.length === 0) {
       if (amountToCover <= 0) {
         toast.error('No hay un monto válido para pagar');
         return;
       }
       if (!currentMethod) {
         toast.error('Seleccione un método de pago');
         return;
       }

       finalTenders = [{
         methodId: currentMethod.id,
         name: currentMethod.name,
         amount: amountToCover,
         received: parseFloat(receivedAmount) || amountToCover,
         change: isCash ? Math.max(0, (parseFloat(receivedAmount) || 0) - amountToCover) : 0,
         isCash: !!isCash
       }];
    }

    const currentTotalTendered = finalTenders.reduce((sum, t) => sum + t.amount, 0);

    if (currentTotalTendered < amountToCover - 0.1) {
      toast.error('El monto no cubre el total seleccionado');
      return;
    }

    setIsProcessing(true);
    try {
      // 0. Update Service Fee if waived
      if (waiveServiceFee && order.service_fee > 0) {
        const newTotal = order.total_amount - order.service_fee;
        await supabase.from('orders').update({
          service_fee: 0,
          total_amount: newTotal
        }).eq('id', order.id);
      }

      // 1. Process Item Splitting
      if (paymentMode === 'items') {
        for (const item of unpaidItems) {
            const qtyToPay = selectedQuantities[item.id] || 0;
            if (qtyToPay <= 0) continue;

            if (qtyToPay === item.quantity) {
                await supabase.from('order_items').update({ is_paid: true }).eq('id', item.id);
            } else {
                await supabase.from('order_items').update({ quantity: item.quantity - qtyToPay }).eq('id', item.id);
                const { id, created_at, products, ...rest } = item;
                await supabase.from('order_items').insert([{
                    ...rest,
                    quantity: qtyToPay,
                    is_paid: true
                }]);
            }
        }
      }

      // 2. Insert Tenders
      const totalChange = finalTenders.reduce((sum, t) => sum + t.change, 0);
      setLastTransactionChange(totalChange);

      const inserts = finalTenders.map(t => ({
        order_id: order.id,
        brand_id: activeBrand.id,
        amount: t.amount,
        received_amount: t.received,
        change_amount: t.change,
        payment_method_id: t.methodId,
        payment_method_name: t.name,
        items_covered: paymentMode === 'items' ? Object.keys(selectedQuantities).filter(id => selectedQuantities[id] > 0) : null
      }));

      const { error: pError } = await supabase.from('order_payments').insert(inserts);
      if (pError) throw pError;

      // 3. Status Check: if everything is paid, move to 'new' if it was 'waiting_payment'
      const { data: updatedOrder } = await supabase.from('orders').select('total_amount, paid_amount, status').eq('id', order.id).single();
      if (updatedOrder && updatedOrder.paid_amount >= updatedOrder.total_amount - 1) {
          if (updatedOrder.status === 'waiting_payment') {
             await supabase.from('orders').update({ status: 'new' }).eq('id', order.id);
          }
      }

      if (totalChange > 0) {
        setShowSuccessScreen(true);
      } else {
        toast.success('Pago completado');
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar la transacción');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccessScreen) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-xl animate-in fade-in duration-500">
        <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl relative overflow-hidden border border-white/20">
          <div className="absolute -top-20 -right-20 h-64 w-64 bg-emerald-50 rounded-full opacity-50" />
          <div className="relative z-10">
            <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon icon="solar:check-circle-bold" className="text-6xl" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">PAGO EXITOSO</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">TRANSACCIÓN COMPLETADA</p>
            
            <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white mb-10 shadow-xl shadow-emerald-200">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">CAMBIO A DEVOLVER</p>
              <div className="text-5xl font-black tracking-tighter">
                ${lastTransactionChange.toLocaleString()}
              </div>
            </div>

            <button 
              onClick={() => { onSuccess(); onClose(); }}
              className="w-full py-6 bg-gray-900 hover:bg-black text-white rounded-[2rem] font-black text-xl transition-all shadow-xl active:scale-95"
            >
              CERRAR CAJA
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Icon icon="solar:calculator-minimalistic-bold" className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-none mb-1 uppercase tracking-tight">CAJA / PUNTO DE VENTA</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pedido #{order.id.slice(0,4)} • {order.customer_name || 'MOSTRADOR'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">SALDO TOTAL ORDEN</p>
              <p className="text-2xl font-black text-[#2f4131] leading-none">${remainingOrderBalance.toLocaleString()}</p>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 bg-white hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-all text-gray-400 shadow-sm border border-gray-100"
            >
              <Icon icon="solar:close-circle-bold" className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
               {/* Column 1: Items Selector (4/12) */}
          <div className="lg:col-span-4 border-r border-gray-100 bg-gray-50/30 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-white space-y-3">
               {/* Mode Switcher */}
               <div className="flex p-1 bg-gray-100 rounded-2xl">
                  <button 
                    onClick={() => { setPaymentMode('items'); setInputFocus('received'); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2 ${
                        paymentMode === 'items' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                        <Icon icon="solar:bag-heart-bold" className="text-lg" />
                        Productos
                  </button>
                  <button 
                    onClick={() => { setPaymentMode('manual'); setInputFocus('manual_amount'); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2 ${
                        paymentMode === 'manual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                        <Icon icon="solar:pen-new-square-bold" className="text-lg" />
                        Manual
                  </button>
              </div>

              {/* Dividir Pago Toggle - More prominent as requested */}
              {paymentMode === 'items' && (
                <button 
                  onClick={toggleSplitting}
                  className={`w-full py-3.5 rounded-2xl border-2 transition-all flex items-center justify-between px-5 group ${
                    isSplitting ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon icon="solar:clipboard-list-bold" className={`text-xl ${isSplitting ? 'text-white' : 'text-emerald-500'}`} />
                    <span className="text-sm font-black uppercase tracking-tight">Dividir Cuenta</span>
                  </div>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 ${isSplitting ? 'bg-white border-white' : 'border-gray-300'}`}>
                    {isSplitting && <Icon icon="solar:check-circle-bold" className="text-emerald-600 text-lg" />}
                  </div>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {paymentMode === 'items' ? (
                unpaidItems.length > 0 ? unpaidItems.map(item => (
                  <div key={item.id} className={`p-4 rounded-[2rem] border-2 transition-all ${
                     (selectedQuantities[item.id] || 0) > 0 ? 'bg-white border-emerald-500 shadow-sm' : 'bg-gray-50 border-transparent opacity-50'
                  }`}>
                    <div className="flex justify-between items-center gap-3">
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-800 uppercase truncate">{item.products?.name}</p>
                          <p className="text-xs font-bold text-gray-400">${item.unit_price.toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-gray-900">${((selectedQuantities[item.id] || 0) * item.unit_price).toLocaleString()}</p>
                          {isSplitting && (
                             <p className="text-[10px] font-bold text-emerald-600 uppercase">Cantidad: {selectedQuantities[item.id] || 0}</p>
                          )}
                       </div>
                    </div>

                    {isSplitting && (
                      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 animate-in fade-in zoom-in-95">
                          <button 
                            onClick={() => updateItemQty(item.id, -1, item.quantity)}
                            className="h-10 w-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
                          >
                            <Icon icon="solar:minus-circle-bold" className="text-xl" />
                          </button>
                          <span className="text-lg font-black w-10 text-center">
                            {selectedQuantities[item.id] || 0}
                          </span>
                          <button 
                            onClick={() => updateItemQty(item.id, 1, item.quantity)}
                            className="h-10 w-10 rounded-2xl bg-[#2f4131] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                          >
                            <Icon icon="solar:add-circle-bold" className="text-xl" />
                          </button>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 py-12">
                    <Icon icon="solar:box-minimalistic-bold" className="text-6xl mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">Sin productos pendientes</p>
                  </div>
                )
              ) : (
                <div className="bg-white p-8 rounded-[3rem] border-2 border-emerald-500 shadow-xl shadow-emerald-100/30 text-center animate-in zoom-in-95">
                   <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Ingresa Monto Manual</p>
                   <div className="text-4xl font-black text-gray-900 tracking-tighter" onClick={() => setInputFocus('manual_amount')}>
                      ${(parseFloat(manualAmount) || 0).toLocaleString()}
                      {inputFocus === 'manual_amount' && <span className="animate-pulse text-emerald-600 ml-1">|</span>}
                   </div>
                </div>
              )}

              {/* Already Paid Recap */}
              {order.order_items?.some(i => i.is_paid) && (
                <div className="pt-8 border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">COBRADO ANTERIORMENTE</p>
                  <div className="space-y-2">
                    {order.order_items.filter(i => i.is_paid).map(i => (
                      <div key={i.id} className="flex justify-between text-xs font-bold py-2 px-4 rounded-2xl bg-gray-50 text-gray-500">
                        <span>{i.quantity}x {i.products?.name}</span>
                        <span className="text-emerald-600 text-[10px] uppercase font-black">PAGADO</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-white border-t border-gray-100 space-y-4">
               {/* Service Fee Toggle */}
               {order.service_fee > 0 && (
                 <button 
                   onClick={() => setWaiveServiceFee(!waiveServiceFee)}
                   className={`w-full py-4 rounded-[2rem] border-2 transition-all flex items-center justify-between px-6 ${
                     !waiveServiceFee ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <Icon icon="solar:heart-bold" className="text-xl" />
                     <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">Propina / Servicio (10%)</p>
                        <p className="text-xs font-bold opacity-70">${Number(order.service_fee).toLocaleString()}</p>
                     </div>
                   </div>
                   <div className={`h-6 w-11 rounded-full p-1 transition-colors ${!waiveServiceFee ? 'bg-orange-500' : 'bg-gray-300'}`}>
                      <div className={`h-4 w-4 bg-white rounded-full transition-transform ${!waiveServiceFee ? 'translate-x-5' : 'translate-x-0'}`} />
                   </div>
                 </button>
               )}

               <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-gray-200">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">MONTO SELECCIONADO</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-black tracking-tighter">${amountToCover.toLocaleString()}</p>
                    {waiveServiceFee && <span className="text-[10px] font-bold text-orange-400 uppercase">Sin Servicio</span>}
                  </div>
               </div>
            </div>
          </div>

          {/* Column 2: Methods & Tenders (4/12) */}
          <div className="lg:col-span-4 border-r border-gray-100 flex flex-col overflow-hidden bg-white">
             <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                    <Icon icon="solar:wallet-bold" className="text-base text-emerald-600" /> MÉTODOS DE PAGO
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => {
                           setCurrentMethod(method);
                           if (method.name.toLowerCase().includes('efectivo')) setInputFocus('received');
                           else setInputFocus('manual_amount');
                        }}
                        className={`p-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2 group ${
                          currentMethod?.id === method.id 
                            ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-xl' 
                            : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200'
                        }`}
                      >
                        <Icon icon={method.icon || 'solar:card-2-bold'} className={`text-2xl ${currentMethod?.id === method.id ? 'text-emerald-400' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">{method.name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Icon icon="solar:bill-list-bold" className="text-base" /> PAGOS REGISTRADOS
                    </h3>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {tenders.length} PAGOS
                    </span>
                  </div>

                  <div className="space-y-3">
                    {tenders.length > 0 ? tenders.map((t, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4 animate-in slide-in-from-right-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#2f4131]">
                           <Icon icon="solar:bill-check-bold" className="text-xl" />
                        </div>
                        <div className="flex-1">
                           <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{t.name}</p>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                             RECIBIDO: ${t.received.toLocaleString()}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-[#2f4131]">${t.amount.toLocaleString()}</p>
                           <button onClick={() => removeTender(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                             <Icon icon="solar:trash-bin-trash-bold" />
                           </button>
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center opacity-30">
                        <Icon icon="solar:bill-list-bold" className="text-4xl mb-4 mx-auto" />
                        <p className="text-xs font-black uppercase tracking-widest">Esperando primer pago...</p>
                      </div>
                    )}
                  </div>
                </section>
             </div>

             <div className="p-6 bg-emerald-50 border-t border-emerald-100">
                <div className="flex justify-between items-center mb-1">
                   <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">TOTAL PAGADO</p>
                   <p className="text-xl font-black text-emerald-900">${totalTendered.toLocaleString()}</p>
                </div>
                {pendingThreshold > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">RESTANTE</p>
                    <p className="text-sm font-black text-orange-600">-${pendingThreshold.toLocaleString()}</p>
                  </div>
                )}
             </div>
          </div>

          {/* Column 3: Calculator (4/12) */}
          <div className="lg:col-span-4 flex flex-col bg-gray-50/50">
             <div className="p-8 flex-1 flex flex-col space-y-8">
                
                {/* Visualizer */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <p className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${keypadTarget === 'received' ? 'text-blue-600' : 'text-gray-400'}`}>
                         {isCash ? 'INGRESAR EFECTIVO RECIBIDO' : 'CONFIRMAR MONTO ELECTRÓNICO'}
                       </p>
                    </div>
                    <div className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all shadow-xl text-right relative overflow-hidden group ${
                      keypadTarget === 'received' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-100'
                    }`}>
                        <div className="absolute top-0 left-0 h-full w-2 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-200">$</span>
                        <div className="text-2xl font-black text-gray-900 tracking-tighter">
                          {(parseFloat(receivedAmount) || (isCash ? 0 : pendingThreshold)).toLocaleString()}
                          {keypadTarget === 'received' && <span className="animate-pulse text-blue-500 ml-1">|</span>}
                        </div>
                    </div>
                    
                    {isCash && (
                      <div className="flex items-center justify-between px-6">
                         <p className="text-xs font-black text-gray-400 uppercase">CAMBIO ESTIMADO</p>
                         <p className="text-2xl font-black text-emerald-600">
                           ${Math.max(0, (parseFloat(receivedAmount) || 0) - pendingThreshold).toLocaleString()}
                         </p>
                      </div>
                    )}
                </div>

                {/* Keypad */}
                <div className="flex-1 flex flex-col space-y-4">
                   <div className="grid grid-cols-3 gap-2 flex-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '0', '000', 'clear'].map((key) => (
                        <button
                          key={key}
                          onClick={() => handleKeyPress(key)}
                          className={`rounded-2xl font-black text-xl transition-all active:scale-95 shadow-sm border border-gray-200 ${
                            key === 'clear' 
                              ? 'bg-red-50 text-red-500 border-red-100 flex items-center justify-center' 
                              : 'bg-white text-gray-800 hover:bg-white shadow-gray-100'
                          }`}
                        >
                          {key === 'clear' ? <Icon icon="solar:backspace-bold" /> : key}
                        </button>
                      ))}
                   </div>
                   
                   <div className="flex gap-2">
                       {[10000, 20000, 50000].map(v => (
                         <button 
                           key={v}
                           onClick={() => setReceivedAmount(v.toString())}
                           className="flex-1 py-3 bg-white border border-blue-200 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
                         >
                            ${(v/1000)}K
                         </button>
                       ))}
                       <button 
                         onClick={() => setReceivedAmount(pendingThreshold.toString())}
                         className="flex-[1.5] py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                       >
                          TOTAL EXACTO
                       </button>
                   </div>
                </div>

                <div className="flex gap-4">
                  {(isSplitting || tenders.length > 0) && (
                    <button
                      onClick={addTender}
                      disabled={(!isCash && pendingThreshold <= 0) || (isCash && (!receivedAmount || parseFloat(receivedAmount) <= 0))}
                      className={`flex-1 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
                        (!isCash && pendingThreshold <= 0) || (isCash && (!receivedAmount || parseFloat(receivedAmount) <= 0))
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-transparent'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:-translate-y-1'
                      }`}
                    >
                      <Icon icon="solar:add-circle-bold" className="text-2xl" />
                      AGREGAR PAGO
                    </button>
                  )}
                </div>
             </div>

             <div className="p-6 bg-white border-t border-gray-100">
                <button
                  onClick={handleFinalize}
                  disabled={isProcessing || amountToCover <= 0}
                  className={`w-full py-6 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
                    isProcessing || amountToCover <= 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                      : (tenders.length === 0 && !isSplitting)
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:-translate-y-1'
                        : 'bg-gray-900 border-2 border-emerald-500 hover:bg-black text-white shadow-emerald-200/50 hover:-translate-y-1'
                  }`}
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Icon icon="solar:check-read-bold" className="text-2xl" />
                      FINALIZAR TRANSACCIÓN
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
