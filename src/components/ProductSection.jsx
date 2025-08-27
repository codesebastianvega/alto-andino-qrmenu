// src/components/ProductSection.jsx
import React, { useMemo } from "react";
import Section from "./Section";
import ProductCard from "./ProductCard";

// Normaliza strings para comparar (ignora acentos y mayúsculas)
function norm(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Búsqueda básica por nombre/desc
function matchesQuery(item, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item?.name?.toLowerCase().includes(q) ||
    item?.description?.toLowerCase().includes(q) ||
    item?.desc?.toLowerCase().includes(q)
  );
}

export default function ProductSection({
  id,
  title,
  query,
  items = [],
  groups = null,              // [{ title?, items: [...] }, ...]
  onCount,
  onQuickView,
  renderHeader,
  mapItem,                    // opcional: transformar item antes de render
  alwaysShow = false,         // 👈 NUEVO: forzar render aunque count sea 0
  includeUnavailable = true,  // 👈 NUEVO: mostrar aunque available === false
}) {
  const filterItems = (arr = []) =>
    arr.filter((item) => {
      const okQuery = matchesQuery(item, query);
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

  // reportar conteo bruto al padre (si lo usa)
  if (typeof onCount === "function") {
    // Nota: onCount debe ser idempotente; React puede invocar más de una vez en dev
    // Deja así para simplicidad; si prefieres, muévelo a un useEffect.
    onCount(count);
  }

  // Si no hay productos visibles y no queremos forzar, no renderizamos
  if (!count && !alwaysShow) return null;

  // Empty state si se fuerza render sin resultados
  if (!count && alwaysShow) {
    return (
      <Section id={`section-${id}`} title={title}>
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {arr.map((item, i) => {
        const safeItem = typeof mapItem === "function" ? mapItem(item) : item;
        return (
          <ProductCard
            key={safeItem?.id || `${keySeed}-${i}`}
            item={safeItem}
            onQuickView={onQuickView}
          />
        );
      })}
    </div>
  );

  return (
    <Section id={`section-${id}`} title={title}>
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
