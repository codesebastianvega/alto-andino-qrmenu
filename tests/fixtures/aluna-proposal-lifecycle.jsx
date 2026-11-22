// Browser-only fixture: the real component, no requests or writes to Supabase.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AlunaCopilot from '../../src/components/admin/AlunaCopilot';
import '../../src/index.css';
import '../../src/styles.css';
const coffee = { id:'72f54235-552f-4498-97b2-b2def646d120', name:'Café americano UX', price:5000, is_active:true, updated_at:'2026-11-19T00:00:00Z' };
const croissant = { ...coffee, id:'f10abad9-82e6-447d-b742-102c8060ef11', name:'Croissant UX',price:7000 };
const locations = [{id:'north',name:'Sede Norte'},{id:'south',name:'Sede Sur'}];
let hold = false, writes = 0;
const delayed = [];
const json = (body) => new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
const trace = (message) => { const row=document.createElement('li'); row.textContent=message; document.getElementById('events').append(row); };
window.fetch = async (input, options={}) => {
 const url=new URL(String(input instanceof Request ? input.url : input));
 const method=options.method || (input instanceof Request ? input.method : 'GET');
 if(url.pathname.includes('/rest/v1/') && method === 'GET') {
  if(url.pathname.endsWith('/products')) return json(url.searchParams.has('id') ? (url.searchParams.get('id').includes(coffee.id) ? coffee : croissant) : [coffee,croissant]);
  if(url.pathname.endsWith('/locations')) return json(url.searchParams.has('id') ? locations.find((place)=>url.searchParams.get('id').includes(place.id)) : locations);
  if(url.pathname.endsWith('/location_product_status')) return json(locations.map((place)=>({id:`status-${place.id}`,location_id:place.id,product_id:croissant.id,is_active:true,stock_status:'available',updated_at:croissant.updated_at})));
 }
 if(url.pathname.endsWith('/aluna-agent-chat')) {
  const body=JSON.parse(options.body);
  trace(`Consulta: ${body.message}`);
  const response={intent:'general',reply:'Revisa el precio solicitado.',matched_product:coffee};
  if(!hold) return json(response);
  return new Promise((resolve)=> { delayed.push(()=>resolve(json(response))); trace(`Respuesta retenida ${delayed.length}`); });
 }
 if(url.pathname.endsWith('/aluna-catalog-management-action')) {
  const body=JSON.parse(options.body);
  if(body.action!=='update_product' || body.proposal.entity_id!==coffee.id || body.approved!==true) throw new Error('Unexpected fixture write');
  writes++; trace(`Ejecuciones simuladas: ${writes}`);
  return json({result:{record:{...coffee,price:body.proposal.changes.price}}});
 }
 if(url.pathname.endsWith('/aluna-agent-action')) {
  const body=JSON.parse(options.body);
  if(body.action!=='create_catalog' || body.approved!==true) throw new Error('Unexpected fixture write');
  writes++;trace(`Ejecuciones simuladas: ${writes}`);
  return json({category:{name:body.proposal.category_name},products:body.proposal.products,linked_locations:1});
 }
 if(url.pathname.endsWith('/aluna-opening-audit')) return json({score:100,summary:{ready:1},findings:[]});
 throw new Error(`Network blocked by H19 fixture: ${method} ${url.pathname}`);
};
function Fixture(){
 const [place,setPlace]=useState(locations[0]);
 const [other,setOther]=useState(false);
 const brand={id:other?'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa':'d10ff259-3b11-408c-99fe-174f278e50f1',name:other?'Otro negocio simulado':'Café Bruma · H19 aislado',plan_id:'plan_profesional'};
 return <><main className="p-4 space-x-2"><h1>H19 — sin datos remotos</h1><button onClick={()=>setPlace(locations[0])}>Cambiar a Norte</button><button onClick={()=>setPlace(locations[1])}>Cambiar a Sur</button><button onClick={()=>setOther(!other)}>Cambiar negocio</button><button onClick={()=>{hold=true;trace('Retención activada');}}>Retener respuestas</button><button onClick={()=>delayed[0]?.()}>Liberar primera</button><button onClick={()=>delayed[1]?.()}>Liberar segunda</button><p>{brand.name} · {place.name}</p><ul id="events"/></main><AlunaCopilot brand={brand} location={place} locationId={place.id} recipesEnabled /></>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
