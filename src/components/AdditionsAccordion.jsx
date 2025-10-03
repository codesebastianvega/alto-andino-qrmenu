import React, { useId, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCOP } from "@/utils/money";
import { getStockFlags, slugify, isUnavailable } from "@/utils/stock";
import { AddIconButton, StatusChip } from "./Buttons";
import { toast } from "./Toast";

export default function AdditionsAccordion({
  items = [],
  title = "Adiciones",
  description = "",
  defaultOpen = false,
  idPrefix = "additions",
}) {
  const { addItem } = useCart();

  if (!items.length) return null;

  const autoId = useId();
  const listId = `${idPrefix || "additions"}-${autoId}`;

  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((prev) => !prev);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#2f4131]/10 px-4 py-3 text-left text-sm font-semibold text-[#2f4131] ring-1 ring-[#2f4131]/20 transition hover:bg-[#2f4131]/15"
      >
        <span className="uppercase tracking-[0.08em]">{title}</span>
        <span className="flex items-center gap-2 text-xs font-medium text-[#2f4131]/80">
          {items.length} opciones
          <span
            aria-hidden
            className={`text-base transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          >
            ▾
          </span>
        </span>
      </button>

      {open && (
        <div
          id={listId}
          className="mt-3 rounded-2xl bg-[#f9f6f1] p-4 ring-1 ring-black/5"
        >
          {description && <p className="mb-3 text-xs text-neutral-600">{description}</p>}
          <ul className="space-y-2">
            {items.map((item) => {
              const productId = item.id || slugify(item.name);
              const { isSoon, isLow, isOut } = getStockFlags(productId);
              const unavailable = isOut || isUnavailable(item);

              const handleAdd = () => {
                if (unavailable) {
                  toast("Producto no disponible");
                  return;
                }
                addItem({ productId, name: item.name, price: item.price, qty: 1 });
              };

              return (
                <li
                  key={productId}
                  className={`flex items-center justify-between gap-3 rounded-xl bg-white/90 px-3 py-2 ring-1 ring-black/5 ${
                    unavailable ? "opacity-70" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{item.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-sm font-semibold text-neutral-800">
                        {typeof item.price === "number" ? formatCOP(item.price) : item.price}
                      </span>
                      {isSoon ? (
                        <StatusChip intent="info" size="xs">
                          Proximamente
                        </StatusChip>
                      ) : (
                        <>
                          {isLow && <StatusChip intent="warn">Pocas unidades</StatusChip>}
                          {unavailable && <StatusChip intent="neutral">No disponible</StatusChip>}
                        </>
                      )}
                    </div>
                  </div>
                  <AddIconButton
                    disabled={unavailable || isSoon}
                    onClick={handleAdd}
                    aria-label={`Agregar ${item.name}`}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
