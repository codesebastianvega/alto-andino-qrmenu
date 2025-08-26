import React, { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { StatusChip } from "./Buttons";
import { formatCOP } from "../utils/money";
import { getStockState, slugify, isUnavailable } from "../utils/stock";
import { toast } from "./Toast";
import { matchesQuery } from "../utils/strings";
import { sodas, otherDrinks } from "../data/menuItems";
import { getProductImage } from "../utils/images";

function Card({ item, onAdd, onQuickView }) {
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
      priceFmt: formatCOP(item.price),
      qty: 1,
    });
  };
  const handleAddClick = (e) => {
    e.stopPropagation();
    if (unavailable) {
      toast("Producto no disponible");
      return;
    }
    handleAdd();
  };
  const product = {
    productId: item.id,
    id: unavailable ? undefined : item.id,
    title: item.name,
    name: item.name,
    subtitle: item.desc,
    price: item.price,
  };
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onQuickView?.(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onQuickView?.(product);
        }
      }}
      aria-disabled={unavailable}
      className="group grid grid-cols-[96px_1fr] gap-3 p-3 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
    >
      <img
        src={getProductImage(product)}
        alt={item.name}
        loading="lazy"
        className="w-24 h-24 rounded-xl object-cover"
      />
      <div className="min-w-0 flex flex-col">
        <h3 className="text-sm font-semibold truncate">{item.name}</h3>
        {item.desc && (
          <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">{item.desc}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
          {unavailable && <StatusChip variant="soldout">No Disponible</StatusChip>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-sm font-semibold">{formatCOP(item.price)}</div>
          </div>
          <button
            type="button"
            aria-label={`Agregar ${item.name}`}
            onClick={handleAddClick}
            className="h-10 w-10 grid place-items-center rounded-full bg-[#2f4131] text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ColdDrinksSection({ query, onCount, onQuickView }) {
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
              <Card key={it.id} item={it} onAdd={addItem} onQuickView={onQuickView} />
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
              <Card key={it.id} item={it} onAdd={addItem} onQuickView={onQuickView} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

