import React, { useEffect } from 'react';
import AlunaNavbar from '../../components/aluna/AlunaNavbar';
import AlunaFooter from '../../components/aluna/AlunaFooter';
import CookieConsent from '../../components/aluna/CookieConsent';

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-stone-300 font-sans selection:bg-[#7db87a] selection:text-black">
      <AlunaNavbar />
      
      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl text-white mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Términos y Condiciones
        </h1>
        
        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-semibold mb-4">1. Introducción</h2>
            <p>
              Bienvenido a Aluna. Al acceder y utilizar nuestros servicios, usted acepta estar sujeto a los siguientes términos y condiciones. Por favor, léalos detenidamente antes de utilizar nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">2. Uso de la Plataforma</h2>
            <p className="mb-4">
              Aluna proporciona una plataforma de menús digitales y gestión de restaurantes. Usted se compromete a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar información precisa y actualizada de su establecimiento.</li>
              <li>No utilizar la plataforma para actividades ilegales o no autorizadas.</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">3. Pagos y Suscripciones</h2>
            <p>
              Los servicios de Aluna se ofrecen bajo un modelo de suscripción. Los pagos se procesan de forma segura. Nos reservamos el derecho de modificar nuestras tarifas, notificando a los usuarios con la debida antelación.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">4. Propiedad Intelectual</h2>
            <p>
              Todo el contenido, diseño, logotipos y código fuente de la plataforma Aluna son propiedad exclusiva de la empresa y están protegidos por las leyes de propiedad intelectual aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">5. Limitación de Responsabilidad</h2>
            <p>
              Aluna se esfuerza por mantener un servicio ininterrumpido y libre de errores. Sin embargo, no garantizamos que el servicio cumpla con todos sus requisitos en todo momento o que sea 100% seguro contra fallos técnicos ajenos a nuestro control.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">6. Modificaciones a los Términos</h2>
            <p>
              Nos reservamos el derecho de actualizar estos términos en cualquier momento. El uso continuado de la plataforma después de cualquier cambio constituye su aceptación de los nuevos términos.
            </p>
          </section>
          
          <p className="text-stone-500 pt-8 border-t border-white/10">
            Última actualización: Mayo 2026
          </p>
        </div>
      </main>

      <AlunaFooter />
      <CookieConsent />
    </div>
  );
}
