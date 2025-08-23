// src/components/Header.jsx
import { useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react";
import GuideModal from "./GuideModal";
import DietaryGuide from "./DietaryGuide";

export default function Header({ onCartOpen, onGuideOpen }) {
  const [greeting, setGreeting] = useState("Bienvenido 👋");
  const [localGuideOpen, setLocalGuideOpen] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mesa = params.get("mesa");
      if (mesa) {
        setGreeting(`Mesa ${mesa}`);
        return;
      }
      const name = window.localStorage?.getItem("aa_customerName");
      if (name) setGreeting(`Hola, ${name} 👋`);
    } catch {}
  }, []);

  const handleInfoClick = () => {
    if (onGuideOpen) onGuideOpen();
    else setLocalGuideOpen(true);
  };

  return (
    <header
      role="banner"
      className="h-16 bg-alto-beige shadow-sm border-b border-black/10 px-4 sm:px-5 flex items-center justify-between"
    >
      <img
        src="/logoalto.png"
        alt="Alto Andino"
        className="h-8 w-8 md:h-9 md:w-9 object-contain"
      />
      <p className="flex-1 text-center text-sm font-medium text-alto-text">
        {greeting}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInfoClick}
          aria-label="Información"
          className="h-9 w-9 grid place-items-center rounded-full border border-transparent hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
        >
          <Icon icon="material-symbols:info-outline" className="text-[22px]" />
        </button>
        <button
          type="button"
          onClick={() => onCartOpen?.()}
          aria-label="Carrito"
          className="h-9 w-9 grid place-items-center rounded-full border border-transparent hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
        >
          <Icon icon="mdi:cart-outline" className="text-[22px]" />
        </button>
      </div>

      {onGuideOpen ? null : (
        <GuideModal open={localGuideOpen} onClose={() => setLocalGuideOpen(false)}>
          <DietaryGuide />
        </GuideModal>
      )}
    </header>
  );
}

