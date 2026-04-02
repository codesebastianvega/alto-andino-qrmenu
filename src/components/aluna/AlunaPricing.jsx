import { useState, useEffect } from "react";
import { Sparkles, Check } from "lucide-react";
import { FadeIn, SpotlightCard } from "./animations";
import { supabase } from "../../config/supabase";

export default function AlunaPricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section id="planes" className="py-32 px-6 md:px-12 lg:px-20 bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-5xl text-[#1A1A1A] mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Planes Transparentes</h2>
          <p className="text-[#6B7280] text-lg leading-relaxed">
            Soluciones escalables que crecen junto con tu negocio gastronómico.
          </p>
        </FadeIn>

        {loading ? (
          <div className="text-center text-gray-500 py-10">Cargando planes...</div>
        ) : (
          <>
            <div className={`grid gap-8 max-w-6xl mx-auto items-center ${
              standardPlans.length === 1 ? 'lg:grid-cols-1 max-w-sm' : 
              standardPlans.length === 2 ? 'lg:grid-cols-2 max-w-4xl' : 
              'lg:grid-cols-3'
            }`}>
              {standardPlans.map((plan, index) => {
                const isPopular = plan.is_highlighted;
                // Only show included features for normal cards
                const includedFeatures = (plan.features || [])
                  .filter(f => f.is_included)
                  .sort((a, b) => a.sort_order - b.sort_order);

                return (
                  <FadeIn key={plan.id} delay={0.1 * index} className="relative h-full">
                    {isPopular && (
                      <div className="absolute top-3 right-6 z-10 bg-[#2D6A4F] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                        Popular
                      </div>
                    )}
                    <SpotlightCard 
                      spotlightColor={isPopular ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.03)"} 
                      className={`p-10 md:p-12 rounded-[32px] flex flex-col h-full relative overflow-hidden transition-all ${
                        isPopular 
                          ? 'bg-[#1A1A1A] shadow-2xl transform lg:-translate-y-4 border border-[#1A1A1A]' 
                          : 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB]'
                      }`}
                    >
                      <h3 className={`text-2xl mb-2 ${isPopular ? 'text-white' : 'text-[#1A1A1A]'}`} style={{ fontFamily: "'DM Serif Display', serif" }}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm mb-8 ${isPopular ? 'text-gray-400' : 'text-[#6B7280]'}`}>
                        {plan.description}
                      </p>
                      <div className={`text-5xl mb-8 ${isPopular ? 'text-white' : 'text-[#1A1A1A]'}`} style={{ fontFamily: "'DM Serif Display', serif" }}>
                        ${plan.price_monthly.toLocaleString()}<span className={`text-lg font-sans ${isPopular ? 'text-gray-400' : 'text-[#6B7280]'}`}>/mes</span>
                      </div>
                      <ul className="space-y-4 mb-10 flex-1">
                        {includedFeatures.map((feature) => (
                          <li key={feature.id} className={`flex items-start gap-3 text-sm ${isPopular ? 'text-gray-300' : 'text-[#1A1A1A]'}`}>
                            <Check className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                            {feature.display_name}
                          </li>
                        ))}
                      </ul>
                      <a href={`#registro?plan=${plan.slug}`} className={`block text-center w-full py-4 rounded-full text-sm font-semibold transition-colors ${
                        isPopular 
                          ? 'bg-white text-[#1A1A1A] hover:bg-gray-100' 
                          : 'border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
                      }`}>
                        {plan.cta_text || `Elegir ${plan.name}`}
                      </a>
                    </SpotlightCard>
                  </FadeIn>
                );
              })}
            </div>

            {enterprisePlan && (
              <FadeIn delay={0.3} className="mt-20">
                <div className="bg-[#1A1A1A] rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at top right, #2D6A4F, transparent 50%)" }}></div>
                  <div className="relative z-10 text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 bg-[#2D6A4F]/20 text-[#2D6A4F] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-[#2D6A4F]/30">
                      <Sparkles size={12} /> Para Cadenas y Franquicias
                    </div>
                    <h3 className="text-3xl md:text-4xl text-white mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
                      {enterprisePlan.name}
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
                      {enterprisePlan.description}
                    </p>
                  </div>
                  <a 
                    href="https://wa.me/573000000000" 
                    target="_blank" 
                    rel="noreferrer"
                    className="relative z-10 shrink-0 bg-white text-[#1A1A1A] px-8 py-4 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap inline-flex items-center justify-center cursor-pointer"
                  >
                    {enterprisePlan.cta_text || 'Contactar a Ventas'}
                  </a>
                </div>
              </FadeIn>
            )}
          </>
        )}
      </div>
    </section>
  );
}
