import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no encontrados en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Iniciando auditoría atómica de base de datos...\n');

  // List all categories and slugs
  const { data: allCats, error: allCatsError } = await supabase
    .from('categories')
    .select('name, slug');

  if (allCatsError) {
    console.error('❌ Error al listar categorías:', allCatsError.message);
  } else {
    console.log('📋 Categorías actuales:');
    allCats.forEach(c => console.log(`   - ${c.name}: [${c.slug}]`));
  }

  console.log('\n-------------------\n');

  // Check products subcategory
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (prodError) {
    console.error('❌ Error al consultar tabla "products":', prodError.message);
  } else if (prodData && prodData.length > 0) {
    const keys = Object.keys(prodData[0]);
    const hasSub = keys.includes('subcategory');
    console.log(`✅ Tabla "products":`);
    console.log(`   - Columna subcategory: ${hasSub ? 'EXISTE' : 'FALTA ❌'}`);
  } else {
    console.log('⚠️ Tabla "products" vacía.');
  }

  process.exit(0);
}

checkSchema();
