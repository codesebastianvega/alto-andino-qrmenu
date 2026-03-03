import React, { useMemo, useEffect } from "react";
import ProductSection from "./ProductSection";
import { useMenuData } from "@/context/MenuDataContext";
import { matchesQuery } from "@/utils/strings";

// Helper to filter by tag and query
const useFilteredProducts = (products, conditionFn, query) => {
  return useMemo(() => 
    products.filter(p => 
      conditionFn(p) && 
      matchesQuery({ title: p.name, description: p.desc }, query)
    ), [products, conditionFn, query]
  );
};

export default function CoffeeSection({ query, onCount, onQuickView, variant = "standard" }) {
  const { getProductsByCategory } = useMenuData();
  const products = getProductsByCategory('cafe');

  const coffees = useFilteredProducts(products, (p) => (p.tags || []).includes('cafe'), query);
  
  const teas = useFilteredProducts(products, (p) => 
    (p.tags || []).includes('te') || (p.tags || []).includes('chai'), 
    query
  );

  const infusions = useFilteredProducts(products, (p) => 
    (p.tags || []).includes('infusion'), 
    query
  );

  const totalCount = coffees.length + teas.length + infusions.length;

  useEffect(() => {
    onCount?.(totalCount);
  }, [totalCount, onCount]);

  if (totalCount === 0) return null;

  return (
    <div className="space-y-8">
      {coffees.length > 0 && (
        <ProductSection
          id="cafes"
          title="CAFÉS"
          items={coffees}
          onQuickView={onQuickView}
          variant={variant}
        />
      )}

      {teas.length > 0 && (
        <ProductSection
          id="te-chai"
          title="TÉ & CHAI"
          items={teas}
          onQuickView={onQuickView}
          variant={variant}
        />
      )}

      {infusions.length > 0 && (
        <ProductSection
          id="infusiones"
          title="INFUSIONES"
          items={infusions}
          onQuickView={onQuickView}
          variant={variant}
        />
      )}
    </div>
  );
}
