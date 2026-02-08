import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

let supabaseUrl, supabaseServiceKey;

try {
  if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      for (const line of envConfig.split('\n')) {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/['"]/g, '');
            if (key === 'VITE_SUPABASE_URL') supabaseUrl = value;
            if (key === 'VITE_SUPABASE_ANON_KEY') supabaseServiceKey = value;
        }
      }
  }
} catch (e) {}

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function saveModifiers() {
  const { data, error } = await supabase
    .from('modifiers')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  fs.writeFileSync('modifiers_dump.json', JSON.stringify(data, null, 2));
  console.log('Saved', data.length, 'modifiers to modifiers_dump.json');
}

saveModifiers();
