// src/components/Header.jsx
import { useState } from "react";
import { Icon } from "@iconify-icon/react";
import GuideModal from "./GuideModal";
import DietaryGuide from "./DietaryGuide";

export default function Header({ onCartOpen, onGuideOpen }) {
  const [localGuideOpen, setLocalGuideOpen] = useState(false);

  const handleInfoClick = () => {
    if (onGuideOpen) onGuideOpen();
    else setLocalGuideOpen(true);
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 h-[64px] w-full bg-[#243326] text-white border-b border-black/10 shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-screen-md px-4 md:px-6 h-full flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          <h1
            className="text-[18px] md:text-lg font-semibold tracking-tight bg-gradient-to-r from-[#bfe0cf] via-[#8fbda9] to-[#6ea58e] bg-clip-text text-transparent select-none"
          >
            Alto Andino Zipaquirá
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInfoClick}
            aria-label="Información"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,.3)] group"
          >
            <Icon
              icon="material-symbols:info-outline"
              className="text-white text-[22px] opacity-90 group-hover:opacity-100"
            />
          </button>
          <button
            type="button"
            onClick={() => onCartOpen?.()}
            aria-label="Abrir carrito"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,.3)] group"
          >
            <Icon
              icon="mdi:cart-outline"
              className="text-white text-[22px] opacity-90 group-hover:opacity-100"
            />
          </button>
        </div>
      </div>

      {onGuideOpen ? null : (
        <GuideModal open={localGuideOpen} onClose={() => setLocalGuideOpen(false)}>
          <DietaryGuide />
        </GuideModal>
      )}
    </header>
  );
}

