import React from "react";
import { formatCOP } from "@/utils/money";
import AAImage from "@/components/ui/AAImage";

export default function CategoryBanner({ category, product, onOpenBuilder }) {
  // 1. Configuration
  const config = category?.visibility_config || {};
  const style = config.banner_style || 'floating'; // 'floating' | 'background'
  const isFloating = style === 'floating';

  // 2. Fields
  const title = category?.banner_title || product?.name || category?.name;
  const description = category?.banner_description || product?.desc || "Elige tus ingredientes favoritos y crea una combinación única.";
  const accentColor = category?.accent_color || "#2f4131";
  
  const isBowl = product?.tags?.includes('bowl') || category?.slug === 'bowls';
  const isSandwich = product?.tags?.includes('sandwich') || category?.slug === 'sandwiches';
  
  const imageSrc = category?.banner_image_url || 
                  (isBowl ? "/poke1.png" : 
                  (isSandwich ? "/sandwich-promo.png" : "/logo.webp"));

  const basePrice = product?.price || 0;

  return (
    <div className="-mx-5 sm:-mx-6 md:-mx-8 lg:mx-0 px-5 sm:px-6 md:px-8 mb-8 mt-2">
      <div 
        className="relative h-44 sm:h-52 md:h-64 overflow-hidden rounded-[32px] ring-1 ring-black/5 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 group"
        style={isFloating ? { 
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc, #1a2b1d)` 
        } : {}}
      >
        {/* BACKGROUND LAYER */}
        {!isFloating ? (
          <>
            <img 
              src={imageSrc} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
          </>
        ) : (
          <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
        )}

        {/* FLOATING SPINNER (Only for floating style) */}
        {isFloating && (
          <AAImage
            src={imageSrc}
            alt={title}
            className={`pointer-events-none absolute z-20 animate-[spin_60s_linear_infinite] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700
              ${isBowl 
                ? 'bottom-[-10px] right-[-10px] w-40 sm:bottom-[-10px] sm:right-2 sm:w-64 md:w-80' 
                : 'bottom-0 right-[-10px] w-32 sm:bottom-0 sm:right-4 sm:w-56 md:w-72'}
            `}
          />
        )}

        {/* SHARED CONTENT OVERLAY */}
        <div className="absolute inset-0 z-30 flex flex-col justify-center pl-5 pr-24 sm:pl-12 sm:pr-64">
          <div className="space-y-2 sm:space-y-4">
            {/* Integrated Category Chip - Hidden on Mobile */}
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 w-fit">
                <span className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                   {category?.icon} {category?.name || 'Recomendado'}
                </span>
              </div>
              {basePrice > 0 && (
                <div className="px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full border border-white/5 w-fit">
                  <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">
                    Desde {formatCOP(basePrice)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white sm:text-3xl md:text-4xl leading-tight tracking-tight drop-shadow-lg">
                {title}
              </h3>
              <p className="text-[11px] sm:text-sm text-white/80 max-w-xs sm:max-w-md leading-relaxed font-medium line-clamp-2 sm:line-clamp-none drop-shadow-md">
                {description}
              </p>
            </div>
          </div>
          
          {(onOpenBuilder || config.banner_badge) && (
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3">
               {onOpenBuilder && (
                 <button
                    type="button"
                    onClick={onOpenBuilder}
                    className="bg-white text-[#2f4131] font-black text-[9px] sm:text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all px-5 py-2.5 sm:px-10 sm:py-3.5"
                  >
                    Empezar a Crear
                  </button>
               )}
                
                {/* Integrated Specialty Chip - Visible on all devices */}
                {config.banner_badge && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-black/20 backdrop-blur-md rounded-full text-white font-black text-[9px] uppercase tracking-widest border border-white/10">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                     {config.banner_badge}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

