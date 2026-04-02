import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Sparkles, Loader2, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabase';
import { useMenuData } from '../context/MenuDataContext';
import { useAuth } from '../context/AuthContext';

const ExperiencesSection = lazy(() => import('../components/ExperiencesSection'));

export default function ExperiencesPage() {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventQuery, setEventQuery] = useState('');
  const [eventResponse, setEventResponse] = useState('');
  const [isEventLoading, setIsEventLoading] = useState(false);
  
  const { homeSettings, restaurantSettings, loading: menuLoading } = useMenuData();
  const { activeBrand } = useAuth();
  
  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";

  // Variantes de animación
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const handleEventPlanner = async () => {
    if (!eventQuery.trim()) return;
    
    setIsEventLoading(true);
    try {
      // Tomamos el prompt o lo llamamos directamente usando la edge function
      const { data: settings } = await supabase
        .from('home_settings')
        .select('ai_event_prompt')
        .single();
        
      const systemPrompt = settings?.ai_event_prompt || `Eres el 'Curador de Experiencias' de ${brandName}. Crea una propuesta de evento breve y moderna. Incluye: Nombre del evento y concepto de comida/espacio en 3 líneas máximo.`;
      
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `${systemPrompt}\n\nCliente dice: "${eventQuery}"`,
          systemInstruction: systemPrompt
        }
      });

      if (error) throw error;
      setEventResponse(data.reply);
    } catch (error) {
      console.error('Error planning event:', error);
      setEventResponse('Hubo un error al diseñar tu evento. Por favor intenta de nuevo.');
    } finally {
      setIsEventLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans overflow-x-hidden selection:bg-brand-secondary selection:text-white pb-24 md:pb-0">
      {/* 🚀 HERO SECTION DE EXPERIENCIAS */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden rounded-b-[3rem] md:rounded-b-[4rem]">
        {/* Background Image with Parallax effect */}
        <div className="absolute inset-0 z-0">
          <img 
            src={homeSettings?.experiences_img || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000"} 
            alt={`Experiencias ${brandName}`} 
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/60 via-brand-primary/40 to-brand-text/90" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mt-16 pb-12">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 border border-white/20">
              <Sparkles size={12} className="text-brand-secondary" />
              {homeSettings?.experiences_tag || 'Más allá de la carta'}
            </div>
            <h1 
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: homeSettings?.experiences_h1?.replace(/\n/g, '<br/>') || `Vive momentos <br />\n<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand-secondary/70">inolvidables</span>` }}
            />
            <p className="text-white/70 font-medium text-sm md:text-base leading-relaxed max-w-lg mx-auto whitespace-pre-line">
              {homeSettings?.experiences_subtitle || `Eventos únicos, catas de café de especialidad y talleres interactivos. Descubre la esencia de ${brandName}.`}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 📅 GRID DE EVENTOS */}
      <section className="py-24 px-4 sm:px-6 lg:px-12 bg-transparent">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles size={18} />
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-brand-text">Próximos Eventos</h2>
              </div>
              <p className="text-black/50 font-medium text-sm sm:ml-14">Reserva tu cupo antes de que se agoten.</p>
            </div>
          </div>

          <Suspense fallback={
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-secondary w-8 h-8" />
            </div>
          }>
            <ExperiencesSection variant="grid" hideHeader={true} />
          </Suspense>
        </div>
      </section>

      {/* 🤖 SECCIÓN VIP: CURADOR DE EXPERIENCIAS AI */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 bg-white rounded-t-[3rem] md:rounded-t-[4rem] -mb-10 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div 
            className="rounded-[3rem] overflow-hidden flex flex-col md:flex-row relative shadow-[0_20px_60px_rgba(26,36,33,0.3)]"
            style={{ backgroundColor: restaurantSettings?.theme_footer_bg || homeSettings?.event_planner_bg_color || '#1A2421' }}
          >
            
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-primary/30 rounded-full blur-[80px] pointer-events-none" />

            {/* Texto y Llamado a la Acción */}
            <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full mb-6 self-start border border-white/10">
                <Sparkles size={14} className="text-brand-secondary" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Servicio VIP • Gemini AI</span>
              </div>
              
              <h2 
                className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: homeSettings?.event_planner_h1?.replace(/\n/g, '<br/>') || `¿Buscas algo <br/>más <span className="text-brand-secondary">Privado?</span>` }}
              />
              <p className="text-white/60 font-medium text-sm mb-10 leading-relaxed max-w-md whitespace-pre-line">
                {homeSettings?.event_planner_subtitle || 'Cenas de aniversario, reuniones de equipo o cumpleaños. Describe la experiencia que tienes en mente y nuestro curador de IA diseñará una propuesta preliminar a tu medida.'}
              </p>
              
              <button 
                onClick={() => setIsEventModalOpen(true)}
                className="bg-brand-secondary text-white px-6 md:px-8 py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-white hover:text-brand-primary hover:scale-105 transition-all w-fit shadow-xl"
              >
                <Sparkles size={16} />
                Diseñar mi evento con IA
              </button>
            </div>

            {/* Imagen Lateral (Ocupa la mitad derecha) */}
            <div className="w-full md:w-1/2 h-[300px] md:h-auto md:absolute md:inset-y-0 md:right-0 overflow-hidden">
              <img 
                src={homeSettings?.event_planner_img || "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=800"} 
                className="w-full h-full object-cover" 
                alt="Eventos Privados" 
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-primary via-brand-primary/30 to-transparent w-full md:w-1/3 h-1/3 md:h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 🔮 MODAL: AI EVENT PLANNER */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-0 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative mt-auto md:mt-0 md:h-auto border border-white/20"
            >
              <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-6 md:hidden" />
              
              <button onClick={() => setIsEventModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 bg-black/5 rounded-full flex items-center justify-center text-black/50 hover:bg-black/10 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
              
              <div className="w-12 h-12 bg-brand-secondary/20 text-brand-secondary rounded-full flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              
              <h3 className="text-2xl font-extrabold mb-2 text-brand-text">Curador de Experiencias</h3>
              <p className="text-sm font-medium text-black/50 mb-6">
                Describe tu evento ideal. Por ejemplo: <br/> <span className="italic">"Cena íntima para 4 amigas, nos gusta el vino y la comida ligera."</span>
              </p>

              <textarea 
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
                placeholder="Escribe tu idea aquí..."
                className="w-full bg-brand-bg border border-black/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all resize-none h-32 mb-6 font-medium text-brand-text placeholder:text-black/30"
              />

              <button 
                onClick={handleEventPlanner}
                disabled={isEventLoading || !eventQuery.trim()}
                className="w-full bg-brand-primary text-white py-4 rounded-full font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex justify-center items-center shadow-lg gap-2"
              >
                {isEventLoading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} className="text-brand-secondary"/> Generar Propuesta Mágica</>}
              </button>

              <AnimatePresence>
                {eventResponse && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    className="bg-brand-bg border border-brand-secondary/20 p-5 rounded-2xl text-left shadow-inner relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary" />
                    <p className="text-sm font-medium leading-relaxed text-brand-text italic">"{eventResponse}"</p>
                    
                    <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-[10px] uppercase font-bold text-brand-secondary tracking-widest hover:text-brand-primary transition-colors">
                      Contactar para agendar <ArrowUpRight size={12} />
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
