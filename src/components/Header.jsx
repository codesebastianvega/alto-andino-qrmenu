import React from "react";
import { Icon } from "@iconify-icon/react";
import { motion } from "framer-motion";
import { getTableId } from "@/utils/table";


export default function Header({ onCartOpen, onGuideOpen, cartCount = 0 }) {
  const [table, setTable] = React.useState("");
  React.useEffect(() => { try { const t = getTableId(); if (t) setTable(t); } catch {} }, []);
  return (
    <motion.header
      role="banner"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 h-[64px] w-full border-b border-black/10 bg-[#243326] text-white shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-full max-w-screen-md items-center justify-between gap-3 px-4 md:px-6">
        <h1 className="flex-1 select-none text-[18px] font-semibold tracking-tight text-white md:text-lg">
          Alto Andino Zipaquirá
        </h1>

        <div className="relative flex items-center gap-2">
          {table && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25" title={`Mesa ${table}`}>
              <Icon icon="mdi:table-chair" className="text-[14px]" />
              Mesa {table}
            </span>
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


