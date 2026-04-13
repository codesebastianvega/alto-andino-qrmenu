import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { FadeIn, MagneticButton, SpotlightCard } from "./animations";
import { supabase } from "../../config/supabase";

export default function AlunaContact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    restaurant: "",
    email: "",
    message: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('leads').insert([{
        name: formData.name,
        email: formData.email,
        restaurant_name: formData.restaurant,
        message: formData.message,
        status: 'new',
        source: 'landing_page'
      }]);

      if (error) throw error;
      setSuccess(true);
      setFormData({ name: "", restaurant: "", email: "", message: "" });
    } catch (err) {
      console.error("Error submitting lead:", err);
      alert("Hubo un error al enviar tu solicitud. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="py-32 px-6 md:px-12 lg:px-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <FadeIn direction="right">
          <h2 className="text-5xl text-[#1A1A1A] mb-6 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>¿Listo para dar el siguiente paso?</h2>
          <p className="text-[#6B7280] text-lg leading-relaxed mb-10 max-w-md">
            Déjanos tus datos y nuestro equipo se pondrá en contacto contigo para diseñar una propuesta a la medida de tu restaurante.
          </p>
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#1A1A1A]">
                <ArrowRight className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Escríbenos</div>
                <a href="mailto:hola@aluna.com" className="text-lg font-medium text-[#1A1A1A] hover:text-[#2D6A4F] transition-colors">hola@aluna.com</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#1A1A1A]">
                <ArrowRight className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Llámanos</div>
                <a href="tel:+573001234567" className="text-lg font-medium text-[#1A1A1A] hover:text-[#2D6A4F] transition-colors">+57 300 123 4567</a>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn direction="left" delay={0.2}>
          <SpotlightCard className="bg-white border border-[#E5E7EB] shadow-[0_20px_40px_rgba(0,0,0,0.04)] p-8 md:p-12 rounded-[32px] relative overflow-hidden">
            {success ? (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl text-[#1A1A1A] mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>¡Solicitud Enviada!</h3>
                <p className="text-[#6B7280] max-w-xs mx-auto">
                  Gracias por tu interés. Un especialista de Aluna se pondrá en contacto contigo muy pronto.
                </p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="mt-8 text-sm font-bold text-[#2D6A4F] hover:underline"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl text-[#1A1A1A] mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>Solicitar Demostración</h3>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Nombre Completo</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#F7F7F5] border-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all" 
                        placeholder="Ej. Carlos Mendoza" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Restaurante</label>
                      <input 
                        type="text" 
                        value={formData.restaurant}
                        onChange={(e) => setFormData({...formData, restaurant: e.target.value})}
                        className="w-full bg-[#F7F7F5] border-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all" 
                        placeholder="Nombre de tu local" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Correo Electrónico</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#F7F7F5] border-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all" 
                      placeholder="carlos@restaurante.com" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">¿En qué podemos ayudarte?</label>
                    <textarea 
                      rows={3} 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-[#F7F7F5] border-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all resize-none" 
                      placeholder="Cuéntanos sobre tus necesidades actuales..."
                    ></textarea>
                  </div>
                  <MagneticButton className="w-full mt-2">
                    <button 
                      disabled={loading}
                      type="submit" 
                      className="w-full bg-[#1A1A1A] text-white py-4 rounded-full text-sm font-semibold hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>Enviando... <Loader2 className="w-4 h-4 animate-spin" /></>
                      ) : (
                        <>Enviar Solicitud <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </MagneticButton>
                </form>
              </>
            )}
          </SpotlightCard>
        </FadeIn>
      </div>
    </section>
  );
}

