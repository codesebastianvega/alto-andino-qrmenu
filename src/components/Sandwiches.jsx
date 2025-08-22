import { useState } from "react";
import { Chip, AddIconButton, StatusChip } from "./Buttons";
import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";
import { getStockState, slugify } from "../utils/stock";

export default function Sandwiches() {
  const cart = useCart();
  const [size, setSize] = useState("clasico"); // 'clasico' | 'grande'

  // ← editar nombres y precios aquí
  const sizes = [
    { id: "clasico", label: "Clásico (100 g de proteína)" },
    { id: "grande", label: "Grande (300 g de proteína)" },
  ];

  // Precios por sándwich (unico = precio único)
  // ← editar nombres y precios aquí
  const priceByItem = {
    cerdo: { clasico: 22000, grande: 35000 },
    pollo: { clasico: 22000, grande: 35000 },
    pavo: { clasico: 24000, grande: 39000 },
    serrano: { unico: 29000 },
    cosecha: { unico: 24000 },
  };

  // ← editar nombres y precios aquí
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
          const st = getStockState(productId || slugify(it.name));
          const disabled = st === "out";
          return (
            <li
              key={it.key}
              className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12"
            >
              <p className="font-semibold">{it.name}</p>
              <p className="text-sm text-neutral-600">{it.desc}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {st === "low" && (
                  <StatusChip variant="low">Pocas unidades</StatusChip>
                )}
                {disabled && (
                  <StatusChip variant="soldout">Agotado</StatusChip>
                )}
                {priceByItem[it.key].unico && (
                  <StatusChip variant="neutral">Precio único</StatusChip>
                )}
              </div>
              <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
                ${COP(priceFor(it.key))}
              </div>
              <AddIconButton
                className="absolute bottom-4 right-4 z-20"
                aria-label={"Añadir " + it.name}
                onClick={() => add(it)}
                disabled={disabled}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
