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

  // Empty state si se fuerza render sin resultados
  if (!count && alwaysShow) {
    return (
      <Section id={`section-${id}`} title={title} count={count}>
        {typeof renderHeader === "function" && (
          <div className="mb-2">{renderHeader()}</div>
        )}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
          {query ? "No hay resultados para tu búsqueda." : "Pronto verás nuestros productos aquí."}
        </div>
      </Section>
    );
  }

  const renderProducts = (arr, keySeed = 0) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
      {arr.map((item, i) => {
        const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
        return (
          <ProductCard
            key={safeItem?.id || `${keySeed}-${i}`}
            item={safeItem}
            onAdd={(payload) => addItem(payload)}
            onQuickView={onQuickView}
          />
        );
      })}
    </div>
  );

  return (
    <Section id={`section-${id}`} title={title} count={count}>
      {typeof renderHeader === "function" && (
        <div className="mb-2">{renderHeader()}</div>
      )}

      {grouped
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
        : renderProducts(filtered)}
    </Section>
  );
}

