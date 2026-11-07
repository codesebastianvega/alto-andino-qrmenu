import CostedProductWorkflow from './aluna/CostedProductWorkflow';
import OperationsWorkflow from './aluna/OperationsWorkflow';
import ChangeHistory from './aluna/ChangeHistory';
import LocationWorkflow from './copilot/workflows/LocationWorkflow';
import CatalogWorkflow from './copilot/workflows/CatalogWorkflow';
import ConsolidationWorkflow from './copilot/workflows/ConsolidationWorkflow';
import PriceWorkflow from './copilot/workflows/PriceWorkflow';
import AlunaFloatingTrigger from './copilot/subcomponents/AlunaFloatingTrigger';
import AlunaCopilotHeader from './copilot/subcomponents/AlunaCopilotHeader';
import AlunaChatStream from './copilot/subcomponents/AlunaChatStream';
import AlunaInputBar from './copilot/subcomponents/AlunaInputBar';
import { useAlunaCopilot } from './copilot/hooks/useAlunaCopilot';

export default function AlunaCopilot({
  brand,
  location,
  locationId,
  onNavigate,
  recipesEnabled = false,
}) {
  const copilot = useAlunaCopilot({
    brand,
    location,
    locationId,
    onNavigate,
    recipesEnabled,
  });

  if (!copilot.brandId) return null;

  return (
    <>
      <AlunaFloatingTrigger onOpen={() => copilot.setIsOpen(true)} />

      {copilot.isOpen ? (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={() => copilot.setIsOpen(false)}
            aria-label="Cerrar Lumi"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={copilot.titleId}
            className={`absolute inset-y-0 right-0 flex w-full flex-col bg-[#F7F8F5] shadow-2xl transition-all duration-300 ease-in-out ${
              copilot.isExpanded
                ? 'sm:max-w-[96vw] xl:max-w-[1240px]'
                : 'sm:max-w-[640px] xl:max-w-[760px]'
            }`}
          >
            <AlunaCopilotHeader
              titleId={copilot.titleId}
              isExpanded={copilot.isExpanded}
              onToggleExpand={() => copilot.setIsExpanded((prev) => !prev)}
              onOpenChanges={copilot.openChanges}
              onClose={() => copilot.setIsOpen(false)}
              brandName={copilot.brandName}
              locationName={copilot.locationName}
              planQuota={copilot.planQuota}
              aiUsage={copilot.aiUsage}
            />

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 xl:px-8">
              {copilot.workflow === 'change_history' ? (
                <ChangeHistory
                  changes={copilot.changes}
                  isLoading={copilot.isLoading}
                  onRefresh={copilot.loadChanges}
                  onBack={() => copilot.setWorkflow(null)}
                />
              ) : copilot.workflow === 'create_location' ? (
                <LocationWorkflow
                  brandName={copilot.brandName}
                  isExecuting={copilot.isLoading}
                  onApprove={copilot.approveLocation}
                  onCancel={() => copilot.setWorkflow(null)}
                />
              ) : copilot.workflow === 'create_catalog' ? (
                <CatalogWorkflow
                  brandName={copilot.brandName}
                  initialDraft={copilot.catalogDraft}
                  isExecuting={copilot.isLoading}
                  onApprove={copilot.approveCatalog}
                  onCancel={() => copilot.setWorkflow(null)}
                />
              ) : copilot.workflow === 'consolidate_catalog' ? (
                <ConsolidationWorkflow
                  categories={copilot.availableCategories}
                  isExecuting={copilot.isLoading}
                  onApprove={copilot.approveConsolidation}
                  onCancel={() => copilot.setWorkflow(null)}
                />
              ) : copilot.workflow === 'create_costed_product' ? (
                <CostedProductWorkflow
                  brandName={copilot.brandName}
                  initialDraft={copilot.catalogDraft}
                  isExecuting={copilot.isLoading}
                  onApprove={copilot.approveCostedProduct}
                  onApproveQuick={copilot.approveCatalog}
                  onCancel={() => copilot.setWorkflow(null)}
                />
              ) : copilot.workflow === 'edit_product_price' && copilot.selectedProduct ? (
                <PriceWorkflow
                  product={copilot.selectedProduct}
                  isExecuting={copilot.isLoading}
                  onApprove={copilot.approvePrice}
                  onCancel={() => copilot.setWorkflow(null)}
                />
              ) : [
                  'update_business_hours',
                  'create_payment_method',
                  'update_printing_settings',
                  'create_modifier_group',
                ].includes(copilot.workflow) ? (
                <OperationsWorkflow
                  action={copilot.workflow}
                  brandName={copilot.brandName}
                  locationName={copilot.locationName}
                  isExecuting={copilot.isLoading}
                  onApprove={copilot.approveOperations}
                  onCancel={() => copilot.setWorkflow(null)}
                />
              ) : (
                <AlunaChatStream
                  brandName={copilot.brandName}
                  audit={copilot.audit}
                  messages={copilot.messages}
                  isLoading={copilot.isLoading}
                  selectedProduct={copilot.selectedProduct}
                  recipesEnabled={recipesEnabled}
                  suggestedReplies={copilot.suggestedReplies}
                  suggestedIntent={copilot.suggestedIntent}
                  catalogDraft={copilot.catalogDraft}
                  availableCategories={copilot.availableCategories}
                  success={copilot.success}
                  error={copilot.error}
                  promptRef={copilot.promptRef}
                  setPrompt={copilot.setPrompt}
                  sendMessage={copilot.sendMessage}
                  executeAudit={copilot.executeAudit}
                  resolveFinding={copilot.resolveFinding}
                  setWorkflow={copilot.setWorkflow}
                  handleDeepNavigate={copilot.handleDeepNavigate}
                  handleDeepPrefill={copilot.handleDeepPrefill}
                  handleCardProductModeChange={copilot.handleCardProductModeChange}
                  handleCardToggleModifier={copilot.handleCardToggleModifier}
                  handleCardFieldChange={copilot.handleCardFieldChange}
                  handleApproveProposalCard={copilot.handleApproveProposalCard}
                  handleDismissCard={copilot.handleDismissCard}
                  handleCardSendToChat={copilot.handleCardSendToChat}
                  handleSuggestedReply={copilot.handleSuggestedReply}
                />
              )}
            </div>

            <AlunaInputBar
              titleId={copilot.titleId}
              prompt={copilot.prompt}
              setPrompt={copilot.setPrompt}
              promptRef={copilot.promptRef}
              isLoading={copilot.isLoading}
              audit={copilot.audit}
              executeAudit={copilot.executeAudit}
              handleSubmit={copilot.handleSubmit}
              handlePromptKeyDown={copilot.handlePromptKeyDown}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
