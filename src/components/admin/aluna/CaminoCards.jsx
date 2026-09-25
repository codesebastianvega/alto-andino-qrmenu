import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Compass, 
  Zap,
  Lightbulb,
  Layers,
  Clock,
  ArrowUpRight,
  MessageSquare,
  Pencil
} from 'lucide-react';

const PAGE_NAMES = {
  products: 'Carta de Productos',
  categories: 'Categorías',
  modifier_groups: 'Extras y Opciones',
  sedes: 'Sedes y Sucursales',
  settings: 'Ajustes y Operación',
  recipes: 'Recetas y Costeo',
  inventory: 'Inventario de Insumos',
  tables: 'Mesas y Salones QR',
  web: 'Presencia Web y Landing',
  business_profile: 'Perfil del Negocio',
  staff: 'Personal y Turnos',
  orders: 'Gestión de Pedidos',
  kitchen: 'Pantalla de Cocina (KDS)',
  analytics: 'Métricas y Ventas',
  dashboard: 'Panel Principal'
};

/**
 * CAMINO 1: Guía Manual Paso a Paso
 * No muta la base de datos. Explica exactamente dónde hacer clic y cómo configurar.
 */
export function GuidanceCard({ title, steps = [], tip, targetPage, onNavigate }) {
  const pageLabel = PAGE_NAMES[targetPage] || targetPage;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs transition-all hover:shadow-sm">
      <div className="border-b border-gray-100 bg-slate-50/70 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200/70 text-slate-700">
            <Compass size={14} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Camino 1 · Guía Manual
          </span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          Sin cambios en BD
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        {title && (
          <h4 className="text-sm font-bold text-gray-900 leading-snug">
            {title}
          </h4>
        )}

        {Array.isArray(steps) && steps.length > 0 && (
          <ol className="space-y-2 text-xs text-gray-600">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-100 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">
                  {typeof step === 'string' ? (
                    <span dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>') }} />
                  ) : step}
                </span>
              </li>
            ))}
          </ol>
        )}

        {tip && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
            <Lightbulb size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-950">Consejo pro: </strong>
              <span>{tip}</span>
            </div>
          </div>
        )}

        {targetPage && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate(targetPage)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ExternalLink size={13} className="text-gray-400" />
              <span>Abrir sección: <strong className="text-gray-900">{pageLabel}</strong></span>
            </span>
            <ArrowRight size={14} className="text-gray-400" />
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * CAMINO 2: Propuesta Agéntica con Confirmación Humana (Human-in-the-Loop)
 * Muestra el diff Antes vs. Después y requiere botón [Aprobar y Ejecutar].
 */
export function AgenticProposalCard({ 
  title, 
  summary, 
  beforeAfter = [], 
  riskLevel = 'low', 
  isExecuting = false, 
  isDraft = false,
  productMode = 'simple',
  onChangeProductMode,
  suggestedModifiers = [],
  onToggleModifier,
  onFieldChange,
  canApprove = true,
  onApprove, 
  onCancel,
  onSendToChat,
  details
}) {
  const riskMeta = isDraft
    ? { label: 'Borrador en Curso', className: 'bg-amber-50 text-amber-800 border-amber-300' }
    : {
        low: { label: 'Riesgo Bajo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        medium: { label: 'Riesgo Medio', className: 'bg-amber-50 text-amber-700 border-amber-200' },
        high: { label: 'Riesgo Alto', className: 'bg-red-50 text-red-700 border-red-200' },
      }[riskLevel] || { label: 'Verificado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

  return (
    <article className={`overflow-hidden rounded-2xl border-2 ${isDraft ? 'border-amber-300/80' : 'border-emerald-200/90'} bg-white shadow-sm transition-all`}>
      <div className={`border-b ${isDraft ? 'border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-transparent' : 'border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-transparent'} px-4 py-3 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${isDraft ? 'bg-amber-700' : 'bg-[#173D24]'} text-white`}>
            {isDraft ? <Pencil size={13} /> : <Sparkles size={13} />}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDraft ? 'text-amber-950' : 'text-emerald-950'}`}>
            {isDraft ? 'Camino 2 · Borrador Editable' : 'Camino 2 · Propuesta Agéntica'}
          </span>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${riskMeta.className}`}>
          {riskMeta.label}
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        <div>
          <h4 className="text-sm font-bold text-gray-950 leading-snug">
            {title || 'Cambio preparado para confirmación'}
          </h4>
          {summary && (
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        {/* Trazabilidad de Inventario: Selector Simple vs Receta */}
        {productMode && onChangeProductMode && (
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-2.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Trazabilidad de Inventario
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onChangeProductMode('simple')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 font-semibold transition-all border ${
                  productMode === 'simple'
                    ? 'bg-[#173D24] text-white border-emerald-950 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>🍹 Simple (Sin receta)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeProductMode('recipe')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 font-semibold transition-all border ${
                  productMode === 'recipe'
                    ? 'bg-[#173D24] text-white border-emerald-950 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>📋 Con receta e insumos</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 italic">
              {productMode === 'simple'
                ? 'Se crea de inmediato en la carta digital (no descuenta insumos de stock).'
                : 'Permite vincular ingredientes y descontar inventario con cada venta.'}
            </p>
          </div>
        )}

        {/* Parámetros de la propuesta: Formulario Espacioso si es editable, o Tabla Comparativa si es informativa */}
        {Array.isArray(beforeAfter) && beforeAfter.length > 0 && (
          beforeAfter.some((item) => item.editable) ? (
            <div className="space-y-3 rounded-xl border border-emerald-200/90 bg-emerald-50/20 p-3.5">
              <div className="border-b border-emerald-100 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Pencil size={12} className="text-emerald-700" />
                  <span>Campos de la propuesta (Puedes editarlos antes de aprobar)</span>
                </span>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Ajusta los valores que Aluna enviará a la carta digital.
                </p>
              </div>

              <div className="space-y-3">
                {beforeAfter.map((item, idx) => {
                  const isDescription = item.key === 'description' || item.label.toLowerCase().includes('descrip');
                  const isPrice = item.key === 'price' || item.label.toLowerCase().includes('precio');
                  const isProduct = item.key === 'product_name' || item.label.toLowerCase().includes('producto') || item.label.toLowerCase().includes('plato');
                  const isCategory = item.key === 'category_name' || item.label.toLowerCase().includes('categor');

                  const defaultLabel = isProduct 
                    ? 'Nombre del producto o plato *'
                    : isPrice
                      ? 'Precio de venta al público (COP) *'
                      : isCategory
                        ? 'Categoría en el menú *'
                        : isDescription
                          ? 'Descripción para el menú QR (opcional)'
                          : `${item.label}${item.editable ? ' *' : ''}`;

                  const defaultHelper = isProduct
                    ? 'El nombre comercial y visible que verá el cliente en la carta digital (ej. Limonada de Coco 16oz).'
                    : isPrice
                      ? 'Precio final al comensal en pesos colombianos con impuestos incluidos.'
                      : isCategory
                        ? 'Sección de la carta donde se agrupará (ej. Bebidas Frías, Platos Fuertes, Postres).'
                        : isDescription
                          ? 'Frase atractiva que resalte los ingredientes y despierte el apetito del comensal.'
                          : item.helper || '';

                  if (!item.editable) {
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-gray-100">
                        <span className="font-semibold text-gray-700">{item.label}</span>
                        <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded">{String(item.after ?? '—')}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={idx}>
                      <label className="block text-xs font-bold text-gray-800">
                        {item.fieldLabel || defaultLabel}
                      </label>

                      {isDescription ? (
                        <textarea
                          rows={2}
                          value={item.value !== undefined ? item.value : (item.after === 'Por definir' || item.after === 'Nuevo plato' ? '' : item.after)}
                          placeholder={item.placeholder || 'Ej: Deliciosa combinación con ingredientes frescos...'}
                          onChange={(e) => onFieldChange && onFieldChange(item.key || item.label, e.target.value)}
                          className="mt-1 w-full resize-none rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs transition-all"
                        />
                      ) : isPrice ? (
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-2 text-xs font-bold text-emerald-800">$</span>
                          <input
                            type="number"
                            min="0"
                            value={item.value !== undefined ? item.value : (item.after === 'Por definir' || item.after === 'Nuevo plato' ? '' : item.after)}
                            placeholder={item.placeholder || 'Ej: 14000'}
                            onChange={(e) => onFieldChange && onFieldChange(item.key || item.label, e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full rounded-lg border border-emerald-300 bg-white pl-7 pr-3 py-1.5 text-xs font-bold text-emerald-950 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs transition-all"
                          />
                        </div>
                      ) : (
                        <input
                          type={item.type || 'text'}
                          value={item.value !== undefined ? item.value : (item.after === 'Por definir' || item.after === 'Nuevo plato' ? '' : item.after)}
                          placeholder={item.placeholder || (isCategory ? 'Ej: Bebidas Frías' : 'Ej: Limonada de Coco 16oz')}
                          onChange={(e) => onFieldChange && onFieldChange(item.key || item.label, item.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                          className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs transition-all"
                        />
                      )}

                      {defaultHelper && (
                        <p className="mt-1 text-[11px] text-gray-500 leading-tight">
                          {defaultHelper}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50">
              <div className="grid grid-cols-3 border-b border-gray-200/70 bg-gray-100/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <span>Parámetro</span>
                <span>Antes</span>
                <span className="text-emerald-800">Después (Propuesta)</span>
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                {beforeAfter.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 px-3 py-2 items-center gap-2">
                    <span className="font-medium text-gray-700 truncate">{item.label}</span>
                    <span className="text-gray-400 line-through truncate text-[11px]">{String(item.before ?? '—')}</span>
                    <span className="font-semibold text-emerald-900 truncate bg-emerald-50/60 rounded px-1.5 py-0.5 w-full">
                      {String(item.after ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Modificadores sugeridos por Aluna (con nota de reutilización) */}
        {Array.isArray(suggestedModifiers) && suggestedModifiers.length > 0 && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles size={12} className="text-emerald-700" />
                <span>Modificadores sugeridos para este producto</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-full">
                Reutiliza si ya existen
              </span>
            </div>
            <p className="text-[10px] text-emerald-800 leading-normal">
              Marca las opciones que aplican. Si ya existen en tu sede se vincularán para no duplicar datos en inventario.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              {suggestedModifiers.map((mod, idx) => (
                <label key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-100 cursor-pointer hover:bg-emerald-50/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mod.selected !== false}
                      onChange={() => onToggleModifier && onToggleModifier(mod.name)}
                      className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-gray-800">{mod.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{mod.description || 'Opciones estándar'}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {details && (
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-600">
            {details}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-900 border border-emerald-100">
          <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
          <span>Este cambio quedará registrado en el historial auditado de Aluna.</span>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={isExecuting || !canApprove}
            onClick={onApprove}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#21542f] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Ejecutando cambio…</span>
              </>
            ) : !canApprove ? (
              <span>Completa nombre y precio en el cuadro</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{productMode === 'recipe' ? 'Continuar con Receta e Insumos' : 'Aprobar y Crear Producto'}</span>
              </>
            )}
          </button>

          {onSendToChat && (
            <button
              type="button"
              disabled={isExecuting}
              onClick={onSendToChat}
              className="flex items-center justify-center gap-1.5 w-full py-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              <MessageSquare size={13} />
              <span>Continuar afinando por chat</span>
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              disabled={isExecuting}
              onClick={onCancel}
              className="w-full py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Descartar propuesta
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * CAMINO 3: Atajo Asistido / Deep Link con Pre-Rellenado
 * Navega directo a la página adecuada y pre-rellena datos sugeridos por IA.
 */
export function DeepLinkCard({
  title,
  description,
  targetPage,
  pageLabel: customPageLabel,
  prefillData,
  onNavigate,
  onPrefill
}) {
  const pageLabel = customPageLabel || PAGE_NAMES[targetPage] || targetPage;

  const handleAction = () => {
    if (prefillData && onPrefill) {
      onPrefill(targetPage, prefillData);
    } else if (onNavigate) {
      onNavigate(targetPage);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-violet-200/90 bg-white shadow-xs transition-all hover:shadow-sm">
      <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/70 via-violet-50/30 to-transparent px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Zap size={13} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-950">
            Camino 3 · Atajo Asistido
          </span>
        </div>
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
          {pageLabel}
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        <div>
          <h4 className="text-sm font-bold text-gray-950 leading-snug">
            {title || `Acceso directo a ${pageLabel}`}
          </h4>
          {description && (
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {prefillData && Object.keys(prefillData).length > 0 && (
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3 space-y-1.5 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-800">
              Datos listos para completar:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(prefillData).map(([key, val]) => {
                if (!val || typeof val === 'object') return null;
                const labels = {
                  name: 'Nombre',
                  price: 'Precio',
                  category_name: 'Categoría',
                  description: 'Descripción',
                  whatsapp: 'WhatsApp'
                };
                return (
                  <span key={key} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-gray-700 border border-violet-200/60 shadow-2xs">
                    <span className="text-gray-400 font-normal">{labels[key] || key}:</span>
                    <strong className="text-gray-900 truncate max-w-[160px]">{String(val)}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAction}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-violet-800 active:scale-[0.99] transition-all"
        >
          <span>{prefillData ? 'Abrir formulario con datos listos' : `Ir a ${pageLabel}`}</span>
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}

/**
 * PLAN INFO CARD: Estado de cuotas de IA
 * Muestra las consultas disponibles y qué caminos permite el plan activo.
 */
export function PlanInfoCard({ 
  planName = 'Esencial', 
  usage = 0, 
  monthlyLimit = 100,
  caminos = [1, 2]
}) {
  const percentage = Math.min(Math.round((usage / monthlyLimit) * 100), 100);
  const remaining = Math.max(monthlyLimit - usage, 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#173D24] text-emerald-300">
            <Sparkles size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Plan {planName}</h4>
            <p className="text-[10px] text-gray-500">Cuota mensual de IA Aluna</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
          {remaining} consultas restantes
        </span>
      </div>

      <div>
        <div className="flex justify-between text-[11px] font-semibold text-gray-600 mb-1">
          <span>Uso del mes: {usage} / {monthlyLimit}</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between text-[10px] text-gray-500">
        <span>Caminos activos:</span>
        <div className="flex gap-1.5">
          <span className={`px-1.5 py-0.5 rounded font-bold ${caminos.includes(1) ? 'bg-slate-100 text-slate-800' : 'opacity-30'}`}>
            1. Guía
          </span>
          <span className={`px-1.5 py-0.5 rounded font-bold ${caminos.includes(2) ? 'bg-emerald-100 text-emerald-900' : 'opacity-30'}`}>
            2. Agéntico
          </span>
          <span className={`px-1.5 py-0.5 rounded font-bold ${caminos.includes(3) ? 'bg-violet-100 text-violet-900' : 'opacity-30'}`}>
            3. Atajos
          </span>
        </div>
      </div>
    </article>
  );
}
