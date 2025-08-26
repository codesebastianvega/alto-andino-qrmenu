import {
  useMemo,
  useEffect,
  useCallback,
  useRef,
  useState,
  useLayoutEffect,
  cloneElement,
} from "react";
import { useCart } from "../context/CartContext";
import { COP } from "../utils/money";
import { getStockState, slugify } from "../utils/stock";
import { matchesQuery } from "../utils/strings";
import { AddIconButton, StatusChip } from "./Buttons";
import Section from "./Section";
import Sandwiches from "./Sandwiches";
import SmoothiesSection from "./SmoothiesSection";
import CoffeeSection from "./CoffeeSection";
import BowlsSection from "./BowlsSection";
import ColdDrinksSection from "./ColdDrinksSection";
import CategoryHeader from "./CategoryHeader";
import CategoryBar from "./CategoryBar";
import CategoryTabs from "./CategoryTabs";
import { categoryIcons } from "../data/categoryIcons";
import {
  cats,
  breakfastItems,
  mainDishes,
  dessertBaseItems,
  cumbreFlavors,
  cumbrePrices,
} from "../data/menuItems";
import useSwipeTabs from "../utils/useSwipeTabs";
export default function ProductLists({
  query,
  selectedCategory,
  onCategorySelect,
  counts = {},
  featureTabs = false,
}) {
  const visibleCount = counts[selectedCategory] ?? 0;
  const categories = useMemo(
    () => [
      { id: "desayunos", label: "Desayunos" },
      { id: "bowls", label: "Bowls" },
      {
        id: "platos",
        label: "Platos Fuertes",
        targetId: "section-platos-fuertes",
      },
      { id: "sandwiches", label: "Sándwiches" },
      {
        id: "smoothies",
        label: "Smoothies & Funcionales",
        targetId: "section-smoothies-funcionales",
      },
      {
        id: "cafe",
        label: "Café de especialidad",
        targetId: "section-cafe-de-especialidad",
      },
      { id: "bebidasfrias", label: "Bebidas frías", targetId: "section-bebidas-frias" },
      { id: "postres", label: "Postres" },
    ],
    [query]
  );

  const tabItems = useMemo(
    () => [
      { id: "todos", label: "Todos", icon: "fluent-emoji:bookmark-tabs" },
      ...categories
        .filter((c) => c.id !== "postres")
        .map((c) => ({
          id: c.id,
          label: c.label,
          icon: categoryIcons[c.id],
        })),
    ],
    [categories]
  );

  const sections = useMemo(
    () => [
      {
        id: "desayunos",
        element: (
          <Section title="Desayunos" count={counts.desayunos}>
            <Breakfasts query={query} />
          </Section>
        ),
      },
      {
        id: "bowls",
        element: (
          <Section title="Bowls" count={counts.bowls}>
            <BowlsSection query={query} />
          </Section>
        ),
      },
      {
        id: "platos",
        element: (
          <Section title="Platos Fuertes" count={counts.platos}>
            <Mains query={query} />
          </Section>
        ),
      },
      {
        id: "sandwiches",
        element: (
          <Section title="Sándwiches" count={counts.sandwiches}>
            <Sandwiches query={query} />
          </Section>
        ),
      },
      {
        id: "smoothies",
        element: (
          <Section title="Smoothies & Funcionales" count={counts.smoothies}>
            <SmoothiesSection query={query} />
          </Section>
        ),
      },
      {
        id: "cafe",
        element: (
          <Section title="Café de especialidad" count={counts.cafe}>
            <CoffeeSection query={query} />
          </Section>
        ),
      },
      {
        id: "bebidasfrias",
        element: (
          <ColdDrinksSection query={query} count={counts.bebidasfrias} />
        ),
      },
      {
        id: "postres",
        element: (
          <Section title="Postres" count={counts.postres}>
            <Desserts query={query} />
          </Section>
        ),
      },
    ],
    [query, counts]
  );

  const orderedTabs = ["todos", ...cats];
  const activeIndex = Math.max(orderedTabs.indexOf(selectedCategory), 0);

  const panelRefs = useRef({});
  const [activeHeight, setActiveHeight] = useState();

  useLayoutEffect(() => {
    const el = panelRefs.current[selectedCategory];
    if (el) {
      setActiveHeight(el.offsetHeight);
    }
  }, [selectedCategory, counts, query]);

  const onPrev = useCallback(() => {
    const idx = orderedTabs.indexOf(selectedCategory);
    if (idx > 0) {
      const prev = orderedTabs[idx - 1];
      if (prev === "todos") {
        onCategorySelect?.({ id: "todos" });
      } else {
        const cat = categories.find((c) => c.id === prev);
        onCategorySelect?.(cat ?? { id: prev });
      }
    }
  }, [selectedCategory, categories, onCategorySelect]);

  const onNext = useCallback(() => {
    const idx = orderedTabs.indexOf(selectedCategory);
    if (idx >= 0 && idx < orderedTabs.length - 1) {
      const nxt = orderedTabs[idx + 1];
      if (nxt === "todos") {
        onCategorySelect?.({ id: "todos" });
      } else {
        const cat = categories.find((c) => c.id === nxt);
        onCategorySelect?.(cat ?? { id: nxt });
      }
    }
  }, [selectedCategory, categories, onCategorySelect]);

  const swipeHandlers = useSwipeTabs({ onPrev, onNext });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCategory]);

  const sectionStackClass =
    featureTabs && selectedCategory !== "todos" ? "" : "space-y-6";

  return (
    <>
      <div className="mx-auto max-w-screen-md px-4 md:px-6">
        {!featureTabs && (
          <CategoryHeader
            selectedCategory={selectedCategory}
            visibleCount={visibleCount}
          />
        )}
        <div className="-mx-4 md:-mx-6 px-4 md:px-6">
          {featureTabs ? (
            <CategoryTabs
              items={tabItems}
              value={selectedCategory}
              onChange={(slug) => {
                if (slug === "todos") {
                  onCategorySelect?.({ id: "todos" });
                } else {
                  const cat = categories.find((c) => c.id === slug);
                  onCategorySelect?.(cat ?? { id: "todos" });
                }
              }}
            />
          ) : (
            <CategoryBar
              categories={[{ id: "todos", label: "Todos" }, ...categories]}
              activeId={selectedCategory}
              onSelect={(cat) => {
                if (cat.id === "todos") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  onCategorySelect?.({ id: "todos" });
                } else {
                  onCategorySelect?.(cat);
                }
              }}
              variant="chip"
            />
          )}
        </div>
      </div>
      <div
        {...swipeHandlers}
        className="overflow-hidden"
        style={{ height: activeHeight }}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {orderedTabs.map((id) => (
            <div
              key={id}
              className="w-full flex-shrink-0"
              ref={(el) => {
                if (el) panelRefs.current[id] = el;
              }}
            >
              <div
                id={`panel-${id}`}
                role="tabpanel"
                tabIndex={-1}
                aria-labelledby={`tab-${id}`}
                className={sectionStackClass}
              >
                {id === "todos"
                  ? sections.map((s) =>
                      cloneElement(s.element, {
                        id: `section-${s.id}-todos`,
                        key: s.id,
                      })
                    )
                  : sections
                      .filter((s) => s.id === id)
                      .map((s) => cloneElement(s.element, { key: s.id }))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Breakfasts({ query }) {
  const items = (breakfastItems || []).filter((it) =>
    matchesQuery({ title: it.name, description: it.desc }, query)
  );
  if (!items.length) return null;
  return <List items={items} />;
}

function Mains({ query }) {
  const items = (mainDishes || []).filter((it) =>
    matchesQuery({ title: it.name, description: it.desc }, query)
  );
  if (!items.length) return null;
  return <List items={items} />;
}

function Desserts({ query }) {
  const { addItem } = useCart();

  // Sabores + precios específicos (según tu instrucción)
  const filteredCumbre = cumbreFlavors.filter((s) =>
    matchesQuery({ title: s.label }, query)
  );
  const base = (dessertBaseItems || []).filter((p) =>
    matchesQuery({ title: p.name, description: p.desc }, query)
  );

  if (!filteredCumbre.length && !base.length) return null;

  return (
    <div className="space-y-4">
      {filteredCumbre.length > 0 && (
        <div className="rounded-2xl p-5 sm:p-6 shadow-sm bg-white">
          <p className="font-semibold">Cumbre Andino (sin azúcar)</p>
          <p className="text-xs text-neutral-600 mt-1">
            Yogur griego endulzado con alulosa, mermelada natural, galleta sin
            azúcar, chantilly con eritritol y fruta.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredCumbre.map((s) => {
              const id = "cumbre:" + s.id;
              const st = getStockState(id);
              const disabled = st === "out";
              const price = cumbrePrices[s.id];
              return (
                <div
                  key={s.id}
                  className={
                    "relative rounded-xl border border-neutral-200/60 bg-white p-4 sm:p-5 pr-20 pb-12 " +
                    (disabled ? "opacity-60" : "")
                  }
                >
                  <p className="text-sm">{s.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {st === "low" && (
                      <StatusChip variant="low">Pocas unidades</StatusChip>
                    )}
                    {st === "out" && (
                      <StatusChip variant="soldout">No Disponible</StatusChip>
                    )}
                  </div>
                  <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
                    ${COP(price)}
                  </div>
                  <AddIconButton
                    className="absolute bottom-4 right-4 z-20"
                    aria-label={"Añadir Cumbre Andino " + s.label}
                    onClick={() =>
                      addItem({
                        productId: "cumbre",
                        name: "Cumbre Andino",
                        price,
                        options: { Sabor: s.label },
                      })
                    }
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {base.length > 0 && (
        <ul className="space-y-3">
          {base.map((p) => (
            <ProductRow key={p.id} item={p} />
          ))}
        </ul>
      )}

    </div>
  );
}

function List({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((p) => (
        <ProductRow key={p.id} item={p} />
      ))}
    </ul>
  );
}

function ProductRow({ item }) {
  const { addItem } = useCart();
  const st = getStockState(item.id || slugify(item.name));
  const disabled = st === "out";
  return (
    <li className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12">
      <p className="font-semibold">{item.name}</p>
      <p className="text-xs text-neutral-600 mt-1">{item.desc}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
        {st === "out" && (
          <StatusChip variant="soldout">No Disponible</StatusChip>
        )}
      </div>
      <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
        ${COP(item.price)}
      </div>
      <AddIconButton
        className="absolute bottom-4 right-4 z-20"
        aria-label={"Añadir " + item.name}
        onClick={() =>
          addItem({ productId: item.id, name: item.name, price: item.price })
        }
        disabled={disabled}
      />
    </li>
  );
}
