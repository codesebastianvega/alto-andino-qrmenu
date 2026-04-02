import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { motion } from "framer-motion";
import { getTableId } from "@/utils/table";
import { Leaf, ShoppingBag, Search, User } from "lucide-react";
import { useMenuData } from "../context/MenuDataContext";
import { useAuth } from "../context/AuthContext";

export default function Header({ onCartOpen, onGuideOpen, cartCount = 0, currentHash = '' }) {
  const [table, setTable] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { restaurantSettings, activeBrandId } = useMenuData();
  const { activeBrand } = useAuth();

  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";
  const logoUrl = restaurantSettings?.logo_url;

  useEffect(() => {
    try {
      const t = getTableId();
      if (t) setTable(t);
      const orderId = localStorage.getItem("aa_active_order");
      if (orderId) setActiveOrderId(orderId);
    } catch {}

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'inicio', label: 'Inicio', hash: '#inicio' },
    { id: 'menu', label: 'Menú', hash: '#menu' },
    { id: 'experiencias', label: 'Experiencias', hash: '#experiencias' },
    { id: 'perfil', label: 'Perfil', hash: '#perfil' },
  ];

  // Determine which tab is active
  const getActiveTab = () => {
    if (currentHash === '#menu') return 'menu';
    if (currentHash === '#experiencias') return 'experiencias';
    if (currentHash === '#perfil') return 'perfil';
    if (!currentHash || currentHash === '' || currentHash === '#' || currentHash === '#inicio') return 'inicio';
    return 'inicio';
  };
  const activeTabId = getActiveTab();

  return (
    <>
      <style>{`
        .header-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }
        .header-glass-scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px) saturate(200%);
          -webkit-backdrop-filter: blur(24px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }
      `}</style>

      <nav
        className={`fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex justify-between items-center ${
          isScrolled
            ? 'top-2 md:top-3 left-1/2 -translate-x-1/2 w-[94%] md:w-[92%] max-w-4xl header-glass-scrolled rounded-full py-2 px-4 md:py-2.5 md:px-6'
            : 'top-3 md:top-5 left-1/2 -translate-x-1/2 w-[96%] md:w-[95%] max-w-7xl header-glass rounded-full py-2.5 px-4 md:py-3 md:px-8'
        }`}
      >
        {/* Logo + Nav */}
        <div className="flex items-center gap-3 md:gap-6">
          <a href="#inicio" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center">
              {restaurantSettings?.logo_url ? (
                <img src={logoUrl} alt={brandName} className="h-8 md:h-10 object-contain group-hover:scale-105 transition-transform" />
              ) : (
                <span className="text-xl font-black tracking-tighter text-brand-primary group-hover:scale-105 transition-transform inline-block">
                  {brandName}
                </span>
              )}
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.hash}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${
                  activeTabId === link.id
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-brand-primary/60 hover:text-brand-primary hover:bg-black/5'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mesa badge */}
          {table && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[11px] font-bold text-brand-primary">
              <Icon icon="mdi:table-chair" className="text-[13px]" />
              Mesa {table}
            </span>
          )}

          {/* Active order button */}
          {activeOrderId && (
            <button
              type="button"
              onClick={() => window.location.href = `#order/${activeOrderId}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-md shadow-orange-500/20"
            >
              <ShoppingBag size={14} />
              <span className="text-[11px] font-bold hidden md:inline">Mi Pedido</span>
            </button>
          )}

          {/* Info button */}
          <button
            type="button"
            onClick={onGuideOpen}
            aria-label="Información"
            className="group h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <Icon
              icon="material-symbols:info-outline"
              className="text-[18px] md:text-[20px] text-[#1A1A1A]/60 group-hover:text-[#1A1A1A]"
            />
          </button>

          {/* Cart button */}
          <button
            type="button"
            onClick={onCartOpen}
            aria-label="Abrir carrito"
            className="relative p-1.5 md:p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <ShoppingBag size={18} className="text-[#1A1A1A]/70 md:hidden" />
            <ShoppingBag size={20} className="text-[#1A1A1A]/70 hidden md:block" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#E6B05C] text-[#1A1A1A] text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Sign in / Profile */}
          <a
            href="#perfil"
            className={`hidden sm:flex items-center gap-2 pl-2.5 pr-4 py-1.5 rounded-full transition-all text-xs font-bold ${
              activeTabId === 'perfil'
                ? 'bg-brand-primary text-white shadow-md'
                : 'bg-brand-primary text-white hover:opacity-90 shadow-sm'
            }`}
          >
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <User size={10} className="text-white" />
            </div>
            <span>Mi Cuenta</span>
          </a>
        </div>
      </nav>
    </>
  );
}
