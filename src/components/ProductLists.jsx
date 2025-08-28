import { useMemo, useEffect, useCallback, useState, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { useCart } from "../context/CartContext";
import { formatCOP } from "../utils/money";
import { getStockState, slugify, isUnavailable } from "../utils/stock";
 import { toast } from "./Toast";
import { matchesQuery } from "../utils/strings";
 import { StatusChip } from "./Buttons";
 import Section from "./Section";
 import Sandwiches from "./Sandwiches";
 import SmoothiesSection from "./SmoothiesSection";
 import CoffeeSection from "./CoffeeSection";
 import BowlsSection from "./BowlsSection";
 import ColdDrinksSection from "./ColdDrinksSection";
 import ProductQuickView from "./ProductQuickView";
import { getProductImage } from "../utils/images";
 import CategoryHeader from "./CategoryHeader";
 import CategoryNav from "./CategoryNav";
import AAImage from "./ui/AAImage";
 import {
   breakfastItems,
   mainDishes,
   dessertBaseItems,
   cumbreFlavors,
   cumbrePrices,
} from "../data/menuItems";
import { CATEGORIES_LIST, TABS_ITEMS } from "../config/categories";
 export default function ProductLists({
   query,
   selectedCategory,
   onCategorySelect,
   featureTabs = false,
 }) {
  const [counts, setCounts] = useState({});
  const manualRef = useRef(false);
  const scrollerRef = useRef(null);
   const [quickOpen, setQuickOpen] = useState(false);
   const [quickProduct, setQuickProduct] = useState(null);
   const onQuickView = useCallback((p) => {
     if (!p) return;
     setQuickProduct(p);
     setQuickOpen(true);
   }, []);
   const setCount = useCallback((id, n) => {
     setCounts((prev) => (prev[id] === n ? prev : { ...prev, [id]: n }));
   }, []);
  const categories = useMemo(() => CATEGORIES_LIST, []);
 
  const tabItems = useMemo(() => TABS_ITEMS(categories), [categories]);
   const breakfasts = useMemo(
     () =>
       (breakfastItems || []).filter((it) =>
        matchesQuery({ title: it.name, description: it.desc }, query),
       ),
    [query],
   );
   useEffect(() => {
     setCount("desayunos", breakfasts.length);
   }, [breakfasts.length, setCount]);
 
   const mains = useMemo(
     () =>
       (mainDishes || []).filter((it) =>
        matchesQuery({ title: it.name, description: it.desc }, query),
       ),
    [query],
   );
   useEffect(() => {
     setCount("platos", mains.length);
   }, [mains.length, setCount]);
 
   const dessertsCumbre = useMemo(
     () => cumbreFlavors.filter((s) => matchesQuery({ title: s.label }, query)),
    [query],
   );
   const dessertsBase = useMemo(
     () =>
       (dessertBaseItems || []).filter((p) =>
        matchesQuery({ title: p.name, description: p.desc }, query),
       ),
    [query],
   );
   const dessertsCount = dessertsCumbre.length + dessertsBase.length;
   useEffect(() => {
     setCount("postres", dessertsCount);
   }, [dessertsCount, setCount]);
 
  const sections = useMemo(() => {
    const arr = [];
    if (breakfasts.length) {
      arr.push({
        id: "desayunos",
         element: (
           <Section title="Desayunos" count={breakfasts.length}>
             <List items={breakfasts} onQuickView={onQuickView} />
           </Section>
         ),
       });
     }
    arr.push({
      id: "bowls",
      element: (
        <Section id="section-bowls" title="Bowls" count={counts["bowls"]}>
          <BowlsSection
            query={query}
            onCount={(n) => setCount("bowls", n)}
            onQuickView={onQuickView}
          />
        </Section>
      ),
    });
     if (mains.length) {
       arr.push({
         id: "platos",
         element: (
           <Section title="Platos Fuertes" count={mains.length}>
             <List items={mains} onQuickView={onQuickView} />
           </Section>
         ),
       });
     }
    arr.push({
      id: "sandwiches",
      element: (
        <Sandwiches
          query={query}
          onCount={(n) => setCount("sandwiches", n)}
          onQuickView={onQuickView}
        />
      ),
    });
    arr.push({
      id: "smoothies",
      element: (
        <SmoothiesSection
          query={query}
          onCount={(n) => setCount("smoothies", n)}
          onQuickView={onQuickView}
        />
      ),
    });
    arr.push({
      id: "cafe",
      element: (
        <CoffeeSection
          query={query}
          onCount={(n) => setCount("cafe", n)}
          onQuickView={onQuickView}
        />
      ),
    });
    arr.push({
      id: "bebidasfrias",
      element: (
        <ColdDrinksSection
          query={query}
          onCount={(n) => setCount("bebidasfrias", n)}
          onQuickView={onQuickView}
        />
      ),
    });
    if (dessertsCount) {
      arr.push({
        id: "postres",
        element: (
          <Section title="Postres" count={dessertsCount}>
            <Desserts
              cumbre={dessertsCumbre}
              base={dessertsBase}
              onQuickView={onQuickView}
            />
          </Section>
        ),
      });
    }
    return arr;
  }, [
    breakfasts,
    mains,
    dessertsCumbre,
    dessertsBase,
    dessertsCount,
    onQuickView,
    query,
    counts,
  ]);
  const renderPanel = (s, inTodos = false) => (
     <div
       key={s.id}
       id={`panel-${s.id}${inTodos ? "-todos" : ""}`}
       role="tabpanel"
       tabIndex={-1}
       aria-labelledby={`tab-${s.id}${inTodos ? "-todos" : ""}`}
      className="overscroll-y-contain will-change-transform contain-content [transform:translateZ(0)]"
     >
       {inTodos && (
         <span id={`tab-${s.id}-todos`} className="sr-only">
           {categories.find((c) => c.id === s.id)?.label || s.id}
         </span>
       )}
      {s.element}
    </div>
  );
 
  const orderedTabs = useMemo(() => ["todos", ...categories.map((c) => c.id)], [categories]);
 
   const handleManualSelect = useCallback(
     (cat) => {
       manualRef.current = true;
       onCategorySelect?.(cat);
     },
    [onCategorySelect],
   );
 
   const onPrev = useCallback(() => {
     const idx = orderedTabs.indexOf(selectedCategory);
     if (idx > 0) {
       const prev = orderedTabs[idx - 1];
       if (prev === "todos") {
         handleManualSelect({ id: "todos" });
       } else {
         const cat = categories.find((c) => c.id === prev);
         handleManualSelect(cat ?? { id: prev });
       }
     }
   }, [selectedCategory, categories, orderedTabs, handleManualSelect]);
 
   const onNext = useCallback(() => {
     const idx = orderedTabs.indexOf(selectedCategory);
     if (idx >= 0 && idx < orderedTabs.length - 1) {
       const nxt = orderedTabs[idx + 1];
       if (nxt === "todos") {
         handleManualSelect({ id: "todos" });
       } else {
         const cat = categories.find((c) => c.id === nxt);
         handleManualSelect(cat ?? { id: nxt });
       }
     }
   }, [selectedCategory, categories, orderedTabs, handleManualSelect]);

   useEffect(() => {
     if (!manualRef.current) return;
     const reset = () => {
       manualRef.current = false;
       window.removeEventListener("scroll", reset);
     };
     window.addEventListener("scroll", reset, { passive: true });
     return () => window.removeEventListener("scroll", reset);
   }, [selectedCategory]);
 
  useEffect(() => {
    // Solo observar secciones en modo barra y cuando no está activo 'todos'
    if (featureTabs || selectedCategory === "todos") return;
    const map = {};
    const observer = new IntersectionObserver(
       (entries) => {
         entries.forEach((entry) => {
           if (entry.isIntersecting && !manualRef.current) {
             const id = map[entry.target.id];
             if (id && id !== selectedCategory) {
               onCategorySelect?.({ id });
             }
           }
         });
       },
      { rootMargin: "0px 0px -50% 0px" },
     );
 
     categories.forEach((cat) => {
       const el = document.getElementById(cat.targetId || `section-${cat.id}`);
       if (el) {
         map[el.id] = cat.id;
         observer.observe(el);
       }
     });
 
     return () => observer.disconnect();
   }, [categories, featureTabs, selectedCategory, onCategorySelect, sections]);
 
  const stackClass = featureTabs && selectedCategory !== "todos" ? "" : "space-y-6";

  const hasIndexState =
    typeof setActiveCategoryIndex === "function" ||
    typeof setActiveListIndex === "function";

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (hasIndexState) {
        if (typeof setActiveCategoryIndex === "function")
          setActiveCategoryIndex((prev) => prev + 1);
        if (typeof setActiveListIndex === "function")
          setActiveListIndex((prev) => prev + 1);
      } else if (typeof onNext === "function") {
        onNext();
      } else {
        const el = scrollerRef.current;
        if (el)
          el.scrollBy({
            left: Math.round(el.clientWidth * 0.8),
            behavior: "smooth",
          });
      }
    },
    onSwipedRight: () => {
      if (hasIndexState) {
        if (typeof setActiveCategoryIndex === "function")
          setActiveCategoryIndex((prev) => Math.max(0, prev - 1));
        if (typeof setActiveListIndex === "function")
          setActiveListIndex((prev) => Math.max(0, prev - 1));
      } else if (typeof onPrev === "function") {
        onPrev();
      } else {
        const el = scrollerRef.current;
        if (el)
          el.scrollBy({
            left: -Math.round(el.clientWidth * 0.8),
            behavior: "smooth",
          });
      }
    },
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
  });

  const _safeSwipeHandlers = swipeHandlers || {};

  return (
     <>
      {!featureTabs && <CategoryHeader />}
      <CategoryNav
        categories={[{ id: "todos", label: "Todos" }, ...categories]}
        activeId={selectedCategory}
        onSelect={(cat) => handleManualSelect(cat)}
        variant="bar"
      />
       {query && !Object.values(counts).some((n) => n > 0) && (
        <p className="px-4 text-sm text-neutral-600">No hay resultados para “{query}”.</p>
       )}
      <div ref={scrollerRef} {..._safeSwipeHandlers} className={stackClass}>
         {sections.map((s) => {
           if (featureTabs && selectedCategory !== "todos" && s.id !== selectedCategory) {
             return null;
           }
           return renderPanel(s, selectedCategory === "todos");
         })}
       </div>
       <ProductQuickView
         open={quickOpen}
         product={quickProduct}
         onClose={() => setQuickOpen(false)}
         onAdd={() => setQuickOpen(false)}
       />
     </>
   );
 }
 
 function Desserts({ cumbre = [], base = [], onQuickView }) {
   const { addItem } = useCart();
   if (!cumbre.length && !base.length) return null;
 
   return (
     <div className="space-y-4">
       {cumbre.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6 overflow-hidden">
           <p className="font-semibold">Cumbre Andino (sin azúcar)</p>
          <p className="mt-1 text-xs text-neutral-600">
            Yogur griego endulzado con alulosa, mermelada natural, galleta sin azúcar, chantilly con
            eritritol y fruta.
           </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
             {cumbre.map((s) => {
               const id = "cumbre:" + s.id;
               const st = getStockState(id);
               const disabled = st === "out";
               const price = cumbrePrices[s.id];
               const product = {
                 productId: "cumbre",
                 id: disabled ? undefined : id,
                 title: "Cumbre Andino",
                 name: "Cumbre Andino",
                 subtitle: s.label,
                 price,
                 options: { Sabor: s.label },
               };
               return (
                <article
                  key={s.id}
                  className={`group grid grid-cols-[96px_1fr] gap-3 rounded-2xl bg-white p-3 text-neutral-900 shadow-sm ring-1 ring-black/5 md:grid-cols-[112px_1fr] md:gap-4 md:p-4 ${disabled ? "opacity-70 grayscale" : ""}`}
                 >
                   <button
                     type="button"
                     onClick={() => onQuickView?.(product)}
                     onKeyDown={(e) => {
                       if (e.key === "Enter" || e.key === " ") {
                         e.preventDefault();
                         onQuickView?.(product);
                       }
                     }}
                     aria-label={`Ver ${product.title || product.name || "producto"}`}
                    className="block cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
                   >
                     <AAImage
                       src={getProductImage(product)}
                       alt={"Cumbre Andino"}
                       className="h-24 w-24 rounded-xl object-cover md:h-28 md:w-28"
                     />
                   </button>
                  <div className="flex min-w-0 flex-col">
                    <h3 className="truncate text-base font-semibold text-neutral-900 md:text-[17px]">
                      {s.label}
                    </h3>
                     <div className="mt-2 flex flex-wrap gap-2">

                      {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
                      {st === "out" && <StatusChip variant="soldout">No Disponible</StatusChip>}
                     </div>
                     <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                       <div>
                        <div className="text-base font-semibold text-neutral-900 md:text-[17px]">
                          {formatCOP(price)}
                        </div>
                       </div>
                       <button
                         type="button"
                         aria-label={`Agregar Cumbre Andino ${s.label}`}
                         onClick={(e) => {
                           e.stopPropagation();
                           if (disabled) {
                             toast("Producto no disponible");
                             return;
                           }
                           addItem({
                             productId: "cumbre",
                             name: "Cumbre Andino",
                             price,
                             options: { Sabor: s.label },
                           });
                         }}
                        className="grid h-10 w-10 place-items-center rounded-full bg-[#2f4131] text-white shadow-sm ring-1 ring-black/5 hover:bg-[#263729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 md:h-11 md:w-11"
                       >
                         +
                       </button>
                     </div>
                   </div>
                 </article>
               );
             })}
           </div>
         </div>
       )}
       {base.length > 0 && (
         <ul className="space-y-3">
           {base.map((p) => (
             <ProductRow key={p.id} item={p} onQuickView={onQuickView} />
           ))}
         </ul>
       )}
      </div>
   );
 }
 
 function List({ items, onQuickView }) {
   return (
     <ul className="space-y-3">
       {items.map((p) => (
         <ProductRow key={p.id} item={p} onQuickView={onQuickView} />
       ))}
     </ul>
   );
 }
 
 function ProductRow({ item, onQuickView }) {
  const { addItem } = useCart();
  const st = getStockState(item.id || slugify(item.name));
  const unavailable = st === "out" || isUnavailable(item);
  const product = {
    productId: item.id,
    id: unavailable ? undefined : item.id,
    title: item.name,
    name: item.name,
    subtitle: item.desc,
    price: item.price,
  };
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgSrc = getProductImage(product);
  useEffect(() => {
    setImgLoaded(false);
  }, [imgSrc]);
  return (
    <article className={`group grid ${imgSrc ? "grid-cols-[96px_1fr] md:grid-cols-[112px_1fr]" : "grid-cols-1"} gap-3 rounded-2xl bg-white p-3 text-neutral-900 shadow-sm ring-1 ring-black/5 md:gap-4 md:p-4 ${unavailable ? "opacity-70 grayscale" : ""}`}>
      {imgSrc && (
        <button
          type="button"
          onClick={() => onQuickView?.(product)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onQuickView?.(product);
            }
          }}
          aria-label={`Ver ${product.title || product.name || "producto"}`}
          className="block cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
        >
          <div
            className={`h-24 w-24 overflow-hidden rounded-xl md:h-28 md:w-28 ${
              imgLoaded ? "" : "bg-neutral-200 animate-pulse"
            }`}
          >
            <AAImage
              src={imgSrc}
              alt={item.name || "Producto"}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(false)}
              className="h-full w-full object-cover"
              width={112}
              height={112}
            />
          </div>
        </button>
      )}
      <div className="flex min-w-0 flex-col">
        <h3 className="truncate text-base font-semibold text-neutral-900 md:text-[17px]">
          {item.name}
        </h3>
        {item.desc && <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600">{item.desc}</p>}
         <div className="mt-2 flex flex-wrap gap-2">
           {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
           {unavailable && <StatusChip variant="soldout">No Disponible</StatusChip>}
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
             onClick={(e) => {
               e.stopPropagation();
               if (unavailable) {
                 toast("Producto no disponible");
                 return;
               }
               addItem({ productId: item.id, name: item.name, price: item.price });
             }}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#2f4131] text-white shadow-sm ring-1 ring-black/5 hover:bg-[#263729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 md:h-11 md:w-11"
           >
             +
           </button>
         </div>
       </div>
     </article>
   );
 }