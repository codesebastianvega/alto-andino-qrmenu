import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Store,
  Coffee,
  Cake,
  Zap,
  ShoppingBag,
  Grid,
  Check,
  Plus,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';

// ── Iconos por tipo de negocio ───────────────────────────────────────────────
const BUSINESS_TYPE_ICON = {
  restaurant:   Store,
  cafe:         Coffee,
  bakery:       Cake,
  dark_kitchen: Zap,
  store:        ShoppingBag,
  other:        Grid,
};

// ── Avatar de marca ──────────────────────────────────────────────────────────
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
      className="rounded-lg bg-[#7db87a]/15 border border-[#7db87a]/20 flex items-center justify-center shrink-0"
    >
      <Icon size={size * 0.5} className="text-[#7db87a]" />
    </div>
  );
}

// ── BrandSwitcher ────────────────────────────────────────────────────────────
export default function BrandSwitcher() {
  const { activeBrand, ownedBrands, switchBrand } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!activeBrand) return null;

  const otherBrands = ownedBrands.filter((b) => b.id !== activeBrand.id);

  const handleSwitch = async (brand) => {
    setOpen(false);
    await switchBrand(brand);
    window.location.href = `/${brand.slug}/#admin`;
  };

  const handleGoToPortal = () => {
    setOpen(false);
    window.location.href = '/';
  };

  // Abre el GlobalPortal y dispara el modal de nueva marca vía query param
  const handleNewBrand = () => {
    setOpen(false);
    window.location.href = '/?new=1';
  };

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
          open
            ? 'bg-white/10 border-white/20 shadow-lg shadow-black/20'
            : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
        }`}
      >
        <BrandAvatar brand={activeBrand} size={22} />
        <span className="text-sm font-semibold text-white max-w-[110px] truncate">
          {activeBrand.name}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={13} className="text-white/40 group-hover:text-white/60 transition-colors" />
        </motion.div>
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-[260px] rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #181818 0%, #141414 100%)' }}
          >
            {/* Marca activa */}
            <div className="px-3 pt-3 pb-2">
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">
                Administrando ahora
              </p>
              <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-[#7db87a]/10 border border-[#7db87a]/15">
                <BrandAvatar brand={activeBrand} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate leading-tight">
                    {activeBrand.name}
                  </p>
                  <p className="text-[10px] text-white/40 capitalize mt-0.5">
                    {activeBrand.business_type || 'negocio'}
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#7db87a]/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[#7db87a]" />
                </div>
              </div>
            </div>

            {/* Otras marcas */}
            {otherBrands.length > 0 && (
              <div className="px-3 pb-2 border-t border-white/5 pt-2">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">
                  Otros locales
                </p>
                <div className="space-y-0.5">
                  {otherBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleSwitch(brand)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 active:bg-white/8 transition-colors text-left group"
                    >
                      <BrandAvatar brand={brand} size={28} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70 group-hover:text-white truncate transition-colors font-medium">
                          {brand.name}
                        </p>
                        <p className="text-[10px] text-white/30 capitalize">
                          {brand.business_type || 'negocio'}
                        </p>
                      </div>
                      <ArrowRight
                        size={13}
                        className="text-white/0 group-hover:text-white/40 transition-all group-hover:translate-x-0.5 shrink-0"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="border-t border-white/5 px-3 py-2 space-y-0.5">
              {/* Nueva marca → GlobalPortal con modal abierto */}
              <button
                onClick={handleNewBrand}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg border border-dashed border-white/15 group-hover:border-[#7db87a]/40 group-hover:bg-[#7db87a]/5 flex items-center justify-center transition-colors">
                  <Plus size={13} className="group-hover:text-[#7db87a] transition-colors" />
                </div>
                <span className="text-sm font-medium">Nueva marca</span>
              </button>

              {/* Ver todos los negocios → Portal */}
              <button
                onClick={handleGoToPortal}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/8 transition-colors">
                  <LayoutGrid size={13} />
                </div>
                <span className="text-sm font-medium">Ver todas las marcas</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
