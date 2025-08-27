// src/components/ColdDrinksSection.jsx
import React, { useEffect, useMemo } from "react";
import ProductSection from "./ProductSection";
import * as menu from "@/data/menuItems";

// Devuelve el primer array no vacío de los candidatos (string = clave en menu)
function pickArray(...candidates) {
  for (const c of candidates) {
    const arr = typeof c === "string" ? menu[c] : c;
    if (Array.isArray(arr) && arr.length > 0) return arr;
  }
  return [];
}

export default function ColdDrinksSection({ query, onCount, onQuickView }) {

  const groupsRaw = [
    { title: "Gaseosas y Sodas",            items: pickArray("sodas", "gaseosas") },
    { title: "Jugos y otras bebidas frías", items: pickArray("otherDrinks", "jugos", "bebidasFrias", "bebidasfrias") },
    { title: "Limonadas",                    items: pickArray("lemonades", "limonadas") },
    { title: "Aguas",                        items: pickArray("waters", "aguas") },
    { title: "Frappés",                      items: pickArray("frappes", "frappesCold") },
  ];

  const groups = useMemo(
    () => groupsRaw.filter(g => Array.isArray(g.items) && g.items.length > 0),
    [groupsRaw]
  );

  // Si hay un único grupo, ProductSection acepta [{ items }] sin subtítulo
  const finalGroups = useMemo(() => {
    if (groups.length > 1) return groups;
    if (groups.length === 1) return [{ items: groups[0].items }];
    return [];
  }, [groups]);

  // Reportar conteo bruto
  useEffect(() => {
    const total = groups.reduce((acc, g) => acc + g.items.length, 0);
    onCount?.(total);
    if (import.meta.env.DEV) {
      console.debug("[bebidasfrias] groups:", groups.map(g => ({ title: g.title, n: g.items.length })));
    }
  }, [groups, onCount]);

  return (
    <div className="transition-all duration-500 ease-out opacity-100 translate-y-0">
      <ProductSection
        id="bebidasfrias"
        title="Bebidas frías"
        query={query}
        groups={finalGroups}
        onCount={onCount}
        onQuickView={onQuickView}
        alwaysShow={true}          // 👈 fuerza render aunque count sea 0
        includeUnavailable={true}  // 👈 muestra incluso si available === false
      />
    </div>
  );
}
