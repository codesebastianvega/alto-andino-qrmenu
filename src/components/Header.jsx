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
      <div className="max-w-3xl mx-auto p-5 sm:p-6 md:p-8">
        <header className="mb-6">
          {/* Logo centrado y sin fondo */}
          <div className="pt-3 sm:pt-4">
            <img
              src="/logoalto.png"
              alt="Alto Andino Delicatessen"
              className="mx-auto h-28 sm:h-32 md:h-36 w-auto"
              decoding="async"
              loading="eager"
              fetchpriority="high"
            />
            <p className="mt-2 mb-3 text-center text-[11px] sm:text-xs text-neutral-600">
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
      </div>

        <CategoryBar onOpenGuide={() => setOpenGuide(true)} />
        <div className="h-2 sm:h-3" />

        <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
          <DietaryGuide />
        </GuideModal>
    </>
  );
}
