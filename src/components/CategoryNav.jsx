import React from "react";
import clsx from "clsx";
import { Icon } from "@iconify-icon/react";
import { categoryIcons } from "../data/categoryIcons";

function getIconDef(icon, id) {
  if (icon) return icon;
  const entry = categoryIcons[id];
  return typeof entry === "string" ? entry : entry?.icon;
}

export default function CategoryNav({ categories = [], activeId, onSelect }) {
  const railRef = React.useRef(null);

  const handleSelect = (cat, idx) => {
    onSelect?.(cat);
    // Scroll the selected button into view
    requestAnimationFrame(() => {
      railRef.current?.children?.[idx]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });
  };

  return (
    <div
      ref={railRef}
      className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto py-4 px-1 pb-6"
      role="tablist"
      aria-label="Categorías"
    >
      {categories.map((cat, idx) => {
        const active = activeId === cat.id;
        const iconName = getIconDef(cat.icon, cat.id) || "ph:squares-four";

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelect(cat, idx)}
            className={clsx(
              // Base size and layout
              "flex h-36 w-28 flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center transition-all duration-300 ease-in-out",
              "snap-center",
              // Glassmorphism base style
              "bg-white/60 backdrop-blur-md ring-1 ring-inset ring-white/30",
              // Text style
              "text-neutral-800",
              // Active state
              active && "scale-105 bg-white/80 shadow-lg shadow-[#2f4131]/40"
            )}
            role="tab"
            aria-selected={active}
          >
            <Icon
              icon={iconName}
              className={clsx(
                "h-8 w-8 md:h-9 md:w-9 transition-colors",
                active ? "text-[#2f4131]" : "text-neutral-700"
              )}
            />
            <span
              className={clsx(
                "block text-sm font-semibold leading-tight line-clamp-2",
                active && "text-[#2f4131]"
              )}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}