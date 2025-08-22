// src/components/BowlsSection.jsx
import React, { lazy, Suspense, useState } from "react";
import { useCart } from "../context/CartContext";
import { COP, formatCOP } from "../utils/money";
import { AddIconButton, StatusChip, PILL_XS, PILL_SM } from "./Buttons";
const BowlBuilderModal = lazy(() => import("./BowlBuilderModal"));
import { getStockState, slugify } from "../utils/stock";

// ← editar nombres y precios aquí
const BASE_PRICE = Number(import.meta.env.VITE_BOWL_BASE_PRICE || 32000);


// Poke Hawaiano (único prearmado)
// ← editar nombres y precios aquí
const PREBOWL = {
  id: "bowl-poke-hawaiano",
  name: "Poke Hawaiano",
  price: 36000, // 32.000 base + 4.000 premium salmón
  desc: "Arroz blanco, salmón, aguacate, mango y pepino; ajonjolí y salsa mango-yaki.",
  options: {
    Base: "Arroz blanco",
    Proteína: "Salmón",
    Toppings: ["Aguacate", "Mango", "Pepino"],
    Extras: ["Ajonjolí"],
    Salsa: "Mango-yaki",
  },
};

export default function BowlsSection() {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);

  const openBuilder = () => setOpen(true);

  const addPre = () =>
    addItem({
      productId: PREBOWL.id,
      name: PREBOWL.name,
      price: PREBOWL.price,
      options: PREBOWL.options,
    });

  const st = getStockState(PREBOWL.id || slugify(PREBOWL.name));
  const disabled = st === "out";

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
              PILL_XS, "sm:" + PILL_SM,
            ].join(" ")}
          >
            Desde {formatCOP(BASE_PRICE)}
          </div>
          <button
            onClick={openBuilder}
            aria-label="Armar bowl personalizado"
            className={[
              "absolute bottom-3 right-3 z-30 rounded-full bg-white text-[#2f4131] font-semibold",
              "shadow-sm hover:bg-white/90 focus:outline-none",
              "focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]",
              PILL_XS, "sm:" + PILL_SM,
            ].join(" ")}
          >
            Armar
          </button>
        </div>
      </div>

      {/* Card del prearmado */}
      <div className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12">
        <p className="font-semibold">{PREBOWL.name}</p>
        <p className="text-sm text-neutral-600">{PREBOWL.desc}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {st === "low" && (
            <StatusChip variant="low">Pocas unidades</StatusChip>
          )}
          {st === "out" && <StatusChip variant="soldout">Agotado</StatusChip>}
        </div>
        <div className="absolute top-5 right-5 z-10 text-neutral-800 font-bold">
          ${COP(PREBOWL.price)}
        </div>
        <AddIconButton
          className="absolute bottom-4 right-4 z-20"
          aria-label={"Añadir " + PREBOWL.name}
          onClick={addPre}
          disabled={disabled}
        />
      </div>

      {/* Modal de armado */}
      {open && (
        <Suspense fallback={null}>
          <BowlBuilderModal open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
