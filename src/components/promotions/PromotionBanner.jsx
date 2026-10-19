import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { useMenuData } from '../../context/MenuDataContext';

export default function PromotionBanner() {
  const { activePromoBanner } = useMenuData();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!activePromoBanner?.id) return;
    try {
      const dismissedId = sessionStorage.getItem('aa_dismissed_promo_id');
      if (dismissedId === activePromoBanner.id) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {}
  }, [activePromoBanner?.id]);

  if (!activePromoBanner || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('aa_dismissed_promo_id', activePromoBanner.id);
    } catch {}
  };

  const bgColor = activePromoBanner.banner_bg_color || '#047857';
  const textColor = activePromoBanner.banner_text_color || '#ffffff';

  return (
    <aside 
      aria-label="Promoción activa"
      className="relative z-40 w-full transition-all duration-300 shadow-sm"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-center text-center">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300"></span>
          </span>
          <p className="truncate sm:overflow-visible sm:whitespace-normal font-bold">
            {activePromoBanner.banner_message}
          </p>
          {activePromoBanner.end_date && (
            <span className="hidden md:inline-block text-[11px] font-medium opacity-85 bg-black/15 px-2 py-0.5 rounded-full ml-1.5">
              Válido hasta {new Date(activePromoBanner.end_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-black/10 active:scale-95 transition-all text-white/80 hover:text-white shrink-0 cursor-pointer"
          title="Ocultar anuncio"
          aria-label="Cerrar anuncio promocional"
        >
          <Icon icon="heroicons:x-mark" className="text-base sm:text-lg" />
        </button>
      </div>
    </aside>
  );
}
