import React from "react";
import ProductSection from "./ProductSection";
import { coffees, infusions } from "../data/menuItems";

export default function CoffeeSection({ query, onCount, onQuickView }) {
  const groups = [];
  if (Array.isArray(coffees) && coffees.length) {
    groups.push({ title: "Cafés", items: coffees });
  }
  if (Array.isArray(infusions) && infusions.length) {
    groups.push({ title: "Infusiones & Tés", items: infusions });
  }
  const finalGroups =
    groups.length > 1 ? groups : groups.map(({ items }) => ({ items }));

  return (
    <ProductSection
      id="cafe"
      title="Café de especialidad"
      query={query}
      groups={finalGroups}
      onCount={onCount}
      onQuickView={onQuickView}
    />
  );
}

