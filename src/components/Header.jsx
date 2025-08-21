// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { getTableId } from "../utils/table";
import CategoryBar from "./CategoryBar";
import GuideModal from "./GuideModal";
import DietaryGuide from "./DietaryGuide";

export default function Header() {
  const table = getTableId();
  const [openGuide, setOpenGuide] = useState(false);

  // Calcula altura de la barra del carrito si existe y la expone en --aa-cartbar-h
  useEffect(() => {
    const el = document.querySelector("[data-aa-cartbar]");
    const setVar = (h) =>
      document.documentElement.style.setProperty("--aa-cartbar-h", `${h || 0}px`);
    if (!el) {
      setVar(0);
      return;
    }
    const ro = new ResizeObserver(() => setVar(el.offsetHeight));
    ro.observe(el);
    setVar(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <header className="mb-6">
        {/* Logo centrado y sin fondo */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/logoalto.png"
            alt="Alto Andino Delicatessen"
            className="h-20 sm:h-24 md:h-28 mx-auto object-contain drop-shadow-sm"
          />
          <p className="text-[11px] sm:text-xs text-neutral-600">
            Ingredientes locales y de temporada · Pet Friendly
          </p>

          {/* ✅ Chip con la mesa (si existe en la URL o guardada) */}
          {table && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
              Mesa {table}
            </span>
          )}
        </div>

        {/* Línea sutil y datos */}
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <p className="text-center text-xs sm:text-sm text-neutral-700">
            Carrera 15 # 1 – 111, San Pablo
          </p>
        </div>
      </header>

      <CategoryBar />

      <button
        onClick={() => setOpenGuide(true)}
        aria-label="Guía dietaria y alérgenos"
        title="Guía dietaria y alérgenos"
        id="aa-guide-fab"
        className="fixed right-4 z-[60] px-4 h-10 rounded-full bg-[#2f4131] text-white shadow-lg ring-1 ring-black/5 hover:scale-105 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--aa-cartbar-h, 0px) + 1rem)" }}
      >
        Alérgenos
      </button>

      <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
        <DietaryGuide />
      </GuideModal>
    </>
  );
}
