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

const FEATURE_TABS = import.meta.env.VITE_FEATURE_TABS === "1";

// Datos compartidos de los productos para búsqueda/identificación
export const BREAKFAST_ITEMS = [
  {
    id: "des-sendero",
    name: "Sendero Matinal",
    price: 16000,
    desc: "Bebida caliente + omelette con champiñones, lechugas, tomate cherry y queso, con tostadas multigranos. 🥚🌾🥛",
  },
  {
    id: "des-cumbre",
    name: "Cumbre Energética",
    price: 18000,
    desc: "Bebida caliente + arepa con queso mozzarella, aguacate y ajonjolí negro; yogur griego con arándanos y chía. 🥛🌾",
  },
  {
    id: "des-huevos",
    name: "Huevos al Gusto",
    price: 17500,
    desc: "3 huevos en sartén de hierro; 2 tostadas con queso crema y vegetales. 🥚🌾🥛",
  },
  {
    id: "des-caldo",
    name: "Caldo de Costilla de Res",
    price: 18500,
    desc: "Con papa y cilantro. Incluye bebida caliente + huevos al gusto, arepa y queso. 🥚🥛",
  },
  {
    id: "des-amanecer",
    name: "Bowl Amanecer Andino",
    price: 19000,
    desc: "Yogur griego + açaí, avena, coco, banano, fresa y arándanos; topping de chía o amapola. 🥛🌾🥜",
  },
];

export const MAINS_ITEMS = [
  {
    id: "main-salmon",
    name: "Salmón Andino 200 gr",
    price: 47000,
    desc: "En sartén de hierro, salsa miel-mostaza y orégano con guarnición de pure de ahuyama y ensalada de granos calientes.",
  },
  {
    id: "main-trucha",
    name: "Trucha del Páramo 450 gr",
    price: 42000,
    desc: "A la plancha con alioli griego con guarnición pure de papa y ensalada fría.",
  },
  {
    id: "main-bolo",
    name: "Spaghetti a la Boloñesa",
    price: 28000,
    desc: "Salsa pomodoro, carne de res; albahaca fresca y ralladura de parmesano. 🌾🥛",
  },
  {
    id: "main-champi",
    name: "Champiñones a la Madrileña",
    price: 18000,
    desc: "125 gr de champiñones en mantequilla y ajo, vino espumoso, jamón serrano, perejil y ralladura de parmesano. 🥛",
  },
  {
    id: "main-ceviche",
    name: "Ceviche de Camarón",
    price: 22000,
    desc: "Camarón marinado en cítricos; pimentón, salsa de tomate casera, cilantro y cebolla morada; con aguacate.",
  },
  {
    id: "main-burger",
    name: "Burger Andina (Pavo 150 gr)",
    price: 26000,
    desc: "Pavo sazonado, salsa de yogur, tomate, lechuga, chucrut y queso Colby Jack en pan artesanal. 🥛🌾",
  },
];

export const DESSERT_BASE_ITEMS = [
  {
    id: "post-red",
    name: "Red Velvet",
    price: 11000,
    desc: "Bizcocho rojo con crema batida de la casa, endulzado con eritritol y stevia. 🌾🥛",
  },
  {
    id: "post-tres",
    name: "Tres Leches (saludable)",
    price: 6200,
    desc: "Harina de almendras y avena; dulce de tres leches con alulosa; chantilly con eritritol. 🥛🌾",
  },
  {
    id: "post-tira",
    name: "Tiramisú (saludable)",
    price: 6800,
    desc: "Bizcocho de almendras y avena, café especial, chantilly con alulosa y cacao espolvoreado. 🥛🌾",
  },
  {
    id: "post-amap",
    name: "Torta de Amapola",
    price: 10000,
    desc: "Harina de avena y semillas de amapola; crema chantilly endulzada con alulosa. 🥛🌾",
  },
  {
    id: "post-vasca",
    name: "Torta Vasca de Limón",
    price: 10000,
    desc: "Crema de leche, queso crema y maicena; vainilla y sal marina. 🥛",
  },
  {
    id: "post-fresas",
    name: "Fresas con Crema",
    price: 9000,
    desc: "Fresas con crema chantilly endulzada con alulosa. 🥛",
  },
];

export default function ProductLists({
  query,
  activeCategoryId,
  onCategorySelect,
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
      { id: "bebidas-frias", label: "Bebidas frías" },
      { id: "postres", label: "Postres" },
    ],
    [query]
  );

  const tabItems = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        label: c.label,
        icon: categoryIcons[c.id],
      })),
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
      { id: "bebidas-frias", element: <ColdDrinksSection query={query} /> },
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

  useEffect(() => {
    if (!activeCategoryId && FEATURE_TABS) {
      onCategorySelect?.(categories[0]);
    } else if (
      activeCategoryId && !categories.find((c) => c.id === activeCategoryId)
    ) {
      onCategorySelect?.(categories[0]);
    }
  }, [activeCategoryId, categories, onCategorySelect]);


  return (
    <>
      <div className="mx-auto max-w-screen-md px-4 md:px-6">
        <CategoryHeader />
        {FEATURE_TABS ? (
          <CategoryTabs
            items={tabItems}
            value={activeCategoryId}
            onChange={(slug) => {
              const cat = categories.find((c) => c.id === slug);
              if (cat) onCategorySelect?.(cat);
            }}
          />
        ) : (
          <CategoryBar
            categories={categories}
            activeId={activeCategoryId}
            onSelect={onCategorySelect}
            variant="chip"
          />
        )}
      </div>
      {FEATURE_TABS
        ? sections.map((s) => (
            <div
              key={s.id}
              id={`panel-${s.id}`}
              role="tabpanel"
              hidden={s.id !== activeCategoryId}
            >
              {s.element}
            </div>
          ))
        : sections.map((s) => <div key={s.id}>{s.element}</div>)}
    </>
  );
}

export function Breakfasts({ query }) {
  const items = BREAKFAST_ITEMS.filter((it) =>
    matchesQuery({ title: it.name, description: it.desc }, query)
  );
  if (!items.length) return null;
  return <List items={items} />;
}

export function Mains({ query }) {
  const items = MAINS_ITEMS.filter((it) =>
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
  const base = DESSERT_BASE_ITEMS.filter((p) =>
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
