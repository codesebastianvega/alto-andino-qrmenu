import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIES_METADATA = [
  { slug: "desayunos", targetId: "section-desayunos", tintClass: "bg-amber-50", subcategories: [] },
  { slug: "panes", targetId: "section-panes", tintClass: "bg-yellow-50", subcategories: [] },
  { slug: "bowls", targetId: "section-bowls", tintClass: "bg-emerald-50", subcategories: [] },
  { slug: "platos", targetId: "section-platos", tintClass: "bg-violet-50", subcategories: ["Especiales", "Pastas", "Sabores del mundo", "En preparación"] },
  { slug: "veggie", targetId: "section-veggie", tintClass: "bg-lime-50", subcategories: ["Desayunos Veggie", "Platos Veggie"] },
  { slug: "sandwiches", targetId: "section-sandwiches", tintClass: "bg-rose-50", subcategories: ["Tradicionales", "Artesanales", "Especiales"] },
  { slug: "smoothies", targetId: "section-smoothies", tintClass: "bg-pink-50", subcategories: ["Bowl", "Smoothies", "Funcionales"] },
  { slug: "cafe", targetId: "section-cafe", tintClass: "bg-stone-200", subcategories: ["Cafés", "Té & Chai", "Infusiones"] },
  { slug: "bebidasfrias", targetId: "section-bebidasfrias", tintClass: "bg-sky-50", subcategories: ["Jugos", "Gaseosas", "Otras bebidas"] },
  { slug: "postres", targetId: "section-postres", tintClass: "bg-white", subcategories: ["Cumbre Andino", "Postres"] },
];

async function migrate() {
  console.log('Starting migration...');

  for (const meta of CATEGORIES_METADATA) {
    console.log(`Updating category: ${meta.slug}`);
    
    // 1. Get current category to preserve existing visibility_config if any
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('id, visibility_config')
      .eq('slug', meta.slug)
      .single();

    if (fetchError || !category) {
      console.warn(`Category ${meta.slug} not found or error fetching.`);
      continue;
    }

    const newConfig = {
      ...(category.visibility_config || {}),
      subcategories: meta.subcategories
    };

    const { error: updateError } = await supabase
      .from('categories')
      .update({
        tint_class: meta.tintClass,
        target_id: meta.targetId,
        visibility_config: newConfig
      })
      .eq('slug', meta.slug);

    if (updateError) {
      console.error(`Error updating ${meta.slug}:`, updateError.message);
    } else {
      console.log(`Successfully updated ${meta.slug}`);
      
      // 2. Clean up products subcategories if needed
      if (meta.slug === 'platos') {
         await cleanupProducts(category.id, {
           'especiales': 'Especiales',
           'pastas': 'Pastas',
           'sabores': 'Sabores del mundo',
           'en_preparacion': 'En preparación'
         });
      } else if (meta.slug === 'sandwiches') {
         await cleanupProducts(category.id, {
           'artesanal': 'Artesanales',
           'especial': 'Especiales',
           'tradicional': 'Tradicionales'
         });
      }
    }
  }

  console.log('Migration finished.');
}

async function cleanupProducts(categoryId, map) {
  for (const [oldValue, newValue] of Object.entries(map)) {
    const { error } = await supabase
      .from('products')
      .update({ subcategory: newValue })
      .eq('category_id', categoryId)
      .eq('subcategory', oldValue);
    
    if (error) {
      console.error(`Error cleaning up products for ${categoryId} (${oldValue} -> ${newValue}):`, error.message);
    } else {
      console.log(`Cleaned up products subcategory: ${oldValue} -> ${newValue} for category ${categoryId}`);
    }
  }
}

migrate();
