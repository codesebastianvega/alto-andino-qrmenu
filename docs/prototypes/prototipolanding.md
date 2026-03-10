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
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// =========================================================================
// 🎛️ PANEL DE ADMINISTRADOR (MOCK)
// Aquí es donde tú (el dueño) configurarás la página para validar el MVP
// sin necesidad de una base de datos compleja todavía.
// =========================================================================
const adminConfig = {
  heroDishes: [
    { 
      category: "Pokes",
      name: "Poke Andino", 
      rating: "4.9", 
      prepTime: "10-15 mins", 
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200" 
    },
    { 
      category: "Bowls",
      name: "Sunrise Bowl", 
      rating: "4.8", 
      prepTime: "5-10 mins", 
      img: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&q=80&w=1200" 
    },
    { 
      category: "Café",
      name: "Filtrado de Origen", 
      rating: "4.9", 
      prepTime: "5 mins", 
      img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1200" 
    },
    { 
      category: "Postres",
      name: "Tarta de Higo", 
      rating: "4.7", 
      prepTime: "15 mins", 
      img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=1200" 
    }
  ],
  reviews: [
    { 
      name: "Dra. Elena R.", role: "Médico", rating: 5, 
      text: "El ambiente perfecto para desconectar después del hospital. El Poke Andino es mi favorito absoluto.", 
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150" 
    },
    { 
      name: "Carlos M.", role: "Emprendedor", rating: 5, 
      text: "Excelente WiFi y el café filtrado es de otro nivel. Vengo a trabajar dos veces por semana.", 
      img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" 
    },
    { 
      name: "Ana & Max", role: "Pet Lovers", rating: 5, 
      text: "A Max (mi golden) le encanta Cocoa, el perrito anfitrión. El mejor lugar pet-friendly de la zona.", 
      img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
    }
  ]
};
// =========================================================================

const App = () => {
  const [activeCategory, setActiveCategory] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [heroDishIndex, setHeroDishIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    // Scroll listener para el navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Seleccionar un plato aleatorio al cargar y sincronizar la categoría
    const randomIndex = Math.floor(Math.random() * adminConfig.heroDishes.length);
    setHeroDishIndex(randomIndex);
    setActiveCategory(adminConfig.heroDishes[randomIndex].category);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para capturar el movimiento del mouse para el efecto Parallax
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    // Calculamos el centro de la pantalla y la desviación (max 30px)
    const x = (clientX / innerWidth - 0.5) * 40; 
    const y = (clientY / innerHeight - 0.5) * 40;
    setMousePosition({ x, y });
  };

  // Filtrar el plato al hacer click en la categoría
  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
    const dishIndex = adminConfig.heroDishes.findIndex(dish => dish.category === categoryName);
    if (dishIndex !== -1) {
      setHeroDishIndex(dishIndex);
    }
  };

  const currentHeroDish = adminConfig.heroDishes[heroDishIndex];
  
  // --- ESTADO PARA LA INTEGRACIÓN CON GEMINI API ---
  const [conciergeQuery, setConciergeQuery] = useState('');
  const [conciergeResponse, setConciergeResponse] = useState('');
  const [isConciergeLoading, setIsConciergeLoading] = useState(false);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventQuery, setEventQuery] = useState('');
  const [eventResponse, setEventResponse] = useState('');
  const [isEventLoading, setIsEventLoading] = useState(false);

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

  const handleConcierge = async () => {
    if (!conciergeQuery) return;
    setIsConciergeLoading(true);
    const prompt = `Eres el 'Conserje Gastronómico' del restaurante premium Alto Andino. Tono: casual pero experto, moderno. Menú: 1. Poke Andino (Salmón, quinua, aguacate). 2. Sunrise Bowl (Acai, granola). 3. Ensalada Bosque. Cliente dice: "${conciergeQuery}". Recomienda un plato y explica por qué en máximo 2 líneas impactantes.`;
    const response = await callGemini(prompt);
    setConciergeResponse(response);
    setIsConciergeLoading(false);
  };

  const handleEventPlanner = async () => {
    if (!eventQuery) return;
    setIsEventLoading(true);
    const prompt = `Eres el 'Curador de Experiencias' de Alto Andino. Crea una propuesta de evento breve y moderna. Incluye: Nombre del evento y concepto de comida/espacio en 3 líneas máximo. Cliente dice: "${eventQuery}"`;
    const response = await callGemini(prompt);
    setEventResponse(response);
    setIsEventLoading(false);
  };

  const categories = [
    { name: 'Pokes', icon: '🍲', price: '$34k' },
    { name: 'Bowls', icon: '🥗', price: '$28k' },
    { name: 'Café', icon: '☕', price: '$8k' },
    { name: 'Postres', icon: '🍰', price: '$15k' }
  ];

  // Variantes para animación en cascada del título
  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    })
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

          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
          <a href="#" className="text-[#1A1A1A] font-bold">Inicio</a>
          <a href="#menu" className="hover:text-[#E6B05C] transition-colors">Menú</a>
          <a href="#experiencias" className="hover:text-[#E6B05C] transition-colors">Experiencias</a>
          <a href="#ubicacion" className="hover:text-[#E6B05C] transition-colors">Ubicación</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-black/5 rounded-full transition-colors hidden sm:block"><Search size={20} /></button>
          <div className="relative">
            <button className="p-2 hover:bg-black/5 rounded-full transition-colors"><ShoppingBag size={20} /></button>
            <span className="absolute top-0 right-0 w-4 h-4 bg-[#E6B05C] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">2</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-[#1A1A1A] text-white pl-3 pr-5 py-2 rounded-full shadow-md hover:bg-[#2a2a2a] transition-all cursor-pointer">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"><User size={12} /></div>
            <span className="text-xs font-bold">Sign in</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center pt-20 overflow-hidden"
        onMouseMove={handleMouseMove} // Captura movimiento del mouse para Parallax
      >
        {/* Elegant App-card background on the right */}
        <div className="absolute top-4 right-4 bottom-4 w-full md:w-[45%] bg-[#1A2421] rounded-[3rem] z-0 hidden md:block overflow-hidden shadow-2xl">
           <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#E6B05C]/15 rounded-full blur-[80px]" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[60px]" />
        </div>
        <div className="absolute top-0 right-0 w-full h-[45%] bg-[#1A2421] rounded-b-[3rem] z-0 md:hidden overflow-hidden">
           <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#E6B05C]/15 rounded-full blur-[50px]" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col md:flex-row items-center h-full gap-12">
          
          {/* Left Content */}
          <div className="flex-1 mt-32 md:mt-0 w-full order-2 md:order-1 relative z-30">
            <div className="max-w-md lg:max-w-lg">
              {/* Animación en Cascada del Título */}
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 flex flex-col">
                <motion.span custom={1} variants={titleVariants} initial="hidden" animate="visible">
                  Descubre tus
                </motion.span>
                <motion.span custom={2} variants={titleVariants} initial="hidden" animate="visible" className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A1A1A] to-[#6b6b6b] md:from-[#1A1A1A] md:to-[#1A1A1A] mt-1">
                  platos favoritos
                </motion.span>
              </h1>
              
              <motion.p 
                custom={3} variants={titleVariants} initial="hidden" animate="visible"
                className="text-[#1A1A1A]/50 font-medium text-sm md:text-base max-w-md mb-8 leading-relaxed"
              >
                Ingredientes locales, nutrición premium y el toque artesanal de nuestra cocina andina, directo a tu mesa.
              </motion.p>

              {/* Categories Slider */}
              <motion.div 
                custom={4} variants={titleVariants} initial="hidden" animate="visible"
                className="flex items-center gap-4 mb-10 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0"
              >
                <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 text-black/30 hover:text-black hover:shadow-md transition-all">
                  <ChevronLeft size={20} />
                </button>
                {categories.map((cat, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`shrink-0 flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer transition-all duration-300 border ${
                      activeCategory === cat.name 
                        ? 'bg-white border-transparent shadow-[0_8px_20px_rgba(0,0,0,0.08)] scale-105' 
                        : 'bg-transparent border-black/10 hover:border-black/30 opacity-70'
                    }`}
                  >
                    <span className="text-xl bg-[#F4F0EA] w-8 h-8 rounded-full flex items-center justify-center">{cat.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{cat.name}</span>
                      <span className="text-[10px] text-black/50 font-semibold">{cat.price}</span>
                    </div>
                  </div>
                ))}
                <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 text-black/30 hover:text-black hover:shadow-md transition-all">
                  <ChevronRight size={20} />
                </button>
              </motion.div>

              {/* Order Button area */}
              <motion.div custom={5} variants={titleVariants} initial="hidden" animate="visible" className="flex items-center gap-6">
                <button className="bg-[#1A1A1A] hover:bg-[#2a2a2a] text-white pl-2 pr-8 py-2 rounded-full flex items-center gap-4 transition-transform hover:scale-105 active:scale-95 shadow-xl">
                  <div className="bg-[#E6B05C] w-10 h-10 rounded-full flex items-center justify-center text-black">
                    <ShoppingBag size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-sm">Ordenar Ahora</span>
                </button>
              </motion.div>
            </div>
          </div>

          {/* Right Content (Plato Gigante & Efecto Parallax) */}
          <div className="flex-1 relative w-full h-[400px] md:h-screen flex items-center justify-center md:justify-end order-1 md:order-2">
            
            {/* Wrapper Principal de Parallax */}
            <motion.div 
              // Movimiento opuesto al mouse
              animate={{ x: mousePosition.x * -1, y: mousePosition.y * -1 }}
              transition={{ type: "spring", stiffness: 100, damping: 30 }}
              className="relative w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] md:w-[700px] md:h-[700px] md:translate-x-24 lg:translate-x-32"
            >
              
              {/* Animación de entrada/salida del plato */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHeroDish.name}
                  initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotate: 20 }}
                  transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                  className="w-full h-full absolute inset-0"
                >
                  <img 
                    src={currentHeroDish.img} 
                    alt={currentHeroDish.name} 
                    className="w-full h-full object-cover rounded-full shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-[12px] border-white/10"
                  />
                  
                  {/* Floating Badge */}
                  <div className="absolute bottom-4 left-0 md:bottom-28 md:left-4 lg:bottom-32 lg:-left-8 glass-panel bg-white/90 px-6 py-4 rounded-2xl flex flex-col gap-1 shadow-2xl backdrop-blur-xl border border-white/80 z-20">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-extrabold text-[#1A1A1A]">{currentHeroDish.name}</span>
                      <div className="flex items-center gap-1 text-[#E6B05C] bg-[#E6B05C]/10 px-2 py-0.5 rounded-full">
                        <Star size={12} fill="currentColor" />
                        <span className="text-[10px] font-bold">{currentHeroDish.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-black/60 text-xs font-medium">
                      <Clock size={12} />
                      <span>{currentHeroDish.prepTime} prep</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

            </motion.div>

            {/* Floating Element 1 (Burbuja Glassmorphism) */}
            <motion.div
              // Parallax secundario (más rápido y misma dirección)
              animate={{ x: mousePosition.x * 1.5, y: mousePosition.y * 1.5 }}
              transition={{ type: "spring", stiffness: 100, damping: 30 }}
              className="absolute top-16 right-10 md:top-32 md:right-32 z-10"
            >
              <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="w-16 h-16 glass-panel rounded-full shadow-2xl flex items-center justify-center text-3xl border border-white/60 bg-white/40 backdrop-blur-lg"
              >
                🥑
              </motion.div>
            </motion.div>
            
            {/* Floating Element 2 (Burbuja Glassmorphism) */}
            <motion.div
              // Parallax secundario (más rápido y misma dirección)
              animate={{ x: mousePosition.x * 2, y: mousePosition.y * 2 }}
              transition={{ type: "spring", stiffness: 100, damping: 30 }}
              className="absolute top-1/2 -left-4 md:left-4 lg:-left-12 z-10"
            >
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }}
                className="w-14 h-14 glass-panel rounded-full shadow-2xl flex items-center justify-center text-2xl border border-white/60 bg-white/40 backdrop-blur-lg"
              >
                🌿
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- AI CONCIERGE (Style: Image 1 Dark Glassmorphism) --- */}
      <section className="py-24 px-6 lg:px-12 bg-white relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#1A2421]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl">
          <div className="bg-[#1A2421] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
            {/* Ambient glows inside card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6B05C]/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4A7856]/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 mb-6">
                  <Sparkles size={14} className="text-[#E6B05C]" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Powered by Gemini AI</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                  Taste the Best <br/>that <span className="text-[#E6B05C]">Surprise you</span>
                </h2>
                <p className="text-white/50 text-sm md:text-base font-medium mb-8 leading-relaxed max-w-sm">
                  Nuestro Conserje Gastronómico analiza tu antojo o nivel de energía y encuentra el plato perfecto en nuestro menú.
                </p>

                {/* Glass Input Area */}
                <div className="glass-dark p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-2xl">
                  <input 
                    type="text" 
                    value={conciergeQuery}
                    onChange={(e) => setConciergeQuery(e.target.value)}
                    placeholder="Ej: Necesito algo fresco y alto en proteína..."
                    className="flex-1 bg-transparent px-4 py-3 text-sm text-white focus:outline-none placeholder:text-white/30 font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleConcierge()}
                  />
                  <button 
                    onClick={handleConcierge}
                    disabled={isConciergeLoading || !conciergeQuery}
                    className="bg-[#E6B05C] text-[#1A1A1A] px-6 py-3 rounded-xl text-sm font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                  >
                    {isConciergeLoading ? <Loader2 size={16} className="animate-spin" /> : 'Descubrir'}
                  </button>
                </div>
              </div>

              {/* Response Card Area */}
              <div className="h-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {conciergeResponse ? (
                    <motion.div 
                      key="response"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      className="glass-dark w-full p-8 rounded-[2rem] relative"
                    >
                      <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#E6B05C] rounded-full flex items-center justify-center shadow-lg text-[#1A1A1A]">
                        <Sparkles size={20} />
                      </div>
                      <p className="text-white text-lg font-medium leading-relaxed italic">
                        "{conciergeResponse}"
                      </p>
                      <button className="mt-6 text-[11px] font-bold text-[#E6B05C] uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2">
                        Ver este plato en el menú <ArrowRight size={14} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="w-full aspect-square md:aspect-auto md:h-full border-2 border-dashed border-white/10 rounded-[2rem] flex items-center justify-center text-white/20 p-8 text-center"
                    >
                      <span className="font-medium">Haz una petición para ver la magia.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Menu Carousel (Like Image 1 Bottom) */}
      <section id="menu" className="py-12 px-6 lg:px-12 bg-white">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-extrabold mb-2 text-[#1A1A1A]">Must Try</h2>
              <p className="text-black/50 font-medium text-sm">Los favoritos de nuestra comunidad.</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><ChevronLeft size={20} /></button>
              <button className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-10">
            {[
              { name: "Sunrise Bowl", img: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&q=80&w=400", price: "$28.00" },
              { name: "Green Salad", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400", price: "$31.00" },
              { name: "Salmon Toast", img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=400", price: "$25.00" },
              { name: "Açai Magic", img: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&q=80&w=400", price: "$22.00" }
            ].map((item, idx) => (
              <div key={idx} className="min-w-[280px] bg-white rounded-[2rem] p-3 relative group cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all border border-black/5 flex flex-col">
                <div className="w-full h-48 mb-4 overflow-hidden rounded-[1.5rem] relative">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                
                <div className="px-3 pb-3">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                      <p className="text-[10px] text-black/40 uppercase font-bold tracking-widest">Must Try</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xl">{item.price}</span>
                    <button className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-red-500/30">
                      <ShoppingBag size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Event Planner (Modern App Card Style) */}
      <section id="experiencias" className="py-24 px-6 lg:px-12 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-black/5 overflow-hidden flex flex-col md:flex-row">
            {/* Image Side */}
            <div className="w-full md:w-1/2 h-[300px] md:h-auto relative">
              <img src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Event" />
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="glass-panel text-white px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2">
                  <Star size={12} className="text-[#E6B05C]" fill="currentColor" /> Premium Events
                </div>
              </div>
            </div>
            {/* Content Side */}
            <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Curador de <br/>Experiencias AI</h2>
              <p className="text-black/50 font-medium text-sm mb-10 leading-relaxed">
                Describe el evento perfecto. Nuestro asistente inteligente diseñará un concepto de comida y espacio exclusivo para ti.
              </p>
              
              <button 
                onClick={() => setIsEventModalOpen(true)}
                className="w-full bg-[#1A1A1A] text-white py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#2a2a2a] transition-all shadow-xl hover:shadow-[0_15px_30px_rgba(26,26,26,0.2)]"
              >
                <Sparkles size={16} className="text-[#E6B05C]" />
                Diseñar mi evento
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Event Modal (App Overlay Style) */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-0 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative mt-auto md:mt-0 md:h-auto"
            >
              <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-8 md:hidden" />
              
              <button onClick={() => setIsEventModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 bg-black/5 rounded-full flex items-center justify-center text-black/50 hover:bg-black/10 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
              
              <div className="w-12 h-12 bg-[#E6B05C]/20 text-[#E6B05C] rounded-full flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              
              <h3 className="text-2xl font-extrabold mb-2">Diseña tu evento</h3>
              <p className="text-xs font-medium text-black/50 mb-6">
                Ej: "Cena íntima para 4 amigas, nos gusta el vino y la comida ligera."
              </p>

              <textarea 
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
                placeholder="Describe tu idea aquí..."
                className="w-full bg-[#FAFAFA] border border-black/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[#E6B05C] transition-colors resize-none h-28 mb-6 font-medium"
              />

              <button 
                onClick={handleEventPlanner}
                disabled={isEventLoading || !eventQuery}
                className="w-full bg-[#1A1A1A] text-white py-4 rounded-full font-bold text-sm hover:bg-[#2a2a2a] transition-all disabled:opacity-50 flex justify-center shadow-lg"
              >
                {isEventLoading ? <Loader2 size={18} className="animate-spin" /> : "Generar Propuesta"}
              </button>

              <AnimatePresence>
                {eventResponse && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    className="bg-[#FAFAFA] border border-black/5 p-5 rounded-2xl text-left"
                  >
                    <p className="text-sm font-medium leading-relaxed text-[#1A1A1A]">{eventResponse}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews Section (Dinámica desde AdminMock) */}
      <section className="py-24 px-6 lg:px-12 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-[#1A1A1A]">Voces de la <br/>Comunidad</h2>
              <p className="text-black/50 font-medium text-sm">Lo que nuestros clientes experimentan a diario.</p>
            </div>
            <button className="text-sm font-bold border-b-2 border-[#E6B05C] pb-1 hover:text-[#E6B05C] transition-colors">
              Ver todas las reseñas
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {adminConfig.reviews.map((review, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all">
                <div className="flex gap-1 text-[#E6B05C] mb-6">
                  {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-[#1A1A1A]/80 font-medium text-sm leading-relaxed mb-8">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={review.img} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-sm">{review.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern App Footer */}
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
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E6B05C] hover:text-[#1A1A1A] transition-all font-bold text-xs">IG</a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E6B05C] hover:text-[#1A1A1A] transition-all font-bold text-xs">FB</a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E6B05C] hover:text-[#1A1A1A] transition-all font-bold text-xs">TT</a>
              </div>
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
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;