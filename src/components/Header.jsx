import React from "react";
import { Icon } from "@iconify-icon/react";
import { motion } from "framer-motion";
import { getTableId } from "@/utils/table";


export default function Header({ onCartOpen, onGuideOpen, cartCount = 0, currentHash = '' }) {
  const [table, setTable] = React.useState("");
  const [activeOrderId, setActiveOrderId] = React.useState(null);

  React.useEffect(() => { 
    try { 
      const t = getTableId(); 
      if (t) setTable(t); 
      
      const orderId = localStorage.getItem("aa_active_order");
      if (orderId) setActiveOrderId(orderId);
    } catch {} 
  }, []);

  const navLinks = [
    { id: 'inicio', label: 'Inicio', hash: '#inicio' },
    { id: 'menu', label: 'Menú', hash: '#menu' },
    { id: 'experiencias', label: 'Experiencias', hash: '#experiencias' },
  ];

  const activeTabId = navLinks.find(t => currentHash === t.hash || (t.id === 'menu' && (currentHash === '' || currentHash === '#')) )?.id || 'menu';

  return (
    <motion.header
      role="banner"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 h-[64px] w-full border-b border-black/10 bg-[#243326] text-white shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-full max-w-5xl xl:max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-6 xl:gap-8">
          <h1 className="select-none text-[18px] font-semibold tracking-tight text-white md:text-xl">
            Alto Andino
          </h1>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.hash}
                className={`px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors ${
                  activeTabId === link.id 
                    ? 'bg-white/15 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="relative flex items-center gap-2">
          {table && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25" title={`Mesa ${table}`}>
              <Icon icon="mdi:table-chair" className="text-[14px]" />
              Mesa {table}
            </span>
          )}

          {activeOrderId && (
            <button
              type="button"
              onClick={() => window.location.href = `#order/${activeOrderId}`}
              className="group inline-flex items-center gap-2 h-9 px-3 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <Icon icon="heroicons:shopping-bag" className="text-white" />
              <span className="text-[12px] font-bold text-white hidden md:inline">Mi Pedido</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGuideOpen}
            aria-label="Información"
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
          >
            <Icon
              icon="material-symbols:info-outline"
              className="text-[22px] text-white opacity-90 group-hover:opacity-100"
            />
          </button>

          <a
            href="#perfil"
            aria-label="Perfil"
            className={`hidden md:inline-flex group h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 ${
              activeTabId === 'perfil' ? 'bg-white/15' : 'bg-white/10 hover:bg-white/15'
            }`}
          >
            <Icon
              icon="material-symbols:person-outline"
              className={`text-[22px] transition-opacity ${activeTabId === 'perfil' ? 'text-white opacity-100' : 'text-white opacity-90 group-hover:opacity-100'}`}
            />
          </a>

          <button
            type="button"
            onClick={onCartOpen}
            aria-label="Abrir carrito"
            className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
          >
            <Icon
              icon="mdi:cart-outline"
              className="text-[22px] text-white opacity-90 group-hover:opacity-100"
            />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white leading-tight text-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}


