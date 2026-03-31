import { useState, useRef } from "react";
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
    // Calculamos qué tarjeta está activa basándonos en el scroll
    const scrollLeft = e.target.scrollLeft;
    // El ancho de cada tarjeta más el gap (aprox)
    const itemWidth = e.target.scrollWidth / CARDS.length;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < CARDS.length) {
      setActiveSlide(newIndex);
    }
  };

  return (
    <section id="beneficios" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-8 md:mb-12">
        <h2 className="text-4xl md:text-5xl text-[#1A1A1A] max-w-2xl leading-tight mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Mucho más que un menú. El ecosistema completo para tu restaurante.
        </h2>
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl font-light">
          Explora los servicios y beneficios diseñados para aumentar tu rentabilidad y digitalizar tu local con elegancia.
        </p>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        className="flex gap-4 md:gap-6 overflow-x-auto pb-8 pt-4 px-4 md:px-6 hide-scrollbar snap-x snap-mandatory scroll-smooth"
        onScroll={handleScroll}
      >
        {CARDS.map((card, idx) => (
          <div 
            key={idx} 
            // Altura reducida a h-[400px] md:h-[460px] para que no sean excesivamente largas
            className="relative w-[80vw] sm:w-[300px] md:w-[340px] h-[400px] md:h-[460px] snap-center md:snap-start bg-[#F7F7F5] rounded-[40px] p-6 md:p-8 flex flex-col justify-between shrink-0 border border-black/5 hover:border-black/10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden"
          >
            {/* Pequeña muesca simulando la parte superior de un celular */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-white/50 rounded-b-xl border border-t-0 border-black/5"></div>

            <div className="mt-4">
              <div className="inline-block px-4 py-2 rounded-full bg-white text-[#2D6A4F] text-xs font-bold uppercase tracking-wider mb-6 md:mb-8 shadow-sm group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors duration-300">
                {card.highlight}
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl text-[#1A1A1A] mb-3 md:mb-4 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {card.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                {card.desc}
              </p>
            </div>
            
            {/* Pequeña línea decorativa que crece al hacer hover (simulando barra Home iOS) */}
            <div className="w-12 group-hover:w-[60%] mx-auto transition-all duration-500 h-1 bg-[#D4A853] rounded-full" />
          </div>
        ))}
      </div>

      {/* Paginación Visual */}
      <div className="flex justify-center items-center gap-2 mt-4 md:mt-8">
        {CARDS.map((_, idx) => (
          <div 
            key={`dot-${idx}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === idx 
                ? "w-8 bg-[#2D6A4F]" // Activo: pastilla verde oscuro
                : "w-2 bg-gray-200"  // Inactivo: puntito gris
            }`}
          />
        ))}
      </div>
    </section>
  );
}
