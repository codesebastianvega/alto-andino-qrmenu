import { useState, useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

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

export default function AlunaFeatures() {
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
                <div className="text-[#D4A853] font-serif text-2xl md:text-3xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>{s.id}</div>
                <h3 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>{s.title}</h3>
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
