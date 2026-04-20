import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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
  Leaf,
  Phone, 
  Heart, 
  ChefHat, 
  Coffee, 
  UtensilsCrossed, 
  Plus,
  ArrowUpRight,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenuData } from '../context/MenuDataContext';
import { useAuth } from '../context/AuthContext';
import { formatCOP } from '../utils/money';
import { useCart } from '../context/CartContext';

const ProductQuickView = lazy(() => import('../components/ProductQuickView'));

// =========================================================================
// 🎛️ FALLBACK DATA (se usa si Supabase no tiene datos todavía)
// =========================================================================
const FALLBACK_HERO_DISHES = [
  { category: "Pokes", name: "Poke Especial", rating: "4.9", prepTime: "10-15 mins", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200" },
  { category: "Bowls", name: "Sunrise Bowl", rating: "4.8", prepTime: "5-10 mins", img: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&q=80&w=1200" },
  { category: "Café", name: "Filtrado de Origen", rating: "4.9", prepTime: "5 mins", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1200" },
  { category: "Postres", name: "Tarta de Higo", rating: "4.7", prepTime: "15 mins", img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=1200" }
];

const FALLBACK_FEATURED = [
  { name: "Sunrise Bowl", img: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&q=80&w=400", price: 28000 },
  { name: "Green Salad", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400", price: 31000 },
  { name: "Salmon Toast", img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=400", price: 25000 },
  { name: "Açai Magic", img: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&q=80&w=400", price: 22000 }
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
  const [localLoading, setLocalLoading] = useState(true);
  
  const menuData = useMenuData();
  const { 
    homeSettings, 
    restaurantSettings, 
    categories: allCategories,
    loading: menuLoading,
    getProductsByCategory,
    getAllProducts 
  } = menuData;
  
  const { addItem } = useCart();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const { activeBrand } = useAuth();
  
  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";
  const brandCity = activeBrand?.city || "";

  // Configuración reactiva basada en los datos del menú y ajustes de Supabase
  const config = useMemo(() => {
    // 1. Cálculo de platos Hero
    let heroDishes = [];
    if (homeSettings?.hero_items && Array.isArray(homeSettings.hero_items) && homeSettings.hero_items.length > 0) {
      heroDishes = homeSettings.hero_items;
    } else if (allCategories && allCategories.length > 0) {
      heroDishes = allCategories
        .filter(cat => cat.visibility_config?.show_in_hero)
        .map(cat => {
          const vc = cat.visibility_config || {};
          const products = getProductsByCategory ? getProductsByCategory(cat.slug) : [];
          
          const featuredProduct = products.find(p => p.id === vc.hero_featured_product_id) 
            || products.find(p => p.image_url || p.image)
            || products[0];
          
          let img = featuredProduct?.image_url || featuredProduct?.image;
          if (!img) img = "https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=1200";

          return {
            category: cat.name,
            icon: cat.icon || '🍽️',
            price: featuredProduct?.price ? formatCOP(featuredProduct.price) : '',
            name: featuredProduct?.name || cat.name,
            rating: vc.hero_rating || "5.0",
            prepTime: vc.hero_prep_time || "10-15 mins",
            img
          };
        })
        .filter(Boolean);
    }
    if (heroDishes.length === 0) heroDishes = FALLBACK_HERO_DISHES;

    // 2. Cálculo de items destacados (Must Try)
    // Usamos productsList para evitar conflictos de nombres con getAllProducts
    const productsList = typeof getAllProducts === 'function' ? getAllProducts() : [];
    
    const featuredWithDetails = (homeSettings?.featured_items && Array.isArray(homeSettings.featured_items) && homeSettings.featured_items.length > 0) 
      ? homeSettings.featured_items.map((item, idx) => {
          const productId = item.product_id || (typeof item === 'string' ? item : null);
          const found = productsList.find(p => p.id === productId);
          
          return { 
            ...item, 
            ...(found || {}), 
            id: productId || found?.id || `featured-${idx}`,
            img: item.img || found?.image_url || found?.image || "https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=1200",
            price: found?.price ? formatCOP(found.price) : (item.price || ''),
            name: item.name || found?.name || "Plato Recomendado"
          };
        })
      : FALLBACK_FEATURED.map((item, idx) => ({ ...item, id: `fallback-${idx}` }));

    // 3. Reseñas
    const reviews = (homeSettings?.reviews && homeSettings.reviews.length > 0) ? homeSettings.reviews : FALLBACK_REVIEWS;

    // 4. Emojis y Textos
    const emojisConfig = homeSettings?.hero_emojis 
      ? homeSettings.hero_emojis.split(',').map(e => e.trim()) 
      : ['🥑', '🌿'];

    return {
      heroDishes,
      featuredItems: featuredWithDetails,
      reviews,
      conciergePrompt: homeSettings?.concierge_prompt_template || '',
      conciergeImg: homeSettings?.concierge_img || '',
      conciergeBgColor: homeSettings?.concierge_bg_color || restaurantSettings?.theme_footer_bg || '#1A2421',
      heroH1: homeSettings?.hero_h1 || 'Descubre tus\nplatos favoritos',
      heroSubtitle: homeSettings?.hero_subtitle || `Ingredientes locales, nutrición premium y el toque artesanal de nuestra cocina${brandCity ? ` en ${brandCity}` : ''}, directo a tu mesa.`,
      heroEmojis: emojisConfig.length > 0 ? emojisConfig : ['🥑', '🌿'],
      featuredTitle: homeSettings?.featured_items_title || 'Must Try',
      featuredTag: homeSettings?.featured_items_tag || 'Selección del Chef'
    };
  }, [homeSettings, allCategories, restaurantSettings, brandCity, getProductsByCategory, getAllProducts]);

  // Manejo de carga inicial y selección aleatoria del plato Hero
  useEffect(() => {
    if (config.heroDishes.length > 0 && !activeCategory) {
      const randomIndex = Math.floor(Math.random() * config.heroDishes.length);
      setHeroDishIndex(randomIndex);
      setActiveCategory(config.heroDishes[randomIndex].category);
    }
  }, [config.heroDishes, activeCategory]);
  useEffect(() => {
    if (!menuLoading) {
      setLocalLoading(false);
    }
  }, [menuLoading]);

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

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const needsModifiers = product.modifierGroups?.length > 0 || product.modifier_groups?.length > 0;
    if (needsModifiers) {
      setQuickViewProduct(product);
    } else {
      addItem(product);
    }
  };

  const currentHeroDish = config.heroDishes[heroDishIndex];
  const [conciergeQuery, setConciergeQuery] = useState('');
  const [conciergeResponse, setConciergeResponse] = useState('');
  const [isConciergeLoading, setIsConciergeLoading] = useState(false);

  const handleConcierge = async () => {
    if (!conciergeQuery) return;
    setIsConciergeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          prompt: config.conciergePrompt.replace('{{query}}', conciergeQuery),
          systemInstruction: `Menú de ${brandName}. Ingredientes premium y locales.`
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

  const h1Lines = config.heroH1.split('\n');
  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    })
  };

  if (localLoading || menuLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
        <p className="text-brand-primary font-bold uppercase tracking-widest text-xs italic">Cargando Experiencia {brandName}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans overflow-x-hidden selection:bg-brand-secondary selection:text-white">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          .glass-panel { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05); }
          .glass-dark { background: rgba(26, 36, 33, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          @keyframes infinite-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(calc(-100% - 1.5rem)); }
          }
          .animate-infinite-scroll {
            animation: infinite-scroll 40s linear infinite;
            display: flex;
            width: max-content;
          }
          .marquee-container:hover .animate-infinite-scroll {
            animation-play-state: paused;
          }
        `}
      </style>

      <section className="relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden" onMouseMove={handleMouseMove}>
        <div className="absolute top-4 right-4 bottom-4 w-full md:w-[45%] bg-brand-primary rounded-[3rem] z-0 hidden md:block overflow-hidden shadow-2xl">
           <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-secondary/15 rounded-full blur-[80px]" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[60px]" />
        </div>
        <div className="absolute top-0 right-0 w-full h-[40%] bg-brand-primary rounded-b-[2rem] md:rounded-b-[3rem] z-0 md:hidden overflow-hidden">
           <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-brand-secondary/15 rounded-full blur-[50px]" />
        </div>

        <div className="container mx-auto px-4 md:px-6 lg:px-12 relative z-10 flex flex-col md:flex-row items-center h-full gap-6 md:gap-12">
          <div className="flex-1 mt-20 md:mt-0 w-full order-2 md:order-1 relative z-30">
            <div className="max-w-md lg:max-w-lg">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-4 md:mb-6 flex flex-col">
                <motion.span custom={1} variants={titleVariants} initial="hidden" animate="visible">{h1Lines[0] || 'Descubre tus'}</motion.span>
                <motion.span custom={2} variants={titleVariants} initial="hidden" animate="visible" className="text-transparent bg-clip-text bg-gradient-to-r from-brand-text to-brand-text/60 md:from-brand-text md:to-brand-text mt-1">{h1Lines.length > 1 ? h1Lines.slice(1).join('\n') : 'platos favoritos'}</motion.span>
              </h1>
              <motion.p custom={3} variants={titleVariants} initial="hidden" animate="visible" className="text-brand-text/50 font-medium text-[13px] md:text-base max-w-md mb-6 md:mb-8 leading-relaxed whitespace-pre-line">{config.heroSubtitle}</motion.p>
              <motion.div custom={4} variants={titleVariants} initial="hidden" animate="visible" className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4 md:-mx-0 md:px-0">
                {config.heroDishes.map((cat, idx) => (
                  <div key={idx} onClick={() => handleCategoryClick(cat.category)} className={`shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full cursor-pointer transition-all duration-300 border ${activeCategory === cat.category ? 'bg-white border-transparent shadow-[0_8px_20px_rgba(0,0,0,0.08)] scale-105' : 'bg-transparent border-black/10 hover:border-black/30 opacity-70'}`}>
                    <span className="text-lg md:text-xl bg-brand-bg w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center">{cat.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{cat.category}</span>
                      {cat.price && <span className="text-[10px] text-black/50 font-semibold">{cat.price}</span>}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="flex-1 relative w-full h-[320px] md:h-screen flex items-center justify-center md:justify-end order-1 md:order-2">
            <motion.div animate={{ x: mousePosition.x * -1, y: mousePosition.y * -1 }} transition={{ type: "spring", stiffness: 100, damping: 30 }} className="relative w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] md:w-[700px] md:h-[700px] md:translate-x-24 lg:translate-x-32">
              <AnimatePresence mode="wait">
                <motion.div key={currentHeroDish?.name} initial={{ scale: 0.8, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.8, opacity: 0, rotate: 20 }} transition={{ duration: 0.8, type: "spring", bounce: 0.3 }} className="w-full h-full absolute inset-0">
                  <img src={currentHeroDish?.img} alt={currentHeroDish?.name} className="w-full h-full object-cover rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] md:shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-[8px] md:border-[12px] border-white/10" />
                  <div className="absolute bottom-2 left-0 md:bottom-28 md:left-4 lg:bottom-32 lg:-left-12 glass-panel bg-brand-card/90 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl flex flex-col gap-1 shadow-2xl backdrop-blur-xl border border-white/80 z-20">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm md:text-base font-extrabold text-brand-text">{currentHeroDish?.name}</span>
                      <div className="flex items-center gap-1 text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded-full">
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

            {(() => {
              const positions = [
                { cls: 'top-16 right-10 md:top-32 md:right-32', size: 'w-12 h-12 md:w-16 md:h-16 text-2xl md:text-3xl', parallax: 1.5, y: [0, 15, 0], rot: [0, 10, 0], dur: 5, delay: 1 },
                { cls: 'top-1/2 -left-4 md:left-4 lg:-left-12', size: 'w-10 h-10 md:w-14 md:h-14 text-xl md:text-2xl', parallax: 2, y: [0, -15, 0], rot: [0, -10, 0], dur: 6, delay: 2 },
                { cls: 'bottom-24 right-6 md:bottom-32 md:right-20', size: 'w-10 h-10 md:w-14 md:h-14 text-xl md:text-2xl', parallax: 1.8, y: [0, 12, 0], rot: [0, -8, 0], dur: 7, delay: 0.5 },
                { cls: 'top-8 left-1/3 md:top-16 md:left-1/4', size: 'w-9 h-9 md:w-12 md:h-12 text-lg md:text-xl', parallax: 1.2, y: [0, -10, 0], rot: [0, 12, 0], dur: 5.5, delay: 3 },
              ];
              return config.heroEmojis.map((em, i) => {
                const pos = positions[i % positions.length];
                return (
                  <motion.div key={i}
                    animate={{ x: mousePosition.x * pos.parallax, y: mousePosition.y * pos.parallax }}
                    transition={{ type: "spring", stiffness: 100, damping: 30 }}
                    className={`absolute ${pos.cls} z-10`}
                  >
                    <motion.div
                      animate={{ y: pos.y, rotate: pos.rot }}
                      transition={{ repeat: Infinity, duration: pos.dur, ease: "easeInOut", delay: pos.delay }}
                      className={`${pos.size} glass-panel rounded-full shadow-2xl flex items-center justify-center border border-white/60 bg-white/40 backdrop-blur-lg`}
                    >
                      {em}
                    </motion.div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* AI CONCIERGE */}
      <section className="py-12 md:py-24 px-4 md:px-6 lg:px-12 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#1A2421]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="container mx-auto max-w-6xl">
          <div className="rounded-2xl md:rounded-[2.5rem] p-5 md:p-16 relative overflow-hidden shadow-2xl" style={{ backgroundColor: config.conciergeBgColor }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6B05C]/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4A7856]/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-6 md:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md border border-white/10 mb-4 md:mb-6">
                  <Sparkles size={14} className="text-brand-secondary" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Powered by Gemini AI</span>
                </div>
                <h2 
                  className="text-2xl md:text-5xl font-extrabold text-white mb-3 md:mb-4 leading-tight whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: homeSettings?.concierge_h1?.replace(/\n/g, '<br/>') || `Taste the Best <br/>that <span className="text-brand-secondary">Surprise you</span>` }}
                />
                <p className="text-white/50 text-xs md:text-base font-medium mb-5 md:mb-8 leading-relaxed max-w-sm whitespace-pre-line">
                  {homeSettings?.concierge_subtitle || 'Nuestro Conserje Gastronómico analiza tu antojo y encuentra el plato perfecto en nuestro menú.'}
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
                    className="bg-brand-secondary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white hover:text-brand-primary transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                  >
                    {isConciergeLoading ? <Loader2 size={16} className="animate-spin" /> : 'Descubrir'}
                  </button>
                </div>
              </div>

              <div className="h-full flex items-center justify-center relative">
                {config.conciergeImg && !conciergeResponse && (
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <img src={config.conciergeImg} alt="Concierge" className="w-full h-full object-cover rounded-2xl md:rounded-[2rem]" />
                  </div>
                )}
                <AnimatePresence mode="wait">
                  {conciergeResponse ? (
                    <motion.div 
                      key="response"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      className="glass-dark w-full p-5 md:p-8 rounded-2xl md:rounded-[2rem] relative z-10"
                    >
                      <div className="absolute -top-6 -left-6 w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center shadow-lg text-white">
                        {config.conciergeImg ? (
                          <img src={config.conciergeImg} alt="Concierge avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <Sparkles size={20} />
                        )}
                      </div>
                      <p className="text-white text-sm md:text-lg font-medium leading-relaxed italic">
                        "{conciergeResponse}"
                      </p>
                      <a href="#menu" className="mt-6 text-[11px] font-bold text-brand-secondary uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2">
                        Ver este plato en el menú <ArrowRight size={14} />
                      </a>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="w-full h-36 md:h-48 border-2 border-dashed border-white/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white/20 p-5 md:p-8 text-center relative z-10"
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

      {/* Modern Gallery: Featured Items */}
      <section id="must-try" className="py-20 md:py-32 px-4 md:px-6 lg:px-12 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-[#1A2421]/5 text-[#1A2421] px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 border border-[#1A2421]/10">
                <ChefHat size={12} className="text-[#E6B05C]" />
                {restaurantSettings?.featured_items_tag || 'Selección del Chef'}
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-4 text-[#1A2421] leading-tight tracking-tight">
                {config.featuredTitle}
              </h2>
              <p className="text-[#1A2421]/50 font-medium text-sm md:text-lg leading-relaxed">
                Descubre los sabores que han cautivado a nuestra comunidad. Preparaciones artesanales con ingredientes de origen local.
              </p>
            </div>
            
            <a href="#menu" className="group flex items-center gap-3 bg-[#1A2421] text-white px-8 py-5 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-black/10">
              Explorar Menú Completo
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {config.featuredItems.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative flex flex-col bg-white rounded-[2rem] overflow-hidden border border-gray-100/10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-700"
              >
                {/* Image Container with Square Aspect Ratio for Compactness */}
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={item.img} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A2421]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Floating Action Badge - Slightly Smaller */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-extrabold text-[#1A2421] shadow-xl border border-white/50 flex items-center gap-1.5">
                       <Sparkles size={10} className="text-[#E6B05C]" />
                       RECOMENDADO
                    </div>
                  </div>
                </div>
                
                {/* Content Area - More Compact Padding */}
                <div className="p-6 md:p-7 flex flex-col flex-1 relative z-10">
                  <h4 className="font-extrabold text-[#1A2421] text-xl md:text-2xl mb-3 leading-tight group-hover:text-[#E6B05C] transition-colors duration-300">
                    {item.name}
                  </h4>
                  
                  <div className="mt-auto flex items-center justify-between gap-4 pt-5 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-gray-300 tracking-[0.2em] mb-0.5">Precio</span>
                      <span className="font-extrabold text-[#1A2421] text-xl">
                        {item.price}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => handleAddToCart(e, item)}
                      className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-[#E6B05C] text-white hover:bg-[#1A2421] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#E6B05C]/20"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Reviews: Infinite Scroll (Light Variant) */}
      <section className="py-24 md:py-32 bg-[#FAFAFA] relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 lg:px-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-[#1A2421]/5 text-[#1A2421] px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 border border-[#1A2421]/10"
            >
              <Quote size={12} className="text-[#E6B05C]" />
              Voces de la Comunidad
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-6xl font-extrabold text-[#1A2421] mb-6 tracking-tight leading-tight"
            >
              Experiencias que <span className="text-[#E6B05C]">dejan huella.</span>
            </motion.h2>
          </div>

          <div className="marquee-container relative flex overflow-hidden py-4 -translate-y-4">
            <div className="animate-infinite-scroll flex gap-6 px-4">
              {[...config.reviews, ...config.reviews, ...config.reviews, ...config.reviews].map((rev, idx) => (
                <div 
                  key={idx} 
                  className="w-[320px] md:w-[450px] shrink-0 bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 flex flex-col gap-6 relative group overflow-hidden shadow-xl shadow-gray-200/50"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Quote size={80} className="text-[#1A2421]" />
                  </div>
                  
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={14} fill={star <= (rev.rating || 5) ? "#E6B05C" : "none"} className={star <= (rev.rating || 5) ? "text-[#E6B05C]" : "text-gray-200"} />
                    ))}
                  </div>
                  
                  <p className="text-[#1A2421]/80 text-lg md:text-xl font-medium leading-relaxed italic relative z-10">
                    "{rev.text}"
                  </p>
                  
                  <div className="flex items-center gap-4 mt-auto pt-8 border-t border-gray-50 relative z-10">
                    <img src={rev.img || `https://ui-avatars.com/api/?name=${rev.name}&background=E6B05C&color=fff`} alt={rev.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#1A2421]/5" />
                    <div>
                      <h4 className="font-bold text-[#1A2421] text-base">{rev.name}</h4>
                      <p className="text-[#1A2421]/40 text-[10px] font-bold uppercase tracking-[0.2em]">{rev.role || 'Cliente Satisfecho'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <Footer />

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <Suspense fallback={null}>
            <ProductQuickView 
              product={quickViewProduct} 
              onClose={() => setQuickViewProduct(null)} 
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
