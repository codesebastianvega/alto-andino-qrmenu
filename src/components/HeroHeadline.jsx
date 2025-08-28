import React from "react";
import { motion } from "framer-motion";
import { CATEGORIES_LIST as menuCategories } from "../config/categories";
import { useCart } from "../context/CartContext";
import { getStockState, slugify } from "../utils/stock";
import * as menu from "../data/menuItems";
import AAImage from "./ui/AAImage";

// Frases por momento del día
const templates = {
  manana: [
    "Empieza tu día con energía con {nombre}",
    "Descubre nuestro {nombre} para una mañana perfecta",
    "Tu mañana pide un {nombre} delicioso",
  ],
  tarde: [
    "La tarde es mejor con {nombre}",
    "Un {nombre} para recargar energías",
    "Disfruta la tarde con nuestro {nombre} especial",
  ],
  noche: [
    "Termina tu día con {nombre}",
    "Relájate con un {nombre} reconfortante",
    "Tu noche pide {nombre} lleno de sabor",
  ],
};

// Categorías sugeridas por momento
const preferredTime = {
  desayunos: "manana",
  bowls: "manana",
  platos: "tarde",
  sandwiches: "noche",
  smoothies: "tarde",
  cafe: "manana",
  bebidasfrias: "tarde",
  postres: "tarde",
};

function getTimeContext() {
  const hour = new Date().getHours();
  const currentTime = hour >= 5 && hour < 12 ? "manana" : hour >= 12 && hour < 18 ? "tarde" : "noche";
  const emojiMap = { manana: "☀️", tarde: "🌤️", noche: "🌙" };
  const labelMap = {
    manana: "Buenos días en Zipaquirá",
    tarde: "Buenas tardes desde Zipaquirá",
    noche: "Buenas noches en Zipaquirá",
  };

  const filteredCats = menuCategories.filter((cat) => preferredTime[cat.id] === currentTime);
  const candidates = filteredCats.length > 0 ? filteredCats : menuCategories;
  const randomCat = candidates[Math.floor(Math.random() * candidates.length)];
  const templateList = templates[currentTime];
  const randomTemplate = templateList[Math.floor(Math.random() * templateList.length)];
  const tip = randomTemplate.replace("{nombre}", randomCat.label);
  return { emoji: emojiMap[currentTime], label: labelMap[currentTime], tip, link: randomCat.id, time: currentTime };
}

export default function HeroHeadline() {
  const cart = useCart();
  const { emoji, label, tip, link, time } = getTimeContext();

  // Selección de producto recomendado con stock disponible
  const pools = {
    manana: [menu.breakfastItems, menu.coffees, menu.infusions],
    tarde: [menu.smoothies, menu.funcionales, menu.sodas, menu.otherDrinks],
    noche: [menu.mainDishes, menu.sandwichItems, menu.dessertBaseItems],
  };
  const items = (pools[time] || []).flatMap((arr) => (Array.isArray(arr) ? arr : []));
  const candidates = items
    .map((p) => ({ id: p.id || p.productId || (p.key ? `sandwich:${p.key}` : slugify(p.name)), name: p.name, price: p.price }))
    .filter((p) => {
      const st = getStockState(p.id);
      return st === "in" || st === "low";
    });

  const [recIndex, setRecIndex] = React.useState(0);
  const rec = candidates.length ? candidates[Math.min(recIndex, candidates.length - 1)] : null;

  React.useEffect(() => {
    setRecIndex(0);
  }, [time]);

  React.useEffect(() => {
    if (!candidates.length) return;
    const id = setInterval(() => {
      setRecIndex((i) => (i + 1) % candidates.length);
    }, 12000);
    return () => clearInterval(id);
  }, [candidates.length]);

  const scrollToSection = (catId) => {
    const el = document.getElementById(`section-${catId}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = window.scrollY + rect.top - 96;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  return (
    <section aria-labelledby="home-headline" className="mb-3 md:mb-4 relative">
      {/* decor sutil para coherencia visual */}
      <AAImage src="/decor-tl.png" alt="" aria-hidden className="pointer-events-none absolute -left-16 -top-16 w-32 opacity-30 blur-sm" />
      <AAImage src="/decor-tr.png" alt="" aria-hidden className="pointer-events-none absolute -top-16 -right-32 w-64 opacity-25" />

      <motion.h1
        id="home-headline"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 rounded text-[22px] font-semibold leading-tight tracking-tight md:text-3xl"
      >
        <span className="sr-only">Alto Andino</span>
        <span className="bg-gradient-to-r from-[#203628] to-[#5f8a74] bg-clip-text text-transparent">Comer sano</span>{" "}
        nunca fue tan fácil
      </motion.h1>

      <motion.p
        className="headline-sub text-sm text-zinc-600 md:text-base"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Ingredientes locales y de temporada • Pet friendly
      </motion.p>

      <motion.div
        className="mt-4 flex flex-col gap-2 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/40 backdrop-blur-md md:flex-row md:items-center md:gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#2f4131]">{label}</p>
          <p className="text-xs text-neutral-700">{tip}</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {link && (
            <button
              type="button"
              onClick={() => scrollToSection(link)}
              className="mt-2 inline-block rounded-lg bg-[#2f4131] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#243326] md:mt-0"
            >
              Ver en menú
            </button>
          )}
          {rec && typeof rec.price === "number" && rec.price > 0 && (
            <button
              type="button"
              onClick={() => cart.addItem({ productId: rec.id, name: rec.name, price: rec.price })}
              className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4131] ring-1 ring-[#2f4131]/20 hover:bg-white/90 md:mt-0"
            >
              Añadir {rec.name}
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}