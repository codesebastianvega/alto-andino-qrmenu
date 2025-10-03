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
    price: 16500,
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
  {
    id: "des-changua",
    name: "Changua",
    price: 9000,
    desc: "Leche caliente con huevo, cebolla larga y cilantro, acompañado de pan tostado. 🥚🥛🌾",
  },
];

export const mainDishes = [
  {
    id: "main-salmon",
    name: "Salmon Andino 200 gr",
    price: 47000,
    desc: "En sarten de hierro, salsa miel-mostaza y oregano con guarnicion de pure de ahuyama y ensalada de granos calientes.",
    group: "especiales",
    origin: "Region Andina",
  },
  {
    id: "main-trucha",
    name: "Trucha del Paramo 450 gr",
    price: 42000,
    desc: "A la plancha con alioli griego con guarnicion de pure de papa y ensalada fria.",
    group: "especiales",
    origin: "Boyaca, Colombia",
  },
  {
    id: "main-bolo",
    name: "Spaghetti a la Bolonesa",
    price: 28000,
    desc: "Salsa pomodoro, carne de res; albahaca fresca y ralladura de parmesano.",
    group: "pastas",
    origin: "Italia",
  },
  {
    id: "main-bolo-pollo",
    name: "Pasta cremosa de pollo y champinones",
    price: 30000,
    desc: "Fetuccini en salsa cremosa de queso, pollo en cubos, champinones salteados y perejil fresco.",
    group: "pastas",
    origin: "Italia",
  },
  {
    id: "main-champi",
    name: "Champinones a la Madrilena",
    price: 18000,
    desc: "125 gr de champinones en mantequilla y ajo, vino espumoso, jamon serrano, perejil y ralladura de parmesano.",
    group: "sabores",
    origin: "Madrid, Espana",
  },
  {
    id: "main-ceviche",
    name: "Ceviche de Camaron",
    price: 22000,
    desc: "Camaron marinado en citricos; pimenton, salsa de tomate casera, cilantro y cebolla morada; con aguacate.",
    group: "sabores",
    origin: "Costa del Pacifico",
  },
  {
    id: "main-burger",
    name: "Burger Andina",
    price: 26000,
    desc: "",
    group: "en_preparacion",
    origin: "Andes Colombianos",
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
    desc: "Pierna de cerdo horneada con Mayo-Pesto, lechuga, tomate y suero costeno.",
    group: "artesanal",
  },
  {
    key: "pollo",
    name: "Sandwich de Pollo",
    desc: "Pechuga en coccion lenta, alioli de yogurt (con ajo), lechuga y tomate.",
    group: "artesanal",
  },
  {
    key: "pavo",
    name: "Sandwich de Pavo",
    desc: "Pavo horneado en coccion lenta, alioli de yogurt (con ajo), tomates secos y lechuga.",
    group: "artesanal",
  },
  {
    key: "serrano",
    name: "Serrano Di Bufala",
    desc: "Queso crema, espinaca, jamon serrano, queso de bufala, tomate cherry salteado y balsamico.",
    group: "especial",
  },
  {
    key: "cosecha",
    name: "Cosecha del Paramo",
    desc: "Hummus casero, pimientos asados, aguacate, champinon a la plancha, pepino y lechugas; lamina de queso costeno frito.",
    group: "especial",
  },
];


export const sandwichTraditionals = [
  {
    id: "sandwich:tradicional-multigranos",
    name: "Multigranos Andino",
    desc: "Tres panes tajados multigranos, lechuga, tomate, salsas y jamon de pollo con queso mozzarella.",
    price: 8000,
  },
  {
    id: "sandwich:tradicional-calentito",
    name: "Calentito del Paramo",
    desc: "Dos panes tajados multigranos con jamon de pollo y queso mozzarella derretidos.",
    price: 5000,
  },
];

export const sandwichAdditions = [
  {
    id: "add-pan-masa-madre-paipa",
    name: "Pan de masa madre - Queso Paipa (150 g)",
    price: 4000,
    desc: "Miga suave con infusion de queso Paipa artesanal.",
  },
  {
    id: "add-pan-masa-madre-semillas",
    name: "Pan de masa madre - Semillas (150 g)",
    price: 4000,
    desc: "Corteza crujiente con mezcla de semillas tostadas.",
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
    id: "cof-ristretto",
    name: "Ristretto",
    price: 4000,
    desc: "Café concentrado, 20–25 ml. Más intenso y corto que el espresso.",
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

// Categorías pendientes de catalogar
export const lemonades = [];
export const waters = [];
export const frappes = [];

// Alias para mantener compatibilidad con componentes existentes
export const functionalSmoothies = funcionales;

// Nuevas subcategorías y ampliaciones para Café
export const moreInfusions = [
  {
    id: "inf-frutos-andinos",
    name: "Frutos rojos andinos",
    price: 5000,
    desc: "Té de frutos rojos con yerbabuena y fresas deshidratadas.",
  },
  {
    id: "inf-yerbabuena-manzanilla",
    name: "Aromática de yerbabuena y manzanilla",
    price: 5000,
    desc: "Infusión calmante de yerbabuena y manzanilla.",
  },
  {
    id: "inf-super-blend-azul",
    name: "Super Blend Hindú Azul (relax)",
    price: 4500,
    desc: "Con vitamina B3; manzanilla, canela y cidrón. Sabor a lavanda y coco.",
  },
  {
    id: "inf-super-blend-amarillo",
    name: "Super Blend Hindú Amarillo (digest)",
    price: 4500,
    desc: "Con probióticos (Bacillus coagulans). Sabor a pitaya.",
  },
];

// === Veggie ===
// Nuevos productos para la categoría Veggie
export const veggieBreakfast = [
  {
    id: "veg-tostada-primavera",
    name: "Tostada Primavera",
    price: 19200,
    desc:
      "Comienza tu día con energía con nuestra tostada de pan artesanal, generosamente cubierta con cremoso tofu sazonado, aguacate fresco en láminas, vibrantes tomates cherry y un toque de perejil y pimienta. Acompaña con tu bebida caliente favorita.",
  },
  {
    id: "veg-cosecha-huerto",
    name: "Cosecha del Huerto",
    price: 21500,
    desc:
      "Un plato robusto y nutritivo que celebra los sabores de la tierra. Disfruta de una mezcla abundante de garbanzos, tiernas berenjenas, dulces tomates cherry y tofu dorado, todo preparado para ofrecer una experiencia deliciosa y completa. Incluye tu bebida caliente a elección.",
  },
];

export const veggieMains = [
  {
    id: "veg-alfredo-bosque",
    name: "Alfredo Cremoso del Bosque",
    price: 27000,
    desc:
      "Déjate seducir por nuestra pasta de arroz vegana, bañada en una exquisita salsa Alfredo casera, elaborada con la riqueza de la leche de almendras y la cremosidad de los anacardos. Complementada con champiñones salteados a la perfección en aceite de coco.",
  },
  {
    id: "veg-ensalada-jardin-altura",
    name: "Ensalada Jardín de Altura",
    price: 28500,
    desc:
      "Una explosión de frescura y color en cada bocado. Esta deliciosa ensalada combina espárragos tiernos, garbanzos, jugosos tomates, aguacate asado, brotes frescos y brócoli. Todo ello coronado con crujientes semillas de calabaza y una exquisita reducción balsámica.",
  },
  {
    id: "veg-pasta-bolonesa",
    name: "Pasta Tipo Boloñesa",
    price: 26000,
    desc:
      "Deléitate con nuestra versión. Disfruta de nuestro spaghetti vegano sin gluten, cubierto con una sustanciosa salsa boloñesa casera, rica en proteína vegetal, albahaca fresca, tomates maduros, pimientos y cebolla. Servido con brócoli al vapor para una comida completa y deliciosa.",
  },
];

export const teasAndChai = [
  { id: "te-negro", name: "Té negro", price: 4500 },
  { id: "te-verde", name: "Té verde", price: 4500 },
  {
    id: "inf-chai",
    name: "Chai",
    price: 7000,
    desc: "Blend especiado. Puede ser infusión o con leche (Chai Latte).",
    chai: true,
  },
  { id: "matcha-lulo", name: "Matcha lulo", price: 7000 },
];



export const breakfastAdditions = [
  { id: "add-caldo-costilla", name: "Caldo de costilla", price: 9000 },
  { id: "add-ensalada-frutas", name: "Ensalada de frutas", price: 16000 },
  { id: "add-huevo-sencillo", name: "1 huevo al gusto", price: 3500 },
  { id: "add-tajada-pan", name: "Tajada de pan", price: 2500 },
  { id: "add-masa-madre", name: "Pan de masa madre - porcion", price: 4000 },
  { id: "add-queso-campesino", name: "Queso campesino (tajada)", price: 3500 },
  { id: "add-queso-loncha", name: "Queso loncha", price: 2500 },
  { id: "add-fruta-extra", name: "Adicion de fruta", price: 3500 },
  { id: "add-aguacate-extra", name: "Aguacate extra", price: 3000 },
  { id: "add-griego-extra", name: "Extra porcion de griego", price: 6500 },
];
