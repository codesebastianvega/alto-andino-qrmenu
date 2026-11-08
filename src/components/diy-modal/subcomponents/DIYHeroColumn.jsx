import React from 'react';
import { Icon } from '@iconify-icon/react';
import AAImage from '@/components/ui/AAImage';
import { formatCOP } from '@/utils/money';

export default function DIYHeroColumn({
  title,
  subtitle,
  image,
  finalPrice,
  totalSelectedCount
}) {
  return (
    <div className="hidden md:flex w-5/12 flex-shrink-0 relative bg-neutral-950 flex-col justify-between p-8 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#cba258]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#2f4131]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Hero Header */}
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black tracking-widest uppercase border border-white/20 text-[#e6ca85]">
          <Icon icon="lucide:sparkles" className="text-sm" /> Experiencia BOKU DIY
        </span>
        <h2 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight drop-shadow-md">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-white/70 text-xs lg:text-sm leading-relaxed line-clamp-3">
            {subtitle}
          </p>
        )}
      </div>

      {/* Floating Hero Image */}
      <div className="relative z-10 my-4 lg:my-6 flex items-center justify-center flex-1">
        <div className="relative w-64 h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-full p-2 bg-gradient-to-tr from-[#cba258]/30 via-white/5 to-transparent shadow-2xl">
          <AAImage
            src={image}
            alt={title}
            className="w-full h-full object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.7)] hover:scale-105 transition-transform duration-700"
          />
        </div>
      </div>

      {/* Price & Summary Footnote */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Total del Bowl</p>
            <p className="text-2xl font-black text-[#f1d28d]">{formatCOP(finalPrice)}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded-full font-bold text-white/90">
              {totalSelectedCount} {totalSelectedCount === 1 ? 'porción' : 'porciones'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
