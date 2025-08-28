import { useState, useEffect, useMemo } from "react";
import ProductSection from "./ProductSection";
import { matchesQuery } from "@/utils/strings";
import { sandwichItems } from "@/data/menuItems";
import { SANDWICH_PRICE_BY_ITEM } from "@/config/prices";

export default function Sandwiches({ query, onCount, onQuickView }) {
  const [size, setSize] = useState("clasico");
  const sizes = [
    { id: "clasico", label: "Clásico (100 g de proteína)" },
    { id: "grande", label: "Grande (300 g de proteína)" },
  ];
  const priceByItem = SANDWICH_PRICE_BY_ITEM || {};
  const items = sandwichItems || [];

  const filtered = useMemo(
    () => items.filter((it) => matchesQuery({ title: it.name, description: it.desc }, query)),
    [items, query],
  );

  useEffect(() => {
    onCount?.(filtered.length);
  }, [filtered.length, onCount]);

  if (!filtered.length) return null;

  const priceFor = (key) => {
    const p = priceByItem[key] || {};
    if (p.unico != null) return p.unico;
    return p[size];
  };

  const sizeLabel = (key) => {
    const mapping = priceByItem[key] || {};
    return mapping.unico != null ? "Precio único" : size === "clasico" ? "Clásico" : "Grande";
  };

  return (
    <ProductSection
      id="sandwiches"
      title="Sándwiches"
      query={query}
      items={filtered}
      onCount={onCount}
      onQuickView={onQuickView}
      renderHeader={() => (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#2f4131] to-[#355242] p-3 ring-1 ring-black/10 shadow-sm sm:p-4">
          <div className="text-xs font-medium text-white/85">Elige tamaño</div>
          <div
            className="mt-2 flex snap-x snap-mandatory flex-nowrap items-center gap-2 overflow-x-auto px-3 scroll-px-3 scrollbar-none"
            role="tablist"
            aria-label="Tamaños de sándwich"
          >
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className={[
                  "snap-center rounded-lg px-4 py-2 text-[14px] sm:text-[15px] font-semibold leading-snug ring-1 transition-colors duration-150 backdrop-blur-md grid place-items-center",
                  size === s.id
                    ? "bg-white/60 text-emerald-900 ring-white/60 shadow"
                    : "bg-white/15 text-white ring-white/30 hover:bg-white/25",
                ].join(" ")}
              >
                <span className="block max-w-[24ch] sm:max-w-[28ch] text-center leading-snug whitespace-normal break-words line-clamp-2">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      mapItem={(it) => {
        const price = priceFor(it.key);
        const label = sizeLabel(it.key);
        return {
          ...it,
          id: `sandwich:${it.key}`,
          name: `${it.name} (${label})`,
          price,
        };
      }}
    />
  );
}
