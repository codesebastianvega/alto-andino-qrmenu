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

  // Check categories structure via a sample select (RPC or direct check not always available with anon key for information_schema)
  // We'll try to fetch one category and see the keys
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (catError) {
    console.error('❌ Error al consultar tabla "categories":', catError.message);
  } else if (catData && catData.length > 0) {
    const keys = Object.keys(catData[0]);
    const hasTint = keys.includes('tint_class');
    const hasTarget = keys.includes('target_id');
    const hasVis = keys.includes('visibility_config');

    console.log(`✅ Tabla "categories":`);
    console.log(`   - Columna tint_class: ${hasTint ? 'EXISTE' : 'FALTA ❌'}`);
    console.log(`   - Columna target_id: ${hasTarget ? 'EXISTE' : 'FALTA ❌'}`);
    console.log(`   - Columna visibility_config: ${hasVis ? 'EXISTE' : 'FALTA ❌'}`);
    
    if (hasVis) {
      console.log(`   - Estructura visibility_config:`, JSON.stringify(catData[0].visibility_config, null, 2));
    }
  } else {
    console.log('⚠️ Tabla "categories" vacía. No se pudo verificar la estructura de las columnas por inspección de datos.');
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
