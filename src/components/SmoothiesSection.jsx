import { Button } from "./Buttons";
import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";
import stock from "../data/stock.json";

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
            className="card p-3 flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-neutral-600">{p.desc}</p>
              {st === "low" && (
                <span className="badge badge-warn mt-2 inline-block">
                  Pocas unidades
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold">${COP(p.price)}</p>
              <Button
                variant="outline"
                className="mt-1"
                onClick={() => onAdd(p)}
                disabled={disabled}
              >
                {disabled ? "Agotado" : "Añadir"}
              </Button>
            </div>
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
