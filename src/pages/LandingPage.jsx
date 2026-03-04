import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Footer from '../components/Footer';
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
// 🎛️ FALLBACK DATA (se usa si Supabase no tiene datos todavía)
// =========================================================================
const FALLBACK_HERO_DISHES = [
  { category: "Pokes", name: "Poke Andino", rating: "4.9", prepTime: "10-15 mins", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200" },
  { category: "Bowls", name: "Sunrise Bowl", rating: "4.8", prepTime: "5-10 mins", img: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&q=80&w=1200" },
  { category: "Café", name: "Filtrado de Origen", rating: "4.9", prepTime: "5 mins", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1200" },
  { category: "Postres", name: "Tarta de Higo", rating: "4.7", prepTime: "15 mins", img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=1200" }
];

const FALLBACK_FEATURED = [
  { name: "Sunrise Bowl", img: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&q=80&w=400", price: "$28k" },
  { name: "Green Salad", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400", price: "$31k" },
  { name: "Salmon Toast", img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=400", price: "$25k" },
  { name: "Açai Magic", img: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&q=80&w=400", price: "$22k" }
];

const FALLBACK_REVIEWS = [
  { name: "Dra. Elena R.", role: "Médico", rating: 5, text: "El ambiente perfecto para desconectar después del hospital. El Poke Andino es mi favorito absoluto.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150" },
  { name: "Carlos M.", role: "Emprendedor", rating: 5, text: "Excelente WiFi y el café filtrado es de otro nivel. Vengo a trabajar dos veces por semana.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" },
  { name: "Ana & Max", role: "Pet Lovers", rating: 5, text: "A Max (mi golden) le encanta Cocoa, el perrito anfitrión. El mejor lugar pet-friendly de la zona.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" }
];

const LandingPage = () => {
  const [activeCategory, setActiveCategory] = useState('');
  const [heroDishIndex, setHeroDishIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  
  // --- ESTADO PARA LA DATA DE SUPABASE ---
  const [config, setConfig] = useState({
    heroDishes: [],
    featuredItems: [],
    reviews: [],
    conciergePrompt: '',
    eventPlannerPrompt: ''
  });

  useEffect(() => {
    fetchLandingSettings();
  }, []);

  const fetchLandingSettings = async () => {
    try {
      const { data, error } = await supabase.from('home_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      
      const heroDishes = (data?.hero_images && data.hero_images.length > 0) ? data.hero_images : FALLBACK_HERO_DISHES;
      const featuredItems = (data?.featured_items && data.featured_items.length > 0) ? data.featured_items : FALLBACK_FEATURED;
      const reviews = (data?.reviews && data.reviews.length > 0) ? data.reviews : FALLBACK_REVIEWS;

      const newConfig = {
        heroDishes,
        featuredItems,
        reviews,
        conciergePrompt: data?.concierge_prompt_template || '',
        eventPlannerPrompt: data?.event_planner_prompt_template || ''
      };
      setConfig(newConfig);

      // Seleccionar un plato aleatorio
      if (newConfig.heroDishes.length > 0) {
        const randomIndex = Math.floor(Math.random() * newConfig.heroDishes.length);
        setHeroDishIndex(randomIndex);
        setActiveCategory(newConfig.heroDishes[randomIndex].category);
      }
    } catch (err) {
      console.error('Error fetching landing settings:', err);
      // Usar fallbacks en caso de error total
      setConfig(prev => ({
        ...prev,
        heroDishes: FALLBACK_HERO_DISHES,
        featuredItems: FALLBACK_FEATURED,
        reviews: FALLBACK_REVIEWS
      }));
      setHeroDishIndex(0);
      setActiveCategory(FALLBACK_HERO_DISHES[0].category);
    } finally {
      setLoading(false);
    }
  };

  // Función para capturar el movimiento del mouse para el efecto Parallax
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 40; 
    const y = (clientY / innerHeight - 0.5) * 40;
    setMousePosition({ x, y });
  };

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
    const dishIndex = config.heroDishes.findIndex(dish => dish.category === categoryName);
    if (dishIndex !== -1) {
      setHeroDishIndex(dishIndex);
    }
  };

  const currentHeroDish = config.heroDishes[heroDishIndex];
  
  // --- ESTADO PARA LA INTEGRACIÓN CON GEMINI ---
  const [conciergeQuery, setConciergeQuery] = useState('');
  const [conciergeResponse, setConciergeResponse] = useState('');
  const [isConciergeLoading, setIsConciergeLoading] = useState(false);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventQuery, setEventQuery] = useState('');
  const [eventResponse, setEventResponse] = useState('');
  const [isEventLoading, setIsEventLoading] = useState(false);

  const handleConcierge = async () => {
    if (!conciergeQuery) return;
    setIsConciergeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          prompt: config.conciergePrompt.replace('{{query}}', conciergeQuery),
          context: "Menu features pokes, bowls, coffee and desserts. Premium andine ingredients."
        }
      });
      if (error) throw error;
      setConciergeResponse(data.reply);
    } catch (err) {
      console.error(err);
      setConciergeResponse("Lo siento, tuve un problema conectando con mi sabiduría culinaria. ¡Ven a la barra y te cuento en persona!");
    } finally {
      setIsConciergeLoading(false);
    }
  };

  const handleEventPlanner = async () => {
    if (!eventQuery) return;
    setIsEventLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          prompt: config.eventPlannerPrompt.replace('{{query}}', eventQuery),
          context: "Alto Andino specializes in high-end events, healthy bowls, and craft coffee."
        }
      });
      if (error) throw error;
      setEventResponse(data.reply);
    } catch (err) {
      console.error(err);
      setEventResponse("Hubo un error al diseñar tu evento, pero no te preocupes, ¡contáctanos y lo planeamos juntos!");
    } finally {
      setIsEventLoading(false);
    }
  };

  const categories = [
    { name: 'Pokes', icon: '🍲', price: '$34k' },
    { name: 'Bowls', icon: '🥗', price: '$28k' },
    { name: 'Café', icon: '☕', price: '$8k' },
    { name: 'Postres', icon: '🍰', price: '$15k' }
  ];

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    })
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#2f4131] animate-spin" />
        <p className="text-[#2f4131] font-bold uppercase tracking-widest text-xs italic">Cargando Experiencia Alto Andino...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans overflow-x-hidden selection:bg-[#E6B05C] selection:text-white">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          
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

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <div className="absolute top-4 right-4 bottom-4 w-full md:w-[45%] bg-[#1A2421] rounded-[3rem] z-0 hidden md:block overflow-hidden shadow-2xl">
           <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#E6B05C]/15 rounded-full blur-[80px]" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[60px]" />
        </div>
        <div className="absolute top-0 right-0 w-full h-[40%] bg-[#1A2421] rounded-b-[2rem] md:rounded-b-[3rem] z-0 md:hidden overflow-hidden">
           <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#E6B05C]/15 rounded-full blur-[50px]" />
        </div>

        <div className="container mx-auto px-4 md:px-6 lg:px-12 relative z-10 flex flex-col md:flex-row items-center h-full gap-6 md:gap-12">
          
          <div className="flex-1 mt-20 md:mt-0 w-full order-2 md:order-1 relative z-30">
            <div className="max-w-md lg:max-w-lg">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-4 md:mb-6 flex flex-col">
                <motion.span custom={1} variants={titleVariants} initial="hidden" animate="visible">
                  Descubre tus
                </motion.span>
                <motion.span custom={2} variants={titleVariants} initial="hidden" animate="visible" className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A1A1A] to-[#6b6b6b] md:from-[#1A1A1A] md:to-[#1A1A1A] mt-1">
                  platos favoritos
                </motion.span>
              </h1>
              
              <motion.p 
                custom={3} variants={titleVariants} initial="hidden" animate="visible"
                className="text-[#1A1A1A]/50 font-medium text-[13px] md:text-base max-w-md mb-6 md:mb-8 leading-relaxed"
              >
                Ingredientes locales, nutrición premium y el toque artesanal de nuestra cocina andina, directo a tu mesa.
              </motion.p>

              {/* Categories Slider */}
              <motion.div 
                custom={4} variants={titleVariants} initial="hidden" animate="visible"
                className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4 md:-mx-0 md:px-0"
              >
                {categories.map((cat, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full cursor-pointer transition-all duration-300 border ${
                      activeCategory === cat.name 
                        ? 'bg-white border-transparent shadow-[0_8px_20px_rgba(0,0,0,0.08)] scale-105' 
                        : 'bg-transparent border-black/10 hover:border-black/30 opacity-70'
                    }`}
                  >
                    <span className="text-lg md:text-xl bg-[#F4F0EA] w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center">{cat.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{cat.name}</span>
                      <span className="text-[10px] text-black/50 font-semibold">{cat.price}</span>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div custom={5} variants={titleVariants} initial="hidden" animate="visible" className="flex items-center gap-6">
                <a href="#menu" className="bg-[#1A1A1A] hover:bg-[#2a2a2a] text-white pl-2 pr-8 py-2 rounded-full flex items-center gap-4 transition-transform hover:scale-105 active:scale-95 shadow-xl">
                  <div className="bg-[#E6B05C] w-10 h-10 rounded-full flex items-center justify-center text-black">
                    <ShoppingBag size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-sm">Ordenar Ahora</span>
                </a>
              </motion.div>
            </div>
          </div>

          <div className="flex-1 relative w-full h-[320px] md:h-screen flex items-center justify-center md:justify-end order-1 md:order-2">
            <motion.div 
              animate={{ x: mousePosition.x * -1, y: mousePosition.y * -1 }}
              transition={{ type: "spring", stiffness: 100, damping: 30 }}
              className="relative w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] md:w-[700px] md:h-[700px] md:translate-x-24 lg:translate-x-32"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHeroDish?.name}
                  initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotate: 20 }}
                  transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                  className="w-full h-full absolute inset-0"
                >
                  <img 
                    src={currentHeroDish?.img} 
                    alt={currentHeroDish?.name} 
                    className="w-full h-full object-cover rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] md:shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-[8px] md:border-[12px] border-white/10"
                  />
                  
                  <div className="absolute bottom-2 left-0 md:bottom-28 md:left-4 lg:bottom-32 lg:-left-12 glass-panel bg-white/90 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl flex flex-col gap-1 shadow-2xl backdrop-blur-xl border border-white/80 z-20">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm md:text-base font-extrabold text-[#1A1A1A]">{currentHeroDish?.name}</span>
                      <div className="flex items-center gap-1 text-[#E6B05C] bg-[#E6B05C]/10 px-2 py-0.5 rounded-full">
                        <Star size={12} fill="currentColor" />
                        <span className="text-[10px] font-bold">{currentHeroDish?.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-black/60 text-xs font-medium">
                      <Clock size={12} />
                      <span>{currentHeroDish?.prepTime} prep</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div
              animate={{ x: mousePosition.x * 1.5, y: mousePosition.y * 1.5 }}
              transition={{ type: "spring", stiffness: 100, damping: 30 }}
              className="absolute top-16 right-10 md:top-32 md:right-32 z-10"
            >
              <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="w-12 h-12 md:w-16 md:h-16 glass-panel rounded-full shadow-2xl flex items-center justify-center text-2xl md:text-3xl border border-white/60 bg-white/40 backdrop-blur-lg"
              >
                🥑
              </motion.div>
            </motion.div>
            
            <motion.div
              animate={{ x: mousePosition.x * 2, y: mousePosition.y * 2 }}
              transition={{ type: "spring", stiffness: 100, damping: 30 }}
              className="absolute top-1/2 -left-4 md:left-4 lg:-left-12 z-10"
            >
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }}
                className="w-10 h-10 md:w-14 md:h-14 glass-panel rounded-full shadow-2xl flex items-center justify-center text-xl md:text-2xl border border-white/60 bg-white/40 backdrop-blur-lg"
              >
                🌿
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI CONCIERGE */}
      <section className="py-12 md:py-24 px-4 md:px-6 lg:px-12 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#1A2421]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="container mx-auto max-w-6xl">
          <div className="bg-[#1A2421] rounded-2xl md:rounded-[2.5rem] p-5 md:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6B05C]/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4A7856]/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-6 md:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md border border-white/10 mb-4 md:mb-6">
                  <Sparkles size={14} className="text-[#E6B05C]" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Powered by Gemini AI</span>
                </div>
                <h2 className="text-2xl md:text-5xl font-extrabold text-white mb-3 md:mb-4 leading-tight">
                  Taste the Best <br/>that <span className="text-[#E6B05C]">Surprise you</span>
                </h2>
                <p className="text-white/50 text-xs md:text-base font-medium mb-5 md:mb-8 leading-relaxed max-w-sm">
                  Nuestro Conserje Gastronómico analiza tu antojo y encuentra el plato perfecto en nuestro menú.
                </p>

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

              <div className="h-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {conciergeResponse ? (
                    <motion.div 
                      key="response"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      className="glass-dark w-full p-5 md:p-8 rounded-2xl md:rounded-[2rem] relative"
                    >
                      <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#E6B05C] rounded-full flex items-center justify-center shadow-lg text-[#1A1A1A]">
                        <Sparkles size={20} />
                      </div>
                      <p className="text-white text-sm md:text-lg font-medium leading-relaxed italic">
                        "{conciergeResponse}"
                      </p>
                      <a href="#menu" className="mt-6 text-[11px] font-bold text-[#E6B05C] uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2">
                        Ver este plato en el menú <ArrowRight size={14} />
                      </a>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="w-full h-36 md:h-48 border-2 border-dashed border-white/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white/20 p-5 md:p-8 text-center"
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

      {/* Featured Items */}
      <section className="py-12 md:py-24 px-4 md:px-6 lg:px-12 bg-[#FAFAFA]">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-6 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1 md:mb-2 text-[#1A1A1A]">Must Try</h2>
              <p className="text-black/50 font-medium text-sm">Los favoritos de nuestra comunidad.</p>
            </div>
          </div>

          <div className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar pb-6 md:pb-10 -mx-4 px-4 md:mx-0 md:px-0">
            {config.featuredItems.map((item, idx) => (
              <div key={idx} className="min-w-[220px] md:min-w-[280px] bg-white rounded-2xl md:rounded-[2rem] p-2.5 md:p-3 relative group cursor-pointer hover:shadow-xl transition-all border border-black/5">
                <div className="w-full h-36 md:h-48 mb-3 md:mb-4 overflow-hidden rounded-xl md:rounded-[1.5rem]">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="px-3 pb-3">
                  <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-extrabold text-lg md:text-xl">{item.price}</span>
                    <a href="#menu" className="w-8 h-8 rounded-full bg-[#E6B05C] text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#E6B05C]/30">
                      <ShoppingBag size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Event Planner */}
      <section className="py-12 md:py-24 px-4 md:px-6 lg:px-12 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-[#1A2421] text-white rounded-2xl md:rounded-[3.5rem] p-6 md:p-20 flex flex-col md:flex-row gap-6 md:gap-12 items-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-[#E6B05C]/10 rounded-full blur-[100px]" />
             
             <div className="flex-1 z-10">
               <h2 className="text-2xl md:text-5xl font-extrabold mb-4 md:mb-6 leading-tight">Curador de <br/>Experiencias AI</h2>
               <p className="text-white/50 text-sm md:text-base mb-6 md:mb-10 leading-relaxed">
                 Describe el evento perfecto. Nuestro asistente inteligente diseñará un concepto de comida y espacio exclusivo para ti.
               </p>
               <button 
                 onClick={() => setIsEventModalOpen(true)}
                 className="bg-[#E6B05C] text-[#1A1A1A] px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-sm hover:bg-white transition-all shadow-xl"
               >
                 Diseñar mi evento
               </button>
             </div>
             
             <div className="flex-1 w-full h-[200px] md:h-[400px] relative rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl z-10">
               <img src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Experiencia" />
             </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-12 md:py-24 px-4 md:px-6 lg:px-12 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-6 md:mb-12 text-center">Voces de la Comunidad</h2>
          <div className="grid md:grid-cols-3 gap-4 md:gap-8">
            {config.reviews.map((review, idx) => (
              <div key={idx} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-black/5">
                <div className="flex gap-1 text-[#E6B05C] mb-4 md:mb-6">
                  {[...Array(review.rating || 5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="text-black/70 font-medium text-[13px] md:text-sm leading-relaxed mb-5 md:mb-8">"{review.text}"</p>
                <div className="flex items-center gap-3 md:gap-4">
                  <img src={review.img} alt={review.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-md" />
                  <div>
                    <h4 className="font-bold text-sm text-[#1A1A1A]">{review.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative"
            >
              <button onClick={() => setIsEventModalOpen(false)} className="absolute top-6 right-6 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-[#E6B05C]/20 text-[#E6B05C] rounded-full flex items-center justify-center mb-8">
                <Sparkles size={32} />
              </div>
              
              <h3 className="text-3xl font-extrabold mb-4">Tu Evento Premium</h3>
              <p className="text-black/50 text-sm mb-8 font-medium italic">
                "¿Qué tienes en mente? Una cena romántica, un brunch de negocios o una celebración grupal..."
              </p>

              <textarea 
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
                placeholder="Describe tu idea aquí..."
                className="w-full bg-[#FAFAFA] border border-black/10 rounded-2xl p-6 text-sm focus:outline-none focus:border-[#E6B05C] transition-colors resize-none h-32 mb-8 font-medium"
              />

              <button 
                onClick={handleEventPlanner}
                disabled={isEventLoading || !eventQuery}
                className="w-full bg-[#1A1A1A] text-white py-5 rounded-full font-bold text-sm hover:bg-[#2a2a2a] transition-all disabled:opacity-50 flex justify-center shadow-xl"
              >
                {isEventLoading ? <Loader2 size={18} className="animate-spin" /> : "Generar Propuesta"}
              </button>

              {eventResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-6 bg-[#F4F0EA] rounded-2xl border border-[#E6B05C]/20"
                >
                  <p className="text-sm font-semibold leading-relaxed text-[#1A1A1A]">{eventResponse}</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
