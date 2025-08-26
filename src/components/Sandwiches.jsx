import { useState, useEffect } from "react";
import { Chip, AddIconButton, StatusChip } from "./Buttons";
import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";
import { getStockState, isUnavailable } from "../utils/stock";
import { toast } from "./Toast";
import clsx from "clsx";
import { matchesQuery } from "../utils/strings";
import {
  sandwichItems,
  sandwichPriceByItem,
} from "../data/menuItems";

export default function Sandwiches({ query, onCount }) {
  const cart = useCart();
  const [size, setSize] = useState("clasico"); // 'clasico' | 'grande'

  // ← editar nombres y precios aquí
  const sizes = [
    { id: "clasico", label: "Clásico (100 g de proteína)" },
    { id: "grande", label: "Grande (300 g de proteína)" },
  ];

  const priceByItem = sandwichPriceByItem || {};
  const items = sandwichItems || [];
  const filtered = items.filter((it) =>
    matchesQuery({ title: it.name, description: it.desc }, query)
  );

  useEffect(() => {
    onCount?.(filtered.length);
  }, [filtered.length, onCount]);

  if (!filtered.length) return null;

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

  const renderWithEmoji = (text = "") => {
    const map = {
      "🥛": "Lácteos",
      "🌿": "Vegetariano",
      "🥚": "Huevo",
      "🌾": "Gluten",
      "🥜": "Frutos secos",
    };
    return text.split(/(🥛|🌿|🥚|🌾|🥜)/g).map((part, idx) => {
      const label = map[part];
      if (label) {
        return (
          <span key={idx}>
            <span aria-hidden="true" role="img">
              {part}
            </span>
            <span className="sr-only">{label}</span>
          </span>
        );
      }
      return part;
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
        <p className="text-xs text-neutral-600 mt-1">
          Clásico: 100 g de proteína · Grande: 300 g de proteína. El precio se
          actualiza según el tamaño.
        </p>
        <p className="mt-2 text-[11px] text-neutral-500">
          * Algunos sándwiches tienen precio único.
        </p>
      </div>

      {filtered.length > 0 && (
        <ul className="space-y-3">
          {filtered.map((it) => {
            const productId = "sandwich:" + it.key;
            const st = getStockState(productId);
            const unavailable = st === "out" || isUnavailable(it);
            const handleAdd = () => {
              if (unavailable) {
                toast("Producto no disponible");
                return;
              }
              add(it);
            };
            return (
              <li
                key={it.key}
                className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12"
              >
                <p className="font-semibold">{renderWithEmoji(it.name)}</p>
                <p className="text-sm text-neutral-600">
                  {renderWithEmoji(it.desc)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {st === "low" && (
                    <StatusChip variant="low">Pocas unidades</StatusChip>
                  )}
                  {unavailable && (
                    <StatusChip variant="soldout">No Disponible</StatusChip>
                  )}
                  {priceByItem[it.key].unico && (
                    <StatusChip variant="neutral">Precio único</StatusChip>
                  )}
                </div>
                <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold text-right">
                  ${COP(priceFor(it.key))}
                  {!priceByItem[it.key].unico && (
                    <span className="block text-xs text-neutral-500">
                      Mostrando precio de {size === "clasico" ? "Clásico" : "Grande"}
                    </span>
                  )}
                </div>
                <AddIconButton
                  className={clsx(
                    "absolute bottom-4 right-4 z-20",
                    unavailable &&
                      "opacity-60 cursor-not-allowed pointer-events-auto"
                  )}
                  aria-label={"Añadir " + it.name}
                  onClick={handleAdd}
                  aria-disabled={unavailable}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
