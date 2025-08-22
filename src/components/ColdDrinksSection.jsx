import React from "react";
import Section from "./Section";
import { useCart } from "../context/CartContext";
import { AddIconButton } from "./Buttons";
import { COP as COPUtil } from "../utils/money";

// Formateo COP con guardado (si COPUtil no existe o falla)
const money = (v) => {
  try {
    if (typeof COPUtil === "function") return COPUtil(v);
  } catch {}
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  if (!isFinite(n)) return String(v);
  return n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
};

// DATA EXACTA DE LA CARTA
const SODAS = [
  { id: "soda-zen", name: "Soda Zen", price: 3500, desc: "Frutos rojos, Durazno, Limonata rosada" },
  { id: "coca-250", name: "Coca-Cola 250 mL", price: 2500 },
  { id: "coca-400", name: "Coca-Cola 400 mL", price: 4500 },
  { id: "soda-manantial-400", name: "Soda Manantial 400 mL", price: 5000 },
  { id: "agua-manantial-500", name: "Agua Manantial 500 mL", price: 6000 },
  { id: "hatsu-rosas-frambuesa-lata", name: "Hatsu Rosas y Frambuesa (lata)", price: 4500 },
  { id: "hatsu-uva-romero-lata", name: "Hatsu Uva y Romero (lata)", price: 4500 },
  { id: "hatsu-uva-romero-botella", name: "Hatsu Uva y Romero (botella)", price: 4000 },
  { id: "hatsu-albahaca-botella", name: "Hatsu Albahaca (botella)", price: 4000 },
  { id: "hatsu-yerbabuena-botella", name: "Hatsu Yerbabuena (botella)", price: 4000 },
];

const OTHERS = [
  { id: "te-hatsu-400", name: "Té Hatsu 400 mL", price: 5000, desc: "Rojo, Negro, Aguamarina, Rosado, Fucsia, Blanco, Amarillo, Verde" },
  { id: "te-hatsu-caja-200", name: "Té Hatsu Caja 200 mL", price: 2000, desc: "Blanco, Amarillo, Aguamarina" },
  { id: "saviloe-250", name: "SaviLoe 250 mL", price: 3500 },
  { id: "savifruit", name: "SaviFruit", price: 2500 },
  { id: "electrolit", name: "Electrolit", price: 9000, desc: "Coco, Durazno, Fresa, Fresa-Kiwi, Lima-Limón, Naranja-Mandarina, Piña, Uva, Maracuyá, Mora azul" },
  { id: "go-aloe-sparkling", name: "Go Aloe Sparkling", price: 6500, desc: "Watermelon, Natural, Ginger" },
  { id: "cool-drink", name: "Cool Drink", price: 4000, desc: "Kiwi, Granada, Maracuyá, Manzana verde, Mangostino" },
];

function Card({ item, onAdd }) {
  return (
    <div className="relative rounded-xl bg-white ring-1 ring-neutral-200 p-3 pr-16 pb-12 min-h-[96px]">
      <p className="text-neutral-900 font-medium text-sm leading-tight break-words">
        {item.name}
      </p>
      {item.desc && (
        <p className="mt-0.5 text-xs text-neutral-600 leading-snug break-words">
          {item.desc}
        </p>
      )}

      {/* Precio fijo arriba-derecha con ancho mínimo para no chocar */}
      <div className="absolute top-2 right-2 min-w-[64px] text-right text-neutral-900 font-semibold text-sm">
        {"$" + money(item.price)}
      </div>

      {/* FAB compacto y claro de la zona de texto */}
      <AddIconButton
        className="absolute bottom-2 right-2 scale-90 sm:scale-100"
        aria-label={"Añadir " + item.name}
        onClick={() =>
          onAdd({
            productId: item.id,
            name: item.name,
            price: item.price,
            priceFmt: "$" + money(item.price),
            qty: 1,
          })
        }
      />
    </div>
  );
}

export default function ColdDrinksSection() {
  const { addItem } = useCart();

  return (
    <Section title="Bebidas frías">
      {/* Subgrupo: Gaseosas y Sodas */}
      <h3 className="text-sm font-semibold text-[#2f4131] mb-2">Gaseosas y Sodas</h3>
      <div className="grid grid-cols-2 gap-3">
        {SODAS.map((it) => (
          <Card key={it.id} item={it} onAdd={addItem} />
        ))}
      </div>

      {/* Subgrupo: Jugos y otras bebidas frías */}
      <h3 className="mt-5 text-sm font-semibold text-[#2f4131] mb-2">Jugos y otras bebidas frías</h3>
      <div className="grid grid-cols-2 gap-3">
        {OTHERS.map((it) => (
          <Card key={it.id} item={it} onAdd={addItem} />
        ))}
      </div>
    </Section>
  );
}

