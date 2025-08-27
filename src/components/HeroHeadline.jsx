import { motion } from "framer-motion";
import { Link } from "react-scroll";
import { CATEGORIES_LIST as menuCategories } from "../config/categories";

// Plantillas de frases para cada momento del día
const templates = {
  mañana: [
    "Empieza tu día con energía con {nombre} 🌞",
    "Descubre nuestro {nombre} para una mañana perfecta",
    "Tu mañana pide un {nombre} delicioso",
  ],
  tarde: [
    "La tarde es mejor con {nombre} ☀️",
    "Un {nombre} para recargar energías",
    "Disfruta la tarde con nuestro {nombre} especial",
  ],
  noche: [
    "Termina tu día con {nombre} 🌙",
    "Relájate con un {nombre} reconfortante",
    "Tu noche pide {nombre} lleno de sabor",
  ]
};

// Mapeo opcional de categorías a momentos preferidos
const preferredTime = {
  desayunos: "mañana",
  bowls: "mañana",
  platos: "tarde",
  sandwiches: "noche",
  smoothies: "tarde",
  cafe: "mañana",
  bebidasfrias: "tarde",
  postres: "tarde",
};

function getTimeContext() {
  const hour = new Date().getHours();
  const currentTime =
    hour >= 5 && hour < 12
      ? "mañana"
      : hour >= 12 && hour < 18
      ? "tarde"
      : "noche";

  const emojiMap = { mañana: "🌞", tarde: "☀️", noche: "🌙" };
  const labelMap = {
    mañana: "Buenos días en Zipaquirá",
    tarde: "Buenas tardes desde Zipaquirá",
    noche: "Buenas noches en Zipaquirá"
  };

  // Filtramos las categorías cuyo momento preferido coincide con el actual
  const filteredCats = menuCategories.filter(
    cat => preferredTime[cat.id] === currentTime
  );

  // Si no hay coincidencia, usamos todas
  const candidates = filteredCats.length > 0 ? filteredCats : menuCategories;

  // Tomamos una categoría aleatoria
  const randomCat = candidates[Math.floor(Math.random() * candidates.length)];

  // Elegimos una plantilla aleatoria para este momento
  const templateList = templates[currentTime];
  const randomTemplate =
    templateList[Math.floor(Math.random() * templateList.length)];

  // Sustituimos {nombre} en la plantilla
  const tip = randomTemplate.replace("{nombre}", randomCat.label);

  return {
    emoji: emojiMap[currentTime],
    label: labelMap[currentTime],
    tip,
    link: randomCat.id
  };
}

export default function HeroHeadline() {
  const { emoji, label, tip, link } = getTimeContext();

  return (
    <section aria-labelledby="home-headline" className="mb-3 md:mb-4">
      <motion.h1
        id="home-headline"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="rounded text-[22px] font-semibold leading-tight tracking-tight md:text-3xl"
      >
        <span className="sr-only">Alto Andino</span>
        <span className="bg-gradient-to-r from-[#203628] to-[#5f8a74] bg-clip-text text-transparent">
          Comer sano
        </span>{" "}
        nunca fue tan fácil
      </motion.h1>

      <motion.p
        className="headline-sub text-sm text-zinc-600 md:text-base"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Ingredientes locales y de temporada · Pet friendly
      </motion.p>

      <motion.div
        className="mt-4 flex flex-col gap-2 rounded-xl bg-[#f0f4f2] px-4 py-3 shadow-sm md:flex-row md:items-center md:gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#2f4131]">{label}</p>
          <p className="text-xs text-neutral-700">{tip}</p>
        </div>
        {link && (
          <Link
            to={link}
            smooth={true}
            duration={500}
            offset={-80}
            className="mt-2 inline-block rounded-lg bg-[#2f4131] px-3 py-1 text-xs font-medium text-white hover:bg-[#243326] md:mt-0 cursor-pointer"
          >
            Ver en menú
          </Link>
        )}
      </motion.div>
    </section>
  );
}
