import { useState } from "react";
import { AddIconButton, StatusChip } from "./Buttons";
import { useCart } from "../context/CartContext";
import { COP } from "../utils/money";
import stock from "../data/stock.json";

// ————————————————————————————————————————
// Configuración de bebidas
// milkPolicy: 'none' | 'optional' | 'required'
const MILK_OPTIONS = [
  { id: "entera", label: "Entera", delta: 0 },
  { id: "deslactosada", label: "Deslactosada", delta: 0 },
  { id: "almendras", label: "Almendras (+$3.800)", delta: 3800 },
];

// Cafés (agrupados)
const COFFEES = [
  // Sin leche por defecto
  {
    id: "cof-espresso",
    name: "Espresso",
    price: 6000,
    desc: "25–30 ml de café concentrado.",
    milkPolicy: "optional",
    kind: "espresso",
  },
  {
    id: "cof-americano",
    name: "Americano",
    price: 7000,
    desc: "Espresso con agua caliente (~1:2–1:3).",
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
    price: 12000,
    desc: "Espresso con leche al vapor y espuma (≈1:1:1).",
    milkPolicy: "required",
    kind: "milk",
  },
  {
    id: "cof-latte",
    name: "Latte",
    price: 12000,
    desc: "Espresso con más leche y fina capa de espuma.",
    milkPolicy: "required",
    kind: "milk",
  },
  {
    id: "cof-flat",
    name: "Flat White",
    price: 13000,
    desc: "Doble espresso + microespuma fina (taza pequeña).",
    milkPolicy: "required",
    kind: "milk",
  },
  {
    id: "cof-moca",
    name: "Mocaccino",
    price: 13000,
    desc: "Latte con chocolate y espuma ligera.",
    milkPolicy: "required",
    kind: "milk",
  },
  {
    id: "cof-choco",
    name: "Chocolate Caliente",
    price: 10000,
    desc: "Bebida de cacao con leche.",
    milkPolicy: "required",
    kind: "milk",
  },
];

// Infusiones y tés (incluye Chai)
const INFUSIONS = [
  {
    id: "inf-aromatica",
    name: "Aromática de frutas",
    price: 9000,
    desc: "Infusión de frutas y hierbas.",
  },
  {
    id: "inf-ginger",
    name: "Té jengibre y miel",
    price: 9000,
    desc: "Jengibre, limón y miel.",
  },
  {
    id: "inf-verde",
    name: "Té verde",
    price: 8000,
    desc: "Té verde caliente.",
  },
  {
    id: "inf-manzanilla",
    name: "Manzanilla",
    price: 8000,
    desc: "Infusión de flores de manzanilla.",
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
function stateFor(id) {
  const s = (stock.products || {})[id];
  return s === "low" ? "low" : s === false ? "out" : "ok";
}

function findMilkDelta(milkId) {
  const opt = MILK_OPTIONS.find((o) => o.id === milkId);
  return opt ? opt.delta : 0;
}

// ————————————————————————————————————————
// Componente principal
export default function CoffeeSection() {
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
  const MilkSelect = ({ id, disabled }) => (
    <label className="block text-xs text-neutral-600">
      Leche
      <select
        className="mt-1 w-full rounded-lg border px-2 py-1 text-xs"
        value={milkOf(id)}
        onChange={(e) => setMilk(id, e.target.value)}
        disabled={disabled}
      >
        {MILK_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );

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
  return (
    <div className="space-y-8">
      {/* CAFÉS */}
      <div>
        <h3 className="text-sm font-semibold text-alto-primary mb-3">Cafés</h3>
        <ul className="space-y-3">
          {COFFEES.map((item) => {
            const st = stateFor(item.id);
            const disabled = st === "out";
            const showMilkSelect =
              item.milkPolicy === "required" ||
              (item.milkPolicy === "optional" && addMilk[item.id]);

            return (
              <li
                key={item.id}
                className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12"
              >
                <p className="font-semibold">{displayName(item)}</p>
                <p className="text-xs text-neutral-600">{item.desc}</p>
                {/* Controles contextuales */}
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {item.milkPolicy === "optional" && (
                    <button
                      className="text-xs text-alto-primary underline text-left"
                      onClick={() => toggleAddMilk(item.id)}
                    >
                      {addMilk[item.id]
                        ? "Quitar leche"
                        : "+ Agregar leche"}
                    </button>
                  )}
                  {item.id === "cof-espresso" && addMilk[item.id] && (
                    <EspressoStyleSelect id={item.id} />
                  )}
                  {showMilkSelect && (
                    <MilkSelect id={item.id} disabled={disabled} />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {st === "low" && (
                    <StatusChip variant="low">Pocas unidades</StatusChip>
                  )}
                  {disabled && (
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
          {INFUSIONS.map((item) => {
            const st = stateFor(item.id);
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
                  {disabled && (
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
