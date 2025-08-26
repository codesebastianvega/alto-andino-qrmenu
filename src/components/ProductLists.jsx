import { useMemo, useEffect, useCallback, useState, cloneElement, useRef } from "react";
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
import CategoryBar from "./CategoryBar";
import CategoryTabs from "./CategoryTabs";
import { categoryIcons } from "../data/categoryIcons";
import {
  breakfastItems,
  mainDishes,
  dessertBaseItems,
  cumbreFlavors,
  cumbrePrices,
} from "../data/menuItems";
import { CATS } from "../constants/categories";
import useSwipeTabs from "../utils/useSwipeTabs";
export default function ProductLists({
  query,
  selectedCategory,
  onCategorySelect,
  featureTabs = false,
}) {
  const [counts, setCounts] = useState({});
  const manualRef = useRef(false);
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
  const categories = useMemo(
    () => [
      { id: "desayunos", label: "Desayunos", tintClass: "bg-amber-50" },
      { id: "bowls", label: "Bowls", tintClass: "bg-emerald-50" },
      {
        id: "platos",
        label: "Platos Fuertes",
        targetId: "section-platos-fuertes",
        tintClass: "bg-violet-50",
      },
      { id: "sandwiches", label: "Sándwiches", tintClass: "bg-rose-50" },
      {
        id: "smoothies",
        label: "Smoothies & Funcionales",
        targetId: "section-smoothies-funcionales",
        tintClass: "bg-pink-50",
      },
      {
        id: "cafe",
        label: "Café de especialidad",
        targetId: "section-cafe-de-especialidad",
        tintClass: "bg-stone-200",
      },
      {
        id: "bebidasfrias",
        label: "Bebidas frías",
        targetId: "section-bebidas-frias",
        tintClass: "bg-sky-50",
      },
      { id: "postres", label: "Postres" },
    ],
    [query]
  );

  const tabItems = useMemo(
    () =>
      CATS.map((slug) => {
        if (slug === "todos")
          return {
            id: "todos",
            label: "Todos",
            icon: "ph:squares-four",
            tintClass: "bg-stone-100",
          };
        const cat = categories.find((c) => c.id === slug);
        return {
          id: slug,
          label: cat?.label || slug,
          icon: categoryIcons[slug],
          tintClass: cat?.tintClass,
        };
      }),
    [categories]
  );
  const breakfasts = useMemo(
    () =>
      (breakfastItems || []).filter((it) =>
        matchesQuery({ title: it.name, description: it.desc }, query)
      ),
    [query]
  );
  useEffect(() => {
    setCount("desayunos", breakfasts.length);
  }, [breakfasts.length, setCount]);

  const mains = useMemo(
    () =>
      (mainDishes || []).filter((it) =>
        matchesQuery({ title: it.name, description: it.desc }, query)
      ),
    [query]
  );
  useEffect(() => {
    setCount("platos", mains.length);
  }, [mains.length, setCount]);

  const dessertsCumbre = useMemo(
    () => cumbreFlavors.filter((s) => matchesQuery({ title: s.label }, query)),
    [query]
  );
  const dessertsBase = useMemo(
    () =>
      (dessertBaseItems || []).filter((p) =>
        matchesQuery({ title: p.name, description: p.desc }, query)
      ),
    [query]
  );
  const dessertsCount = dessertsCumbre.length + dessertsBase.length;
  useEffect(() => {
    setCount("postres", dessertsCount);
  }, [dessertsCount, setCount]);

  const bowlsEl = (
    <BowlsSection
      query={query}
      onCount={(n) => setCount("bowls", n)}
      onQuickView={onQuickView}
    />
  );
  const sandwichesEl = (
    <Sandwiches
      query={query}
      onCount={(n) => setCount("sandwiches", n)}
      onQuickView={onQuickView}
    />
  );
  const smoothiesEl = (
    <SmoothiesSection
      query={query}
      onCount={(n) => setCount("smoothies", n)}
      onQuickView={onQuickView}
    />
  );
  const coffeeEl = (
    <CoffeeSection
      query={query}
      onCount={(n) => setCount("cafe", n)}
      onQuickView={onQuickView}
    />
  );
  const coldEl = (
    <ColdDrinksSection
      query={query}
      onCount={(n) => setCount("bebidasfrias", n)}
      onQuickView={onQuickView}
    />
  );

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
      element:
        counts.bowls > 0 ? (
          <Section title="Bowls" count={counts.bowls}>{bowlsEl}</Section>
        ) : (
          bowlsEl
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
      element:
        counts.sandwiches > 0 ? (
          <Section title="Sándwiches" count={counts.sandwiches}>
            {sandwichesEl}
          </Section>
        ) : (
          sandwichesEl
        ),
    });
    arr.push({
      id: "smoothies",
      element:
        counts.smoothies > 0 ? (
          <Section title="Smoothies & Funcionales" count={counts.smoothies}>
            {smoothiesEl}
          </Section>
        ) : (
          smoothiesEl
        ),
    });
    arr.push({
      id: "cafe",
      element:
        counts.cafe > 0 ? (
          <Section title="Café de especialidad" count={counts.cafe}>
            {coffeeEl}
          </Section>
        ) : (
          coffeeEl
        ),
    });
    arr.push({
      id: "bebidasfrias",
      element:
        counts.bebidasfrias > 0 ? (
          <Section title="Bebidas frías" count={counts.bebidasfrias}>
            {coldEl}
          </Section>
        ) : (
          coldEl
        ),
    });
    if (dessertsCount) {
      arr.push({
        id: "postres",
        element: (
          <Section title="Postres" count={dessertsCount}>
            <Desserts cumbre={dessertsCumbre} base={dessertsBase} onQuickView={onQuickView} />
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
    counts,
    bowlsEl,
    sandwichesEl,
    smoothiesEl,
    coffeeEl,
    coldEl,
  ]);
  const renderPanel = (s, inTodos = false) => (
    <div
      key={s.id}
      id={`panel-${s.id}${inTodos ? "-todos" : ""}`}
      role="tabpanel"
      tabIndex={-1}
      aria-labelledby={`tab-${s.id}${inTodos ? "-todos" : ""}`}
      className="will-change-transform [transform:translateZ(0)] contain-content overscroll-y-contain"
    >
      {inTodos && (
        <span id={`tab-${s.id}-todos`} className="sr-only">
          {categories.find((c) => c.id === s.id)?.label || s.id}
        </span>
      )}
      {inTodos
        ? cloneElement(s.element, { id: `section-${s.id}-todos` })
        : s.element}
    </div>
  );


  const orderedTabs = CATS;

  const handleManualSelect = useCallback(
    (cat) => {
      manualRef.current = true;
      onCategorySelect?.(cat);
    },
    [onCategorySelect]
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

  const swipeHandlers = useSwipeTabs({ onPrev, onNext });

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
    if (featureTabs && selectedCategory !== "todos") return;
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
      { rootMargin: "0px 0px -50% 0px" }
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

  const stackClass =

    featureTabs && selectedCategory !== "todos" ? "" : "space-y-6";

  return (
    <>
      {!featureTabs && <CategoryHeader />}
      {featureTabs ? (
        <CategoryTabs
          items={tabItems}
          value={selectedCategory}
          onChange={(slug) => {
            if (slug === "todos") {
              handleManualSelect({ id: "todos" });
            } else {
              const cat = categories.find((c) => c.id === slug);
              handleManualSelect(cat ?? { id: "todos" });
            }
          }}
          featureTabs={featureTabs}
        />
      ) : (
        <CategoryBar
          categories={[{ id: "todos", label: "Todos", tintClass: "bg-stone-100" }, ...categories]}
          activeId={selectedCategory}
          onSelect={(cat) => handleManualSelect(cat)}
          variant="chip"
          featureTabs={featureTabs}
        />
      )}
      {query && !Object.values(counts).some((n) => n > 0) && (
        <p className="text-sm text-neutral-600 px-4">
          No hay resultados para “{query}”.
        </p>
      )}
      <div
        {...swipeHandlers}
        className={stackClass}
      >
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
        <div className="rounded-2xl p-5 sm:p-6 shadow-sm bg-white">
          <p className="font-semibold">Cumbre Andino (sin azúcar)</p>
          <p className="text-xs text-neutral-600 mt-1">
            Yogur griego endulzado con alulosa, mermelada natural, galleta sin
            azúcar, chantilly con eritritol y fruta.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  role="button"
                  tabIndex={0}
                  onClick={() => onQuickView?.(product)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onQuickView?.(product);
                    }
                  }}
                  aria-disabled={disabled}
                  className="group grid grid-cols-[96px_1fr] md:grid-cols-[112px_1fr] gap-3 md:gap-4 p-3 md:p-4 rounded-3xl bg-white border border-black/5 dark:bg-neutral-900 dark:border-white/10 shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_24px_-10px_rgba(0,0,0,0.18)] hover:shadow-[0_1px_0_rgba(0,0,0,0.03),0_16px_30px_-10px_rgba(0,0,0,0.22)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
                >
                  <img
                    src={getProductImage(product)}
                    alt={"Cumbre Andino"}
                    loading="lazy"
                    className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex flex-col">
                    <h3 className="text-base md:text-[17px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{s.label}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {st === "low" && (
                        <StatusChip variant="low">Pocas unidades</StatusChip>
                      )}
                      {st === "out" && (
                        <StatusChip variant="soldout">No Disponible</StatusChip>
                      )}
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                      <div>
                        <div className="text-base md:text-[17px] font-semibold text-neutral-900 dark:text-neutral-100">{formatCOP(price)}</div>
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
                        className="h-10 w-10 md:h-11 md:w-11 grid place-items-center rounded-full bg-[#2f4131] hover:bg-[#253525] text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
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
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onQuickView?.(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onQuickView?.(product);
        }
      }}
      aria-disabled={unavailable}
      className="group grid grid-cols-[96px_1fr] md:grid-cols-[112px_1fr] gap-3 md:gap-4 p-3 md:p-4 rounded-3xl bg-white border border-black/5 dark:bg-neutral-900 dark:border-white/10 shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_24px_-10px_rgba(0,0,0,0.18)] hover:shadow-[0_1px_0_rgba(0,0,0,0.03),0_16px_30px_-10px_rgba(0,0,0,0.22)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
    >
      <img
        src={getProductImage(product)}
        alt={item.name || "Producto"}
        loading="lazy"
        className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover"
      />
      <div className="min-w-0 flex flex-col">
        <h3 className="text-base md:text-[17px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{item.name}</h3>
        {item.desc && (
          <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">{item.desc}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
          {unavailable && <StatusChip variant="soldout">No Disponible</StatusChip>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="text-base md:text-[17px] font-semibold text-neutral-900 dark:text-neutral-100">
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
            className="h-10 w-10 md:h-11 md:w-11 grid place-items-center rounded-full bg-[#2f4131] hover:bg-[#253525] text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
