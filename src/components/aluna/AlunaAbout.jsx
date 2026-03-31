import { FadeIn, Counter, InfiniteMarquee } from "./animations";

const STATS = [
  { value: 25, suffix: "+", label: "Restaurantes Activos" },
  { value: 500, suffix: "+", label: "Menús Generados" },
  { value: 98, suffix: "%", label: "Satisfacción" },
  { value: 15, suffix: "+", label: "Ciudades de Colombia" }
];

const MARQUEE_ITEMS = [
  <span className="text-[#6B7280]/30 text-4xl font-bold tracking-wider uppercase" style={{ fontFamily: "'DM Serif Display', serif" }}>Aluna</span>,
  <span className="text-[#6B7280]/30 text-4xl font-bold tracking-wider uppercase">Diseño</span>,
  <span className="text-[#6B7280]/30 text-4xl font-bold tracking-wider uppercase">Gastronomía</span>,
  <span className="text-[#6B7280]/30 text-4xl font-bold tracking-wider uppercase">Experiencia</span>,
  <span className="text-[#6B7280]/30 text-4xl font-bold tracking-wider uppercase">Digital</span>,
  <span className="text-[#6B7280]/30 text-4xl font-bold tracking-wider uppercase">Premium</span>,
];

export default function AlunaAbout() {
  return (
    <section id="nosotros" className="py-32 px-6 md:px-12 lg:px-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center mb-24">
          <FadeIn direction="right">
            <p className="text-[#2D6A4F] text-sm uppercase tracking-[0.2em] font-bold mb-4">Sobre Nosotros</p>
            <h2 className="text-5xl text-[#1A1A1A] mb-6 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Donde el diseño<br />
              <span className="text-[#D4A853] italic">encuentra</span> el sabor
            </h2>
            <p className="text-[#6B7280] text-lg leading-relaxed max-w-xl">
              Nacimos de la convicción de que cada restaurante merece una presencia digital tan excepcional como su cocina. Fusionamos el diseño editorial con la tecnología para crear experiencias gastronómicas que trascienden la mesa.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 gap-6">
            {STATS.map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-[#F7F7F5] rounded-3xl p-8 text-center">
                  <div className="text-5xl text-[#1A1A1A] mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-medium">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* Marquee */}
        <InfiniteMarquee items={MARQUEE_ITEMS} />
      </div>
    </section>
  );
}
