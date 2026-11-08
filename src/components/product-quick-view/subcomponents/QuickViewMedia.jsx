import React from "react";
import AAImage from "@/components/ui/AAImage";

export default function QuickViewMedia({
  image,
  title,
  isOutOfStock,
  staggerStyle
}) {
  return (
    <div className="w-full h-44 sm:h-52 md:h-full md:w-5/12 lg:w-1/2 flex-shrink-0 relative bg-neutral-100">
      <AAImage
        src={image}
        alt={title || "Producto"}
        className={`w-full h-full object-cover ${isOutOfStock ? "grayscale contrast-90 brightness-95" : ""}`}
        style={staggerStyle}
        fallback={
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-300">
            <span className="text-6xl mb-2">🍽</span>
            <span className="text-xs font-semibold uppercase tracking-widest opacity-50">Sin imagen</span>
          </div>
        }
      />
      {isOutOfStock && (
        <div className="absolute inset-0 bg-neutral-900/35 backdrop-grayscale flex items-center justify-center z-10 pointer-events-none">
          <span className="bg-neutral-900/85 backdrop-blur-md text-white font-extrabold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <span>🚫</span>
            <span>Agotado por hoy</span>
          </span>
        </div>
      )}
      {/* Desktop subtle gradient overlay */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10 pointer-events-none mix-blend-multiply" />
      {/* Mobile subtle gradient overlay */}
      <div className="md:hidden absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
