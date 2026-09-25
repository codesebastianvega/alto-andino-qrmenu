import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, History, Loader2, MapPin, Pencil, Send, ShieldCheck, Sparkles, UtensilsCrossed, X, XCircle } from 'lucide-react';
import { chatWithAluna, executeAlunaAction, executeAlunaCatalogManagementAction, executeAlunaKitchenAction, executeAlunaOperationsAction, executeAlunaBrandWebAction, executeAlunaInventoryAction, executeAlunaVenueAction, listAlunaChanges, runOpeningAudit } from '../../services/alunaCopilot';
import CostedProductWorkflow from './aluna/CostedProductWorkflow';
import OperationsWorkflow from './aluna/OperationsWorkflow';
import ChangeHistory from './aluna/ChangeHistory';
import { GuidanceCard, AgenticProposalCard, DeepLinkCard, PlanInfoCard } from './aluna/CaminoCards';
import { getPlanQuota } from '../../config/quotas';

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
      <div>
        <h3 className="text-lg font-bold text-gray-950">Crear la primera sede</h3>
        <p className="mt-1 text-sm text-gray-600">Aluna preparará los datos de tu punto de venta para tu revisión y aprobación.</p>
      </div>

      <div className="space-y-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-gray-700">Nombre de la sede *</label>
          <input 
            value={form.name} 
            onChange={(event) => updateField('name', event.target.value)} 
            placeholder="Ej: Sede Principal, Sede Poblado, Chapinero" 
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
          <p className="mt-1 text-[11px] text-gray-400">Identificador visible de este punto de venta.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Dirección física completa *</label>
          <input 
            value={form.address} 
            onChange={(event) => updateField('address', event.target.value)} 
            placeholder="Ej: Calle 93 # 12-45, Local 102" 
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
          <p className="mt-1 text-[11px] text-gray-400">Dirección completa del local para cálculo de domicilios y cobertura.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700">Teléfono de contacto</label>
            <input 
              value={form.phone} 
              onChange={(event) => updateField('phone', event.target.value)} 
              placeholder="Ej: +57 601 234 5678" 
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            />
            <p className="mt-1 text-[11px] text-gray-400">Línea fija o móvil de atención al cliente.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">WhatsApp de pedidos</label>
            <input 
              value={form.whatsapp} 
              onChange={(event) => updateField('whatsapp', event.target.value)} 
              placeholder="Ej: +57 310 987 6543" 
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            />
            <p className="mt-1 text-[11px] text-gray-400">Número celular para confirmaciones de órdenes.</p>
          </div>
        </div>
      </div>

      <button type="button" disabled={!canContinue} onClick={() => setStep('review')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:cursor-not-allowed disabled:opacity-40 transition-all">
        Revisar propuesta
      </button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
        Volver al diagnóstico
      </button>
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Propuesta pendiente de aprobación</p>
          <p className="mt-2 text-sm text-amber-900">Aluna creará la categoría y vinculará sus productos a las sedes activas de {brandName}.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Categoría</p>
          <p className="font-bold text-gray-950 text-base">{categoryName}</p>
          <div className="mt-4 space-y-3">
            {normalizedProducts.map((product, index) => (
              <div key={`${product.name}-${index}`} className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="text-sm font-bold text-emerald-700">$ {product.price.toLocaleString('es-CO')} COP</p>
                </div>
                <p className="mt-1 text-xs text-gray-600">{product.description}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-400">
                  {product.tags.length ? product.tags.join(' · ') : 'Sin etiquetas'} · {product.requires_kitchen ? 'Requiere cocina (KDS)' : 'No requiere cocina'}
                </p>
              </div>
            ))}
          </div>
        </div>
        <button type="button" disabled={isExecuting} onClick={() => onApprove({ category_name: categoryName.trim(), products: normalizedProducts })} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-60 transition-all">
          {isExecuting ? <><Loader2 size={17} className="animate-spin" /> Creando catálogo…</> : 'Aprobar y crear catálogo'}
        </button>
        <button type="button" disabled={isExecuting} onClick={() => setStep('form')} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
          Corregir propuesta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-950">Crear catálogo inicial</h3>
        <p className="mt-1 text-sm text-gray-600">Completa los datos de tu menú. Puedes preparar hasta diez productos en una sola aprobación.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
        <label className="block text-xs font-bold text-gray-700">Nombre de la categoría principal *</label>
        <input 
          value={categoryName} 
          onChange={(event) => setCategoryName(event.target.value)} 
          placeholder="Ej: Bento Boxes, Platos Fuertes, Bebidas Frías" 
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
        />
        <p className="mt-1 text-[11px] text-gray-400">Sección principal de tu menú QR donde se agruparán estos productos.</p>
      </div>

      <div className="space-y-3.5">
        {products.map((product, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Producto #{index + 1}</p>
              {products.length > 1 ? (
                <button type="button" onClick={() => removeProduct(index)} className="text-xs font-bold text-red-500 hover:text-red-700">
                  Quitar producto
                </button>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700">Nombre del plato o producto *</label>
              <input 
                value={product.name} 
                onChange={(event) => updateProduct(index, 'name', event.target.value)} 
                placeholder="Ej: Bento Salmón Teriyaki" 
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
              <p className="mt-1 text-[11px] text-gray-400">Nombre visible en el menú QR para los clientes.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700">Descripción para el menú QR *</label>
              <textarea 
                value={product.description} 
                onChange={(event) => updateProduct(index, 'description', event.target.value)} 
                placeholder="Ej: Salmón fresco glaseado en salsa teriyaki casera, arroz al vapor, edamames y ensalada wakame..." 
                rows={2} 
                className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
              <p className="mt-1 text-[11px] text-gray-400">Describe ingredientes y sabor para despertar el apetito del comensal.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700">Precio de venta al público (COP) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">$</span>
                  <input 
                    type="number" 
                    min="1" 
                    step="1" 
                    value={product.price} 
                    onChange={(event) => updateProduct(index, 'price', event.target.value)} 
                    placeholder="Ej: 32000" 
                    className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">Precio final en pesos colombianos con impuestos.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">Etiquetas / Badges (opcional)</label>
                <input 
                  value={product.tags} 
                  onChange={(event) => updateProduct(index, 'tags', event.target.value)} 
                  placeholder="Ej: Recomendado, Sin Gluten, Nuevo" 
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
                <p className="mt-1 text-[11px] text-gray-400">Palabras clave separadas por comas para filtros.</p>
              </div>
            </div>

            <div className="pt-1 border-t border-gray-100">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={product.requires_kitchen} 
                  onChange={(event) => updateProduct(index, 'requires_kitchen', event.target.checked)} 
                  className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-500" 
                /> 
                <span>Requiere preparación en cocina (KDS)</span>
              </label>
              <p className="ml-5 mt-0.5 text-[11px] text-gray-400">Si está marcado, los pedidos enviarán comanda a la pantalla de cocina o impresora.</p>
            </div>
          </div>
        ))}
      </div>

      {products.length < 10 ? (
        <button type="button" onClick={() => setProducts((current) => [...current, { ...EMPTY_PRODUCT }])} className="w-full rounded-xl border border-dashed border-emerald-300 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50/50 transition-colors">
          + Añadir otro producto
        </button>
      ) : null}

      <button type="button" disabled={!canContinue} onClick={() => setStep('review')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-40 transition-all">
        Revisar propuesta
      </button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
        Volver al diagnóstico
      </button>
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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-red-700">Cambio de riesgo alto</p>
        <p className="mt-2 text-sm text-red-900 leading-relaxed">
          Aluna moverá <strong>{source.product_count} producto(s)</strong> de <strong>{source.name}</strong> a <strong>{target.name}</strong> y desactivará la categoría repetida. Ningún plato será eliminado.
        </p>
      </div>
      <button type="button" disabled={isExecuting} onClick={() => onApprove({ source_category_id: source.id, target_category_id: target.id })} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-all">
        {isExecuting ? <><Loader2 size={17} className="animate-spin" /> Consolidando…</> : 'Aprobar consolidación'}
      </button>
      <button type="button" disabled={isExecuting} onClick={() => setReviewing(false)} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
        Cambiar selección
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-950">Consolidar categorías duplicadas</h3>
        <p className="mt-1 text-sm text-gray-600">Unifica productos repetidos en una sola categoría oficial sin perder historial.</p>
      </div>

      <div className="space-y-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-gray-700">Categoría duplicada que se desactivará *</label>
          <select value={sourceId} onChange={(event) => { setSourceId(event.target.value); if (event.target.value === targetId) setTargetId(''); }} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500">
            <option value="">Seleccionar categoría a mover…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.product_count} productos)
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-400">Sus productos se trasladarán y la categoría quedará inactiva.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Categoría destino que se conservará *</label>
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500">
            <option value="">Seleccionar categoría principal…</option>
            {categories.filter((category) => category.id !== sourceId).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.product_count} productos)
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-400">Esta categoría permanecerá activa en el menú con todos los productos consolidados.</p>
        </div>
      </div>

      <button type="button" disabled={!source || !target} onClick={() => setReviewing(true)} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-40 transition-all">
        Revisar consolidación
      </button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
        Cancelar
      </button>
    </div>
  );
}

function LumiEmblem({ size = 22, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2L14.2 8.3L20.5 10.5L14.2 12.7L12 19L9.8 12.7L3.5 10.5L9.8 8.3L12 2Z" fill="currentColor" />
      <circle cx="12" cy="10.5" r="2.5" fill="#FDE047" />
      <circle cx="18" cy="5" r="1.5" fill="#FDE047" />
      <circle cx="6" cy="16" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

const KEYWORD_PAGES = {
  'producto': 'products', 'plato': 'products', 'carta': 'products', 'precios': 'products',
  'categoria': 'categories', 'categoría': 'categories',
  'modificador': 'modifier_groups', 'extra': 'modifier_groups', 'opcion': 'modifier_groups', 'opción': 'modifier_groups',
  'horario': 'settings', 'domicilio': 'settings', 'whatsapp': 'settings', 'propina': 'settings', 'impresion': 'settings', 'impresión': 'settings', 'pago': 'settings',
  'receta': 'recipes', 'costo': 'recipes', 'costeo': 'recipes',
  'inventario': 'inventory', 'stock': 'inventory', 'insumo': 'inventory',
  'mesa': 'tables', 'mesas': 'tables', 'qr': 'tables', 'salon': 'tables', 'salón': 'tables',
  'sede': 'sedes', 'sucursal': 'sedes',
  'web': 'web', 'portada': 'web', 'banner': 'web', 'color': 'web',
  'personal': 'staff', 'mesero': 'staff', 'turno': 'staff',
};

function detectTargetPage(text) {
  const norm = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const [kw, page] of Object.entries(KEYWORD_PAGES)) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(norm)) return page;
  }
  return null;
}

function parseStepsFromText(text) {
  const lines = String(text || '').split('\n');
  const steps = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:(?:\d+[\.\)]\s*)|(?:paso\s*\d+[:\.]?\s*)|(?:[-•*]\s+))(.*)/i);
    if (match && match[1] && match[1].trim().length > 5) {
      steps.push(match[1].trim());
    }
  });
  return steps;
}

function extractTipFromText(text) {
  const match = String(text || '').match(/(?:consejo|tip|recomendaci[oó]n|nota|recuerda):\s*([^\n\.]+[\.]?)/i);
  return match ? match[1].trim() : null;
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
  const [aiUsage, setAiUsage] = useState(brand?.ai_generations_used || 0);
  const promptRef = useRef(null);
  const titleId = useId();
  const brandId = brand?.id;
  const brandName = brand?.name || 'tu negocio';
  const locationName = location?.name || (locationId ? 'Sede seleccionada' : 'Todas las sedes');
  const planQuota = getPlanQuota(brand?.plan_id);

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
    setAiUsage(brand?.ai_generations_used || 0);
    setIsOpen(false);
  }, [brandId, brand?.ai_generations_used]);

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

  const handleDeepNavigate = (pageId) => {
    setIsOpen(false);
    if (onNavigate) onNavigate(pageId);
    window.dispatchEvent(new CustomEvent('aluna:navigate', { detail: { target: pageId } }));
  };

  const handleDeepPrefill = (pageId, prefillData) => {
    setIsOpen(false);
    if (onNavigate) onNavigate(pageId);
    window.dispatchEvent(new CustomEvent('aluna:prefill', { 
      detail: { target: pageId, data: prefillData } 
    }));
  };

  const handleApproveProposalCard = (card) => {
    if (!card) return;
    if (card.action === 'create_catalog' || card.draftType === 'catalog') {
      const draft = card.draft || catalogDraft;
      const productName = String(draft.product_name || '').trim();
      const price = Number(draft.price);
      const categoryName = String(draft.category_name || '').trim() || 'General';
      const description = String(draft.description || '').trim() || `${productName} preparado fresco.`;
      const selectedMods = (card.suggestedModifiers || [])
        .filter((m) => m.selected !== false)
        .map((m) => m.name);

      if (productName && price > 0) {
        if (card.productMode === 'recipe') {
          setSelectedProduct({ name: productName, price, category_name: categoryName });
          setCatalogDraft((prev) => ({ ...prev, product_name: productName, price, category_name: categoryName, description }));
          setWorkflow('create_costed_product');
          return;
        }

        approveCatalog({
          category_name: categoryName,
          modifier_group_names: selectedMods,
          products: [{
            name: productName,
            description,
            price,
            tags: draft.tags || [],
            requires_kitchen: draft.requires_kitchen !== false,
            modifier_group_names: selectedMods,
          }],
        });
        return;
      }

      setWorkflow('create_catalog');
    } else if (card.action === 'create_costed_product') {
      setWorkflow('create_costed_product');
    } else if (card.action === 'create_location') {
      setWorkflow('create_location');
    } else if (card.action === 'edit_product_price' && card.product) {
      setSelectedProduct(card.product);
      setWorkflow('edit_product_price');
    } else if (['update_business_hours', 'create_payment_method', 'update_printing_settings', 'create_modifier_group'].includes(card.action)) {
      setWorkflow(card.action);
    } else if (['update_delivery_settings', 'update_support_whatsapp', 'update_service_fee'].includes(card.action)) {
      approveOperations(card.action, card.operationsDraft || card.draft || {});
    } else if (['update_branding', 'update_branding_urls', 'update_web_content'].includes(card.action)) {
      approveBrandWeb(card.action, card.webDraft || card.draft || {});
    } else if (['batch_stock_entry', 'generate_shopping_list'].includes(card.action)) {
      approveInventory(card.action, card.inventoryDraft || card.draft || {});
    } else if (card.action === 'create_table_batch') {
      approveVenue(card.action, card.tableDraft || card.draft || {});
    }
  };

  const handleDismissCard = (index) => {
    setMessages((current) => current.map((m, i) => i === index ? { ...m, card: null } : m));
  };

  const handleCardFieldChange = (messageIndex, fieldKey, value) => {
    setMessages((current) => current.map((m, idx) => {
      if (idx !== messageIndex || !m.card) return m;
      const updatedCard = { ...m.card };
      const updatedDraft = { ...(updatedCard.draft || {}), [fieldKey]: value };
      updatedCard.draft = updatedDraft;

      updatedCard.beforeAfter = (updatedCard.beforeAfter || []).map((item) => {
        if (item.key === fieldKey) {
          return { ...item, after: value, value };
        }
        return item;
      });

      const hasName = Boolean(String(updatedDraft.product_name || '').trim());
      const hasPrice = Number(updatedDraft.price) > 0;
      updatedCard.isDraft = !hasName || !hasPrice;

      return { ...m, card: updatedCard };
    }));

    setCatalogDraft((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleCardProductModeChange = (messageIndex, mode) => {
    setMessages((current) => current.map((m, idx) => {
      if (idx !== messageIndex || !m.card) return m;
      return { ...m, card: { ...m.card, productMode: mode } };
    }));
  };

  const handleCardToggleModifier = (messageIndex, modifierName) => {
    setMessages((current) => current.map((m, idx) => {
      if (idx !== messageIndex || !m.card) return m;
      const updatedMods = (m.card.suggestedModifiers || []).map((mod) => {
        if (mod.name === modifierName) {
          return { ...mod, selected: !mod.selected };
        }
        return mod;
      });
      return { ...m, card: { ...m.card, suggestedModifiers: updatedMods } };
    }));
  };

  const handleCardSendToChat = (card) => {
    const draft = card.draft || {};
    const name = draft.product_name ? `"${draft.product_name}"` : 'el producto';
    const price = draft.price ? ` a $${Number(draft.price).toLocaleString('es-CO')}` : '';
    const cat = draft.category_name ? ` en la categoría ${draft.category_name}` : '';
    const mode = card.productMode === 'recipe' ? 'con receta e inventario' : 'simple sin receta';
    const text = `Quiero crear ${name}${price}${cat}, como producto ${mode}.`;
    sendMessage(text);
  };

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

      // ─── Detect Camino Card representation ───
      let card = null;
      const lowerUser = userMessage.toLowerCase();
      const isPlanQuery = /cu[aá]l.*plan|cu[aá]ntos?.*token|cu[aá]ntas?.*consulta|mi.*plan|l[ií]mite.*ia|cuota/i.test(lowerUser);

      if (isPlanQuery) {
        const planId = brand?.plan_id || 'plan_esencial';
        const planName = brand?.plans?.name || (planId.includes('premium') ? 'Premium' : planId.includes('profesional') ? 'Profesional' : planId.includes('esencial') ? 'Esencial' : 'Emprendedor');
        const allowedCaminos = planId.includes('premium') || planId.includes('profesional') ? [1, 2, 3] : planId.includes('esencial') ? [1, 2] : [1];
        const monthlyLimit = planId.includes('premium') ? 1000 : planId.includes('profesional') ? 300 : planId.includes('esencial') ? 100 : 30;
        card = {
          type: 'plan_info',
          planName,
          usage: brand?.ai_generations_used || 0,
          monthlyLimit,
          caminos: allowedCaminos,
        };
      } else if (response.intent === 'update_delivery_settings') {
        const opDraft = response.operations_draft || {};
        const beforeFee = response.current_delivery_fee !== null ? `$ ${Number(response.current_delivery_fee).toLocaleString('es-CO')}` : 'Sin costo';
        const afterFee = opDraft.delivery_fee !== undefined ? `$ ${Number(opDraft.delivery_fee).toLocaleString('es-CO')}` : beforeFee;
        const beforeRad = response.current_delivery_radius ? `${response.current_delivery_radius} km` : 'Radio estándar';
        const afterRad = opDraft.delivery_radius_km ? `${opDraft.delivery_radius_km} km` : beforeRad;

        card = {
          type: 'proposal',
          title: 'Tarifas y cobertura de domicilios',
          summary: assistantReply,
          beforeAfter: [
            { label: 'Costo base domicilio', before: beforeFee, after: afterFee },
            { label: 'Radio de cobertura', before: beforeRad, after: afterRad },
          ],
          riskLevel: 'medium',
          action: 'update_delivery_settings',
          operationsDraft: opDraft,
        };
      } else if (response.intent === 'update_support_whatsapp') {
        const opDraft = response.operations_draft || {};
        const beforeWa = response.current_whatsapp || 'No configurado';
        const afterWa = opDraft.whatsapp_number_orders || opDraft.support_phone || 'Por definir';

        card = {
          type: 'proposal',
          title: 'Canal de WhatsApp para pedidos',
          summary: assistantReply,
          beforeAfter: [
            { label: 'Línea de WhatsApp', before: beforeWa, after: afterWa },
          ],
          riskLevel: 'low',
          action: 'update_support_whatsapp',
          operationsDraft: opDraft,
        };
      } else if (response.intent === 'update_service_fee') {
        const opDraft = response.operations_draft || {};
        const beforeFee = response.current_service_fee !== null ? `${response.current_service_fee}%` : 'Desactivado';
        const afterFee = opDraft.service_fee_percentage !== undefined ? `${opDraft.service_fee_percentage}% (${opDraft.is_service_fee_enabled !== false ? 'Activo' : 'Inactivo'})` : beforeFee;

        card = {
          type: 'proposal',
          title: 'Propina y servicio sugerido',
          summary: assistantReply,
          beforeAfter: [
            { label: 'Servicio sugerido', before: beforeFee, after: afterFee },
          ],
          riskLevel: 'medium',
          action: 'update_service_fee',
          operationsDraft: opDraft,
        };
      } else if (response.intent === 'update_branding') {
        const webDraft = response.web_draft || {};
        const beforeColor = response.current_primary_color || '#7db87a';
        const afterColor = webDraft.primary_color || beforeColor;

        card = {
          type: 'proposal',
          title: 'Color e identidad de marca',
          summary: assistantReply,
          beforeAfter: [
            { label: 'Color principal', before: beforeColor, after: afterColor },
          ],
          riskLevel: 'low',
          action: 'update_branding',
          webDraft,
        };
      } else if (response.intent === 'update_web_content') {
        const webDraft = response.web_draft || {};
        const beforeAfter = [];
        if (webDraft.hero_h1) beforeAfter.push({ label: 'Título portada', before: 'Actual', after: webDraft.hero_h1 });
        if (webDraft.hero_subtitle) beforeAfter.push({ label: 'Subtítulo portada', before: 'Actual', after: webDraft.hero_subtitle });
        if (webDraft.menu_banner_title) beforeAfter.push({ label: 'Banner menú', before: 'Actual', after: webDraft.menu_banner_title });

        card = {
          type: 'proposal',
          title: 'Contenido de la página web',
          summary: assistantReply,
          beforeAfter: beforeAfter.length ? beforeAfter : [{ label: 'Textos web', before: 'Actual', after: 'Nuevos textos sugeridos' }],
          riskLevel: 'low',
          action: 'update_web_content',
          webDraft,
        };
      } else if (response.intent === 'batch_stock_entry') {
        const invDraft = response.inventory_draft || {};
        const entries = Array.isArray(invDraft.entries) ? invDraft.entries : [];
        const beforeAfter = entries.map((e) => ({
          label: e.ingredient_name || 'Insumo',
          before: 'Stock actual',
          after: `+${e.quantity_added} ingresadas`
        }));

        card = {
          type: 'proposal',
          title: 'Registrar entrada de insumos al inventario',
          summary: assistantReply,
          beforeAfter: beforeAfter.length ? beforeAfter : [{ label: 'Insumos', before: 'Actual', after: 'Ingreso al inventario' }],
          riskLevel: 'medium',
          action: 'batch_stock_entry',
          inventoryDraft: invDraft,
        };
      } else if (response.intent === 'generate_shopping_list') {
        card = {
          type: 'proposal',
          title: 'Lista de compras inteligente (Mercado)',
          summary: assistantReply,
          beforeAfter: [
            { label: 'Estado', before: 'Monitoreo de stock', after: 'Calcular faltantes y generar lista consolidada' }
          ],
          riskLevel: 'low',
          action: 'generate_shopping_list',
          inventoryDraft: {},
        };
      } else if (response.intent === 'create_table_batch') {
        const tblDraft = response.table_draft || {};
        const count = tblDraft.count || (tblDraft.end_number && tblDraft.start_number ? (tblDraft.end_number - tblDraft.start_number + 1) : 5);
        const prefix = tblDraft.prefix !== undefined ? tblDraft.prefix : 'Mesa ';
        const start = tblDraft.start_number || 1;
        const end = tblDraft.end_number || (start + count - 1);
        const areaName = tblDraft.area_name ? ` (Área: ${tblDraft.area_name})` : '';

        card = {
          type: 'proposal',
          title: `Crear lote de ${count} mesas y códigos QR${areaName}`,
          summary: assistantReply,
          beforeAfter: [
            { label: 'Mesas a crear', before: 'Sin crear', after: `${count} mesas (${prefix}${start} a ${prefix}${end})` },
            { label: 'Área / Salón', before: '—', after: tblDraft.area_name || 'Salón Principal / General' },
            { label: 'Códigos QR', before: 'Inexistentes', after: 'Generación automática con URLs' },
          ],
          riskLevel: 'low',
          action: 'create_table_batch',
          tableDraft: tblDraft,
        };
      } else if (response.proposal_ready || ['create_catalog', 'create_costed_product', 'create_location', 'update_business_hours', 'create_payment_method', 'create_modifier_group'].includes(response.intent)) {
        // Camino 2: Propuesta Agéntica
        const isProduct = response.intent === 'create_catalog' || response.intent === 'create_costed_product';
        const draft = response.catalog_draft || {};
        const isDraft = isProduct && (!draft.product_name || !draft.price || Number(draft.price) <= 0);

        const rawSuggestedMods = Array.isArray(draft.suggested_modifiers) && draft.suggested_modifiers.length > 0
          ? draft.suggested_modifiers
          : (draft.category_name?.toLowerCase().includes('bebida') || userMessage.toLowerCase().includes('bebida')
              ? ['Hielo', 'Endulzante']
              : ['Adiciones']);

        const suggestedModifiers = rawSuggestedMods.map((modName) => ({
          name: modName,
          selected: true,
          description: modName.toLowerCase().includes('hielo')
            ? 'Normal, Poco hielo, Sin hielo'
            : modName.toLowerCase().includes('endulzante') || modName.toLowerCase().includes('azucar')
              ? 'Normal, Sin azúcar, Stevia'
              : 'Opciones estándar',
        }));

        const beforeAfter = isProduct ? [
          {
            key: 'product_name',
            label: 'Producto',
            fieldLabel: 'Nombre del producto o plato *',
            helper: 'El nombre comercial y atractivo que verán los comensales en la carta digital.',
            before: 'No existía',
            after: draft.product_name || '',
            value: draft.product_name || '',
            editable: true,
            placeholder: 'Ej: Limonada de Coco 16oz',
            type: 'text',
          },
          {
            key: 'price',
            label: 'Precio',
            fieldLabel: 'Precio de venta al público (COP) *',
            helper: 'Valor final al comensal en pesos colombianos con impuestos incluidos.',
            before: '—',
            after: draft.price ? Number(draft.price) : '',
            value: draft.price ? Number(draft.price) : '',
            editable: true,
            placeholder: 'Ej: 14000',
            type: 'number',
          },
          {
            key: 'category_name',
            label: 'Categoría',
            fieldLabel: 'Categoría en el menú *',
            helper: 'Sección donde se exhibirá este producto en el menú digital.',
            before: '—',
            after: draft.category_name || (userMessage.toLowerCase().includes('bebida') ? 'Bebidas' : 'General'),
            value: draft.category_name || (userMessage.toLowerCase().includes('bebida') ? 'Bebidas' : 'General'),
            editable: true,
            placeholder: 'Ej: Bebidas Frías',
            type: 'text',
          },
          {
            key: 'description',
            label: 'Descripción',
            fieldLabel: 'Descripción para el menú QR (opcional)',
            helper: 'Frase llamativa que resalte los ingredientes y despierte el apetito del comensal.',
            before: '—',
            after: draft.description || '',
            value: draft.description || '',
            editable: true,
            placeholder: 'Ej: Refrescante bebida preparada con frutas frescas y hielo frappé...',
            type: 'text',
          },
        ] : [];

        card = {
          type: 'proposal',
          isDraft,
          draftType: isProduct ? 'catalog' : 'general',
          productMode: 'simple',
          suggestedModifiers: isProduct ? suggestedModifiers : [],
          title: isProduct 
            ? (draft.product_name ? `Crear producto: ${draft.product_name}` : `Crear nuevo producto en ${draft.category_name || 'Bebidas'}`) 
            : `Modificación de ${response.intent}`,
          summary: isDraft ? 'Completa los campos en el cuadro o respóndele a Aluna para aprobar.' : assistantReply,
          beforeAfter,
          riskLevel: isProduct ? 'medium' : 'low',
          action: response.intent,
          draft,
        };
      } else if (response.matched_product && /precio|costo|editar/i.test(userMessage)) {
        // Camino 2: Propuesta de Precio
        card = {
          type: 'proposal',
          title: `Actualizar precio de ${response.matched_product.name}`,
          summary: 'Aluna preparó la actualización de precio para este producto.',
          beforeAfter: [
            { label: 'Precio actual', before: `$ ${Number(response.matched_product.price || 0).toLocaleString('es-CO')}`, after: 'Nuevo precio' }
          ],
          riskLevel: 'low',
          action: 'edit_product_price',
          product: response.matched_product,
        };
      } else if (/d[oó]nde|ir a|c[oó]mo llego|atajo|acceso|abr[ir|e]|mu[eé]strame/i.test(lowerUser)) {
        // Camino 3: Deep Link / Atajo Asistido
        const target = detectTargetPage(userMessage + ' ' + assistantReply);
        if (target) {
          card = {
            type: 'deep_link',
            title: `Acceso rápido a ${target}`,
            description: `Haz clic para ir directamente a esta sección del administrador sin navegar por los menús.`,
            targetPage: target,
            prefillData: response.catalog_draft && Object.keys(response.catalog_draft).length > 0 ? response.catalog_draft : null,
          };
        }
      } else {
        // Camino 1: Guía Manual (si hay pasos en el texto o si la pregunta es instructiva)
        const steps = parseStepsFromText(assistantReply);
        const target = detectTargetPage(userMessage + ' ' + assistantReply);
        if (steps.length >= 2 || /c[oó]mo|paso|qu[eé] hago/i.test(lowerUser)) {
          card = {
            type: 'guidance',
            title: `Guía paso a paso`,
            steps: steps.length >= 2 ? steps : [assistantReply],
            tip: extractTipFromText(assistantReply),
            targetPage: target,
          };
        }
      }

      setMessages((current) => [...current, { role: 'assistant', content: assistantReply, card }]);
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
      if (response.intent === 'audit') setAudit(await runOpeningAudit({ brandId, locationId }));
      if (typeof response.current_usage === 'number') setAiUsage(response.current_usage);
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
        update_delivery_settings: 'actualizó las tarifas y cobertura de domicilios',
        update_support_whatsapp: 'actualizó el número de WhatsApp y soporte',
        update_service_fee: 'actualizó el porcentaje de propina y servicio sugerido',
      };
      setSuccess(`Aluna ${labels[action] || 'aplicó el cambio operativo'} correctamente.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) { setError(actionError.message || 'No pude aplicar el cambio operativo.'); }
    finally { setIsLoading(false); }
  };

  const approveBrandWeb = async (action, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaBrandWebAction({ brandId, action, proposal });
      const labels = {
        update_branding_urls: 'actualizó la identidad y color de la marca',
        update_branding: 'actualizó la identidad y color de la marca',
        update_web_content: 'actualizó los textos de la página web',
        update_business_profile: 'actualizó los datos del perfil comercial',
      };
      setSuccess(`Aluna ${labels[action] || 'aplicó el cambio de diseño'} correctamente.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) { setError(actionError.message || 'No pude aplicar el cambio de diseño o web.'); }
    finally { setIsLoading(false); }
  };

  const approveInventory = async (action, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaInventoryAction({ brandId, locationId, action, proposal });
      if (action === 'generate_shopping_list') {
        const text = result.formatted_text || 'Lista de mercado generada.';
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        setSuccess(`Aluna generó la lista de mercado (${result.items_count || 0} insumos). ¡Copiada al portapapeles!`);
        setMessages((current) => [...current, {
          role: 'assistant',
          content: text,
        }]);
      } else {
        const count = result.updated_ingredients?.length || 0;
        setSuccess(`Aluna registró la entrada de ${count} insumo(s) al inventario correctamente.`);
      }
      setWorkflow(null);
    } catch (actionError) {
      setError(actionError.message || 'No pude procesar la acción de inventario.');
    } finally {
      setIsLoading(false);
    }
  };

  const approveVenue = async (action, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaVenueAction({ brandId, locationId, action, proposal });
      const count = result.created_count || result.tables?.length || 0;
      setSuccess(`Aluna creó ${count} mesa(s) exitosamente${result.area_name ? ` en ${result.area_name}` : ''}. Códigos QR listos.`);
      setWorkflow(null);
    } catch (actionError) {
      setError(actionError.message || 'No pude procesar la acción de mesas.');
    } finally {
      setIsLoading(false);
    }
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
      <button type="button" onClick={() => setIsOpen(true)} className="group fixed bottom-24 right-3 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-gradient-to-br from-[#173D24] to-[#0A1F12] text-white shadow-[0_10px_28px_rgba(23,61,36,0.45)] transition hover:-translate-y-0.5 hover:scale-105 hover:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-200 md:bottom-5 md:right-5 md:h-14 md:w-14" aria-label="Abrir Lumi, copiloto operativo" aria-haspopup="dialog">
        <LumiEmblem size={24} className="text-emerald-300 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
        <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-1.5 text-xs font-bold text-white shadow-lg group-hover:block group-focus-visible:block">Lumi · Copiloto Aluna</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} aria-label="Cerrar Lumi" />
          <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="absolute inset-y-0 right-0 flex w-full flex-col bg-[#F7F8F5] shadow-2xl sm:max-w-[640px] xl:max-w-[760px]">
            <header className="border-b border-gray-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#173D24] to-[#0D2616] text-white shadow-md shadow-emerald-950/20">
                    <LumiEmblem size={24} className="text-emerald-300" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 id={titleId} className="font-bold text-gray-950 text-base">Lumi</h2>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Copiloto Aluna</span>
                    </div>
                    <p className="text-xs text-gray-500">Tu asistente de apertura y operaciones</p>
                  </div>
                </div>
                <div className="flex items-center gap-1"><button type="button" onClick={openChanges} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Ver historial de cambios"><History size={19} aria-hidden="true" /></button><button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Cerrar panel"><X size={20} aria-hidden="true" /></button></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800"><ShieldCheck size={13} aria-hidden="true" /> {brandName}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600"><MapPin size={13} aria-hidden="true" /> {locationName}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 font-semibold text-violet-800 border border-violet-100/80">
                  <Sparkles size={12} className="text-violet-600" aria-hidden="true" />
                  <span>Plan {planQuota.label}: {Math.max(planQuota.monthly_limit - aiUsage, 0)} consultas disp.</span>
                </span>
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
                    <p className="text-sm font-bold text-gray-900">Hola, soy Lumi. Estoy trabajando sobre {brandName}.</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">Puedo auditar tu catálogo, recetas, horarios, medios de pago e impresión para decirte exactamente qué falta antes de operar.</p>
                  </div>
                  <button type="button" onClick={executeAudit} disabled={isLoading} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md disabled:cursor-wait disabled:opacity-70">
                    <span className="flex items-center gap-3">
                      <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">{isLoading ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : <Sparkles size={19} aria-hidden="true" />}</span>
                      <span><span className="block text-sm font-bold text-gray-900">Auditar apertura con Lumi</span><span className="mt-0.5 block text-xs text-gray-500">Diagnóstico real, sin modificar datos</span></span>
                    </span>
                    <ChevronRight size={18} className="text-gray-400" aria-hidden="true" />
                  </button>
                </div>
              ) : <AuditResult audit={audit} onResolve={resolveFinding} />}

              {workflow == null && messages.length > 0 ? (
                <div className="mt-5 space-y-3" aria-live="polite">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className="space-y-2">
                      <div className={`max-w-[94%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[86%] ${message.role === 'user' ? 'ml-auto bg-[#173D24] text-white' : 'border border-emerald-100 bg-white text-gray-700'}`}>
                        {message.content}
                      </div>

                      {message.card?.type === 'guidance' && (
                        <div className="w-full">
                          <GuidanceCard
                            title={message.card.title}
                            steps={message.card.steps}
                            tip={message.card.tip}
                            targetPage={message.card.targetPage}
                            onNavigate={handleDeepNavigate}
                          />
                        </div>
                      )}

                      {message.card?.type === 'deep_link' && (
                        <div className="w-full">
                          <DeepLinkCard
                            title={message.card.title}
                            description={message.card.description}
                            targetPage={message.card.targetPage}
                            pageLabel={message.card.pageLabel}
                            prefillData={message.card.prefillData}
                            onNavigate={handleDeepNavigate}
                            onPrefill={handleDeepPrefill}
                          />
                        </div>
                      )}

                      {message.card?.type === 'proposal' && (
                        <div className="w-full">
                          <AgenticProposalCard
                            title={message.card.title}
                            summary={message.card.summary}
                            beforeAfter={message.card.beforeAfter}
                            riskLevel={message.card.riskLevel}
                            isExecuting={isLoading}
                            isDraft={message.card.isDraft}
                            productMode={message.card.productMode}
                            onChangeProductMode={(mode) => handleCardProductModeChange(index, mode)}
                            suggestedModifiers={message.card.suggestedModifiers}
                            onToggleModifier={(modName) => handleCardToggleModifier(index, modName)}
                            onFieldChange={(fieldKey, value) => handleCardFieldChange(index, fieldKey, value)}
                            canApprove={!message.card.isDraft || Boolean(message.card.draft?.product_name && Number(message.card.draft?.price) > 0)}
                            onApprove={() => handleApproveProposalCard(message.card)}
                            onCancel={() => handleDismissCard(index)}
                            onSendToChat={() => handleCardSendToChat(message.card)}
                            details={message.card.details}
                          />
                        </div>
                      )}

                      {message.card?.type === 'plan_info' && (
                        <div className="w-full">
                          <PlanInfoCard
                            planName={message.card.planName}
                            usage={message.card.usage}
                            monthlyLimit={message.card.monthlyLimit}
                            caminos={message.card.caminos}
                          />
                        </div>
                      )}
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
                <textarea ref={promptRef} id={`${titleId}-prompt`} value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={handlePromptKeyDown} placeholder="Pídele algo a Aluna (ej: Crea el plato Limonada de Coco a $14.000, o ajusta el costo de domicilio a $6.000)…" rows={1} className="max-h-48 min-h-12 min-w-0 flex-1 resize-none overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
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
