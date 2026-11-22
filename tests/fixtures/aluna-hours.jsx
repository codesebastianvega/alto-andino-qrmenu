// Isolated integration fixture: no real Supabase requests or writes are allowed.
import React from 'react';
import { createRoot } from 'react-dom/client';
import AlunaCopilot from '../../src/components/admin/AlunaCopilot';
import '../../src/index.css';
import '../../src/styles.css';

const brandId = 'd10ff259-3b11-408c-99fe-174f278e50f1';
const locations = [{ id: '58f1d5d4-5eb3-4509-8584-ab7ea13d6db4', name: 'Sede Principal' }, { id: 'a8fb8b19-bb22-4f6e-8ced-28d313195efa', name: 'Sede Norte' }];
const hours = locations.flatMap((location) => Array.from({ length: 7 }, (_, day_of_week) => ({ location_id: location.id, day_of_week, open_time: '08:00', close_time: '22:00', is_closed: false })));
let writes = 0;
const reply = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
const trace = (text) => { const line = document.createElement('li'); line.textContent = text; document.getElementById('hours-events').append(line); };
window.fetch = async (input, options = {}) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.includes('/rest/v1/locations')) return reply(locations);
  if (url.includes('/rest/v1/business_hours')) return reply(hours);
  if (url.includes('/functions/v1/aluna-agent-chat')) { trace('Error: se intentó depender de un modelo para configurar horarios.'); throw new Error('Provider unavailable in fixture'); }
  if (url.includes('/functions/v1/aluna-operations-action')) {
    const body = JSON.parse(options.body);
    if (body.action !== 'update_business_hours' || body.approved !== true || body.brand_id !== brandId || body.location_id !== locations[0].id || !body.idempotency_key || body.proposal.hours.length !== 5 || body.proposal.hours.some((row) => row.day_of_week < 1 || row.day_of_week > 5 || row.open_time !== '08:00' || row.close_time !== '18:00' || row.is_closed !== false)) throw new Error('Unexpected write in fixture');
    writes += 1;
    for (const row of body.proposal.hours) Object.assign(hours.find((item) => item.location_id === body.location_id && item.day_of_week === row.day_of_week), row);
    trace(`Aprobaciones ejecutadas: ${writes}. Solo lunes a viernes de Sede Principal, 08:00–18:00.`);
    trace(`Sábado y domingo: ${hours.filter((row) => row.location_id === body.location_id && [0, 6].includes(row.day_of_week)).map((row) => `${row.open_time}–${row.close_time}`).join(', ')}. Sede Norte: sin cambios.`);
    return reply({ success: true, hours: hours.filter((row) => row.location_id === body.location_id && row.day_of_week > 0 && row.day_of_week < 6) });
  }
  throw new Error('Network blocked in isolated hours fixture');
};

createRoot(document.getElementById('root')).render(<>
  <main className="p-8"><h1>Simulación H11 — Horarios</h1><p>Sedes y backend simulados. Modelo no disponible. Ninguna escritura real.</p><ul id="hours-events" /></main>
  <AlunaCopilot brand={{ id: brandId, name: 'Café Bruma · Simulación H11', plan_id: 'plan_profesional' }} locationId="all" />
</>);
