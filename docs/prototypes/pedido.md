import React, { useState, useEffect } from 'react';
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
  MapPin,
  Info,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  // --- ESTADO DEL PEDIDO ---
  // Niveles: 1 (Recibido), 2 (Preparando), 3 (Listo/Entregado)
  const [orderStep, setOrderStep] = useState(1);
  
  // Datos mock del pedido actual
  const orderDetails = {
    id: '#C7DF',
    time: '14:30',
    type: 'Para llevar',
    items: [
      { qty: 1, name: 'Poke Hawaiano', price: '$30.000', desc: 'Base: Quinoa • Proteína: Salmón • Toppings: Mango' },
      { qty: 1, name: 'Kombucha Frutos Rojos', price: '$12.000', desc: '' }
    ],
    total: '$42.000',
    earnedSeeds: 420
  };

  // --- ESTADO IA (Dato Curioso) ---
  const [aiTrivia, setAiTrivia] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(true);

  useEffect(() => {
    // 1. Simular el avance del pedido para la demo
    const timer1 = setTimeout(() => setOrderStep(2), 4000);
    const timer2 = setTimeout(() => setOrderStep(3), 10000);

    // 2. Cargar el dato curioso de la IA
    fetchTrivia();

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  // --- FUNCIÓN GEMINI ---
  const callGemini = async (prompt) => {
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error();
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "La quinoa era considerada el 'oro de los Incas'.";
      } catch (error) {
        if (i === 2) return "El salmón de tu Poke es rico en Omega-3, ideal para tu cerebro.";
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  const fetchTrivia = async () => {
    setIsAiLoading(true);
    const prompt = `Eres la IA de Alto Andino. El cliente acaba de pedir un "Poke con Quinoa y Salmón". Genera un (1) dato curioso, elegante y muy breve (máximo 12 palabras) sobre los beneficios de la quinoa o el salmón.`;
    const response = await callGemini(prompt);
    setAiTrivia(response);
    setIsAiLoading(false);
  };

  // Helpers para la UI del Tracker
  const steps = [
    { id: 1, title: 'Recibido', icon: <CheckCircle2 size={20} />, time: '14:30' },
    { id: 2, title: 'En Cocina', icon: <ChefHat size={20} />, time: '14:35' },
    { id: 3, title: '¡Listo!', icon: <ShoppingBag size={20} />, time: '14:45' }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-[#E6B05C] selection:text-white pb-10">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          body { font-family: 'Outfit', sans-serif; }
          .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); }
        `}
      </style>

      {/* HEADER NAVBAR */}
      <nav className="bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-50 border-b border-black/5 shadow-sm">
        <button className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-extrabold text-lg leading-tight">Pedido {orderDetails.id}</h1>
          <p className="text-xs font-medium text-black/50">{orderDetails.time} • {orderDetails.type}</p>
        </div>
      </nav>

      <main className="container mx-auto max-w-2xl px-6 pt-8">
        
        {/* =========================================
            1. TRACKER DINÁMICO DE ESTADO
        ========================================= */}
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
              {orderStep === 1 ? 'Pedido Confirmado' : orderStep === 2 ? 'Preparando tu comida' : '¡Tu pedido está listo!'}
            </h2>
            <p className="text-sm font-medium text-black/50 flex items-center justify-center gap-1.5">
              <Clock size={14} /> Estimado: {steps[2].time}
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
            {steps.map((step, idx) => {
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
        </motion.div>

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
            {orderDetails.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="bg-black/5 text-black px-2 py-1 rounded text-xs font-bold h-fit">{item.qty}x</div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1A1A1A]">{item.name}</h4>
                    {item.desc && <p className="text-[10px] font-medium text-black/40 mt-0.5">{item.desc}</p>}
                  </div>
                </div>
                <span className="font-bold text-sm">{item.price}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-black/5">
            <span className="font-bold text-sm text-black/60">Total Pagado</span>
            <span className="font-extrabold text-xl">{orderDetails.total}</span>
          </div>
        </motion.div>

        {/* =========================================
            3. "MIENTRAS ESPERAS" (Revista / Engagement)
        ========================================= */}
        <div className="mb-6 flex items-center gap-2 px-2">
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
            <div className="absolute right-0 top-0 opacity-20 transform translate-x-1/4 -translate-y-1/4">
              <Leaf size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1 opacity-90">¡Suma y Sigue!</p>
              <h4 className="text-xl md:text-2xl font-extrabold">Ganaste +{orderDetails.earnedSeeds} Semillas</h4>
              <p className="text-xs font-medium opacity-80 mt-1">Tu balance se actualizará al entregar el pedido.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center relative z-10">
              <Leaf size={24} />
            </div>
          </motion.div>

          {/* Card 2: CTA de Experiencias (NUEVO) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-[1.5rem] overflow-hidden relative group cursor-pointer shadow-sm border border-black/5 h-48 md:h-auto"
          >
            <img 
              src="https://images.unsplash.com/photo-1541167760496-16295cb7c726?auto=format&fit=crop&q=80&w=600" 
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
              <p className="text-white/70 text-xs font-medium flex items-center gap-1">
                Reserva tu cupo <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </motion.div>

          {/* Card 3: Dato Curioso (Gemini AI) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#1A2421] rounded-[1.5rem] p-5 text-white shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <Info size={12} className="text-[#E6B05C]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">El Dato Andino</span>
            </div>
            {isAiLoading ? (
              <div className="flex items-center gap-2 text-white/50 py-2"><Loader2 size={16} className="animate-spin" /></div>
            ) : (
              <p className="font-medium text-sm md:text-base leading-relaxed italic pr-4">"{aiTrivia}"</p>
            )}
          </motion.div>

          {/* Card 4: Playlist / Vibe */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white border border-black/5 rounded-[1.5rem] p-5 flex flex-col justify-between group cursor-pointer hover:border-green-500 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#1ED760]/10 flex items-center justify-center text-[#1ED760] mb-4 group-hover:bg-[#1ED760] group-hover:text-white transition-colors">
              <Music size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1A1A1A] text-lg leading-tight mb-1">Vibe Andino</h4>
              <p className="text-xs font-medium text-black/50 flex items-center justify-between">
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
              alt="Café"
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
};

export default App;

Order Tracking Screen