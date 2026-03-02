import React from "react";
import { formatCOP } from "@/utils/money";
import { slugify } from "@/utils/stock";
import { getProductImage } from "@/utils/images";
import { StatusChip } from "./Buttons";
import { toast } from "./Toast";
import AAImage from "@/components/ui/AAImage";
import { useMenuData } from "@/context/MenuDataContext";

// Comentario guia encima de donde uses <img> o <AAImage>:
{/* Las imagenes de producto se configuran en src/utils/images.js.
    Coloca las fotos en /public/img/products y mapea claves en IMAGE_MAP. */}

export default function ProductCard({ item, onAdd, onQuickView }) {
  if (!item) return null;

  const productId = item.id || slugify(item.name);
  
  // Get allergens from context
  const { allergens = [] } = useMenuData() || {};

  // Find emojis for the tags the product has
  const productAllergens = (item.tags || []).map(tagName => {
    return allergens.find(a => a.name === tagName);
  }).filter(Boolean);
  
  // Use stock_status from database (Supabase)
  const isOut = item.stock_status === 'out';
  
  const product = {
    ...item,                            // preserve all DB fields (modifierGroups, categorySlug, configOptions, etc.)
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
      toast("Producto agotado");
      return;
    }

    // Si tiene modificadores, abrir el modal en lugar de agregar directo
    const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0;
    if (hasModifiers) {
      handleQuickView();
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
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="truncate text-base font-semibold text-neutral-900 md:text-[17px]">
            {item.name}
          </h3>
          {/* Muestra las Emojis de alergias dinámicas acá */}
          {productAllergens.length > 0 && (
             <div className="flex gap-1 items-center">
                 {productAllergens.map((alg) => (
                    <span key={alg.id} title={alg.name} className="text-[13px] leading-none">
                       {alg.emoji}
                    </span>
                 ))}
             </div>
          )}
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
          {isOut && <StatusChip intent="neutral">Agotado</StatusChip>}
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
            disabled={isOut}
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#2f4131] text-white shadow-sm ring-1 ring-black/5 transition-transform duration-150 hover:scale-110 hover:bg-[#263729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 md:h-11 md:w-11 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-[#2f4131]"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
