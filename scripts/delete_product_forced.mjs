
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let SUPABASE_URL, SUPABASE_KEY;

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.trim().startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
    if (line.trim().startsWith('VITE_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1].trim();
  });
} catch (e) {
  console.error("Could not read .env.local");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PRODUCT_ID = '7b428116-6684-4506-8090-6f0a3f185e79';

async function cleanup() {
  console.log(`Starting cleanup for product: ${PRODUCT_ID}`);

  // 1. Delete from order_items
  console.log('Deleting from order_items...');
  const { error: itemErr } = await supabase
    .from('order_items')
    .delete()
    .eq('product_id', PRODUCT_ID);

  if (itemErr) {
    console.error('Error deleting from order_items:', itemErr);
  } else {
    console.log('Successfully deleted related items from order_items.');
  }

  // 2. Delete the product
  console.log('Deleting the product...');
  const { error: prodErr } = await supabase
    .from('products')
    .delete()
    .eq('id', PRODUCT_ID);

  if (prodErr) {
    console.error('Error deleting product:', prodErr);
  } else {
    console.log('Successfully deleted the product.');
  }
}

cleanup();
