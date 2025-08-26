import { useState, useEffect } from "react";
import { Chip, StatusChip } from "./Buttons";
import { formatCOP } from "../utils/money";
import { useCart } from "../context/CartContext";
import { getStockState, isUnavailable } from "../utils/stock";
import { toast } from "./Toast";
import { matchesQuery } from "../utils/strings";
import {
  sandwichItems,
  sandwichPriceByItem,
} from "../data/menuItems";
import { getProductImage } from "../utils/images";

export default function Sandwiches({ query, onCount, onQuickView }) {
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
            const price = priceFor(it.key);
            const mapping = priceByItem[it.key];
            const sizeLabel = mapping.unico
              ? "Precio único"
              : size === "clasico"
              ? "Clásico"
              : "Grande";
            const product = {
              productId,
              id: unavailable ? undefined : productId,
              title: it.name,
              name: `${it.name} (${sizeLabel})`,
              subtitle: it.desc,
              price,
              options: { Tamaño: sizeLabel },
            };
            const handleAdd = () => {
              if (unavailable) {
                toast("Producto no disponible");
                return;
              }
              add(it);
            };
            return (
              <article
                key={it.key}
                className="group grid grid-cols-[96px_1fr] md:grid-cols-[112px_1fr] gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white text-neutral-900 ring-1 ring-black/5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onQuickView?.(product)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onQuickView?.(product);
                    }
                  }}
                  aria-label={`Ver ${product.title || product.name || "producto"}`}
                  className="block cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
                >
                  <img
                    src={getProductImage(product)}
                    alt={it.name}
                    loading="lazy"
                    className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover"
                  />
                </button>
                <div className="min-w-0 flex flex-col">
                  <h3 className="text-base md:text-[17px] font-semibold text-neutral-900 truncate">
                    {renderWithEmoji(it.name)}
                  </h3>
                  <p className="mt-0.5 text-sm text-neutral-600 line-clamp-2">
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
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div>
                      <div className="text-base md:text-[17px] font-semibold text-neutral-900">
                        {formatCOP(price)}
                      </div>
                      {!priceByItem[it.key].unico && (
                        <div className="text-xs text-neutral-500">
                          Mostrando precio de {size === "clasico" ? "Clásico" : "Grande"}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Agregar ${it.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdd();
                      }}
                      className="h-10 w-10 md:h-11 md:w-11 grid place-items-center rounded-full bg-[#2f4131] hover:bg-[#263729] text-white shadow-sm ring-1 ring-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </ul>
      )}
    </div>
  );
}
