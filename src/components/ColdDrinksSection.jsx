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
    <article className="group grid grid-cols-[96px_1fr] md:grid-cols-[112px_1fr] gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white text-neutral-900 ring-1 ring-black/5 shadow-sm">
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
          alt={item.name}
          loading="lazy"
          className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover"
        />
      </button>
      <div className="min-w-0 flex flex-col">
        <h3 className="text-base md:text-[17px] font-semibold text-neutral-900 truncate">{item.name}</h3>
        {item.desc && (
          <p className="mt-0.5 text-sm text-neutral-600 line-clamp-2">{item.desc}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
          {unavailable && <StatusChip variant="soldout">No Disponible</StatusChip>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-base md:text-[17px] font-semibold text-neutral-900">{formatCOP(item.price)}</div>
          </div>
          <button
            type="button"
            aria-label={`Agregar ${item.name}`}
            onClick={handleAddClick}
            className="h-10 w-10 md:h-11 md:w-11 grid place-items-center rounded-full bg-[#2f4131] hover:bg-[#263729] text-white shadow-sm ring-1 ring-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
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

