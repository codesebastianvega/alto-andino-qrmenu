// src/components/Header.jsx
import React, { useState } from "react";
import { getTableId } from "../utils/table";
import CategoryBar from "./CategoryBar";
import FeaturedToday from "./FeaturedToday";
import GuideModal from "./GuideModal";
import DietaryGuide from "./DietaryGuide";

export default function Header() {
  const table = getTableId();
  const [openGuide, setOpenGuide] = useState(false);

  return (
    <>
      <header className="bg-[#F3EDE4] overflow-visible">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 md:px-8 pt-3 pb-2 sm:pt-4 sm:pb-3">
          {/* Logo centrado y sin fondo */}
          <div className="pt-3 sm:pt-4">
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
              <div className="mt-2 flex justify-center">
                <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs border border-neutral-300 bg-white text-neutral-800">
                  Mesa {table}
                </span>
              </div>
            )}
            <div className="my-2 h-px bg-black/10 w-full" />
          </div>
        </div>
        <CategoryBar onOpenGuide={() => setOpenGuide(true)} />
        <FeaturedToday />
      </header>

      <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
        <DietaryGuide />
      </GuideModal>
    </>
  );
}
