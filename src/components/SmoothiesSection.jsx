import { useEffect } from "react";
import { StatusChip } from "./Buttons";
import { formatCOP } from "../utils/money";
import { useCart } from "../context/CartContext";
import { getStockState, slugify, isUnavailable } from "../utils/stock";
import { toast } from "./Toast";
import { matchesQuery } from "../utils/strings";
import { smoothies, funcionales } from "../data/menuItems";
import { getProductImage } from "../utils/images";

function List({ items, onAdd, onQuickView }) {
  return (
    <ul className="space-y-3">
      {items.map((p) => {
        const st = getStockState(p.id || slugify(p.name));
        const unavailable = st === "out" || isUnavailable(p);
        const product = {
          productId: p.id || slugify(p.name),
          id: unavailable ? undefined : p.id || slugify(p.name),
          title: p.name,
          name: p.name,
          subtitle: p.desc,
          price: p.price,
        };
        return (
          <article
            key={p.name}
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
                alt={p.name}
                loading="lazy"
                className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover"
              />
            </button>
            <div className="min-w-0 flex flex-col">
              <h3 className="text-base md:text-[17px] font-semibold text-neutral-900 truncate">{p.name}</h3>
              {p.desc && (
                <p className="mt-0.5 text-sm text-neutral-600 line-clamp-2">{p.desc}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
                {unavailable && <StatusChip variant="soldout">No Disponible</StatusChip>}
              </div>
              <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                <div>
                  <div className="text-base md:text-[17px] font-semibold text-neutral-900">
                    {formatCOP(p.price)}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Agregar ${p.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (unavailable) {
                      toast("Producto no disponible");
                      return;
                    }
                    onAdd(p);
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
