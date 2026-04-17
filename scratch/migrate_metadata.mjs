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
  { slug: "desayunos", name: "Desayunos", targetId: "section-desayunos", tintClass: "bg-amber-50", subcategories: [] },
  { slug: "panes", name: "Panes", targetId: "section-panes", tintClass: "bg-yellow-50", subcategories: [] },
  { slug: "bowls", name: "Bowls", targetId: "section-bowls", tintClass: "bg-emerald-50", subcategories: [] },
  { slug: "almuerzo", name: "Almuerzo", targetId: "section-platos", tintClass: "bg-violet-50", subcategories: ["Especiales", "Pastas", "Sabores del mundo", "En preparación"] },
  { slug: "veggie", name: "Veggie", targetId: "section-veggie", tintClass: "bg-lime-50", subcategories: ["Desayunos Veggie", "Platos Veggie"] },
  { slug: "sandwiches", name: "Sándwiches", targetId: "section-sandwiches", tintClass: "bg-rose-50", subcategories: ["Tradicionales", "Artesanales", "Especiales"] },
  { slug: "smoothies", name: "Smoothies", targetId: "section-smoothies", tintClass: "bg-pink-50", subcategories: ["Bowl", "Smoothies", "Funcionales"] },
  { slug: "cafe", name: "Café", targetId: "section-cafe", tintClass: "bg-stone-200", subcategories: ["Cafés", "Té & Chai", "Infusiones"] },
  { slug: "bebidasfrias", name: "Bebidas Frías", targetId: "section-bebidasfrias", tintClass: "bg-sky-50", subcategories: ["Jugos", "Gaseosas", "Otras bebidas"] },
  { slug: "postres", name: "Postres", targetId: "section-postres", tintClass: "bg-white", subcategories: ["Cumbre Andino", "Postres"] },
];

async function migrate() {
  console.log('Starting migration...');

  for (const meta of CATEGORIES_METADATA) {
    console.log(`Updating category: ${meta.slug}`);
    
    // 1. Get current categories with this slug (handling potential duplicates)
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('id, visibility_config, name')
      .eq('slug', meta.slug);

    if (fetchError) {
      console.error(`Error fetching category ${meta.slug}:`, fetchError.message);
      continue;
    }

    if (!categories || categories.length === 0) {
      console.log(`Category ${meta.slug} not found. Creating it...`);
      const { data: newCat, error: createError } = await supabase
        .from('categories')
        .insert({
          name: meta.name,
          slug: meta.slug,
          tint_class: meta.tintClass,
          target_id: meta.targetId,
          visibility_config: { subcategories: meta.subcategories },
          icon_name: 'heroicons:squares-2x2' // Default icon
        })
        .select()
        .single();
      
      if (createError) {
        console.error(`Error creating category ${meta.slug}:`, createError.message);
      } else {
        console.log(`Successfully created category ${meta.slug} with ID ${newCat.id}`);
      }
      continue;
    }

    for (const category of categories) {
      console.log(`Updating category instance: ${category.name} (${category.id})`);
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
        .eq('id', category.id);

      if (updateError) {
        console.error(`Error updating category instance ${category.id}:`, updateError.message);
      } else {
        console.log(`Successfully updated category instance ${category.id}`);
        
        // 2. Clean up products subcategories if needed
        if (meta.slug === 'almuerzo') {
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
