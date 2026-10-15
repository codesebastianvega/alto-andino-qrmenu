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
import { Icon } from "@iconify-icon/react";

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
          <div className="mb-2">{renderHeader({ hasResults: count > 0 })}</div>
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
    let gridClasses = "grid gap-4 sm:gap-5 items-stretch";
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
      const [canScrollLeft, setCanScrollLeft] = useState(false);
      const [canScrollRight, setCanScrollRight] = useState(arr.length > 1);

      const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        if (maxScroll > 0) {
          setScrollProgress(scrollLeft / maxScroll);
          setCanScrollLeft(scrollLeft > 10);
          setCanScrollRight(scrollLeft < maxScroll - 10);
        }
      };

      const scrollByDirection = (direction) => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.clientWidth * 0.75;
        scrollRef.current.scrollBy({
          left: direction === "left" ? -amount : amount,
          behavior: "smooth"
        });
      };

      const dotCount = Math.min(arr.length, 6);

      return (
        <div className="relative group/slider" data-no-swipe="true" data-slider="true">
          {/* Subtle swipe hint pill */}
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <span>Desliza para ver más</span>
              <Icon icon="solar:arrow-right-linear" className="text-xs animate-pulse text-neutral-500" />
            </span>
          </div>

          <div className="relative">
            {/* Desktop Navigation Arrows */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByDirection("left")}
                aria-label="Anterior"
                className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-white hover:scale-110 transition-all"
              >
                <Icon icon="solar:alt-arrow-left-bold" className="text-sm" />
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollByDirection("right")}
                aria-label="Siguiente"
                className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-white hover:scale-110 transition-all"
              >
                <Icon icon="solar:alt-arrow-right-bold" className="text-sm" />
              </button>
            )}

            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              data-no-swipe="true"
              data-slider="true"
              className="flex overflow-x-auto gap-3.5 pb-4 pt-1 no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:mx-0 lg:px-0 scroll-smooth snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-6 md:scroll-pl-8 overscroll-x-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {arr.map((item, i) => {
                const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
                return (
                  <div 
                    key={safeItem?.id || `${keySeed}-${i}`} 
                    className="w-[72vw] min-w-[210px] max-w-[250px] sm:w-[230px] sm:min-w-[230px] snap-start shrink-0 [content-visibility:auto] [contain-intrinsic-size:240px]"
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
          </div>
          
          {/* Indicador de scroll (puntos) */}
          {arr.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-2">
              {Array.from({ length: dotCount }).map((_, i) => {
                const isActive = Math.round(scrollProgress * (dotCount - 1)) === i;
                return (
                  <div 
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isActive ? "w-5 bg-[#2f4131]" : "w-1.5 bg-[#2f4131]/20"
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
      gridClasses = "grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch";
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
              className={`${isHero && variant === "bento-grid" ? "col-span-2" : "col-span-1"} h-full flex flex-col [content-visibility:auto] [contain-intrinsic-size:200px]`}
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

  // ── Handle Spotlight Split (1 Hero on the left, 4 on the right in 2x2 grid) ──
  if (variant === "spotlight-split" && count > 0) {
    const allAvailableItems = grouped ? grouped.flatMap(g => g.items) : filtered;
    const heroItem = allAvailableItems.find(it => it.is_daily_special || it.is_bento_del_dia)
      || (heroId ? allAvailableItems.find(it => it.id === heroId) : null)
      || allAvailableItems[0];
    const otherItems = allAvailableItems.filter(it => it.id !== heroItem?.id);

    const heroGroup = grouped?.find(g => g.items.some(it => it.id === heroItem?.id));
    const otherGroup = grouped?.find(g => g.title !== heroGroup?.title);
    const heroTitle = heroGroup?.title || (heroItem?.daily_special_label || (heroItem?.is_bento_del_dia ? "Plato del Día" : "Plato Destacado"));
    const otherTitle = otherGroup?.title || (otherItems.length > 0 ? "Carta & Especialidades" : "");

    const hasPromoHero = allAvailableItems.some(it => it.is_bento_del_dia || it.is_daily_special);
    const isWeekendBento = allAvailableItems.some(it => it.category_id === 'b0000c01-0000-4000-a000-000000000001') && !hasPromoHero;

    // If it's a weekend bento without a promo Bento del Día, gracefully render all items in a standard grid
    if (isWeekendBento && !heroId) {
      return (
        <Section id={`section-${id}`} title={title} count={displayCount} hideTitle={hideTitle}>
          {headerNode}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
            {allAvailableItems.map((item, idx) => (
              <div key={item.id || idx} className="h-full flex flex-col">
                <ProductCard
                  item={item}
                  variant="standard"
                  onAdd={(payload) => addItem(payload)}
                  onQuickView={onQuickView}
                  allergens={allergens}
                />
              </div>
            ))}
          </div>
          {afterNode}
        </Section>
      );
    }

    return (
      <Section id={`section-${id}`} title={title} count={displayCount} hideTitle={hideTitle}>
        {headerNode}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* Left Column: Hero Spotlight Bento */}
          <div className="lg:col-span-5 flex flex-col">
            {heroTitle && norm(heroTitle) !== norm(title) && (
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#2f4131] flex items-center gap-1.5">
                  {heroItem?.is_bento_del_dia && <span>🔥</span>}
                  <span>{heroTitle}</span>
                </h3>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <ProductCard
                item={heroItem}
                variant="hero-spotlight"
                isHero={true}
                onAdd={(payload) => addItem(payload)}
                onQuickView={onQuickView}
                allergens={allergens}
              />
            </div>
          </div>

          {/* Right Column: 2x2 Grid with remaining items */}
          {otherItems.length > 0 && (
            <div className="lg:col-span-7 flex flex-col">
              {otherTitle && norm(otherTitle) !== norm(title) && (
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#2f4131]">
                    {otherTitle}
                  </h3>
                  <span className="text-[11px] font-semibold text-neutral-400">
                    {otherItems.length} opciones
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 items-stretch">
                {otherItems.map((item, idx) => (
                  <div key={item.id || idx} className="h-full flex flex-col">
                    <ProductCard
                      item={item}
                      variant="standard"
                      onAdd={(payload) => addItem(payload)}
                      onQuickView={onQuickView}
                      allergens={allergens}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {afterNode}
      </Section>
    );
  }

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
