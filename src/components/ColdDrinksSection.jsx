// src/components/ColdDrinksSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductSection from "./ProductSection";
import { useMenuData } from "@/context/MenuDataContext";

export default function ColdDrinksSection({ query, onCount, onQuickView, variant = "standard" }) {
  const { getProductsByCategory, categories } = useMenuData();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  const products = getProductsByCategory('bebidasfrias');

  const groups = useMemo(() => {
    const config = categories.find(c => c.slug === 'bebidasfrias')?.visibility_config || {};
    const definedSubs = config.subcategories || [];

    // Group by subcategory
    const grouped = {};
    products.forEach(p => {
      const sub = p.subcategory || 'Otras bebidas';
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push(p);
    });

    // Sort groups according to definedSubs if available, otherwise alpha
    const subsToRender = definedSubs.length > 0
      ? definedSubs.filter(s => grouped[s])
      : Object.keys(grouped).sort();

    // Add 'Otras bebidas' at the end if it exists and wasn't in definedSubs
    if (grouped['Otras bebidas'] && !subsToRender.includes('Otras bebidas')) {
      subsToRender.push('Otras bebidas');
    }

    // Also pick up any subcategories not in definedSubs
    Object.keys(grouped).forEach(k => {
      if (!subsToRender.includes(k)) subsToRender.push(k);
    });

    return subsToRender.map(title => ({
      title,
      items: grouped[title]
    }));
  }, [products, categories]);

  useEffect(() => {
    const total = products.length;
    onCount?.(total);
  }, [products, onCount]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <ProductSection
        id="bebidasfrias"
        title="Bebidas frías"
        query={query}
        groups={groups.length > 1 ? groups : undefined}
        items={groups.length <= 1 ? products : undefined}
        onCount={onCount}
        onQuickView={onQuickView}
        variant={variant}
        alwaysShow={!String(query || "").trim()}
        includeUnavailable={true}
      />
    </div>
  );
}
