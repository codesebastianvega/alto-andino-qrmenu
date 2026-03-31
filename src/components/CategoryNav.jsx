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
      className="hide-scrollbar -mx-4 px-4 flex snap-x gap-2.5 overflow-x-auto py-3 pb-4"
      style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
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
              "flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-300 ease-out snap-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
              active
                ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20 scale-100"
                : "bg-white text-neutral-600 shadow-[0_2px_10px_rgb(0,0,0,0.03)] ring-1 ring-black/[0.04] hover:bg-neutral-50 hover:scale-[1.02]"
            )}
            role="tab"
            aria-selected={active}
          >
            <Icon
              icon={iconName}
              className={clsx("transition-colors", active ? "text-white" : "text-neutral-400")}
              style={{ fontSize: 22 }}
            />
            <span
              className={clsx(
                "block text-[15px] whitespace-nowrap tracking-tight",
                active ? "font-semibold text-white" : "font-medium text-neutral-600"
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
