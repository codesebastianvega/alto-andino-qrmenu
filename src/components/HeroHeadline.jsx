import React from "react";
import { motion } from "framer-motion";
import { CATEGORIES_LIST as menuCategories } from "../config/categories.veggie";
import { useCart } from "../context/CartContext";
import { getStockState, slugify } from "../utils/stock";
import * as menu from "../data/menuItems";
import AAImage from "./ui/AAImage";

// Frases por momento del día (enfocadas en producto)
const templates = {
  manana: [
    "Empieza tu día con {producto}",
    "Descubre {producto} para una mañana perfecta",
    "Tu mañana pide {producto} delicioso",
    "Arranca con energía: {producto}",
    "Buen día para un {producto}",
    "Levántate con un {producto} cálido",
  ],
  tarde: [
    "La tarde es mejor con {producto}",
    "Recarga energías con {producto}",
    "Un break con {producto}",
    "Disfruta la tarde con {producto} especial",
    "Para la tarde: {producto}",
    "Un antojo: {producto}",
  ],
  noche: [
    "Termina tu día con {producto}",
    "Relájate con {producto}",
    "Tu noche pide {producto}",
    "Antes de dormir, {producto}",
    "Noches sabrosas con {producto}",
    "Despide el día con {producto}",
  ],
};

// Categorías sugeridas por momento (coherencia visual)
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
  return { emoji: emojiMap[currentTime], label: labelMap[currentTime], time: currentTime, hour };
}

export default function HeroHeadline() {
  const cart = useCart();
  const { emoji, label, time, hour } = getTimeContext();

  // Selección de producto recomendado con stock disponible
  const pools = {
    manana: [menu.breakfastItems, menu.coffees, menu.infusions, menu.teasAndChai, menu.moreInfusions],
    tarde: [menu.smoothies, menu.funcionales, menu.sodas, menu.otherDrinks, menu.coffees],
    noche: [menu.mainDishes, menu.sandwichItems, menu.dessertBaseItems, menu.coffees],
  };
  const baseBucket = pools[time] || [];
  const offerHot = hour >= 16 && hour < 19;
  const bucket = offerHot ? [menu.coffees, menu.teasAndChai, menu.infusions] : baseBucket;
  const items = bucket.flatMap((arr) => (Array.isArray(arr) ? arr : []));
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
    }, 25000); // cambia más lento
    return () => clearInterval(id);
  }, [candidates.length]);

  const phraseTemplates = templates[time] || [];
  const phraseTemplate = phraseTemplates.length
    ? phraseTemplates[recIndex % phraseTemplates.length]
    : "Disfruta {producto}";
  const tip = phraseTemplate.replace("{producto}", rec?.name || "algo rico");

  return (
    <section aria-labelledby="home-headline" className="relative mb-3 md:mb-4">
      {/* Decoración TL: mitad visible hacia la izquierda, leve blur */}
      <AAImage
        src="/decor-tl.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 w-28 sm:-left-20 sm:-top-14 sm:w-40 md:-left-24 md:-top-16 md:w-40 opacity-40 blur-[1px] z-0"
      />
      <AAImage
        src="/decor-tr.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-6 w-40 sm:-right-12 sm:w-52 md:-right-16 md:w-64 opacity-25 z-0"
      />

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
        Ingredientes locales y de temporada
      </motion.p>

      <motion.div
        className="relative mt-4 flex flex-col gap-2 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/40 backdrop-blur-md md:flex-row md:items-center md:gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <span className="absolute right-3 top-3 text-2xl sm:text-3xl" aria-hidden>{emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#2f4131]">{label}</p>
          <p className="text-xs text-neutral-700">{tip}</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {rec && (
            <button
              type="button"
              onClick={() => {
                // Buscar el objeto completo para obtener descripción e imagen
                const getId = (p) => p.id || p.productId || (p.key ? `sandwich:${p.key}` : slugify(p.name));
                const full = (items || []).find((p) => getId(p) === rec.id) || null;
                const payload = {
                  id: rec.id,
                  name: rec.name,
                  price: rec.price,
                  subtitle: full?.desc || full?.subtitle || "",
                };
                window.dispatchEvent(new CustomEvent("aa:quickview", { detail: payload }));
              }}
              className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4131] ring-1 ring-[#2f4131]/20 hover:bg-white/90 md:mt-0"
            >
              Ver {rec.name}
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}



