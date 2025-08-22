import { AddIconButton, StatusChip } from "./Buttons";
import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";
import stock from "../data/stock.json";

// ← editar nombres y precios aquí
const smoothies = [
  {
    name: "Brisas Tropicales",
    price: 18000,
    desc: "Hierbabuena, mango, maracuyá y piña; leche de almendras, yogur griego y chía. 🥛🥜",
  },
  {
    name: "El Néctar Andino",
    price: 17000,
    desc: "Fresas y arándanos, marañones y avena; leche a elección y vainilla. 🥛🌾🥜",
  },
  {
    name: "Verde Amanecer de la Sabana",
    price: 16000,
    desc: "Espinaca, kiwi, banano, manzana verde, jengibre y yerbabuena.",
  },
];

// ← editar nombres y precios aquí
const funcionales = [
  {
    name: "Elixir del Cóndor (Detox)",
    price: 18000,
    desc: "Pepino, apio, manzana verde, limón y jengibre; espirulina + clorofila.",
  },
  {
    name: "Aurora Proteica",
    price: 22000,
    desc: "Leche de almendras, proteína vegetal (vainilla/chocolate), banano y chía. 🥜",
  },
];

// estado para un id (ok/low/out)
function stateFor(id) {
  const s = (stock.products || {})[id];
  return s === "low" ? "low" : s === false ? "out" : "ok";
}

// mapea un nombre a id de stock
const idOf = (name) => `smoothie:${name}`;

function List({ items, onAdd }) {
  return (
    <ul className="space-y-3">
      {items.map((p) => {
        const id = idOf(p.name);
        const st = stateFor(id);
        const disabled = st === "out";
        return (
          <li
            key={p.name}
            className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12"
          >
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-neutral-600">{p.desc}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {st === "low" && (
                <StatusChip variant="low">Pocas unidades</StatusChip>
              )}
              {disabled && (
                <StatusChip variant="soldout">Agotado</StatusChip>
              )}
            </div>
            <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
              ${COP(p.price)}
            </div>
            <AddIconButton
              className="absolute bottom-4 right-4 z-20"
              aria-label={"Añadir " + p.name}
              onClick={() => onAdd(p)}
              disabled={disabled}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default function SmoothiesSection() {
  const cart = useCart();
  const add = (p) =>
    cart.addItem({ productId: idOf(p.name), name: p.name, price: p.price });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <h3 className="text-sm font-semibold text-alto-primary mb-2">
          Smoothies
        </h3>
        <List items={smoothies} onAdd={add} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-alto-primary mb-2">
          Funcionales
        </h3>
        <List items={funcionales} onAdd={add} />
      </div>
    </div>
  );
}
