import { useState, useMemo } from "react";
import { Chip, Button } from "./Buttons";
import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";

export default function BowlBuilder() {
  const cart = useCart();

  // Precios base/premium
  const BASE = 32000;
  const PREMIUM = 4000;

  // Catálogos
  const bases = ["Arroz blanco", "Quinoa", "Mix de lechugas"];
  const proteins = [
    { name: "Pollo" },
    { name: "Res" },
    { name: "Tofu", tag: "🌿" },
    { name: "Atún", tag: "🐟" },
    { name: "Salmón", premium: true, tag: "🐟" },
    { name: "Camarón", premium: true, tag: "🐟" },
  ];
  const toppings = [
    "Aguacate",
    "Mango",
    "Pepino",
    "Maíz",
    "Tomate cherry",
    "Brócoli",
    "Champiñones",
    "Hummus 🌿",
    "Rábano",
    "Zanahoria",
    "Pimentón",
    "Arándano",
    "Kiwi",
  ];
  const extras = [
    "Chía",
    "Linaza",
    "Láminas de almendra 🥜",
    "Jengibre encurtido",
    "Pepinillos",
    "Aceitunas",
    "Aceite de oliva",
    "Ajonjolí",
    "Jalapeños 🌶️",
    "Alga nori",
    "Guacamole",
  ];
  const sauces = [
    "Sweet Hot 🌶️",
    "De la casa",
    "Mango-yaki",
    "Balsámico",
    "Yogur",
    "Soja",
    "Mayo-pesto",
  ];

  // Estados
  const [base, setBase] = useState(bases[0]);
  const [protein, setProtein] = useState("Pollo");
  const [tops, setTops] = useState([]);
  const [exts, setExts] = useState([]);
  const [sauce, setSauce] = useState("De la casa");
  const [note, setNote] = useState("");

  // Límites
  const MAX_TOPS = 4;
  const MAX_EXTS = 3;

  // Helpers
  const isPremium = useMemo(
    () => ["Salmón", "Camarón"].includes(protein),
    [protein]
  );
  const price = useMemo(() => BASE + (isPremium ? PREMIUM : 0), [isPremium]);

  const toggleLimited = (list, setList, max, item) => {
    setList((prev) => {
      const has = prev.includes(item);
      if (has) return prev.filter((x) => x !== item);
      if (prev.length >= max) return prev; // no agrega más de max
      return [...prev, item];
    });
  };

  const resetAll = () => {
    setBase(bases[0]);
    setProtein("Pollo");
    setTops([]);
    setExts([]);
    setSauce("De la casa");
    setNote("");
  };

  const addToCart = () => {
    cart.addItem({
      productId: "bowl-personalizado",
      name: "Bowl personalizado",
      price,
      options: {
        Base: base,
        Proteína: protein,
        Toppings: tops,
        Extras: exts,
        Salsa: sauce,
      },
      note,
    });
    setNote("");
  };

  const selectedInfo = `Base: ${base} · Prot: ${protein} · Top: ${tops.length}/${MAX_TOPS} · Extras: ${exts.length}/${MAX_EXTS} · Salsa: ${sauce}`;

  const ChipLimited = ({ label, active, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled && !active}
      className={
        "px-3 py-1 rounded-full text-sm border transition " +
        (active
          ? "bg-alto-primary text-white border-alto-primary shadow"
          : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400") +
        (disabled && !active ? " opacity-50 cursor-not-allowed" : "")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="bg-alto-terracotta p-4 text-white flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Arma tu bowl</h3>
          <p className="text-xs opacity-90">
            Incluye 1 base, 1 proteína, {MAX_TOPS} toppings, {MAX_EXTS} extras y
            1 salsa.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="text-xs underline opacity-95 hover:opacity-100"
        >
          Restablecer
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-5">
        {/* Resumen compacto */}
        <div className="rounded-xl border bg-neutral-50 p-3 text-xs text-neutral-700">
          {selectedInfo}
        </div>

        {/* Base */}
        <div>
          <p className="text-sm font-semibold mb-2">1) Base</p>
          <div className="flex flex-wrap gap-2">
            {bases.map((b) => (
              <Chip key={b} active={b === base} onClick={() => setBase(b)}>
                {b}
              </Chip>
            ))}
          </div>
        </div>

        {/* Proteína */}
        <div>
          <p className="text-sm font-semibold mb-2">
            2) Proteína{" "}
            {isPremium && (
              <span className="text-[11px] text-amber-700">
                ( +${COP(PREMIUM)} )
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {proteins.map((p) => (
              <Chip
                key={p.name}
                active={p.name === protein}
                onClick={() => setProtein(p.name)}
              >
                {p.name} {p.tag || ""}
                {p.premium ? " (+$4.000)" : ""}
              </Chip>
            ))}
          </div>
        </div>

        {/* Toppings */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold mb-2">3) Toppings</p>
            <p className="text-xs text-neutral-500">
              Seleccionados: {tops.length}/{MAX_TOPS}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {toppings.map((t) => (
              <ChipLimited
                key={t}
                label={t}
                active={tops.includes(t)}
                onClick={() => toggleLimited(tops, setTops, MAX_TOPS, t)}
                disabled={tops.length >= MAX_TOPS}
              />
            ))}
          </div>
        </div>

        {/* Extras */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold mb-2">4) Extras</p>
            <p className="text-xs text-neutral-500">
              Seleccionados: {exts.length}/{MAX_EXTS}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {extras.map((e) => (
              <ChipLimited
                key={e}
                label={e}
                active={exts.includes(e)}
                onClick={() => toggleLimited(exts, setExts, MAX_EXTS, e)}
                disabled={exts.length >= MAX_EXTS}
              />
            ))}
          </div>
        </div>

        {/* Salsa */}
        <div>
          <p className="text-sm font-semibold mb-2">5) Salsa</p>
          <div className="flex flex-wrap gap-2">
            {sauces.map((s) => (
              <Chip key={s} active={s === sauce} onClick={() => setSauce(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>

        {/* Nota y total */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-neutral-500">
              Nota para cocina (opcional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej.: sin sal, extra salsa, poco picante..."
              maxLength={120}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
            />
          </div>
          <div className="rounded-xl border bg-neutral-50 p-3">
            <p className="text-xs text-neutral-600">Total</p>
            <p className="text-xl font-bold">${COP(price)}</p>
            <Button className="mt-2 w-full" onClick={addToCart}>
              Añadir al carrito
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
