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
    const p = priceByItem[key];
    if (p.unico) return p.unico;
    return p[size];
  };

  const sizeLabel = (key) => {
    const mapping = priceByItem[key];
    return mapping?.unico ? "Precio único" : size === "clasico" ? "Clásico" : "Grande";
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
        <div className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-black/5">
          <div className="text-sm font-medium">Elige tamaño</div>
          <div className="flex gap-2">
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className={[
                  "glass-btn rounded-full px-3 py-1.5 text-sm ring-1 ring-white/30 transition-all duration-200 backdrop-blur-md",
                  size === s.id
                    ? "bg-white/30 text-emerald-900 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-600">
            Clásico: 100 g de proteína · Grande: 300 g de proteína. *Algunos sándwiches tienen
            precio único.
          </p>
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