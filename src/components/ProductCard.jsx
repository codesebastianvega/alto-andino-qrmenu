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

export default function ProductCard({ item, onAdd, onQuickView, variant = "standard", isHero = false }) {
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
      className={`group relative flex overflow-hidden transition-all duration-300 ${
        isOut ? "opacity-70 grayscale" : "hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1"
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 rounded-[28px] bg-white text-neutral-900 shadow-[0_4px_20px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.03] ${
        isCompact ? "p-2 flex-row" : "p-0 flex-col"
      } ${
        isHero ? "lg:col-span-2 lg:flex-row" : ""
      }`}
      onClick={handleQuickView}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {imageSrc ? (
        <div className={`overflow-hidden ${
          isCompact ? "h-20 w-20 rounded-[20px] flex-shrink-0" 
          : isHero ? "w-full aspect-square lg:w-1/2 lg:aspect-auto lg:h-auto rounded-t-[28px] lg:rounded-t-none lg:rounded-l-[28px]" 
          : "w-full aspect-square rounded-t-[28px]"
        }`}>
          <AAImage
            src={imageSrc}
            alt={item.name || "Producto"}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(false)}
            className={`h-full w-full object-cover transition-opacity duration-500 ease-out ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            width={isCompact ? 80 : isHero ? 600 : 400}
            height={isCompact ? 80 : isHero ? 600 : 400}
          />
        </div>
      ) : (
        !isCompact && (
          <div className={`flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 ${
            isHero ? "w-full aspect-[4/3] lg:w-1/2 lg:aspect-auto lg:h-auto rounded-t-[28px] lg:rounded-t-none lg:rounded-l-[28px]" 
            : "w-full aspect-[4/3] rounded-t-[28px]"
          }`}>
            <div className="text-center text-neutral-300">
              <svg className="w-10 h-10 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span className="text-[10px] font-medium uppercase tracking-wider">Sin foto</span>
            </div>
          </div>
        )
      )}

      <div className={`flex flex-1 flex-col ${isCompact ? "ml-3 py-1" : "p-4 pb-5"}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-bold text-neutral-900 line-clamp-2 tracking-tight ${isCompact ? "text-sm" : "text-[16px] leading-[1.15]"}`}>
            {item.name}
          </h3>
          {productAllergens.length > 0 && !isCompact && (
             <div className="flex gap-1 items-center shrink-0 bg-neutral-50 rounded-full px-1.5 py-0.5">
                 {productAllergens.map((alg) => (
                    <span key={alg.id} title={alg.name} className="text-[12px] leading-none">
                       {alg.emoji}
                    </span>
                 ))}
             </div>
          )}
        </div>

        {item.desc && !isCompact && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.3] text-[#717171]">
            {item.desc}
          </p>
        )}

        {isOut && (
          <div className="mt-2.5">
            <StatusChip intent="neutral">Agotado</StatusChip>
          </div>
        )}

        {/* CONTENEDOR DE PRECIO Y BOTON */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          <div className={`font-semibold tracking-tight text-neutral-900 ${isCompact ? "text-[14px]" : "text-[16px]"}`}>
            {typeof item.price === "number" ? formatCOP(item.price) : item.price}
          </div>
          
          <button
            type="button"
            aria-label={`Agregar ${item.name || "producto"}`}
            onClick={handleAdd}
            disabled={isOut}
            className={`flex items-center justify-center rounded-full bg-[#2f4131] text-white shadow-md shadow-[#2f4131]/20 transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${
              isCompact ? "h-8 w-8 text-lg" : "h-10 w-10 text-[22px] font-light leading-none"
            }`}
          >
            <span style={{ transform: "translateY(-1px)" }}>+</span>
          </button>
        </div>
      </div>
    </article>
  );
}
