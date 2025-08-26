import React, { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { AddIconButton, StatusChip } from "./Buttons";
import { COP } from "../utils/money";
import { getStockState, slugify, isUnavailable } from "../utils/stock";
import { toast } from "./Toast";
import clsx from "clsx";
import { matchesQuery } from "../utils/strings";
import { sodas, otherDrinks } from "../data/menuItems";

function Card({ item, onAdd }) {
  const st = getStockState(item.id || slugify(item.name));
  const unavailable = st === "out" || isUnavailable(item);
  const handleAdd = () => {
    if (unavailable) {
      toast("Producto no disponible");
      return;
    }
    onAdd({
      productId: item.id,
      name: item.name,
      price: item.price,
      priceFmt: "$" + COP(item.price),
      qty: 1,
    });
  };
  return (
    <div className="relative rounded-xl bg-white ring-1 ring-neutral-200 p-3 pr-16 pb-12 min-h-[96px]">
      <p className="text-neutral-900 font-medium text-sm leading-tight break-words">{item.name}</p>
      {item.desc && (
        <p className="mt-0.5 text-xs text-neutral-600 leading-snug break-words">{item.desc}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
        {unavailable && <StatusChip variant="soldout">No Disponible</StatusChip>}
      </div>
      <div className="absolute top-2 right-2 min-w-[64px] text-right text-neutral-900 font-semibold text-sm">
        {"$" + COP(item.price)}
      </div>
      <AddIconButton
        className={clsx(
          "absolute bottom-2 right-2 scale-90 sm:scale-100",
          unavailable && "opacity-60 cursor-not-allowed pointer-events-auto"
        )}
        aria-label={"Añadir " + item.name}
        onClick={handleAdd}
        aria-disabled={unavailable}
      />
    </div>
  );
}

export default function ColdDrinksSection({ query, onCount }) {
  const { addItem } = useCart();

  const sodasFiltered = (sodas || []).filter((it) =>
    matchesQuery({ title: it.name, description: it.desc }, query)
  );
  const othersFiltered = (otherDrinks || []).filter((it) =>
    matchesQuery({ title: it.name, description: it.desc }, query)
  );
  const count = sodasFiltered.length + othersFiltered.length;
  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  if (!count) return null;

  return (
    <div>
      {sodasFiltered.length > 0 && (
        <>
          {/* Subgrupo: Gaseosas y Sodas */}
          <h3 className="text-sm font-semibold text-[#2f4131] mb-2">Gaseosas y Sodas</h3>
          <div className="grid grid-cols-2 gap-3">
            {sodasFiltered.map((it) => (
              <Card key={it.id} item={it} onAdd={addItem} />
            ))}
          </div>
        </>
      )}

      {othersFiltered.length > 0 && (
        <>
          {/* Subgrupo: Jugos y otras bebidas frías */}
          <h3 className="mt-5 text-sm font-semibold text-[#2f4131] mb-2">Jugos y otras bebidas frías</h3>
          <div className="grid grid-cols-2 gap-3">
            {othersFiltered.map((it) => (
              <Card key={it.id} item={it} onAdd={addItem} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

