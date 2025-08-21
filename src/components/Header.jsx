// src/components/Header.jsx
import React, { useState } from "react";
import { getTableId } from "../utils/table";
import CategoryBar from "./CategoryBar";
import GuideModal from "./GuideModal";
import DietaryGuide from "./DietaryGuide";

export default function Header() {
  const table = getTableId();
  const [openGuide, setOpenGuide] = useState(false);


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
          <p className="text-center sm:text-left text-xs sm:text-sm text-neutral-700">

            Carrera 15 # 1 – 111, San Pablo
          </p>
        </div>
      </header>

      <CategoryBar onOpenGuide={() => setOpenGuide(true)} />

      <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
        <DietaryGuide />
      </GuideModal>
    </>
  );
}
