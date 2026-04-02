import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, ArrowRight, Sun, Coffee, CloudMoon, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStockState, slugify } from '../utils/stock';
import * as menu from '../data/menuItems';
import { supabase } from '../config/supabase';
import { useMenuData } from '../context/MenuDataContext';
import { useAuth } from '../context/AuthContext';

const CATEGORY_UI = {
  todos: { icon: '✨', label: 'Todos' },
  desayunos: { icon: '🍳', label: 'Desayunos' },
  bowls: { icon: '🥗', label: 'Bowls' },
  platos: { icon: '🍲', label: 'Platos' },
  sandwiches: { icon: '🥪', label: 'Sándwiches' },
  smoothies: { icon: '🥤', label: 'Smoothies' },
  cafe: { icon: '☕', label: 'Café' },
  bebidasfrias: { icon: '🧊', label: 'Frías' },
  postres: { icon: '🍰', label: 'Postres' }
};

function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { time: "manana", label: "Buenos días", Icon: Coffee };
  if (hour >= 12 && hour < 18) return { time: "tarde", label: "Buenas tardes", Icon: Sun };
  return { time: "noche", label: "Buenas noches", Icon: CloudMoon };
}

export default function MenuHero({ query, setQuery, activeCategory, setActiveCategory, categories = [] }) {
  const { time, label: greeting, Icon: TimeIcon } = getTimeContext();
  const [user] = useState({ name: 'Invitado', isLogged: false }); // User state mock
  const { homeSettings, restaurantSettings } = useMenuData();
  const { activeBrand } = useAuth();

  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";



  // --- RECOMENDACIÓN INSTANTÁNEA ---
  const candidates = useMemo(() => {
    const pools = {
      manana: [menu.breakfastItems, menu.coffees, menu.infusions, menu.teasAndChai, menu.moreInfusions],
      tarde: [menu.smoothies, menu.funcionales, menu.sodas, menu.otherDrinks, menu.coffees],
      noche: [menu.mainDishes, menu.sandwichItems, menu.dessertBaseItems, menu.coffees],
    };
    const bucket = pools[time] || [];
    const items = bucket.flatMap((arr) => (Array.isArray(arr) ? arr : []));
    return items
      .map((p) => ({
        id: p.id || p.productId || (p.key ? `sandwich:${p.key}` : slugify(p.name)),
        name: p.name,
        price: p.price,
        img: p.image_url || p.image || p.imageUrl,
        desc: p.desc || p.subtitle || ""
      }))
      .filter((p) => {
        if (!p.img) return false;
        const st = getStockState(p.id);
        return st === "in" || st === "low";
      });
  }, [time]);

  const [recIndex, setRecIndex] = useState(0);
  
  useEffect(() => {
    if (!candidates.length) return;
    const id = setInterval(() => {
      setRecIndex((i) => (i + 1) % candidates.length);
    }, 25000);
    return () => clearInterval(id);
  }, [candidates.length]);

  const instantProduct = candidates.length ? candidates[recIndex] : null;

  // --- ESTADOS IA ---
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  const handleAiSurprise = async () => {
    if (!instantProduct) return;
    setIsAiLoading(true);
    try {
      const prompt = `Eres la IA de ${brandName}. Son las ${new Date().getHours()}:00. Recomienda de forma MUY breve (1 sola frase, máximo 15 palabras) el plato: "${instantProduct.name}". Tono: premium y persuasivo.`;
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt, context: `Experiencia gastronómica premium ${brandName}.` }
      });
      if (error) throw error;
      setAiRecommendation(data.reply);
      setShowAiSuggestion(true);
    } catch (err) {
      console.error(err);
      setAiRecommendation(`Anímate a probar ${instantProduct.name}, te sorprenderá.`);
      setShowAiSuggestion(true);
    } finally {
      setIsAiLoading(false);
    }
  };



  const handleQuickView = () => {
    if (!instantProduct.id) return;
    const payload = {
      id: instantProduct.id,
      name: instantProduct.name,
      price: instantProduct.price,
      subtitle: instantProduct.desc,
    };
    window.dispatchEvent(new CustomEvent("aa:quickview", { detail: payload }));
  };

  return (
    <div className="w-full flex justify-center mb-6">
      <div className="w-full relative z-10 flex flex-col items-center">
        
        {/* TÍTULO SUTIL Y PEQUEÑO */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-6 w-full"
        >
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1A1A1A] mb-1.5">
            Comer <span className="text-[#4A7856]">sano</span> nunca fue tan fácil
          </h1>
          <p className="text-[#1A1A1A]/40 font-medium text-xs md:text-sm">
            Ingredientes locales, directo a tu mesa.
          </p>
        </motion.div>

        {/* 🤖 SMART CARD CON PRODUCTO INSTANTÁNEO */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full bg-white/70 backdrop-blur-lg border border-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] rounded-[1.5rem] p-4 md:p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden"
        >
          {/* Lado Izquierdo: Saludo y AI */}
          <div className="flex gap-4 items-center w-full md:w-3/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm border border-black/5 flex items-center justify-center shrink-0">
              <TimeIcon size={20} className="text-[#E6B05C]" strokeWidth={2} />
            </div>
            <div className="flex-1 min-h-[48px] flex flex-col justify-center">
              <h3 className="font-bold text-sm text-[#1A1A1A] mb-0.5">
                {greeting}{user.isLogged ? `, ${user.name}` : ''}
              </h3>
              
              <AnimatePresence mode="wait">
                {aiRecommendation ? (
                  <motion.p 
                    key="rec" initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-[#4A7856] leading-snug"
                  >
                    ✨ {aiRecommendation}
                  </motion.p>
                ) : instantProduct ? (
                  <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                    <p className="text-xs font-medium text-[#1A1A1A]/40 hidden sm:block">¿Indeciso? Deja que nuestra IA elija por ti.</p>
                    <button 
                      onClick={handleAiSurprise}
                      disabled={isAiLoading}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-[#E6B05C] hover:text-[#c49247] transition-colors mt-1 sm:mt-0"
                    >
                      {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      SUGERIR PLATO
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-xs font-medium text-[#1A1A1A]/40">Descubre nuestros mejores platos. ¡Explora el menú!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Lado Derecho: Producto Instantáneo */}
          <div className="w-full md:w-2/5 flex justify-end min-h-[64px]">
            <AnimatePresence>
              {showAiSuggestion && instantProduct && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={handleQuickView}
                  className="bg-white p-2 rounded-xl shadow-sm border border-black/5 flex items-center gap-3 w-full sm:w-auto hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <img src={instantProduct.img} alt={instantProduct.name} className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform" />
                  <div className="pr-4 flex-1">
                    <p className="text-[10px] uppercase font-bold text-[#4A7856] tracking-wider mb-0.5">Sugerencia</p>
                    <p className="text-xs font-extrabold text-[#1A1A1A] leading-none line-clamp-1 truncate block">{instantProduct.name}</p>
                    <p className="text-[10px] font-bold text-[#1A1A1A]/40 mt-1">{typeof instantProduct.price === 'number' ? `$${instantProduct.price.toLocaleString()}` : instantProduct.price}</p>
                  </div>
                  <div className="w-6 h-6 shrink-0 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] mr-2 group-hover:bg-[#E6B05C] group-hover:text-white transition-colors">
                    <Plus size={12} strokeWidth={3} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 🔍 BARRA DE BÚSQUEDA */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full relative mb-6 group max-w-2xl"
        >
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#1A1A1A]/30 group-focus-within:text-[#E6B05C] transition-colors">
            <Search size={16} strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar bowls, café, postres..."
            className="w-full bg-white shadow-sm border border-black/5 focus:border-[#E6B05C]/50 rounded-full py-3 px-12 text-[#1A1A1A] text-sm font-medium placeholder:text-[#1A1A1A]/30 outline-none transition-all"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-4 flex items-center justify-center w-8 text-black/30 hover:text-black/60"
            >
              <span className="text-xl leading-none">&times;</span>
            </button>
          )}
        </motion.div>

        {/* 💊 CATEGORY PILLS */}
        <div className="sticky top-0 z-50 w-[100vw] sm:w-[calc(100vw-2rem)] md:w-full -ml-5 sm:ml-0 overflow-visible mt-2">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full flex items-center justify-start md:justify-center gap-3 overflow-x-auto hide-scrollbar pb-4 pt-3 px-5 sm:px-0 bg-[#F5F5F7]/95 backdrop-blur-md border-b border-black/5"
          >
            {[{slug: 'todos', label: 'Todos', icon: '✨'}, ...categories].map((cat, idx) => {
              const catId = cat.slug || cat.id;
              const catLabel = cat.label || cat.name || catId;
              const ui = CATEGORY_UI[catId] || { icon: cat.icon || '🍽️', label: catLabel };
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveCategory(catId)}
                  className={`shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-full cursor-pointer transition-all duration-300 border ${
                    activeCategory === catId 
                      ? 'bg-white border-transparent shadow-[0_4px_12px_rgba(0,0,0,0.06)] scale-105' 
                      : 'bg-white/50 border-black/5 hover:border-black/15 hover:bg-white opacity-90'
                  }`}
                >
                  <span className="text-xl bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">{ui.icon}</span>
                  <span className="text-sm font-bold text-[#1A1A1A] pr-1">{ui.label}</span>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* 🎟️ BANNER DE EXPERIENCIAS */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          onClick={() => window.location.hash = '#experiencias'}
          className="w-full mt-4 rounded-[1.5rem] overflow-hidden relative cursor-pointer group h-28 md:h-32 shadow-sm border border-black/5"
        >
          <img 
            src={homeSettings?.menu_banner_img || "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200"} 
            alt="Experiencias" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2421]/90 via-[#1A2421]/60 to-transparent" />
          
          <div className="absolute inset-0 p-5 md:p-6 flex items-center justify-between z-10">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-[#E6B05C] text-[#1A1A1A] text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
                  {homeSettings?.menu_banner_tag || 'Exclusivo'}
                </span>
                <span className="text-white/60 text-[10px] font-bold">
                  {homeSettings?.menu_banner_subtitle || 'Talleres & Catas'}
                </span>
              </div>
              <h3 
                className="font-extrabold text-white text-lg md:text-xl leading-tight"
                dangerouslySetInnerHTML={{ __html: homeSettings?.menu_banner_title?.replace(/\n/g, '<br/>') || `Vive la experiencia<br/>${brandName}` }}
              />
            </div>

            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-white group-hover:text-[#1A2421] group-hover:scale-110 transition-all">
              <ArrowRight size={16} />
            </div>
          </div>
        </motion.div>



      </div>
    </div>
  );
}
