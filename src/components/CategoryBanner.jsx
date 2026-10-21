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
  const description = category?.banner_description || product?.desc || "";
  const accentColor = category?.accent_color || "#bc0e0e";
  
  const isBowl = product?.tags?.includes('bowl') || category?.slug === 'bowls';
  const isSandwich = product?.tags?.includes('sandwich') || category?.slug === 'sandwiches';
  
  const defaultFallback = isBowl 
    ? "/poke1.webp" 
    : (isSandwich ? "/img/products/sandwich-serrano.jpg" : "/img/products/bowl-poke-hawaiano.jpg");

  const [imgError, setImgError] = React.useState(false);
  const imageSrc = (!imgError && category?.banner_image_url && category.banner_image_url !== '/poke1.webp') 
    ? category.banner_image_url 
    : (product?.image_url || category?.banner_image_url || defaultFallback);

  const animationMode = config.banner_animation || 'static';
  const isSpinning = isFloating && (animationMode === 'spin' || config.banner_spin === true);

  const basePrice = product?.price || 0;
  const isScheduleRestricted = category?.is_schedule_active === false;
  const scheduleNotice = category?.schedule_label || "Fuera de horario de servicio";

  return (
    <div className="mb-8 mt-6 sm:mt-8 pt-2">
      <div 
        onClick={onOpenBuilder}
        className={`relative h-40 sm:h-52 md:h-64 rounded-3xl sm:rounded-[32px] ring-1 ring-black/10 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-black/15 group ${
          isScheduleRestricted ? 'opacity-85 saturate-[0.85]' : ''
        } ${onOpenBuilder ? 'cursor-pointer active:scale-[0.99]' : ''}`}
        style={isFloating ? { 
          background: `linear-gradient(135deg, ${accentColor}, #8a0a0a, #1a0505)` 
        } : {}}
      >
        {/* BACKGROUND LAYER (Clipped inside rounded container) */}
        <div className="absolute inset-0 rounded-3xl sm:rounded-[32px] overflow-hidden z-0">
          {!isFloating ? (
            <>
              <img 
                src={imageSrc} 
                alt={title} 
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent z-10" />
            </>
          ) : (
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>
          )}
        </div>

        {/* FLOATING HERO IMAGE (Pop-out 3D Effect: Calibrated scale & fixed downward shadow) */}
        {isFloating && (
          <div className={`pointer-events-none absolute z-20 transition-transform duration-700 group-hover:scale-105 drop-shadow-[0_12px_24px_rgba(0,0,0,0.20)] ${
            isBowl 
              ? '-top-7 -right-4 sm:-top-8 sm:right-1 md:-top-9 md:right-4 lg:-top-10 lg:right-6' 
              : 'bottom-0 right-[-10px] sm:bottom-0 sm:right-4'
          }`}>
            <AAImage
              src={imageSrc}
              alt={title}
              onError={() => setImgError(true)}
              className={`object-contain select-none ${
                isSpinning ? 'animate-[spin_40s_linear_infinite] will-change-transform' : ''
              } ${
                isBowl 
                  ? 'w-[215px] sm:w-72 md:w-80 lg:w-96 h-auto' 
                  : 'w-36 sm:w-60 md:w-76 h-auto'
              }`}
            />
          </div>
        )}

        {/* SHARED CONTENT OVERLAY */}
        <div className="absolute inset-0 z-30 flex flex-col justify-center pl-6 pr-20 sm:pl-12 sm:pr-64">
          <div className="space-y-1.5 sm:space-y-4">
            {/* Integrated Category Chip - Hidden on Mobile */}
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 w-fit">
                <span className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                   {category?.icon} {category?.name || 'Recomendado'}
                </span>
              </div>
              {isScheduleRestricted ? (
                <div className="px-3 py-1 bg-amber-500/85 backdrop-blur-sm rounded-full border border-amber-300/40 w-fit shadow-xs">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    🕒 {scheduleNotice}
                  </span>
                </div>
              ) : basePrice > 0 ? (
                <div className="px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full border border-white/5 w-fit">
                  <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">
                    Desde {formatCOP(basePrice)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <h3 className="text-xl font-black text-white sm:text-3xl md:text-4xl leading-tight tracking-tight drop-shadow-lg max-w-[195px] sm:max-w-md">
                {title}
              </h3>
              <p className="text-[10px] sm:text-sm text-white/80 max-w-[180px] sm:max-w-md leading-relaxed font-medium line-clamp-2 sm:line-clamp-none drop-shadow-md">
                {description}
              </p>
            </div>
          </div>
          
          {(onOpenBuilder || config.banner_badge || isScheduleRestricted) && (
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3">
               {onOpenBuilder && (
                 <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBuilder?.();
                    }}
                    className="bg-white font-black text-[9px] sm:text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all px-5 py-2.5 sm:px-10 sm:py-3.5"
                    style={{ color: accentColor }}
                  >
                    {isScheduleRestricted ? 'Ver Opciones 🕒' : (category?.slug === 'bowls' ? 'Armar Bowl' : 'Personalizar')}
                  </button>
               )}
                
                {/* Integrated Specialty Chip - Visible on all devices */}
                {isScheduleRestricted ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-950/75 backdrop-blur-md rounded-full text-amber-200 font-black text-[9px] uppercase tracking-widest border border-amber-400/30">
                     <span>🕒</span>
                     <span>{scheduleNotice}</span>
                  </div>
                ) : config.banner_badge ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-black/20 backdrop-blur-md rounded-full text-white font-black text-[9px] uppercase tracking-widest border border-white/10">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                     {config.banner_badge}
                  </div>
                ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
