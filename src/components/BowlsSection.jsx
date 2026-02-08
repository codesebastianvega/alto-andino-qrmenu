import React, { lazy, Suspense, useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatCOP } from "@/utils/money";
import { matchesQuery } from "@/utils/strings";
import { PILL_XS, PILL_SM } from "./Buttons";
import { toast } from "./Toast";
import AAImage from "@/components/ui/AAImage";
import { getStockState, isUnavailable } from "@/utils/stock";
import { BOWL_BASE_PRICE } from "@/config/prices";
import ProductCard from "./ProductCard";
import { useMenuData } from "@/context/MenuDataContext";

const BowlBuilder = lazy(() => import("./BowlBuilder"));

// ← editar nombres y precios aquí
const BASE_PRICE = BOWL_BASE_PRICE;

export default function BowlsSection({ query, onCount, onQuickView, id }) {
  const { getProductsByCategory } = useMenuData();
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);

  const products = getProductsByCategory('bowls');
  const preBowl = products.length > 0 ? products[0] : null;

  const openBuilder = () => setOpen(true);

  const addPre = () => {
    if (!preBowl) return;
    addItem({
      productId: preBowl.id,
      name: preBowl.name,
      price: preBowl.price,
      options: preBowl.configOptions || {}, // Was 'options' in hardcoded file, but now likely in configOptions or just description?
      // Pre-built bowl usually has fixed ingredients in description, not selectable options in this context.
      // If we want to pass options, we'd need to parse them or store them. 
      // For now, simple add is fine.
    });
  };

  const show = preBowl && matchesQuery({ title: preBowl.name, description: preBowl.desc }, query);
  const count = show ? 1 : 0;

  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  // Always render the "Builder" banner if query matches "bowl" or is empty? 
  // Should the builder banner count as a result? 
  // If preBowl matches, we show banner AND card.
  // If query is "poke", preBowl matches.
  // If query is "personalizado", maybe match banner?
  // Current logic: if preBowl matches query, count=1.
  
  if (!count && !query) {
      // If loading or no products, but no query, maybe show banner?
      // For now, stick to original logic: if !preBowl return null.
      if (!preBowl) return null;
  }
  
  if (!count && query) return null;

  const st = preBowl ? getStockState(preBowl.id) : null;
  const unavailable = st === "out" || (preBowl && isUnavailable(preBowl));

  return (
    <div id={id} className="space-y-4">
      {/* CTA gigante (como otro “producto”) */}
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="relative h-36 overflow-hidden rounded-2xl bg-gradient-to-r from-[#2f4131] to-[#355242] ring-1 ring-black/10 sm:h-44 md:h-56">
          {/* ← editar clases y ruta de la imagen aquí */}
          <AAImage
            src="/poke1.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-[-6px] right-0 z-10 w-44 animate-[spin_40s_linear_infinite] object-contain drop-shadow-xl sm:right-2 sm:w-60 md:w-72"
          />
          <div className="absolute inset-0 grid grid-rows-[auto_1fr_auto] pb-16 pl-5 pr-40 pt-4 sm:pl-6 sm:pr-48 sm:pt-5">
            <div>
              <p className="text-xs font-medium text-white/85">Personaliza a tu gusto</p>
              <h3 className="text-xl font-semibold text-white sm:text-2xl">
                Armar bowl personalizado
              </h3>
              <p className="text-sm leading-snug text-white/90">
                1 base, 1 proteína, 4 toppings, 3 extras y 1 salsa
              </p>
            </div>
          </div>
          <div
            className={[
              "absolute right-3 top-3 z-20 rounded-full bg-white font-semibold text-[#2f4131]",
              "grid place-items-center whitespace-nowrap shadow-sm",
              PILL_XS,
              "sm:" + PILL_SM,
            ].join(" ")}
          >
            Desde {formatCOP(BASE_PRICE)}
          </div>
          <button
            type="button"
            onClick={openBuilder}
            aria-label="Armar bowl personalizado"
            className={[
              "absolute bottom-3 right-3 z-30 rounded-full bg-white font-semibold text-[#2f4131]",
              "shadow-sm hover:bg-white/90 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2",
              PILL_XS,
              "sm:" + PILL_SM,
            ].join(" ")}
          >
            Armar
          </button>
        </div>
      </div>

      {/* Card del prearmado (usa ProductCard) */}
      <div className="mt-4">
        {preBowl && (
        <ProductCard
          item={preBowl}
          onAdd={() => {
            if (unavailable) return toast("Producto no disponible");
            addPre();
          }}
          onQuickView={() => onQuickView?.(preBowl)}
        />
        )}
      </div>

      {/* Modal de armado */}
      {open && (
        <Suspense fallback={null}>
          <BowlBuilder open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}