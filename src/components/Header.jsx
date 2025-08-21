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
      <div className="max-w-3xl mx-auto px-5 sm:px-6 md:px-8 pt-3 pb-2 sm:pt-4 sm:pb-3">
        <header>
          {/* Logo centrado y sin fondo */}
          <div className="flex flex-col items-center text-center">
            <img
              src="/logoalto.png"
              alt="Alto Andino Delicatessen"
              className="mx-auto h-28 sm:h-32 md:h-36 w-auto object-contain drop-shadow-sm"
            />
            <p className="mt-2 mb-2 text-sm sm:text-[15px] text-neutral-600">
              Ingredientes locales y de temporada · Pet Friendly
            </p>

            {/* ✅ Chip con la mesa (si existe en la URL o guardada) */}
            {table && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
                Mesa {table}
              </span>
            )}
            <div className="my-2 h-px bg-black/10 w-full" />
          </div>
        </header>
      </div>

      <div className="mb-1">
        <CategoryBar onOpenGuide={() => setOpenGuide(true)} />
      </div>

        <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
          <DietaryGuide />
        </GuideModal>
    </>
  );
}
