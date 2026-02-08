
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Environment setup
const envPath = path.resolve(process.cwd(), '.env.local');
let SUPABASE_URL, SUPABASE_KEY;

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1].trim();
  });
} catch (e) {
  console.error("Could not read .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- RAW DATA FROM MENUITEMS.JS (Merged and Mapped) ---

// Modifiers Helper
const mods = [];
const addMod = (group, name, price = 0, desc = null) => {
  mods.push({ group, name, price, description: desc, is_active: true });
};

// 1. Sandwich Modifiers
addMod('sandwich-bread', 'Baguette artesanal', 0, 'Incluido');
addMod('sandwich-bread', 'Pan de masa madre - Queso Paipa (150 g)', 4000, 'Miga suave con infusion de queso Paipa artesanal.');
addMod('sandwich-bread', 'Pan de masa madre - Semillas (150 g)', 4000, 'Corteza crujiente con mezcla de semillas tostadas.');
['Queso campesino tajada', 'Queso de Bufala', 'Pimenton asado'].forEach(n => addMod('sandwich-extras', n, 3500));
['Queso loncha', 'Pepinillos', 'Jalapenos', 'Huevo frito', 'Tomate seco'].forEach(n => addMod('sandwich-extras', n, 2500));
addMod('sandwich-extras', 'Aguacate extra', 3000);
addMod('sandwich-extras', 'Hummus', 3000);
addMod('sandwich-extras', 'Vegetales extra', 2000);
addMod('sandwich-extras', 'Salsa extra', 1000);

// 2. Coffee Milk Options
addMod('milk-options', 'Entera', 0, 'Leche entera clásica');
addMod('milk-options', 'Deslactosada', 500, 'Leche sin lactosa');
addMod('milk-options', 'Almendras', 2000, 'Bebida vegetal de almendras');
addMod('milk-options', 'Soya', 1500, 'Bebida vegetal de soya');

// 3. Juice Flavors
const juiceFlavors = ['Mora', 'Guanabana', 'Mango', 'Pina', 'Maracuya', 'Fresa', 'Arandanos', 'Kiwi', 'Zanahoria'];
juiceFlavors.forEach(f => addMod('juice-flavors', f, 0));

// 4. Bowl Modifiers
addMod('bowl-base', 'Arroz blanco');
addMod('bowl-protein', 'Pollo en cubos');
['Aguacate', 'Mango', 'Pepino'].forEach(t => addMod('bowl-topping', t));
['Ajonjolí'].forEach(e => addMod('bowl-extras', e));
addMod('bowl-salsa', 'Sweet Hot de la casa');

// --- PRODUCTS ---
const DATA = {
  sandwiches: [
     {
      name: "Sandwich de Cerdo",
      desc: "Pierna de cerdo horneada con Mayo-Pesto, lechuga, tomate y suero costeno.",
      image_url: "/img/products/sancerdo1.png",
      tags: ["artesanal"],
      modifier_groups: ["sandwich-bread", "sandwich-extras"],
      variants: [ { name: "Clasico", price: 13000 }, { name: "Grande", price: 32000 } ],
      price: 13000
    },
    {
      name: "Sandwich de Pollo",
      desc: "Pechuga en coccion lenta, alioli de yogurt (con ajo), lechuga y tomate.",
      image_url: "/img/products/sandwich-pollo.jpg",
      tags: ["artesanal"],
      modifier_groups: ["sandwich-bread", "sandwich-extras"],
      variants: [ { name: "Clasico", price: 15000 }, { name: "Grande", price: 35000 } ],
      price: 15000
    },
    {
      name: "Sandwich de Pavo",
      desc: "Pavo horneado en coccion lenta, alioli de yogurt (con ajo), tomates secos y lechuga.",
      image_url: "/img/products/sandwich-pavo.jpg",
      tags: ["artesanal"],
      modifier_groups: ["sandwich-bread", "sandwich-extras"],
      variants: [ { name: "Clasico", price: 22000 }, { name: "Grande", price: 53000 } ],
      price: 22000
    },
    {
      name: "Serrano Di Bufala",
      desc: "Queso crema, espinaca, jamon serrano, queso de bufala, tomate cherry salteado y balsamico.",
      image_url: "/img/products/sandwich-serrano.jpg",
      tags: ["especial"],
      modifier_groups: ["sandwich-extras"],
      price: 12500
    },
    {
      name: "Cosecha del Paramo",
      desc: "Hummus casero, pimientos asados, aguacate, champinon a la plancha, pepino y lechugas; lamina de queso costeno frito.",
      image_url: "/img/products/sandwich-cosecha.jpg",
      tags: ["especial"],
      modifier_groups: ["sandwich-extras"],
      price: 16000
    },
    {
      name: "Multigranos Andino",
      desc: "Tres panes tajados multigranos, lechuga, tomate, salsas y jamon de pollo con queso mozzarella.",
      image_url: "/img/products/sandwich-tradicional-multigranos.jpg",
      tags: ["tradicional"],
      price: 8000
    },
    {
      name: "Calentito del Paramo",
      desc: "Dos panes tajados multigranos con jamon de pollo y queso mozzarella derretidos.",
      image_url: "/img/products/sandwich-tradicional-calentito.jpg",
      tags: ["tradicional"],
      price: 5000
    }
  ],
  smoothies: [
    { name: "Brisas Tropicales", price: 18000, desc: "Hierbabuena, mango, maracuyá y piña; leche de almendras, yogur griego y chía.", image_url: "/img/products/smoothie-brisas.jpg" },
    { name: "El Néctar Andino", price: 17000, desc: "Fresas y arándanos, marañones y avena; leche a elección y vainilla.", image_url: "/img/products/smoothie-nectar.jpg" },
    { name: "Verde Amanecer de la Sabana", price: 16000, desc: "Espinaca, kiwi, banano, manzana verde, jengibre y yerbabuena.", image_url: "/img/products/smoothie-verde.jpg" },
    { name: "Elixir del Cóndor (Detox)", price: 18000, desc: "Pepino, apio, manzana verde, limón y jengibre; espirulina + clorofila.", tags: ["funcional"], image_url: "/img/products/smoothie-detox.jpg" },
    { name: "Guardián de la Montaña", price: 17000, desc: "Naranja, cúrcuma, zanahoria, un toque de pimienta negra, jengibre y miel de abejas local.", tags: ["funcional"], image_url: "/img/products/smoothie-guardian.jpg" },
    { name: "Aurora Proteica", price: 22000, desc: "Leche de almendras, proteína vegetal, banano y chía.", tags: ["funcional"], image_url: "/img/products/smoothie-aurora.jpg" },
    { name: "Avena Digestiva", price: 17000, desc: "Avena en copos, leche de tu preferencia, psyllium, vainilla, canela.", tags: ["funcional"], image_url: "/img/products/smoothie-avena.jpg" }
  ],
  cafe: [
    { name: "Espresso", price: 4000, desc: "Café concentrado, 30–40 ml.", config_options: { milk_policy: 'optional' }, modifier_groups: ['milk-options'], tags: ['cafe'] },
    { name: "Ristretto", price: 4000, desc: "Café concentrado, 20–25 ml.", config_options: { milk_policy: 'optional' }, modifier_groups: ['milk-options'], tags: ['cafe'] },
    { name: "Americano", price: 4500, desc: "Espresso diluido con agua caliente.", config_options: { milk_policy: 'optional' }, modifier_groups: ['milk-options'], tags: ['cafe'] },
    { name: "Tinto Campesino", price: 4500, desc: "Café filtrado tradicional.", config_options: { milk_policy: 'none' }, tags: ['cafe'] },
    { name: "Capuchino", price: 6000, desc: "Espresso con leche al vapor y espuma fina.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'], tags: ['cafe'] },
    { name: "Latte", price: 6000, desc: "Espresso con más leche y poca espuma.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'], tags: ['cafe'] },
    { name: "Flat White", price: 7000, desc: "Doble espresso con leche microespumada.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'], tags: ['cafe'] },
    { name: "Mocaccino", price: 8000, desc: "Espresso con cacao, leche y crema.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'], tags: ['cafe'] },
    { name: "Chocolate Caliente", price: 7000, desc: "Bebida de cacao con leche.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'], tags: ['cafe'] },
    // Teas
    { name: "Té negro", price: 4500, tags: ['te'], desc: "Infusión de té negro." },
    { name: "Té verde", price: 4500, tags: ['te'], desc: "Infusión de té verde." },
    { name: "Té Chai", price: 7000, desc: "Blend especiado. Puede ser infusión o con leche.", tags: ['chai'], config_options: { milk_policy: 'optional' }, modifier_groups: ['milk-options'] },
    { name: "Matcha lulo", price: 7000, tags: ['te'], desc: "Matcha con lulo." },
    // Infusions
    { name: "Aromatica de fresa", price: 5000, desc: "Té de frutos rojos con hierbabuena.", tags: ['infusion'] },
    { name: "Frutos rojos andinos", price: 5000, desc: "Té de frutos rojos con yerbabuena y fresas deshidratadas.", tags: ['infusion'] },
    { name: "Aromática de yerbabuena y manzanilla", price: 5000, desc: "Infusión calmante.", tags: ['infusion'] },
    { name: "Super Blend Hindú Azul", price: 4500, desc: "Relax. Vitamina B3, manzanilla.", tags: ['infusion'] },
    { name: "Super Blend Hindú Amarillo", price: 4500, desc: "Digest. Probióticos.", tags: ['infusion'] }
  ],
  desayunos: [
    { name: "Sendero Matinal", price: 18000, desc: "Omelette con champiñones..." },
    { name: "Cumbre Energética", price: 17000, desc: "Bebida caliente, arepa queso, yogur griego..." },
    { name: "Huevos al Gusto", price: 17000, desc: "3 huevos, tostadas, vegetales..." },
    { name: "Combo - Caldo de Costilla", price: 19000, desc: "Caldo, huevos, arepa." },
    { name: "Bowl Amanecer Andino", price: 13500, desc: "Yogur griego y açaí, granola..." },
    { name: "Changua Tradicional", price: 9000, desc: "Clásica bogotana." },
    { name: "Changua Alto Andino", price: 12000, desc: "Con trozos de almojábana." },
    // Veggie Breakfast
    { name: "Tostada Primavera", price: 19200, desc: "Tostada, tofu, aguacate...", tags: ['veggie'] },
    { name: "Cosecha del Huerto", price: 21500, desc: "Garbanzos, berenjenas, tofu...", tags: ['veggie'] },
    // Additions
    { name: "Arepa de peto con Queso", price: 3500, tags: ['adicion'] },
    { name: "Ensalada de frutas", price: 16000, tags: ['adicion'] },
    { name: "1 huevo al gusto", price: 3500, tags: ['adicion'] },
    { name: "Tajada de pan", price: 2500, tags: ['adicion'] },
    { name: "Pan de masa madre - porcion", price: 4000, tags: ['adicion'] },
    { name: "Queso campesino (tajada)", price: 3500, tags: ['adicion'] },
    { name: "Queso loncha", price: 2500, tags: ['adicion'] },
    { name: "Adicion de fruta", price: 3500, tags: ['adicion'] },
    { name: "Extra porcion de griego", price: 6500, tags: ['adicion'] }
  ],
  platos: [
    { name: "Salmon Andino 200 gr", price: 47000, desc: "Salsa miel-mostaza...", group: "especiales" },
    { name: "Trucha del Paramo 450 gr", price: 42000, desc: "A la plancha con alioli...", group: "especiales" },
    { name: "Spaghetti a la Bolonesa", price: 28000, desc: "Salsa pomodoro...", group: "pastas" },
    { name: "Pasta cremosa de pollo", price: 30000, desc: "Fetuccini en salsa cremosa...", group: "pastas" },
    { name: "Champinones a la Madrilena", price: 18000, desc: "Mantequilla y ajo...", group: "sabores" },
    { name: "Ceviche de Camaron", price: 22000, desc: "Camaron marinado...", group: "sabores" },
    { name: "Burger Andina", price: 26000, group: "en_preparacion" },
    // Veggie Mains
    { name: "Alfredo Cremoso del Bosque", price: 27000, desc: "Pasta de arroz vegana...", tags: ['veggie'] },
    { name: "Ensalada Jardín de Altura", price: 28500, desc: "Espárragos, garbanzos...", tags: ['veggie'] },
    { name: "Pasta Tipo Boloñesa", price: 26000, desc: "Spaghetti vegano...", tags: ['veggie'] }
  ],
  panes: [
    { name: "Pan de Masa Madre", price: 5000, desc: "Baguettina de queso paipa..." },
    { name: "Pan de Masa Madre y frutos Rojos", price: 4000, desc: "Con dulce de frutos rojos..." },
    { name: "Rollitos de canela", price: 5000, desc: "Enrollado con canela." }
  ],
  postres: [
    { name: "Red Velvet", price: 11000, desc: "Bizcocho rojo..." },
    { name: "Tres Leches (saludable)", price: 6200, desc: "Harina de almendras..." },
    { name: "Tiramisu (saludable)", price: 6800, desc: "Bizcocho de almendras..." },
    { name: "Torta de Amapola", price: 10000, desc: "Harina de avena..." },
    { name: "Torta Vasca de Limón", price: 10000, desc: "Crema de leche..." },
    { name: "Fresas con Crema", price: 9000, desc: "Chantilly con alulosa..." },
    // Cumbre with Variants
    {
      name: "Cumbre Andino",
      desc: "Yogur griego con mermelada y fruta.",
      price: 10000,
      variants: [
        { name: "Frutos rojos", price: 10000 },
        { name: "Frutos amarillos", price: 10000 },
        { name: "Chococumbre", price: 11000 },
        { name: "Frutos blancos", price: 12000 }
      ]
    }
  ],
  bowls: [
    {
      name: "Poke Hawaiano",
      price: 28000,
      desc: "Bowl personalizable.",
      modifier_groups: ['bowl-base', 'bowl-protein', 'bowl-topping', 'bowl-extras', 'bowl-salsa']
    }
  ],
  bebidasfrias: [
    { name: "Soda Zen", price: 3500 },
    { name: "Coca-Cola 250 mL", price: 2500 },
    { name: "Coca-Cola 400 mL", price: 4500 },
    { name: "Soda Manantial 400 mL", price: 5000 },
    { name: "Agua Manantial 500 mL", price: 6000 },
    { name: "Hatsu Rosas y Frambuesa (lata)", price: 4500 },
    { name: "Hatsu Uva y Romero (lata)", price: 4500 },
    { name: "Hatsu Uva y Romero (botella)", price: 4000 },
    { name: "Hatsu Albahaca (botella)", price: 4000 },
    { name: "Hatsu Yerbabuena (botella)", price: 4000 },
    // Soda Tea Pop
    { name: "Soda Tea - Frutos rojos", price: 8000 },
    { name: "Soda Tea - Pepino", price: 7000 },
    { name: "Soda Tea - Limon", price: 6000 },
    // Other Drinks
    { name: "Té Hatsu 400 mL", price: 5000 },
    { name: "Té Hatsu Caja 200 mL", price: 2000 },
    { name: "SaviLoe 250 mL", price: 3500 },
    { name: "Electrolit", price: 9000 },
    { name: "Go Aloe Sparkling", price: 6500 },
    { name: "Cool Drink", price: 4000 },
    // Jugos Naturales
    { name: "Jugo en Agua", price: 6000, modifier_groups: ['juice-flavors'] },
    { name: "Jugo en Leche", price: 7500, modifier_groups: ['juice-flavors'] }
  ]
};

async function migrate() {
  console.log('Starting Complete Migration...');

  // 1. Modifiers
  console.log('Clearing and Inserting Modifiers...');
  // Note: This logic assumes we can delete all modifiers. 
  // For safety in production we wouldn't, but for this migration it's fine.
  await supabase.from('modifiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: modErr } = await supabase.from('modifiers').insert(mods);
  if (modErr) console.error('Modifiers Error:', modErr);
  else console.log(`Inserted ${mods.length} modifiers.`);

  // 2. Products
  const { data: categories } = await supabase.from('categories').select('id, slug');
  const getCatId = (slug) => categories.find(c => c.slug === slug)?.id;

  for (const catSlug of Object.keys(DATA)) {
    const catId = getCatId(catSlug);
    if (!catId) {
      console.warn(`Category ${catSlug} not found.`);
      continue;
    }

    const products = DATA[catSlug].map(p => {
       const { desc, ...rest } = p;
       return {
         ...rest,
         description: desc || p.description,
         category_id: catId,
         is_active: true,
         stock_status: 'in'
       };
    });

    console.log(`Processing ${catSlug}...`);
    await supabase.from('products').delete().eq('category_id', catId);
    const { error: prodErr } = await supabase.from('products').insert(products);
    
    if (prodErr) console.error(`Error ${catSlug}:`, JSON.stringify(prodErr, null, 2));
    else console.log(`Success ${catSlug} (${products.length} items).`);
  }
}

migrate();
