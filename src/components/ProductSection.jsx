import { useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { matchesQuery } from "../utils/strings";
import Section from "./Section";
import ProductCard from "./ProductCard";

export default function ProductSection({
  id,
  title,
  query,
  items = [],
  groups,
  onCount,
  onQuickView,
}) {
  const { addItem } = useCart();

  const filteredItems = useMemo(
    () => (items || []).filter((it) =>
      matchesQuery({ title: it.name, description: it.desc }, query)
    ),
    [items, query]
  );

  const filteredGroups = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    return groups
      .map((g) => ({
        ...g,
        items: (g.items || []).filter((it) =>
          matchesQuery({ title: it.name, description: it.desc }, query)
        ),
      }))
      .filter(
        (g) =>
          matchesQuery({ title: g.title }, query) || (g.items && g.items.length > 0)
      );
  }, [groups, query]);

  const count = groups
    ? filteredGroups.reduce((acc, g) => acc + g.items.length, 0)
    : filteredItems.length;

  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  if (!count) return null;

  return (
    <Section id={`section-${id}`} title={title} count={count}>
      {groups ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filteredGroups.map((g) => (
            <div key={g.id || g.title}>
              {g.title && (
                <h3 className="text-sm font-semibold text-[#2f4131] mb-2">
                  {g.title}
                </h3>
              )}
              <ul className="space-y-3">
                {g.items.map((item) => (
                  <ProductCard
                    key={item.id || item.name}
                    item={item}
                    onAdd={addItem}
                    onQuickView={onQuickView}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredItems.map((item) => (
            <ProductCard
              key={item.id || item.name}
              item={item}
              onAdd={addItem}
              onQuickView={onQuickView}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}

