import React, { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const hasAccepted = localStorage.getItem('aluna_cookie_consent');
    if (!hasAccepted) {
      // Pequeño retraso para que no aparezca de golpe al cargar
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('aluna_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="max-w-4xl mx-auto bg-[#1A1A1A] border border-white/10 p-4 md:p-6 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-stone-300 flex-1">
          <p>
            Utilizamos cookies propias y de terceros para mejorar nuestros servicios y mostrarle publicidad relacionada con sus preferencias mediante el análisis de sus hábitos de navegación.{' '}
            <a href="#cookies" className="text-[#7db87a] hover:text-[#5c8b59] underline underline-offset-2 transition-colors">
              Más información
            </a>
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleAccept}
            className="flex-1 sm:flex-none bg-[#7db87a] hover:bg-[#5c8b59] text-black font-semibold py-2.5 px-6 rounded-xl transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
