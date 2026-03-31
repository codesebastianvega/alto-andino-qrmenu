import { useState, useRef } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";

const STEPS = [
  {
    id: "01",
    title: "Sube tu Menú",
    desc: "Plataforma de autogestión ultra rápida. Sube tus platos, fotos impactantes y precios en minutos. Sin depender de terceros.",
    img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "02",
    title: "Personaliza tu Identidad",
    desc: "Tu restaurante, tus reglas. Aplica tus colores, logo y tipografías para que el menú digital sea una extensión real de tu marca.",
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "03",
    title: "Escanean y Compran",
    desc: "Coloca QRs estéticos en tus mesas. Tus clientes escanean, piden sin fricción y los pedidos llegan directo a tu WhatsApp o POS.",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop"
  }
];

export default function AlunaHowItWorks() {
  const containerRef = useRef(null);

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

  // Ocultar el helper de scroll suavemente al llegar al último tercio
  const promptOpacity = useTransform(scrollYProgress, [0.6, 0.7], [1, 0]);

  return (
    <section id="como-funciona" ref={containerRef} className="relative h-[300vh] bg-[#F7F7F5] px-4 md:px-6 py-12">

      {/* Sticky container */}
      <div className="sticky top-6 h-[calc(100vh-3rem)] w-full rounded-[40px] overflow-hidden shadow-2xl bg-[#1A1A1A]">

        {/* Background images */}
        {STEPS.map((s, i) => (
          <motion.div
            key={`bg-${s.id}`}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: activeIndex === i ? 1 : 0,
              scale: activeIndex === i ? 1 : 1.05
            }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <img
              src={s.img}
              alt={s.title}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
          </motion.div>
        ))}

        {/* Content (texts) */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="relative w-full max-w-4xl mx-auto h-[300px]">
            {STEPS.map((s, i) => (
              <motion.div
                key={`content-${s.id}`}
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
                <div className="text-[#D4A853] text-2xl md:text-3xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {s.id}
                </div>
                <h3 className="text-4xl md:text-5xl lg:text-7xl text-white mb-6 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {s.title}
                </h3>
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-20">
          <motion.div 
            className="h-full bg-[#D4A853]"
            style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
          />
        </div>

        {/* Scroll Helper Prompt */}
        <motion.div 
          className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20"
          style={{ opacity: promptOpacity, pointerEvents: 'none' }}
        >
          <span className="text-white/60 text-xs md:text-sm font-medium uppercase tracking-[0.2em]">
            Sigue bajando
          </span>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 md:w-6 md:h-10 border-2 border-white/30 rounded-full flex justify-center pt-1 md:pt-1.5"
          >
            <div className="w-1 h-2 bg-[#D4A853] rounded-full" />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
