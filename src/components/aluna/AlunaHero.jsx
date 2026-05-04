import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import InteractivePhone from "./InteractivePhone";
import { FadeIn, MagneticButton } from "./animations";
import { useAuth } from "../../context/AuthContext";

// --- Sistema de Partículas Ambientales ---

const ParticlesEffect = () => {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const newParticles = Array.from({ length: 65 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#D4A853]/90 shadow-[0_0_10px_#D4A853]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -200, -400],
            opacity: [0, 0.9, 0],
            scale: [1, 1.3, 0.7],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default function AlunaHero() {
  const { profile } = useAuth();

  return (
    <section className="pt-0 px-0 md:pt-4 md:px-6 pb-0 md:pb-12 bg-[#F8F9F8]">
      {/* Contenedor principal */}
      <div className="w-full relative rounded-none md:rounded-[40px] overflow-hidden bg-[#0A0A0A] min-h-[100dvh] md:min-h-[90vh] flex items-center md:shadow-2xl border-none md:border md:border-white/10">

        {/* Imagen de fondo premium con overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/enterprise_luxury_restaurant_bg_1777932699001.png" 
            alt="Premium Restaurant" 
            className="w-full h-full object-cover opacity-50 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>
        </div>

        {/* Sistema de Partículas Animadas */}
        <ParticlesEffect />

        {/* Floating Orbs para profundidad extra */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-[#2D6A4F]/15 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 -right-24 w-[500px] h-[500px] bg-[#D4A853]/10 blur-[150px] rounded-full"
          />
        </div>

        {/* Contenido (Grid de 2 columnas) */}
        <div className="relative z-20 w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 pt-2 pb-12 md:py-20 grid md:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Columna Izquierda */}
          <FadeIn direction="up">
            <div className="max-w-3xl flex flex-col items-center text-center md:items-start md:text-left mx-auto md:mx-0">
              {/* Brand Title */}
              <div className="text-white text-5xl md:text-6xl mb-10 tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Aluna
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium tracking-wide uppercase mb-12">
                <Sparkles className="w-4 h-4 text-[#D4A853]" />
                La nueva era gastronómica
              </div>

              {/* Título Principal */}
              <h1 className="text-5xl md:text-7xl leading-[0.95] text-white mb-8 tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Diseñando espacios <br />
                <span className="italic text-[#D4A853] font-light">digitales</span> que inspiran.
              </h1>

              {/* Párrafo */}
              <p className="text-base md:text-xl text-gray-300 mb-8 md:mb-10 leading-relaxed font-light max-w-lg">
                Elevamos la gastronomía al mundo digital. Menús interactivos, pedidos fluidos y experiencias que cautivan a tus comensales desde el primer clic.
              </p>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
                {profile ? (
                  <MagneticButton className="w-full sm:w-auto">
                    <Link to="/#portal" className="bg-[#D4A853] text-black px-10 py-4 rounded-full text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#D4A853]/20 w-full sm:w-auto">
                      Gestionar mis Marcas
                    </Link>
                  </MagneticButton>
                ) : (
                  <MagneticButton className="w-full sm:w-auto">
                    <Link to="/registro" className="bg-white text-[#1A1A1A] px-10 py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-xl w-full sm:w-auto">
                      Comienza Hoy
                    </Link>
                  </MagneticButton>
                )}
                <Link to="/alto-andino?demo=1#menu" className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                  Ver Demo
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Columna Derecha: Teléfono + Glow */}
          <FadeIn direction="left" delay={0.3} className="hidden md:flex justify-center relative">
            {/* Glow verde/dorado para resaltar el celular */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[700px] bg-[#D4A853]/10 blur-[120px] rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[650px] bg-[#2D6A4F]/30 blur-[100px] rounded-full"></div>
            <InteractivePhone />
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
