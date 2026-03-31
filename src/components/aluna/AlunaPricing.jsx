import { Sparkles, Check } from "lucide-react";
import { FadeIn, MagneticButton, SpotlightCard } from "./animations";

export default function AlunaPricing() {
  return (
    <section id="planes" className="py-32 px-6 md:px-12 lg:px-20 bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-5xl text-[#1A1A1A] mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Planes Transparentes</h2>
          <p className="text-[#6B7280] text-lg leading-relaxed">
            Soluciones escalables que crecen junto con tu negocio gastronómico.
          </p>
        </FadeIn>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {/* Esencial */}
          <FadeIn delay={0.1}>
            <SpotlightCard className="bg-white p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB] flex flex-col h-full">
              <h3 className="text-2xl text-[#1A1A1A] mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>Esencial</h3>
              <p className="text-sm text-[#6B7280] mb-8">Perfecto para cafeterías y locales pequeños.</p>
              <div className="text-5xl text-[#1A1A1A] mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>$49.000<span className="text-lg font-sans text-[#6B7280]">/mes</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Menú digital interactivo", "Hasta 50 productos", "Código QR personalizado", "Soporte por email"].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#1A1A1A]">
                    <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full border border-[#1A1A1A] text-[#1A1A1A] py-4 rounded-full text-sm font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors">
                Elegir Esencial
              </button>
            </SpotlightCard>
          </FadeIn>

          {/* Profesional */}
          <FadeIn delay={0.2}>
            <SpotlightCard spotlightColor="rgba(255,255,255,0.1)" className="bg-[#1A1A1A] p-12 rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden transform lg:-translate-y-4 border border-[#1A1A1A]">
              <div className="absolute top-8 right-8 bg-[#2D6A4F] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Popular
              </div>
              <h3 className="text-2xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>Profesional</h3>
              <p className="text-sm text-gray-400 mb-8">Para restaurantes con alto volumen.</p>
              <div className="text-5xl text-white mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>$99.000<span className="text-lg font-sans text-gray-400">/mes</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Productos ilimitados", "Integración con WhatsApp", "Panel de analíticas", "Soporte prioritario 24/7", "Múltiples sucursales"].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white text-[#1A1A1A] py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                Elegir Profesional
              </button>
            </SpotlightCard>
          </FadeIn>

          {/* Élite */}
          <FadeIn delay={0.3}>
            <SpotlightCard spotlightColor="rgba(212,168,83,0.15)" className="bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A] p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#D4A853]/30 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A853]/10 blur-2xl rounded-full"></div>
              <h3 className="text-2xl text-[#D4A853] mb-2 flex items-center gap-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Élite <Sparkles className="w-5 h-5" />
              </h3>
              <p className="text-sm text-gray-400 mb-8">Impulsado por Inteligencia Artificial.</p>
              <div className="text-5xl text-white mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>$199.000<span className="text-lg font-sans text-gray-400">/mes</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                {["Todo lo de Profesional", "Recomendaciones predictivas IA", "Chatbot de atención 24/7", "Precios dinámicos", "Marketing automatizado"].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-[#D4A853] shrink-0" />
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
  );
}
