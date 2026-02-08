
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment setup (manual reading of .env.local because dotenv might not be standard)
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

// Data from menuItems.js and other sources
const DATA = {
  // --- Modifiers ---
  modifiers: [
    // Bread Options
    { group: 'sandwich-bread', name: 'Baguette artesanal', price: 0, description: 'Incluido', is_active: true },
    { group: 'sandwich-bread', name: 'Pan de masa madre - Queso Paipa (150 g)', price: 4000, description: 'Miga suave con infusion de queso Paipa artesanal.', is_active: true },
    { group: 'sandwich-bread', name: 'Pan de masa madre - Semillas (150 g)', price: 4000, description: 'Corteza crujiente con mezcla de semillas tostadas.', is_active: true },
    
    // Sandwich Extras
    { group: 'sandwich-extras', name: 'Queso campesino tajada', price: 3500 },
    { group: 'sandwich-extras', name: 'Queso loncha', price: 2500 },
    { group: 'sandwich-extras', name: 'Pepinillos', price: 2500 },
    { group: 'sandwich-extras', name: 'Aguacate extra', price: 3000 },
    { group: 'sandwich-extras', name: 'Jalapenos', price: 2500 },
    { group: 'sandwich-extras', name: 'Vegetales extra', price: 2000 },
    { group: 'sandwich-extras', name: 'Pimenton asado', price: 3500 },
    { group: 'sandwich-extras', name: 'Queso de Bufala', price: 3500 },
    { group: 'sandwich-extras', name: 'Huevo frito', price: 2500 },
    { group: 'sandwich-extras', name: 'Salsa extra', price: 1000 },
    { group: 'sandwich-extras', name: 'Tomate seco', price: 2500 },
    { group: 'sandwich-extras', name: 'Hummus', price: 3000 },
    
    // Milk Options (for Coffee)
    { group: 'milk-options', name: 'Entera', price: 0, description: 'Leche entera clásica' },
    { group: 'milk-options', name: 'Deslactosada', price: 500, description: 'Leche sin lactosa' },
    { group: 'milk-options', name: 'Almendras', price: 2000, description: 'Bebida vegetal de almendras' },
    { group: 'milk-options', name: 'Soya', price: 1500, description: 'Bebida vegetal de soya' },
  ],

  // --- Products ---
  sandwiches: [
    // Artesanales
    {
      name: "Sandwich de Cerdo",
      desc: "Pierna de cerdo horneada con Mayo-Pesto, lechuga, tomate y suero costeno.",
      image_url: "/img/products/sancerdo1.png",
      tags: ["artesanal"],
      modifier_groups: ["sandwich-bread", "sandwich-extras"],
      variants: [
        { name: "Clasico", price: 13000, description: "100 g de proteina" },
        { name: "Grande", price: 32000, description: "300 g de proteina" }
      ],
      price: 13000 // Base price for listing
    },
    {
      name: "Sandwich de Pollo",
      desc: "Pechuga en coccion lenta, alioli de yogurt (con ajo), lechuga y tomate.",
      image_url: "/img/products/sandwich-pollo.jpg",
      tags: ["artesanal"],
      modifier_groups: ["sandwich-bread", "sandwich-extras"],
      variants: [
        { name: "Clasico", price: 15000 },
        { name: "Grande", price: 35000 }
      ],
      price: 15000
    },
    {
      name: "Sandwich de Pavo",
      desc: "Pavo horneado en coccion lenta, alioli de yogurt (con ajo), tomates secos y lechuga.",
      image_url: "/img/products/sandwich-pavo.jpg",
      tags: ["artesanal"],
      modifier_groups: ["sandwich-bread", "sandwich-extras"],
      variants: [
        { name: "Clasico", price: 22000 },
        { name: "Grande", price: 53000 }
      ],
      price: 22000
    },
    // Especiales
    {
      name: "Serrano Di Bufala",
      desc: "Queso crema, espinaca, jamon serrano, queso de bufala, tomate cherry salteado y balsamico.",
      image_url: "/img/products/sandwich-serrano.jpg",
      tags: ["especial"],
      modifier_groups: ["sandwich-extras"], // No bread choice mentioned in legacy code for specials? Assuming standard.
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
    // Tradicionales
    {
      name: "Multigranos Andino",
      desc: "Tres panes tajados multigranos, lechuga, tomate, salsas y jamon de pollo con queso mozzarella.",
      image_url: "/img/products/sandwich-tradicional-multigranos.jpg", // Guessing
      tags: ["tradicional"],
      price: 8000
    },
    {
      name: "Calentito del Paramo",
      desc: "Dos panes tajados multigranos con jamon de pollo y queso mozzarella derretidos.",
      image_url: "/img/products/sandwich-tradicional-calentito.jpg", // Guessing
      tags: ["tradicional"],
      price: 5000
    }
  ],
  
  smoothies: [
    {
      name: "Brisas Tropicales",
      price: 18000,
      desc: "Hierbabuena, mango, maracuyá y piña; leche de almendras, yogur griego y chía. 🥛🥜",
      image_url: "/img/products/smoothie-brisas.jpg"
    },
    {
      name: "El Néctar Andino",
      price: 17000,
      desc: "Fresas y arándanos, marañones y avena; leche a elección y vainilla. 🥛🌾🥜",
      image_url: "/img/products/smoothie-nectar.jpg"
    },
    {
      name: "Verde Amanecer de la Sabana",
      price: 16000,
      desc: "Espinaca, kiwi, banano, manzana verde, jengibre y yerbabuena.",
      image_url: "/img/products/smoothie-verde.jpg"
    },
    // Funcionales
    {
      name: "Elixir del Cóndor (Detox)",
      price: 18000,
      desc: "Pepino, apio, manzana verde, limón y jengibre; espirulina + clorofila.",
      tags: ["funcional"],
      image_url: "/img/products/smoothie-detox.jpg"
    },
    {
      name: "Guardián de la Montaña",
      price: 17000,
      desc: "Naranja, cúrcuma, zanahoria, un toque de pimienta negra, jengibre y miel de abejas local.",
      tags: ["funcional"],
      image_url: "/img/products/smoothie-guardian.jpg"
    },
    {
      name: "Aurora Proteica",
      price: 22000,
      desc: "Leche de almendras, proteína vegetal (vainilla/chocolate), banano y chía. 🥜",
      tags: ["funcional"],
      image_url: "/img/products/smoothie-aurora.jpg"
    },
    {
      name: "Avena Digestiva",
      price: 17000,
      desc: "Avena en copos, leche de tu preferencia, psyllium, vainilla, canela en polvo y endulzante natural",
      tags: ["funcional"],
      image_url: "/img/products/smoothie-avena.jpg"
    }
  ],
  
  cafe: [
    // Sin leche (optional)
    { name: "Espresso", price: 4000, desc: "Café concentrado, 30–40 ml.", config_options: { milk_policy: 'optional' }, modifier_groups: ['milk-options'] },
    { name: "Ristretto", price: 4000, desc: "Café concentrado, 20–25 ml.", config_options: { milk_policy: 'optional' }, modifier_groups: ['milk-options'] },
    { name: "Americano", price: 4500, desc: "Espresso diluido con agua caliente.", config_options: { milk_policy: 'optional' }, modifier_groups: ['milk-options'] },
    { name: "Tinto Campesino", price: 4500, desc: "Café filtrado tradicional.", config_options: { milk_policy: 'none' } },
    // Con Leche (required)
    { name: "Capuchino", price: 6000, desc: "Espresso con leche al vapor y espuma fina.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'] },
    { name: "Latte", price: 6000, desc: "Espresso con más leche y poca espuma.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'] },
    { name: "Flat White", price: 7000, desc: "Doble espresso con leche microespumada.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'] },
    { name: "Mocaccino", price: 8000, desc: "Espresso con cacao, leche y crema.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'] },
    { name: "Chocolate Caliente", price: 7000, desc: "Bebida de cacao con leche.", config_options: { milk_policy: 'required' }, modifier_groups: ['milk-options'] },
    // Infusiones
    { name: "Aromatica de fresa", price: 5000, desc: "Té de frutos rojos con hierbabuena." },
    { name: "Té Chai", price: 9000, desc: "Blend especiado.", modifier_groups: ['milk-options'] }, // Chai can have milk
  ]
};

async function migrate() {
  console.log('Starting migration...');

  // 1. Insert Modifiers
  console.log('Inserting modifiers...');
  // Clear existing modifiers?
  const { error: delErr } = await supabase.from('modifiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.error('Error clearing Modifiers:', delErr);

  const { error: modErr } = await supabase.from('modifiers').insert(DATA.modifiers);
  if (modErr) {
    console.error('Error inserting modifiers:', modErr);
  } else {
    console.log(`Inserted ${DATA.modifiers.length} modifiers.`);
  }

  // 2. Insert Products
  // Helper to get category ID
  const { data: categories } = await supabase.from('categories').select('id, slug');
  const getCatId = (slug) => categories.find(c => c.slug === slug)?.id;

  const catsToMigrate = ['sandwiches', 'smoothies', 'cafe'];

  for (const catSlug of catsToMigrate) {
    const catId = getCatId(catSlug);
    if (!catId) {
      console.warn(`Category ${catSlug} not found in DB.`);
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

    // Check if products exist to avoid dupes? We will delete first for these categories
    console.log(`Clearing products for ${catSlug} (Category ID: ${catId})...`);
    const { error: delErr } = await supabase.from('products').delete().eq('category_id', catId);
    if (delErr) {
        console.warn(`Warning clearing products for ${catSlug}:`, delErr.message);
    }

    console.log(`Inserting ${products.length} items for ${catSlug}...`);
    const { error: prodErr } = await supabase.from('products').insert(products);
    
    if (prodErr) {
      console.error(`Error processing ${catSlug}:`, JSON.stringify(prodErr, null, 2));
    } else {
      console.log(`Success for ${catSlug}.`);
    }
  }

  console.log('Migration Complete.');
}

migrate();
