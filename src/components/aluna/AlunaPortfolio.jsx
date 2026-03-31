import { FadeIn } from "./animations";

const PORTFOLIO_ITEMS = [
  {
    title: "Alto Andino",
    category: "Restaurante Artesanal",
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
    span: "md:col-span-2 md:row-span-2"
  },
  {
    title: "Café Origen",
    category: "Cafetería Especial",
    img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop",
    span: ""
  },
  {
    title: "Ember Grill",
    category: "Parrilla Premium",
    img: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=600&auto=format&fit=crop",
    span: ""
  },
  {
    title: "Masa & Horno",
    category: "Pizzería Artesanal",
    img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop",
    span: "md:col-span-2"
  },
  {
    title: "Luna Azul",
    category: "Cocina Fusión",
    img: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=600&auto=format&fit=crop",
    span: ""
  }
];

export default function AlunaPortfolio() {
  return (
    <section id="portafolio" className="py-32 px-6 md:px-12 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-5xl text-[#1A1A1A] mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Historias que Inspiran</h2>
          <p className="text-[#6B7280] text-lg leading-relaxed">
            Cada proyecto es un universo gastronómico único. Así luce Aluna en acción.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-4 auto-rows-[280px]">
          {PORTFOLIO_ITEMS.map((item, i) => (
            <FadeIn key={i} delay={i * 0.1} className={`${item.span}`}>
              <div className="group relative w-full h-full rounded-[28px] overflow-hidden cursor-pointer">
                <img
                  src={item.img}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-300">{item.category}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
