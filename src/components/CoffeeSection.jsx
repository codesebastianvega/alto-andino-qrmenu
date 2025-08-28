import React from "react";
import ProductSection from "./ProductSection";
import { coffees, infusions, moreInfusions, teasAndChai } from "@/data/menuItems";

export default function CoffeeSection({ query, onCount, onQuickView }) {
  const groups = [];
  if (Array.isArray(coffees) && coffees.length) {
    groups.push({ title: "Cafés", items: coffees });
  }
    const teas = (Array.isArray(teasAndChai) ? teasAndChai : []).map((t) => {
      const base = { ...t };
      if (base.id === "te-negro") base.desc = "Infusión de té negro.";
      if (base.id === "te-verde") base.desc = "Infusión de té verde.";
      if (base.id === "inf-chai") base.desc = "Blend especiado. Puede ser infusión o con leche (Chai Latte).";
      if (base.id === "matcha-lulo") base.desc = "Matcha con lulo.";
      return base;
    });
  if (teas.length) {
    groups.push({ title: "Té y Chai", items: teas });
  }
  const baseInf = (Array.isArray(infusions) ? infusions : []).filter((it) => it?.id !== "inf-chai");
    const extras = (Array.isArray(moreInfusions) ? moreInfusions : [])
      .filter((it) => it?.id !== "inf-frutos-andinos")
      .map((it) => {
        const base = { ...it };
        if (base.id === "inf-yerbabuena-manzanilla") base.desc = "Infusión de yerbabuena y manzanilla.";
        if (base.id === "inf-super-blend-azul") base.desc = "Con vitamina B3; manzanilla, canela y cidrón. Sabor a lavanda y coco.";
        if (base.id === "inf-super-blend-amarillo") base.desc = "Con probióticos (Bacillus coagulans). Sabor a pitaya.";
        return base;
      });
    const baseInfClean = baseInf.map((it) => ({ ...it }));
    const allInf = [...baseInfClean, ...extras];
  if (allInf.length) {
    groups.push({ title: "Infusiones & Tés", items: allInf });
  }
  const finalGroups = groups.length > 1 ? groups : groups.map(({ items }) => ({ items }));

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
