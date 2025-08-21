import { useState } from "react";
import { Chip, Button } from "./Buttons";
import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";
import stock from "../data/stock.json"; // ← sin assert

// Devuelve 'ok' | 'low' | 'out' para un id de producto
function stateFor(id) {
  const s = (stock.products || {})[id];
  return s === "low" ? "low" : s === false ? "out" : "ok";
}

export default function Sandwiches() {
  const cart = useCart();
  const [size, setSize] = useState("clasico"); // 'clasico' | 'grande'

  const sizes = [
    { id: "clasico", label: "Clásico (100 g de proteína)" },
    { id: "grande", label: "Grande (300 g de proteína)" },
  ];

  // Precios por sándwich (unico = precio único)
  const priceByItem = {
    cerdo: { clasico: 22000, grande: 35000 },
    pollo: { clasico: 22000, grande: 35000 },
    pavo: { clasico: 24000, grande: 39000 },
    serrano: { unico: 29000 },
    cosecha: { unico: 24000 },
  };

  const items = [
    {
      key: "cerdo",
      name: "Cerdo al Horno",
      desc: "Mayo-pesto, lechuga, tomate, pierna de cerdo horneada y suero costeño.",
    },
    {
      key: "pollo",
      name: "Pechuga de Pollo al Horno",
      desc: "Alioli de yogur, lechuga y tomate.",
    },
    {
      key: "pavo",
      name: "Pavo Horneado",
      desc: "Alioli de yogur, tomate seco y hojas verdes.",
    },
    {
      key: "serrano",
      name: "Serrano Di Búfala",
      desc: "Queso crema, espinaca, jamón serrano, queso de búfala, tomate cherry salteado y balsámico. 🥛",
    },
    {
      key: "cosecha",
      name: "Cosecha del Páramo 🌿",
      desc: "Hummus casero, pimientos asados, aguacate, champiñón a la plancha, pepino y lechugas; lámina de queso costeño frito. 🥛",
    },
  ];

  const priceFor = (key) => {
    const p = priceByItem[key];
    if (p.unico) return p.unico;
    return p[size];
  };

  const add = (it) => {
    const price = priceFor(it.key);
    const mapping = priceByItem[it.key];
    const sizeLabel = mapping.unico
      ? "Precio único"
      : size === "clasico"
      ? "Clásico"
      : "Grande";
    cart.addItem({
      productId: "sandwich:" + it.key,
      name: `${it.name} (${sizeLabel})`,
      price,
      options: { Tamaño: sizeLabel },
    });
  };

  return (
    <div>
      <div className="mb-3">
        <p className="text-xs text-neutral-600 mb-2">Elige tamaño</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <Chip
              key={s.id}
              active={size === s.id}
              onClick={() => setSize(s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          * Algunos sándwiches tienen precio único.
        </p>
      </div>

      <ul className="space-y-3">
        {items.map((it) => {
          const productId = "sandwich:" + it.key;
          const st = stateFor(productId); // 'ok' | 'low' | 'out'
          const disabled = st === "out";
          return (
            <li
              key={it.key}
              className="card p-3 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <p className="font-semibold">{it.name}</p>
                <p className="text-sm text-neutral-600">{it.desc}</p>
                {st === "low" && (
                  <span className="badge badge-warn mt-2 inline-block">
                    Pocas unidades
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold">${COP(priceFor(it.key))}</p>
                <Button
                  variant="outline"
                  className="mt-1"
                  onClick={() => add(it)}
                  disabled={disabled}
                >
                  {disabled ? "Agotado" : "Añadir"}
                </Button>
                {priceByItem[it.key].unico && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Precio único
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
