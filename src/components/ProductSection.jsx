// src/components/ProductSection.jsx
import React, { useMemo, useEffect, useState, useRef } from "react";
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

import { useMenuData } from "@/context/MenuDataContext";

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
  allergens: propAllergens,
  hideTitle = false,
}) {
  const { addItem } = useCart();
  const { allergens: contextAllergens = [] } = useMenuData() || {};
  const allergens = propAllergens || contextAllergens;

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
          <div className="-mx-5 sm:-mx-6 md:-mx-8 lg:mx-0">{renderHeader({ hasResults: count > 0 })}</div>
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
      const scrollRef = useRef(null);
      const [scrollProgress, setScrollProgress] = useState(0);

      const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        if (maxScroll > 0) {
          setScrollProgress(scrollLeft / maxScroll);
        }
      };

      // Total dots: let's say 1 dot per item, capped at a reasonable number
      const dotCount = Math.min(arr.length, 8);

      return (
        <div className="relative group/slider">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-4 pb-6 pt-4 no-scrollbar -mx-5 px-5 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:mx-0 lg:px-0 scroll-smooth snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-6 md:scroll-pl-8"
          >
            {arr.map((item, i) => {
              const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
              return (
                <div 
                  key={safeItem?.id || `${keySeed}-${i}`} 
                  className="min-w-[200px] max-w-[200px] sm:min-w-[240px] sm:max-w-[240px] snap-start [content-visibility:auto] [contain-intrinsic-size:240px]"
                >
                  <ProductCard
                    item={safeItem}
                    variant="standard"
                    onAdd={(payload) => addItem(payload)}
                    onQuickView={onQuickView}
                    allergens={allergens}
                  />
                </div>
              );
            })}
          </div>
          
          {/* Indicador de scroll (puntos) */}
          {arr.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-2">
              {Array.from({ length: dotCount }).map((_, i) => {
                // Map current progress to which dot should be active
                const isActive = Math.round(scrollProgress * (dotCount - 1)) === i;
                return (
                  <div 
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isActive ? "w-4 bg-[#2f4131]" : "w-1.5 bg-[#2f4131]/20"
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    } else if (variant === "masonry") {
      return (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {arr.map((item, i) => {
            const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
            return (
              <div key={safeItem?.id || `${keySeed}-${i}`} className="break-inside-avoid mb-4 [content-visibility:auto] [contain-intrinsic-size:300px]">
                <ProductCard
                  item={safeItem}
                  variant="standard"
                  onAdd={(payload) => addItem(payload)}
                  onQuickView={onQuickView}
                  allergens={allergens}
                />
              </div>
            );
          })}
        </div>
      );
    } else if (variant === "bento-grid") {
      gridClasses = "grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-auto";
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
              className={`${isHero && variant === "bento-grid" ? "col-span-2 row-span-2" : ""} [content-visibility:auto] [contain-intrinsic-size:200px]`}
            >
              <ProductCard
                item={safeItem}
                variant={cardVariant}
                isHero={isHero}
                onAdd={(payload) => addItem(payload)}
                onQuickView={onQuickView}
                allergens={allergens}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Section id={`section-${id}`} title={title} count={displayCount} hideTitle={hideTitle}>
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
