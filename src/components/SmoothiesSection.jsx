import { AddIconButton, StatusChip } from "./Buttons";
import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";
import { getStockState, slugify, isUnavailable } from "../utils/stock";
import { toast } from "./Toast";
import clsx from "clsx";
import { matchesQuery } from "../utils/strings";
import { smoothies, funcionales } from "../data/menuItems";

function List({ items, onAdd }) {
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
        return (
          <li
            key={p.name}
            className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12"
          >
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
              aria-label={"Añadir " + p.name}
              onClick={handleAdd}
              aria-disabled={unavailable}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default function SmoothiesSection({ query }) {
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

  if (!smoothiesFiltered.length && !funcionalesFiltered.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {smoothiesFiltered.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-alto-primary mb-2">
            Smoothies
          </h3>
          <List items={smoothiesFiltered} onAdd={add} />
        </div>
      )}
      {funcionalesFiltered.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-alto-primary mb-2">
            Funcionales
          </h3>
          <List items={funcionalesFiltered} onAdd={add} />
        </div>
      )}
    </div>
  );
}
