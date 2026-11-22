import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, History, Loader2, MapPin, Maximize2, Minimize2, Pencil, Send, ShieldCheck, Sparkles, UtensilsCrossed, X, XCircle } from 'lucide-react';
import { chatWithAluna, executeAlunaAction, executeAlunaCatalogManagementAction, executeAlunaKitchenAction, executeAlunaOperationsAction, executeAlunaBrandWebAction, executeAlunaInventoryAction, executeAlunaVenueAction, listAlunaChanges, runOpeningAudit } from '../../services/alunaCopilot';
import CostedProductWorkflow from './aluna/CostedProductWorkflow';
import OperationsWorkflow from './aluna/OperationsWorkflow';
import ChangeHistory from './aluna/ChangeHistory';
import { GuidanceCard, AgenticProposalCard, DeepLinkCard, PlanInfoCard } from './aluna/CaminoCards';
import { getPlanQuota } from '../../config/quotas';
import { PLAN_IDS } from '../../config/plans';
import { loadAlunaPurchaseContext, executeAlunaPurchase } from '../../services/alunaCopilot';
import { isPurchaseConversation, beginPurchaseTurn, purchaseConversationReply } from '../../utils/alunaPurchase';
import { executeAlunaPriceUpdate } from '../../services/alunaCopilot';
import { getRequestedPrice, buildPriceUpdateProposal } from '../../utils/alunaPriceUpdate';
import { listAlunaConversationProducts } from '../../services/alunaCopilot';
import { loadAlunaHoursContext, executeAlunaHoursUpdate } from '../../services/alunaCopilot';
import { isHoursConversation, beginHoursTurn, hoursConversationReply } from '../../utils/alunaHours';
import { loadAlunaVisibilityContext, executeAlunaVisibilityUpdate } from '../../services/alunaCopilot';
import { isVisibilityConversation, visibilityIntent, beginVisibilityTurn, visibilityConversationReply } from '../../utils/alunaVisibility';
import { beginConversationTurn, conversationDraft, recipeConversationReply, validateConversationResponse, invalidateConversationProposals, canApproveConversationCard } from '../../utils/alunaConversation';
import { extractCatalogRequest, continueCatalogRequest, syncCatalogDraft, catalogFormProducts, catalogDraftReply, catalogPrice } from '../../utils/alunaCatalogDraft';
import { createProposalLifecycle } from '../../utils/alunaProposalLifecycle';

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
  if (/[{}]|```|\b[a-z]+_[a-z_]+\b|\b(?:TypeError|ReferenceError|FunctionsHttpError|unsupported fields|stack trace)\b/i.test(text)) return 'No pude preparar una respuesta clara. Dime qué necesitas hacer con tu producto; no he guardado cambios.';
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
        <button type="button" disabled={!recipesEnabled || Boolean(product.recipe_id)} onClick={onCreateRecipe} className="flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-300"><UtensilsCrossed size={14} /> {product.recipe_id ? 'Receta vinculada' : 'Preparar receta'}</button>
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
  const [products, setProducts] = useState(() => catalogFormProducts(initialDraft || {}));
  const updateProduct = (index, field, value) => setProducts((current) => current.map((product, productIndex) => productIndex === index ? { ...product, [field]: value } : product));
  const removeProduct = (index) => setProducts((current) => current.filter((_, productIndex) => productIndex !== index));
  const normalizedProducts = products.map((product) => ({
    ...product,
    price: Number(product.price),
    tags: product.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
  }));
  const canContinue = categoryName.trim() && normalizedProducts.length > 0 && normalizedProducts.length <= 10 && normalizedProducts.every((product) => product.name.trim() && product.description.trim() && catalogPrice(product.price) !== '');

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
        {initialDraft?.products ? <p className="mt-2 text-sm text-gray-600">{catalogDraftReply({ category_name: categoryName, products })}</p> : null}
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
  const [workflow, setWorkflowState] = useState(null);
  const [success, setSuccess] = useState('');
  const [messages, setMessages] = useState([]);
  const [suggestedIntent, setSuggestedIntent] = useState(null);
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const [catalogDraft, setCatalogDraft] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [changes, setChanges] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [aiUsage, setAiUsage] = useState(brand?.ai_generations_used || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const promptRef = useRef(null);
  const priceExecutionRef = useRef(false);
  const hoursExecutionRef = useRef(false);
  const visibilityExecutionRef = useRef(false);
  const purchaseExecutionRef = useRef(false);
  const conversationRef = useRef(null);
  const activeTurnRef = useRef(null);
  const lifecycle = useRef(createProposalLifecycle());
  const [, refreshApprovalAvailability] = useState(0);
  const scopeRef = useRef(null);
  const titleId = useId();
  const brandId = brand?.id;
  const brandName = brand?.name || 'tu negocio';
  const locationName = location?.name || (locationId ? 'Sede seleccionada' : 'Todas las sedes');
  const planSlug = brand?.plans?.slug || Object.keys(PLAN_IDS).find((slug) => PLAN_IDS[slug] === brand?.plan_id);
  const planQuota = getPlanQuota(planSlug ? `plan_${planSlug}` : brand?.plan_id);
  const currentScope = `${brandId}:${locationId || 'all'}`;
  // Invalidate before effects: a click/response between render and effect is stale too.
  if (scopeRef.current !== currentScope) {
    scopeRef.current = currentScope;
    lifecycle.current.replace();
    activeTurnRef.current = null;
    conversationRef.current = null;
  }
  const renderTicket = lifecycle.current.snapshot();
  const setWorkflow = (next) => {
    if (next && next !== 'change_history') lifecycle.current.replace();
    setWorkflowState(next);
  };
  const currentCard = (card) => canApproveConversationCard(card, activeTurnRef.current, conversationRef.current)
    && lifecycle.current.canApprove(card?.generation);
  const stampCard = (card) => card ? { ...card, generation: lifecycle.current.snapshot(), contextLabel: `${brandName} · ${locationName}` } : card;
  const cancelWorkflow = () => {
    lifecycle.current.replace();
    if (conversationRef.current) conversationRef.current.status = 'dismissed';
    setMessages((current) => invalidateConversationProposals(current, 'dismissed'));
    setSuggestedIntent(null);
    setSuggestedReplies([]);
    setWorkflowState(null);
  };
  const protectApproval = (operation) => (...args) => lifecycle.current.execute(renderTicket, async (isCurrent) => {
    try { await operation(isCurrent, ...args); }
    finally {
      if (isCurrent()) {
        setWorkflowState(null);
        setSuggestedIntent(null);
        setSuggestedReplies([]);
        setMessages((current) => invalidateConversationProposals(current, 'approved'));
        if (conversationRef.current && conversationRef.current.status !== 'executed') conversationRef.current.status = 'unconfirmed';
      }
    }
  }).finally(() => refreshApprovalAvailability((value) => value + 1));

  useEffect(() => {
    setAudit(null);
    setIsLoading(false);
    setError('');
    setPrompt('');
    setWorkflow(null);
    setSuccess('');
    setMessages((current) => invalidateConversationProposals(current));
    setSuggestedIntent(null);
    setSuggestedReplies([]);
    setCatalogDraft({});
    setAvailableCategories([]);
    setChanges([]);
    setSelectedProduct(null);
    conversationRef.current = null;
    activeTurnRef.current = null;
    setAiUsage(brand?.ai_generations_used || 0);
    setIsOpen(false);
  }, [brandId, locationId]);

  useEffect(() => () => { lifecycle.current.replace(); activeTurnRef.current = null; }, []);

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
    if (!currentCard(card) || isLoading) return;
    if (card.action === 'change_product_visibility' && card.visibilityTask) { approveVisibility(card); return; }
    if (card.action === 'register_inventory_purchase' && card.purchaseTask) { approvePurchase(card); return; }
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
      if (card.priceUpdate) {
        approvePrice(card.priceUpdate.price, card.product, card.priceUpdate.idempotencyKey);
      } else {
        setSelectedProduct(card.product);
        setWorkflow('edit_product_price');
      }
    } else if (card.action === 'update_business_hours' && card.hoursTask) {
      approveHours(card);
    } else if (['create_payment_method', 'update_printing_settings', 'create_modifier_group'].includes(card.action)) {
      setWorkflow(card.action);
    } else if (['update_delivery_settings', 'update_support_whatsapp', 'update_service_fee'].includes(card.action)) {
      approveOperations(card.action, card.operationsDraft || card.draft || {});
    } else if (['update_branding', 'update_branding_urls', 'update_web_content'].includes(card.action)) {
      approveBrandWeb(card.action, card.webDraft || card.draft || {});
    } else if (card.action === 'generate_shopping_list') {
      approveInventory(card.action, card.inventoryDraft || card.draft || {});
    } else if (card.action === 'create_table_batch') {
      approveVenue(card.action, card.tableDraft || card.draft || {});
    }
  };

  const handleDismissCard = (index) => {
    if (messages[index]?.card?.turnId === conversationRef.current?.turnId) {
      conversationRef.current.status = 'dismissed';
      lifecycle.current.replace();
    }
    setMessages((current) => current.map((m, i) => i === index ? { ...m, card: { ...m.card, obsolete: true, obsoleteReason: 'dismissed' } } : m));
  };

  const handleCardFieldChange = (messageIndex, fieldKey, value) => {
    if (!currentCard(messages[messageIndex]?.card)) return;
    setMessages((current) => current.map((m, idx) => {
      if (idx !== messageIndex || !currentCard(m.card)) return m;
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
      if (conversationRef.current?.turnId === updatedCard.turnId) conversationRef.current.card = updatedCard;

      return { ...m, card: updatedCard };
    }));

    setCatalogDraft((prev) => ({ ...prev, [fieldKey]: value }));
    if (conversationRef.current) conversationRef.current.draft = { ...conversationRef.current.draft, [fieldKey]: value };
  };

  const handleCardProductModeChange = (messageIndex, mode) => {
    if (!currentCard(messages[messageIndex]?.card)) return;
    setMessages((current) => current.map((m, idx) => {
      if (idx !== messageIndex || !m.card) return m;
      return { ...m, card: { ...m.card, productMode: mode } };
    }));
  };

  const handleCardToggleModifier = (messageIndex, modifierName) => {
    if (!currentCard(messages[messageIndex]?.card)) return;
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
    if (!currentCard(card)) return;
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
    const turnId = crypto.randomUUID();
    const scope = `${brandId}:${locationId || 'all'}`;
    activeTurnRef.current = turnId;
    lifecycle.current.replace();
    const requestTicket = lifecycle.current.snapshot();
    setWorkflow(null);
    setSuggestedIntent(null);
    setCatalogDraft({});
    setSelectedProduct(null);
    setMessages((current) => [...invalidateConversationProposals(current), { role: 'user', content: userMessage }]);
    setIsLoading(true);
    let task;
    try {
      if (isPurchaseConversation(userMessage, conversationRef.current)) {
        const previous = conversationRef.current;
        task = beginPurchaseTurn({ message: userMessage, previous, capability: { allowed: false, label: 'por confirmar', reason: 'unknown' }, executorReady: false, scope, turnId });
        conversationRef.current = task;
        const context = await loadAlunaPurchaseContext(brandId);
        if (activeTurnRef.current !== turnId || !lifecycle.current.isCurrent(requestTicket)) return;
        task = beginPurchaseTurn({ message: userMessage, previous, ...context, selectedLocationId: locationId, scope, turnId });
        conversationRef.current = task;
        const local = purchaseConversationReply(task);
        local.card = stampCard(local.card);
        task.card = local.card;
        setMessages((current) => [...current, { role: 'assistant', content: local.reply, card: local.card }]);
        return;
      }
      if (isVisibilityConversation(userMessage, conversationRef.current)) {
        const previous = conversationRef.current;
        const request = previous?.loadFailed && /recuper|retom/i.test(userMessage) ? previous.sourceMessage : userMessage;
        task = { scope, turnId, operation: 'visibility', product: null, sourceMessage: request, target: visibilityIntent(request), loadFailed: true };
        conversationRef.current = task;
        const context = await loadAlunaVisibilityContext(brandId);
        if (activeTurnRef.current !== turnId || !lifecycle.current.isCurrent(requestTicket)) return;
        task = beginVisibilityTurn({ message: request, previous, ...context, selectedLocationId: locationId, scope, turnId });
        conversationRef.current = task;
        const local = visibilityConversationReply(task);
        local.card = stampCard(local.card);
        task.card = local.card;
        setMessages((current) => [...current, { role: 'assistant', content: local.reply, card: local.card }]);
        return;
      }
      if (isHoursConversation(userMessage, conversationRef.current)) {
        const previous = conversationRef.current;
        task = beginHoursTurn({ message: userMessage, previous, locations: [], selectedLocationId: locationId, scope, turnId });
        conversationRef.current = task;
        const context = await loadAlunaHoursContext(brandId);
        if (activeTurnRef.current !== turnId || !lifecycle.current.isCurrent(requestTicket)) return;
        task = beginHoursTurn({ message: userMessage, previous, locations: context.locations, selectedLocationId: locationId, scope, turnId });
        conversationRef.current = task;
        const local = hoursConversationReply(task, context.hours);
        local.card = stampCard(local.card);
        task.card = local.card;
        setMessages((current) => [...current, { role: 'assistant', content: local.reply, card: local.card }]);
        setSuggestedReplies(task.reviewOffered ? ['Sí, muéstrame la propuesta'] : []);
        return;
      }
      const priorCreation = conversationRef.current?.scope === scope && conversationRef.current.operation === 'create' && conversationRef.current.status !== 'executed' ? conversationRef.current.draft : null;
      const creation = extractCatalogRequest(userMessage) || continueCatalogRequest(userMessage, priorCreation);
      if (creation) {
        task = { scope, turnId, operation: 'create', draft: creation, sourceMessage: userMessage };
        conversationRef.current = task;
        setCatalogDraft(creation);
        setMessages((current) => [...current, { role: 'assistant', content: catalogDraftReply(creation) }]);
        setSuggestedIntent('create_catalog');
        setWorkflow('create_catalog');
        return;
      }
      const products = await listAlunaConversationProducts(brandId);
      if (activeTurnRef.current !== turnId || !lifecycle.current.isCurrent(requestTicket)) return;
      task = beginConversationTurn({ message: userMessage, previous: conversationRef.current, products, scope, turnId });
      conversationRef.current = task; // Retain the user request even if the provider fails.
      const applyLocalReply = (local) => {
        setMessages((current) => [...current, { role: 'assistant', content: local.reply, card: local.card }]);
        setCatalogDraft(conversationDraft(task));
        setSelectedProduct(task.product || null);
        setSuggestedReplies(task.operation === 'recipe' ? ['Retomar mi receta'] : []);
      };
      if (task.recovering && task.operation !== 'recipe') {
        const card = !['executed', 'dismissed', 'unconfirmed'].includes(task.status) && task.card ? stampCard({ ...task.card, obsolete: false, turnId }) : null;
        task.card = card;
        setCatalogDraft(conversationDraft(task));
        setSelectedProduct(task.product || null);
        setMessages((current) => [...current, { role: 'assistant', content: card
          ? 'Retomemos esta propuesta. Revisa los datos antes de aprobar; todavía no he guardado este cambio.'
          : task.status === 'executed' ? 'Ese cambio ya se guardó. Dime qué necesitas hacer ahora.' : 'Conservé tu solicitud anterior. Dime qué necesitas retomar; no he guardado cambios.', card }]);
        return;
      }
      if (task.recovering || task.operation === 'clarify' || task.needsProduct) {
        const local = recipeConversationReply(task);
        if (local) { applyLocalReply(local); return; }
        if (task.needsProduct) {
          setMessages((current) => [...current, { role: 'assistant', content: `Encontré más de un producto: ${task.candidates.map((product) => product.name).join(', ')}. ¿Cuál quieres trabajar? No he guardado cambios.` }]);
          return;
        }
      }
      const response = await chatWithAluna({ brandId, locationId, message: userMessage,
        history: [], draft: conversationDraft(task), features: { recipes_enabled: recipesEnabled } });
      if (activeTurnRef.current !== turnId || !lifecycle.current.isCurrent(requestTicket)) return;
      const local = recipeConversationReply(task);
      if (local) { applyLocalReply(local); return; }
      if (!validateConversationResponse(task, response)) {
        setMessages((current) => [...current, { role: 'assistant', content: task.product
          ? `Estamos hablando de ${task.product.name}. No pude preparar un cambio que coincida con lo que pediste. ¿Qué necesitas hacer con este producto? No he guardado cambios.`
          : 'No pude asociar la propuesta con tu solicitud. ¿Qué producto quieres trabajar y qué necesitas hacer? No he guardado cambios.' }]);
        return;
      }
      // Use catalog identity and price, never a model's invented product record.
      if (task.product) response.matched_product = task.product;
      let assistantReply = safeAssistantReply(response.reply);

      // ─── Detect Camino Card representation ───
      let card = null;
      const lowerUser = userMessage.toLowerCase();
      const isPlanQuery = /cu[aá]l.*plan|cu[aá]ntos?.*token|cu[aá]ntas?.*consulta|mi.*plan|l[ií]mite.*ia|cuota/i.test(lowerUser);
      const explicitPriceProposal = buildPriceUpdateProposal(userMessage, response.matched_product, crypto.randomUUID());

      if (isPlanQuery) {
        const planId = planSlug || '';
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
      } else if (explicitPriceProposal) {
        card = explicitPriceProposal;
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
      } else if (response.intent === 'generate_shopping_list') {
        const availability = await loadAlunaPurchaseContext(brandId);
        if (!availability.capability.allowed || !availability.executorReady) {
          assistantReply = availability.capability.allowed ? 'Tu plan incluye inventario, pero la lista de compras no está disponible ahora. No he guardado movimientos.' : `Tu plan ${availability.capability.label} no incluye inventario. Puedes revisar las opciones en «Mi Plan / Upgrade». No cambié tu suscripción.`;
        } else {
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
        }
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
      } else if (response.proposal_ready || ['create_catalog', 'create_costed_product', 'create_location', 'create_payment_method', 'create_modifier_group'].includes(response.intent)) {
        // Camino 2: Propuesta Agéntica
        const isProduct = response.intent === 'create_catalog' || response.intent === 'create_costed_product';
        const draft = isProduct ? syncCatalogDraft(userMessage, response.catalog_draft || {}, task.draft) : response.catalog_draft || {};
        if (isProduct) {
          response.catalog_draft = draft;
          assistantReply = catalogDraftReply(draft);
        }
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
        const requestedPrice = getRequestedPrice(userMessage);
        card = {
          type: 'proposal',
          title: `Actualizar precio de ${response.matched_product.name}`,
          summary: 'Aluna preparó la actualización de precio para este producto.',
          beforeAfter: [
            { label: 'Precio', before: `$ ${Number(response.matched_product.price || 0).toLocaleString('es-CO')}`, after: requestedPrice !== null ? `$ ${requestedPrice.toLocaleString('es-CO')}` : 'Nuevo precio' }
          ],
          riskLevel: 'low',
          action: 'edit_product_price',
          product: response.matched_product,
          priceUpdate: requestedPrice !== null ? { price: requestedPrice, idempotencyKey: crypto.randomUUID() } : null,
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

      if (card?.type === 'proposal') {
        card = stampCard(card);
        card.turnId = turnId;
        card.binding = { scope, operation: task.operation, productId: task.product?.id || null };
      }
      task.card = card;
      setMessages((current) => [...current, { role: 'assistant', content: assistantReply, card }]);
      setSuggestedIntent(explicitPriceProposal ? 'edit_product_price' : response.intent);
      const remoteReplies = Array.isArray(response.suggested_replies)
        ? response.suggested_replies.filter((reply) => typeof reply === 'string' && reply.trim()).map((reply) => reply.trim()).slice(0, 4)
        : [];
      setSuggestedReplies(remoteReplies.length ? remoteReplies : priceReplyFallback(`${userMessage} ${assistantReply}`));
      if (!explicitPriceProposal && ['create_catalog', 'create_costed_product'].includes(response.intent) && response.catalog_draft) {
        const draft = { ...response.catalog_draft, recipe_draft: response.recipe_draft };
        task.draft = draft;
        setCatalogDraft(draft);
      }
      if (response.matched_product) {
        setSelectedProduct(response.matched_product);
        setCatalogDraft((current) => ({ ...current, existing_product: response.matched_product }));
      }
      if (!explicitPriceProposal && task.operation === 'create' && response.intent === 'create_costed_product' && response.recipe_draft?.ingredients?.length > 0) {
        setSuggestedReplies([]);
        setWorkflow('create_costed_product');
      }
      if (response.intent === 'audit') setAudit(await runOpeningAudit({ brandId, locationId }));
      if (typeof response.current_usage === 'number') setAiUsage(response.current_usage);
    } catch (chatError) {
      if (activeTurnRef.current !== turnId || !lifecycle.current.isCurrent(requestTicket)) return;
      const local = task?.operation === 'purchase' ? purchaseConversationReply({ ...task, capability: { allowed: false, label: 'por confirmar', reason: 'unknown' } }) : task && recipeConversationReply(task, { failed: true });
      setMessages((current) => [...current, { role: 'assistant', content: local?.reply || (task?.operation === 'hours' ? 'Conservé los horarios que me indicaste, pero no pude consultar las sedes y sus horarios actuales. No he guardado cambios. Puedes pedirme que retomemos el trabajo.' : 'No pude completar la respuesta. Tu solicitud sigue en esta conversación y no he guardado cambios. Puedes pedirme que retomemos el trabajo.'), card: local?.card || null }]);
      if (task) { setCatalogDraft(conversationDraft(task)); setSelectedProduct(task.product || null); }
      setSuggestedReplies(['Recuperar el trabajo anterior']);
    } finally {
      if (activeTurnRef.current === turnId) setIsLoading(false);
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
      sendMessage(`Quiero preparar la receta de ${selectedProduct.name}`);
      return;
    }
    if (/horario/.test(normalized)) {
      sendMessage(reply);
      return;
    }
    sendMessage(reply);
  };

  const approveLocation = protectApproval(async (isCurrent, proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'create_location', proposal });
      if (!isCurrent()) return;
      if (conversationRef.current) conversationRef.current.status = 'executed';
      setSuccess(`${result.location.name} fue creada correctamente${result.default_hours_created ? ' con sus horarios iniciales' : ''}.`);
      setWorkflow(null);
      const refreshedAudit = await runOpeningAudit({ brandId, locationId });
      if (isCurrent()) setAudit(refreshedAudit);
    } catch (actionError) { if (!isCurrent()) return;
      setError(actionError.message || 'No pude ejecutar el cambio aprobado.');
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  });

  const approveCatalog = protectApproval(async (isCurrent, proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'create_catalog', proposal });
      if (!isCurrent()) return;
      if (conversationRef.current) conversationRef.current.status = 'executed';
      setSuggestedIntent(null);
      setSuggestedReplies([]);
      setCatalogDraft({});
      setMessages((current) => invalidateConversationProposals(current));
      setSuccess(`Aluna ${result.category_reused ? 'usó la categoría existente' : 'creó la categoría'} ${result.category.name}, agregó ${result.products.length} producto(s) y los vinculó a ${result.linked_locations} sede(s).`);
      setWorkflow(null);
      const refreshedAudit = await runOpeningAudit({ brandId, locationId });
      if (isCurrent()) setAudit(refreshedAudit);
    } catch (actionError) { if (!isCurrent()) return;
      setError(actionError.message || 'No pude crear el catálogo aprobado.');
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  });

  const approveConsolidation = protectApproval(async (isCurrent, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'consolidate_categories', proposal });
      if (!isCurrent()) return;
      if (conversationRef.current) conversationRef.current.status = 'executed';
      setSuccess(`Aluna movió ${result.moved_products} producto(s) a ${result.target_category.name} y desactivó ${result.source_category.name}.`);
      setWorkflow(null);
      const refreshedAudit = await runOpeningAudit({ brandId, locationId });
      if (isCurrent()) setAudit(refreshedAudit);
    } catch (actionError) { if (!isCurrent()) return; setError(actionError.message || 'No pude consolidar las categorías.'); }
    finally { if (isCurrent()) setIsLoading(false); }
  });

  const approveCostedProduct = protectApproval(async (isCurrent, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaKitchenAction({ brandId, locationId, proposal });
      if (!isCurrent()) return;
      if (conversationRef.current) conversationRef.current.status = 'executed';
      setSuccess(`Aluna creó ${result.product?.name || 'el producto'} con receta y costo por porción de $ ${Math.round(result.costing?.recipe_cost_per_serving || 0).toLocaleString('es-CO')}.`);
      setWorkflow(null);
      const refreshedAudit = await runOpeningAudit({ brandId, locationId });
      if (isCurrent()) setAudit(refreshedAudit);
    } catch (actionError) { if (!isCurrent()) return; setError(actionError.message || 'No pude crear el producto con receta.'); }
    finally { if (isCurrent()) setIsLoading(false); }
  });

  const approvePrice = protectApproval(async (isCurrent, price, product = selectedProduct, idempotencyKey = crypto.randomUUID()) => {
    if (priceExecutionRef.current) return;
    priceExecutionRef.current = true;
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaPriceUpdate({ brandId, productId: product.id, price, idempotencyKey });
      if (!isCurrent()) return;
      const updated = result.result?.record;
      if (!updated || Number(updated.price) !== price || updated.id !== product.id) throw new Error('No se pudo confirmar el precio guardado.');
      if (conversationRef.current?.card?.priceUpdate?.idempotencyKey === idempotencyKey) conversationRef.current.status = 'executed';
      setSelectedProduct((current) => ({ ...current, ...updated, price }));
      setMessages((current) => current.map((message) => message.card?.priceUpdate?.idempotencyKey === idempotencyKey ? { ...message, card: { ...message.card, obsolete: true } } : message));
      setSuccess(`Aluna actualizó el precio de ${product.name} a $ ${price.toLocaleString('es-CO')}.`);
      setWorkflow(null);
    } catch (actionError) { if (!isCurrent()) return; setError(actionError.message || 'No pude actualizar el precio.'); }
    finally { priceExecutionRef.current = false; if (isCurrent()) setIsLoading(false); }
  });

  const approveVisibility = protectApproval(async (isCurrent, card) => {
    if (visibilityExecutionRef.current || !canApproveConversationCard(card, activeTurnRef.current, conversationRef.current) || card.visibilityTask.idempotencyKey !== conversationRef.current?.idempotencyKey) return;
    visibilityExecutionRef.current = true;
    const approvedTurn = activeTurnRef.current;
    setIsLoading(true); setError('');
    try {
      await executeAlunaVisibilityUpdate(card.visibilityTask, brandId);
      if (!isCurrent()) return;
      if (activeTurnRef.current !== approvedTurn) return;
      conversationRef.current.status = 'executed';
      setSuccess(`${card.visibilityTask.product.name}: ${card.visibilityTask.target ? 'reactivación guardada' : 'ocultamiento guardado'} en ${card.visibilityTask.global ? 'todas las sedes' : card.visibilityTask.location.name}.`);
    } catch { if (!isCurrent()) return;
      if (activeTurnRef.current !== approvedTurn) return;
      conversationRef.current.status = 'unconfirmed';
      setError('No pude confirmar el cambio. Revisa el estado actual y prepara una nueva propuesta antes de volver a aprobar.');
    } finally {
      visibilityExecutionRef.current = false;
      if (isCurrent() && activeTurnRef.current === approvedTurn) {
        if (isCurrent()) setIsLoading(false);
        setMessages((current) => current.map((message) => message.card?.visibilityTask?.idempotencyKey === card.visibilityTask.idempotencyKey ? { ...message, card: { ...message.card, obsolete: true } } : message));
      }
    }
  });

  const approveHours = protectApproval(async (isCurrent, card) => {
    if (hoursExecutionRef.current || !canApproveConversationCard(card, activeTurnRef.current, conversationRef.current) || card.hoursTask.idempotencyKey !== conversationRef.current?.idempotencyKey) return;
    hoursExecutionRef.current = true;
    const approvedTurn = activeTurnRef.current;
    setIsLoading(true); setError('');
    try {
      const task = card.hoursTask;
      const result = await executeAlunaHoursUpdate(task, brandId);
      if (!isCurrent()) return;
      if (activeTurnRef.current !== approvedTurn) return;
      const expected = Object.values(task.entries);
      if (!result.success || !Array.isArray(result.hours) || result.hours.length !== expected.length || expected.some((row) => !result.hours.some((saved) => saved.location_id === task.location.id && saved.day_of_week === row.day_of_week && saved.is_closed === row.is_closed && String(saved.open_time).slice(0, 5) === row.open_time && String(saved.close_time).slice(0, 5) === row.close_time))) throw new Error('No se pudo confirmar el horario guardado.');
      conversationRef.current.status = 'executed';
      setMessages((current) => current.map((message) => message.card?.hoursTask?.idempotencyKey === task.idempotencyKey ? { ...message, card: { ...message.card, obsolete: true } } : message));
      setSuccess(`Horarios guardados para ${task.location.name}. Solo se modificaron los días de la propuesta.`);
    } catch { if (!isCurrent()) return;
      if (activeTurnRef.current !== approvedTurn) return;
      if (conversationRef.current) conversationRef.current.status = 'unconfirmed';
      setMessages((current) => current.map((message) => message.card?.action === 'update_business_hours' ? { ...message, card: { ...message.card, obsolete: true } } : message));
      setError('No pude confirmar el guardado. Revisa los horarios actuales antes de preparar otra propuesta.');
    } finally { hoursExecutionRef.current = false; if (isCurrent() && activeTurnRef.current === approvedTurn) if (isCurrent()) setIsLoading(false); }
  });

  const approveOperations = protectApproval(async (isCurrent, action, proposal) => {
    if (action === 'update_business_hours') return;
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaOperationsAction({ brandId, locationId, action, proposal });
      if (!isCurrent()) return;
      if (conversationRef.current) conversationRef.current.status = 'executed';
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
      const refreshedAudit = await runOpeningAudit({ brandId, locationId });
      if (isCurrent()) setAudit(refreshedAudit);
    } catch (actionError) { if (!isCurrent()) return; setError(actionError.message || 'No pude aplicar el cambio operativo.'); }
    finally { if (isCurrent()) setIsLoading(false); }
  });

  const approveBrandWeb = protectApproval(async (isCurrent, action, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaBrandWebAction({ brandId, action, proposal });
      if (!isCurrent()) return;
      if (conversationRef.current) conversationRef.current.status = 'executed';
      const labels = {
        update_branding_urls: 'actualizó la identidad y color de la marca',
        update_branding: 'actualizó la identidad y color de la marca',
        update_web_content: 'actualizó los textos de la página web',
        update_business_profile: 'actualizó los datos del perfil comercial',
      };
      setSuccess(`Aluna ${labels[action] || 'aplicó el cambio de diseño'} correctamente.`);
      setWorkflow(null);
      const refreshedAudit = await runOpeningAudit({ brandId, locationId });
      if (isCurrent()) setAudit(refreshedAudit);
    } catch (actionError) { if (!isCurrent()) return; setError(actionError.message || 'No pude aplicar el cambio de diseño o web.'); }
    finally { if (isCurrent()) setIsLoading(false); }
  });

  const approvePurchase = protectApproval(async (isCurrent, card) => {
    const task = card.purchaseTask;
    if (purchaseExecutionRef.current || !canApproveConversationCard(card, activeTurnRef.current, conversationRef.current) || task.idempotencyKey !== conversationRef.current?.idempotencyKey || conversationRef.current.status) return;
    purchaseExecutionRef.current = true;
    setIsLoading(true); setError('');
    conversationRef.current.status = 'unconfirmed';
    setMessages((current) => current.map((message) => message.card?.purchaseTask?.idempotencyKey === task.idempotencyKey ? { ...message, card: { ...message.card, obsolete: true } } : message));
    try {
      await executeAlunaPurchase(task, brandId);
      if (!isCurrent()) return;
      if (conversationRef.current?.idempotencyKey === task.idempotencyKey) conversationRef.current.status = 'executed';
      setSuccess(`Compra de ${task.ingredient.name} guardada. El inventario refleja la cantidad y el costo aprobados.`);
    } catch (actionError) { if (!isCurrent()) return;
      setError(actionError.message || 'No pude confirmar la compra. Revisa el inventario antes de iniciar otra.');
    } finally { purchaseExecutionRef.current = false; if (isCurrent()) setIsLoading(false); }
  });

  const approveInventory = protectApproval(async (isCurrent, action, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaInventoryAction({ brandId, locationId, action, proposal });
      if (!isCurrent()) return;
      if (conversationRef.current) conversationRef.current.status = 'executed';
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
    } catch (actionError) { if (!isCurrent()) return;
      setError(actionError.message || 'No pude procesar la acción de inventario.');
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  });

  const approveVenue = protectApproval(async (isCurrent, action, proposal) => {
    setIsLoading(true); setError('');
    try {
      const result = await executeAlunaVenueAction({ brandId, locationId, action, proposal });
      if (!isCurrent()) return;
      if (conversationRef.current) conversationRef.current.status = 'executed';
      const count = result.created_count || result.tables?.length || 0;
      setSuccess(`Aluna creó ${count} mesa(s) exitosamente${result.area_name ? ` en ${result.area_name}` : ''}. Códigos QR listos.`);
      setWorkflow(null);
    } catch (actionError) { if (!isCurrent()) return;
      setError(actionError.message || 'No pude procesar la acción de mesas.');
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  });

  const resolveFinding = (finding) => {
    if (finding.key === 'locations') { setWorkflow('create_location'); return; }
    if (finding.key === 'catalog') { setWorkflow('create_catalog'); return; }
    if (finding.key === 'business_hours') { sendMessage('Ayúdame a configurar los horarios; antes dime qué información necesitas'); return; }
    if (finding.key === 'payment_methods') { setWorkflow('create_payment_method'); return; }
    if (finding.key === 'printing') { setWorkflow('update_printing_settings'); return; }
    if (finding.key === 'modifiers') { setWorkflow('create_modifier_group'); return; }
    const page = FINDING_PAGES[finding.key];
    if (page && onNavigate) { setIsOpen(false); onNavigate(page); }
  };

  if (!brandId) return null;

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="group fixed bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] right-3 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-gradient-to-br from-[#173D24] to-[#0A1F12] text-white shadow-[0_10px_28px_rgba(23,61,36,0.45)] transition hover:-translate-y-0.5 hover:scale-105 hover:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-200 md:bottom-5 md:right-5 md:h-14 md:w-14" aria-label="Abrir Lumi, copiloto operativo" aria-haspopup="dialog">
        <LumiEmblem size={24} className="text-emerald-300 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
        <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-1.5 text-xs font-bold text-white shadow-lg group-hover:block group-focus-visible:block">Lumi · Copiloto Aluna</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} aria-label="Cerrar Lumi" />
          <section role="dialog" aria-modal="true" aria-labelledby={titleId} className={`absolute inset-y-0 right-0 flex w-full flex-col bg-[#F7F8F5] shadow-2xl transition-all duration-300 ease-in-out ${isExpanded ? 'sm:max-w-[96vw] xl:max-w-[1240px]' : 'sm:max-w-[640px] xl:max-w-[760px]'}`}>
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
                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={() => setIsExpanded(prev => !prev)} 
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors" 
                    title={isExpanded ? "Reducir a panel lateral" : "Pantalla completa / Modo Enfoque"} 
                    aria-label={isExpanded ? "Reducir a panel lateral" : "Pantalla completa / Modo Enfoque"}
                  >
                    {isExpanded ? <Minimize2 size={19} aria-hidden="true" /> : <Maximize2 size={19} aria-hidden="true" />}
                  </button>
                  <button type="button" onClick={openChanges} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Ver historial de cambios">
                    <History size={19} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Cerrar panel">
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
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
                <LocationWorkflow brandName={brandName} isExecuting={isLoading} onApprove={approveLocation} onCancel={cancelWorkflow} />
              ) : workflow === 'create_catalog' ? (
                <CatalogWorkflow key={activeTurnRef.current} brandName={brandName} initialDraft={catalogDraft} isExecuting={isLoading} onApprove={approveCatalog} onCancel={cancelWorkflow} />
              ) : workflow === 'consolidate_catalog' ? (
                <ConsolidationWorkflow categories={availableCategories} isExecuting={isLoading} onApprove={approveConsolidation} onCancel={cancelWorkflow} />
              ) : workflow === 'create_costed_product' ? (
                <CostedProductWorkflow brandName={brandName} initialDraft={catalogDraft} isExecuting={isLoading} onApprove={approveCostedProduct} onApproveQuick={approveCatalog} onCancel={cancelWorkflow} />
              ) : workflow === 'edit_product_price' && selectedProduct ? (
                <PriceWorkflow product={selectedProduct} isExecuting={isLoading} onApprove={approvePrice} onCancel={cancelWorkflow} />
              ) : ['create_payment_method', 'update_printing_settings', 'create_modifier_group'].includes(workflow) ? (
                <OperationsWorkflow action={workflow} brandName={brandName} locationName={locationName} isExecuting={isLoading} onApprove={approveOperations} onCancel={cancelWorkflow} />
              ) : !audit && messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900">Hola, soy Lumi. Copiloto de {brandName}.</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                      Te ayudo a revisar compras de insumos, ajustar precios, auditar tu catálogo o resolver dudas operativas. Antes de registrar una compra comprobaré si está disponible para tu cuenta.
                    </p>
                  </div>

                  <div>
                    <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Acciones rápidas</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPrompt('Llegaron insumos: ');
                          promptRef.current?.focus();
                        }}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-800 text-sm font-bold">📥</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900">Revisar una compra</p>
                          <p className="text-[11px] text-gray-500 truncate">Cantidad, costo y disponibilidad</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPrompt('Ajustar precio de ');
                          promptRef.current?.focus();
                        }}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100/70 text-amber-800 text-sm font-bold">🏷️</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900">Ajustar precio</p>
                          <p className="text-[11px] text-gray-500 truncate">Actualizar valor de un plato</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage('¿Cuáles insumos o platos no tienen costo o precio asignado?')}
                        disabled={isLoading}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-800 text-sm font-bold">📋</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900">Insumos sin costo</p>
                          <p className="text-[11px] text-gray-500 truncate">Diagnóstico rápido de costos</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={executeAudit}
                        disabled={isLoading}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100/70 text-purple-800 text-sm font-bold">
                          {isLoading ? <Loader2 size={16} className="animate-spin" /> : '🔍'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900">Auditar apertura</p>
                          <p className="text-[11px] text-gray-500 truncate">Revisión general de catálogo</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : audit ? (
                <AuditResult audit={audit} onResolve={resolveFinding} />
              ) : null}

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
                            plainLanguage={message.card.plainLanguage}
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
                            isExecuting={isLoading && !message.card.obsolete}
                            isDraft={message.card.isDraft}
                            productMode={['create_catalog', 'create_costed_product'].includes(message.card.action) ? (message.card.productMode || 'simple') : null}
                            onChangeProductMode={(mode) => handleCardProductModeChange(index, mode)}
                            suggestedModifiers={message.card.suggestedModifiers}
                            onToggleModifier={(modName) => handleCardToggleModifier(index, modName)}
                            onFieldChange={(fieldKey, value) => handleCardFieldChange(index, fieldKey, value)}
                            canApprove={currentCard(message.card) && (!message.card.isDraft || Boolean(message.card.draft?.product_name && Number(message.card.draft?.price) > 0))}
                            unavailableLabel={!currentCard(message.card) ? message.card.obsoleteReason === 'dismissed' ? 'Propuesta descartada · no se puede aprobar' : message.card.obsoleteReason === 'approved' ? 'Propuesta ya enviada · no se volverá a ejecutar' : 'Propuesta reemplazada · no se puede aprobar' : undefined}
                            approvalNote={[message.card.contextLabel, message.card.approvalNote].filter(Boolean).join(' · ')}
                            plainLanguage={['update_business_hours', 'change_product_visibility', 'register_inventory_purchase'].includes(message.card.action)}
                            approveLabel={message.card.approveLabel}
                            onApprove={() => handleApproveProposalCard(message.card)}
                            onCancel={() => handleDismissCard(index)}
                            onSendToChat={message.card.obsolete || ['update_business_hours', 'change_product_visibility', 'register_inventory_purchase'].includes(message.card.action) ? undefined : () => handleCardSendToChat(message.card)}
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
                  {isLoading ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-xs font-semibold text-emerald-900 max-w-[85%] animate-pulse" aria-live="polite">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#173D24] text-white">
                        <Sparkles size={14} className="animate-spin" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-900">Lumi está pensando…</p>
                        <p className="text-[11px] text-gray-500 font-normal">Interpretando insumos y preparando la propuesta</p>
                      </div>
                    </div>
                  ) : null}

                  {selectedProduct ? <ProductContextCard product={selectedProduct} recipesEnabled={recipesEnabled} onEditPrice={() => setWorkflow('edit_product_price')} onCreateRecipe={() => sendMessage(`Quiero preparar la receta de ${selectedProduct.name}`)} /> : null}
                  {suggestedReplies.length > 0 ? <div className="flex flex-wrap gap-2">{suggestedReplies.map((reply) => <button key={reply} type="button" disabled={isLoading} onClick={() => handleSuggestedReply(reply)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:opacity-50">{reply}</button>)}</div> : null}
                  {suggestedIntent === 'create_catalog' && (catalogDraft.category_name || catalogDraft.product_name) ? <button type="button" onClick={() => setWorkflow('create_catalog')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white">Revisar y aprobar creación</button> : null}
                  {suggestedIntent === 'create_location' ? <button type="button" onClick={() => setWorkflow('create_location')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white">Preparar nueva sede</button> : null}
                  {suggestedIntent === 'consolidate_catalog' && availableCategories.length > 1 ? <button type="button" onClick={() => setWorkflow('consolidate_catalog')} className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white">Revisar categorías duplicadas</button> : null}
                  {suggestedIntent === 'create_costed_product' ? <button type="button" onClick={() => setWorkflow('create_costed_product')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white">Revisar producto, receta y costos</button> : null}
                  {['create_payment_method', 'update_printing_settings', 'create_modifier_group'].includes(suggestedIntent) ? <button type="button" onClick={() => setWorkflow(suggestedIntent)} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white">Preparar cambio con Aluna</button> : null}
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
