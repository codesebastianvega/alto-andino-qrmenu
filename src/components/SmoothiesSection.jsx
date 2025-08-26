import { useEffect } from "react";
import { AddIconButton, StatusChip } from "./Buttons";
import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";
import { getStockState, slugify, isUnavailable } from "../utils/stock";
import { toast } from "./Toast";
import clsx from "clsx";
import { matchesQuery } from "../utils/strings";
import { smoothies, funcionales } from "../data/menuItems";
import { getProductImage } from "../utils/images";

function List({ items, onAdd, onQuickView }) {
  return (
    <ul className="space-y-3">
      {items.map((p) => {
        const st = getStockState(p.id || slugify(p.name));
        const unavailable = st === "out" || isUnavailable(p);
        const handleAdd = () => {
          if (unavailable) {
            toast("Producto no disponible");
            return;
          }
          onAdd(p);
        };
        const handleAddClick = (e) => {
          e.stopPropagation();
          handleAdd();
        };
        const product = {
          productId: p.id || slugify(p.name),
          id: unavailable ? undefined : p.id || slugify(p.name),
          title: p.name,
          name: p.name,
          subtitle: p.desc,
          price: p.price,
        };
        return (
          <li
            key={p.name}
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
              alt={p.name}
              className="w-full h-40 object-cover rounded-xl mb-3"
              loading="lazy"
            />
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-neutral-600">{p.desc}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {st === "low" && (
                <StatusChip variant="low">Pocas unidades</StatusChip>
              )}
              {unavailable && (
                <StatusChip variant="soldout">No Disponible</StatusChip>
              )}
            </div>
            <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
              ${COP(p.price)}
            </div>
            <AddIconButton
              className={clsx(
                "absolute bottom-4 right-4 z-20",
                unavailable && "opacity-60 cursor-not-allowed pointer-events-auto"
              )}
              aria-label={"Agregar " + p.name}
              onClick={handleAddClick}
              aria-disabled={unavailable}
              title={unavailable ? "No disponible" : undefined}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default function SmoothiesSection({ query, onCount, onQuickView }) {
  const cart = useCart();
  const add = (p) =>
    cart.addItem({
      productId: p.id || slugify(p.name),
      name: p.name,
      price: p.price,
    });

  const smoothiesFiltered = (smoothies || []).filter((p) =>
    matchesQuery({ title: p.name, description: p.desc }, query)
  );
  const funcionalesFiltered = (funcionales || []).filter((p) =>
    matchesQuery({ title: p.name, description: p.desc }, query)
  );
  const count = smoothiesFiltered.length + funcionalesFiltered.length;
  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  if (!count) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {smoothiesFiltered.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#2f4131] mb-2">
            Smoothies
          </h3>
          <List items={smoothiesFiltered} onAdd={add} onQuickView={onQuickView} />
        </div>
      )}
      {funcionalesFiltered.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#2f4131] mb-2">
            Funcionales
          </h3>
          <List items={funcionalesFiltered} onAdd={add} onQuickView={onQuickView} />
        </div>
      )}
    </div>
  );
}
