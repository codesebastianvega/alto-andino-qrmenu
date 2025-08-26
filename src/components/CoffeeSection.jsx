import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { StatusChip } from "./Buttons";
import { toast } from "./Toast";
import { useCart } from "../context/CartContext";
import { formatCOP } from "../utils/money";
import { getStockState, slugify, isUnavailable } from "../utils/stock";
import { matchesQuery } from "../utils/strings";
import { coffees, infusions } from "../data/menuItems";
import { getProductImage } from "../utils/images";

// ————————————————————————————————————————
// Configuración de bebidas
// milkPolicy: 'none' | 'optional' | 'required'
// ← editar nombres y precios aquí
const MILK_OPTIONS = [
  { id: "entera", label: "Entera", delta: 0 },
  { id: "deslactosada", label: "Deslactosada", delta: 0 },
  { id: "almendras", label: "Almendras (+$3.800)", delta: 3800 },
];

// ————————————————————————————————————————
// Utilidades de stock y precio
function findMilkDelta(milkId) {
  const opt = MILK_OPTIONS.find((o) => o.id === milkId);
  return opt ? opt.delta : 0;
}

// ————————————————————————————————————————
// Componente principal
export default function CoffeeSection({ query, onCount, onQuickView }) {
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
  const coffeeItems = (coffees || []).filter((item) =>
    matchesQuery({ title: item.name, description: item.desc }, query)
  );
  const infusionItems = (infusions || []).filter((item) =>
    matchesQuery({ title: item.name, description: item.desc }, query)
  );
  const count = coffeeItems.length + infusionItems.length;
  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  if (!count) return null;

  return (
    <div className="space-y-8">
      {/* CAFÉS */}
      <div>
        <h3 className="text-sm font-semibold text-[#2f4131] mb-3">Cafés</h3>
        <ul className="space-y-3">
          {coffeeItems.map((item) => {
            const st = getStockState(item.id || slugify(item.name));
            const unavailable = st === "out" || isUnavailable(item);
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
            const options = {};
            const usesMilk =
              item.milkPolicy === "required" ||
              (item.milkPolicy === "optional" && addMilk[item.id]);
            if (usesMilk) options["Leche"] = milkOf(item.id);
            if (item.id === "cof-espresso" && addMilk[item.id]) {
              const style = styleOf(item.id);
              options["Estilo"] =
                style === "mancha"
                  ? "Macchiato"
                  : style === "mitad"
                  ? "Cortado"
                  : "Con leche";
            }
            const product = {
              productId: item.id,
              id: unavailable ? undefined : item.id,
              title: displayName(item),
              name: displayName(item),
              subtitle: item.desc,
              price: finalPrice(item),
              options,
            };

            const handleAdd = () => {
              if (unavailable) {
                toast("Producto no disponible");
                return;
              }
              addToCart(item);
            };
            const handleAddClick = (e) => {
              e.stopPropagation();
              handleAdd();
            };

            return (
              <article
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onQuickView?.(product)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onQuickView?.(product);
                  }
                }}
                aria-disabled={unavailable}
                className="group grid grid-cols-[96px_1fr] gap-3 p-3 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
              >
                <img
                  src={getProductImage(product)}
                  alt={displayName(item)}
                  loading="lazy"
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="min-w-0 flex flex-col">
                  <h3 className="text-base font-semibold truncate">{displayName(item)}</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-0.5">{item.desc}</p>
                  {hasControls && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {showAddMilk && (
                        <button
                          type="button"
                          className="text-xs text-[#2f4131] underline text-left"
                          onClick={() => toggleAddMilk(item.id)}
                        >
                          {addMilk[item.id] ? "Quitar leche" : "+ Agregar leche"}
                        </button>
                      )}
                      {showEspressoStyle && <EspressoStyleSelect id={item.id} />}
                      {showMilkSelect && (
                        <MilkSelect id={item.id} disabled={unavailable} />
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
                    {st !== "out" && isUnavailable(item) && (
                      <StatusChip variant="soldout">No Disponible</StatusChip>
                    )}
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div>
                      <div className="text-base font-semibold">{formatCOP(finalPrice(item))}</div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Agregar ${displayName(item)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (unavailable) {
                          toast("Producto no disponible");
                          return;
                        }
                        addToCart(item);
                      }}
                      className="h-10 w-10 grid place-items-center rounded-full bg-[#2f4131] text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </ul>
      </div>

      {/* INFUSIONES & TÉS (incluye Chai) */}
      <div>
        <h3 className="text-sm font-semibold text-[#2f4131] mb-3">
          Infusiones & Tés
        </h3>
        <ul className="space-y-3">
          {infusionItems.map((item) => {
            const st = getStockState(item.id || slugify(item.name));
            const unavailable = st === "out" || isUnavailable(item);
            const isChai = !!item.chai;
            const showChaiMilk = isChai && modeOf(item.id) === "latte";
            const options = {};
            if (isChai) {
              const mode = modeOf(item.id);
              options["Preparación"] = mode === "latte" ? "Con leche" : "Infusión";
              if (showChaiMilk) options["Leche"] = milkOf(item.id);
            }
            const product = {
              productId: item.id,
              id: unavailable ? undefined : item.id,
              title: displayName(item),
              name: displayName(item),
              subtitle: item.desc,
              price: finalPrice(item),
              options,
            };

            const handleAdd = () => {
              if (unavailable) {
                toast("Producto no disponible");
                return;
              }
              addToCart(item);
            };
            const handleAddClick = (e) => {
              e.stopPropagation();
              handleAdd();
            };

            return (
              <article
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onQuickView?.(product)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onQuickView?.(product);
                  }
                }}
                aria-disabled={unavailable}
                className="group grid grid-cols-[96px_1fr] gap-3 p-3 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
              >
                <img
                  src={getProductImage(product)}
                  alt={displayName(item)}
                  loading="lazy"
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="min-w-0 flex flex-col">
                  <h3 className="text-base font-semibold truncate">{displayName(item)}</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-0.5">{item.desc}</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {isChai && <ChaiModeSelect id={item.id} />}
                    {showChaiMilk && (
                      <MilkSelect id={item.id} disabled={unavailable} />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {st === "low" && (
                      <StatusChip variant="low">Pocas unidades</StatusChip>
                    )}
                    {st === "out" && (
                      <StatusChip variant="soldout">Agotado</StatusChip>
                    )}
                    {st !== "out" && isUnavailable(item) && (
                      <StatusChip variant="soldout">No Disponible</StatusChip>
                    )}
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div>
                      <div className="text-base font-semibold">{formatCOP(finalPrice(item))}</div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Agregar ${displayName(item)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (unavailable) {
                          toast("Producto no disponible");
                          return;
                        }
                        addToCart(item);
                      }}
                      className="h-10 w-10 grid place-items-center rounded-full bg-[#2f4131] text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
