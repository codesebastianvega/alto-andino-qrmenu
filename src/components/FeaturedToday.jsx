import React from "react";
import { AddIconButton, StatusChip } from "./Buttons";
import { useCart } from "../context/CartContext";

const N = import.meta.env.VITE_FEATURED_NAME || "Sandiwch de Cerdo al Horno";
const D =
  import.meta.env.VITE_FEATURED_DESC ||
  "Delicioso sandiwch de cerdo al horno casero y saludable.";
const P = Number(import.meta.env.VITE_FEATURED_PRICE || 12000);
const IMG = import.meta.env.VITE_FEATURED_IMAGE || "/especial1.png";
const LOW = import.meta.env.VITE_FEATURED_LOW === "1";
const OUT = import.meta.env.VITE_FEATURED_SOLD === "1";
const fmt = (n) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function FeaturedToday() {
  const { addItem } = useCart();
  return (
    <section className="mt-3">
      <div className="px-4 sm:px-6">
        <div className="text-sm font-medium text-[#2f4131] mb-2">
          Especial de hoy
        </div>
      </div>
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl ring-1 ring-black/10 shadow-sm bg-gradient-to-r from-[#2f4131] to-[#355242]">
          <img
            src={IMG}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-3 right-3 z-10">
            <span className="rounded-full px-3 py-1 text-sm bg-white/80 backdrop-blur text-[#2f4131] font-medium">
              {fmt(P)}
            </span>
          </div>
          <div className="absolute left-4 right-24 bottom-4 z-10">
            <h3 className="text-xl font-semibold tracking-tight text-white line-clamp-2">
              {N}
            </h3>
            <p className="mt-1 text-sm text-white/90 line-clamp-2">{D}</p>
            <div className="mt-2 flex gap-2">
              {LOW && (
                <StatusChip
                  variant="low"
                  className="bg-white/90 text-amber-900 border-transparent"
                >
                  Pocas unidades
                </StatusChip>
              )}
              {OUT && (
                <StatusChip
                  variant="soldout"
                  className="bg-white/90 text-neutral-800 border-transparent"
                >
                  Agotado
                </StatusChip>
              )}
            </div>
          </div>
          <AddIconButton
            disabled={OUT}
            onClick={() =>
              addItem?.({
                id: "featured-of-day",
                name: N,
                price: P,
                priceFmt: fmt(P),
                qty: 1,
              })
            }
            className="absolute bottom-4 right-4 z-20"
            aria-label={"Añadir " + N + " al carrito"}
            variant="light"
          />
        </div>
      </div>
    </section>
  );
}
