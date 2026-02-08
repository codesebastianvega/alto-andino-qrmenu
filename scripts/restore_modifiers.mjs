import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(process.cwd(), '.env.local');

// Manual env parsing
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreModifiers() {
  console.log('Restoring modifiers...');

  // 1. Fetch current modifiers to avoid duplicates
  const { data: currentModifiers } = await supabase.from('modifiers').select('name, group');
  const existingKeys = new Set((currentModifiers || []).map(m => `${m.group}:${m.name.toLowerCase()}`));

  // 2. Define missing toppings and other modifiers from menuItems.js logic
  const newModifiers = [
    // PROTEINS
    { name: 'Pollo en cubos', group: 'bowl-protein', price: 6000, is_active: true },
    { name: 'Atún fresco', group: 'bowl-protein', price: 8000, is_active: true },
    { name: 'Salmón ahumado', group: 'bowl-protein', price: 9000, is_active: true },
    { name: 'Tofu marinado', group: 'bowl-protein', price: 5000, is_active: true },
    
    // BASES
    { name: 'Arroz blanco', group: 'bowl-base', price: 0, is_active: true },
    { name: 'Quinoa', group: 'bowl-base', price: 2000, is_active: true },
    { name: 'Mix de verdes', group: 'bowl-base', price: 0, is_active: true },

    // TOPPINGS (The missing ones)
    { name: 'Maíz tierno', group: 'bowl-topping', price: 1500, is_active: true },
    { name: 'Edamames', group: 'bowl-topping', price: 2500, is_active: true },
    { name: 'Zanahoria rallada', group: 'bowl-topping', price: 1000, is_active: true },
    { name: 'Rábano', group: 'bowl-topping', price: 1000, is_active: true },
    { name: 'Tomate cherry', group: 'bowl-topping', price: 1500, is_active: true },
    { name: 'Cebolla roja', group: 'bowl-topping', price: 1000, is_active: true },
    { name: 'Canchita', group: 'bowl-topping', price: 1500, is_active: true },
    { name: 'Nori strips', group: 'bowl-topping', price: 1000, is_active: true },
    { name: 'Wakame', group: 'bowl-topping', price: 3000, is_active: true },
    { name: 'Ají fresco', group: 'bowl-topping', price: 500, is_active: true },
    { name: 'Cilantro', group: 'bowl-topping', price: 0, is_active: true },

    // SAUCES
    { name: 'Salsa Sweet Hot', group: 'bowl-sauce', price: 0, is_active: true },
    { name: 'Salsa Teriyaki', group: 'bowl-sauce', price: 0, is_active: true },
    { name: 'Vinagreta César', group: 'bowl-sauce', price: 0, is_active: true },
    { name: 'Mayonesa Spicy', group: 'bowl-sauce', price: 0, is_active: true },

    // FRUITS (for future yogurt bowls etc)
    { name: 'Banano', group: 'bowl-topping', price: 1000, is_active: true },
    { name: 'Fresa', group: 'bowl-topping', price: 2000, is_active: true },
    { name: 'Granola', group: 'bowl-topping', price: 1500, is_active: true },
    { name: 'Miel', group: 'bowl-topping', price: 1000, is_active: true },
  ];

  // 3. Filter out existing ones
  const toInsert = newModifiers.filter(m => !existingKeys.has(`${m.group}:${m.name.toLowerCase()}`));

  if (toInsert.length === 0) {
    console.log('All modifiers are already in the database.');
    return;
  }

  console.log(`Inserting ${toInsert.length} new modifiers...`);
  
  const { data, error } = await supabase
    .from('modifiers')
    .insert(toInsert);

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted missing modifiers.');
  }
}

restoreModifiers();
