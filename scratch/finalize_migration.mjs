import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

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
  { 
    slug: "almuerzo", // Matches 'platos' in config
    tint_class: "bg-violet-50", 
    target_id: "section-platos",
    visibility_config: {
      subcategories: ["Especiales", "Pastas", "Sabores del mundo", "En preparación"]
    }
  },
  {
    slug: "sandwiches",
    tint_class: "bg-rose-50",
    visibility_config: {
      subcategories: ["Sándwiches Tradicionales", "Sándwiches Artesanales", "Sándwiches Especiales"]
    }
  },
  {
    slug: "panes",
    tint_class: "bg-yellow-50",
    target_id: "section-panes"
  }
]

async function migrate() {
  console.log('--- FINALIZING CATEGORY MIGRATION ---')
  
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
