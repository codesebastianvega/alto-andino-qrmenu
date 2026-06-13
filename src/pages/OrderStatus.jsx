import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { translateGroup } from '../utils/formatters';
import { useMenuData } from '../context/MenuDataContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, CheckCircle2, ChefHat, ShoppingBag, Clock, XIcon, 
  Loader2, AlertCircle, Banknote, Home, Truck, Utensils
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderStatus({ orderId }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { restaurantSettings } = useMenuData();
  const { activeBrand } = useAuth();

  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";

  useEffect(() => {
    fetchOrder();

    // Suscripción a cambios en esta orden específica
    const channel = supabase.channel(`order_status_${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(name, price)
        `)
        .eq('order_id', orderId);
        
      if (itemsError) throw itemsError;

      setOrder(orderData);
      setItems(itemsData);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("No pudimos cargar la información del pedido. Verifica que el enlace sea correcto.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar tu pedido?")) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled', 
          cancelled_by: 'customer',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // La suscripción de realtime actualizará el estado automáticamente
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("No se pudo cancelar el pedido. Por favor contacta al local.");
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-[#E6B05C] w-12 h-12" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Pedido no encontrado</h2>
        <p className="text-black/50 font-medium mb-8">{error || "El pedido no existe o fue eliminado."}</p>
        <button onClick={() => window.location.href = '/'} className="bg-[#1A2421] text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-colors">
          Volver al menú
        </button>
      </div>
    );
  }

  // --- LOGIC PARA TRACKER DINÁMICO EXPRESIVO ---
  // El tracking de preparación es INDEPENDIENTE del estado de pago.
  // waiting_payment se muestra como banner aparte, no afecta la barra de progreso.
  const isDelivery = order.fulfillment_type === 'delivery';
  const isTakeaway = order.fulfillment_type === 'takeaway';
  const isDineIn = order.fulfillment_type === 'dine_in';
  const isPaymentPending = order.payment_status !== 'paid';

  const STATUS_STEPS = {
    cancelled: { label: 'Cancelado', icon: <AlertCircle size={48} />, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', glow: 'bg-red-500/10', text: 'text-red-600', step: 0 },
    waiting_payment: { label: 'Recibido', icon: <CheckCircle2 size={48} />, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', glow: 'bg-blue-500/15', text: 'text-blue-600', step: 1 },
    new: { label: 'Recibido', icon: <CheckCircle2 size={48} />, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', glow: 'bg-blue-500/15', text: 'text-blue-600', step: 1 },
    preparing: { label: 'En Cocina', icon: <ChefHat size={48} />, color: 'text-yellow-600', bg: 'bg-[#FFF9E6]', border: 'border-[#F8E5A0]', glow: 'bg-[#E6B05C]/20', text: 'text-yellow-700', step: 2 },
    ready: { label: '¡Listo!', icon: <ShoppingBag size={48} />, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', glow: 'bg-green-500/15', text: 'text-green-600', step: 3 },
    on_table: { label: 'En Mesa', icon: <Utensils size={48} />, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', glow: 'bg-purple-500/15', text: 'text-purple-600', step: 4 },
    on_the_way: { label: isDelivery ? 'En Camino' : 'Entregando', icon: isDelivery ? <Truck size={48} /> : <ShoppingBag size={48} />, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', glow: 'bg-indigo-500/15', text: 'text-indigo-600', step: 4 },
    delivered: { label: 'Finalizado', icon: <Home size={48} />, color: 'text-[#4A7856]', bg: 'bg-[#EAF1EC]', border: 'border-[#4A7856]/20', glow: 'bg-[#4A7856]/15', text: 'text-[#4A7856]', step: 5 }
  };

  const currentStatus = STATUS_STEPS[order.status] || STATUS_STEPS['new'];
  const orderStepId = currentStatus.step;

  // Barra de progreso SIEMPRE muestra preparación, independiente del pago
  const progressSteps = isDineIn ? [
    { id: 1, title: 'Recibido', icon: <CheckCircle2 size={20} /> },
    { id: 2, title: 'Cocina', icon: <ChefHat size={20} /> },
    { id: 3, title: 'Listo', icon: <ShoppingBag size={20} /> },
    { id: 4, title: 'En Mesa', icon: <Utensils size={20} /> },
    { id: 5, title: 'Finalizado', icon: <Home size={20} /> }
  ] : [
    { id: 1, title: 'Recibido', icon: <CheckCircle2 size={20} /> },
    { id: 2, title: 'Cocina', icon: <ChefHat size={20} /> },
    { id: 3, title: 'Listo', icon: <ShoppingBag size={20} /> },
    { id: 4, title: isDelivery ? 'En Camino' : 'Entregando', icon: isDelivery ? <Truck size={20} /> : <ShoppingBag size={20} /> },
    { id: 5, title: 'Finalizado', icon: <Home size={20} /> }
  ];
  
  const visualSteps = progressSteps;

  const orderTimeMinutes = new Date(order.created_at).getMinutes();
  const estimatedMin = (orderTimeMinutes + 15) % 60;
  const estimatedHour = new Date(order.created_at).getHours() + Math.floor((orderTimeMinutes + 15)/60);
  const estimatedTimeStr = `${estimatedHour.toString().padStart(2, '0')}:${estimatedMin.toString().padStart(2, '0')}`;

  const fulfillmentText = isDineIn ? 'Consumo en local' : 
                          isTakeaway ? 'Para llevar' : 'Domicilio';
  
  const whatsappNumber = (restaurantSettings?.whatsapp_number_orders || "573138830171").replace(/[\s+]/g, '');
  const wppMessage = encodeURIComponent(`¡Hola! 👋 Envío el comprobante de pago de mi pedido #${order.id.slice(0,4).toUpperCase()} en ${brandName}. ✨`);


  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-[#E6B05C] selection:text-white pb-24">
      
      {/* HEADER NAVBAR */}
      <nav className="bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-black/5 shadow-sm">
        <button onClick={() => window.location.hash = '#menu'} className="w-10 h-10 shrink-0 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors text-black/70">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="font-extrabold text-lg leading-tight truncate">Pedido #{order.id.slice(0, 4).toUpperCase()}</h1>
          <p className="text-xs font-medium text-black/50 truncate">
            {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {fulfillmentText}
          </p>
        </div>
      </nav>

      <main className="container mx-auto max-w-2xl px-6 pt-8">
        
        {/* =========================================
            1. TRACKER DINÁMICO EXPRESIVO
        ========================================= */}
        {order.status === 'cancelled' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`rounded-[2.5rem] p-8 md:p-10 shadow-lg ${currentStatus.bg} ${currentStatus.border} border-2 mb-8 relative overflow-hidden flex flex-col items-center justify-center text-center`}
          >
             <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                className={`w-24 h-24 rounded-full bg-white flex items-center justify-center ${currentStatus.color} shadow-sm mb-6`}
              >
                {currentStatus.icon}
              </motion.div>
              <h2 className={`text-3xl font-black mb-2 ${currentStatus.text}`}>{currentStatus.label}</h2>
              <p className="text-sm font-medium text-black/60 max-w-[250px]">
                Este pedido ha sido cancelado y ya no está activo.
              </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border ${currentStatus.border} mb-8 relative overflow-hidden`}
          >
            {/* Fondo radiante expresivo según estado */}
            <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 ${currentStatus.glow}`} />
            <div className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 ${currentStatus.glow}`} />

            <div className="text-center mb-10 relative z-10 flex flex-col items-center">
              <motion.div 
                key={order.status}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
                className={`w-20 h-20 rounded-full ${currentStatus.bg} flex items-center justify-center ${currentStatus.color} shadow-sm mb-4`}
              >
                {currentStatus.icon}
              </motion.div>
              <h2 className={`text-3xl font-black mb-2 ${currentStatus.text}`}>
                {currentStatus.label}
              </h2>
              {order.status !== 'delivered' && (
                <p className="text-sm font-medium text-black/50 flex items-center justify-center gap-1.5 bg-black/5 px-4 py-1.5 rounded-full inline-flex">
                  <Clock size={14} /> Estimado: {estimatedTimeStr}
                </p>
              )}
            </div>

            {/* Progress Bar Visual Lineal */}
            <div className="relative flex justify-between items-center z-10 px-2 md:px-6">
              {/* Línea de fondo */}
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-black/5 -translate-y-1/2 z-0 rounded-full" />
              
              {/* Línea de progreso animada matemática */}
              <motion.div 
                className={`absolute top-1/2 left-4 h-1 -translate-y-1/2 z-0 rounded-full transition-colors duration-500 ${orderStepId >= 4 ? 'bg-green-500' : 'bg-[#E6B05C]'}`}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(0, Math.min(100, ((orderStepId - visualSteps[0].id) / (visualSteps[visualSteps.length - 1].id - visualSteps[0].id)) * 100))}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />

              {/* Puntos (Steps) dinámicos */}
              {visualSteps.map((step, idx) => {
                const isActive = orderStepId === step.id;
                const isPast = orderStepId > step.id;
                
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                    <motion.div 
                      animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                        isActive 
                          ? 'bg-white border-[#E6B05C] text-[#E6B05C] shadow-lg scale-110' 
                          : isPast 
                            ? (orderStepId >= 4 ? 'bg-green-500 border-green-500 text-white' : 'bg-[#E6B05C] border-[#E6B05C] text-white')
                            : 'bg-white border-black/10 text-black/20'
                      }`}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="text-center absolute -bottom-8 w-24">
                      <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${isActive || isPast ? 'text-[#1A1A1A]' : 'text-black/30'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="h-10" /> {/* Spacer para los textos de abajo */}

            {(order.status === 'waiting_payment' || order.status === 'new') && (
               <div className="mt-6 pt-4 border-t border-black/5 relative z-10 flex justify-center">
                 <button 
                   onClick={handleCancelOrder}
                   className="text-xs font-bold text-black/30 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5 py-2 px-4 rounded-full hover:bg-black/5"
                 >
                   <XIcon size={14} /> Cancelar Pedido
                 </button>
               </div>
            )}
          </motion.div>
        )}

        {/* =========================================
            ALERTA PAGO PENDIENTE (Si aplica)
        ========================================= */}
        {isPaymentPending && order.status !== 'cancelled' && order.status !== 'delivered' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-orange-200 mb-8 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 border border-orange-100">
                <Banknote size={24} />
              </div>
              <div className="w-full">
                <h4 className="font-extrabold text-[#1A1A1A] mb-1">Confirmación de Pago Pendiente</h4>
                <p className="text-xs font-medium text-black/60 mb-4 leading-relaxed max-w-[90%]">
                  Para iniciar la preparación de tu pedido, necesitamos confirmar tu pago. Por favor envía el comprobante a nuestro WhatsApp.
                </p>
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=${wppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  Enviar Comprobante
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================
            2. RESUMEN DEL PEDIDO (Compacto)
        ========================================= */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-black/5 mb-10"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/5">
            <ShoppingBag size={16} className="text-black/40" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Resumen</h3>
          </div>
          
          <div className="space-y-4 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-3">
                <div className="flex gap-3 min-w-0">
                  <div className="bg-black/5 text-black px-2 py-1 rounded text-xs font-bold h-fit shrink-0">
                    {item.quantity}x
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[#1A1A1A] truncate">{item.product?.name || 'Producto'}</h4>
                    {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                      <p className="text-[10px] font-medium text-black/40 mt-0.5 line-clamp-2">
                         {Object.entries(item.modifiers).map(([cat, val]) => `${translateGroup(cat)}: ${val}`).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-sm shrink-0 whitespace-nowrap">
                  ${(item.unit_price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-black/5">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-black/60">Total del Pedido</span>
              {order.service_fee > 0 && <span className="text-[10px] font-medium text-black/40">Incluye propina ${(order.service_fee).toLocaleString()}</span>}
            </div>
            <span className="font-extrabold text-xl">${(order.total_amount || 0).toLocaleString()}</span>
          </div>
        </motion.div>


      </main>
    </div>
  );
}
