import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { FadeIn } from "./animations";

const faqs = [
  {
    question: "¿Tengo que pagar para empezar a usar Aluna?",
    answer: "No. Puedes crear tu cuenta y tu catálogo digital totalmente gratis con nuestro plan Emprendedor. Solo cobramos una comisión del 15% por cada pedido exitoso que proceses a través de la plataforma."
  },
  {
    question: "¿Mis clientes deben descargar una aplicación?",
    answer: "¡Para nada! Aluna funciona directamente en el navegador de cualquier teléfono móvil. Tus comensales solo escanean un código QR o entran a tu enlace y pueden pedir al instante."
  },
  {
    question: "¿Cómo cobran la comisión del plan Emprendedor?",
    answer: "El sistema totaliza automáticamente las ventas que se generan a través de tu menú digital durante el mes. En los primeros 5 días del mes siguiente, te enviamos la liquidación con el 15% de los pedidos procesados."
  },
  {
    question: "¿Qué pasa si ya tengo mi propio dominio web?",
    answer: "En los planes de pago (Esencial y Profesional) puedes enlazar tu dominio propio (ej. turestaurante.com) sin costo adicional. Si eliges el plan Emprendedor, usarás nuestro subdominio gratuito (aluna.app/tulocal)."
  },
  {
    question: "¿Puedo cambiar de plan más adelante?",
    answer: "¡Por supuesto! Aluna crece contigo. Puedes iniciar en el plan Emprendedor para probar el sistema, y cuando tu volumen de ventas crezca (y veas que te conviene más), puedes actualizar al plan Esencial que no cobra comisiones por pedido."
  }
];

export default function AlunaFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-32 px-6 md:px-12 lg:px-20 bg-white">
      <div className="max-w-3xl mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-[#1A1A1A] mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Preguntas Frecuentes</h2>
          <p className="text-[#6B7280] text-lg">
            Todo lo que necesitas saber antes de dar el siguiente paso con tu negocio.
          </p>
        </FadeIn>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <FadeIn key={index} delay={0.05 * index}>
                <div 
                  className={`border ${isOpen ? 'border-[#2D6A4F] bg-[#F7F7F5]' : 'border-gray-200'} rounded-2xl overflow-hidden transition-all duration-300`}
                >
                  <button 
                    className="w-full px-6 py-6 flex justify-between items-center bg-transparent text-left focus:outline-none"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <span className="font-semibold text-[#1A1A1A] pr-4">{faq.question}</span>
                    <div className={`p-2 rounded-full shrink-0 transition-colors ${isOpen ? 'bg-[#2D6A4F] text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </div>
                  </button>
                  <div 
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-[#6B7280] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
