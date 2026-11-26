import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import BokuFlyerCanvas from './BokuFlyerCanvas';
import { FLYER, DEFAULT_COPY, getFlyerCatalog, initialFlyerSelection, validateSelection, priceLabel, getFlyerLayout, minimumPrice } from './flyerModel';
import { exportFlyerJpeg, loadFlyerImage } from './flyerExport';
import { parseDraft } from './flyerDraft';
const inputClass = 'mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900';
const copyLabels = { title: 'Título del flyer', dailyTitle: 'Título de promociones', includes: 'Qué incluyen los bentos del día', menuTitle: 'Título de la galería', extrasTitle: 'Título de extras', footer: 'Nota al pie / contacto' };
function ProductPicker({ title, candidates, ids, onToggle, onMove, limit, prefix, blocked, query }) {
  const visible = candidates.filter(p => !blocked.includes(p.id) && (!query || `${p.flyerName} ${p.categoryName}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
  return <section className="boku-flyer-picker"><h3>{title}<span>{ids.length}{limit ? `/${limit}` : ''}</span></h3>
    {ids.length > 1 && <div className="boku-flyer-order" aria-label={`Orden de ${title}`}>{ids.map((id,index) => { const p = candidates.find(p => p.id === id); return p && <div key={id}><span>{index+1}. {p.flyerName}</span><button type="button" aria-label={`Subir ${prefix}: ${p.flyerName}`} disabled={index === 0} onClick={() => onMove(index,-1)}><ArrowUp size={14}/></button><button type="button" aria-label={`Bajar ${prefix}: ${p.flyerName}`} disabled={index === ids.length-1} onClick={() => onMove(index,1)}><ArrowDown size={14}/></button></div>; })}</div>}
    {limit && <p className="mb-2 text-xs text-stone-500">Elige dos. Para cambiar uno, desmarca primero una promoción.</p>}<details open={limit || query ? true : undefined}><summary>{limit ? 'Elegir promociones' : 'Agregar o quitar platos'}</summary><div className="boku-flyer-picker-list">{visible.map(p => <label key={p.id} className={ids.includes(p.id) ? 'is-selected' : ''}><input type="checkbox" aria-label={`${prefix}: ${p.flyerName}`} checked={ids.includes(p.id)} disabled={Boolean(limit && ids.length >= limit && !ids.includes(p.id))} onChange={() => onToggle(p.id)}/>{p.photo ? <img src={p.photo} alt="" loading="lazy"/> : <span className="boku-flyer-missing-thumb">Sin foto</span>}<span>{p.flyerName}<small>{priceLabel(p.currentPrice)}</small>{!p.photo && <small className="text-red-700">Necesita una foto real</small>}</span></label>)}</div></details>
  </section>;
}
export default function BokuFlyerBuilder({ products, logoUrl = '/boku-icon-512.png', theme = {}, storageKey }) {
  const catalog = useMemo(() => getFlyerCatalog(products), [products]);
  const [dailyIds,setDailyIds] = useState([]), [otherIds,setOtherIds] = useState([]), [extraIds,setExtraIds] = useState([]);
  const [showExtras,setShowExtras] = useState(true), [showDescriptions,setShowDescriptions] = useState(false), [showIncludes,setShowIncludes] = useState(true), [showFooter,setShowFooter] = useState(true), [showStartingPrice,setShowStartingPrice] = useState(true);
  const [copy,setCopy] = useState(DEFAULT_COPY), [descriptions,setDescriptions] = useState({}), [names,setNames] = useState({});
  const [images,setImages] = useState({}), [imageError,setImageError] = useState(''), [exportError,setExportError] = useState(''), [exporting,setExporting] = useState(false), [retry,setRetry] = useState(0);
  const [scale,setScale] = useState(.5), [step,setStep] = useState(1), [query,setQuery] = useState('');
  const [hydrated,setHydrated] = useState(false), [saveStatus,setSaveStatus] = useState('');
  const initialized = useRef(false), canvasRef = useRef(null), previewRef = useRef(null), revision = useRef(0);
  const reset = () => { const initial = initialFlyerSelection(catalog.eligible,catalog.otherCandidates,catalog.pokes); setDailyIds(initial.dailyIds); setOtherIds(initial.otherIds); setExtraIds(initial.extraIds); setNames({}); setDescriptions({}); setCopy({...DEFAULT_COPY}); setShowExtras(true); setShowIncludes(true); setShowFooter(true); setShowStartingPrice(true); setShowDescriptions(false); };
  useEffect(() => {
    if (initialized.current || !catalog.eligible.length) return;
    let draft = null;
    try { if (storageKey) draft = parseDraft(window.localStorage.getItem(storageKey)); }
    catch { setSaveStatus('No se puede acceder al guardado de este navegador. Puedes editar y descargar.'); }
    const initial = draft || initialFlyerSelection(catalog.eligible,catalog.otherCandidates,catalog.pokes);
    setDailyIds(initial.dailyIds); setOtherIds(initial.otherIds); setExtraIds(initial.extraIds);
    if (draft) {
      setCopy(draft.copy); setNames(draft.names); setDescriptions(draft.descriptions);
      if (draft.showExtras !== undefined) setShowExtras(draft.showExtras);
      if (draft.showDescriptions !== undefined) setShowDescriptions(draft.showDescriptions);
      if (draft.showIncludes !== undefined) setShowIncludes(draft.showIncludes);
      if (draft.showFooter !== undefined) setShowFooter(draft.showFooter);
      if (draft.showStartingPrice !== undefined) setShowStartingPrice(draft.showStartingPrice);
    }
    initialized.current = true; setHydrated(true);
  },[catalog,storageKey]);
  useEffect(() => {
    if (!hydrated || !storageKey) return;
    try {
      window.localStorage.setItem(storageKey,JSON.stringify({version:1,dailyIds,otherIds,extraIds,copy,names,descriptions,showExtras,showDescriptions,showIncludes,showFooter,showStartingPrice}));
      setSaveStatus('Diseño guardado automáticamente en este navegador.');
    } catch { setSaveStatus('No se pudo guardar en este navegador. Puedes descargar el JPG para conservarlo.'); }
  },[hydrated,storageKey,dailyIds,otherIds,extraIds,copy,names,descriptions,showExtras,showDescriptions,showIncludes,showFooter,showStartingPrice]);
  const find = ids => ids.map(id => catalog.otherCandidates.find(p => p.id === id)).filter(Boolean);
  const daily = find(dailyIds), others = find(otherIds), extras = showExtras ? find(extraIds) : [], selected = [...daily,...others,...extras];
  const imageUrls = [...new Set([logoUrl,...selected.map(p => p.photo)].filter(Boolean))], imageKey = JSON.stringify(imageUrls);
  const layout = getFlyerLayout(others.length,extras.length,showIncludes,showFooter);
  const selectionError = validateSelection(catalog,dailyIds,otherIds,showExtras ? extraIds : []) || (!layout.fits ? 'Esta selección no cabe con fotos y texto legibles. Quita algún plato u oculta los extras.' : '');
  const missingPhotos = selected.filter(p => !p.photo), ready = imageUrls.every(url => images[url]) && !missingPhotos.length && daily.length === 2;
  const startingPrice = minimumPrice(extras), startingProduct = extras.find(p => p.currentPrice === startingPrice);
  useEffect(() => { revision.current += 1; setExportError(''); },[imageKey,dailyIds,otherIds,extraIds,showExtras,showDescriptions,descriptions,names,copy,showIncludes,showFooter,showStartingPrice]);
  useEffect(() => {
    const urls = JSON.parse(imageKey), controller = new AbortController(); let active = true;
    const timer = setTimeout(() => controller.abort(),25000); setImageError('');
    Promise.all(urls.map(async url => [url,await loadFlyerImage(url,controller.signal)]))
      .then(entries => { if(active) setImages(Object.fromEntries(entries)); })
      .catch(() => { if(active) { setImages({}); setImageError('No se pudieron preparar todas las fotos. Revisa la conexión o el permiso CORS y reintenta.'); } }).finally(() => clearTimeout(timer));
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  },[imageKey,retry]);
  useEffect(() => {
    const element = previewRef.current; if(!element) return;
    const resize = () => { const widthScale = element.clientWidth / FLYER.width; const desktop = window.matchMedia('(min-width: 1280px)').matches; setScale(Math.min(1,widthScale,desktop ? Math.max(300,window.innerHeight-190)/FLYER.height : 1)); };
    const observer = new ResizeObserver(resize); observer.observe(element); window.addEventListener('resize',resize); resize();
    return () => { observer.disconnect(); window.removeEventListener('resize',resize); };
  },[]);
  const toggle = (setter,id) => setter(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids,id]);
  const move = (setter,index,delta) => setter(ids => { const next = [...ids]; [next[index],next[index+delta]] = [next[index+delta],next[index]]; return next; });
  const download = async () => {
    if(exporting || selectionError || !ready || imageError) return;
    setExporting(true); setExportError(''); const current = revision.current;
    try { const dataUrl = await exportFlyerJpeg(canvasRef.current); if(revision.current !== current) throw new Error('La selección cambió. Vuelve a descargar el JPG.'); const anchor = document.createElement('a'); anchor.href = dataUrl; anchor.download = 'boku-bento-menu-del-dia.jpg'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); }
    catch(error) { setExportError(error.message || 'No se pudo generar el JPG.'); } finally { setExporting(false); }
  };
  return <div className="boku-flyer-builder">
    <aside className="boku-flyer-panel" aria-label="Configuración del flyer"><header><p>BOKU BENTO</p><h1>Tu menú, listo para compartir</h1><span>Fotos reales, precios de la carta. Solo cambia el flyer.</span></header>
      <nav className="boku-flyer-tabs" aria-label="Pasos del constructor">{['Platos','Textos','Descargar'].map((label,i) => <button type="button" key={label} aria-current={step===i+1 ? 'step' : undefined} onClick={() => setStep(i+1)}>{i+1}. {label}</button>)}</nav>
      <div className="boku-flyer-panel-body"><fieldset disabled={exporting}>
        {step===1 && <><label className="block text-xs font-semibold">Buscar en el catálogo<input type="search" className={inputClass} placeholder="Nombre o categoría" value={query} onChange={e => setQuery(e.target.value)}/></label>
          <ProductPicker title="Bentos del día" prefix="Bento del día" candidates={catalog.eligible} ids={dailyIds} limit={2} blocked={[]} query={query} onToggle={id => { if(dailyIds.includes(id) || dailyIds.length<2) { toggle(setDailyIds,id); setOtherIds(ids => ids.filter(x => x!==id)); setExtraIds(ids => ids.filter(x => x!==id)); } }} onMove={(i,d) => move(setDailyIds,i,d)}/>
          <ProductPicker title="Galería principal" prefix="Plato de galería" candidates={catalog.otherCandidates} ids={otherIds} blocked={[...dailyIds,...(showExtras ? extraIds : [])]} query={query} onToggle={id => { toggle(setOtherIds,id); setExtraIds(ids => ids.filter(x => x!==id)); }} onMove={(i,d) => move(setOtherIds,i,d)}/>
          <label className="boku-flyer-switch"><input type="checkbox" role="switch" checked={showExtras} onChange={e => setShowExtras(e.target.checked)}/>Mostrar galería de extras</label>
          {showExtras && <ProductPicker title="Pokes y extras" prefix="Extra" candidates={catalog.otherCandidates} ids={extraIds} blocked={[...dailyIds,...otherIds]} query={query} onToggle={id => toggle(setExtraIds,id)} onMove={(i,d) => move(setExtraIds,i,d)}/>}
          <button type="button" className="boku-flyer-reset" onClick={reset}><RotateCcw size={14}/>Restablecer propuesta</button>
        </>}
        {step===2 && <div className="space-y-4">{Object.entries(copyLabels).map(([key,label]) => <label key={key} className="block text-xs font-semibold">{label}<input className={inputClass} value={copy[key]} maxLength={key==='includes'||key==='footer' ? 100 : 40} onChange={e => setCopy(value => ({...value,[key]:e.target.value}))}/></label>)}
          {[[showIncludes,setShowIncludes,'Mostrar qué incluye el menú del día'],[showDescriptions,setShowDescriptions,'Descripción corta en destacados'],[showFooter,setShowFooter,'Mostrar nota al pie'],[showStartingPrice,setShowStartingPrice,'Mostrar precio «desde» de los extras']].map(([value,setValue,label]) => <label className="boku-flyer-switch" key={label}><input type="checkbox" role="switch" checked={value} onChange={e => setValue(e.target.checked)}/>{label}</label>)}
          {showStartingPrice && startingProduct && <p className="text-xs text-stone-500">Desde {priceLabel(startingPrice)}: {startingProduct.flyerName}. Se toma el precio vigente de los extras seleccionados; no se modifica la carta.</p>}
          <details><summary className="text-sm font-semibold cursor-pointer">Personalizar nombres y descripciones</summary><div className="mt-3 space-y-4">{selected.map(p => <div key={p.id}><label className="block text-xs font-semibold">Nombre: {p.flyerName}<input className={inputClass} maxLength={56} value={names[p.id] ?? p.flyerName} onChange={e => setNames(value => ({...value,[p.id]:e.target.value}))}/></label>{dailyIds.includes(p.id) && showDescriptions && <label className="mt-2 block text-xs">Descripción de {p.flyerName}<input className={inputClass} maxLength={55} value={descriptions[p.id] ?? p.shortDescription} onChange={e => setDescriptions(value => ({...value,[p.id]:e.target.value}))}/></label>}</div>)}</div></details>
        </div>}
        {step===3 && <div className="space-y-4"><h2 className="font-bold text-lg">Revisa y comparte</h2><p className="text-sm text-stone-600">{daily.length} destacados · {others.length} platos · {extras.length} extras. Todos con fotografía.</p><p className="text-sm text-stone-600">El archivo incluye únicamente el flyer. JPG de 2160 × 2700 px, calidad 95%.</p><p className="text-sm text-stone-600">Revisa nombres, precios y el texto de sopa y jugo en la vista previa antes de descargar.</p>{ready && !selectionError && !imageError && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Fotografías listas. Puedes descargar.</p>}</div>}
      </fieldset></div>
      <div className="boku-flyer-panel-bottom">{selectionError && <p role="status" className="boku-flyer-warning">{selectionError}</p>}{missingPhotos.length>0 && <p role="alert" className="boku-flyer-warning">Falta una foto real de: {missingPhotos.map(p => p.flyerName).join(', ')}.</p>}{imageError && <p role="alert" className="boku-flyer-warning">{imageError} <button type="button" onClick={() => setRetry(n => n+1)} className="underline">Reintentar fotos</button></p>}{!ready&&!imageError&&!missingPhotos.length && <p role="status" className="text-xs text-stone-500">Preparando fotografías…</p>}{exportError && <p role="alert" className="boku-flyer-warning">{exportError}</p>}
        <button type="button" className="boku-flyer-download" disabled={exporting||Boolean(selectionError)||!ready||Boolean(imageError)} onClick={download}><Download size={17}/>{exporting ? 'Preparando JPG…' : 'Descargar JPG'}</button><small>1080 × 1350 · Exportación al doble de resolución</small>{saveStatus && <small role="status">{saveStatus}</small>}
      </div>
    </aside>
    <section className="boku-flyer-preview" aria-label="Vista previa del flyer"><div className="boku-flyer-preview-caption"><span>Vista previa</span><span>{selected.length} platos con foto · 4:5</span></div><div ref={previewRef} className="boku-flyer-preview-space"><div className="boku-flyer-viewport" style={{width:FLYER.width*scale,height:FLYER.height*scale}}><div className="boku-flyer-scaled" style={{width:FLYER.width,transform:`scale(${scale})`}}><BokuFlyerCanvas ref={canvasRef} daily={daily} others={others} extras={extras} images={images} showDescriptions={showDescriptions} descriptions={descriptions} names={names} logoUrl={logoUrl} layout={layout} theme={theme} copy={copy} showIncludes={showIncludes} showFooter={showFooter} showStartingPrice={showStartingPrice} startingPrice={startingPrice}/></div></div></div></section>
  </div>;
}
