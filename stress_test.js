import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan las variables de entorno de Supabase (.env).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CONCURRENT_USERS = 50;

async function simulateMenuLoad(userId) {
  const startTime = Date.now();
  let success = true;
  let errorMsg = null;
  
  try {
    // Simulamos un visitante cargando el menú: pide marcas, categorías y productos.
    const [brandRes, catRes, prodRes] = await Promise.all([
      supabase.from('brands').select('id, name').limit(1),
      supabase.from('categories').select('id, name, is_active').eq('is_active', true).limit(10),
      supabase.from('products').select('id, name, price, is_active').eq('is_active', true).limit(50)
    ]);

    if (brandRes.error) throw brandRes.error;
    if (catRes.error) throw catRes.error;
    if (prodRes.error) throw prodRes.error;
    
  } catch (err) {
    success = false;
    errorMsg = err.message || JSON.stringify(err);
  }

  const endTime = Date.now();
  return {
    userId,
    duration: endTime - startTime,
    success,
    errorMsg
  };
}

async function runStressTest() {
  console.log(`\n🚀 Iniciando PRUEBA DE ESTRÉS con ${CONCURRENT_USERS} usuarios concurrentes...`);
  console.log('Simulando escaneo de código QR (Descarga de Marca, Categorías y Productos)...\n');
  
  const promises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    promises.push(simulateMenuLoad(i));
  }

  const startTotal = Date.now();
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTotal;

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalResponseTime = successful.reduce((sum, r) => sum + r.duration, 0);
  const avgResponseTime = successful.length > 0 ? (totalResponseTime / successful.length).toFixed(2) : 0;
  
  const maxResponseTime = successful.length > 0 ? Math.max(...successful.map(r => r.duration)) : 0;
  const minResponseTime = successful.length > 0 ? Math.min(...successful.map(r => r.duration)) : 0;

  console.log('📊 --- RESULTADOS DE LA PRUEBA ---');
  console.log(`⏱️ Tiempo total de la prueba: ${totalDuration} ms`);
  console.log(`✅ Peticiones exitosas: ${successful.length} / ${CONCURRENT_USERS}`);
  if (failed.length > 0) {
    console.log(`❌ Peticiones fallidas: ${failed.length} / ${CONCURRENT_USERS}`);
  }
  
  if (successful.length > 0) {
    console.log(`\n⚡ Tiempos de respuesta individuales (solo exitosas):`);
    console.log(`  - Promedio: ${avgResponseTime} ms`);
    console.log(`  - Más rápida: ${minResponseTime} ms`);
    console.log(`  - Más lenta: ${maxResponseTime} ms`);
  }

  if (failed.length > 0) {
    console.log(`\n⚠️ Errores encontrados:`);
    failed.slice(0, 3).forEach(f => {
      console.log(`  - Usuario ${f.userId}: ${f.errorMsg}`);
    });
    if (failed.length > 3) console.log(`  ...y ${failed.length - 3} errores más.`);
  }
  
  console.log('\n💡 Conclusión:');
  if (failed.length === 0 && maxResponseTime < 2000) {
    console.log('✅ ¡Excelente! La base de datos aguantó perfectamente el pico de tráfico rápido y responde en menos de 2 segundos. ¡Tu MVP está listo!');
  } else if (failed.length === 0) {
    console.log('⚠️ Todo funcionó, pero algunas peticiones tomaron un poco de tiempo. Es completamente normal para el plan Free de Supabase, pero a futuro (con cientos de pedidos por minuto) podrías necesitar el plan Pro ($25/mes).');
  } else {
    console.log('❌ Hubo caídas. Supabase bloqueó peticiones (Rate Limit) o la red falló. Si pasa seguido, Supabase Pro lo soluciona.');
  }
}

runStressTest();
