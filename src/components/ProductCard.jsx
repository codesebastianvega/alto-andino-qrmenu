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

const ProductCard = React.memo(({ item, onAdd, onQuickView, variant = "standard", isHero = false, allergens = [] }) => {
  if (!item) return null;

  const productId = item.id || slugify(item.name);
  
  // Find emojis for the tags the product has
  const productAllergens = React.useMemo(() => (item.tags || []).map(tagName => {
    return allergens.find(a => a.name === tagName && a.type !== 'diet');
  }).filter(Boolean), [item.tags, allergens]);

  const productDiets = React.useMemo(() => (item.tags || []).map(tagName => {
    return allergens.find(a => a.name === tagName && a.type === 'diet');
  }).filter(Boolean), [item.tags, allergens]);
  
  // Use stock_status from database (Supabase)
  const isOut = item.stock_status === 'out';
  
  const product = React.useMemo(() => ({
    ...item,
    productId,
    id: isOut ? undefined : productId,
    title: item.name,
    name: item.name,
    subtitle: item.desc || item.description,
    description: item.description || item.desc,
    price: item.price,
    image: item.image || item.image_url,
    image_url: item.image_url || item.image,
  }), [item, productId, isOut]);

  const imageSrc = getProductImage(product);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  React.useEffect(() => {
    setImgLoaded(false);
  }, [imageSrc]);

  const handleQuickView = React.useCallback(() => onQuickView?.(product), [onQuickView, product]);

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

    onAdd?.({ productId, name: item.name, price: item.price, qty: 1, packaging_fee: item.packaging_fee, image_url: item.image_url || item.image });
  };

  // VARIANTES DE DISEÑO
  const isCompact = variant === "compact";
  const isMinimal = variant === "minimal";
  const isCompactGrid = variant === "compact-grid";
  const isWide = variant === "wide";
  const isHeroSpotlight = variant === "hero-spotlight";

  if (isHeroSpotlight) {
    return (
      <article
        className={`group relative flex flex-col h-full rounded-2xl bg-white p-3.5 sm:p-4 border border-amber-300/80 hover:border-amber-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden ${
          isOut ? "opacity-70 grayscale" : ""
        }`}
        onClick={handleQuickView}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
      >
        {/* Bento del Día Top Badge */}
        {item.is_bento_del_dia && (
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-full border border-amber-300/80 shadow-2xs">
              <span className="inline-block animate-pulse">🔥</span> {item.daily_special_label || "Plato del Día"}
            </span>
            {item.original_price && item.original_price > item.price && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Ahorras {formatCOP(item.original_price - item.price)}
              </span>
            )}
          </div>
        )}

        {/* Big Hero Image */}
        {imageSrc && (
          <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 mb-3 shrink-0">
            <AAImage
              src={imageSrc}
              alt={item.name || "Producto"}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(false)}
              className={`h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              width={600}
              height={450}
            />
            {/* Allergens / Diets badge */}
            {(productAllergens.length > 0 || productDiets.length > 0) && (
              <div className="absolute top-2.5 right-2.5 flex gap-1 items-center z-10 pointer-events-none">
                {productDiets.map((diet) => (
                  <span key={diet.id} title={diet.name} className="bg-black/50 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/20 text-white text-[11px] leading-none">
                    {diet.emoji}
                  </span>
                ))}
                {productAllergens.map((alg) => (
                  <span key={alg.id} title={alg.name} className="bg-red-950/70 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-red-400/30 text-white text-[11px] leading-none">
                    {alg.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col flex-1">
          <h3 className="font-extrabold text-neutral-900 text-base sm:text-lg leading-snug tracking-tight group-hover:text-amber-800 transition-colors">
            {item.name}
          </h3>

          {item.desc && (
            <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-neutral-700">
              {item.desc}
            </p>
          )}

          {/* Bloque Fórmula Completa de Almuerzo */}
          <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/80">
                Almuerzo Completo Incluido
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Listo para servir
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs font-bold text-amber-950">
                <span>🍲</span>
                <span className="truncate">Sopa 16 oz (o Fruta)</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs font-bold text-amber-950">
                <span>🥤</span>
                <span className="truncate">Bebida 5 oz</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs font-bold text-amber-950">
                <span>🫘</span>
                <span className="truncate">Principio Casero</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs font-bold text-amber-950">
                <span>🍚</span>
                <span className="truncate">Seco Tradicional</span>
              </div>
            </div>
          </div>

          {/* Badges de Dietas y Alérgenos */}
          {(productDiets.length > 0 || productAllergens.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {productDiets.map((diet) => (
                <span key={diet.id} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span>{diet.emoji}</span>
                  <span>{diet.name}</span>
                </span>
              ))}
              {productAllergens.map((alg) => (
                <span key={alg.id} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  <span>{alg.emoji}</span>
                  <span>Contiene {alg.name}</span>
                </span>
              ))}
            </div>
          )}

          {/* Micro-banner ecológico */}
          <div className="mt-3 text-[10px] text-neutral-400 flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Empaque kraft térmico biodegradable incluido</span>
          </div>

          {/* Price & CTA Button */}
          <div className="mt-auto pt-3.5 flex items-center justify-between gap-3 border-t border-neutral-100">
            <div className="flex flex-col">
              {item.original_price && item.original_price > item.price && (
                <span className="text-xs text-neutral-400 line-through font-bold leading-none mb-0.5">
                  {formatCOP(item.original_price)}
                </span>
              )}
              <div className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                {typeof item.price === "number" ? formatCOP(item.price) : item.price}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isOut}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-primary hover:brightness-105 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>Pedir</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    );
  }

  if (isMinimal) {
    return (
      <article
        className={`group relative flex items-center justify-between p-3 transition-all duration-300 ${
          isOut ? "opacity-70 grayscale" : "hover:bg-neutral-50"
        } rounded-xl bg-white border-b border-neutral-100 last:border-0`}
        onClick={handleQuickView}
      >
        <div className="flex flex-col flex-1 pr-4">
          <h3 className="text-sm font-bold text-neutral-900 leading-tight">{item.name}</h3>
          {item.desc && <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{item.desc}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            {item.original_price && item.original_price > item.price && (
              <span className="text-[10px] text-neutral-400 line-through font-semibold leading-none">
                {formatCOP(item.original_price)}
              </span>
            )}
            <span className="text-[13px] font-extrabold text-neutral-900 pr-1">
              {typeof item.price === "number" ? formatCOP(item.price) : item.price}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOut}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-brand-primary text-white font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40"
          >
            <span style={{ transform: "translateY(-1px)" }}>+</span>
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative flex h-full w-full overflow-hidden transition-all duration-300 ${
        isOut ? "opacity-70 grayscale" : "hover:shadow-xl hover:-translate-y-1"
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-2xl bg-white text-neutral-900 border border-black/5 ${
        isCompact ? "p-1.5 flex-row" : "p-1 md:p-2.5 flex-col"
      } ${
        isCompactGrid ? "p-1 flex-col" : ""
      } ${
        isHero ? "lg:flex-row" : ""
      }`}
      onClick={handleQuickView}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {imageSrc ? (
        <div className={`relative overflow-hidden ${
          isCompact ? "h-20 w-20 rounded-xl flex-shrink-0" 
          : isHero ? "w-full aspect-[4/3] lg:w-1/2 lg:aspect-auto lg:h-full lg:self-stretch rounded-xl shrink-0" 
          : "w-full aspect-[4/3] rounded-xl shrink-0"
        }`}>
          <AAImage
            src={imageSrc}
            alt={item.name || "Producto"}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(false)}
            className={`h-full w-full object-cover transition-opacity duration-500 ease-out ${
              isHero ? "lg:absolute lg:inset-0" : ""
            } ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            width={isCompact ? 80 : isHero ? 600 : 400}
            height={isCompact ? 80 : isHero ? 600 : 400}
          />
        </div>
      ) : (
        !isCompact && (
          <div className={`relative flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 ${
            isHero ? "w-full aspect-[4/3] lg:w-1/2 lg:aspect-auto lg:h-full lg:self-stretch rounded-xl shrink-0" 
            : "w-full aspect-[4/3] rounded-xl shrink-0"
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

      <div className={`flex flex-1 flex-col justify-between ${isCompact ? "ml-3 py-1" : "px-2 pb-2 pt-3 md:px-3 md:pb-3 md:pt-4"}`}>
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-bold text-neutral-900 line-clamp-2 tracking-tight ${isCompact || isCompactGrid ? "text-[13px] md:text-sm" : "text-[15px] md:text-base leading-[1.15]"}`}>
              {item.name}
            </h3>
          </div>

          {item.is_bento_del_dia && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                🔥 {item.daily_special_label || "Plato del Día"}
              </span>
            </div>
          )}

          {item.desc && !isCompact && (
            <p className="mt-1.5 text-[12px] sm:text-[13px] leading-[1.35] text-[#717171] line-clamp-2">
              {item.desc}
            </p>
          )}

          {/* Badges de Dietas y Alérgenos SOLO en card grande (isHero) */}
          {isHero && (productDiets.length > 0 || productAllergens.length > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1">
              {productDiets.map((diet) => (
                <span key={diet.id} className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  <span>{diet.emoji}</span>
                  <span>{diet.name}</span>
                </span>
              ))}
              {productAllergens.map((alg) => (
                <span key={alg.id} className="inline-flex items-center gap-1 text-[9px] font-bold text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                  <span>{alg.emoji}</span>
                  <span>{alg.name}</span>
                </span>
              ))}
            </div>
          )}

          {isOut && (
            <div className="mt-2.5">
              <StatusChip intent="neutral">Agotado</StatusChip>
            </div>
          )}
        </div>

        {/* CONTENEDOR DE PRECIO Y BOTON */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {item.original_price && item.original_price > item.price && (
              <span className="text-[11px] md:text-xs text-neutral-400 line-through font-bold leading-none mb-0.5">
                {formatCOP(item.original_price)}
              </span>
            )}
            <div className={`font-extrabold tracking-tight text-neutral-900 ${isCompact || isCompactGrid ? "text-[13px] md:text-sm" : "text-[16px] md:text-lg"}`}>
              {typeof item.price === "number" ? formatCOP(item.price) : item.price}
            </div>
          </div>
          
          <button
            type="button"
            aria-label={`Agregar ${item.name || "producto"}`}
            onClick={handleAdd}
            disabled={isOut}
            className={`flex items-center justify-center rounded-full bg-brand-primary text-white font-bold shadow-md shadow-brand-primary/25 transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 hover:scale-110 ${
              isCompact || isCompactGrid ? "h-8 w-8 text-[18px]" : "h-9 w-9 md:h-10 md:w-10 text-[20px] md:text-[22px] leading-none"
            }`}
          >
            <span style={{ transform: "translateY(-1px)" }}>+</span>
          </button>
        </div>
      </div>
    </article>
  );
});

export default ProductCard;
