<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aluna - La nueva era gastronómica</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

@import "tailwindcss";

@theme {
  --font-sans: "Inter", sans-serif;
  --font-serif: "DM Serif Display", serif;
}

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

html {
  scroll-behavior: smooth;
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import React, { useRef, useState, useEffect } from "react";
import { motion, useSpring, useTransform, useInView } from "motion/react";

export function Counter({ value, suffix = "" }: { value: number, suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const spring = useSpring(0, { mass: 1, stiffness: 50, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current) + suffix);

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

export function FadeIn({ children, delay = 0, className = "", direction = "up" }: any) {
  const yOffset = direction === "up" ? 30 : direction === "down" ? -30 : 0;
  const xOffset = direction === "left" ? 30 : direction === "right" ? -30 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MagneticButton({ children, className = "", onClick }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`inline-block ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function SpotlightCard({ children, className = "", spotlightColor = "rgba(45,106,79,0.08)" }: any) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 z-0"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export function InfiniteMarquee({ items }: { items: React.ReactNode[] }) {
  return (
    <div 
      className="relative flex overflow-hidden w-full bg-transparent py-4"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
    >
      <motion.div
        className="flex whitespace-nowrap gap-24 items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 30, repeat: Infinity }}
      >
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex-shrink-0">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ShoppingBag, Plus, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MENU_ITEMS = [
  { id: 1, name: "Avocado Toast", price: "$24.000", category: "Brunch", img: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?q=80&w=200&auto=format&fit=crop" },
  { id: 2, name: "Huevos Poché", price: "$18.000", category: "Brunch", img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=200&auto=format&fit=crop" },
  { id: 3, name: "Latte Frío", price: "$12.000", category: "Bebidas", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=200&auto=format&fit=crop" },
  { id: 4, name: "Matcha", price: "$14.000", category: "Bebidas", img: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?q=80&w=200&auto=format&fit=crop" },
  { id: 5, name: "Açaí Bowl", price: "$22.000", category: "Postres", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=200&auto=format&fit=crop" },
];
const CATEGORIES = ["Todos", "Brunch", "Bebidas", "Postres"];

const NOTIFICATIONS = [
  "Mesa 3 pidió Latte Frío",
  "Mesa 7 pidió Avocado Toast",
  "Mesa 2 pidió Matcha",
  "Mesa 5 pidió Açaí Bowl",
  "Mesa 1 pidió Huevos Poché"
];

export function InteractivePhone() {
  const [activeCat, setActiveCat] = useState("Todos");
  const [cart, setCart] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomNotif = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
      setNotification(randomNotif);
      setTimeout(() => setNotification(null), 3000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeCat === "Todos" ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === activeCat);

  return (
    <div className="relative w-[300px] h-[620px] bg-[#F7F7F5] rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.25)] border-[12px] border-[#1A1A1A] overflow-hidden flex flex-col ring-1 ring-white/20">
      {/* Hardware Buttons */}
      <div className="absolute -left-[14px] top-[120px] w-[3px] h-[26px] bg-[#1A1A1A] rounded-l-md"></div>
      <div className="absolute -left-[14px] top-[160px] w-[3px] h-[45px] bg-[#1A1A1A] rounded-l-md"></div>
      <div className="absolute -left-[14px] top-[215px] w-[3px] h-[45px] bg-[#1A1A1A] rounded-l-md"></div>
      <div className="absolute -right-[14px] top-[180px] w-[3px] h-[65px] bg-[#1A1A1A] rounded-r-md"></div>

      {/* Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#1A1A1A] rounded-full z-[60] flex items-center justify-between px-2">
        <div className="w-2 h-2 rounded-full bg-[#0A0A0A] border border-white/5"></div>
        <div className="w-2 h-2 rounded-full bg-[#0A0A0A] border border-white/5"></div>
      </div>

      {/* Real-time Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-12 left-4 right-4 bg-[#2D6A4F] text-white text-xs py-3 px-4 rounded-2xl shadow-xl z-50 flex items-center gap-3"
          >
            <Bell className="w-4 h-4" />
            <span className="font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h3 className="font-serif text-xl text-[#1A1A1A]">Aluna Café</h3>
          <p className="text-[10px] text-[#2D6A4F] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse"></span>
            Menú en vivo
          </p>
        </div>
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-[#1A1A1A]" />
          <AnimatePresence>
            {cart > 0 && (
              <motion.span 
                initial={{scale:0}} 
                animate={{scale:1}} 
                exit={{scale:0}}
                className="absolute -top-1.5 -right-1.5 bg-[#2D6A4F] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              >
                {cart}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-4 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
        {CATEGORIES.map(c => (
          <button 
            key={c} 
            onClick={() => setActiveCat(c)} 
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCat === c ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#1A1A1A]'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {filtered.map(item => (
            <motion.div 
              layout 
              initial={{opacity:0, scale: 0.9, y: 10}} 
              animate={{opacity:1, scale: 1, y: 0}} 
              exit={{opacity:0, scale: 0.9, y: -10}} 
              transition={{ duration: 0.2 }}
              key={item.id} 
              className="bg-white p-2.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex gap-3 items-center border border-transparent hover:border-[#2D6A4F]/30 transition-colors"
            >
              <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden relative shrink-0">
                <img src={item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-[#1A1A1A] leading-tight">{item.name}</h4>
                <p className="text-xs text-[#2D6A4F] font-medium mt-0.5">{item.price}</p>
              </div>
              <button 
                onClick={() => setCart(c => c + 1)} 
                className="w-8 h-8 rounded-full bg-[#F7F7F5] flex items-center justify-center hover:bg-[#2D6A4F] hover:text-white transition-colors text-[#1A1A1A] shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";

const SERVICES = [
  {
    id: "01",
    title: "Menús Inteligentes",
    desc: "Interfaces dinámicas que se adaptan al comportamiento del usuario, destacando tus platos estrella y aumentando el ticket promedio.",
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "02",
    title: "Pedidos Integrados",
    desc: "Sincronización perfecta con WhatsApp y tu sistema POS. Menos errores humanos, más eficiencia en la cocina.",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "03",
    title: "Identidad Visual",
    desc: "Diseño a medida que respira la atmósfera de tu local. Desde la tipografía hasta la paleta de colores, todo comunica tu esencia.",
    img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop"
  }
];

export function StickyServices() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) setActiveIndex(0);
    else if (latest < 0.66) setActiveIndex(1);
    else setActiveIndex(2);
  });

  return (
    <section id="servicios" ref={containerRef} className="relative h-[300vh] bg-[#F7F7F5] px-4 md:px-6 py-12">
      <div className="sticky top-6 h-[calc(100vh-3rem)] w-full rounded-[40px] overflow-hidden shadow-2xl bg-[#1A1A1A]">
        {/* Background Images */}
        {SERVICES.map((s, i) => (
          <motion.div
            key={s.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: activeIndex === i ? 1 : 0,
              scale: activeIndex === i ? 1 : 1.05
            }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <img src={s.img} alt={s.title} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
          </motion.div>
        ))}

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="relative w-full max-w-4xl mx-auto h-[300px]">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.id}
                className="absolute top-1/2 left-1/2 w-full flex flex-col items-center justify-center text-center"
                initial={{ opacity: 0, y: "calc(-50% + 40px)", x: "-50%" }}
                animate={{
                  opacity: activeIndex === i ? 1 : 0,
                  y: activeIndex === i ? "-50%" : activeIndex > i ? "calc(-50% - 40px)" : "calc(-50% + 40px)",
                  x: "-50%",
                  pointerEvents: activeIndex === i ? "auto" : "none"
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="text-[#D4A853] font-serif text-2xl md:text-3xl mb-4">{s.id}</div>
                <h3 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">{s.title}</h3>
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { ArrowRight, Instagram, Facebook, Twitter, Sparkles, Check } from "lucide-react";
import { InteractivePhone } from "./components/InteractivePhone";
import { FadeIn, MagneticButton, SpotlightCard, InfiniteMarquee, Counter } from "./components/animations";
import { StickyServices } from "./components/StickyServices";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F7F7F5] selection:bg-[#2D6A4F] selection:text-white relative pb-24">
      
      {/* FLOATING BOTTOM NAVBAR */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full p-2 flex items-center shadow-2xl w-[95%] max-w-fit">
        <a href="#" className="font-serif text-xl tracking-tight text-white px-4 hidden md:block">
          Aluna
        </a>
        <div className="w-[1px] h-6 bg-white/20 mx-2 hidden md:block"></div>
        <div className="flex items-center gap-1 sm:gap-2 px-2 overflow-x-auto scrollbar-hide">
          <a href="#nosotros" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">Nosotros</a>
          <a href="#servicios" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">Servicios</a>
          <a href="#beneficios" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">Beneficios</a>
          <a href="#portafolio" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">Portafolio</a>
          <a href="#planes" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">Planes</a>
        </div>
        <div className="w-[1px] h-6 bg-white/20 mx-2"></div>
        <a href="#contacto" className="bg-white text-[#1A1A1A] px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-all whitespace-nowrap">
          Comenzar
        </a>
      </nav>

      <main className="flex-grow">
        {/* HERO */}
        <section className="pt-4 px-4 md:px-6 pb-12">
          <div className="w-full relative rounded-[40px] overflow-hidden bg-[#0A0A0A] min-h-[90vh] flex items-center shadow-2xl border border-white/10">
            {/* Subtle Logo at the top center */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
              <span className="font-serif text-3xl text-white/90 tracking-wide">Aluna</span>
            </div>

            <img src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop" alt="Restaurant Background" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
            
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-24 grid md:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
              <div className="max-w-2xl">
                <FadeIn delay={0.1}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium tracking-wide uppercase mb-8">
                    <Sparkles className="w-4 h-4 text-[#D4A853]" />
                    La nueva era gastronómica
                  </div>
                </FadeIn>
                <FadeIn delay={0.2}>
                  <h1 className="font-serif text-[56px] md:text-[80px] leading-[0.95] text-white mb-8 tracking-tight">
                    Diseñando espacios <br/>
                    <span className="italic text-[#D4A853] font-light">digitales</span> que inspiran.
                  </h1>
                </FadeIn>
                <FadeIn delay={0.3}>
                  <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed font-light max-w-lg">
                    Elevamos la gastronomía al mundo digital. Menús interactivos, pedidos fluidos y experiencias que cautivan a tus comensales desde el primer clic.
                  </p>
                </FadeIn>
                <FadeIn delay={0.4}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <MagneticButton>
                      <a href="#contacto" className="bg-white text-[#1A1A1A] px-8 py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                        Agendar una Demostración
                      </a>
                    </MagneticButton>
                    <MagneticButton>
                      <a href="#portafolio" className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        Ver Portafolio
                      </a>
                    </MagneticButton>
                  </div>
                </FadeIn>
              </div>
              
              <FadeIn delay={0.5} direction="left" className="flex justify-center hidden md:flex relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[650px] bg-[#2D6A4F]/30 blur-[100px] rounded-full"></div>
                <InteractivePhone />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ABOUT & STATS */}
        <section id="nosotros" className="py-24 px-6 md:px-12 lg:px-20 bg-[#F7F7F5] overflow-hidden">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className="font-serif text-4xl text-[#1A1A1A] mb-6">Sobre la Compañía</h2>
              <p className="text-[#6B7280] leading-relaxed mb-12 max-w-md">
                En Aluna, creemos que un menú es más que una lista de platos; se trata de crear entornos digitales que mejoren la experiencia humana y reflejen la esencia de tu marca.
              </p>
              
              <InfiniteMarquee items={[
                <span key="1" className="font-serif text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">WhatsApp</span>,
                <span key="2" className="font-serif text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">Instagram</span>,
                <span key="3" className="font-serif text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">Stripe</span>,
                <span key="4" className="font-serif text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">Toast POS</span>,
                <span key="5" className="font-serif text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">UberEats</span>,
                <span key="6" className="font-serif text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">Rappi</span>
              ]} />
            </FadeIn>
            
            <FadeIn delay={0.2} className="grid grid-cols-2 gap-4">
              <SpotlightCard spotlightColor="rgba(255,255,255,0.2)" className="bg-gradient-to-br from-[#2D6A4F] to-[#153527] border border-white/10 rounded-[24px] p-6 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                <div className="font-serif text-4xl text-white mb-2"><Counter value={25} suffix="+" /></div>
                <div className="text-xs text-white/80 uppercase tracking-wider font-medium">Años de excelencia</div>
              </SpotlightCard>
              <SpotlightCard spotlightColor="rgba(255,255,255,0.1)" className="bg-gradient-to-br from-[#1A1A1A] to-[#2D6A4F]/60 border border-white/10 rounded-[24px] p-6 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                <div className="font-serif text-4xl text-white mb-2"><Counter value={500} suffix="+" /></div>
                <div className="text-xs text-white/80 uppercase tracking-wider font-medium">Restaurantes</div>
              </SpotlightCard>
              <SpotlightCard spotlightColor="rgba(255,255,255,0.2)" className="bg-gradient-to-br from-[#D4A853] to-[#8c6f27] border border-white/10 rounded-[24px] p-6 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                <div className="font-serif text-4xl text-white mb-2"><Counter value={98} suffix="%" /></div>
                <div className="text-xs text-white/80 uppercase tracking-wider font-medium">Retención</div>
              </SpotlightCard>
              <SpotlightCard spotlightColor="rgba(255,255,255,0.1)" className="bg-gradient-to-br from-[#1A1A1A] to-[#D4A853]/60 border border-white/10 rounded-[24px] p-6 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                <div className="font-serif text-4xl text-white mb-2"><Counter value={15} suffix="+" /></div>
                <div className="text-xs text-white/80 uppercase tracking-wider font-medium">Países</div>
              </SpotlightCard>
            </FadeIn>
          </div>
        </section>

        {/* SERVICES */}
        <StickyServices />

        {/* BENEFITS */}
        <section id="beneficios" className="py-24 px-6 md:px-12 lg:px-20 bg-[#F7F7F5]">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-16">
              <h2 className="font-serif text-4xl text-[#1A1A1A] mb-4">El Impacto Aluna</h2>
              <p className="text-[#6B7280] text-sm uppercase tracking-[0.2em]">Resultados medibles para tu negocio</p>
            </FadeIn>
            
            <FadeIn delay={0.2} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: "01", title: "Ticket Promedio", desc: "Aumenta tus ventas hasta un 25% con upselling inteligente y sugerencias visuales." },
                { step: "02", title: "Rotación Ágil", desc: "Reduce tiempos de espera. Tus clientes ordenan y pagan directamente desde su mesa." },
                { step: "03", title: "Data Propia", desc: "Conoce a tus comensales. Construye tu propia base de datos para campañas de fidelización." },
                { step: "04", title: "Cero Comisiones", desc: "Libérate de intermediarios. Recibe pedidos directos para delivery o take-out." }
              ].map((item, i) => (
                <SpotlightCard key={i} className="bg-white p-6 rounded-[24px] border border-[#E5E7EB] hover:border-[#2D6A4F]/50 transition-colors group relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-[80px] font-serif text-[#F7F7F5] group-hover:text-[#2D6A4F]/5 transition-colors z-0">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-[#F7F7F5] flex items-center justify-center text-xs font-bold text-[#1A1A1A] mb-6 group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors">
                      {item.step}
                    </div>
                    <h3 className="font-serif text-xl text-[#1A1A1A] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
                  </div>
                </SpotlightCard>
              ))}
            </FadeIn>
          </div>
        </section>

        {/* PORTFOLIO */}
        <section id="portafolio" className="py-32 px-6 md:px-12 lg:px-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="font-serif text-5xl text-[#1A1A1A] mb-6 leading-tight">Portafolio Destacado</h2>
                <p className="text-[#6B7280] text-lg leading-relaxed">
                  Proyectos que redefinen la interacción entre comensales y restaurantes.
                </p>
              </div>
              <MagneticButton>
                <button className="border border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 rounded-full text-sm font-medium hover:bg-[#1A1A1A] hover:text-white transition-colors">
                  Ver todos los proyectos
                </button>
              </MagneticButton>
            </FadeIn>
            
            <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[300px] gap-6">
              <FadeIn delay={0.1} className="md:col-span-2 relative rounded-[32px] overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop" alt="Portfolio 1" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <div className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3 border border-white/30">Menú Interactivo</div>
                  <h3 className="text-white font-serif text-3xl mb-2">Osteria Francescana</h3>
                  <p className="text-gray-300">Rediseño completo de experiencia digital</p>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.2} className="md:col-span-1 md:row-span-2 relative rounded-[32px] overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop" alt="Portfolio 2" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <div className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3 border border-white/30">Identidad Visual</div>
                  <h3 className="text-white font-serif text-3xl mb-2">Café de la Paz</h3>
                  <p className="text-gray-300">Branding & Menú QR</p>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.3} className="md:col-span-1 relative rounded-[32px] overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=600&auto=format&fit=crop" alt="Portfolio 3" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <div className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3 border border-white/30">Sistema POS</div>
                  <h3 className="text-white font-serif text-2xl mb-2">Pujol</h3>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.4} className="md:col-span-1 relative rounded-[32px] overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop" alt="Portfolio 4" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <div className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3 border border-white/30">App de Pedidos</div>
                  <h3 className="text-white font-serif text-2xl mb-2">Noma</h3>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="planes" className="py-32 px-6 md:px-12 lg:px-20 bg-[#F7F7F5]">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="font-serif text-5xl text-[#1A1A1A] mb-6">Planes Transparentes</h2>
              <p className="text-[#6B7280] text-lg leading-relaxed">
                Soluciones escalables que crecen junto con tu negocio gastronómico.
              </p>
            </FadeIn>
            
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
              <FadeIn delay={0.1}>
                <SpotlightCard className="bg-white p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB] flex flex-col h-full">
                  <h3 className="text-2xl font-serif text-[#1A1A1A] mb-2">Esencial</h3>
                  <p className="text-sm text-[#6B7280] mb-8">Perfecto para cafeterías y locales pequeños.</p>
                  <div className="font-serif text-5xl text-[#1A1A1A] mb-8">$49.000<span className="text-lg font-sans text-[#6B7280]">/mes</span></div>
                  <ul className="space-y-4 mb-10 flex-1">
                    {["Menú digital interactivo", "Hasta 50 productos", "Código QR personalizado", "Soporte por email"].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-[#1A1A1A]">
                        <Check className="w-4 h-4 text-[#2D6A4F]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full border border-[#1A1A1A] text-[#1A1A1A] py-4 rounded-full text-sm font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors">
                    Elegir Esencial
                  </button>
                </SpotlightCard>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <SpotlightCard spotlightColor="rgba(255,255,255,0.1)" className="bg-[#1A1A1A] p-12 rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden transform lg:-translate-y-4 border border-[#1A1A1A]">
                  <div className="absolute top-8 right-8 bg-[#2D6A4F] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Popular
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-2">Profesional</h3>
                  <p className="text-sm text-gray-400 mb-8">Para restaurantes con alto volumen.</p>
                  <div className="font-serif text-5xl text-white mb-8">$99.000<span className="text-lg font-sans text-gray-400">/mes</span></div>
                  <ul className="space-y-4 mb-10 flex-1">
                    {["Productos ilimitados", "Integración con WhatsApp", "Panel de analíticas", "Soporte prioritario 24/7", "Múltiples sucursales"].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-[#2D6A4F]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-white text-[#1A1A1A] py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                    Elegir Profesional
                  </button>
                </SpotlightCard>
              </FadeIn>

              <FadeIn delay={0.3}>
                <SpotlightCard spotlightColor="rgba(212,168,83,0.15)" className="bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A] p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#D4A853]/30 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A853]/10 blur-2xl rounded-full"></div>
                  <h3 className="text-2xl font-serif text-[#D4A853] mb-2 flex items-center gap-2">
                    Élite <Sparkles className="w-5 h-5" />
                  </h3>
                  <p className="text-sm text-gray-400 mb-8">Impulsado por Inteligencia Artificial.</p>
                  <div className="font-serif text-5xl text-white mb-8">$199.000<span className="text-lg font-sans text-gray-400">/mes</span></div>
                  <ul className="space-y-4 mb-10 flex-1">
                    {["Todo lo de Profesional", "Recomendaciones predictivas IA", "Chatbot de atención 24/7", "Precios dinámicos", "Marketing automatizado"].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-[#D4A853]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-[#D4A853] text-[#1A1A1A] py-4 rounded-full text-sm font-semibold hover:bg-[#C39A4A] transition-colors">
                    Contactar Ventas
                  </button>
                </SpotlightCard>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contacto" className="py-32 px-6 md:px-12 lg:px-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <FadeIn direction="right">
              <h2 className="font-serif text-5xl text-[#1A1A1A] mb-6 leading-tight">¿Listo para dar el siguiente paso?</h2>
              <p className="text-[#6B7280] text-lg leading-relaxed mb-10 max-w-md">
                Déjanos tus datos y nuestro equipo se pondrá en contacto contigo para diseñar una propuesta a la medida de tu restaurante.
              </p>
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#1A1A1A]">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Escríbenos</div>
                    <a href="mailto:hola@aluna.com" className="text-lg font-medium text-[#1A1A1A] hover:text-[#2D6A4F] transition-colors">hola@aluna.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#1A1A1A]">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Llámanos</div>
                    <a href="tel:+573001234567" className="text-lg font-medium text-[#1A1A1A] hover:text-[#2D6A4F] transition-colors">+57 300 123 4567</a>
                  </div>
                </div>
              </div>
            </FadeIn>
            
            <FadeIn direction="left" delay={0.2}>
              <SpotlightCard className="bg-white border border-[#E5E7EB] shadow-[0_20px_40px_rgba(0,0,0,0.04)] p-8 md:p-12 rounded-[32px] relative overflow-hidden">
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-8">Solicitar Demostración</h3>
                <form className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Nombre Completo</label>
                      <input type="text" className="w-full bg-[#F7F7F5] border-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all" placeholder="Ej. Carlos Mendoza" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Restaurante</label>
                      <input type="text" className="w-full bg-[#F7F7F5] border-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all" placeholder="Nombre de tu local" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Correo Electrónico</label>
                    <input type="email" className="w-full bg-[#F7F7F5] border-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all" placeholder="carlos@restaurante.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">¿En qué podemos ayudarte?</label>
                    <textarea rows={3} className="w-full bg-[#F7F7F5] border-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all resize-none" placeholder="Cuéntanos sobre tus necesidades actuales..."></textarea>
                  </div>
                  <MagneticButton className="w-full mt-2">
                    <button type="button" className="w-full bg-[#1A1A1A] text-white py-4 rounded-full text-sm font-semibold hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-2">
                      Enviar Solicitud <ArrowRight className="w-4 h-4" />
                    </button>
                  </MagneticButton>
                </form>
              </SpotlightCard>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1A1A1A] text-white pt-24 pb-12 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <a href="/" className="font-serif text-4xl tracking-tight text-white block mb-6">
                Aluna
              </a>
              <p className="text-gray-400 max-w-sm leading-relaxed mb-8">
                Transformando la experiencia gastronómica a través de diseño editorial y tecnología de vanguardia.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2D6A4F] transition-colors"><Instagram className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2D6A4F] transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2D6A4F] transition-colors"><Twitter className="w-4 h-4" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-6">Compañía</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#nosotros" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
                <li><a href="#portafolio" className="hover:text-white transition-colors">Portafolio</a></li>
                <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-6">Legal</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Aluna. Todos los derechos reservados.</p>
            <p>Diseñado por uxio by sietech</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

