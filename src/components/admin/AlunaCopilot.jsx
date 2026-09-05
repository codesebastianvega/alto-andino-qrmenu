import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, History, Loader2, MapPin, Pencil, Send, ShieldCheck, Sparkles, UtensilsCrossed, X, XCircle } from 'lucide-react';
import { chatWithAluna, executeAlunaAction, executeAlunaCatalogManagementAction, executeAlunaKitchenAction, executeAlunaOperationsAction, listAlunaChanges, runOpeningAudit } from '../../services/alunaCopilot';
import CostedProductWorkflow from './aluna/CostedProductWorkflow';
import OperationsWorkflow from './aluna/OperationsWorkflow';
import ChangeHistory from './aluna/ChangeHistory';

const STATUS_STYLES = {
  ready: { icon: CheckCircle2, label: 'Listo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  warning: { icon: AlertTriangle, label: 'Por mejorar', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  blocked: { icon: XCircle, label: 'Bloqueante', className: 'bg-red-50 text-red-700 border-red-200' },
};
const FINDING_PAGES = {
  business_identity: 'business_profile', business_hours: 'sedes', product_content: 'products', recipes_costs: 'recipes',
  dietary_data: 'categories', modifiers: 'modifier_groups', payment_methods: 'settings', printing: 'settings', web_presence: 'web',
};

function priceReplyFallback(text) {
  const matches = String(text || '').match(/(?:\$\s*)?\d{1,3}(?:[.,]\d{3})+(?:\s*COP)?/gi) || [];
  const values = [...new Set(matches.map((match) => Number(match.replace(/[^\d]/g, ''))).filter((value) => value >= 1000))].slice(0, 4);
  return values.map((value) => `Usar $ ${value.toLocaleString('es-CO')} COP`);
}

function safeAssistantReply(reply) {
  const text = String(reply || '').trim();
  if (/procesad|propuesta\s+enviad[ao]|he\s+creado|se\s+ha\s+creado|fue\s+cread[ao]|registrad[ao]\s+correctamente/i.test(text)) {
    return 'La propuesta está lista, pero todavía no se ha guardado. Usa el botón de revisión para comprobar los datos y aprobar la creación real.';
  }
  return text || 'No pude interpretar esa solicitud con suficiente precisión.';
}

function ProductContextCard({ product, recipesEnabled, onEditPrice, onCreateRecipe }) {
  if (!product) return null;
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><UtensilsCrossed size={24} /></div>}
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Producto encontrado</p><h3 className="mt-1 truncate text-base font-bold text-gray-950">{product.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{product.description || 'Sin descripción'}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="font-bold text-gray-900">$ {Number(product.price || 0).toLocaleString('es-CO')}</span><span className={`rounded-full px-2 py-0.5 font-semibold ${product.recipe_id ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{product.recipe_id ? 'Con receta' : 'Sin receta'}</span></div></div>
      </div>
      <div className="grid grid-cols-2 border-t border-gray-100">
        <button type="button" onClick={onEditPrice} className="flex items-center justify-center gap-2 border-r border-gray-100 px-3 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50"><Pencil size={14} /> Editar precio</button>
        <button type="button" disabled={!recipesEnabled || Boolean(product.recipe_id)} onClick={onCreateRecipe} className="flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-300"><UtensilsCrossed size={14} /> {product.recipe_id ? 'Receta vinculada' : 'Crear y vincular receta'}</button>
      </div>
    </article>
  );
}

function PriceWorkflow({ product, isExecuting, onApprove, onCancel }) {
  const [price, setPrice] = useState(product?.price || '');
  return <div className="space-y-4"><div><h3 className="text-lg font-bold text-gray-950">Editar precio</h3><p className="mt-1 text-sm text-gray-600">El cambio se aplicará únicamente a {product.name}.</p></div><div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Precio actual</p><p className="mt-1 text-lg font-bold">$ {Number(product.price || 0).toLocaleString('es-CO')}</p><label className="mt-4 block text-xs font-bold text-gray-700">Nuevo precio<input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm" /></label></div><button type="button" disabled={isExecuting || Number(price) <= 0 || Number(price) === Number(product.price)} onClick={() => onApprove(Number(price))} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-40">{isExecuting ? 'Actualizando…' : 'Revisé el precio: aprobar cambio'}</button><button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500">Cancelar</button></div>;
}

function AuditResult({ audit, onResolve }) {
  const findings = Array.isArray(audit?.findings) ? audit.findings : [];
  const score = Number.isFinite(audit?.score) ? audit.score : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#14261A] p-5 text-white shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Preparación del local</p>
            <p className="mt-2 text-4xl font-bold">{score}<span className="text-lg text-white/60">/100</span></p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            {audit?.readiness === 'ready' ? 'Listo para operar' : 'Revisión necesaria'}
          </span>
        </div>
        {audit?.summary ? (
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            {audit.summary.ready || 0} listos · {audit.summary.warnings || 0} por mejorar · {audit.summary.blockers || 0} bloqueantes
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {findings.map((finding, index) => {
          const status = STATUS_STYLES[finding.status] || STATUS_STYLES.warning;
          const StatusIcon = status.icon;
          return (
            <article key={finding.key || `${finding.label}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full border p-1.5 ${status.className}`}><StatusIcon size={15} aria-hidden="true" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{finding.label || finding.title}</h4>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{finding.message}</p>
                  {finding.status !== 'ready' && finding.suggested_action ? (
                    <div className="mt-3 flex items-start gap-1.5 text-xs font-medium text-[#315C3A]">
                      <ChevronRight size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{finding.suggested_action}</span>
                    </div>
                  ) : null}
                  {finding.status !== 'ready' ? (
                    <button type="button" onClick={() => onResolve(finding)} className="mt-3 rounded-xl bg-[#173D24] px-4 py-2 text-xs font-bold text-white hover:bg-[#21542f]">
                      {['locations', 'catalog', 'business_hours', 'payment_methods', 'printing', 'modifiers'].includes(finding.key) ? 'Resolver con Aluna' : 'Abrir para resolver'}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LocationWorkflow({ brandName, isExecuting, onApprove, onCancel }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: `${brandName} - Sede principal`, address: '', phone: '', whatsapp: '' });
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const canContinue = form.name.trim() && form.address.trim();

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Propuesta pendiente de aprobación</p>
          <p className="mt-2 text-sm text-amber-900">Aluna creará esta sede y horarios iniciales de 8:00 a 22:00 todos los días.</p>
        </div>
        <dl className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
          {[['Marca', brandName], ['Sede', form.name], ['Dirección', form.address], ['Teléfono', form.phone || 'No indicado'], ['WhatsApp', form.whatsapp || form.phone || 'No indicado'], ['Estado', 'Activa y principal']].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0"><dt className="text-gray-500">{label}</dt><dd className="text-right font-semibold text-gray-900">{value}</dd></div>
          ))}
        </dl>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">La acción quedará registrada con tu usuario, la marca activa y los datos aprobados.</div>
        <button type="button" disabled={isExecuting} onClick={() => onApprove(form)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-60">
          {isExecuting ? <><Loader2 size={17} className="animate-spin" /> Creando sede…</> : 'Aprobar y crear sede'}
        </button>
        <button type="button" disabled={isExecuting} onClick={() => setStep('form')} className="w-full py-2 text-xs font-semibold text-gray-500">Corregir datos</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div><h3 className="text-lg font-bold text-gray-950">Crear la primera sede</h3><p className="mt-1 text-sm text-gray-600">No inventaré estos datos. Complétalos y prepararé el cambio para tu aprobación.</p></div>
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <label className="block text-xs font-bold text-gray-700">Nombre de la sede<input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
        <label className="block text-xs font-bold text-gray-700">Dirección *<input value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Dirección completa" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
        <label className="block text-xs font-bold text-gray-700">Teléfono<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Opcional" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
        <label className="block text-xs font-bold text-gray-700">WhatsApp<input value={form.whatsapp} onChange={(event) => updateField('whatsapp', event.target.value)} placeholder="Usará el teléfono si lo dejas vacío" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
      </div>
      <button type="button" disabled={!canContinue} onClick={() => setStep('review')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Revisar propuesta</button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500">Volver al diagnóstico</button>
    </div>
  );
}

const EMPTY_PRODUCT = { name: '', description: '', price: '', tags: '', requires_kitchen: true };

function CatalogWorkflow({ brandName, initialDraft, isExecuting, onApprove, onCancel }) {
  const [step, setStep] = useState('form');
  const [categoryName, setCategoryName] = useState(() => initialDraft?.category_name || '');
  const [products, setProducts] = useState(() => [{
    ...EMPTY_PRODUCT,
    name: initialDraft?.product_name || '',
    description: initialDraft?.description || '',
    price: initialDraft?.price > 0 ? String(initialDraft.price) : '',
    tags: Array.isArray(initialDraft?.tags) ? initialDraft.tags.join(', ') : '',
    requires_kitchen: initialDraft?.requires_kitchen !== false,
  }]);
  const updateProduct = (index, field, value) => setProducts((current) => current.map((product, productIndex) => productIndex === index ? { ...product, [field]: value } : product));
  const removeProduct = (index) => setProducts((current) => current.filter((_, productIndex) => productIndex !== index));
  const normalizedProducts = products.map((product) => ({
    ...product,
    price: Number(product.price),
    tags: product.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
  }));
  const canContinue = categoryName.trim() && normalizedProducts.length > 0 && normalizedProducts.every((product) => product.name.trim() && product.description.trim() && product.price > 0);

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Propuesta pendiente de aprobación</p><p className="mt-2 text-sm text-amber-900">Aluna creará la categoría y vinculará sus productos a las sedes activas de {brandName}.</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Categoría</p><p className="font-bold text-gray-950">{categoryName}</p>
          <div className="mt-4 space-y-3">{normalizedProducts.map((product, index) => <div key={`${product.name}-${index}`} className="rounded-xl bg-gray-50 p-3"><div className="flex justify-between gap-3"><p className="text-sm font-bold text-gray-900">{product.name}</p><p className="text-sm font-bold text-emerald-700">$ {product.price.toLocaleString('es-CO')}</p></div><p className="mt-1 text-xs text-gray-600">{product.description}</p><p className="mt-2 text-[10px] uppercase tracking-wide text-gray-400">{product.tags.length ? product.tags.join(' · ') : 'Sin etiquetas'} · {product.requires_kitchen ? 'Requiere cocina' : 'No requiere cocina'}</p></div>)}</div>
        </div>
        <button type="button" disabled={isExecuting} onClick={() => onApprove({ category_name: categoryName.trim(), products: normalizedProducts })} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-60">{isExecuting ? <><Loader2 size={17} className="animate-spin" /> Creando catálogo…</> : 'Aprobar y crear catálogo'}</button>
        <button type="button" disabled={isExecuting} onClick={() => setStep('form')} className="w-full py-2 text-xs font-semibold text-gray-500">Corregir propuesta</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div><h3 className="text-lg font-bold text-gray-950">Crear catálogo inicial</h3><p className="mt-1 text-sm text-gray-600">Escribe únicamente datos reales. Puedes preparar hasta diez productos en una aprobación.</p></div>
      <label className="block rounded-2xl border border-gray-200 bg-white p-4 text-xs font-bold text-gray-700">Nombre de la categoría *<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Ej: Bento Boxes" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
      <div className="space-y-3">{products.map((product, index) => (
        <div key={index} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Producto {index + 1}</p>{products.length > 1 ? <button type="button" onClick={() => removeProduct(index)} className="text-xs font-bold text-red-500">Quitar</button> : null}</div>
          <input value={product.name} onChange={(event) => updateProduct(index, 'name', event.target.value)} placeholder="Nombre *" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <textarea value={product.description} onChange={(event) => updateProduct(index, 'description', event.target.value)} placeholder="Descripción real *" rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
          <div className="grid grid-cols-2 gap-3"><input type="number" min="1" step="1" value={product.price} onChange={(event) => updateProduct(index, 'price', event.target.value)} placeholder="Precio *" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" /><input value={product.tags} onChange={(event) => updateProduct(index, 'tags', event.target.value)} placeholder="Etiquetas, separadas" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" /></div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600"><input type="checkbox" checked={product.requires_kitchen} onChange={(event) => updateProduct(index, 'requires_kitchen', event.target.checked)} className="rounded border-gray-300 text-emerald-700" /> Requiere preparación en cocina</label>
        </div>
      ))}</div>
      {products.length < 10 ? <button type="button" onClick={() => setProducts((current) => [...current, { ...EMPTY_PRODUCT }])} className="w-full rounded-xl border border-dashed border-emerald-300 py-3 text-xs font-bold text-emerald-700">+ Añadir otro producto</button> : null}
      <button type="button" disabled={!canContinue} onClick={() => setStep('review')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-40">Revisar propuesta</button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500">Volver al diagnóstico</button>
    </div>
  );
}

function ConsolidationWorkflow({ categories, isExecuting, onApprove, onCancel }) {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const source = categories.find((category) => category.id === sourceId);
  const target = categories.find((category) => category.id === targetId);
  if (reviewing && source && target) return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-red-700">Cambio de riesgo alto</p><p className="mt-2 text-sm text-red-900">Aluna moverá {source.product_count} producto(s) de <strong>{source.name}</strong> a <strong>{target.name}</strong> y desactivará la categoría duplicada. No borrará productos.</p></div>
      <button type="button" disabled={isExecuting} onClick={() => onApprove({ source_category_id: source.id, target_category_id: target.id })} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-60">{isExecuting ? <><Loader2 size={17} className="animate-spin" /> Consolidando…</> : 'Aprobar consolidación'}</button>
      <button type="button" disabled={isExecuting} onClick={() => setReviewing(false)} className="w-full py-2 text-xs font-semibold text-gray-500">Cambiar selección</button>
    </div>
  );
  return (
    <div className="space-y-4">
      <div><h3 className="text-lg font-bold text-gray-950">Consolidar categorías</h3><p className="mt-1 text-sm text-gray-600">Elige cuál está repetida y cuál debe conservarse.</p></div>
      <label className="block text-xs font-bold text-gray-700">Categoría duplicada<select value={sourceId} onChange={(event) => { setSourceId(event.target.value); if (event.target.value === targetId) setTargetId(''); }} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-normal"><option value="">Seleccionar…</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} ({category.product_count} productos)</option>)}</select></label>
      <label className="block text-xs font-bold text-gray-700">Categoría que se conservará<select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-normal"><option value="">Seleccionar…</option>{categories.filter((category) => category.id !== sourceId).map((category) => <option key={category.id} value={category.id}>{category.name} ({category.product_count} productos)</option>)}</select></label>
      <button type="button" disabled={!source || !target} onClick={() => setReviewing(true)} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-40">Revisar consolidación</button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500">Cancelar</button>
    </div>
  );
}

export default function AlunaCopilot({ brand, location, locationId, onNavigate, recipesEnabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [workflow, setWorkflow] = useState(null);
  const [success, setSuccess] = useState('');
  const [messages, setMessages] = useState([]);
  const [suggestedIntent, setSuggestedIntent] = useState(null);
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const [catalogDraft, setCatalogDraft] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [changes, setChanges] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const promptRef = useRef(null);
  const titleId = useId();
  const brandId = brand?.id;
  const brandName = brand?.name || 'tu negocio';
  const locationName = location?.name || (locationId ? 'Sede seleccionada' : 'Todas las sedes');

  useEffect(() => {
    setAudit(null);
    setError('');
    setPrompt('');
    setWorkflow(null);
    setSuccess('');
    setMessages([]);
    setSuggestedIntent(null);
    setSuggestedReplies([]);
    setCatalogDraft({});
    setAvailableCategories([]);
    setChanges([]);
    setSelectedProduct(null);
    setIsOpen(false);
  }, [brandId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const textarea = promptRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 48), 192)}px`;
  }, [prompt]);

  const executeAudit = async () => {
    if (!brandId || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      setAudit(await runOpeningAudit({ brandId, locationId }));
      setPrompt('');
    } catch (auditError) {
      setError(auditError.message || 'No pude completar la auditoría. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChanges = async () => {
    setIsLoading(true); setError('');
    try { setChanges(await listAlunaChanges({ brandId })); }
    catch (historyError) { setError(historyError.message || 'No pude cargar el historial.'); }
    finally { setIsLoading(false); }
  };

  const openChanges = () => { setWorkflow('change_history'); loadChanges(); };

  const sendMessage = async (rawMessage) => {
    const userMessage = String(rawMessage || '').trim();
    if (!userMessage || isLoading) return;
    setPrompt('');
    setSuggestedReplies([]);
    setError('');
    setSuccess('');
    setMessages((current) => [...current, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const response = await chatWithAluna({ brandId, locationId, message: userMessage, history: messages, draft: catalogDraft, features: { recipes_enabled: recipesEnabled } });
      const assistantReply = safeAssistantReply(response.reply);
      setMessages((current) => [...current, { role: 'assistant', content: assistantReply }]);
      setSuggestedIntent(response.intent);
      const remoteReplies = Array.isArray(response.suggested_replies)
        ? response.suggested_replies.filter((reply) => typeof reply === 'string' && reply.trim()).map((reply) => reply.trim()).slice(0, 4)
        : [];
      setSuggestedReplies(remoteReplies.length ? remoteReplies : priceReplyFallback(`${userMessage} ${assistantReply}`));
      if (['create_catalog', 'create_costed_product'].includes(response.intent) && response.catalog_draft) setCatalogDraft((current) => ({ ...current, ...response.catalog_draft, recipe_draft: response.recipe_draft?.ingredients?.length ? response.recipe_draft : current.recipe_draft }));
      if (response.matched_product) {
        setSelectedProduct(response.matched_product);
        setCatalogDraft((current) => ({ ...current, ...response.catalog_draft, existing_product: response.matched_product, recipe_draft: response.recipe_draft }));
      }
      if (response.intent === 'create_costed_product' && response.recipe_draft?.ingredients?.length > 0) {
        setSuggestedReplies([]);
        setWorkflow('create_costed_product');
      }
      if (Array.isArray(response.existing_categories)) setAvailableCategories(response.existing_categories);
      if (response.intent === 'audit') setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (chatError) {
      setError(chatError.message || 'No pude responder el mensaje.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(prompt);
  };

  const handlePromptKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (prompt.trim() && !isLoading) sendMessage(prompt);
    }
  };

  const handleSuggestedReply = (reply) => {
    const normalized = reply.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/aprobar|confirmar|revisar.*creacion/.test(normalized) && ['create_catalog', 'create_costed_product'].includes(suggestedIntent)) {
      setSuggestedReplies([]);
      setWorkflow(suggestedIntent);
      return;
    }
    if (/ver.*catalogo/.test(normalized) && onNavigate) {
      setIsOpen(false);
      onNavigate('products');
      return;
    }
    if (/crear.*nuevo.*producto/.test(normalized)) {
      setCatalogDraft({});
      setSuggestedReplies([]);
      setWorkflow(recipesEnabled ? 'create_costed_product' : 'create_catalog');
      return;
    }
    if (selectedProduct && /definir|listar.*ingredientes|editar.*ingredientes/.test(normalized)) {
      setSuggestedReplies([]);
      setWorkflow('create_costed_product');
      return;
    }
    if (/horario/.test(normalized)) {
      setSuggestedReplies([]);
      setWorkflow('update_business_hours');
      return;
    }
    sendMessage(reply);
  };

  const approveLocation = async (proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'create_location', proposal });
      setSuccess(`${result.location.name} fue creada correctamente${result.default_hours_created ? ' con sus horarios iniciales' : ''}.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude ejecutar el cambio aprobado.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveCatalog = async (proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'create_catalog', proposal });
      setSuccess(`Aluna ${result.category_reused ? 'usó la categoría existente' : 'creó la categoría'} ${result.category.name}, agregó ${result.products.length} producto(s) y los vinculó a ${result.linked_locations} sede(s).`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude crear el catálogo aprobado.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveConsolidation = async (proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'consolidate_categories', proposal });
      setSuccess(`Aluna movió ${result.moved_products} producto(s) a ${result.target_category.name} y desactivó ${result.source_category.name}.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) { setError(actionError.message || 'No pude consolidar las categorías.'); }
    finally { setIsLoading(false); }
  };

  const approveCostedProduct = async (proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaKitchenAction({ brandId, locationId, proposal });
      setSuccess(`Aluna creó ${result.product?.name || 'el producto'} con receta y costo por porción de $ ${Math.round(result.costing?.recipe_cost_per_serving || 0).toLocaleString('es-CO')}.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) { setError(actionError.message || 'No pude crear el producto con receta.'); }
    finally { setIsLoading(false); }
  };

  const approvePrice = async (price) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaCatalogManagementAction({ brandId, locationId, action: 'update_product', proposal: { entity_id: selectedProduct.id, changes: { price } } });
      const updated = result.result?.record || { ...selectedProduct, price };
      setSelectedProduct((current) => ({ ...current, ...updated, price }));
      setSuccess(`Aluna actualizó el precio de ${selectedProduct.name} a $ ${price.toLocaleString('es-CO')}.`);
      setWorkflow(null);
    } catch (actionError) { setError(actionError.message || 'No pude actualizar el precio.'); }
    finally { setIsLoading(false); }
  };

  const approveOperations = async (action, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaOperationsAction({ brandId, locationId, action, proposal });
      const labels = {
        update_business_hours: 'actualizó los horarios',
        create_payment_method: `creó el método ${result.payment_method?.name || 'de pago'}`,
        update_printing_settings: `configuró la impresión en ${result.settings?.thermal_paper_width || proposal.thermal_paper_width} mm`,
        create_modifier_group: `creó el grupo ${result.modifier_group?.name || 'de modificadores'}`,
      };
      setSuccess(`Aluna ${labels[action] || 'aplicó el cambio'} correctamente.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) { setError(actionError.message || 'No pude aplicar el cambio operativo.'); }
    finally { setIsLoading(false); }
  };

  const resolveFinding = (finding) => {
    if (finding.key === 'locations') { setWorkflow('create_location'); return; }
    if (finding.key === 'catalog') { setWorkflow('create_catalog'); return; }
    if (finding.key === 'business_hours') { setWorkflow('update_business_hours'); return; }
    if (finding.key === 'payment_methods') { setWorkflow('create_payment_method'); return; }
    if (finding.key === 'printing') { setWorkflow('update_printing_settings'); return; }
    if (finding.key === 'modifiers') { setWorkflow('create_modifier_group'); return; }
    const page = FINDING_PAGES[finding.key];
    if (page && onNavigate) { setIsOpen(false); onNavigate(page); }
  };

  if (!brandId) return null;

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="group fixed bottom-24 right-3 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#173D24] text-white shadow-[0_10px_28px_rgba(23,61,36,0.32)] transition hover:-translate-y-0.5 hover:scale-105 hover:bg-[#21542f] focus:outline-none focus:ring-4 focus:ring-emerald-200 md:bottom-5 md:right-5 md:h-14 md:w-14" aria-label="Abrir copiloto Aluna" aria-haspopup="dialog">
        <Bot size={21} aria-hidden="true" />
        <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-1.5 text-xs font-bold text-white shadow-lg group-hover:block group-focus-visible:block">Abrir Aluna</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} aria-label="Cerrar Aluna" />
          <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="absolute inset-y-0 right-0 flex w-full flex-col bg-[#F7F8F5] shadow-2xl sm:max-w-[640px] xl:max-w-[760px]">
            <header className="border-b border-gray-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173D24] text-white"><Bot size={23} aria-hidden="true" /></div>
                  <div><h2 id={titleId} className="font-bold text-gray-950">Aluna</h2><p className="text-xs text-gray-500">Espacio de trabajo inteligente</p></div>
                </div>
                <div className="flex items-center gap-1"><button type="button" onClick={openChanges} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Ver historial de cambios"><History size={19} aria-hidden="true" /></button><button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Cerrar panel"><X size={20} aria-hidden="true" /></button></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800"><ShieldCheck size={13} aria-hidden="true" /> {brandName}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600"><MapPin size={13} aria-hidden="true" /> {locationName}</span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 xl:px-8">
              {workflow === 'change_history' ? (
                <ChangeHistory changes={changes} isLoading={isLoading} onRefresh={loadChanges} onBack={() => setWorkflow(null)} />
              ) : workflow === 'create_location' ? (
                <LocationWorkflow brandName={brandName} isExecuting={isLoading} onApprove={approveLocation} onCancel={() => setWorkflow(null)} />
              ) : workflow === 'create_catalog' ? (
                <CatalogWorkflow brandName={brandName} initialDraft={catalogDraft} isExecuting={isLoading} onApprove={approveCatalog} onCancel={() => setWorkflow(null)} />
              ) : workflow === 'consolidate_catalog' ? (
                <ConsolidationWorkflow categories={availableCategories} isExecuting={isLoading} onApprove={approveConsolidation} onCancel={() => setWorkflow(null)} />
              ) : workflow === 'create_costed_product' ? (
                <CostedProductWorkflow brandName={brandName} initialDraft={catalogDraft} isExecuting={isLoading} onApprove={approveCostedProduct} onApproveQuick={approveCatalog} onCancel={() => setWorkflow(null)} />
              ) : workflow === 'edit_product_price' && selectedProduct ? (
                <PriceWorkflow product={selectedProduct} isExecuting={isLoading} onApprove={approvePrice} onCancel={() => setWorkflow(null)} />
              ) : ['update_business_hours', 'create_payment_method', 'update_printing_settings', 'create_modifier_group'].includes(workflow) ? (
                <OperationsWorkflow action={workflow} brandName={brandName} locationName={locationName} isExecuting={isLoading} onApprove={approveOperations} onCancel={() => setWorkflow(null)} />
              ) : !audit ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900">Hola, estoy trabajando sobre {brandName}.</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">Puedo revisar catálogo, recetas, horarios, pagos, impresión y presencia web para decirte qué falta antes de abrir.</p>
                  </div>
                  <button type="button" onClick={executeAudit} disabled={isLoading} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md disabled:cursor-wait disabled:opacity-70">
                    <span className="flex items-center gap-3">
                      <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">{isLoading ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : <Sparkles size={19} aria-hidden="true" />}</span>
                      <span><span className="block text-sm font-bold text-gray-900">Auditar apertura</span><span className="mt-0.5 block text-xs text-gray-500">Diagnóstico real, sin modificar datos</span></span>
                    </span>
                    <ChevronRight size={18} className="text-gray-400" aria-hidden="true" />
                  </button>
                </div>
              ) : <AuditResult audit={audit} onResolve={resolveFinding} />}

              {workflow == null && messages.length > 0 ? (
                <div className="mt-5 space-y-3" aria-live="polite">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`max-w-[94%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[86%] ${message.role === 'user' ? 'ml-auto bg-[#173D24] text-white' : 'border border-emerald-100 bg-white text-gray-700'}`}>
                      {message.content}
                    </div>
                  ))}
                  {selectedProduct ? <ProductContextCard product={selectedProduct} recipesEnabled={recipesEnabled} onEditPrice={() => setWorkflow('edit_product_price')} onCreateRecipe={() => setWorkflow('create_costed_product')} /> : null}
                  {suggestedReplies.length > 0 ? <div className="flex flex-wrap gap-2">{suggestedReplies.map((reply) => <button key={reply} type="button" disabled={isLoading} onClick={() => handleSuggestedReply(reply)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:opacity-50">{reply}</button>)}</div> : null}
                  {suggestedIntent === 'create_catalog' && (catalogDraft.category_name || catalogDraft.product_name) ? <button type="button" onClick={() => setWorkflow('create_catalog')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white">Revisar y aprobar creación</button> : null}
                  {suggestedIntent === 'create_location' ? <button type="button" onClick={() => setWorkflow('create_location')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white">Preparar nueva sede</button> : null}
                  {suggestedIntent === 'consolidate_catalog' && availableCategories.length > 1 ? <button type="button" onClick={() => setWorkflow('consolidate_catalog')} className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white">Revisar categorías duplicadas</button> : null}
                  {suggestedIntent === 'create_costed_product' ? <button type="button" onClick={() => setWorkflow('create_costed_product')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white">Revisar producto, receta y costos</button> : null}
                  {['update_business_hours', 'create_payment_method', 'update_printing_settings', 'create_modifier_group'].includes(suggestedIntent) ? <button type="button" onClick={() => setWorkflow(suggestedIntent)} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white">Preparar cambio con Aluna</button> : null}
                </div>
              ) : null}

              {success ? <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">{success}</div> : null}
              {error ? <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{error}</div> : null}
            </div>

            <footer className="border-t border-gray-200 bg-white p-4 sm:px-6">
              {audit ? <button type="button" onClick={executeAudit} disabled={isLoading} className="mb-3 w-full rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">{isLoading ? 'Actualizando auditoría…' : 'Volver a auditar'}</button> : null}
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <label htmlFor={`${titleId}-prompt`} className="sr-only">Escribe a Aluna</label>
                <textarea ref={promptRef} id={`${titleId}-prompt`} value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={handlePromptKeyDown} placeholder="Escribe o pega aquí el menú, receta o tarea…" rows={1} className="max-h-48 min-h-12 min-w-0 flex-1 resize-none overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
                <button type="submit" disabled={!prompt.trim() || isLoading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#173D24] text-white hover:bg-[#21542f] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Enviar mensaje"><Send size={17} aria-hidden="true" /></button>
              </form>
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-gray-400"><span>Enter para enviar · Shift + Enter para una nueva línea</span><span>{prompt.length.toLocaleString('es-CO')} caracteres</span></div>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
