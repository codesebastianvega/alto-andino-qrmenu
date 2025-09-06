// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (!url || !anonKey) {
  console.warn("Supabase vars missing; app running in placeholder mode");
} else {
  supabase = createClient(url, anonKey);
}

export default supabase;

