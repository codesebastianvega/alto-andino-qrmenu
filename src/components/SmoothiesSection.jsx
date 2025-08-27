import React, { useEffect, useRef, useState } from "react";
import ProductSection from "./ProductSection";
import { smoothies, funcionales as functionalSmoothies } from "@/data/menuItems";

export default function SmoothiesSection({ query, onCount, onQuickView }) {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  const groups = [];
  if (Array.isArray(smoothies) && smoothies.length) {
    groups.push({ title: "Smoothies", items: smoothies });
  }
  if (Array.isArray(functionalSmoothies) && functionalSmoothies.length) {
    groups.push({ title: "Funcionales", items: functionalSmoothies });
  }
  const finalGroups = groups.length > 1 ? groups : groups.map(({ items }) => ({ items }));

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
        id="smoothies"
        title="Smoothies & Funcionales"
        query={query}
        groups={finalGroups}
        onCount={onCount}
        onQuickView={onQuickView}
      />
    </div>
  );
}