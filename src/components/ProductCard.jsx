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

export default function ProductCard({ item, onAdd, onQuickView, variant = "standard" }) {
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
    ...item,
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

    const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0;
    if (hasModifiers) {
      handleQuickView();
      return;
    }

    onAdd?.({ productId, name: item.name, price: item.price, qty: 1, packaging_fee: item.packaging_fee });
  };

  // VARIANTES DE DISEÑO
  const isCompact = variant === "compact";
  const isWide = variant === "wide";

  return (
    <article
      className={`group relative overflow-hidden transition-all duration-200 ${
        isOut ? "opacity-70 grayscale" : "hover:shadow-md hover:ring-black/10 hover:-translate-y-0.5"
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 rounded-2xl bg-white text-neutral-900 shadow-sm ring-1 ring-black/5 
      ${isWide ? "flex flex-col" : "grid"}
      ${!isWide && imageSrc ? "grid-cols-[96px_1fr] md:grid-cols-[112px_1fr] gap-3 p-3 md:gap-4 md:p-4" : "p-3"}
      ${isWide ? "p-0" : ""}
      `}
      onClick={handleQuickView}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {imageSrc && (
        <div className={`overflow-hidden rounded-xl ${
          isWide ? "aspect-[16/10] rounded-b-none" : "h-24 w-24 md:h-28 md:w-28"
        }`}>
          <AAImage
            src={imageSrc}
            alt={item.name || "Producto"}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(false)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            width={isWide ? 400 : 112}
            height={isWide ? 250 : 112}
          />
        </div>
      )}

      <div className={`flex min-w-0 flex-col ${isWide ? "p-4" : ""}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`truncate font-semibold text-neutral-900 ${
            isWide ? "text-lg" : "text-base md:text-[17px]"
          }`}>
            {item.name}
          </h3>
          {productAllergens.length > 0 && !isCompact && (
             <div className="flex gap-1 items-center">
                 {productAllergens.map((alg) => (
                    <span key={alg.id} title={alg.name} className="text-[13px] leading-none">
                       {alg.emoji}
                    </span>
                 ))}
             </div>
          )}
        </div>

        {item.desc && !isCompact && (
          <p className={`mt-0.5 line-clamp-2 text-sm text-neutral-600 ${isWide ? "mt-1.5" : ""}`}>
            {item.desc}
          </p>
        )}

        {isOut && (
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusChip intent="neutral">Agotado</StatusChip>
          </div>
        )}

        <div className={`mt-auto flex items-end justify-between gap-3 ${isCompact ? "pt-1" : "pt-2"}`}>
          <div className={`font-semibold text-neutral-900 ${
            isWide ? "text-lg" : "text-base md:text-[17px]"
          }`}>
            {typeof item.price === "number" ? formatCOP(item.price) : item.price}
          </div>
          
          <button
            type="button"
            aria-label={`Agregar ${item.name || "producto"}`}
            onClick={handleAdd}
            disabled={isOut}
            className={`grid place-items-center rounded-full bg-[#2f4131] text-white shadow-sm ring-1 ring-black/5 transition-transform duration-150 hover:scale-110 hover:bg-[#263729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${
              isCompact ? "h-8 w-8 text-sm" : "h-10 w-10 md:h-11 md:w-11"
            }`}
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
