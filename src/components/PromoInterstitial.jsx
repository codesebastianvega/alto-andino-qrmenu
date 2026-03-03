import React from 'react';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../utils/money';
import { Icon } from '@iconify-icon/react';
import { toast } from './Toast';

export default function PromoInterstitial({ item, type = 'banner' }) {
  const { addItem } = useCart();

  const handleAction = () => {
    if (type === 'experience') {
      // Logic to open experience modal (handled by parent or global state)
      window.dispatchEvent(new CustomEvent('aa:openExperience', { detail: item }));
      return;
    }

    if (item.cta_link?.startsWith('http')) {
      window.open(item.cta_link, "_blank", "noopener,noreferrer");
    } else if (item.cta_link) {
      window.location.href = item.cta_link;
    }
  };

  if (type === 'experience') {
    return (
      <div 
        onClick={handleAction}
        className="mx-4 my-8 rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#2f4131] to-[#4a6741] text-white shadow-xl relative cursor-pointer group active:scale-[0.98] transition-all"
      >
        {item.image_url && (
          <div className="absolute inset-0 opacity-40">
            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
            <Icon icon="heroicons:sparkles" className="text-2xl" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">Experiencia Recomendada</p>
          <h3 className="text-xl font-black mb-2 leading-tight">{item.title}</h3>
          <p className="text-sm text-white/80 line-clamp-2 mb-6 max-w-[240px] leading-relaxed italic">"{item.short_description}"</p>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Precio</p>
              <p className="text-lg font-black">{formatCOP(item.price)}</p>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Duración</p>
              <p className="text-lg font-black">{item.duration_minutes}m</p>
            </div>
          </div>

          <button className="bg-white text-[#2f4131] px-8 py-3 rounded-2xl font-black text-sm shadow-lg hover:shadow-white/10 transition-shadow">
            RESERVAR CUPO
          </button>
        </div>
      </div>
    );
  }

  // Standard Banner 
  return (
    <div 
      className="mx-4 my-8 rounded-[2rem] overflow-hidden relative shadow-lg min-h-[160px] flex items-center"
      style={{ backgroundColor: item.bg_color || '#2f4131' }}
    >
      {item.image_url && (
        <div className="absolute inset-0 pointer-events-none">
          <img src={item.image_url} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
      )}
      
      <div className="relative p-7 w-full">
        <div className="max-w-[70%]">
          <h3 className="text-xl font-black text-white leading-tight mb-2 drop-shadow-sm">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="text-sm text-white/90 font-medium mb-5 line-clamp-2 leading-relaxed">
              {item.subtitle}
            </p>
          )}
          
          <button 
            onClick={handleAction}
            className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-[#2f4131] px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-white transition-colors"
          >
            {item.cta_text || 'Ver más'}
            <Icon icon="heroicons:arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
