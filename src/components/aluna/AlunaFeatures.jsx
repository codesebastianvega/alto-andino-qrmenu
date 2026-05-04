import { useState } from "react";
import { motion } from "framer-motion";

const CARDS = [
  {
    title: "Menús Inteligentes",
    desc: "Interfaces dinámicas que se adaptan al comportamiento del usuario, destacando tus platos estrella.",
    highlight: "Sube tu ticket 20%"
  },
  {
    title: "Pedidos Integrados",
    desc: "Sincronización perfecta con WhatsApp y tu sistema POS. Menos errores humanos, más eficiencia.",
    highlight: "Cero fricción"
  },
  {
    title: "Identidad Visual",
    desc: "Diseño a medida que respira la atmósfera de tu local. Colores y tipografías que comunican tu esencia.",
    highlight: "100% Personalizable"
  },
  {
    title: "Sin Comisiones",
    desc: "Deja de perder un gran porcentaje de tu rentabilidad. Con Aluna, cada pedido es directamente tuyo, sin intermediarios.",
    highlight: "$0 por transacción"
  },
  {
    title: "Analíticas de Negocio",
    desc: "Conoce a tus clientes. Qué platos se venden más y a qué horas, para tomar decisiones de negocio estratégicas.",
    highlight: "Data en tiempo real"
  }
];

export default function AlunaFeatures() {
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const itemWidth = e.target.scrollWidth / CARDS.length;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < CARDS.length) {
      setActiveSlide(newIndex);
    }
  };

  return (
    <section id="beneficios" className="pt-24 pb-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-16 md:mb-20 text-center md:text-left">
        <h2 className="text-4xl md:text-5xl text-[#1A1A1A] max-w-4xl leading-[1.1] mb-8 mx-auto md:mx-0" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Mucho más que un menú. El ecosistema completo para tu restaurante.
        </h2>
        <p className="text-gray-500 text-xl md:text-2xl max-w-3xl font-light mx-auto md:mx-0 leading-relaxed">
          Explora los servicios y beneficios diseñados para aumentar tu rentabilidad y digitalizar tu local con elegancia.
        </p>
      </div>

      {/* Grid en Desktop, Slider en Mobile */}
      <div className="overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-12">
        <div className="flex gap-6 px-4 md:px-[calc((100vw-1280px)/2+24px)] min-w-max">
          {CARDS.map((card, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative w-[300px] md:w-[340px] snap-center bg-[#F9F9F7] rounded-3xl p-8 md:p-10 flex flex-col justify-between shrink-0 border border-black/[0.03] hover:shadow-xl transition-all duration-500 group"
            >
              <div>
                <div className="inline-block px-4 py-1.5 rounded-full bg-white text-[#2D6A4F] text-[10px] font-bold uppercase tracking-wider mb-8 shadow-sm group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors duration-300">
                  {card.highlight}
                </div>
                <h3 className="text-3xl text-[#1A1A1A] mb-6 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {card.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-base">
                  {card.desc}
                </p>
              </div>
              
              <div className="w-12 group-hover:w-20 transition-all duration-500 h-1 bg-[#D4A853] rounded-full mt-8" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Paginación solo en Mobile */}
      <div className="flex md:hidden justify-center items-center gap-2 mt-8">
        {CARDS.map((_, idx) => (
          <div 
            key={`dot-${idx}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === idx ? "w-8 bg-[#2D6A4F]" : "w-2 bg-gray-200"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
