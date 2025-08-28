import React from "react";
import { formatCOP } from "@/utils/money";
import { getStockState, slugify, isUnavailable } from "@/utils/stock";
import { getProductImage } from "@/utils/images";
import { StatusChip } from "./Buttons";
import { toast } from "./Toast";
import AAImage from "@/components/ui/AAImage";

// Comentario guía encima de donde uses <img> o <AAImage>:
{/* Las imágenes de producto se configuran en src/utils/images.js.
    Coloca las fotos en /public/img/products y mapea claves en IMAGE_MAP. */}


export default function ProductCard({ item, onAdd, onQuickView }) {
  if (!item) return null;

  const productId = item.id || slugify(item.name);
  const st = getStockState(productId);
  const unavailable = st === "out" || isUnavailable(item);

  const product = {
    productId,
    id: unavailable ? undefined : productId,
    title: item.name,
    name: item.name,
    subtitle: item.desc,
    price: item.price,
  };

  const imageSrc = getProductImage(product);
  const [imgReady, setImgReady] = React.useState(false);
  React.useEffect(() => {
    // Reinicia el estado cuando cambia la imagen objetivo
    setImgReady(false);
  }, [imageSrc]);

  const handleQuickView = () => onQuickView?.(product);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleQuickView();
    }
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (unavailable) {
      toast("Producto no disponible");
      return;
    }
    onAdd?.({ productId, name: item.name, price: item.price, qty: 1 });
  };

  return (
    <article
      className={`group grid ${
        imgReady ? "grid-cols-[96px_1fr] md:grid-cols-[112px_1fr]" : "grid-cols-1"
      } gap-3 rounded-2xl bg-white p-3 text-neutral-900 shadow-sm ring-1 ring-black/5 transition-all duration-200 md:gap-4 md:p-4 hover:shadow-md hover:ring-black/10 hover:-translate-y-0.5 ${
        unavailable ? "opacity-70 grayscale" : ""
      }`}
    >
      {/* Pre-carga de imagen fuera del flujo para no reservar espacio */}
      {imageSrc && !imgReady && (
        <AAImage
          src={imageSrc}
          alt=""
          className="pointer-events-none absolute"
          style={{ width: 0, height: 0, opacity: 0, overflow: "hidden" }}
          onLoad={() => setImgReady(true)}
          onError={() => setImgReady(false)}
        />
      )}

      {imageSrc && imgReady && (
        <button
          type="button"
          onClick={handleQuickView}
          onKeyDown={handleKeyDown}
          aria-label={`Ver ${product.title || product.name || "producto"}`}
          className="block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
        >
          <AAImage
            src={imageSrc}
            alt={item.name || "Producto"}
            onLoad={() => setImgReady(true)}
            onError={() => setImgReady(false)}
            className="h-24 w-24 rounded-xl object-cover transition-transform duration-200 group-hover:scale-105 md:h-28 md:w-28"
          />
        </button>
      )}

      <div className="flex min-w-0 flex-col">
        <h3 className="truncate text-base font-semibold text-neutral-900 md:text-[17px]">
          {item.name}
        </h3>
        {item.desc && (
          <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600">
            {item.desc}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          {st === "low" && <StatusChip intent="warn">Pocas unidades</StatusChip>}
          {unavailable && (
            <StatusChip intent="neutral">No Disponible</StatusChip>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-base font-semibold text-neutral-900 md:text-[17px]">
              {typeof item.price === "number"
                ? formatCOP(item.price)
                : item.price}
            </div>
          </div>
          <button
            type="button"
            aria-label={`Agregar ${item.name || "producto"}`}
            onClick={handleAdd}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#2f4131] text-white shadow-sm ring-1 ring-black/5 transition-transform duration-150 hover:scale-110 hover:bg-[#263729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 md:h-11 md:w-11"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
