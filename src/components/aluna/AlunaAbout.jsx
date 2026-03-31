import { motion } from "framer-motion";

// Componente helper para el Marquee Infinito
function InfiniteMarquee({ items }) {
  return (
    // 1. Contenedor Máscara (Oculta lo que se desborda y difumina los bordes)
    <div 
      className="relative flex overflow-hidden w-full bg-transparent py-4 my-8"
      style={{ 
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', 
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' 
      }}
    >
      {/* 2. Pista de movimiento (Track) */}
      <motion.div
        className="flex whitespace-nowrap gap-28 items-center"
        animate={{ x: ["0%", "-50%"] }} // Se mueve desde 0 hasta la mitad exacta
        transition={{ ease: "linear", duration: 25, repeat: Infinity }} // Movimiento constante e infinito
      >
        {/* 3. Duplicación de elementos */}
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex-shrink-0">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function AlunaAbout() {
  return (
    <section id="nosotros" className="py-24 px-6 md:px-12 lg:px-20 bg-[#F7F7F5] overflow-hidden">
      
      {/* Contenedor principal: Grid de 2 columnas centrado */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        {/* COLUMNA IZQUIERDA: Textos y Slider */}
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl text-[#1A1A1A] mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Sobre la Compañía
          </h2>
          <p className="text-[#6B7280] text-lg leading-relaxed mb-4 max-w-md">
            En Aluna, creemos que un menú es más que una lista de platos; se trata de crear entornos digitales que mejoren la experiencia humana y reflejen la esencia de tu marca.
          </p>
          
          {/* Componente del Slider */}
          <InfiniteMarquee items={[
            <span className="text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:text-[#25D366] transition-all cursor-default" style={{ fontFamily: "'DM Serif Display', serif" }}>WhatsApp</span>,
            <span className="text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:text-[#E1306C] transition-all cursor-default" style={{ fontFamily: "'DM Serif Display', serif" }}>Instagram</span>,
            <span className="text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:text-[#635BFF] transition-all cursor-default" style={{ fontFamily: "'DM Serif Display', serif" }}>Stripe</span>,
            <span className="text-3xl font-bold tracking-tighter opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:text-[#FF6600] transition-all cursor-default" style={{ fontFamily: "'DM Serif Display', serif" }}>Toast POS</span>
          ]} />
        </div>
        
        {/* COLUMNA DERECHA: Grid 2x2 de Estadísticas */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          
          {/* Tarjeta 1 (Verde) */}
          <div className="bg-gradient-to-br from-[#2D6A4F] to-[#153527] border border-white/10 rounded-[28px] p-8 flex flex-col items-center justify-center text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 min-h-[180px]">
            <div className="text-5xl text-white mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>25+</div>
            <div className="text-xs text-white/80 uppercase tracking-[0.15em] font-semibold">Integraciones</div>
          </div>
          
          {/* Tarjeta 2 (Oscura con destello verde) */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D6A4F]/60 border border-white/10 rounded-[28px] p-8 flex flex-col items-center justify-center text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 min-h-[180px]">
            <div className="text-5xl text-white mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>500+</div>
            <div className="text-xs text-white/80 uppercase tracking-[0.15em] font-semibold">Restaurantes</div>
          </div>
          
          {/* Tarjeta 3 (Dorada) */}
          <div className="bg-gradient-to-br from-[#D4A853] to-[#8c6f27] border border-white/10 rounded-[28px] p-8 flex flex-col items-center justify-center text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 min-h-[180px]">
            <div className="text-5xl text-white mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>98%</div>
            <div className="text-xs text-white/80 uppercase tracking-[0.15em] font-semibold">Retención</div>
          </div>
          
          {/* Tarjeta 4 (Oscura con destello dorado) */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#D4A853]/60 border border-white/10 rounded-[28px] p-8 flex flex-col items-center justify-center text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 min-h-[180px]">
            <div className="text-5xl text-white mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>15+</div>
            <div className="text-xs text-white/80 uppercase tracking-[0.15em] font-semibold">Países</div>
          </div>

        </div>
      </div>
    </section>
  );
}
