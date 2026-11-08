import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { formatCOP } from '../../../utils/money';
import { cleanAssistantName } from '../../../utils/formatters';

export default function HeroPromoBanner({
  homeSettings,
  bannerProduct,
  menuBannerError,
  setMenuBannerError,
  onBannerClick
}) {
  if (homeSettings?.show_menu_banner === false) return null;

  const bannerImgSrc =
    !menuBannerError && (homeSettings?.menu_banner_img || bannerProduct?.image_url)
      ? homeSettings?.menu_banner_img || bannerProduct?.image_url
      : 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200';

  const bannerTitleHtml =
    homeSettings?.menu_banner_title && !homeSettings.menu_banner_title.includes('Vive la experiencia')
      ? homeSettings.menu_banner_title.replace(/\n/g, '<br/>')
      : bannerProduct?.name
      ? `🍱 ${bannerProduct.name}`
      : `¿No sabes qué pedir?<br/>Pregúntale a ${cleanAssistantName(homeSettings?.concierge_h1, 'Boki')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      onClick={onBannerClick}
      className="w-full mt-2 rounded-[1.5rem] overflow-hidden relative cursor-pointer group h-28 md:h-36 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all"
    >
      <img
        src={bannerImgSrc}
        onError={() => setMenuBannerError(true)}
        alt={homeSettings?.menu_banner_title || 'Banner del Menú'}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1A2421]/95 via-[#1A2421]/70 to-transparent" />

      <div className="absolute inset-0 p-5 md:p-6 flex items-center justify-between z-10">
        <div className="flex flex-col justify-center max-w-[70%]">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-[#E6B05C] text-[#1A1A1A] text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
              {homeSettings?.menu_banner_tag || (bannerProduct ? 'Recomendado' : 'Menú BOKU')}
            </span>
            <span className="text-white/70 text-[10px] font-bold">
              {homeSettings?.menu_banner_subtitle && homeSettings.menu_banner_subtitle !== 'Talleres & Catas'
                ? homeSettings.menu_banner_subtitle
                : bannerProduct
                ? 'Disponible hoy'
                : 'Ingredientes frescos'}
            </span>
          </div>
          <h3
            className="font-extrabold text-white text-base sm:text-lg md:text-xl leading-tight line-clamp-2 drop-shadow-sm"
            dangerouslySetInnerHTML={{ __html: bannerTitleHtml }}
          />
        </div>

        <div className="flex items-center gap-2">
          {bannerProduct ? (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-[#1A2421] font-black text-xs shadow-lg group-hover:bg-[#E6B05C] group-hover:scale-105 transition-all">
              <span>Pedir {bannerProduct.price ? formatCOP(bannerProduct.price) : ''}</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-white group-hover:text-[#1A2421] group-hover:scale-110 transition-all">
              <ArrowRight size={16} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
