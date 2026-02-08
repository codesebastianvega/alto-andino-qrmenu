import { useEffect, useMemo, useState } from "react";
import ProductSection from "./ProductSection";
import { matchesQuery } from "@/utils/strings";
import { formatCOP } from "@/utils/money";
import { getStockFlags } from "@/utils/stock";
import AdditionsAccordion from "./AdditionsAccordion";
import { useMenuData } from "@/context/MenuDataContext";

const SIZE_OPTIONS = [
  { id: "clasico", label: "Clásico", helper: "100 g de proteína" },
  { id: "grande", label: "Grande", helper: "300 g de proteína" },
];

function buildBreadOptions(list = []) {
  // Always ensure we have at least one option if list is empty, but list should come from DB
  if (!list.length) return [];
  
  return list.map((item) => ({
    id: item.id,
    name: item.name,
    helper: item.price > 0 ? `+${formatCOP(item.price)}` : "Incluido",
    surcharge: item.price || 0,
    description: item.description,
    flags: getStockFlags(item.id), // We can use item.id for stock check if we sync stock
  }));
}

export default function Sandwiches({ query, onCount, onQuickView }) {
  const { getProductsByCategory, getModifiers } = useMenuData();
  const [size, setSize] = useState("clasico");
  
  // Bread logic
  const dbBreadOptions = getModifiers('sandwich-bread');
  const breadOptions = useMemo(() => buildBreadOptions(dbBreadOptions), [dbBreadOptions]);
  
  const [bread, setBread] = useState(null);

  // Set default bread once loaded
  useEffect(() => {
    if (!bread && breadOptions.length > 0) {
      const firstAvailable = breadOptions.find((opt) => !opt.flags.isOut) || breadOptions[0];
      setBread(firstAvailable?.id);
    }
  }, [bread, breadOptions]);

  const activeBread = useMemo(() => 
    breadOptions.find((opt) => opt.id === bread),
    [breadOptions, bread]
  );

  const products = getProductsByCategory('sandwiches');

  // Filter groups
  const traditional = useMemo(
    () =>
      products.filter((item) =>
        item.tags.includes('tradicional') &&
        matchesQuery({ title: item.name, description: item.desc }, query)
      ),
    [products, query]
  );

  const artisanalBase = useMemo(
    () =>
      products.filter(
        (item) => item.tags.includes('artesanal') && matchesQuery({ title: item.name, description: item.desc }, query)
      ),
    [products, query]
  );

  const specialsBase = useMemo(
    () =>
      products.filter(
        (item) => item.tags.includes('especial') && matchesQuery({ title: item.name, description: item.desc }, query)
      ),
    [products, query]
  );

  // Helpers for pricing
  const getProductPrice = (item, currentSize) => {
    if (!item.variants || !item.variants.length) return item.price;
    const variant = item.variants.find(v => v.name.toLowerCase() === currentSize.toLowerCase());
    return variant ? variant.price : item.price;
  };

  const breadLabel = activeBread?.name || "Pan";
  const breadExtra = activeBread?.surcharge || 0;

  const artisanal = useMemo(
    () =>
      artisanalBase.map((item) => {
        // Find variant for current size to get helper text if needed? 
        // For now just price.
        const basePrice = getProductPrice(item, size);
        return {
          ...item,
          id: item.id, // Keep original ID (UUID)
          name: `${item.name} (${size === 'clasico' ? 'Clásico' : 'Grande'} · ${breadLabel})`,
          price: basePrice + breadExtra,
        };
      }),
    [artisanalBase, size, breadLabel, breadExtra]
  );

  const specials = useMemo(
    () =>
      specialsBase.map((item) => ({
        ...item,
        price: getProductPrice(item, size), // Specials might specify unique price or variants
      })),
    [specialsBase, size]
  );

  const dbExtras = getModifiers('sandwich-extras');
  const extras = useMemo(
    () =>
      dbExtras.filter((item) => matchesQuery({ title: item.name }, query)),
    [dbExtras, query]
  );

  const totalCount = traditional.length + artisanal.length + specials.length + extras.length;

  useEffect(() => {
    onCount?.(totalCount);
  }, [totalCount, onCount]);

  if (!totalCount) return null;

  return (
    <div className="space-y-6">
      {traditional.length > 0 && (
        <ProductSection
          id="sandwiches"
          title="SANDWICHES TRADICIONALES"
          query={query}
          items={traditional}
          includeUnavailable
          onQuickView={onQuickView}
        />
      )}

      {artisanal.length > 0 && (
        <ProductSection
          id="sandwiches-artesanales"
          title="SANDWICHES ARTESANALES"
          query={query}
          items={artisanal}
          includeUnavailable
          onQuickView={onQuickView}
          renderHeader={() => (
            <div className="space-y-4 rounded-2xl bg-[#f5f3f0] p-4 text-[#2f4131] ring-1 ring-[#e7dcc9] mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]">Tamaño</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((option) => {
                    const active = size === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSize(option.id)}
                        aria-pressed={active}
                        className={`group rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                          active
                            ? "bg-[#2f4131] text-white shadow-sm"
                            : "bg-white text-[#2f4131] ring-1 ring-[#2f4131]/20 hover:bg-[#eaf2ec]"
                        }`}
                      >
                        <span className="block leading-tight">{option.label}</span>
                        <span className={`block text-[11px] font-normal ${active ? "text-white/80" : "text-[#2f4131]/70"}`}>
                          {option.helper}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {breadOptions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]">Tipo de pan</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {breadOptions.map((option) => {
                      const active = bread === option.id;
                      const { isOut, isSoon } = option.flags || {};
                      const disabled = isOut;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => !disabled && setBread(option.id)}
                          aria-pressed={active}
                          disabled={disabled}
                          className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
                            active
                              ? "border-[#2f4131] bg-white shadow"
                              : "border-[#2f4131]/15 bg-white/90 hover:border-[#2f4131]/30 hover:shadow-sm"
                          } ${disabled ? "opacity-40" : ""}`}
                        >
                          <span className="text-sm font-semibold text-[#2f4131]">{option.name}</span>
                          {option.description && (
                            <span className="text-[11px] text-[#2f4131]/70">{option.description}</span>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-[11px] font-medium">
                            <span className={active ? "text-[#2f4131]" : "text-[#2f4131]/70"}>
                              {option.helper}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white/80 px-3 py-2 text-xs text-[#2f4131]/80 ring-1 ring-[#e7dcc9]">
                Resumen: {size === "clasico" ? "Clásico" : "Grande"} · {breadLabel}
                {breadExtra ? ` · +${formatCOP(breadExtra)}` : " · Pan incluido"}
              </div>
            </div>
          )}
        />
      )}

      {specials.length > 0 && (
        <ProductSection
          id="sandwiches-especiales"
          title="SANDWICHES ESPECIALES"
          query={query}
          items={specials}
          includeUnavailable
          onQuickView={onQuickView}
        />
      )}

      {extras.length > 0 && (
        <AdditionsAccordion
          items={extras}
          idPrefix="sandwich-extras"
          title="Adiciones"
        />
      )}
    </div>
  );
}
