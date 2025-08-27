import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { matchesQuery } from "../utils/strings";
import Section from "./Section";
import ProductCard from "./ProductCard";

export default function ProductSection({
  id,
  title,
  query,
  items = [],
  groups = null,
  onCount,
  onQuickView,
  renderHeader,
  mapItem,
}) {
  const { addItem } = useCart();

  const filterItems = (arr = []) =>
    arr.filter((it) => matchesQuery({ title: it.name, description: it.desc }, query));

  const grouped =
    groups && Array.isArray(groups)
      ? groups.map((g) => ({
          title: g.title,
          items: filterItems(g.items || []),
        }))
      : null;

  const filtered = grouped ? [] : filterItems(items);
  const count = grouped ? grouped.reduce((sum, g) => sum + g.items.length, 0) : filtered.length;

  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  if (!count) return null;

  const renderProducts = (arr, delayBase = 0) => (
    <div className="space-y-3">
      {arr.map((orig, idx) => {
        const it = mapItem ? mapItem(orig) : orig;
        return (
          <div
            key={(it.id || it.name) + "-wrapper"}
            style={{
              animationDelay: `${delayBase + idx * 60}ms`,
            }}
            className="animate-fadeUp"
          >
            <ProductCard
              key={(it.id || it.name) + "-card"}
              item={it}
              onAdd={addItem}
              onQuickView={onQuickView}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <Section id={`section-${id}`} title={title}>
      {typeof renderHeader === "function" && <div className="mb-2">{renderHeader()}</div>}
      {grouped
        ? grouped.map((g, idx) =>
            g.items.length ? (
              <div key={g.title || idx} className={idx === 0 ? "" : "mt-6"}>
                {g.title && <h3 className="mb-2 text-sm font-semibold text-[#2f4131]">{g.title}</h3>}
                {renderProducts(g.items, idx * 100)}
              </div>
            ) : null,
          )
        : renderProducts(filtered)}
    </Section>
  );
}