import React from "react";
import ProductSection from "./ProductSection";
import { smoothies, funcionales as functionalSmoothies } from "../data/menuItems";

export default function SmoothiesSection({ query, onCount, onQuickView }) {
  const groups = [];
  if (Array.isArray(smoothies) && smoothies.length) {
    groups.push({ title: "Smoothies", items: smoothies });
  }
  if (Array.isArray(functionalSmoothies) && functionalSmoothies.length) {
    groups.push({ title: "Funcionales", items: functionalSmoothies });
  }
  const finalGroups =
    groups.length > 1 ? groups : groups.map(({ items }) => ({ items }));

  return (
    <ProductSection
      id="smoothies"
      title="Smoothies & Funcionales"
      query={query}
      groups={finalGroups}
      onCount={onCount}
      onQuickView={onQuickView}
    />
  );
}

