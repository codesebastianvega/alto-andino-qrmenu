import React from "react";
import { AddIconButton, StatusChip } from "./Buttons";
import { useCart } from "../context/CartContext";

const N = import.meta.env.VITE_FEATURED_NAME || "Especial de hoy";
const D =
  import.meta.env.VITE_FEATURED_DESC ||
  "Delicioso sandiwch de cerdo al horno casero y saludable. Con un proceso de marinado y horneado de mas de 24 h";
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
        <div className="relative overflow-hidden rounded-2xl h-44 sm:h-56 ring-1 ring-black/10 bg-gradient-to-r from-[#2f4131] to-[#355242]">
          <img
            src={IMG}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-80" // modifica la imagen
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4 z-10 text-white font-semibold">
            {fmt(P)}
          </div>
          <div className="absolute left-4 right-24 bottom-4 z-10">
            <h3 className="text-white text-xl sm:text-2xl font-semibold">
              {N}
            </h3>
            <p className="text-white/90 text-sm line-clamp-2">{D}</p>
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
            aria-label={"Añadir " + N}
            variant="light"
          />
        </div>
      </div>
    </section>
  );
}
