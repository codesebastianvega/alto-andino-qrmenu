import { motion } from "framer-motion";
import { Icon } from "@iconify-icon/react";

// Componente helper para el Marquee Infinito
function InfiniteMarquee({ items }) {
  return (
    <div 
      className="relative flex overflow-hidden w-full bg-transparent py-4 my-6 sm:my-8"
      style={{ 
        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', 
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
      }}
    >
      <motion.div
        className="flex whitespace-nowrap gap-16 sm:gap-24 items-center"
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

const stats = [
  {
    value: "+35%",
    label: "TICKET PROMEDIO",
    desc: "Aumento comprobado gracias a ventas cruzadas inteligentes.",
    gradient: "from-[#2D6A4F] to-[#153527]",
    icon: "solar:graph-up-bold-duotone"
  },
  {
    value: "0%",
    label: "COMISIONES",
    desc: "Tu menú, tus ganancias. Sin cargos ocultos por orden.",
    gradient: "from-[#1A1A1A] to-[#2D6A4F]/40",
    icon: "solar:wad-of-money-bold-duotone"
  },
  {
    value: "24h",
    label: "SETUP RÁPIDO",
    desc: "Menú digital premium listo y configurado en tiempo récord.",
    gradient: "from-[#D4A853] to-[#8c6f27]",
    icon: "solar:clock-circle-bold-duotone"
  },
  {
    value: "100%",
    label: "TU MARCA",
    desc: "Personalización total que respeta tu identidad visual.",
    gradient: "from-[#1A1A1A] to-[#D4A853]/40",
    icon: "solar:magic-stick-3-bold-duotone"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function AlunaAbout() {
  return (
    <section id="nosotros" className="py-20 sm:py-36 px-5 sm:px-12 lg:px-20 bg-[#F7F7F5] overflow-hidden relative">
      {/* Elemento decorativo de fondo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2D6A4F]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid lg:grid-cols-2 gap-12 sm:gap-24 items-start"
        >
          
          {/* COLUMNA IZQUIERDA: Textos y Slider */}
          <div className="flex flex-col items-start text-left pt-2 sm:pt-4 w-full min-w-0">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-3 mb-5 sm:mb-6 self-center sm:self-start">
              <div className="w-6 sm:w-8 h-[1px] bg-[#2D6A4F]/40" />
              <span className="text-[11px] sm:text-xs font-black text-[#2D6A4F] uppercase tracking-[0.3em]">
                Sobre la Plataforma
              </span>
              <div className="w-6 sm:w-8 h-[1px] bg-[#2D6A4F]/40 block sm:hidden" />
            </motion.div>

            <motion.h2 
              variants={itemVariants}
              className="text-4xl md:text-5xl text-[#1A1A1A] mb-6 sm:mb-8 tracking-tight leading-[1.1] sm:leading-[1.05] w-full break-words sm:pr-4 text-center sm:text-left" 
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              La experiencia de un <span className="italic text-[#2D6A4F] font-light">gigante</span>, con el alma de tu restaurante.
            </motion.h2>

            <motion.p 
              variants={itemVariants}
              className="text-[#6B7280] text-base sm:text-xl leading-relaxed mb-8 sm:mb-10 max-w-xl text-balance font-light text-center sm:text-left mx-auto sm:mx-0"
            >
              Imagina la fluidez de Uber, la estética de Airbnb y la inmediatez de Rappi, empacadas en un código QR que lleva tu propio logo. Aluna convierte tu menú tradicional en una experiencia digital de élite que cautiva al instante.
            </motion.p>
            
            <motion.div variants={itemVariants} className="space-y-6 w-full">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-[#1A1A1A]/40 uppercase tracking-[0.2em] whitespace-nowrap">
                  Integraciones Nativas
                </span>
                <div className="h-[1px] flex-grow bg-[#1A1A1A]/5" />
              </div>
              
              <InfiniteMarquee items={[
                <span className="text-xl sm:text-3xl font-bold tracking-tighter opacity-30 grayscale hover:grayscale-0 hover:opacity-100 hover:text-[#25D366] transition-all duration-500 cursor-default" style={{ fontFamily: "'DM Serif Display', serif" }}>WhatsApp</span>,
                <span className="text-xl sm:text-3xl font-bold tracking-tighter opacity-30 grayscale hover:grayscale-0 hover:opacity-100 hover:text-[#E1306C] transition-all duration-500 cursor-default" style={{ fontFamily: "'DM Serif Display', serif" }}>Instagram</span>,
                <span className="text-xl sm:text-3xl font-bold tracking-tighter opacity-30 grayscale hover:grayscale-0 hover:opacity-100 hover:text-[#635BFF] transition-all duration-500 cursor-default" style={{ fontFamily: "'DM Serif Display', serif" }}>Stripe</span>,
                <span className="text-xl sm:text-3xl font-bold tracking-tighter opacity-30 grayscale hover:grayscale-0 hover:opacity-100 hover:text-[#FF6600] transition-all duration-500 cursor-default" style={{ fontFamily: "'DM Serif Display', serif" }}>Toast POS</span>
              ]} />
            </motion.div>
          </div>
          
          {/* COLUMNA DERECHA: Grid de Estadísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" } 
                }}
                className={`group relative bg-gradient-to-br ${stat.gradient} border border-white/10 rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 flex flex-col items-start text-left overflow-hidden shadow-2xl shadow-black/10`}
              >
                {/* Glow Effect Dinámico */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 group-hover:scale-150 transition-all duration-700" />
                
                <div className="mb-4 sm:mb-8 bg-white/10 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl backdrop-blur-xl border border-white/10 group-hover:bg-white/20 transition-colors">
                  <Icon icon={stat.icon} className="text-lg sm:text-2xl text-white" />
                </div>
                
                <div className="text-3xl sm:text-5xl lg:text-6xl text-white mb-1 sm:mb-2 tracking-tighter" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {stat.value}
                </div>
                
                <div className="text-[8px] sm:text-[10px] lg:text-xs text-white/90 uppercase tracking-[0.2em] font-black mb-2 sm:mb-4">
                  {stat.label}
                </div>
                
                <p className="text-white/60 text-[10px] sm:text-xs lg:text-sm font-medium leading-relaxed max-w-full">
                  {stat.desc}
                </p>

                {/* Subrayado decorativo que aparece al hover */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-white/20 group-hover:w-full transition-all duration-500" />
              </motion.div>
            ))}
          </div>
          
        </motion.div>
      </div>
    </section>
  );
}
