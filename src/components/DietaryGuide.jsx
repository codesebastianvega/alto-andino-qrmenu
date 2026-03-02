import React from "react";
import { useMenuData } from "./../context/MenuDataContext";

export default function DietaryGuide() {
  const { allergens = [] } = useMenuData();

  // Fallback markers if no allergens in database
  const markers = allergens.length > 0 ? allergens.map(a => ({
    icon: a.emoji || "🏷️",
    label: a.name
  })) : [
    { icon: "🌿", label: "Veggie/Vegano" },
    { icon: "🌶️", label: "Picante" },
    { icon: "🐝", label: "Con miel" },
    { icon: "🚫", label: "Sin azúcar añadida" },
    { icon: "🌾", label: "Gluten" },
    { icon: "🥛", label: "Lácteos" },
    { icon: "🥚", label: "Huevo" },
    { icon: "🥜", label: "Frutos secos" },
    { icon: "🫘", label: "Soya" },
    { icon: "🐟", label: "Pescado/Mariscos" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
      <h2 className="mb-2 text-base font-semibold text-[#2f4131]">
        Guía dietaria y alérgenos
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {markers.map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-alto-warmwhite px-2 py-1 text-xs"
          >
            <span className="text-base leading-none">{m.icon}</span>
            <span className="text-neutral-700">{m.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-neutral-600">
        Si tienes alergias, avísanos. Algunas preparaciones comparten área; podría haber trazas.
      </p>
    </div>
  );
}