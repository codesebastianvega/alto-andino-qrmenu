// Browser-only integration fixture. Not an application entry point or a Vite build input.
// No request is allowed to reach a real Supabase project from this fixture.
import React from 'react';
import { createRoot } from 'react-dom/client';
import AlunaCopilot from '../../src/components/admin/AlunaCopilot';
import '../../src/index.css';
import '../../src/styles.css';

const coffee = { id: '72f54235-552f-4498-97b2-b2def646d120', name: 'Café americano UX', price: 5000 };
const croissant = { id: 'f10abad9-82e6-447d-b742-102c8060ef11', name: 'Croissant UX', price: 7000 };
let failRecipe = true;
let writes = 0;
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const trace = (message) => {
  const entry = document.createElement('li');
  entry.textContent = message;
  document.getElementById('simulation-events').append(entry);
};
window.fetch = async (input, options = {}) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.includes('/rest/v1/products')) return reply([coffee, croissant]);
  if (url.includes('/functions/v1/aluna-agent-chat')) {
    const body = JSON.parse(options.body);
    trace(`Solicitud: ${body.message}`);
    if (/receta/i.test(body.message)) {
      if (failRecipe) { failRecipe = false; trace('Fallo del proveedor simulado. Sin escrituras.'); throw new Error('Simulated provider internal JSON error'); }
      trace('Respuesta equivocada simulada: creación del croissant. Debe descartarse.');
      return reply({ intent: 'create_catalog', reply: 'Crear Croissant UX', matched_product: croissant, catalog_draft: { product_name: croissant.name, price: 7000 }, suggested_replies: ['Aprobar creación'] });
    }
    if (/precio/i.test(body.message)) return reply({ intent: 'create_catalog', reply: 'Propuesta de precio para revisión.', matched_product: coffee, catalog_draft: { product_name: croissant.name } });
    if (/crea/i.test(body.message)) return reply({ intent: 'create_catalog', reply: 'Revisa esta propuesta antes de guardar.', catalog_draft: { product_name: croissant.name, price: 7000, category_name: 'Desayunos UX' } });
    return reply({ intent: 'general', reply: 'Croissant UX está en tu carta a $7.000.', matched_product: croissant });
  }
  if (url.includes('/functions/v1/aluna-catalog-management-action')) {
    const body = JSON.parse(options.body);
    if (Object.keys(body).sort().join(',') !== 'action,approved,brand_id,idempotency_key,proposal' || body.action !== 'update_product' || body.proposal.entity_id !== coffee.id || body.proposal.changes.price !== 5500) throw new Error('Unexpected write in integration fixture');
    writes += 1;
    coffee.price = 5500;
    trace(`Cambios de precio aprobados: ${writes}. Café $5.500. Croissant $7.000.`);
    return reply({ result: { record: { ...coffee } } });
  }
  throw new Error('Network blocked in isolated conversation fixture');
};

createRoot(document.getElementById('root')).render(<>
  <main className="p-8"><h1>Simulación de H01 y regresión de H04</h1><p>Catálogo y proveedor simulados. No se modifican datos reales.</p><ul id="simulation-events" /></main>
  <AlunaCopilot brand={{ id: 'd10ff259-3b11-408c-99fe-174f278e50f1', name: 'Café Bruma · Simulación H01', plan_id: 'plan_profesional' }} locationId="fixture" recipesEnabled />
</>);
