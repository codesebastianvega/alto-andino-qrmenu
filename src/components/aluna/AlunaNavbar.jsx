import { useState, useEffect } from "react";

export default function AlunaNavbar() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      // Hide navbar when scrolling down past 400px, show when scrolling up
      if (currentY > 400 && currentY > lastScrollY) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full p-2 flex items-center shadow-2xl w-[95%] max-w-fit transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      }`}
    >
      {/* Logo (hidden on mobile) */}
      <a href="#" className="text-xl tracking-tight text-white px-4 hidden md:block" style={{ fontFamily: "'DM Serif Display', serif" }}>
        Aluna
      </a>

      {/* Separator */}
      <div className="w-[1px] h-6 bg-white/20 mx-2 hidden md:block"></div>

      {/* Nav links */}
      <div className="flex items-center gap-1 sm:gap-2 px-2 overflow-x-auto scrollbar-hide">
        <a href="#nosotros" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">
          Nosotros
        </a>
        <a href="#servicios" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">
          Servicios
        </a>
        <a href="#beneficios" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">
          Beneficios
        </a>
        <a href="#portafolio" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">
          Portafolio
        </a>
        <a href="#planes" className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap">
          Planes
        </a>
      </div>

      {/* Separator */}
      <div className="w-[1px] h-6 bg-white/20 mx-2"></div>

      {/* CTA */}
      <a href="#contacto" className="bg-white text-[#1A1A1A] px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-all whitespace-nowrap">
        Comenzar
      </a>
    </nav>
  );
}
