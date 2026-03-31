import { ArrowRight } from "lucide-react";
import InteractivePhone from "./InteractivePhone";
import { FadeIn, MagneticButton } from "./animations";

export default function AlunaHero() {
  return (
    <section className="relative min-h-screen flex items-center bg-[#1A1A1A] overflow-hidden py-32">
      {/* Background Grain */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <FadeIn direction="right">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse"></span>
              <span className="text-xs text-gray-300 tracking-wider uppercase">Gastronomía Inteligente</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Tu menú,{" "}
              <span className="text-[#D4A853] italic">reimaginado</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl">
              Elevamos la presencia digital de tu restaurante con menús interactivos, pedidos integrados y una identidad visual que refleja tu esencia culinaria.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <MagneticButton>
                <a
                  href="#contacto"
                  className="px-10 py-4 bg-white text-[#1A1A1A] rounded-full font-semibold text-sm hover:bg-[#F7F7F5] transition-colors flex items-center gap-2 shadow-xl"
                >
                  Solicitar Demostración <ArrowRight className="w-4 h-4" />
                </a>
              </MagneticButton>
              <a
                href="#servicios"
                className="px-10 py-4 border border-white/20 text-white rounded-full font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Explorar Servicios
              </a>
            </div>
          </div>
        </FadeIn>

        <FadeIn direction="left" delay={0.3} className="flex justify-center lg:justify-end">
          <InteractivePhone />
        </FadeIn>
      </div>
    </section>
  );
}
