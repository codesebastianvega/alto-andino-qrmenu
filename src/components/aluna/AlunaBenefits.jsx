import { Sparkles, ChartBar, Zap, Globe } from "lucide-react";
import { FadeIn, SpotlightCard } from "./animations";

const BENEFITS = [
  {
    icon: <Globe className="w-7 h-7" />,
    title: "Presencia Digital",
    desc: "Tu restaurante visible las 24 horas. Un menú digital profesional que impresiona a cada comensal."
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Velocidad",
    desc: "Reduce tiempos de espera un 40%. El menú carga en menos de 2 segundos en cualquier dispositivo."
  },
  {
    icon: <ChartBar className="w-7 h-7" />,
    title: "Analítica",
    desc: "Datos en tiempo real sobre los platos más vistos, horarios pico y comportamiento de tus clientes."
  },
  {
    icon: <Sparkles className="w-7 h-7" />,
    title: "Experiencia Premium",
    desc: "Diseño editorial a la altura de los mejores restaurantes del mundo. Tu marca, elevada."
  }
];

export default function AlunaBenefits() {
  return (
    <section className="py-32 px-6 md:px-12 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-5xl text-[#1A1A1A] mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>¿Por qué Aluna?</h2>
          <p className="text-[#6B7280] text-lg leading-relaxed">
            No somos otra plataforma de menú en PDF. Somos la diferencia entre un local más y una experiencia memorable.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <SpotlightCard className="bg-[#F7F7F5] rounded-[28px] p-8 h-full hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#2D6A4F] shadow-sm mb-6">
                  {b.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-3">{b.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{b.desc}</p>
              </SpotlightCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
