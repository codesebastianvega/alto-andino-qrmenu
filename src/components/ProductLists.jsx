import { useCart } from "../context/CartContext";
import { COP } from "../utils/money";
import { getStockState, slugify } from "../utils/stock";
import { AddIconButton, StatusChip } from "./Buttons";
import Section from "./Section";
import Sandwiches from "./Sandwiches";
import SmoothiesSection from "./SmoothiesSection";
import CoffeeSection from "./CoffeeSection";
import BowlsSection from "./BowlsSection";
import ColdDrinksSection from "./ColdDrinksSection";
import CategoryBar from "./CategoryBar";
import FeaturedToday from "./FeaturedToday";
import PromoBannerCarousel from "./PromoBannerCarousel";

export default function ProductLists({ setOpenGuide }) {
  const N = import.meta.env.VITE_FEATURED_NAME || "Sandiwch de Cerdo al Horno";
  const D =
    import.meta.env.VITE_FEATURED_DESC ||
    "Delicioso sandiwch de cerdo al horno casero y saludable.";
  const P = Number(import.meta.env.VITE_FEATURED_PRICE || 12000);
  const IMG = import.meta.env.VITE_FEATURED_IMAGE || "/especial1.png";

  const banners = [
    {
      id: "featured",
      type: "product",
      title: N,
      subtitle: D,
      image: IMG,
      productId: "featured-of-day",
      price: P,
    },
    {
      id: "barista",
      type: "product",
      title: "Recomendado del barista",
      subtitle: "Nuestro café favorito de hoy",
      image: "/especial1.png",
      productId: "cof-espresso",
      price: 6000,
    },
    {
      id: "season",
      type: "product",
      title: "Temporada",
      subtitle: "Producto de temporada",
      image: "/poke1.png",
      productId: "smoothie:Brisas Tropicales",
      price: 18000,
    },
    {
      id: "pet-friendly",
      type: "info",
      title: "Somos Pet Friendly",
      subtitle: "Tu mascota es bienvenida",
      image: "/especial1.png",
      ctas: { primary: { label: "Ver más" } },
    },
    {
      id: "reviews",
      type: "info",
      title: "Reseñas",
      subtitle: "Lee lo que opinan nuestros clientes",
      image: "/poke1.png",
      ctas: { primary: { label: "Ver reseñas" } },
    },
  ];

  return (
    <>
      <CategoryBar onOpenGuide={() => setOpenGuide?.(true)} />
      <PromoBannerCarousel banners={banners} />
      <FeaturedToday />
      <Section title="Desayunos">
        <Breakfasts />
      </Section>
      <Section title="Bowls">
        <BowlsSection />
      </Section>
      <Section title="Platos">
        <Mains />
      </Section>
      <Section title="Sándwiches">
        <Sandwiches />
      </Section>
      <Section title="Smoothies">
        <SmoothiesSection />
      </Section>
      <Section title="Café">
        <CoffeeSection />
      </Section>
      <ColdDrinksSection />
      <Section title="Postres">
        <Desserts />
      </Section>
    </>
  );
}

export function Breakfasts() {
  // ← editar nombres y precios aquí
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
  // ← editar nombres y precios aquí
  const items = [
    {
      id: "main-salmon",
      name: "Salmón Andino 200 gr",
      price: 47000,
      desc: "En sartén de hierro, salsa miel-mostaza y orégano con guarnición de pure de ahuyama y ensalada de granos calientes.",
    },
    {
      id: "main-trucha",
      name: "Trucha del Páramo 450 gr",
      price: 42000,
      desc: "A la plancha con alioli griego con guarnición pure de papa y ensalada fría.",
    },
    {
      id: "main-bolo",
      name: "Spaghetti a la Boloñesa",
      price: 28000,
      desc: "Salsa pomodoro, carne de res; albahaca fresca y ralladura de parmesano. 🌾🥛",
    },
    {
      id: "main-champi",
      name: "Champiñones a la Madrileña",
      price: 18000,
      desc: "125 gr de champiñones en mantequilla y ajo, vino espumoso, jamón serrano, perejil y ralladura de parmesano. 🥛",
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
  // ← editar nombres y precios aquí
  const cumbreSabores = [
    { id: "rojos", label: "Frutos rojos" },
    { id: "amarillos", label: "Frutos amarillos" },
    { id: "blancos", label: "Frutos blancos" },
    { id: "choco", label: "Chococumbre" },
  ];
  // ← editar nombres y precios aquí
  const cumbrePrices = {
    rojos: 10000,
    amarillos: 10000,
    choco: 11000,
    blancos: 12000,
  };

  // Postres de vitrina (precios según carta)
  // ← editar nombres y precios aquí
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
      <div className="rounded-2xl p-5 sm:p-6 shadow-sm bg-white">
        <p className="font-semibold">Cumbre Andino (sin azúcar)</p>
        <p className="text-xs text-neutral-600 mt-1">
          Yogur griego endulzado con alulosa, mermelada natural, galleta sin
          azúcar, chantilly con eritritol y fruta.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {cumbreSabores.map((s) => {
            const id = "cumbre:" + s.id;
            const st = getStockState(id);
            const disabled = st === "out";
            const price = cumbrePrices[s.id];
            return (
              <div
                key={s.id}
                className={
                  "relative rounded-xl border border-neutral-200/60 bg-white p-4 sm:p-5 pr-20 pb-12 " +
                  (disabled ? "opacity-60" : "")
                }
              >
                <p className="text-sm">{s.label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {st === "low" && (
                    <StatusChip variant="low">Pocas unidades</StatusChip>
                  )}
                  {st === "out" && (
                    <StatusChip variant="soldout">Agotado</StatusChip>
                  )}
                </div>
                <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
                  ${COP(price)}
                </div>
                <AddIconButton
                  className="absolute bottom-4 right-4 z-20"
                  aria-label={"Añadir Cumbre Andino " + s.label}
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
  const st = getStockState(item.id || slugify(item.name));
  const disabled = st === "out";
  return (
    <li className="relative rounded-2xl p-5 sm:p-6 shadow-sm bg-white pr-20 pb-12">
      <p className="font-semibold">{item.name}</p>
      <p className="text-xs text-neutral-600 mt-1">{item.desc}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {st === "low" && <StatusChip variant="low">Pocas unidades</StatusChip>}
        {st === "out" && <StatusChip variant="soldout">Agotado</StatusChip>}
      </div>
      <div className="absolute top-5 right-5 z-10 text-neutral-800 font-semibold">
        ${COP(item.price)}
      </div>
      <AddIconButton
        className="absolute bottom-4 right-4 z-20"
        aria-label={"Añadir " + item.name}
        onClick={() =>
          addItem({ productId: item.id, name: item.name, price: item.price })
        }
        disabled={disabled}
      />
    </li>
  );
}
