import React from "react";
import { Leaf, MapPin, Instagram, MessageCircle } from "lucide-react";
import { useMenuData } from "../context/MenuDataContext";
import { useAuth } from "../context/AuthContext";

function getGreetingMessage() {
  const hour = new Date().getHours();
  if (hour < 12) return "Gracias por visitarnos esta mañana ☀️";
  if (hour < 18) return "Gracias por compartir tu tarde con nosotros 🌿";
  return "Gracias por acompañarnos esta noche 🌙";
}

export default function Footer({ hasCartBar }) {
  const { restaurantSettings } = useMenuData();
  const { activeBrand } = useAuth();
  
  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";
  const logoUrl = restaurantSettings?.logo_url;
  const footerBg = restaurantSettings?.theme_footer_bg || "#1A2421";

  const IG_URL = restaurantSettings?.instagram_url || (activeBrand?.instagram ? `https://instagram.com/${activeBrand.instagram.replace('@', '')}` : null);
  const RAW_WA = (restaurantSettings?.whatsapp_number_orders || activeBrand?.whatsapp || "").replace(/\D/g, "");
  const WA_NUM = RAW_WA ? (RAW_WA.startsWith("57") ? RAW_WA : `57${RAW_WA}`) : null;
  const WA_LINK = WA_NUM ? `https://wa.me/${WA_NUM}` : null;
  const MAPS_LINK = restaurantSettings?.maps_url || activeBrand?.address_link;
  const REVIEWS_URL = restaurantSettings?.reviews_url;

  return (
    <footer 
      style={{ backgroundColor: footerBg }}
      className={`text-white pt-10 md:pt-20 px-4 md:px-6 lg:px-12 rounded-t-[2rem] md:rounded-t-[3.5rem] ${hasCartBar ? "pb-28 md:pb-32" : "pb-6 md:pb-10"}`}
    >
      <div className="container mx-auto max-w-7xl">
        
        {/* Greeting */}
        <div className="text-center mb-8 md:mb-16">
          <p className="text-white/40 text-xs md:text-sm font-medium">{getGreetingMessage()}</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mb-10 md:mb-16">
          
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-start mb-4 md:mb-5">
              {restaurantSettings?.logo_url ? (
                <img src={logoUrl} alt={brandName} className="h-10 md:h-12 object-contain filter brightness-0 invert" />
              ) : (
                <span className="text-2xl font-black tracking-tighter text-white">
                  {brandName}
                </span>
              )}
            </div>
            <p className="text-white/50 font-medium text-xs md:text-sm max-w-sm leading-relaxed mb-4 md:mb-6">
              {activeBrand?.description || "Elevando la experiencia de la comida saludable. Raíces locales, nutrición consciente y un espacio para respirar en la ciudad."}
            </p>
            <div className="flex gap-2 md:gap-3">
              {IG_URL && (
                <a 
                  href={IG_URL} 
                  target="_blank" 
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E6B05C] hover:text-[#1A1A1A] transition-all"
                >
                  <Instagram size={18} />
                </a>
              )}
              {WA_LINK && (
                <a 
                  href={WA_LINK} 
                  target="_blank" 
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                >
                  <MessageCircle size={18} />
                </a>
              )}
              {REVIEWS_URL && (
                <a 
                  href={REVIEWS_URL} 
                  target="_blank" 
                  rel="noreferrer"
                  aria-label="Google Reviews"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E6B05C] hover:text-[#1A1A1A] transition-all font-bold text-xs"
                >
                  ⭐
                </a>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="font-bold mb-3 md:mb-5 text-sm md:text-base">Visítanos</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-white/60 font-medium">
              <li>{activeBrand?.address || ""}</li>
              <li>{activeBrand?.city || ""}</li>
              {MAPS_LINK && (
                <li className="pt-1">
                  <a 
                    href={MAPS_LINK} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[#E6B05C] hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <MapPin size={16} /> Abrir en Maps
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-bold mb-3 md:mb-5 text-sm md:text-base">Horarios</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-white/60 font-medium">
              <li className="flex justify-between gap-4">
                <span>{activeBrand?.schedule_days || "Lun - Vie"}</span>
                <span>{activeBrand?.schedule_hours || "8:00 - 18:00"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/40">
          <p>© {new Date().getFullYear()} {brandName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#admin" className="opacity-30 hover:opacity-100 transition-opacity">⚙️ Admin</a>
            <span className="text-white/20">·</span>
            <span>Diseñado por Sebas (UXIO)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
