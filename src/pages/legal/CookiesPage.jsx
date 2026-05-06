import React, { useEffect } from 'react';
import AlunaNavbar from '../../components/aluna/AlunaNavbar';
import AlunaFooter from '../../components/aluna/AlunaFooter';

export default function CookiesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-stone-300 font-sans selection:bg-[#7db87a] selection:text-black">
      <AlunaNavbar />
      
      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl text-white mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Uso de Cookies
        </h1>
        
        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-semibold mb-4">1. ¿Qué son las Cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo (computadora, tablet o móvil) cuando los visita. Aluna utiliza cookies para que la plataforma funcione correctamente y proporcionar una mejor experiencia.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">2. Tipos de Cookies que Utilizamos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white">Cookies Esenciales</h3>
                <p>Son necesarias para que el sitio funcione, como mantener su sesión iniciada en el panel de administración o guardar los artículos en un carrito de compras temporal. No pueden desactivarse en nuestros sistemas.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white">Cookies de Rendimiento y Análisis</h3>
                <p>Nos permiten contar las visitas y las fuentes de tráfico para poder medir y mejorar el rendimiento de nuestra plataforma. Usamos herramientas propias y de terceros para entender cómo interactúan los usuarios con los menús.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white">Cookies Funcionales</h3>
                <p>Permiten que el sitio web ofrezca una mayor funcionalidad y personalización, como recordar la sede seleccionada o sus preferencias visuales.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">3. Control y Eliminación de Cookies</h2>
            <p>
              La mayoría de los navegadores web le permiten gestionar sus preferencias de cookies. Usted puede configurar su navegador para que rechace las cookies o las elimine. Tenga en cuenta que si desactiva ciertas cookies, algunas funcionalidades de la plataforma Aluna podrían no funcionar correctamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-4">4. Cambios en la Política</h2>
            <p>
              Podemos actualizar esta política de cookies ocasionalmente para reflejar, por ejemplo, cambios en las cookies que usamos o por otras razones operativas, legales o reglamentarias. Por favor, vuelva a visitar esta página regularmente para mantenerse informado.
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
