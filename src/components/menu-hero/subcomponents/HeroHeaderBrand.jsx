import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, MapPin } from 'lucide-react';
import StorePausedBanner from '../../StorePausedBanner';

export default function HeroHeaderBrand({
  primaryColor,
  accentColor,
  heroBg,
  isLightLogo,
  logoUrl,
  brandName,
  locationLabel,
  locationHint,
  homeSettings,
  effectiveBrand,
  onOpenCart,
  handleScrollToFeatured,
  featuredButtonLabel
}) {
  return (
    <>
      <div
        className="absolute -top-28 left-1/2 -z-10 h-[315px] w-[calc(100%+2rem)] -translate-x-1/2 rounded-b-[2.75rem] lg:h-[390px] lg:w-screen"
        style={{
          background: `
            radial-gradient(circle at 12% 4%, ${primaryColor}24 0, transparent 34%),
            radial-gradient(circle at 90% 0%, ${accentColor}20 0, transparent 30%),
            linear-gradient(180deg, #ffffff 0%, ${heroBg} 78%, transparent 100%)
          `
        }}
      />

      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 w-full text-left lg:max-w-3xl"
        >
          <div className="mb-3 flex flex-col items-start gap-2">
            <div className="flex items-center gap-3 md:hidden">
              <div
                className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.07)] ring-1 backdrop-blur-xl transition-colors ${
                  isLightLogo ? 'bg-neutral-900 ring-neutral-800' : 'bg-white/85 ring-white/80'
                }`}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="h-full w-full object-contain p-2 drop-shadow-sm"
                  />
                ) : (
                  <span className="text-sm font-black uppercase" style={{ color: primaryColor }}>
                    {brandName.slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="max-w-[220px] truncate text-[15px] font-black leading-tight text-[#1A1A1A]">
                  {brandName}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/35">
                  Menú digital
                </p>
              </div>
            </div>
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/45 px-3 py-1 text-[11px] font-bold text-[#1A1A1A]/55 backdrop-blur-md">
              <MapPin size={12} className="text-[#1A1A1A]/55" />
              <span className="max-w-[230px] truncate">{locationLabel}</span>
              <span className="text-[#1A1A1A]/25">•</span>
              <span className="max-w-[120px] truncate">{locationHint}</span>
            </div>
          </div>

          <StorePausedBanner onOpenCart={onOpenCart} />

          <h1 className="mb-1 text-lg sm:text-2xl font-extrabold tracking-tight text-[#1A1A1A] leading-snug">
            {homeSettings?.hero_h1 &&
            !/hawaiano|frescura|tex-mex|albóndigas|albondigas|mediterráneo|mediterraneo/i.test(
              homeSettings?.hero_h1 + (homeSettings?.hero_subtitle || '')
            ) ? (
              <span dangerouslySetInnerHTML={{ __html: homeSettings.hero_h1.replace(/\n/g, '<br/>') }} />
            ) : effectiveBrand?.slug === 'boku-bento' ? (
              '🔥 ¡NUEVA LÍNEA POKE PREMIUM! 🔥'
            ) : (
              <>
                Comer <span style={{ color: primaryColor }}>sano</span> nunca fue tan fácil
              </>
            )}
          </h1>
          <p className="text-xs font-medium text-[#1A1A1A]/55 leading-relaxed md:text-sm">
            {effectiveBrand?.slug === 'boku-bento' &&
            (!homeSettings?.hero_subtitle ||
              /hawaiano|tex-mex|albóndigas|albondigas|mediterráneo|mediterraneo/i.test(
                homeSettings?.hero_subtitle
              ))
              ? 'Dos opciones brutales por solo $22.000 c/u: 🍣 Poke Salmón Fresh (Fresco o Salteado) o 🍗 Poke Tori Katsu. 🥣 Incluye: Sopita del día o Fruta + 🥤 Jugo del día.'
              : homeSettings?.hero_subtitle || 'Ingredientes locales, directo a tu mesa.'}
          </p>

          <div className="mt-3 flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleScrollToFeatured}
              className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-2xl text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${primaryColor || '#8a0a0a'} 0%, ${accentColor || '#1a0505'} 100%)`
              }}
            >
              <span>🍛</span>
              <span>{featuredButtonLabel}</span>
              <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
            <span className="text-[11px] font-semibold text-[#1A1A1A]/45 hidden sm:inline-flex items-center gap-1">
              <span>✨</span>
              <span>Desplazamiento directo</span>
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
