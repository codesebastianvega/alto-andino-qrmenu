import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { matchesQuery } from "../utils/strings";
import Section from "./Section";
import ProductCard from "./ProductCard";

export default function ProductSection({
  title,
  query,
  groups = [],
  onCount,
  onQuickView,
}) {
  const { addItem } = useCart();

  const filteredGroups = groups.map((g) => ({
    title: g.title,
    items: (g.items || []).filter((it) =>
      matchesQuery({ title: it.name, description: it.desc }, query)
    ),
  }));

  const count = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);

  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  if (!count) return null;

  return (
    <Section title={title} count={count}>
      <div>
        {filteredGroups.map((g, idx) =>
          g.items.length ? (
            <div key={g.title || idx}>
              {g.title && (
                <h3
                  className={`${
                    idx === 0 ? "" : "mt-5 "
                  }text-sm font-semibold text-[#2f4131] mb-2`}
                >
                  {g.title}
                </h3>
              )}
              <div className="grid grid-cols-2 gap-3">
                {g.items.map((it) => (
                  <ProductCard
                    key={it.id || it.name}
                    item={it}
                    onAdd={addItem}
                    onQuickView={onQuickView}
                  />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </Section>
  );
}

