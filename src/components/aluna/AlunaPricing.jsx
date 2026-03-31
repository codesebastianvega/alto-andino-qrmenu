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
          {/* Básico */}
          <FadeIn delay={0.05}>
            <SpotlightCard className="bg-white p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB] flex flex-col h-full">
              <h3 className="text-2xl text-[#1A1A1A] mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>Emprendedor</h3>
              <p className="text-sm text-[#6B7280] mb-8">Paga solo por lo que vendes. Sin riesgo.</p>
              <div className="text-5xl text-[#1A1A1A] mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>$0<span className="text-lg font-sans text-[#6B7280]">/mes</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "Subdominio propio (aluna.app/tumarca)", 
                  "Menú QR interactivo con Alérgenos", 
                  "Pedidos directos a tu WhatsApp", 
                  "Panel básico (gestiona 20 productos)", 
                  "Comisión de 15% por pedido",
                  "Soporte básico por email"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#1A1A1A]">
                    <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full border border-[#E5E7EB] bg-gray-50 text-[#1A1A1A] py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                Empezar Gratis
              </button>
            </SpotlightCard>
          </FadeIn>

          {/* Esencial */}
          <FadeIn delay={0.1} className="relative h-full">
            <div className="absolute top-3 right-6 z-10 bg-[#2D6A4F] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
              Popular
            </div>
            <SpotlightCard spotlightColor="rgba(255,255,255,0.1)" className="bg-[#1A1A1A] p-12 rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden transform lg:-translate-y-4 border border-[#1A1A1A] h-full">
              <h3 className="text-2xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>Esencial</h3>
              <p className="text-sm text-gray-400 mb-8">Perfecto para locales y cafeterías en crecimiento.</p>
              <div className="text-5xl text-white mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>$49.000<span className="text-lg font-sans text-gray-400">/mes</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "Presencia en Marketplace Aluna",
                  "Dashboard, KDS e Impresión",
                  "Gestor de Mesas y pedidos QR",
                  "Modificadores de productos",
                  "Asistente IA Básico (Chatbot)",
                  "0% comisiones por venta",
                  "Soporte estándar por chat"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-white text-[#1A1A1A] py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                Elegir Esencial
              </button>
            </SpotlightCard>
          </FadeIn>

          {/* Profesional */}
          <FadeIn delay={0.2}>
            <SpotlightCard className="bg-white p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB] flex flex-col h-full">
              <h3 className="text-2xl text-[#1A1A1A] mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>Profesional</h3>
              <p className="text-sm text-[#6B7280] mb-8">Para restaurantes con alto volumen de pedidos.</p>
              <div className="text-5xl text-[#1A1A1A] mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>$99.000<span className="text-lg font-sans text-[#6B7280]">/mes</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "Todo lo de Esencial",
                  "Asistente IA Avanzado (Upselling)",
                  "CRM y Base de datos de clientes",
                  "Gestión Multi-sucursal y Staff",
                  "Módulo de Recetas / Branding",
                  "Soporte prioritario 24/7"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#1A1A1A]">
                    <Check className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full border border-[#1A1A1A] text-[#1A1A1A] py-4 rounded-full text-sm font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors">
                Elegir Profesional
              </button>
            </SpotlightCard>
          </FadeIn>
        </div>

        <FadeIn delay={0.3} className="mt-20">
          <div className="bg-[#1A1A1A] rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at top right, #2D6A4F, transparent 50%)" }}></div>
            <div className="relative z-10 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 bg-[#2D6A4F]/20 text-[#2D6A4F] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-[#2D6A4F]/30">
                <Sparkles size={12} /> Para Cadenas y Franquicias
              </div>
              <h3 className="text-3xl md:text-4xl text-white mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Plan Enterprise
              </h3>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
                App 100% Marca Blanca, Asistente IA a medida, integraciones con tus sistemas contables (ERP), facturación electrónica y división de pagos por sucursal.
              </p>
            </div>
            <button className="relative z-10 shrink-0 bg-white text-[#1A1A1A] px-8 py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
              Contactar a Ventas
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
