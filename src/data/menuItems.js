export const cats = [
  "desayunos",
  "bowls",
  "platos",
  "sandwiches",
  "smoothies",
  "cafe",
  "bebidasfrias",
  "postres",
];

export const breakfastItems = [
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
    desc: "3 huevos en sartén de hierro; 2 tostadas con queso crema y vegetales + Bebida caliente. 🥚🌾🥛",
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

export const mainDishes = [
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
    name: "Ceviche de Camarón",
    price: 22000,
    desc: "Camarón marinado en cítricos; pimentón, salsa de tomate casera, cilantro y cebolla morada; con aguacate.",
  },
  {
    id: "main-burger",
    name: "Burger Andina (Pavo 150 gr)",
    price: 26000,
    desc: "Pavo sazonado, salsa de yogur, tomate, lechuga, chucrut y queso Colby Jack en pan artesanal. 🥛🌾",
  },
];

export const dessertBaseItems = [
  {
    id: "post-red",
    name: "Red Velvet",
    price: 11000,
    desc: "Bizcocho rojo con crema batida de la casa, endulzado con eritritol y stevia. 🌾🥛",
  },
  {
    id: "post-tres",
    name: "Tres Leches (saludable)",
    price: 6200,
    desc: "Harina de almendras y avena; dulce de tres leches con alulosa; chantilly con eritritol. 🥛🌾",
  },
  {
    id: "post-tira",
    name: "Tiramisú (saludable)",
    price: 6800,
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

export const cumbreFlavors = [
  { id: "rojos", label: "Frutos rojos" },
  { id: "amarillos", label: "Frutos amarillos" },
  { id: "blancos", label: "Frutos blancos" },
  { id: "choco", label: "Chococumbre" },
];

export const cumbrePrices = {
  rojos: 10000,
  amarillos: 10000,
  choco: 11000,
  blancos: 12000,
};

export const preBowl = {
  id: "bowl-poke-hawaiano",
  name: "Poke Hawaiano",
  price: 32000, // 28.000 base + 4.000 premium salmón
  desc: "Arroz blanco, salmón, aguacate, mango y pepino; ajonjolí y salsa mango-yaki.",
  options: {
    Base: "Arroz blanco",
    Proteína: "Salmón",
    Toppings: ["Aguacate", "Mango", "Pepino"],
    Extras: ["Ajonjolí"],
    Salsa: "Mango-yaki",
  },
};

export const sandwichItems = [
  {
    key: "cerdo",
    name: "Sandwich de Cerdo",
    desc: "Pierna de cerdo horneada con Mayo-Pesto, lechuga, tomate y suero costeño.",
  },
  {
    key: "pollo",
    name: "Sandwich de Pollo",
    desc: "Pechuga en cocción lenta, alioli de yogurt (con ajo), lechuga y tomate.",
  },
  {
    key: "pavo",
    name: "Sandwich de Pavo",
    desc: "Pavo horneado en cocción lenta, alioli de yogurt (con ajo), tomates secos y lechuga.",
  },
  {
    key: "serrano",
    name: "Serrano Di Búfala",
    desc: "Queso crema, espinaca, jamón serrano, queso de búfala, tomate cherry salteado y balsámico. 🥛",
  },
  {
    key: "cosecha",
    name: "Cosecha del Páramo 🌿",
    desc: "Hummus casero, pimientos asados, aguacate, champiñón a la plancha, pepino y lechugas; lámina de queso costeño frito. 🥛",
  },
];

export const smoothies = [
  {
    id: "smoothie:Brisas Tropicales",
    name: "Brisas Tropicales",
    price: 18000,
    desc: "Hierbabuena, mango, maracuyá y piña; leche de almendras, yogur griego y chía. 🥛🥜",
  },
  {
    id: "smoothie:El Néctar Andino",
    name: "El Néctar Andino",
    price: 17000,
    desc: "Fresas y arándanos, marañones y avena; leche a elección y vainilla. 🥛🌾🥜",
  },
  {
    id: "smoothie:Verde Amanecer de la Sabana",
    name: "Verde Amanecer de la Sabana",
    price: 16000,
    desc: "Espinaca, kiwi, banano, manzana verde, jengibre y yerbabuena.",
  },
];

export const funcionales = [
  {
    id: "smoothie:Elixir del Cóndor (Detox)",
    name: "Elixir del Cóndor (Detox)",
    price: 18000,
    desc: "Pepino, apio, manzana verde, limón y jengibre; espirulina + clorofila.",
  },
  {
    id: "smoothie:Guardian de la Montaña",
    name: "Guardián de la Montaña",
    price: 17000,
    desc: "Naranja, cúrcuma, zanahoria, un toque de pimienta negra, jengibre y miel de abejas local.",
  },
  {
    id: "smoothie:Aurora Proteica",
    name: "Aurora Proteica",
    price: 22000,
    desc: "Leche de almendras, proteína vegetal (vainilla/chocolate), banano y chía. 🥜",
  },
];

export const coffees = [
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

export const infusions = [
  {
    id: "aro-fresa",
    name: "Aromatica de fresa",
    price: 5000,
    desc: "Té de frutos rojos con hierbabuena y fresas deshidratadas.",
  },
  {
    id: "inf-chai",
    name: "Té Chai",
    price: 9000,
    desc: "Blend especiado. Puede ser infusión o con leche (Chai Latte).",
    chai: true,
  },
];

export const sodas = [
  {
    id: "soda-zen",
    name: "Soda Zen",
    price: 3500,
    desc: "Frutos rojos, Durazno, Limonata rosada",
  },
  { id: "coca-250", name: "Coca-Cola 250 mL", price: 2500 },
  { id: "coca-400", name: "Coca-Cola 400 mL", price: 4500 },
  { id: "soda-manantial-400", name: "Soda Manantial 400 mL", price: 5000 },
  { id: "agua-manantial-500", name: "Agua Manantial 500 mL", price: 6000 },
  {
    id: "hatsu-rosas-frambuesa-lata",
    name: "Hatsu Rosas y Frambuesa (lata)",
    price: 4500,
  },
  {
    id: "hatsu-uva-romero-lata",
    name: "Hatsu Uva y Romero (lata)",
    price: 4500,
  },
  {
    id: "hatsu-uva-romero-botella",
    name: "Hatsu Uva y Romero (botella)",
    price: 4000,
  },
  {
    id: "hatsu-albahaca-botella",
    name: "Hatsu Albahaca (botella)",
    price: 4000,
  },
  {
    id: "hatsu-yerbabuena-botella",
    name: "Hatsu Yerbabuena (botella)",
    price: 4000,
  },
];

export const otherDrinks = [
  {
    id: "te-hatsu-400",
    name: "Té Hatsu 400 mL",
    price: 5000,
    desc: "Rojo, Negro, Aguamarina, Rosado, Fucsia, Blanco, Amarillo, Verde",
  },
  {
    id: "te-hatsu-caja-200",
    name: "Té Hatsu Caja 200 mL",
    price: 2000,
    desc: "Blanco, Amarillo, Aguamarina",
  },
  { id: "saviloe-250", name: "SaviLoe 250 mL", price: 3500 },
  { id: "savifruit", name: "SaviFruit", price: 2500 },
  {
    id: "electrolit",
    name: "Electrolit",
    price: 9000,
    desc: "Coco, Durazno, Fresa, Fresa-Kiwi, Lima-Limón, Naranja-Mandarina, Piña, Uva, Maracuyá, Mora azul",
  },
  {
    id: "go-aloe-sparkling",
    name: "Go Aloe Sparkling",
    price: 6500,
    desc: "Watermelon, Natural, Ginger",
  },
  {
    id: "cool-drink",
    name: "Cool Drink",
    price: 4000,
    desc: "Kiwi, Granada, Maracuyá, Manzana verde, Mangostino",
  },
];
