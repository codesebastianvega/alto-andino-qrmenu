import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { translateGroup } from '../utils/formatters';
import { useMenuData } from '../context/MenuDataContext';
import { 
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  Clock,
  Leaf,
  Sparkles,
  ChevronRight,
  Music,
  BookOpen,
  Info,
  Loader2,
  AlertCircle,
  XIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderStatus({ orderId }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { experiences } = useMenuData();

  // --- ESTADO IA (Dato Curioso) ---
  const [aiTrivia, setAiTrivia] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [triviaFetched, setTriviaFetched] = useState(false);

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

  useEffect(() => {
    if (items.length > 0 && !triviaFetched) {
      fetchTrivia(items);
      setTriviaFetched(true);
    }
  }, [items, triviaFetched]);

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

  // --- FUNCIÓN GEMINI ---
  const callGemini = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    
    try {
      const response = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      console.error("Error with Gemini API:", error);
      return null;
    }
  };

  const fetchTrivia = async (orderItems) => {
    setIsAiLoading(true);
    try {
      const randomItem = orderItems[Math.floor(Math.random() * orderItems.length)];
      const itemName = randomItem?.product?.name || "Café";
      
      const prompt = `Eres la IA interactiva de un restaurante andino llamado Alto Andino. El cliente acaba de pedir un "${itemName}". Genera un (1) dato curioso, elegante y muy breve (máximo 15 palabras) sobre este producto o sus ingredientes. Hazlo sonar sofisticado.`;
      
      const response = await callGemini(prompt);
      
      if (response) {
        // Limpiamos comillas extrañas que la IA pueda poner a veces
        setAiTrivia(response.replace(/^"|"$/g, ''));
      } else {
        // Fallback natural
        setAiTrivia(`El ingrediente principal de tu ${itemName} fue seleccionado cuidadosamente por nuestros chefs.`);
      }
    } catch (err) {
      setAiTrivia("El fuego de nuestra cocina transforma cada ingrediente en una experiencia única para ti.");
    } finally {
      setIsAiLoading(false);
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

  // --- LOGIC PARA TRACKER DINÁMICO ---
  const getOrderStep = (status) => {
    if (status === 'cancelled') return 0;
    if (status === 'waiting_payment' || status === 'new') return 1;
    if (status === 'preparing') return 2;
    if (status === 'ready' || status === 'delivered') return 3;
    return 1;
  };

  const orderStep = getOrderStep(order.status);
  
  const stepsConfig = [
    { id: 1, title: 'Recibido', icon: <CheckCircle2 size={20} />, time: new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, title: 'En Cocina', icon: <ChefHat size={20} />, time: '...' },
    { id: 3, title: '¡Listo!', icon: <ShoppingBag size={20} />, time: '...' }
  ];

  const orderTimeMinutes = new Date(order.created_at).getMinutes();
  const estimatedMin = (orderTimeMinutes + 15) % 60;
  const estimatedHour = new Date(order.created_at).getHours() + Math.floor((orderTimeMinutes + 15)/60);
  const estimatedTimeStr = `${estimatedHour.toString().padStart(2, '0')}:${estimatedMin.toString().padStart(2, '0')}`;

  const fulfillmentText = order.fulfillment_type === 'dine_in' ? 'Consumo en local' : 
                          order.fulfillment_type === 'takeaway' ? 'Para llevar' : 'Domicilio';
  
  const whatsappNumber = "573138830171"; // Reemplaza con número real del local
  const wppMessage = encodeURIComponent(`Hola! Acabo de hacer el pedido #${order.id.slice(0,4).toUpperCase()}. Envío mi comprobante de pago.`);

  // Semillas estimadas (Ejemplo simple: 1 semilla por cada 100 pesos)
  const earnedSeeds = Math.floor(order.total_amount / 100);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-[#E6B05C] selection:text-white pb-24">
      
      {/* HEADER NAVBAR */}
      <nav className="bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-black/5 shadow-sm">
        <button onClick={() => window.location.href = '/'} className="w-10 h-10 shrink-0 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors text-black/70">
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
            1. TRACKER DINÁMICO DE ESTADO
        ========================================= */}
        {order.status === 'cancelled' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-red-100 mb-8 relative overflow-hidden"
          >
            <div className="text-center relative z-10 w-full flex flex-col items-center">
              <span className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                <AlertCircle size={32} />
              </span>
              <h2 className="text-2xl font-extrabold mb-2 text-red-600">Pedido Cancelado</h2>
              <p className="text-sm font-medium text-black/50 text-center">
                Este pedido ha sido cancelado y ya no está activo.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-black/5 mb-8 relative overflow-hidden"
          >
            {/* Fondo sutil según estado */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 ${
              orderStep === 1 ? 'bg-blue-500/5' : orderStep === 2 ? 'bg-[#E6B05C]/15' : 'bg-[#4A7856]/15'
            }`} />

            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-extrabold mb-1">
                {orderStep === 1 ? 'Pedido Confirmado' : orderStep === 2 ? 'Preparando tu tu comida' : 
                 order.fulfillment_type === 'dine_in' ? '¡Va en camino a la mesa!' :
                 order.fulfillment_type === 'takeaway' ? '¡Listo para recoger!' : '¡En camino!'}
              </h2>
              <p className="text-sm font-medium text-black/50 flex items-center justify-center gap-1.5">
                <Clock size={14} /> Estimado: {estimatedTimeStr}
              </p>
            </div>

            {/* Progress Bar Visual */}
            <div className="relative flex justify-between items-center z-10 px-2 md:px-8">
              {/* Línea de fondo */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-black/5 -translate-y-1/2 z-0 rounded-full" />
              
              {/* Línea de progreso animada */}
              <motion.div 
                className="absolute top-1/2 left-0 h-1 bg-[#4A7856] -translate-y-1/2 z-0 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: orderStep === 1 ? '0%' : orderStep === 2 ? '50%' : '100%' }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />

              {/* Puntos (Steps) */}
              {stepsConfig.map((step, idx) => {
                const isActive = orderStep === step.id;
                const isPast = orderStep > step.id;
                
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                    <motion.div 
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${
                        isActive 
                          ? 'bg-white border-[#4A7856] text-[#4A7856] shadow-lg' 
                          : isPast 
                            ? 'bg-[#4A7856] border-[#4A7856] text-white'
                            : 'bg-white border-black/10 text-black/20'
                      }`}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="text-center absolute -bottom-8 w-24">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive || isPast ? 'text-[#1A1A1A]' : 'text-black/30'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="h-8" /> {/* Spacer para los textos de abajo */}

            {(order.status === 'waiting_payment' || order.status === 'new') && (
              <div className="mt-8 pt-6 border-t border-black/5 relative z-10 flex justify-center">
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
        {order.status === 'waiting_payment' && (order.fulfillment_type === 'takeaway' || order.fulfillment_type === 'delivery') && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-orange-100 mb-8"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <Info size={20} />
              </div>
              <div className="w-full">
                <h4 className="font-extrabold text-[#1A1A1A] mb-1">Confirmación de Pago Pendiente</h4>
                <p className="text-xs font-medium text-black/60 mb-4 leading-relaxed">
                  Para iniciar la preparación de tu pedido, necesitamos confirmar tu pago.
                </p>
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=${wppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
              <span className="font-bold text-sm text-black/60">Total Pagado</span>
              {order.service_fee > 0 && <span className="text-[10px] font-medium text-black/40">Incluye propina ${(order.service_fee).toLocaleString()}</span>}
            </div>
            <span className="font-extrabold text-xl">${(order.total_amount || 0).toLocaleString()}</span>
          </div>
        </motion.div>

        {/* =========================================
            3. "MIENTRAS ESPERAS" (Revista / Engagement)
        ========================================= */}
        <div className="mb-6 flex flex-wrap items-center gap-2 px-2">
          <Sparkles size={16} className="text-[#E6B05C]" />
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A1A1A]">Cosas interesantes mientras esperas</h3>
        </div>

        {/* Grid de Contenido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Recompensa de Semillas (Dopamina Visual) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="md:col-span-2 bg-gradient-to-r from-[#E6B05C] to-[#d49e4c] rounded-[1.5rem] p-5 md:p-6 text-[#1A1A1A] flex items-center justify-between shadow-lg relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 opacity-20 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
              <Leaf size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1 opacity-90">¡Suma y Sigue!</p>
              <h4 className="text-xl md:text-2xl font-extrabold leading-tight">Ganaste +{earnedSeeds} Semillas</h4>
              <p className="text-xs font-medium opacity-80 mt-1">Tu balance se actualizará al entregar el pedido.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center relative z-10 shrink-0 shadow-sm ml-4">
              <Leaf size={24} className="text-[#1A1A1A]" />
            </div>
          </motion.div>

          {/* Card 2: CTA de Experiencias (Usando Data Real si hay) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            onClick={() => window.location.href = '/experiencias'}
            className="rounded-[1.5rem] overflow-hidden relative group cursor-pointer shadow-sm border border-black/5 h-48 md:h-auto"
          >
            <img 
              src={experiences?.[0]?.image_url || "https://images.unsplash.com/photo-1541167760496-16295cb7c726?auto=format&fit=crop&q=80&w=600"} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              alt="Experiencias Alto Andino"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A2421]/90 via-[#1A2421]/30 to-transparent" />
            
            <div className="absolute inset-0 p-5 flex flex-col justify-end z-10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={12} className="text-[#E6B05C]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#E6B05C]">Experiencias</span>
              </div>
              <h4 className="text-white font-extrabold text-lg leading-tight mb-1">
                Catas y Talleres
              </h4>
              <p className="text-white/70 text-xs font-medium flex items-center gap-1 group-hover:text-white transition-colors">
                Reserva tu cupo <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </motion.div>

          {/* Card 3: Dato Curioso (Gemini AI) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#1A2421] rounded-[1.5rem] p-5 text-white shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-md transition-shadow md:min-h-[192px]"
          >
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Info size={12} className="text-[#E6B05C]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">El Dato Andino</span>
              </div>
              {isAiLoading ? (
                <div className="flex items-center gap-2 text-white/50 py-2 mt-auto mb-2"><Loader2 size={16} className="animate-spin" /></div>
              ) : (
                <p className="font-medium text-sm md:text-base leading-relaxed italic pr-2">"{aiTrivia}"</p>
              )}
            </div>
          </motion.div>

          {/* Card 4: Playlist / Vibe */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white border border-black/5 rounded-[1.5rem] p-5 flex flex-col justify-between group cursor-pointer hover:border-[#1ED760]/30 hover:shadow-md transition-all h-32 md:h-auto"
          >
            <div className="w-10 h-10 rounded-full bg-[#1ED760]/10 flex items-center justify-center text-[#1ED760] mb-4 group-hover:bg-[#1ED760] group-hover:text-white transition-colors">
              <Music size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1A1A1A] text-lg leading-tight mb-1">Vibe Andino</h4>
              <p className="text-xs font-medium text-black/50 flex items-center justify-between group-hover:text-[#1A1A1A] transition-colors">
                Escucha nuestra playlist <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </motion.div>

          {/* Card 5: Blog / Noticias (Estilo Revista) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="rounded-[1.5rem] overflow-hidden relative h-40 md:h-auto group cursor-pointer shadow-sm border border-black/5"
          >
            <img 
              src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              alt="Noticias de Café"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} className="text-[#E6B05C]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#E6B05C]">Noticias</span>
              </div>
              <h4 className="text-white font-extrabold text-lg leading-tight w-full">
                Conoce a las familias detrás de nuestro café
              </h4>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
