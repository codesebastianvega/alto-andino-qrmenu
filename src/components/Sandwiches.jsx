import { useEffect, useMemo, useState } from "react";
import ProductSection from "./ProductSection";
import { matchesQuery } from "@/utils/strings";
import { formatCOP } from "@/utils/money";
import {
  sandwichItems,
  sandwichTraditionals,
  sandwichAdditions,
} from "@/data/menuItems";
import { SANDWICH_PRICE_BY_ITEM } from "@/config/prices";
import { getStockFlags } from "@/utils/stock";

const SIZE_OPTIONS = [
  { id: "clasico", label: "Clasico", helper: "100 g de proteina" },
  { id: "grande", label: "Grande", helper: "300 g de proteina" },
];

function buildBreadOptions(list = []) {
  const base = [
    {
      id: "baguette",
      name: "Baguette artesanal",
      helper: "Incluido",
      surcharge: 0,
      flags: { isOut: false, isSoon: false },
    },
  ];

  const extras = list.map((item) => ({
    id: item.id,
    name: item.name,
    helper: `+${formatCOP(item.price || 0)}`,
    surcharge: item.price || 0,
    description: item.desc,
    flags: getStockFlags(item.id),
  }));

  return [...base, ...extras];
}

export default function Sandwiches({ query, onCount, onQuickView }) {
  const [size, setSize] = useState("clasico");
  const [bread, setBread] = useState("baguette");

  const breadOptions = useMemo(() => buildBreadOptions(sandwichAdditions), []);
  const firstAvailableBread = useMemo(
    () => breadOptions.find((opt) => !opt.flags.isOut) || breadOptions[0],
    [breadOptions],
  );

  useEffect(() => {
    const current = breadOptions.find((opt) => opt.id === bread);
    if (!current || current.flags.isOut) {
      if (firstAvailableBread) setBread(firstAvailableBread.id);
    }
  }, [bread, breadOptions, firstAvailableBread]);

  const activeBread = breadOptions.find((opt) => opt.id === bread) || firstAvailableBread;

  const priceByItem = SANDWICH_PRICE_BY_ITEM || {};

  const traditional = useMemo(
    () =>
      (sandwichTraditionals || []).filter((item) =>
        matchesQuery({ title: item.name, description: item.desc }, query),
      ),
    [query],
  );

  const artisanalBase = useMemo(
    () =>
      (sandwichItems || []).filter(
        (item) => item.group === "artesanal" && matchesQuery({ title: item.name, description: item.desc }, query),
      ),
    [query],
  );

  const specialsBase = useMemo(
    () =>
      (sandwichItems || []).filter(
        (item) => item.group === "especial" && matchesQuery({ title: item.name, description: item.desc }, query),
      ),
    [query],
  );

  const priceFor = (key) => {
    const entry = priceByItem[key] || {};
    if (entry.unico != null) return entry.unico;
    return entry[size];
  };

  const sizeLabel = (key) => {
    const entry = priceByItem[key] || {};
    if (entry.unico != null) return "Precio unico";
    return size === "clasico" ? "Clasico" : "Grande";
  };

  const breadLabel = activeBread?.name || "Baguette artesanal";
  const breadExtra = activeBread?.surcharge || 0;

  const artisanal = useMemo(
    () =>
      artisanalBase.map((item) => ({
        id: `sandwich:${item.key}`,
        name: `${item.name} (${sizeLabel(item.key)} · ${breadLabel})`,
        desc: item.desc,
        price: priceFor(item.key) + breadExtra,
      })),
    [artisanalBase, size, breadLabel, breadExtra],
  );

  const specials = useMemo(
    () =>
      specialsBase.map((item) => ({
        id: `sandwich:${item.key}`,
        name: item.name,
        desc: item.desc,
        price: priceFor(item.key),
      })),
    [specialsBase, size],
  );

  const totalCount = traditional.length + artisanal.length + specials.length;

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
            <div className="space-y-4 rounded-2xl bg-[#f5f3f0] p-4 text-[#2f4131] ring-1 ring-[#e7dcc9]">
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

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]">Tipo de pan</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {breadOptions.map((option) => {
                    const active = bread === option.id;
                    const { isOut, isSoon } = option.flags;
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
                          {isSoon && !disabled && (
                            <span className="rounded-full bg-amber-100 px-2 py-[1px] text-[10px] font-semibold text-amber-700">
                              Proximamente
                            </span>
                          )}
                          {disabled && (
                            <span className="rounded-full bg-neutral-200 px-2 py-[1px] text-[10px] font-semibold text-neutral-700">
                              No disponible
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-white/80 px-3 py-2 text-xs text-[#2f4131]/80 ring-1 ring-[#e7dcc9]">
                Resumen: {size === "clasico" ? "Clasico" : "Grande"} · {breadLabel}
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
    </div>
  );
}
