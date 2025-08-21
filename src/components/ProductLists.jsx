import { useCart } from "../context/CartContext";
import { COP } from "../utils/money";
import stock from "../data/stock.json"; // ← sin assert
import { AddIconButton } from "./Buttons";

// estado global: 'ok' | 'low' | 'out'
function stateFor(productId) {
  const s = (stock.products || {})[productId];
  return s === "low" ? "low" : s === false ? "out" : "ok";
}

export function Breakfasts() {
  const items = [
    {
      id: "des-sendero",
      name: "Sendero Matinal",
      price: 16000,
      desc: "Bebida caliente + omelette con champiñones, lechugas, tomate cherry y queso, con tostadas multigranos. 🥚🌾🥛",
    },
    {
      id: "des-cumbre",
      name: "Cumbre Energética",
      price: 18000,
      desc: "Bebida caliente + arepa con queso mozzarella, aguacate y ajonjolí negro; yogur griego con arándanos y chía. 🥛🌾",
    },
    {
      id: "des-huevos",
      name: "Huevos al Gusto",
      price: 17500,
      desc: "3 huevos en sartén de hierro; 2 tostadas con queso crema y vegetales. 🥚🌾🥛",
    },
    {
      id: "des-caldo",
      name: "Caldo de Costilla de Res",
      price: 18500,
      desc: "Con papa y cilantro. Incluye bebida caliente + huevos al gusto, arepa y queso. 🥚🥛",
    },
    {
      id: "des-amanecer",
      name: "Bowl Amanecer Andino",
      price: 19000,
      desc: "Yogur griego + açaí, avena, coco, banano, fresa y arándanos; topping de chía o amapola. 🥛🌾🥜",
    },
  ];
  return <List items={items} />;
}

export function Mains() {
  const items = [
    {
      id: "main-salmon",
      name: "Salmón Andino 200 g 🐟",
      price: 47000,
      desc: "En sartén de hierro, salsa miel-mostaza y orégano; chips de yuca y ensalada de granos calientes.",
    },
    {
      id: "main-trucha",
      name: "Trucha del Páramo 450 g 🐟",
      price: 42000,
      desc: "A la plancha con alioli griego; chips de papa artesanales y ensalada fría.",
    },
    {
      id: "main-bolo",
      name: "Spaghetti a la Boloñesa",
      price: 28000,
      desc: "Salsa de res con albahaca, tomate, pimientos y cebolla; queso parmesano. 🌾🥛",
    },
    {
      id: "main-champi",
      name: "Champiñones a la Madrileña",
      price: 18000,
      desc: "125 g de champiñones en mantequilla y ajo, vino espumoso, jamón serrano, perejil y ralladura de parmesano. 🥛",
    },
    {
      id: "main-ceviche",
      name: "Ceviche de Camarón 🐟",
      price: 22000,
      desc: "Camarón marinado en cítricos; pimentón, salsa de tomate casera, cilantro y cebolla morada; con aguacate.",
    },
    {
      id: "main-burger",
      name: "Burger Andina (Pavo 150 g)",
      price: 26000,
      desc: "Pavo sazonado, salsa de yogur, tomate, lechuga, chucrut y queso Colby Jack en pan artesanal. 🥛🌾",
    },
  ];
  return <List items={items} />;
}

export function Desserts() {
  const { addItem } = useCart();

  // Sabores + precios específicos (según tu instrucción):
  // rojos y amarillos: $10.000 · chococumbre: $11.000 · blancos: $12.000
  const cumbreSabores = [
    { id: "rojos", label: "Frutos rojos" },
    { id: "amarillos", label: "Frutos amarillos" },
    { id: "blancos", label: "Frutos blancos" },
    { id: "choco", label: "Chococumbre" },
  ];
  const cumbrePrices = {
    rojos: 10000,
    amarillos: 10000,
    choco: 11000,
    blancos: 12000,
  };
  const cumbreStock = stock.cumbre || {};

  // Postres de vitrina (precios según carta)
  const base = [
    {
      id: "post-red",
      name: "Red Velvet",
      price: 11000,
      desc: "Bizcocho rojo con crema batida de la casa, endulzado con eritritol y stevia. 🌾🥛",
    },
    {
      id: "post-tres",
      name: "Tres Leches (saludable)",
      price: 12000,
      desc: "Harina de almendras y avena; dulce de tres leches con alulosa; chantilly con eritritol. 🥛🌾",
    },
    {
      id: "post-tira",
      name: "Tiramisú (saludable)",
      price: 12000,
      desc: "Bizcocho de almendras y avena, café especial, chantilly con alulosa y cacao espolvoreado. 🥛🌾",
    },
    {
      id: "post-amap",
      name: "Torta de Amapola",
      price: 10000,
      desc: "Harina de avena y semillas de amapola; crema chantilly endulzada con alulosa. 🥛🌾",
    },
    {
      id: "post-vasca",
      name: "Torta Vasca de Limón",
      price: 10000,
      desc: "Crema de leche, queso crema y maicena; vainilla y sal marina. 🥛",
    },
    {
      id: "post-fresas",
      name: "Fresas con Crema",
      price: 9000,
      desc: "Fresas con crema chantilly endulzada con alulosa. 🥛",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Cumbre Andino con precio por sabor */}
      <div className="card p-3">
        <p className="font-semibold">Cumbre Andino (sin azúcar)</p>
        <p className="text-xs text-neutral-600 mt-1">
          Yogur griego endulzado con alulosa, mermelada natural, galleta sin
          azúcar, chantilly con eritritol y fruta.
        </p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {cumbreSabores.map((s) => {
            const st =
              cumbreStock[s.id] === "low"
                ? "low"
                : cumbreStock[s.id] === false
                ? "out"
                : "ok";
            const disabled = st === "out";
            const price = cumbrePrices[s.id];
            return (
              <div
                key={s.id}
                className={
                  "rounded-lg border px-3 py-2 relative " +
                  (disabled ? "opacity-60" : "")
                }
              >
                <div className="pb-6 pr-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{s.label}</span>
                      {st === "low" && (
                        <span className="badge badge-warn">Pocas unidades</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">${COP(price)}</span>
                      {disabled && (
                        <span className="badge badge-out mt-2 inline-block">Agotado</span>
                      )}
                    </div>
                  </div>
                </div>
                <AddIconButton
                  className="absolute bottom-4 right-4"
                  onClick={() =>
                    addItem({
                      productId: "cumbre",
                      name: "Cumbre Andino",
                      price,
                      options: { Sabor: s.label },
                    })
                  }
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Resto de postres */}
      <ul className="space-y-3">
        {base.map((p) => (
          <ProductRow key={p.id} item={p} />
        ))}
      </ul>
    </div>
  );
}

function List({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((p) => (
        <ProductRow key={p.id} item={p} />
      ))}
    </ul>
  );
}

function ProductRow({ item }) {
  const { addItem } = useCart();
  const st = stateFor(item.id);
  const disabled = st === "out";
  return (
    <li className="card p-3 relative">
      <div className="flex items-start justify-between gap-4 pb-6 pr-4">
        <div className="flex-1">
          <p className="font-semibold">{item.name}</p>
          <p className="text-xs text-neutral-600 mt-1">{item.desc}</p>
          {st === "low" && (
            <span className="badge badge-warn mt-2 inline-block">
              Pocas unidades
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold">${COP(item.price)}</p>
          {disabled && (
            <span className="badge badge-out mt-2 inline-block">Agotado</span>
          )}
        </div>
      </div>
      <AddIconButton
        className="absolute bottom-4 right-4"
        onClick={() =>
          addItem({ productId: item.id, name: item.name, price: item.price })
        }
        disabled={disabled}
      />
    </li>
  );
}
