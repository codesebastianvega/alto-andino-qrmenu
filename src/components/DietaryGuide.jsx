import React, { useMemo } from "react";
import { useMenuData } from "./../context/MenuDataContext";

export default function DietaryGuide() {
  const { allergens = [], getAllProducts } = useMenuData();

  const categories = useMemo(() => {
    // Get all unique tags actually used in products
    const allProducts = getAllProducts ? getAllProducts() : [];
    const usedTags = new Set();
    allProducts.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(tag => usedTags.add(tag));
      }
    });

    // Filter allergens list to only include used tags
    const activeAllergens = allergens.filter(a => usedTags.has(a.name));

    const diets = activeAllergens.filter(a => a.type === 'diet');
    const allergic = activeAllergens.filter(a => a.type !== 'diet');
    return { diets, allergic, hasActive: activeAllergens.length > 0 };
  }, [allergens, getAllProducts]);

  if (!categories.hasActive) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
      <h2 className="mb-4 text-base font-semibold text-[#2f4131] border-b border-[#2f4131]/10 pb-2">
        Guía dietaria y alérgenos
      </h2>
      
      {categories.diets.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#2f4131]/40">
            Opciones Dietarias
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.diets.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-lg border border-[#2f4131]/10 bg-white px-2.5 py-1.5 text-xs shadow-sm"
              >
                <span className="text-base leading-none">{m.emoji || "🌿"}</span>
                <span className="font-medium text-[#2f4131]/80">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {categories.allergic.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#2f4131]/40">
            Información de Alérgenos
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.allergic.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-lg border border-[#2f4131]/10 bg-white px-2.5 py-1.5 text-xs shadow-sm"
              >
                <span className="text-base leading-none">{m.emoji || "🚫"}</span>
                <span className="font-medium text-[#2f4131]/80">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#2f4131]/5 p-3">
        <span className="text-sm">ℹ️</span>
        <p className="text-[11px] leading-relaxed text-[#2f4131]/70">
          Si tienes alergias severas, por favor infórmanos. Nuestras preparaciones se realizan en áreas compartidas y podrían contener trazas no intencionadas.
        </p>
      </div>
    </div>
  );
}