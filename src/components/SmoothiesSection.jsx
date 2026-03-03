import React, { useEffect, useRef, useState, useMemo } from "react";
import ProductSection from "./ProductSection";
import { useMenuData } from "../context/MenuDataContext";

export default function SmoothiesSection({ query, onCount, onQuickView, variant = "standard" }) {
  const menuData = useMenuData();
  const categories = menuData?.categories || [];
  const getProductsByCategory = menuData?.getProductsByCategory || (() => []);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  const products = getProductsByCategory('smoothies');

  const groups = useMemo(() => {
    const config = categories.find(c => c.slug === 'smoothies')?.visibility_config || {};
    const definedSubs = config.subcategories || [];
    
    // Group by subcategory
    const grouped = {};
    products.forEach(p => {
      const sub = p.subcategory || 'Otros';
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push(p);
    });

    // Sort groups according to definedSubs if available, otherwise alpha
    const subsToRender = definedSubs.length > 0 
      ? definedSubs.filter(s => grouped[s])
      : Object.keys(grouped).sort();

    // Add 'Otros' at the end if it exists and wasn't in definedSubs
    if (grouped['Otros'] && !subsToRender.includes('Otros')) {
      subsToRender.push('Otros');
    }

    // Also pick up any subcategories not in definedSubs just in case
    Object.keys(grouped).forEach(k => {
      if (!subsToRender.includes(k)) subsToRender.push(k);
    });

    return subsToRender.map(title => ({
      title,
      items: grouped[title]
    }));
  }, [products, categories]);

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
        variant={variant === "smoothies" ? "standard" : variant}
      />
    </div>
  );
}