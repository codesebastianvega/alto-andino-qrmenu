import React, { useEffect, useRef, useState, useMemo } from "react";
import ProductSection from "./ProductSection";
import { useMenuData } from "@/context/MenuDataContext";

export default function SmoothiesSection({ query, onCount, onQuickView }) {
  const { getProductsByCategory } = useMenuData();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  const products = getProductsByCategory('smoothies');

  const groups = useMemo(() => {
    const traditional = products.filter(p => !(p.tags || []).includes('funcional'));
    const functional = products.filter(p => (p.tags || []).includes('funcional'));
    
    const result = [];
    if (traditional.length) result.push({ title: "Smoothies", items: traditional });
    if (functional.length) result.push({ title: "Funcionales", items: functional });
    
    return result;
  }, [products]);

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

  // If no products at all (before filtering), we might want to hide or show empty? 
  // ProductSection handles empty via query.
  
  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <ProductSection
        id="smoothies"
        title="Smoothies & Funcionales"
        query={query}
        groups={groups}
        onCount={onCount}
        onQuickView={onQuickView}
      />
    </div>
  );
}