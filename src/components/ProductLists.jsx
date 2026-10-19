import React, { useMemo, useEffect, useCallback, useState, useRef } from "react";
import { FixedSizeList } from "react-window";
import { useSwipeable } from "react-swipeable";
import { useCart } from "../context/CartContext";
import { useMenuData } from "../context/MenuDataContext";
import { formatCOP } from "../utils/money";
import { getStockFlags, getStockState, slugify, isUnavailable } from "../utils/stock";
 import { toast } from "./Toast";
import { matchesQuery } from "../utils/strings";
 import { StatusChip } from "./Buttons";
 import Section from "./Section";
 import ProductSection from "./ProductSection";


import ProductQuickView from "./ProductQuickView";
import DIYProductModal from "./DIYProductModal";
import ProductCard from "./ProductCard";
import { getProductImage } from "../utils/images";
import CategoryHeader from "./CategoryHeader";
import CategoryNav from "./CategoryNav";
import AAImage from "./ui/AAImage";
import { Icon } from "@iconify-icon/react";
import { categoryIcons } from "../data/categoryIcons";
import CategoryBanner from "./CategoryBanner";
import LoadingScreen from "./ui/LoadingScreen";

export default function ProductLists({
  query,
  selectedCategory,
  onCategorySelect,
  featureTabs = false,
  renderAfter,
  countValue,
  variant = "standard", // standard, simple-list, grid, wide-grid
  hideNav = false
}) {
  const { categories: dbCategories, getProductsByCategory, getAllProducts, banners, experiences, allergens = [], loading: menuLoading } = useMenuData();
  const [counts, setCounts] = useState({});
  const manualRef = useRef(false);
  const scrollerRef = useRef(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState(null);
  const [diyOpen, setDiyOpen] = useState(false);
  const [diyProduct, setDiyProduct] = useState(null);
  const [selectedDiets, setSelectedDiets] = useState([]);

  const toggleDiet = (dietName) => {
    setSelectedDiets(prev => 
      prev.includes(dietName) 
        ? prev.filter(d => d !== dietName) 
        : [...prev, dietName]
    );
  };

  const categories = useMemo(() => {
    return dbCategories.map(dbCat => ({
      ...dbCat,
      id: dbCat.slug,
      label: dbCat.name,
      targetId: dbCat.target_id || `section-${dbCat.slug}`,
      tintClass: dbCat.tint_class || "bg-white",
      is_schedule_active: dbCat.is_schedule_active,
      schedule_label: dbCat.schedule_label,
      schedule_info: dbCat.schedule_info,
    }));
  }, [dbCategories]);

  const onQuickView = useCallback((p) => {
    if (!p) return;
    if (p.configOptions?.is_diy) {
      setDiyProduct(p);
      setDiyOpen(true);
    } else {
      setQuickProduct(p);
      setQuickOpen(true);
    }
  }, []);

  const setCount = useCallback((id, n) => {
    setCounts((prev) => (prev[id] === n ? prev : { ...prev, [id]: n }));
  }, []);

  // Helper to find a customizable product for a banner
  const getBannerProductForCategory = (catId) => {
    const products = getProductsByCategory(catId);
    return products.find(p => p.configOptions?.creator_type);
  };

  // Permite abrir QuickView desde otros componentes
  useEffect(() => {
    const onGlobalQV = (e) => {
      const incoming = e?.detail;
      if (!incoming) return;

      const pId = incoming.productId || incoming.id;
      // Hydrate with full product from context if available
      const allProducts = getAllProducts ? getAllProducts() : [];
      const dbProduct = allProducts.find(x => x.id === pId);

      const p = {
        ...dbProduct,
        ...incoming,
        id: dbProduct?.id || pId,
        productId: dbProduct?.id || pId,
        // Ensure image fields are preserved or normalized
        image: incoming.image || dbProduct?.image,
        image_url: incoming.image_url || dbProduct?.image_url
      };

      if (p.configOptions?.is_diy) {
        setDiyProduct(p);
        setDiyOpen(true);
      } else {
        setQuickProduct(p);
        setQuickOpen(true);
      }
    };
    window.addEventListener("aa:quickview", onGlobalQV);
    return () => window.removeEventListener("aa:quickview", onGlobalQV);
  }, [getAllProducts]);
 
  const tabItems = useMemo(() => {
    return [{ id: "todos", label: "Todos" }, ...categories].map((c) => ({
      ...c,
      label: c.label || c.id,
      icon: categoryIcons[c.id],
      tintClass: c.tintClass,
    }));
  }, [categories]);
  // Deriving counts from the processed sections later
 
  const sections = useMemo(() => {
    return categories.map(cat => {
      const allItems = getProductsByCategory(cat.slug);
      const items = allItems.filter(it => {
        const matchesQueryText = matchesQuery({ title: it.name, description: it.desc }, query);
        const matchesDiets = selectedDiets.length === 0 || selectedDiets.every(d => it.tags?.includes(d));
        return matchesQueryText && matchesDiets;
      });

      const config = cat.visibility_config || {};
      const definedSubs = config.subcategories || [];

      const visConfig = cat.visibility_config || {};
      const bannerProduct = getBannerProductForCategory(cat.slug);
      
      // Use explicit show_banner from config, or fallback to existing logic
      const showBanner = visConfig.show_banner !== false && (cat.banner_image_url || bannerProduct) && !query;
      const bannerStyle = visConfig.banner_style || 'floating';

      // If banner is active and displaying the product, exclude it from the cards list so it does not duplicate
      const displayItems = (showBanner && bannerProduct)
        ? items.filter(it => it.id !== bannerProduct.id)
        : items;

      // Unified Logic to build groups if subcategories are defined or products have subcategories
      let categoryGroups = null;
      const productSubs = Array.from(new Set(displayItems.map(p => p.subcategory).filter(Boolean)));
      const effectiveSubs = definedSubs.length > 0 ? definedSubs : productSubs;

      if (effectiveSubs.length > 0) {
        const grouped = {};
        const others = [];

        displayItems.forEach(p => {
          const sub = p.subcategory;
          if (sub && (effectiveSubs.includes(sub) || productSubs.includes(sub))) {
            const groupKey = sub;
            if (!grouped[groupKey]) grouped[groupKey] = [];
            grouped[groupKey].push(p);
          } else {
            others.push(p);
          }
        });

        const groupsToRender = effectiveSubs
          .map(title => ({
            title,
            items: grouped[title] || []
          }))
          .filter(g => g.items.length > 0);

        productSubs.forEach(extraSub => {
          if (!effectiveSubs.includes(extraSub) && grouped[extraSub]?.length > 0) {
            groupsToRender.push({
              title: extraSub,
              items: grouped[extraSub]
            });
          }
        });
        
        if (others.length > 0) {
          groupsToRender.push({
            title: 'Otros',
            items: others
          });
        }

        categoryGroups = groupsToRender;
      }

      const bannerEl = showBanner ? (
        <CategoryBanner 
          category={cat}
          product={bannerProduct} 
          onOpenBuilder={bannerProduct ? () => onQuickView(bannerProduct) : undefined} 
        />
      ) : null;

      const element = (
        <ProductSection
          id={cat.slug}
          title={cat.name}
          query={query}
          items={displayItems}
          groups={categoryGroups}
          variant={config.section_type || 'standard'}
          heroId={config.hero_featured_product_id}
          onCount={(n) => setCount(cat.slug, n)}
          onQuickView={onQuickView}
          renderHeader={showBanner ? () => bannerEl : undefined}
          isScheduleActive={cat.is_schedule_active !== false}
          scheduleLabel={cat.schedule_label}
          scheduleInfo={cat.schedule_info}
        />
      );

      return {
        id: cat.slug,
        element,
        count: items.length
      };
    }).filter(s => {
      if (!query) return true;
      return s.count > 0;
    });
  }, [
    categories,
    getProductsByCategory,
    query,
    counts,
    onQuickView,
    variant,
    selectedDiets
  ]);
  const renderPanel = (s, inTodos = false) => {
    return (
      <div
        key={s.id}
        id={`panel-${s.id}${inTodos ? "-todos" : ""}`}
        role="tabpanel"
        tabIndex={-1}
        aria-labelledby={`tab-${s.id}${inTodos ? "-todos" : ""}`}
        className="will-change-transform contain-content [transform:translateZ(0)]"
      >
        {inTodos && (
          <span id={`tab-${s.id}-todos`} className="sr-only">
            {categories.find((c) => c.id === s.id)?.label || s.id}
          </span>
        )}
        {s.element}
      </div>
    );
  };
 
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
 
  const filtersToSingleSection = (featureTabs || hideNav) && selectedCategory !== "todos";

  useEffect(() => {
    // Solo observar secciones en modo barra y cuando no está activo 'todos'
    if (filtersToSingleSection || selectedCategory === "todos") return;
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
   }, [categories, filtersToSingleSection, selectedCategory, onCategorySelect, sections]);
 
  const stackClass = filtersToSingleSection ? "" : "space-y-6";

  const hasIndexState =
    typeof setActiveCategoryIndex === "function" ||
    typeof setActiveListIndex === "function";

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (e) => {
      if (e?.event?.target?.closest?.('[data-no-swipe], [data-slider="true"], .group\\/slider')) return;
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
    onSwipedRight: (e) => {
      if (e?.event?.target?.closest?.('[data-no-swipe], [data-slider="true"], .group\\/slider')) return;
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
    preventDefaultTouchmoveEvent: false,
  });

  const _safeSwipeHandlers = hideNav ? {} : (swipeHandlers || {});

  const dynamicDiets = useMemo(() => allergens.filter(a => a.type === 'diet'), [allergens]);

  if (menuLoading) return <LoadingScreen mode="skeleton" />;

  return (
    <>
      {!hideNav && !featureTabs && <CategoryHeader />}
      {!hideNav && (
        <CategoryNav
          categories={[{ id: "todos", label: "Todos" }, ...categories]}
          activeId={selectedCategory}
          onSelect={(cat) => handleManualSelect(cat)}
          variant="bar"
        />
      )}

      {/* Dietary Filter Bar */}
      {!hideNav && dynamicDiets.length > 0 && (
        <div className="px-4 mb-4 mt-2 overflow-x-auto hide-scrollbar scrollbar-hide flex items-center gap-2">
          {dynamicDiets.map((diet) => {
            const isSelected = selectedDiets.includes(diet.name);
            return (
              <button
                key={diet.id}
                onClick={() => toggleDiet(diet.name)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                  isSelected
                    ? "bg-[#2f4131] border-transparent text-white shadow-sm"
                    : "bg-white border-[#2f4131]/10 text-[#2f4131]/60 hover:border-[#2f4131]/30"
                }`}
              >
                <span>{diet.emoji || "🏷️"}</span>
                <span className="uppercase tracking-wider">{diet.name}</span>
              </button>
            );
          })}
        </div>
      )}
       {query && !Object.values(counts).some((n) => n > 0) && (
        <p className="px-4 text-sm text-neutral-600">No hay resultados para “{query}”.</p>
       )}
      <div ref={scrollerRef} {..._safeSwipeHandlers} className={`${stackClass} hide-scrollbar scrollbar-hide`}>



          {sections.map((s, idx) => {
            if (filtersToSingleSection && s.id !== selectedCategory) {
              return null;
            }
            
            const panels = [renderPanel(s, selectedCategory === "todos")];
            
            return (
              <React.Fragment key={s.id}>
                {panels}
              </React.Fragment>
            );
          })}
       </div>



       <ProductQuickView
         open={quickOpen}
         product={quickProduct}
         onClose={() => setQuickOpen(false)}
         onAdd={() => setQuickOpen(false)}
       />
       {diyOpen && (
         <DIYProductModal
           open={diyOpen}
           product={diyProduct}
           onClose={() => setDiyOpen(false)}
           onAdd={() => setDiyOpen(false)}
         />
       )}
     </>
   );
 }
 
function List({ items, onQuickView }) {
  const ITEM_SIZE = 120;
  const height = Math.min(items.length * ITEM_SIZE, 600);
  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={ITEM_SIZE}
      width="100%"
    >
      {({ index, style }) => (
        <ProductRow
          index={index}
          style={style}
          item={items[index]}
          onQuickView={onQuickView}
        />
      )}
    </FixedSizeList>
  );
}

function ProductRow({ item, onQuickView, style, index }) {
  const { addItem } = useCart();
  const { allergens = [] } = useMenuData() || {};
  const { state: stockState, isSoon, isLow, isOut: outFromStock } = getStockFlags(
    item.id || slugify(item.name),
  );

  const productAllergens = (item.tags || []).map(tagName => {
    return allergens.find(a => a.name === tagName && a.type !== 'diet');
  }).filter(Boolean);

  const productDiets = (item.tags || []).map(tagName => {
    return allergens.find(a => a.name === tagName && a.type === 'diet');
  }).filter(Boolean);
  const isScheduleRestricted = item.is_schedule_available === false;
  const scheduleNotice = item.schedule_label || "Fuera de horario";
  const unavailable = outFromStock || isUnavailable(item);
  const product = {
    ...item,
    productId: item.id,
    id: (unavailable || isScheduleRestricted) ? undefined : item.id,
    title: item.name,
    name: item.name,
    subtitle: item.desc || item.description,
    description: item.description || item.desc,
    price: item.price,
    image: item.image || item.image_url,
    image_url: item.image_url || item.image,
    is_schedule_available: !isScheduleRestricted,
    schedule_label: scheduleNotice,
  };
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgSrc = getProductImage(product);
  useEffect(() => {
    setImgLoaded(false);
  }, [imgSrc]);
  return (
    <article
      className={`group grid ${imgSrc ? "grid-cols-[96px_1fr] md:grid-cols-[112px_1fr]" : "grid-cols-1"} gap-3 rounded-2xl bg-white p-3 text-neutral-900 shadow-sm ring-1 ring-black/5 md:gap-4 md:p-4 ${
        unavailable 
          ? "opacity-75 grayscale bg-neutral-100/75 border border-neutral-300" 
          : isScheduleRestricted 
          ? "opacity-80 saturate-[0.88] bg-neutral-50/60" 
          : ""
      }`}
      style={style}
      data-index={index}
    >
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
          className="block cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 relative overflow-hidden"
        >
          <div
            className={`h-24 w-24 overflow-hidden rounded-xl md:h-28 md:w-28 relative ${
              imgLoaded ? "" : "bg-neutral-200 animate-pulse"
            }`}
          >
            <AAImage
              src={imgSrc}
              alt={item.name || "Producto"}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(false)}
              className={`h-full w-full object-cover ${unavailable ? "grayscale contrast-90 brightness-95" : ""}`}
              width={112}
              height={112}
            />
            {unavailable && (
              <div className="absolute inset-0 bg-neutral-900/35 backdrop-grayscale flex items-center justify-center z-10 pointer-events-none">
                <span className="bg-neutral-900/85 backdrop-blur-md text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Agotado
                </span>
              </div>
            )}
          </div>
        </button>
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
          {(productAllergens.length > 0 || productDiets.length > 0) && (
             <div className="flex gap-1.5 items-center shrink-0">
               {productDiets.length > 0 && (
                 <div className="flex gap-1 items-center bg-[#2f4131]/10 rounded-full px-1.5 py-0.5">
                    {productDiets.map((diet) => (
                       <span key={diet.id} title={diet.name} className="text-[11px] leading-none">
                          {diet.emoji}
                       </span>
                    ))}
                 </div>
               )}
               {productAllergens.length > 0 && (
                 <div className="flex gap-1 items-center bg-red-50 rounded-full px-1.5 py-0.5">
                    {productAllergens.map((alg) => (
                       <span key={alg.id} title={alg.name} className="text-[11px] leading-none">
                          {alg.emoji}
                       </span>
                    ))}
                 </div>
               )}
             </div>
          )}
        </div>
        {item.desc && <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600">{item.desc}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {isSoon ? (
            <StatusChip intent="info">Proximamente</StatusChip>
          ) : isScheduleRestricted ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              🕒 {scheduleNotice}
            </span>
          ) : (
            <>
              {isLow && <StatusChip intent="warn">Pocas unidades</StatusChip>}
              {unavailable && <StatusChip intent="neutral">No Disponible</StatusChip>}
            </>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-base font-semibold text-neutral-900 md:text-[17px]">
              {typeof item.price === "number" ? formatCOP(item.price) : item.price}
            </div>
          </div>
          {isScheduleRestricted ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView?.(product);
              }}
              className="px-3 py-1.5 flex items-center gap-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-bold border border-neutral-200 shadow-2xs cursor-pointer active:scale-95"
              title={scheduleNotice}
            >
              <span>🕒 Info</span>
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Agregar ${item.name || "producto"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (unavailable) {
                  toast("Producto no disponible");
                  return;
                }
                if (isSoon) {
                  toast("Disponible proximamente");
                  return;
                }
                addItem({ productId: item.id, name: item.name, price: item.price, packaging_fee: item.packaging_fee });
              }}
              disabled={unavailable || isSoon}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#2f4131] text-white shadow-sm ring-1 ring-black/5 hover:bg-[#263729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 md:h-11 md:w-11 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
