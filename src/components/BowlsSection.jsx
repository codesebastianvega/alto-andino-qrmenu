// src/components/BowlsSection.jsx
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { COP } from "../utils/money";
import { AddIconButton, StatusChip } from "./Buttons";
import BowlBuilderModal from "./BowlBuilderModal";
import stock from "../data/stock.json";

function stateFor(productId) {
  const s = (stock.products || {})[productId];
  return s === "low" ? "low" : s === false ? "out" : "ok";
}

const BASE_PRICE = 32000;

// Poke Hawaiano (único prearmado)
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

  const st = stateFor(PREBOWL.id);
  const disabled = st === "out";

  return (
    <div className="space-y-4">
      {/* CTA gigante (como otro “producto”) */}
      <div
        onClick={openBuilder}
        role="button"
        aria-label="Armar bowl"
        className="relative rounded-2xl overflow-hidden ring-1 ring-black/10 bg-gradient-to-r from-[#2f4131] to-[#355242]"
      >
        {/* Imagen decorativa */}
        <div className="absolute inset-y-0 right-0 w-40 opacity-70 pointer-events-none flex items-center justify-center">
          🍣
        </div>
        <div className="absolute inset-0 p-4 sm:p-5 pr-28 pb-16 flex flex-col justify-between">
          <div>
            <p className="text-white/85 text-xs font-medium">Personaliza a tu gusto</p>
            <h3 className="text-white font-semibold text-xl sm:text-2xl">
              Armar bowl personalizado
            </h3>
            <p className="text-white/90 text-sm">
              1 base, 1 proteína, 4 toppings, 3 extras y 1 salsa
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="absolute right-4 bottom-4 z-10 rounded-full bg-white text-[#2f4131] font-semibold px-3 h-9 grid place-items-center shadow">
              Desde&nbsp;<span className="font-bold">${COP(BASE_PRICE)}</span>
            </div>
          </div>
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
          {disabled && (
            <StatusChip variant="soldout">Agotado</StatusChip>
          )}
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
      <BowlBuilderModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
