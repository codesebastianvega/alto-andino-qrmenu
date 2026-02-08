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

async function checkModifiers() {
  const { data, error } = await supabase
    .from('modifiers')
    .select('group, name, is_active');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const groups = {};
  data.forEach(m => {
    if (!groups[m.group]) groups[m.group] = { total: 0, active: 0, names: [] };
    groups[m.group].total++;
    if (m.is_active) groups[m.group].active++;
    groups[m.group].names.push(m.name);
  });

  console.log('Modifier Groups Found:');
  Object.entries(groups).forEach(([name, stats]) => {
    console.log(`\nGroup: ${name} (${stats.active}/${stats.total} active)`);
    console.log(`Items: ${stats.names.join(', ')}`);
  });
}

checkModifiers();
