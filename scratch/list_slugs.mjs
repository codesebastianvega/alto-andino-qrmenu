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

async function listSlugs() {
  const { data, error } = await supabase
    .from('categories')
    .select('name, slug')
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Categories in DB:')
    data.forEach(c => console.log(`- ${c.name}: ${c.slug}`))
  }
}

listSlugs()
