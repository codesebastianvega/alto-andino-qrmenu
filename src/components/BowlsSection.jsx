// src/components/BowlsSection.jsx
import React, { lazy, Suspense, useState, useEffect } from "react";
import clsx from "clsx";
import { useCart } from "../context/CartContext";
import { COP, formatCOP } from "../utils/money";
import { matchesQuery } from "../utils/strings";
import { AddIconButton, StatusChip, PILL_XS, PILL_SM } from "./Buttons";
import { toast } from "./Toast";
const BowlBuilder = lazy(() => import("./BowlBuilder"));
import { getStockState, slugify, isUnavailable } from "../utils/stock";
import { preBowl } from "../data/menuItems";
import { getProductImage } from "../utils/images";

// ← editar nombres y precios aquí
const BASE_PRICE = Number(import.meta.env.VITE_BOWL_BASE_PRICE || 28000);

export default function BowlsSection({ query, onCount, onQuickView }) {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);

  const openBuilder = () => setOpen(true);

  if (!preBowl) return null;

  const addPre = () =>
    addItem({
      productId: preBowl.id,
      name: preBowl.name,
      price: preBowl.price,
      options: preBowl.options,
    });

  const st = getStockState(preBowl.id || slugify(preBowl.name));
  const unavailable = st === "out" || isUnavailable(preBowl);

  const handleAdd = () => {
    if (unavailable) {
      toast("Producto no disponible");
      return;
    }
    addPre();
  };

  const show = matchesQuery(
    { title: preBowl.name, description: preBowl.desc },
    query
  );
  const count = show ? 1 : 0;
  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);
  if (!count) return null;

  const product = {
    productId: preBowl.id,
    id: unavailable ? undefined : preBowl.id,
    title: preBowl.name,
    name: preBowl.name,
    subtitle: preBowl.desc,
    price: preBowl.price,
    options: preBowl.options,
  };

  return (
    <div className="space-y-4">
      {/* CTA gigante (como otro “producto”) */}
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/10 bg-gradient-to-r from-[#2f4131] to-[#355242] h-36 sm:h-44 md:h-56">
          {/* ← editar clases y ruta de la imagen aquí */}
          <img
            src="/poke1.png"
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            className="absolute bottom-[-6px] right-0 sm:right-2 w-44 sm:w-60 md:w-72 object-contain drop-shadow-xl pointer-events-none animate-[spin_40s_linear_infinite] z-10"
          />
          <div className="absolute inset-0 pt-4 pb-16 pl-5 pr-40 sm:pt-5 sm:pl-6 sm:pr-48 grid grid-rows-[auto_1fr_auto]">
            <div>
              <p className="text-white/85 text-xs font-medium">
                Personaliza a tu gusto
              </p>
              <h3 className="text-white font-semibold text-xl sm:text-2xl">
                Armar bowl personalizado
              </h3>
              <p className="text-white/90 text-sm leading-snug">
                1 base, 1 proteína, 4 toppings, 3 extras y 1 salsa
              </p>
            </div>
          </div>
          <div
            className={[
              "absolute top-3 right-3 z-20 rounded-full bg-white text-[#2f4131] font-semibold",
              "grid place-items-center shadow-sm whitespace-nowrap",
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
              "absolute bottom-3 right-3 z-30 rounded-full bg-white text-[#2f4131] font-semibold",
              "shadow-sm hover:bg-white/90 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]",
              PILL_XS,
              "sm:" + PILL_SM,
            ].join(" ")}
          >
            Armar
          </button>
        </div>
      </div>

      {/* Card del prearmado */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onQuickView?.(product)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onQuickView?.(product);
          }
        }}
        className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
      >
        <img
          src={getProductImage(product)}
          alt={preBowl.name}
          className="w-full h-40 object-cover rounded-xl mb-3"
          loading="lazy"
        />
        <p className="font-semibold">{preBowl.name}</p>
        <p className="text-sm text-neutral-600">{preBowl.desc}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {st === "low" && (
            <StatusChip variant="low">Pocas unidades</StatusChip>
          )}
          {unavailable && (
            <StatusChip variant="soldout">No Disponible</StatusChip>
          )}
        </div>
        <div className="absolute top-5 right-5 z-10 text-neutral-800 font-bold">
          ${COP(preBowl.price)}
        </div>
        <AddIconButton
          className={clsx(
            "absolute bottom-4 right-4 z-20",
            unavailable && "opacity-60 cursor-not-allowed pointer-events-auto"
          )}
          aria-label={"Agregar " + preBowl.name}
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
          aria-disabled={unavailable}
          title={unavailable ? "No disponible" : undefined}
        />
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
