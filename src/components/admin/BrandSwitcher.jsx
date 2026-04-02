import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Store, Coffee, Cake, Zap, ShoppingBag, Grid, Check, Plus } from 'lucide-react';

const BUSINESS_TYPE_ICON = {
  restaurant:   Store,
  cafe:         Coffee,
  bakery:       Cake,
  dark_kitchen: Zap,
  store:        ShoppingBag,
  other:        Grid,
};

function BrandAvatar({ brand, size = 28 }) {
  const Icon = BUSINESS_TYPE_ICON[brand?.business_type] || Store;
  if (brand?.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt={brand.name}
        style={{ width: size, height: size }}
        className="rounded-lg object-cover shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-[#2D6A4F]/20 flex items-center justify-center shrink-0"
    >
      <Icon size={size * 0.55} className="text-[#7db87a]" />
    </div>
  );
}

export default function BrandSwitcher() {
  const { activeBrand, ownedBrands, switchBrand } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!activeBrand) return null;

  const otherBrands = ownedBrands.filter(b => b.id !== activeBrand.id);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
          open
            ? 'bg-white/10 border-white/20'
            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
        }`}
      >
        <BrandAvatar brand={activeBrand} size={22} />
        <span className="text-sm font-medium text-white max-w-[120px] truncate">
          {activeBrand.name}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[240px] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: '#161616' }}
        >
          {/* Current brand */}
          <div className="px-3 py-2 border-b border-white/5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Administrando ahora
            </p>
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-[#7db87a]/10">
              <BrandAvatar brand={activeBrand} size={30} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{activeBrand.name}</p>
                <p className="text-[11px] text-gray-500 capitalize">{activeBrand.business_type || 'negocio'}</p>
              </div>
              <Check size={14} className="text-[#7db87a] shrink-0" />
            </div>
          </div>

          {/* Other brands */}
          {otherBrands.length > 0 && (
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Otros locales
              </p>
              <div className="space-y-1">
                {otherBrands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => { switchBrand(brand); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                  >
                    <BrandAvatar brand={brand} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 group-hover:text-white truncate transition-colors">
                        {brand.name}
                      </p>
                      <p className="text-[11px] text-gray-600 capitalize">{brand.business_type || 'negocio'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add new brand */}
          <div className="px-3 py-2">
            <a
              href="#registro"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-200 text-sm"
            >
              <div className="w-7 h-7 rounded-lg border border-dashed border-white/20 flex items-center justify-center">
                <Plus size={12} />
              </div>
              Agregar nuevo local
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
