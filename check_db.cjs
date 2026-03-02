require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'desayunos')
    .single();

  const breakfastCatId = catData.id;

  const { data, error } = await supabase
    .from('products')
    .select('id, name, config_options, modifier_groups')
    .eq('category_id', breakfastCatId)
    .limit(1);

  console.dir(data, { depth: null });
}
run();
