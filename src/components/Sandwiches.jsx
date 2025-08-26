import { useState, useEffect, useMemo } from "react";
import ProductSection from "./ProductSection";
import { matchesQuery } from "../utils/strings";
import { sandwichItems, sandwichPriceByItem } from "../data/menuItems";

export default function Sandwiches({ query, onCount, onQuickView }) {
  const [size, setSize] = useState("clasico");
  const sizes = [
    { id: "clasico", label: "Clásico (100 g de proteína)" },
    { id: "grande", label: "Grande (300 g de proteína)" },
  ];
  const priceByItem = sandwichPriceByItem || {};
  const items = sandwichItems || [];

  const filtered = useMemo(
    () =>
      items.filter((it) =>
        matchesQuery({ title: it.name, description: it.desc }, query)
      ),
    [items, query]
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
    return mapping?.unico
      ? "Precio único"
      : size === "clasico"
      ? "Clásico"
      : "Grande";
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
        <div className="rounded-xl bg-white ring-1 ring-black/5 p-3 space-y-2">
          <div className="text-sm font-medium">Elige tamaño</div>
          <div className="flex gap-2">
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className={[
                  "px-3 py-1.5 rounded-full ring-1 ring-neutral-200 text-sm",
                  size === s.id
                    ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
                    : "bg-white text-neutral-700",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-600">
            Clásico: 100 g de proteína · Grande: 300 g de proteína. *Algunos sándwiches tienen precio único.
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

