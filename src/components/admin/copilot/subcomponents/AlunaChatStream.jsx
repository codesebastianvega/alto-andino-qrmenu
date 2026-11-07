import { Loader2, Sparkles } from 'lucide-react';
import AuditResult from '../components/AuditResult';
import ProductContextCard from '../components/ProductContextCard';
import {
  GuidanceCard,
  AgenticProposalCard,
  DeepLinkCard,
  PlanInfoCard,
} from '../../aluna/CaminoCards';

export default function AlunaChatStream({
  brandName,
  audit,
  messages,
  isLoading,
  selectedProduct,
  recipesEnabled,
  suggestedReplies,
  suggestedIntent,
  catalogDraft,
  availableCategories,
  success,
  error,
  promptRef,
  setPrompt,
  sendMessage,
  executeAudit,
  resolveFinding,
  setWorkflow,
  handleDeepNavigate,
  handleDeepPrefill,
  handleCardProductModeChange,
  handleCardToggleModifier,
  handleCardFieldChange,
  handleApproveProposalCard,
  handleDismissCard,
  handleCardSendToChat,
  handleSuggestedReply,
}) {
  return (
    <>
      {!audit && messages.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-900">
              Hola, soy Lumi. Copiloto de {brandName}.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
              Puedo registrar compras y facturas de insumos, ajustar precios, auditar tu catálogo o
              resolver dudas operativas sin rodeos.
            </p>
          </div>

          <div>
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Acciones rápidas
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setPrompt('Llegaron insumos: ');
                  promptRef.current?.focus();
                }}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-800 text-sm font-bold">
                  📥
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">Registrar compras</p>
                  <p className="text-[11px] text-gray-500 truncate">Ingreso de stock y facturas</p>
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100/70 text-amber-800 text-sm font-bold">
                  🏷️
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">Ajustar precio</p>
                  <p className="text-[11px] text-gray-500 truncate">Actualizar valor de un plato</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  sendMessage('¿Cuáles insumos o platos no tienen costo o precio asignado?')
                }
                disabled={isLoading}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-800 text-sm font-bold">
                  📋
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">Insumos sin costo</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    Diagnóstico rápido de costos
                  </p>
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
                  <p className="text-[11px] text-gray-500 truncate">
                    Revisión general de catálogo
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : audit ? (
        <AuditResult audit={audit} onResolve={resolveFinding} />
      ) : null}

      {messages.length > 0 ? (
        <div className="mt-5 space-y-3" aria-live="polite">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="space-y-2">
              <div
                className={`max-w-[94%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[86%] ${
                  message.role === 'user'
                    ? 'ml-auto bg-[#173D24] text-white'
                    : 'border border-emerald-100 bg-white text-gray-700'
                }`}
              >
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
                    productMode={
                      ['create_catalog', 'create_costed_product'].includes(message.card.action)
                        ? message.card.productMode || 'simple'
                        : null
                    }
                    onChangeProductMode={(mode) => handleCardProductModeChange(index, mode)}
                    suggestedModifiers={message.card.suggestedModifiers}
                    onToggleModifier={(modName) => handleCardToggleModifier(index, modName)}
                    onFieldChange={(fieldKey, value) =>
                      handleCardFieldChange(index, fieldKey, value)
                    }
                    canApprove={
                      !message.card.isDraft ||
                      Boolean(
                        message.card.draft?.product_name && Number(message.card.draft?.price) > 0
                      )
                    }
                    approveLabel={message.card.approveLabel}
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

          {isLoading ? (
            <div
              className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-xs font-semibold text-emerald-900 max-w-[85%] animate-pulse"
              aria-live="polite"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#173D24] text-white">
                <Sparkles size={14} className="animate-spin" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-gray-900">Lumi está pensando…</p>
                <p className="text-[11px] text-gray-500 font-normal">
                  Interpretando insumos y preparando la propuesta
                </p>
              </div>
            </div>
          ) : null}

          {selectedProduct ? (
            <ProductContextCard
              product={selectedProduct}
              recipesEnabled={recipesEnabled}
              onEditPrice={() => setWorkflow('edit_product_price')}
              onCreateRecipe={() => setWorkflow('create_costed_product')}
            />
          ) : null}

          {suggestedReplies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestedReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSuggestedReply(reply)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}

          {suggestedIntent === 'create_catalog' &&
          (catalogDraft.category_name || catalogDraft.product_name) ? (
            <button
              type="button"
              onClick={() => setWorkflow('create_catalog')}
              className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white"
            >
              Revisar y aprobar creación
            </button>
          ) : null}

          {suggestedIntent === 'create_location' ? (
            <button
              type="button"
              onClick={() => setWorkflow('create_location')}
              className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white"
            >
              Preparar nueva sede
            </button>
          ) : null}

          {suggestedIntent === 'consolidate_catalog' && availableCategories.length > 1 ? (
            <button
              type="button"
              onClick={() => setWorkflow('consolidate_catalog')}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white"
            >
              Revisar categorías duplicadas
            </button>
          ) : null}

          {suggestedIntent === 'create_costed_product' ? (
            <button
              type="button"
              onClick={() => setWorkflow('create_costed_product')}
              className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white"
            >
              Revisar producto, receta y costos
            </button>
          ) : null}

          {[
            'update_business_hours',
            'create_payment_method',
            'update_printing_settings',
            'create_modifier_group',
          ].includes(suggestedIntent) ? (
            <button
              type="button"
              onClick={() => setWorkflow(suggestedIntent)}
              className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white"
            >
              Preparar cambio con Aluna
            </button>
          ) : null}
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800"
        >
          {success}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"
        >
          {error}
        </div>
      ) : null}
    </>
  );
}
