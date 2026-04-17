import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Read .env.local manually since it's in the root
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

async function checkSchema() {
  console.log('--- AUDIT: Table "categories" ---')
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .select('*')
    .limit(1)

  if (catError) {
    console.error('Error fetching categories:', catError)
  } else {
    console.log('Sample category columns:', Object.keys(catData[0] || {}))
    if (catData[0]) {
      console.log('Sample visibility_config:', JSON.stringify(catData[0].visibility_config, null, 2))
    }
  }

  console.log('\n--- AUDIT: Table "products" ---')
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(1)

  if (prodError) {
    console.error('Error fetching products:', prodError)
  } else {
    console.log('Sample product columns:', Object.keys(prodData[0] || {}))
    if (prodData[0]) {
       console.log('Sample subcategory value:', prodData[0].subcategory)
    }
  }
}

checkSchema()
