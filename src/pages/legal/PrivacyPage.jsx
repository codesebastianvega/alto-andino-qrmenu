import React, { useEffect } from 'react';
import AlunaNavbar from '../../components/aluna/AlunaNavbar';
import AlunaFooter from '../../components/aluna/AlunaFooter';

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-stone-300 font-sans selection:bg-[#7db87a] selection:text-black">
      <AlunaNavbar />
      
      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl text-white mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Política de Privacidad
        </h1>
        
        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-semibold mb-4">1. Recopilación de Información</h2>
            <p>
              En Aluna, recopilamos la información que usted nos proporciona directamente al registrarse, usar nuestra plataforma o comunicarse con nuestro soporte. Esto incluye datos de contacto, información del restaurante y datos de navegación básicos para mejorar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">2. Uso de los Datos</h2>
            <p className="mb-4">
              La información recopilada se utiliza exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar y mantener la plataforma de menús digitales.</li>
              <li>Procesar las configuraciones de su restaurante y pedidos de usuarios finales.</li>
              <li>Mejorar, personalizar y expandir nuestros servicios.</li>
              <li>Comunicarnos con usted sobre actualizaciones, soporte y notificaciones del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">3. Protección de su Información</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas de nivel empresarial para proteger sus datos personales contra acceso no autorizado, alteración, divulgación o destrucción. No vendemos ni alquilamos su información a terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">4. Compartir Información</h2>
            <p>
              Podemos compartir su información con proveedores de servicios de confianza (por ejemplo, pasarelas de pago o proveedores de alojamiento en la nube como Supabase) que nos asisten en la operación de nuestra plataforma, sujeto a estrictos acuerdos de confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">5. Sus Derechos</h2>
            <p>
              Usted tiene el derecho de acceder, corregir o eliminar su información personal en cualquier momento a través del panel de administración de Aluna. Si tiene preguntas sobre nuestra política de privacidad, puede contactarnos directamente.
            </p>
          </section>

          <p className="text-stone-500 pt-8 border-t border-white/10">
            Última actualización: Mayo 2026
          </p>
        </div>
      </main>

      <AlunaFooter />
    </div>
  );
}
