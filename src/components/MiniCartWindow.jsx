import React from "react";
import { formatCOP } from "@/utils/money";
import { getItemUnit } from "@/context/CartContext";
import { Icon } from "@iconify-icon/react";

export default function MiniCartWindow({ items = [], total = 0, onCheckout, onClose }) {
  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-0 right-0 w-[350px] glass-premium rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-[80] pointer-events-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
          <Icon icon="solar:cart-check-bold" className="text-orange-400 text-lg" />
          Tu Pedido
        </h3>
      </div>

      {/* Items List */}
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-4 py-2">
        {items.map((item, idx) => {
          const unit = getItemUnit(item);
          return (
            <div 
              key={item.cartId || idx} 
              className="py-3 flex items-start gap-3 border-b border-white/5 last:border-0"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Icon icon="solar:camera-minimalistic-bold" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-[13px] font-semibold text-white/90 truncate">
                    {item.name}
                  </h4>
                  <span className="text-[12px] font-bold text-white tabular-nums">
                    {formatCOP(unit * item.qty)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                    x{item.qty}
                  </span>
                  {item.variant && (
                    <span className="text-[11px] text-white/40 truncate italic">
                      {item.variant}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Total */}
      <div className="p-5 bg-white/5 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Total estimado</span>
          <span className="text-white font-black text-lg tabular-nums">
            {formatCOP(total)}
          </span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-stone-100 transition-all active:scale-[0.98] shadow-lg shadow-black/20"
        >
          <span>Abrir Carrito</span>
          <Icon icon="solar:arrow-right-bold" />
        </button>
        
        <p className="text-[10px] text-center text-white/30 mt-3 flex items-center justify-center gap-1.5 uppercase font-medium tracking-tight">
          <Icon icon="solar:lock-bold" className="text-[11px]" />
          Pago Seguro & Encriptado
        </p>
      </div>
    </div>
  );
}
