// src/components/BowlBuilder.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Portal from "./Portal";
import { formatCOP } from "@/utils/money";
import { useCart } from "@/context/CartContext";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

// Catálogos y constantes (simple y sin caracteres raros)
const BASE_PRICE = 28000;
const PREMIUM_SURCHARGE = 4000;

const bases = ["Arroz", "Quinoa", "Mix de lechugas"];

const proteins = [
  { name: "Pollo", premium: false },
  { name: "Carne", premium: false },
];

const toppings = [
  "Aguacate",
  "Mango",
  "Pepino",
  "Maíz desgranado",
  "Cebolla morada",
  "Tomate cherry",
  "Rábano",
  "Queso en cubos",
  "Zanahoria",
  "Pimentón",
  "Brócoli",
  "Champiñones",
  "Hummus",
  "Arándanos",
  "Kiwi",
];

const extras = [
  "Guacamole",
  "Ajonjolí tostado",
  "Cebollín",
  "Semilla de chía",
  "Semillas de linaza",
  "Láminas de almendras",
  "Jalapeños",
  "Alga nori",
  "Jengibre encurtido",
  "Pepinillos",
  "Aceituna negra",
  "Aceituna verde",
  "Aceite de oliva",
  "Ajonjolí negro",
  "Semillas de amapola",
  "Semilla de amaranto",
  "Orégano",
  "Pimienta cayena",
  "Aceite de aguacate",
];

const sauces = [
  "HotSweet de la casa",
  "Mango-yaki",
  "Balsámico",
  "Yogurt",
  "Soja",
  "Mayo-pesto",
  "Sin salsa",
];

const MAX_TOPS = 4;
const MAX_EXTS = 3;

// Emoji helpers (normalizar acentos y mapa)
function normalizeLabel(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function icoEmoji(label) {
  const s = normalizeLabel(label);
  // Bases
  if (s.includes("arroz")) return "🍚";
  if (s.includes("quinoa")) return "🌾";
  if (s.includes("lechuga") || s.includes("mix")) return "🥬";
  // Proteínas
  if (s.includes("pollo")) return "🍗";
  if (s.includes("res") || s.includes("carne")) return "🥩";
  if (s.includes("tofu")) return "🧊";
  if (s.includes("atun") || s.includes("salm")) return "🐟";
  if (s.includes("camar")) return "🍤";
  // Toppings / extras
  if (s.includes("aguacate") || s.includes("palta") || s.includes("guacamole")) return "🥑";
  if (s.includes("mango")) return "🥭";
  if (s.includes("pepino") || s.includes("pepinillo")) return "🥒";
  if (s.includes("maiz")) return "🌽";
  if (s.includes("cebolla") || s.includes("cebollin")) return "🧅";
  if (s.includes("tomate")) return "🍅";
  if (s.includes("rabano")) return "🥗";
  if (s.includes("queso")) return "🧀";
  if (s.includes("zanahoria")) return "🥕";
  if (s.includes("pimenton") || s.includes("pimiento")) return "🫑";
  if (s.includes("brocoli")) return "🥦";
  if (s.includes("champi")) return "🍄";
  if (s.includes("arandanos")) return "🫐";
  if (s.includes("kiwi")) return "🥝";
  if (s.includes("almendra")) return "🥜";
  if (s.includes("linaza") || s.includes("chia") || s.includes("amapola") || s.includes("amaranto") || s.includes("semilla")) return "🌱";
  if (s.includes("jalapen")) return "🌶️";
  if (s.includes("alga") || s.includes("nori") || s.includes("jengibre")) return "🍣";
  if (s.includes("aceituna")) return "🫒";
  if (s.includes("aceite")) {
    if (s.includes("aguacate")) return "🥑";
    if (s.includes("oliva")) return "🫒";
    return "🧴";
  }
  if (s.includes("oregano") || s.includes("hierbas") || s.includes("pimienta")) return "🌿";
  // Salsas
  if (s.includes("hotsweet") || s.includes("picante") || s.includes("cayena")) return "🌶️";
  if (s.includes("bals")) return "🧴";
  if (s.includes("yogur")) return "🥛";
  if (s.includes("soja") || s.includes("soya")) return "🥢";
  if (s.includes("mayo") || s.includes("pesto")) return "🧄";
  if (s.includes("sin salsa")) return "🚫";
  return "";
}

function Tile({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !active}
      aria-pressed={active}
      className={
        "w-full rounded-xl px-3 py-2 text-left text-sm ring-1 transition-colors transition-shadow duration-150 " +
        (active
          ? "bg-[#2f4131]/90 text-white shadow-lg ring-white/10 backdrop-blur-sm"
          : "bg-white/50 backdrop-blur-md text-neutral-900 ring-white/40 shadow-sm hover:bg-white/60 hover:ring-white/50") +
        (disabled && !active ? " cursor-not-allowed opacity-50" : "")
      }
    >
      {children}
    </button>
  );
}

export default function BowlBuilder({ open, onClose }) {
  if (!open) return null;

  useLockBodyScroll(open);
  const cart = useCart();
  const modalRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    lastFocused.current = document.activeElement;
    modalRef.current?.focus?.();

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const el = modalRef.current;
        if (!el) return;
        const focusables = el.querySelectorAll(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.();
    };
  }, [onClose]);

  // Estado
  const [base, setBase] = useState(bases[0]);
  const [protein, setProtein] = useState("Pollo");
  const [tops, setTops] = useState([]);
  const [exts, setExts] = useState([]);
  const [sauce, setSauce] = useState("Sin salsa");
  const [note, setNote] = useState("");

  const isPremium = useMemo(() => proteins.find((p) => p.name === protein)?.premium === true, [protein]);
  const price = useMemo(() => BASE_PRICE + (isPremium ? PREMIUM_SURCHARGE : 0), [isPremium]);

  const toggleLimited = (list, setList, max, item) => {
    setList((prev) => {
      const has = prev.includes(item);
      if (has) return prev.filter((x) => x !== item);
      if (prev.length >= max) return prev;
      return [...prev, item];
    });
  };

  const resetAll = () => {
    setBase(bases[0]);
    setProtein("Pollo");
    setTops([]);
    setExts([]);
    setSauce("Sin salsa");
    setNote("");
  };

  const addToCart = () => {
    cart.addItem({
      productId: "bowl-personalizado",
      name: "Bowl personalizado",
      price,
      options: {
        Base: base,
        Proteina: protein,
        Toppings: tops,
        Extras: exts,
        Salsa: sauce,
      },
      note,
    });
    setNote("");
    onClose?.();
  };

  return (
    <Portal>
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100]">
        {/* Fondo */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onClose?.()} />

        {/* Contenedor */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className="pointer-events-auto absolute inset-0 z-[110] mx-auto flex h-[100dvh] max-h-[100svh] w-full max-w-2xl flex-col overflow-hidden rounded-none bg-[#FAF7F2] shadow-2xl focus-visible:outline-none sm:rounded-3xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#2f4131] p-4 text-white sm:rounded-t-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Arma tu bowl</h3>
                <p className="text-xs text-white/90">1 base, 1 proteína, 4 toppings, 3 extras y 1 salsa</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-8 rounded-full bg-white px-3 text-sm text-[#2f4131] hover:bg-white/90"
                  onClick={resetAll}
                >
                  Restablecer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 rounded-full bg-white/20 px-3 text-sm text-white hover:bg-white/30"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain px-4 pt-3 sm:space-y-4 sm:pt-4">
            {/* Resumen */}
            <div className="rounded-lg bg-white/60 px-3 py-2 text-sm text-neutral-800 ring-1 ring-white/40 shadow-sm backdrop-blur-md">
              Base: {base} • Prot: {protein} {isPremium && "(+$4.000)"} • Top: {tops.length}/{MAX_TOPS} • Extras: {exts.length}/{MAX_EXTS} • Salsa: {sauce} • Total: {formatCOP(price)}
            </div>

            {/* Base */}
            <section>
              <p className="mb-2 text-sm font-semibold text-[#2f4131]">1) Base</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {bases.map((b) => (
                  <Tile key={b} active={b === base} onClick={() => setBase(b)}>
                    {icoEmoji(b)}&nbsp;{b}
                  </Tile>
                ))}
              </div>
            </section>

            {/* Proteína */}
            <section>
              <p className="mb-2 text-sm font-semibold text-[#2f4131]">2) Proteína</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {proteins.map((p) => (
                  <Tile key={p.name} active={p.name === protein} onClick={() => setProtein(p.name)}>
                    {icoEmoji(p.name)}&nbsp;{p.name}
                    {p.premium ? " • (+$4.000)" : ""}
                  </Tile>
                ))}
              </div>
            </section>

            {/* Toppings */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2f4131]">3) Toppings</p>
                <p className="text-xs text-neutral-600">Seleccionados: {tops.length}/{MAX_TOPS}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {toppings.map((t) => (
                  <Tile
                    key={t}
                    active={tops.includes(t)}
                    disabled={!tops.includes(t) && tops.length >= MAX_TOPS}
                    onClick={() => toggleLimited(tops, setTops, MAX_TOPS, t)}
                  >
                    {icoEmoji(t)}&nbsp;{t}
                  </Tile>
                ))}
              </div>
            </section>

            {/* Extras */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2f4131]">4) Extras</p>
                <p className="text-xs text-neutral-600">Seleccionados: {exts.length}/{MAX_EXTS}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {extras.map((e) => (
                  <Tile
                    key={e}
                    active={exts.includes(e)}
                    disabled={!exts.includes(e) && exts.length >= MAX_EXTS}
                    onClick={() => toggleLimited(exts, setExts, MAX_EXTS, e)}
                  >
                    {icoEmoji(e)}&nbsp;{e}
                  </Tile>
                ))}
              </div>
            </section>

            {/* Salsa */}
            <section>
              <p className="mb-2 text-sm font-semibold text-[#2f4131]">5) Salsa</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {sauces.map((s) => (
                  <Tile key={s} active={s === sauce} onClick={() => setSauce(s)}>
                    {icoEmoji(s)}&nbsp;{s}
                  </Tile>
                ))}
              </div>
            </section>

            {/* Nota */}
            <div>
              <label className="block text-xs text-neutral-600">Nota para cocina (opcional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej.: sin sal, extra salsa, poco picante..."
                maxLength={120}
                className="mt-1 w-full rounded-lg bg-white/60 px-2 py-2 text-sm ring-1 ring-white/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#2f4131]"
              />
            </div>

            <div className="h-24 sm:h-0" />
          </div>

          {/* Footer acciones sticky */}
          <div className="sticky bottom-0 z-10 bg-white/80 px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3 backdrop-blur-md ring-1 ring-white/40">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-12 flex-1 rounded-xl bg-white/30 text-sm font-semibold text-[#2f4131] ring-1 ring-white/40 hover:bg-white/40"
              >
                Seguir pidiendo
              </button>
              <button
                type="button"
                onClick={addToCart}
                className="h-12 flex-1 rounded-xl bg-[#2f4131] text-sm font-semibold text-white shadow-sm hover:bg-[#243326]"
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
