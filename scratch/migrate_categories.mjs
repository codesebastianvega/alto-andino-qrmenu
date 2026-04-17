import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Read .env.local manually
const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const migrationData = [
  { slug: "desayunos", tint_class: "bg-amber-50" },
  { slug: "panes", tint_class: "bg-yellow-50", target_id: "section-panes" },
  { slug: "bowls", tint_class: "bg-emerald-50" },
  { slug: "platos", tint_class: "bg-violet-50", target_id: "section-platos" },
  { slug: "veggie", tint_class: "bg-lime-50", target_id: "section-veggie" },
  { slug: "sandwiches", tint_class: "bg-rose-50" },
  { slug: "smoothies", tint_class: "bg-pink-50", target_id: "section-smoothies" },
  { slug: "cafe", tint_class: "bg-stone-200", target_id: "section-cafe" },
  { slug: "bebidasfrias", tint_class: "bg-sky-50", target_id: "section-bebidasfrias" }
]

async function migrate() {
  console.log('--- MIGRATING CATEGORY METADATA ---')
  
  for (const item of migrationData) {
    const { slug, ...updates } = item
    console.log(`Updating category: ${slug}...`)
    
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('slug', slug)
      .select()

    if (error) {
      console.error(`Error updating ${slug}:`, error.message)
    } else if (data.length === 0) {
      console.warn(`Category with slug "${slug}" not found in database.`)
    } else {
      console.log(`Successfully updated ${slug}.`)
    }
  }
  
  console.log('\n--- MIGRATION COMPLETE ---')
}

migrate()
