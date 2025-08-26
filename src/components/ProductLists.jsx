import { useEffect, useMemo } from "react";
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
} from "../data/menuItems";
import useSwipeTabs from "../utils/useSwipeTabs";

const FEATURE_TABS = import.meta.env.VITE_FEATURE_TABS === "1";
export default function ProductLists({
  query,
  selectedCategory,
  onCategorySelect,
  counts = {},
}) {
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
          <Section title="Desayunos">
            <Breakfasts query={query} />
          </Section>
        ),
      },
      {
        id: "bowls",
        element: (
          <Section title="Bowls">
            <BowlsSection query={query} />
          </Section>
        ),
      },
      {
        id: "platos",
        element: (
          <Section title="Platos Fuertes">
            <Mains query={query} />
          </Section>
        ),
      },
      {
        id: "sandwiches",
        element: (
          <Section title="Sándwiches">
            <Sandwiches query={query} />
          </Section>
        ),
      },
      {
        id: "smoothies",
        element: (
          <Section title="Smoothies & Funcionales">
            <SmoothiesSection query={query} />
          </Section>
        ),
      },
      {
        id: "cafe",
        element: (
          <Section title="Café de especialidad">
            <CoffeeSection query={query} />
          </Section>
        ),
      },
      { id: "bebidasfrias", element: <ColdDrinksSection query={query} /> },
      {
        id: "postres",
        element: (
          <Section title="Postres">
            <Desserts query={query} />
          </Section>
        ),
      },
    ],
    [query]
  );

  const renderPanel = (s) => (
    <div
      key={s.id}
      id={`panel-${s.id}`}
      role="tabpanel"
      tabIndex={-1}
      aria-labelledby={`tab-${s.id}`}
    >
      {s.element}
    </div>
  );

  useEffect(() => {
    if (!FEATURE_TABS) return;
    const valid = ["todos", ...(cats || [])];
    if (!selectedCategory || !valid.includes(selectedCategory)) {
      onCategorySelect?.({ id: "todos" });
    }
  }, [selectedCategory, onCategorySelect]);

  const orderedTabs = ["todos", ...(cats || [])];
  const swipeHandlers = useSwipeTabs({
    onPrev: () => {
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
    },
    onNext: () => {
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
    },
  });

  return (
    <>
      <div className="mx-auto max-w-screen-md px-4 md:px-6">
        <CategoryHeader />
        <div className="-mx-4 md:-mx-6 px-4 md:px-6">
          {FEATURE_TABS ? (
            <CategoryTabs
              items={tabItems}
              value={selectedCategory}
              counts={counts}
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
              categories={categories}
              activeId={selectedCategory}
              onSelect={onCategorySelect}
              variant="chip"
              counts={counts}
            />
          )}
        </div>
      </div>
      <div {...swipeHandlers}>
        {FEATURE_TABS
          ? selectedCategory === "todos"
            ? sections.map(renderPanel)
            : sections
                .filter((s) => s.id === selectedCategory)
                .map(renderPanel)
          : sections.map(renderPanel)}
      </div>
    </>
  );
}

export function Breakfasts({ query }) {
  const items = (breakfastItems || []).filter((it) =>
    matchesQuery({ title: it.name, description: it.desc }, query)
  );
  if (!items.length) return null;
  return <List items={items} />;
}

export function Mains({ query }) {
  const items = (mainDishes || []).filter((it) =>
    matchesQuery({ title: it.name, description: it.desc }, query)
  );
  if (!items.length) return null;
  return <List items={items} />;
}

export function Desserts({ query }) {
  const { addItem } = useCart();

  // Sabores + precios específicos (según tu instrucción):
  // rojos y amarillos: $10.000 · chococumbre: $11.000 · blancos: $12.000
  const cumbreSabores = [
    { id: "rojos", label: "Frutos rojos" },
    { id: "amarillos", label: "Frutos amarillos" },
    { id: "blancos", label: "Frutos blancos" },
    { id: "choco", label: "Chococumbre" },
  ];
  const cumbrePrices = {
    rojos: 10000,
    amarillos: 10000,
    choco: 11000,
    blancos: 12000,
  };

  const filteredCumbre = cumbreSabores.filter((s) =>
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
