import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import InteractivePhone from "./InteractivePhone";
import { FadeIn, MagneticButton } from "./animations";
import { useAuth } from "../../context/AuthContext";

export default function AlunaHero() {
  const { profile } = useAuth();
  return (
    <section className="pt-4 px-4 md:px-6 pb-12">
      {/* Contenedor principal con bordes redondeados */}
      <div className="w-full relative rounded-[40px] overflow-hidden bg-[#0A0A0A] min-h-[90vh] flex items-center shadow-2xl border border-white/10">

        {/* Gradiente superpuesto */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/40 to-transparent"></div>

        {/* Contenido (Grid de 2 columnas) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-20 grid md:grid-cols-[1.1fr_0.9fr] gap-8 items-center">

          {/* Columna Izquierda */}
          <FadeIn direction="right">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium tracking-wide uppercase mb-8">
                <Sparkles className="w-4 h-4 text-[#D4A853]" />
                La nueva era gastronómica
              </div>

              {/* Título Principal */}
              <h1 className="text-[56px] md:text-[80px] leading-[0.95] text-white mb-8 tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Diseñando espacios <br />
                <span className="italic text-[#D4A853] font-light">digitales</span> que inspiran.
              </h1>

              {/* Párrafo */}
              <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed font-light max-w-lg">
                Elevamos la gastronomía al mundo digital. Menús interactivos, pedidos fluidos y experiencias que cautivan a tus comensales desde el primer clic.
              </p>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4">
                {profile ? (
                  <MagneticButton>
                    <Link to="/#portal" className="bg-[#D4A853] text-black px-10 py-4 rounded-full text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#D4A853]/20">
                      Gestionar mis Marcas
                    </Link>
                  </MagneticButton>
                ) : (
                  <MagneticButton>
                    <Link to="/registro" className="bg-white text-[#1A1A1A] px-10 py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-xl">
                      Comienza Hoy
                    </Link>
                  </MagneticButton>
                )}
                <Link to="/aluna?demo=1" className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  Ver Demo
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Columna Derecha: Teléfono + Glow */}
          <FadeIn direction="left" delay={0.3} className="hidden md:flex justify-center relative">
            {/* Glow verde */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[650px] bg-[#2D6A4F]/30 blur-[100px] rounded-full"></div>
            <InteractivePhone />
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
