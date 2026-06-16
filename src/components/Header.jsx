import React, { useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react";
import { Info, ShoppingBag } from "lucide-react";
import { getTableId } from "@/utils/table";
import { useMenuData } from "../context/MenuDataContext";
import { useAuth } from "../context/AuthContext";
import { safeStorage as localStorage } from "../utils/safeStorage";

export default function Header({ onCartOpen, onGuideOpen, cartCount = 0, currentHash = "" }) {
  const [table, setTable] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { restaurantSettings } = useMenuData();
  const { activeBrand } = useAuth();

  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";
  const logoUrl = restaurantSettings?.logo_url || activeBrand?.logo_url;
  const primaryColor = restaurantSettings?.primary_color || "#BFAE78";

  useEffect(() => {
    try {
      const t = getTableId();
      if (t) setTable(t);
      const orderId = localStorage.getItem("aa_active_order");
      if (orderId) setActiveOrderId(orderId);
    } catch {}

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "inicio", label: "Inicio", hash: "#inicio" },
    { id: "menu", label: "Menú", hash: "#menu" },
    { id: "experiencias", label: "Experiencias", hash: "#experiencias" },
  ];

  const getActiveTab = () => {
    if (currentHash === "#menu") return "menu";
    if (currentHash === "#experiencias") return "experiencias";
    if (!currentHash || currentHash === "" || currentHash === "#" || currentHash === "#inicio") return "inicio";
    return "inicio";
  };

  const activeTabId = getActiveTab();

  return (
    <>
      <style>{`
        .header-glass {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(22px) saturate(160%);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.72);
          box-shadow: 0 18px 45px rgba(20, 20, 20, 0.08);
        }
        .header-glass-scrolled {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(26px) saturate(170%);
          -webkit-backdrop-filter: blur(26px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.86);
          box-shadow: 0 16px 38px rgba(20, 20, 20, 0.1);
        }
      `}</style>

      <nav
        className={`fixed left-1/2 z-50 hidden -translate-x-1/2 items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:grid md:grid-cols-[1fr_auto_1fr] ${
          isScrolled
            ? "top-2 w-[94%] rounded-full px-4 py-2 md:top-4 md:w-[min(calc(100%-48px),1180px)] md:rounded-[1.35rem] md:px-5 md:py-2.5 header-glass-scrolled"
            : "top-3 w-[96%] rounded-full px-4 py-2.5 md:top-4 md:w-[min(calc(100%-48px),1180px)] md:rounded-[1.5rem] md:px-5 md:py-3 header-glass"
        }`}
      >
        <div className="flex min-w-0 items-center justify-self-start">
          <a href="#inicio" className="group flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/70 ring-1 ring-black/5 md:h-10 md:w-10">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="h-full w-full object-contain p-1.5 transition-transform group-hover:scale-105"
                  style={{ filter: "brightness(0) saturate(100%)" }}
                />
              ) : (
                <span className="text-sm font-black uppercase" style={{ color: primaryColor }}>
                  {brandName.slice(0, 2)}
                </span>
              )}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="max-w-[170px] truncate text-sm font-black leading-tight text-[#1A1A1A]">{brandName}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/35">Menú digital</p>
            </div>
          </a>
        </div>

        <div className="hidden items-center gap-7 md:flex md:justify-self-center">
          {navLinks.map((link) => {
            const isActive = activeTabId === link.id;
            return (
              <a
                key={link.id}
                href={link.hash}
                className={`relative py-2 text-[13px] font-extrabold transition-colors duration-300 ${
                  isActive ? "text-[#1A1A1A]" : "text-[#1A1A1A]/45 hover:text-[#1A1A1A]"
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 h-0.5 w-full rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </a>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-1.5 justify-self-end md:gap-2">
          {table && (
            <span
              className="hidden items-center gap-1.5 rounded-full bg-black/[0.035] px-3 py-2 text-[11px] font-black sm:inline-flex"
              style={{ color: primaryColor }}
            >
              <Icon icon="mdi:table-chair" className="text-[13px]" />
              Mesa {table}
            </span>
          )}

          {activeOrderId && (
            <button
              type="button"
              onClick={() => {
                window.location.href = `#order/${activeOrderId}`;
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-white transition-transform active:scale-95"
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 24px ${primaryColor}33` }}
            >
              <ShoppingBag size={14} />
              <span className="hidden text-[11px] font-black md:inline">Mi pedido</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGuideOpen}
            aria-label="Información"
            className="group flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/45 transition-colors hover:bg-white"
          >
            <Info size={17} className="text-[#1A1A1A]/55 group-hover:text-[#1A1A1A]" />
          </button>

          <button
            type="button"
            onClick={onCartOpen}
            aria-label="Abrir carrito"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/45 transition-colors hover:bg-white"
          >
            <ShoppingBag size={18} className="text-[#1A1A1A]/65" />
            {cartCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
