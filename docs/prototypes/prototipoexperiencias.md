import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  ShoppingBag, 
  Star,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  Clock,
  User,
  Leaf,
  Calendar,
  Users,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// =========================================================================
// 🎛️ DATOS MOCK DE EXPERIENCIAS (Basados en tu imagen)
// =========================================================================
const experiencias = [
  {
    id: 1,
    title: "Cata de Cafés de Origen",
    date: "2026-03-08",
    duration: "90m",
    capacity: "12",
    price: "$ 85.000",
    img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800",
    tag: "Nuevo"
  },
  {
    id: 2,
    title: "Taller de Latte Art",
    date: "2026-03-09",
    duration: "120m",
    capacity: "8",
    price: "$ 120.000",
    img: "https://images.unsplash.com/photo-1541167760496-16295cb7c726?auto=format&fit=crop&q=80&w=800",
    tag: "Popular"
  },
  {
    id: 3,
    title: "Cena Ancestral Andina",
    date: "2026-03-14",
    duration: "180m",
    capacity: "20",
    price: "$ 180.000",
    img: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800",
    tag: "Exclusivo"
  }
];

const App = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  // --- ESTADO PARA LA INTEGRACIÓN CON GEMINI API ---
  const [eventQuery, setEventQuery] = useState('');
  const [eventResponse, setEventResponse] = useState('');
  const [isEventLoading, setIsEventLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- FUNCIÓN DE LLAMADA A GEMINI CON RETRY LÓGICO ---
  const callGemini = async (prompt) => {
    const apiKey = ""; // API Key proveída por el entorno
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const backoff = [1000, 2000, 4000, 8000, 16000]; 

    for (let i = 0; i < 6; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar tu solicitud.";
      } catch (error) {
        if (i === 5) return "Error de conexión con el conserje digital. Intenta más tarde.";
        await delay(backoff[i]);
      }
    }
  };

  const handleEventPlanner = async () => {
    if (!eventQuery) return;
    setIsEventLoading(true);
    const prompt = `Eres el 'Curador de Experiencias' de Alto Andino. Crea una propuesta de evento breve y moderna. Incluye: Nombre del evento y concepto de comida/espacio en 3 líneas máximo. Cliente dice: "${eventQuery}"`;
    const response = await callGemini(prompt);
    setEventResponse(response);
    setIsEventLoading(false);
  };

  // Variantes de animación
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans overflow-x-hidden selection:bg-[#E6B05C] selection:text-white">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          
          body { font-family: 'Outfit', sans-serif; }
          
          .glass-panel {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
          }

          .glass-dark {
            background: rgba(26, 36, 33, 0.6);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}
      </style>

      {/* Modern App Navbar (Floating & Dynamic) */}
      <nav className={`fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex justify-between items-center ${
        isScrolled 
          ? 'top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-white/95 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-full py-3 px-6 border border-white' 
          : 'top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl bg-white/80 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-full py-4 px-8 border border-white/50'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center">
            <Leaf size={16} className="text-[#E6B05C]" />
          </div>
          <span className="text-xl font-bold tracking-tight">Alto Andino</span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-[#1A1A1A]/70">
          <a href="#" className="hover:text-[#E6B05C] transition-colors">Inicio</a>
          <a href="#" className="hover:text-[#E6B05C] transition-colors">Menú</a>
          {/* Active Tab */}
          <a href="#" className="text-[#1A1A1A] font-bold bg-black/5 px-4 py-1.5 rounded-full">Experiencias</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer">
             <div className="flex items-center gap-2 bg-[#E6B05C] text-[#1A1A1A] px-4 py-2 rounded-full font-bold text-xs hover:bg-[#d49e4c] transition-colors shadow-md">
               <ShoppingBag size={14} />
               <span>Mi Pedido</span>
             </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-[#1A1A1A] text-white pl-3 pr-5 py-2 rounded-full shadow-md hover:bg-[#2a2a2a] transition-all cursor-pointer">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"><User size={12} /></div>
            <span className="text-xs font-bold">Mi Cuenta</span>
          </div>
        </div>
      </nav>

      {/* 🚀 HERO SECTION DE EXPERIENCIAS */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden rounded-b-[3rem] md:rounded-b-[4rem]">
        {/* Background Image with Parallax effect */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000" 
            alt="Experiencias Alto Andino" 
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A2421]/60 via-[#1A2421]/40 to-[#1A1A1A]/90" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mt-16">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="inline-flex items-center gap-2 glass-panel bg-white/10 text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 border border-white/20">
              <Sparkles size={12} className="text-[#E6B05C]" />
              Más allá de la carta
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
              Vive momentos <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E6B05C] to-[#f3d09a]">inolvidables</span>
            </h1>
            <p className="text-white/70 font-medium text-sm md:text-base leading-relaxed max-w-lg mx-auto">
              Eventos únicos, catas de café de especialidad y talleres interactivos. Descubre la esencia de Alto Andino.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 📅 GRID DE EVENTOS (Las Tarjetas Premium) */}
      <section className="py-24 px-6 lg:px-12 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#1A2421] text-white rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles size={18} />
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A]">Próximos Eventos</h2>
              </div>
              <p className="text-black/50 font-medium text-sm ml-14">Reserva tu cupo antes de que se agoten.</p>
            </div>
            
            <div className="flex gap-2">
               <button className="text-xs font-bold border-b-2 border-black/20 pb-1 hover:border-[#E6B05C] hover:text-[#E6B05C] transition-all">
                Ver calendario completo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experiencias.map((exp, idx) => (
              <motion.div 
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all border border-black/5 flex flex-col cursor-pointer"
              >
                {/* Imagen del Evento */}
                <div className="w-full h-56 md:h-64 mb-5 overflow-hidden rounded-[1.5rem] relative">
                  <img 
                    src={exp.img} 
                    alt={exp.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  {/* Gradiente oscuro sutil para que destaquen los tags */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Date Pill (Glassmorphism) */}
                  <div className="absolute top-4 right-4 glass-panel bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Calendar size={12} className="text-[#E6B05C]" />
                    <span className="text-[10px] font-bold tracking-widest text-[#1A1A1A]">{exp.date}</span>
                  </div>

                   {/* Status Tag */}
                   <div className="absolute top-4 left-4 bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                    {exp.tag}
                  </div>
                </div>
                
                {/* Contenido de la Tarjeta */}
                <div className="px-4 pb-4 flex flex-col flex-1">
                  <h3 className="font-extrabold text-xl mb-3 text-[#1A1A1A] group-hover:text-[#E6B05C] transition-colors">
                    {exp.title}
                  </h3>
                  
                  {/* Detalles (Duración y Capacidad) */}
                  <div className="flex items-center gap-4 text-xs font-medium text-black/50 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} /> <span>{exp.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} /> <span>Aforo: {exp.capacity}</span>
                    </div>
                  </div>

                  {/* Footer de la Tarjeta (Precio y Botón) */}
                  <div className="mt-auto flex justify-between items-center border-t border-black/5 pt-4">
                    <span className="font-extrabold text-2xl text-[#1A1A1A]">{exp.price}</span>
                    
                    {/* Botón de Acción tipo flecha */}
                    <button className="w-10 h-10 rounded-full bg-[#E6B05C] text-[#1A1A1A] flex items-center justify-center hover:scale-110 hover:bg-[#1A1A1A] hover:text-white transition-all shadow-lg shadow-[#E6B05C]/30">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🤖 SECCIÓN VIP: CURADOR DE EXPERIENCIAS AI */}
      <section className="py-20 px-6 lg:px-12 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-[#1A2421] rounded-[3rem] overflow-hidden flex flex-col md:flex-row relative shadow-[0_20px_60px_rgba(26,36,33,0.3)]">
            
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6B05C]/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4A7856]/30 rounded-full blur-[80px] pointer-events-none" />

            {/* Texto y Llamado a la Acción */}
            <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center relative z-10">
              <div className="inline-flex items-center gap-2 glass-dark px-4 py-2 rounded-full mb-6 self-start border border-white/10">
                <Sparkles size={14} className="text-[#E6B05C]" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Servicio VIP • Gemini AI</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                ¿Buscas algo <br/>más <span className="text-[#E6B05C]">Privado?</span>
              </h2>
              <p className="text-white/60 font-medium text-sm mb-10 leading-relaxed max-w-md">
                Cenas de aniversario, reuniones de equipo o cumpleaños. Describe la experiencia que tienes en mente y nuestro curador de IA diseñará una propuesta preliminar a tu medida.
              </p>
              
              <button 
                onClick={() => setIsEventModalOpen(true)}
                className="bg-[#E6B05C] text-[#1A1A1A] px-8 py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-white hover:scale-105 transition-all w-fit shadow-xl"
              >
                <Sparkles size={16} />
                Diseñar mi evento con IA
              </button>
            </div>

            {/* Imagen Lateral (Ocupa la mitad derecha) */}
            <div className="w-full md:w-1/2 h-[300px] md:h-auto relative">
              <img 
                src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=800" 
                className="w-full h-full object-cover" 
                alt="Eventos Privados" 
              />
              {/* Overlay suave para fusionar la imagen con el fondo oscuro */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A2421] to-transparent w-1/3" />
            </div>
          </div>
        </div>
      </section>

      {/* 🔮 MODAL: AI EVENT PLANNER (Reutilizado del main) */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-0 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative mt-auto md:mt-0 md:h-auto border border-white/20"
            >
              <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-8 md:hidden" />
              
              <button onClick={() => setIsEventModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 bg-black/5 rounded-full flex items-center justify-center text-black/50 hover:bg-black/10 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
              
              <div className="w-12 h-12 bg-[#E6B05C]/20 text-[#E6B05C] rounded-full flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              
              <h3 className="text-2xl font-extrabold mb-2 text-[#1A1A1A]">Curador de Experiencias</h3>
              <p className="text-sm font-medium text-black/50 mb-6">
                Describe tu evento ideal. Por ejemplo: <br/> <span className="italic">"Cena íntima para 4 amigas, nos gusta el vino y la comida ligera."</span>
              </p>

              <textarea 
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
                placeholder="Escribe tu idea aquí..."
                className="w-full bg-[#FAFAFA] border border-black/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[#E6B05C] focus:ring-1 focus:ring-[#E6B05C] transition-all resize-none h-32 mb-6 font-medium text-[#1A1A1A] placeholder:text-black/30"
              />

              <button 
                onClick={handleEventPlanner}
                disabled={isEventLoading || !eventQuery}
                className="w-full bg-[#1A1A1A] text-white py-4 rounded-full font-bold text-sm hover:bg-[#2a2a2a] transition-all disabled:opacity-50 flex justify-center shadow-lg gap-2"
              >
                {isEventLoading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} className="text-[#E6B05C]"/> Generar Propuesta Mágica</>}
              </button>

              <AnimatePresence>
                {eventResponse && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    className="bg-[#FAFAFA] border border-[#E6B05C]/20 p-5 rounded-2xl text-left shadow-inner relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#E6B05C]" />
                    <p className="text-sm font-medium leading-relaxed text-[#1A1A1A] italic">"{eventResponse}"</p>
                    
                    <button className="mt-4 flex items-center gap-1 text-[10px] uppercase font-bold text-[#E6B05C] tracking-widest hover:text-[#1A1A1A] transition-colors">
                      Contactar para agendar <ArrowUpRight size={12} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern App Footer (Reutilizado) */}
      <footer className="bg-[#1A2421] text-white pt-20 pb-10 px-6 lg:px-12 rounded-t-[3rem] md:rounded-t-[4rem] mt-10">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Leaf size={20} className="text-[#1A2421]" />
                </div>
                <span className="text-2xl font-extrabold tracking-tight">Alto Andino</span>
              </div>
              <p className="text-white/50 font-medium text-sm max-w-sm leading-relaxed mb-8">
                Elevando la experiencia de la comida saludable. Raíces locales, nutrición consciente y un espacio para respirar en la ciudad.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Visítanos</h4>
              <ul className="space-y-4 text-sm text-white/60 font-medium">
                <li>Calle 93B #12-34</li>
                <li>Chicó Norte, Bogotá</li>
                <li className="pt-2 text-[#E6B05C] hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <MapPin size={16} /> Abrir en Maps
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">Horarios</h4>
              <ul className="space-y-4 text-sm text-white/60 font-medium">
                <li className="flex justify-between"><span>Lun - Sáb</span> <span>7:00 - 21:00</span></li>
                <li className="flex justify-between"><span>Dom - Fes</span> <span>8:00 - 18:00</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/40">
            <p>© {new Date().getFullYear()} Alto Andino Café. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;