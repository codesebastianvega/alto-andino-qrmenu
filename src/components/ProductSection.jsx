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
  variant = "standard", // standard, simple-list, grid, wide-grid, bento-grid, masonry
  heroId = null, // ID of the product to show as hero/featured
  renderEmpty,
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
    let gridClasses = "grid gap-4 sm:gap-5";
    let cardVariant = "standard";

    if (variant === "grid") {
      gridClasses += " grid-cols-2 lg:grid-cols-3";
    } else if (variant === "grid-compact") {
      gridClasses += " grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
      cardVariant = "compact-grid";
    } else if (variant === "wide-grid") {
      gridClasses += " grid-cols-1 sm:grid-cols-2";
      cardVariant = "wide";
    } else if (variant === "simple-list") {
      gridClasses += " grid-cols-1";
      cardVariant = "compact";
    } else if (variant === "list-minimal") {
      gridClasses += " grid-cols-1";
      cardVariant = "minimal";
    } else if (variant === "horizontal-slider") {
      return (
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
          {arr.map((item, i) => {
            const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
            return (
              <div key={safeItem?.id || `${keySeed}-${i}`} className="min-w-[160px] max-w-[160px] sm:min-w-[200px] sm:max-w-[200px]">
                <ProductCard
                  item={safeItem}
                  variant="standard"
                  onAdd={(payload) => addItem(payload)}
                  onQuickView={onQuickView}
                />
              </div>
            );
          })}
        </div>
      );
    } else if (variant === "masonry") {
      return (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {arr.map((item, i) => {
            const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
            return (
              <div key={safeItem?.id || `${keySeed}-${i}`} className="break-inside-avoid mb-4">
                <ProductCard
                  item={safeItem}
                  variant="standard"
                  onAdd={(payload) => addItem(payload)}
                  onQuickView={onQuickView}
                />
              </div>
            );
          })}
        </div>
      );
    } else if (variant === "bento-grid") {
      gridClasses = "grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-min md:auto-rows-[180px]";
    } else {
      gridClasses += " grid-cols-2 lg:grid-cols-3";
    }

    return (
      <div className={gridClasses}>
        {arr.map((item, i) => {
          const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
          // Determine if this is the hero: either by ID or first item if it's Bento and we need a default
          const isHero = variant === "bento-grid" && (heroId ? safeItem.id === heroId : i === 0);
          
          return (
            <div 
              key={safeItem?.id || `${keySeed}-${i}`}
              className={isHero && variant === "bento-grid" ? "col-span-2 row-span-2" : ""}
            >
              <ProductCard
                item={safeItem}
                variant={cardVariant}
                isHero={isHero}
                onAdd={(payload) => addItem(payload)}
                onQuickView={onQuickView}
              />
            </div>
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
