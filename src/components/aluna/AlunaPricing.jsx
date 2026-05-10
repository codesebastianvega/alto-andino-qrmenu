import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check, ChevronRight, Building2, Cpu, Shield, Headphones } from "lucide-react";
import { FadeIn, SpotlightCard } from "./animations";
import { supabase } from "../../config/supabase";

export default function AlunaPricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select(`
            *,
            features:plan_features(
              id,
              display_name,
              is_included,
              sort_order
            )
          `)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
        
        // Centrar el plan popular en móvil al cargar
        setTimeout(() => {
          if (scrollRef.current && window.innerWidth < 768) {
            const popularIndex = (data || []).findIndex(p => p.is_highlighted && !p.is_custom_pricing);
            if (popularIndex !== -1) {
              const itemWidth = scrollRef.current.scrollWidth / (data || []).filter(p => !p.is_custom_pricing).length;
              scrollRef.current.scrollTo({
                left: popularIndex * itemWidth,
                behavior: 'smooth'
              });
              setActiveSlide(popularIndex);
            }
          }
        }, 500);
      } catch (err) {
        console.error("Error fetching pricing plans", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const standardPlans = plans.filter(p => !p.is_custom_pricing);
  const enterprisePlan = plans.find(p => p.is_custom_pricing);

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const itemWidth = e.target.scrollWidth / standardPlans.length;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < standardPlans.length) {
      setActiveSlide(newIndex);
    }
  };

  return (
    <section id="planes" className="py-32 px-6 md:px-12 lg:px-20 bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl text-[#1A1A1A] mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Planes Transparentes</h2>
          <p className="text-[#6B7280] text-lg leading-relaxed">
            Soluciones escalables que crecen junto con tu negocio gastronómico.
          </p>
        </FadeIn>

        {loading ? (
          <div className="text-center text-gray-500 py-10">Cargando planes...</div>
        ) : (
          <>
            <div className="text-center mb-6 md:hidden">
              <span className="text-[10px] text-gray-400 tracking-[0.2em] font-medium animate-pulse">
                ← Desliza para comparar →
              </span>
            </div>
            {/* Slider para Móvil / Grid para Desktop */}
            <div 
              ref={scrollRef}
              className={`flex md:grid gap-6 md:gap-8 pb-12 md:pb-0 overflow-x-auto md:overflow-x-visible hide-scrollbar snap-x snap-mandatory ${
                standardPlans.length === 1 ? 'md:grid-cols-1 max-w-sm mx-auto' : 
                standardPlans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 
                standardPlans.length === 3 ? 'md:grid-cols-3 max-w-6xl mx-auto' :
                'md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto'
              }`}
              onScroll={handleScroll}
            >
              {standardPlans.map((plan, index) => {
                const isPopular = plan.is_highlighted;
                // Only show included features for normal cards
                const includedFeatures = (plan.features || [])
                  .filter(f => f.is_included)
                  .sort((a, b) => a.sort_order - b.sort_order);

                return (
                  <FadeIn key={plan.id} delay={0.1 * index} className="relative h-full min-w-[85vw] md:min-w-0 snap-center md:snap-start">
                    {isPopular && (
                      <div className="absolute top-4 right-6 z-10 bg-[#2D6A4F] text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-wider shadow-md">
                        Más Popular
                      </div>
                    )}
                    <SpotlightCard 
                      spotlightColor={isPopular ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.03)"} 
                      className={`p-6 md:p-12 rounded-[32px] md:rounded-[40px] flex flex-col h-full relative overflow-hidden transition-all duration-500 ${
                        isPopular 
                          ? 'bg-[#1A1A1A] shadow-2xl md:-translate-y-4 border border-[#1A1A1A]' 
                          : 'bg-white shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-[#E5E7EB]'
                      }`}
                    >
                      <h3 className={`text-xl md:text-3xl mb-1 md:mb-2 ${isPopular ? 'text-white' : 'text-[#1A1A1A]'}`} style={{ fontFamily: "'DM Serif Display', serif" }}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm md:text-base mb-6 md:mb-8 ${isPopular ? 'text-gray-400' : 'text-[#6B7280]'}`}>
                        {plan.description}
                      </p>
                      <div className={`mb-6 md:mb-8`}>
                        <div className={`text-4xl md:text-6xl ${isPopular ? 'text-white' : 'text-[#1A1A1A]'}`} style={{ fontFamily: "'DM Serif Display', serif" }}>
                          ${plan.price_monthly.toLocaleString()}<span className={`text-base md:text-lg font-sans ${isPopular ? 'text-gray-400' : 'text-[#6B7280]'}`}>/mes</span>
                        </div>
                        <div className={`text-xs md:text-sm font-medium mt-2 uppercase tracking-wider ${isPopular ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {plan.max_orders_per_month ? `Hasta ${plan.max_orders_per_month.toLocaleString()} pedidos / mes` : 'Pedidos Ilimitados'}
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                          {includedFeatures.slice(0, showAllFeatures[plan.id] ? undefined : 6).map((feature) => (
                            <li key={feature.id} className={`flex items-start gap-3 text-sm md:text-base ${isPopular ? 'text-gray-300' : 'text-[#1A1A1A]'}`}>
                              <Check className="w-4 h-4 md:w-5 md:h-5 text-[#2D6A4F] shrink-0 mt-0.5" />
                              {feature.display_name}
                            </li>
                          ))}
                        </ul>
                        
                        {includedFeatures.length > 6 && (
                          <button 
                            onClick={() => setShowAllFeatures(prev => ({...prev, [plan.id]: !prev[plan.id]}))}
                            className={`text-[10px] md:text-sm font-bold tracking-widest mb-8 md:mb-10 transition-opacity hover:opacity-70 ${isPopular ? 'text-[#2D6A4F]' : 'text-[#1A1A1A]'}`}
                          >
                            {showAllFeatures[plan.id] ? "- Ver menos" : `+ Ver ${includedFeatures.length - 6} más`}
                          </button>
                        )}
                      </div>
                      <Link 
                        to={`/registro?plan=${plan.slug}`} 
                        className={`block text-center w-full py-3.5 md:py-5 rounded-full text-sm md:text-base font-semibold transition-colors ${
                          isPopular 
                            ? 'bg-white text-[#1A1A1A] hover:bg-gray-100' 
                            : 'border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
                        }`}
                      >
                        {plan.cta_text || `Elegir ${plan.name}`}
                      </Link>
                    </SpotlightCard>
                  </FadeIn>
                );
              })}
            </div>

            {/* Paginación Visual para Móvil */}
            <div className="flex justify-center items-center gap-2 mt-4 md:hidden">
              {standardPlans.map((_, idx) => (
                <div 
                  key={`dot-${idx}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === idx 
                      ? "w-8 bg-[#2D6A4F]" 
                      : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* AI Add-on Section */}
            <FadeIn delay={0.2} className="mt-20 max-w-4xl mx-auto">
              <div className="bg-[#2D6A4F]/5 border border-[#2D6A4F]/20 rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                <div className="w-20 h-20 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#2D6A4F]/20">
                  <Cpu className="w-10 h-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 text-[#2D6A4F] text-[10px] font-bold px-3 py-1 rounded-full bg-[#2D6A4F]/10 uppercase tracking-wider mb-4">
                    <Sparkles size={12} /> Add-on Opcional
                  </div>
                  <h3 className="text-2xl md:text-3xl text-[#1A1A1A] mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    Conserje Gastronómico con IA
                  </h3>
                  <p className="text-[#6B7280] text-base mb-2">
                    Automatiza pedidos, recomienda platos y responde preguntas de tus clientes 24/7.
                  </p>
                  <p className="text-[#2D6A4F] font-bold text-sm uppercase tracking-wide">
                    Incluye un límite de 1.000 interacciones de IA al mes.
                  </p>
                </div>
                <div className="text-center md:text-right shrink-0">
                  <div className="text-3xl md:text-4xl text-[#1A1A1A] mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    $49.900<span className="text-sm font-sans text-[#6B7280]">/mes</span>
                  </div>
                  <Link 
                    to="/contacto?addon=ia"
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#1A1A1A] text-white rounded-full text-sm font-bold hover:bg-[#2f4131] transition-all"
                  >
                    Me interesa
                  </Link>
                </div>
              </div>
            </FadeIn>

            {enterprisePlan && (
              <FadeIn delay={0.3} className="mt-32">
                <div className="relative rounded-[48px] overflow-hidden shadow-2xl max-w-7xl mx-auto border border-white/5 bg-[#0A0A0A]">
                  {/* Immersive Background */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src="/enterprise_premium_bg.png" 
                      alt="Luxury Restaurant" 
                      className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60"></div>
                  </div>

                  <div className="relative z-10 p-6 md:p-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                    {/* Main Content Area */}
                    <div className="flex-1 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 text-[#C5A059] text-[10px] font-bold px-4 py-1.5 rounded-full border border-[#C5A059]/30 uppercase tracking-[0.3em] mb-6">
                        <Sparkles size={12} /> Nivel Corporativo
                      </div>
                      
                      <h3 className="text-3xl md:text-5xl lg:text-7xl text-white mb-4 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                        Aluna <span className="text-[#C5A059]">Enterprise</span>
                      </h3>
                      
                      <p className="text-gray-300 text-base md:text-lg lg:text-2xl mb-8 lg:mb-12 leading-relaxed max-w-xl font-light">
                        {enterprisePlan.description || "Tecnología de élite para cadenas gastronómicas que buscan control absoluto y eficiencia global."}
                      </p>

                      <a 
                        href="https://wa.me/573222285900?text=Hola!%20Me%20interesa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre%20el%20Plan%20Enterprise%20de%20Aluna%20para%20mi%20negocio." 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 lg:px-12 lg:py-6 bg-[#C5A059] text-black font-bold tracking-wide text-sm lg:text-base rounded-full hover:bg-white transition-all duration-300 shadow-xl shadow-[#C5A059]/20 w-full sm:w-auto"
                      >
                        Contactar por WhatsApp
                        <ChevronRight size={18} className="lg:w-5 lg:h-5" />
                      </a>
                    </div>

                    {/* Features Area: List for Mobile, Cards for Desktop */}
                    <div className="flex-1 w-full">
                      {/* Mobile List View */}
                      <div className="flex flex-col gap-4 md:hidden">
                        {[
                          { title: "Multi-sede", desc: "Gestión centralizada de múltiples sucursales.", icon: <Building2 className="w-5 h-5" /> },
                          { title: "Integración", desc: "Conexión directa con ERP y POS.", icon: <Cpu className="w-5 h-5" /> },
                          { title: "Marca Blanca", desc: "Plataforma personalizada bajo tu dominio.", icon: <Shield className="w-5 h-5" /> },
                          { title: "Soporte VIP", desc: "Atención prioritaria y Account Manager.", icon: <Headphones className="w-5 h-5" /> }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <div className="text-[#C5A059] shrink-0">{item.icon}</div>
                            <div className="flex flex-col">
                              <span className="text-white font-bold text-sm">{item.title}</span>
                              <span className="text-gray-400 text-xs">{item.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Grid View */}
                      <div className="hidden md:grid grid-cols-2 gap-6">
                        {[
                          { title: "Multi-sede", desc: "Gestión centralizada de múltiples sucursales.", icon: <Building2 className="w-6 h-6" /> },
                          { title: "Integración", desc: "Conexión directa con ERP y POS.", icon: <Cpu className="w-6 h-6" /> },
                          { title: "Marca Blanca", desc: "Plataforma personalizada bajo tu dominio.", icon: <Shield className="w-6 h-6" /> },
                          { title: "Soporte VIP", desc: "Atención prioritaria y Account Manager.", icon: <Headphones className="w-6 h-6" /> }
                        ].map((item, idx) => (
                          <div 
                            key={idx} 
                            className="group p-8 rounded-3xl bg-white/[0.05] border border-white/10 backdrop-blur-md hover:bg-white/[0.1] hover:border-[#C5A059]/30 transition-all duration-300"
                          >
                            <div className="w-12 h-12 rounded-xl bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] mb-6 group-hover:bg-[#C5A059] group-hover:text-black transition-colors">
                              {item.icon}
                            </div>
                            <h4 className="text-white font-bold text-lg mb-3">{item.title}</h4>
                            <p className="text-gray-300 text-base leading-relaxed font-normal">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}
          </>
        )}
      </div>
    </section>
  );
}
