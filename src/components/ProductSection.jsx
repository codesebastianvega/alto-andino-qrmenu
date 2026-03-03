// src/components/ProductSection.jsx
import React, { useMemo, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import Section from "./Section";
import ProductCard from "./ProductCard";
import { matchesQuery } from "@/utils/strings";

// Normaliza strings para comparar (ignora acentos y mayúsculas)
function norm(s = "") {
  return String(s)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ProductSection({
  id,
  title,
  query,
  items = [],
  groups = null, // [{ title?, items: [...] }, ...]
  onCount,
  onQuickView,
  renderHeader,
  mapItem, // opcional: transformar item antes de render
  alwaysShow = false, // forzar render aunque count sea 0
  includeUnavailable = true, // mostrar aunque available === false
  renderAfter,
  countValue,
  variant = "standard", // standard, simple-list, grid, wide-grid
}) {
  const { addItem } = useCart();

  const filterItems = (arr = []) =>
    arr.filter((item) => {
      const okQuery = matchesQuery(
        {
          ...item,
          title: item.title ?? item.name,
          description: item.description ?? item.desc,
        },
        query,
      );
      if (!okQuery) return false;
      if (includeUnavailable) return true;
      return item?.available !== false;
    });

  const grouped = useMemo(() => {
    if (!groups) return null;
    return groups.map((g) => ({
      title: g?.title ?? "",
      items: filterItems(g?.items || []),
    }));
  }, [groups, query, includeUnavailable]);

  const filtered = useMemo(() => {
    if (groups) return [];
    return filterItems(items);
  }, [items, groups, query, includeUnavailable]);

  const count = useMemo(() => {
    if (grouped) return grouped.reduce((acc, g) => acc + g.items.length, 0);
    return filtered.length;
  }, [grouped, filtered]);

  // Reporta el conteo al padre sin hacer setState durante el render
  useEffect(() => {
    if (typeof onCount === "function") {
      onCount(count);
    }
  }, [count, onCount]);

  // Si no hay productos visibles y no queremos forzar, no renderizamos
  if (!count && !alwaysShow) return null;

  const displayCount = countValue ?? count;

  const headerNode =
    typeof renderHeader === "function"
      ? (
          <div className="mb-3 sm:mb-4">{renderHeader({ hasResults: count > 0 })}</div>
        )
      : null;

  const defaultEmpty = (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
      {query ? "No hay resultados para tu búsqueda." : "Pronto verás nuestros productos aquí."}
    </div>
  );

  const emptyNode =
    typeof renderEmpty === "function"
      ? renderEmpty({ hasResults: count > 0 })
      : defaultEmpty;

  const afterNode =
    typeof renderAfter === "function"
      ? renderAfter({ hasResults: count > 0 })
      : null;

  const renderProducts = (arr, keySeed = 0) => {
    let gridClasses = "grid gap-3 sm:gap-4";
    let cardVariant = "standard";

    if (variant === "grid") {
      gridClasses += " grid-cols-2 lg:grid-cols-3";
    } else if (variant === "wide-grid") {
      gridClasses += " grid-cols-1 sm:grid-cols-2";
      cardVariant = "wide";
    } else if (variant === "simple-list") {
      gridClasses += " grid-cols-1";
      cardVariant = "compact";
    } else {
      gridClasses += " grid-cols-1 sm:grid-cols-2";
    }

    return (
      <div className={gridClasses}>
        {arr.map((item, i) => {
          const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
          return (
            <ProductCard
              key={safeItem?.id || `${keySeed}-${i}`}
              item={safeItem}
              variant={cardVariant}
              onAdd={(payload) => addItem(payload)}
              onQuickView={onQuickView}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Section id={`section-${id}`} title={title} count={displayCount}>
      {headerNode}

      {count
        ? grouped
          ? grouped.map((g, idx) =>
              g.items.length ? (
                <div key={g.title || idx} className={idx === 0 ? "" : "mt-6"}>
                  {/* Evita duplicar subtítulo si coincide con el título de sección */}
                  {g.title && norm(g.title) !== norm(title) && (
                    <h3 className="mb-2 text-sm font-semibold text-[#2f4131]">{g.title}</h3>
                  )}
                  {renderProducts(g.items, idx * 100)}
                </div>
              ) : null
            )
          : renderProducts(filtered)
        : alwaysShow
        ? emptyNode
        : null}

      {afterNode}
    </Section>
  );
}
