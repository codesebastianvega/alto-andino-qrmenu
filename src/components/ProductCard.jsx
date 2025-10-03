import React from "react";
import { formatCOP } from "@/utils/money";
import { getStockFlags, slugify, isUnavailable } from "@/utils/stock";
import { getProductImage } from "@/utils/images";
import { StatusChip } from "./Buttons";
import { toast } from "./Toast";
import AAImage from "@/components/ui/AAImage";

// Comentario guia encima de donde uses <img> o <AAImage>:
{/* Las imagenes de producto se configuran en src/utils/images.js.
    Coloca las fotos en /public/img/products y mapea claves en IMAGE_MAP. */}

export default function ProductCard({ item, onAdd, onQuickView }) {
  if (!item) return null;

  const productId = item.id || slugify(item.name);
  const { state: stockState, isSoon, isLow, isOut: outFromStock } = getStockFlags(productId);
  const isOut = outFromStock || isUnavailable(item);

  const product = {
    productId,
    id: isOut ? undefined : productId,
    title: item.name,
    name: item.name,
    subtitle: item.desc,
    price: item.price,
  };

  const imageSrc = getProductImage(product);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  React.useEffect(() => {
    // Reinicia el estado cuando cambia la imagen objetivo
    setImgLoaded(false);
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
    if (isOut) {
      toast("Producto no disponible");
      return;
    }
    if (isSoon) {
      toast("Disponible proximamente");
      return;
    }
    onAdd?.({ productId, name: item.name, price: item.price, qty: 1 });
  };

  return (
    <article
      className={`group grid ${
        imageSrc ? "grid-cols-[96px_1fr] md:grid-cols-[112px_1fr]" : "grid-cols-1"
      } gap-3 rounded-2xl bg-white p-3 text-neutral-900 shadow-sm ring-1 ring-black/5 transition-all duration-200 md:gap-4 md:p-4 hover:shadow-md hover:ring-black/10 hover:-translate-y-0.5 ${
        isOut ? "opacity-70 grayscale" : ""
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2`}
      onClick={handleQuickView}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {imageSrc && (
        <div className="h-24 w-24 overflow-hidden rounded-xl md:h-28 md:w-28">
          <AAImage
            src={imageSrc}
            alt={item.name || "Producto"}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(false)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            width={112}
            height={112}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold text-neutral-900 md:text-[17px]">
            {item.name}
          </h3>
          {item.origin && (
            <span className="whitespace-nowrap rounded-full border border-neutral-200 bg-neutral-100 px-2 py-[1px] text-[11px] font-medium text-neutral-600">
              {item.origin}
            </span>
          )}
        </div>
        {item.desc && (
          <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600">
            {item.desc}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          {isSoon ? (
            <StatusChip intent="info">Proximamente</StatusChip>
          ) : (
            <>
              {isLow && <StatusChip intent="warn">Pocas unidades</StatusChip>}
              {isOut && <StatusChip intent="neutral">No Disponible</StatusChip>}
            </>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-base font-semibold text-neutral-900 md:text-[17px]">
              {typeof item.price === "number" ? formatCOP(item.price) : item.price}
            </div>
          </div>
          <button
            type="button"
            aria-label={`Agregar ${item.name || "producto"}`}
            onClick={handleAdd}
            disabled={isOut || isSoon}
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#2f4131] text-white shadow-sm ring-1 ring-black/5 transition-transform duration-150 hover:scale-110 hover:bg-[#263729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 md:h-11 md:w-11 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-[#2f4131]"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
