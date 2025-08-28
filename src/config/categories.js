import { categoryIcons } from "../data/categoryIcons";

export const CATEGORIES_LIST = [
  { id: "desayunos", label: "Desayunos", tintClass: "bg-amber-50" },
  { id: "bowls", label: "Poke Bowls", tintClass: "bg-emerald-50" },
  {
    id: "platos",
    label: "Platos Fuertes",
    targetId: "section-platos",
    tintClass: "bg-violet-50",
  },
  { id: "sandwiches", label: "Sándwiches", tintClass: "bg-rose-50" },
  {
    id: "smoothies",
    label: "Smoothies & Funcionales",
    targetId: "section-smoothies",
    tintClass: "bg-pink-50",
  },
  {
    id: "cafe",
    label: "Café de especialidad",
    targetId: "section-cafe",
    tintClass: "bg-stone-200",
  },
  {
    id: "bebidasfrias",
    label: "Bebidas frías",
    targetId: "section-bebidasfrias",
    tintClass: "bg-sky-50",
  },
  { id: "postres", label: "Postres" },
];

export const TABS_ITEMS = (cats = CATEGORIES_LIST) =>
  cats.map((c) => ({
    id: c.id === "todos" ? "todos" : c.id,
    label: c.label || c.id,
    icon: categoryIcons[c.id],
    tintClass: c.tintClass,
  }));

