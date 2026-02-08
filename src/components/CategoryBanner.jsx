import React from "react";
import { formatCOP } from "@/utils/money";
import AAImage from "@/components/ui/AAImage";
import { PILL_XS, PILL_SM } from "./Buttons";

export default function CategoryBanner({ category, product, onOpenBuilder }) {
  // 1. Prioritize Category Fields
  const title = category?.banner_title || product?.name || category?.name;
  const description = category?.banner_description || product?.desc || "Elige tus ingredientes favoritos y crea una combinación única.";
  const accentColor = category?.accent_color || "#2f4131";
  
  // 2. Identify Type for fallbacks
  const isBowl = product?.tags?.includes('bowl') || category?.slug === 'bowls';
  const isSandwich = product?.tags?.includes('sandwich') || category?.slug === 'sandwiches';
  
  const imageSrc = category?.banner_image_url || 
                  (isBowl ? "/poke1.png" : 
                  (isSandwich ? "/sandwich-promo.png" : "/logo.webp"));

  const basePrice = product?.price || 0;

  return (
    <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 mb-8">
      <div 
        className="relative h-40 overflow-hidden rounded-[32px] ring-1 ring-black/5 shadow-xl sm:h-48 md:h-60"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc, #1a2b1d)` 
        }}
      >
        
        {/* Animated Background Element */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Promo Image */}
        <AAImage
          src={imageSrc}
          alt={title}
          className={`pointer-events-none absolute z-10 animate-[spin_60s_linear_infinite] object-contain drop-shadow-2xl transition-all duration-700
            ${isBowl ? 'bottom-[-10px] right-2 w-48 sm:w-64 md:w-80' : 'bottom-0 right-4 w-40 sm:w-56 md:w-72'}
          `}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center pl-6 pr-44 sm:pl-10 sm:pr-60">
          <div className="space-y-1 sm:space-y-2">
            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
               {category?.icon} {category?.name || 'Recomendado'}
            </span>
            <h3 className="text-2xl font-black text-white sm:text-3xl md:text-4xl leading-tight tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-white/80 max-w-xs leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
              {description}
            </p>
          </div>
          
          <div className="mt-5 flex items-center gap-3">
             {onOpenBuilder ? (
               <button
                  type="button"
                  onClick={onOpenBuilder}
                  className={`
                    bg-white text-[#2f4131] font-black text-[10px] sm:text-xs uppercase tracking-widest
                    rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all
                    ${PILL_XS} sm:${PILL_SM}
                  `}
                >
                  Empezar a Crear
                </button>
             ) : (
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white font-black text-[9px] uppercase tracking-widest">
                  Explorar Selección
                </div>
             )}
              <div className="hidden sm:flex items-center gap-1.5 opacity-60">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">En Vivo</span>
              </div>
          </div>
        </div>

        {/* Floating Price Pill */}
        {basePrice > 0 && (
          <div className={`
            absolute left-6 top-6 z-20 bg-white/10 backdrop-blur-md text-white border border-white/10
            font-black text-[9px] sm:text-[10px] uppercase tracking-widest
            grid place-items-center shadow-2xl rounded-xl
            ${PILL_XS} sm:${PILL_SM}
          `}>
            Desde {formatCOP(basePrice)}
          </div>
        )}

      </div>
    </div>
  );
}
