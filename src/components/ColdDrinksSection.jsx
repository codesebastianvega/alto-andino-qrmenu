// src/components/ColdDrinksSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductSection from "./ProductSection";
import * as menu from "@/data/menuItems";

// Devuelve el primer array no vacío de los candidatos (string = clave de menu).
function pickArray(...candidates) {
  for (const c of candidates) {
    const arr = typeof c === "string" ? menu[c] : c;
    if (Array.isArray(arr) && arr.length > 0) return arr;
  }
  return [];
}

export default function ColdDrinksSection({ query, onCount, onQuickView }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  // Ajusta o añade claves según tu data real en src/data/menuItems.js
  const groupsRaw = [
    { title: "Gaseosas y Sodas",            items: pickArray("sodas", "gaseosas") },
    { title: "Jugos y otras bebidas frías", items: pickArray("otherDrinks", "jugos", "bebidasFrias", "bebidasfrias") },
    { title: "Limonadas",                    items: pickArray("lemonades", "limonadas") },
    { title: "Aguas",                        items: pickArray("waters", "aguas") },
    { title: "Frappés",                      items: pickArray("frappes", "frappesCold") },
  ];

  // Filtra grupos vacíos
  const groups = useMemo(
    () => groupsRaw.filter(g => Array.isArray(g.items) && g.items.length > 0),
    [groupsRaw]
  );

  // Si hay un solo grupo, ProductSection acepta [{ items }] sin título.
  const finalGroups = useMemo(() => {
    if (groups.length > 1) return groups;
    if (groups.length === 1) return [{ items: groups[0].items }];
    return []; // sin datos no rompe
  }, [groups]);

  // Reporta total de ítems al padre (para contadores o tabs)
  useEffect(() => {
    const total = groups.reduce((acc, g) => acc + g.items.length, 0);
    onCount?.(total);
  }, [groups, onCount]);

  // Fade-in al aparecer en viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        io.unobserve(el);
      }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <ProductSection
        id="bebidasfrias"            // 👈 importante: usamos este id
        title="Bebidas frías"
        query={query}
        groups={finalGroups}
        onCount={onCount}
        onQuickView={onQuickView}
      />
    </div>
  );
}
