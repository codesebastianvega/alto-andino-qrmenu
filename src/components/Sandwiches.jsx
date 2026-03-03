import { useEffect, useMemo } from "react";
import ProductSection from "./ProductSection";
import { matchesQuery } from "@/utils/strings";
import { useMenuData } from "@/context/MenuDataContext";

export default function Sandwiches({ query, onCount, onQuickView, variant = "standard" }) {
  const { getProductsByCategory, getModifiers } = useMenuData();

  const products = getProductsByCategory('sandwiches');

  // Filter groups
  const traditional = useMemo(
    () =>
      products.filter((item) =>
        item.tags.includes('tradicional') &&
        matchesQuery({ title: item.name, description: item.desc }, query)
      ),
    [products, query]
  );

  const artisanal = useMemo(
    () =>
      products.filter(
        (item) => item.tags.includes('artesanal') && matchesQuery({ title: item.name, description: item.desc }, query)
      ),
    [products, query]
  );

  const specials = useMemo(
    () =>
      products.filter(
        (item) => item.tags.includes('especial') && matchesQuery({ title: item.name, description: item.desc }, query)
      ),
    [products, query]
  );

  const totalCount = traditional.length + artisanal.length + specials.length;

  useEffect(() => {
    onCount?.(totalCount);
  }, [totalCount, onCount]);

  if (!totalCount) return null;

  return (
    <div className="space-y-6">
      {traditional.length > 0 && (
        <ProductSection
          id="sandwiches"
          title="SANDWICHES TRADICIONALES"
          query={query}
          items={traditional}
          includeUnavailable
          onQuickView={onQuickView}
          variant={variant}
        />
      )}

      {artisanal.length > 0 && (
        <ProductSection
          id="sandwiches-artesanales"
          title="SANDWICHES ARTESANALES"
          query={query}
          items={artisanal}
          includeUnavailable
          onQuickView={onQuickView}
          variant={variant}
        />
      )}

      {specials.length > 0 && (
        <ProductSection
          id="sandwiches-especiales"
          title="SANDWICHES ESPECIALES"
          query={query}
          items={specials}
          includeUnavailable
          onQuickView={onQuickView}
          variant={variant}
        />
      )}
    </div>
  );
}
