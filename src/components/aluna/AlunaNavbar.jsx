import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../config/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > 400 && currentY > lastScrollY && !isMenuOpen) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMenuOpen]);

  const isHome = window.location.pathname === "/";

  const scrollTo = (e, href) => {
    if (isHome) {
      e.preventDefault();
      const el = document.getElementById(href.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsMenuOpen(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
  };

  return (
    <>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center p-8"
          >
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-10 right-8 text-white/50 hover:text-white p-3 rounded-full border border-white/10 bg-white/5 transition-all"
            >
              <X className="w-6 h-6" />
            </motion.button>

            <nav className="flex flex-col items-center gap-6">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => scrollTo(e, link.href)}
                  className="text-4xl font-light text-white hover:text-[#D4A853] transition-colors"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {link.label}
                </motion.a>
              ))}
              
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4 }}
                className="w-12 h-px bg-gradient-to-r from-transparent via-[#D4A853] to-transparent my-6" 
              />

              {!profile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center gap-6"
                >
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white/60 hover:text-white text-lg font-medium tracking-wide uppercase text-xs"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link 
                    to="/registro" 
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-white text-black px-12 py-4 rounded-full font-bold text-lg shadow-[0_10px_30_rgba(255,255,255,0.2)] active:scale-95 transition-transform"
                  >
                    Comenzar Gratis
                  </Link>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 rounded-full py-2 px-3 flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-max mx-auto gap-6">
          {/* Logo (Left) */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="text-[20px] tracking-tight text-white px-4 py-1 hover:opacity-80 transition-opacity whitespace-nowrap leading-none flex items-center"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Aluna
          </a>

          {/* Desktop Links (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1 border-x border-white/10 px-2 mx-1 h-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-full transition-all whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile Actions (Right) */}
          <div className="flex md:hidden items-center gap-8 pr-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-[16px] text-white/90 hover:text-white transition-all active:scale-95 whitespace-nowrap"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Menú
            </button>

            {/* Google Pill/Circle */}
            {!profile && (
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center transition-all active:scale-90 group"
                title="Continuar con Google"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
              </button>
            )}

            {profile && (
              <Link
                to="/#portal"
                className="text-[16px] text-white/90 hover:text-white transition-all whitespace-nowrap"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Portal
              </Link>
            )}
          </div>

          {/* Desktop Auth (Right) - only visible on md+ */}
          <div className="hidden md:flex items-center gap-2 pr-1">
            {profile ? (
              <Link
                to="/#portal"
                className="bg-white text-black px-6 py-2 rounded-full text-[11px] uppercase tracking-wider font-bold hover:bg-gray-200 transition-all shadow-lg"
              >
                Mi Portal
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-gray-400 hover:text-white text-[11px] uppercase tracking-wider font-bold px-3">Entrar</Link>
                <Link to="/registro" className="bg-white text-black px-6 py-2 rounded-full text-[11px] uppercase tracking-wider font-bold hover:bg-gray-200 transition-all shadow-lg shadow-white/5">Comenzar</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
