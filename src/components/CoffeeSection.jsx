import { useState, useRef } from "react";
import { AddIconButton, StatusChip } from "./Buttons";
import { useCart } from "../context/CartContext";
import { COP } from "../utils/money";
import { getStockState, slugify } from "../utils/stock";
import { matchesQuery } from "../utils/strings";

// ————————————————————————————————————————
// Configuración de bebidas
// milkPolicy: 'none' | 'optional' | 'required'
// ← editar nombres y precios aquí
const MILK_OPTIONS = [
  { id: "entera", label: "Entera", delta: 0 },
  { id: "deslactosada", label: "Deslactosada", delta: 0 },
  { id: "almendras", label: "Almendras (+$3.800)", delta: 3800 },
];

// Cafés (agrupados)
// ← editar nombres y precios aquí
export const COFFEES = [
  // Sin leche por defecto
  {
    id: "cof-espresso",
    name: "Espresso",
    price: 4000,
    desc: "Café concentrado, 30–40 ml. 100% espresso.",
    milkPolicy: "optional",
    kind: "espresso",
  },
  {
    id: "cof-americano",
    name: "Americano",
    price: 4500,
    desc: "Espresso diluido con agua caliente (~30% espresso, 70% agua).",
    milkPolicy: "optional",
    kind: "americano",
  },
  {
    id: "cof-tinto",
    name: "Tinto Campesino",
    price: 4500,
    desc: "Café filtrado tradicional.",
    milkPolicy: "none",
    kind: "tinto",
  },

  // Con leche por defecto
  {
    id: "cof-capuchino",
    name: "Capuchino",
    price: 6000,
    desc: "Espresso con leche al vapor y espuma fina (~33% espresso, 33% leche, 33% espuma).",
    milkPolicy: "required",
    kind: "milk",
  },
  {
    id: "cof-latte",
    name: "Latte",
    price: 6000,
    desc: "Espresso con más leche y poca espuma (~20% espresso, 80% leche).",
    milkPolicy: "required",
    kind: "milk",
  },
  {
    id: "cof-flat",
    name: "Flat White",
    price: 7000,
    desc: "Doble espresso con leche microespumada (~40% espresso, 60% leche).",
    milkPolicy: "required",
    kind: "milk",
  },
  {
    id: "cof-moca",
    name: "Mocaccino",
    price: 8000,
    desc: "Espresso con cacao, leche y crema (~25% espresso, 65% leche, 10% cacao/crema).",
    milkPolicy: "required",
    kind: "milk",
  },
  {
    id: "cof-choco",
    name: "Chocolate Caliente",
    price: 7000,
    desc: "Bebida de cacao con leche.",
    milkPolicy: "required",
    kind: "milk",
  },
];

// Infusiones y tés (incluye Chai)
// ← editar nombres y precios aquí
export const INFUSIONS = [
  {
    id: "aro-fresa",
    name: "Aromatica de fresa",
    price: 5000,
    desc: "Té de frutos rojos con hierbabuena y fresas deshidratadas.",
  },

  // Chai especial: puede ser infusión o con leche (Chai Latte)
  {
    id: "inf-chai",
    name: "Té Chai",
    price: 9000,
    desc: "Blend especiado. Puede ser infusión o con leche (Chai Latte).",
    chai: true,
  },
];

// ————————————————————————————————————————
// Utilidades de stock y precio
function findMilkDelta(milkId) {
  const opt = MILK_OPTIONS.find((o) => o.id === milkId);
  return opt ? opt.delta : 0;
}

// ————————————————————————————————————————
// Componente principal
export default function CoffeeSection({ query }) {
  const cart = useCart();

  // Estados por ítem (diccionarios)
  const [milkBy, setMilkBy] = useState({}); // { [id]: 'entera' | 'deslactosada' | 'almendras' }
  const [addMilk, setAddMilk] = useState({}); // { [id]: boolean } para espresso/americano
  const [espressoStyle, setEspressoStyle] = useState({}); // { [id]: 'mancha'|'mitad'|'mucha' }
  const [chaiMode, setChaiMode] = useState({}); // { ['inf-chai']: 'infusion'|'latte' }

  const milkOf = (id) => milkBy[id] || "entera";
  const setMilk = (id, val) => setMilkBy((p) => ({ ...p, [id]: val }));

  const toggleAddMilk = (id) => setAddMilk((p) => ({ ...p, [id]: !p[id] }));
  const styleOf = (id) => espressoStyle[id] || "mancha";
  const setStyle = (id, val) => setEspressoStyle((p) => ({ ...p, [id]: val }));

  const modeOf = (id) => chaiMode[id] || "infusion";
  const setMode = (id, val) => setChaiMode((p) => ({ ...p, [id]: val }));

  // Nombre final según selecciones
  function displayName(item) {
    if (item.id === "cof-espresso" && addMilk[item.id]) {
      const style = styleOf(item.id);
      if (style === "mancha") return "Macchiato";
      if (style === "mitad") return "Cortado";
      return "Espresso (con leche)";
    }
    if (item.id === "cof-americano" && addMilk[item.id]) {
      return "Americano (con leche)";
    }
    if (item.id === "inf-chai" && modeOf(item.id) === "latte") {
      return "Chai Latte";
    }
    return item.name;
  }

  // Precio final según leche/selección
  function finalPrice(item) {
    let base = item.price;
    if (item.milkPolicy === "required") {
      base += findMilkDelta(milkOf(item.id));
    }
    if (item.milkPolicy === "optional" && addMilk[item.id]) {
      base += findMilkDelta(milkOf(item.id));
    }
    if (item.id === "inf-chai" && modeOf(item.id) === "latte") {
      base += findMilkDelta(milkOf(item.id));
    }
    return base;
  }

  // Añadir al carrito
  function addToCart(item) {
    const name = displayName(item);
    const price = finalPrice(item);
    const options = {};

    const usesMilk =
      item.milkPolicy === "required" ||
      (item.milkPolicy === "optional" && addMilk[item.id]) ||
      (item.id === "inf-chai" && modeOf(item.id) === "latte");

    if (usesMilk) options["Leche"] = milkOf(item.id);
    if (item.id === "inf-chai") {
      const mode = modeOf(item.id);
      options["Preparación"] = mode === "latte" ? "Con leche" : "Infusión";
    }
    if (item.id === "cof-espresso" && addMilk[item.id]) {
      const style = styleOf(item.id);
      options["Estilo"] =
        style === "mancha"
          ? "Macchiato"
          : style === "mitad"
          ? "Cortado"
          : "Con leche";
    }

    cart.addItem({ productId: item.id, name, price, options });
  }

  // ————————————————————————————————————————
  // UI helpers
  const MilkSelect = ({ id, disabled }) => {
    const selectRef = useRef(null);
    const [selectedMilk, setSelectedMilk] = useState(milkOf(id));

    return (
      <div className="mt-3">
        <label className="sr-only">Leche</label>
        <select
          ref={selectRef}
          className="sr-only"
          value={selectedMilk}
          onChange={(e) => {
            setSelectedMilk(e.target.value);
            setMilk(id, e.target.value);
          }}
          disabled={disabled}
        >
          {MILK_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {!selectedMilk && (
            <span className="inline-flex items-center rounded-full border border-dashed border-neutral-300 text-neutral-500 px-3 py-1 text-xs">
              Escoge tu leche
            </span>
          )}
          {MILK_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (selectRef.current) {
                  selectRef.current.value = opt.id;
                  const evt = new Event("change", { bubbles: true });
                  selectRef.current.dispatchEvent(evt);
                }
              }}
              className={[
                "px-3 py-1 rounded-full text-xs border transition",
                selectedMilk === opt.id
                  ? "bg-[#2f4131] text-white border-[#2f4131] shadow"
                  : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400",
                disabled && "opacity-50 cursor-not-allowed",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={selectedMilk === opt.id}
              disabled={disabled}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const EspressoStyleSelect = ({ id }) => (
    <label className="block text-xs text-neutral-600">
      Estilo
      <select
        className="mt-1 w-full rounded-lg border px-2 py-1 text-xs"
        value={styleOf(id)}
        onChange={(e) => setStyle(id, e.target.value)}
      >
        <option value="mancha">Macchiato (mancha)</option>
        <option value="mitad">Cortado (mitad)</option>
        <option value="mucha">Con leche</option>
      </select>
    </label>
  );

  const ChaiModeSelect = ({ id }) => (
    <label className="block text-xs text-neutral-600">
      Preparación
      <select
        className="mt-1 w-full rounded-lg border px-2 py-1 text-xs"
        value={modeOf(id)}
        onChange={(e) => setMode(id, e.target.value)}
      >
        <option value="infusion">Infusión</option>
        <option value="latte">Con leche (Chai Latte)</option>
      </select>
    </label>
  );

  // ————————————————————————————————————————
  const coffeeItems = COFFEES.filter((item) =>
    matchesQuery({ title: item.name, description: item.desc }, query)
  );
  const infusionItems = INFUSIONS.filter((item) =>
    matchesQuery({ title: item.name, description: item.desc }, query)
  );
  if (!coffeeItems.length && !infusionItems.length) return null;

  return (
    <div className="space-y-8">
      {/* CAFÉS */}
      <div>
        <h3 className="text-sm font-semibold text-alto-primary mb-3">Cafés</h3>
        <ul className="space-y-3">
          {coffeeItems.map((item) => {
            const st = getStockState(item.id || slugify(item.name));
            const disabled = st === "out";
            const isAmericano = /americano/i.test(item.name);
            const showAddMilk = item.milkPolicy === "optional" && !isAmericano;
            const showEspressoStyle =
              item.id === "cof-espresso" && addMilk[item.id];
            const showMilkSelect =
              (item.milkPolicy === "required" ||
                (item.milkPolicy === "optional" && addMilk[item.id])) &&
              !isAmericano;
            const hasControls =
              showAddMilk || showEspressoStyle || showMilkSelect;

            return (
              <li
                key={item.id}
                className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12"
              >
                <p className="font-semibold">{displayName(item)}</p>
                <p className="text-xs text-neutral-600">{item.desc}</p>
                {/* Controles contextuales */}
                {hasControls && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {showAddMilk && (
                      <button
                        className="text-xs text-alto-primary underline text-left"
                        onClick={() => toggleAddMilk(item.id)}
                      >
                        {addMilk[item.id] ? "Quitar leche" : "+ Agregar leche"}
                      </button>
                    )}
                    {showEspressoStyle && <EspressoStyleSelect id={item.id} />}
                    {showMilkSelect && (
                      <MilkSelect id={item.id} disabled={disabled} />
                    )}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {st === "low" && (
                    <StatusChip variant="low">Pocas unidades</StatusChip>
                  )}
                  {st === "out" && (
                    <StatusChip variant="soldout">Agotado</StatusChip>
                  )}
                </div>
                <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
                  ${COP(finalPrice(item))}
                </div>
                <AddIconButton
                  className="absolute bottom-4 right-4 z-20"
                  aria-label={"Añadir " + displayName(item)}
                  onClick={() => addToCart(item)}
                  disabled={disabled}
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* INFUSIONES & TÉS (incluye Chai) */}
      <div>
        <h3 className="text-sm font-semibold text-alto-primary mb-3">
          Infusiones & Tés
        </h3>
        <ul className="space-y-3">
          {infusionItems.map((item) => {
            const st = getStockState(item.id || slugify(item.name));
            const disabled = st === "out";
            const isChai = !!item.chai;
            const showChaiMilk = isChai && modeOf(item.id) === "latte";

            return (
              <li
                key={item.id}
                className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12"
              >
                <p className="font-semibold">{displayName(item)}</p>
                <p className="text-xs text-neutral-600">{item.desc}</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {isChai && <ChaiModeSelect id={item.id} />}
                  {showChaiMilk && (
                    <MilkSelect id={item.id} disabled={disabled} />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {st === "low" && (
                    <StatusChip variant="low">Pocas unidades</StatusChip>
                  )}
                  {st === "out" && (
                    <StatusChip variant="soldout">Agotado</StatusChip>
                  )}
                </div>
                <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
                  ${COP(finalPrice(item))}
                </div>
                <AddIconButton
                  className="absolute bottom-4 right-4 z-20"
                  aria-label={"Añadir " + displayName(item)}
                  onClick={() => addToCart(item)}
                  disabled={disabled}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
