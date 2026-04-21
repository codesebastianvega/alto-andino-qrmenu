import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { label: "Nosotros",   href: "#nosotros"      },
  { label: "Servicios",  href: "#como-funciona"  },
  { label: "Beneficios", href: "#beneficios"     },
  { label: "Portafolio", href: "#portafolio"     },
  { label: "Planes",     href: "#planes"         },
  { label: "FAQ",        href: "#faq"            },
];

export default function AlunaNavbar() {
  const { profile } = useAuth();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
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

  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.getElementById(href.replace("#", ""));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full p-2 flex items-center shadow-2xl w-[95%] max-w-fit transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      }`}
    >
      {/* Logo */}
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className="text-xl tracking-tight text-white px-4 hidden md:block"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        Aluna
      </a>

      <div className="w-[1px] h-6 bg-white/20 mx-2 hidden md:block" />

      {/* Nav links */}
      <div className="flex items-center gap-1 sm:gap-2 px-2 overflow-x-auto scrollbar-hide">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            onClick={(e) => scrollTo(e, href)}
            className="text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full transition-all whitespace-nowrap"
          >
            {label}
          </a>
        ))}
      </div>

      <div className="w-[1px] h-6 bg-white/20 mx-2" />

      {/* CTA */}
      <div className="flex items-center gap-1 sm:gap-2">
        {profile ? (
          <Link
            to="/"
            className="bg-white text-[#1A1A1A] px-6 sm:px-8 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-all shadow-lg active:scale-95"
          >
            Mi Portal
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="text-gray-300 hover:text-white px-2 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
            >
              Entrar
            </Link>
            <Link
              to="/registro"
              className="bg-white text-[#1A1A1A] px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-all whitespace-nowrap"
            >
              Comenzar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
