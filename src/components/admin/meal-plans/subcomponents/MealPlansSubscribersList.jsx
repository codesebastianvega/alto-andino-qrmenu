import React from 'react';
import MealPlanSubscriberCard from './MealPlanSubscriberCard';

export default function MealPlansSubscribersList({
  plans = [],
  usageMap = {},
  programConfig,
  activeTiers = [],
  brandSlug,
  saving = false,
  copiedCode = null,
  onQuickTemplateChange,
  onTogglePaymentStatus,
  onQuickSoupChange,
  onAdjustUsedCredit,
  onRenewPlan,
  onCopyVipLink,
  onEdit,
  onDelete
}) {
  return (
    <div className="p-5 sm:p-6 space-y-4 bg-stone-50/60">
      {plans.length === 0 ? (
        <div className="text-center py-10 text-stone-500 text-sm">
          No tienes suscriptores activos todavía. Crea el primero con el botón{' '}
          <strong>+ Nuevo Suscriptor</strong>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan) => {
            const usage = usageMap[plan.id || plan.code] || {
              totalCredits: Number(plan.total_credits) || 5,
              usedCredits: Number(plan.manual_used_adjustment) || 0,
              remainingCredits: Math.max(
                0,
                (Number(plan.total_credits) || 5) - (Number(plan.manual_used_adjustment) || 0)
              ),
              ordersHistory: []
            };

            return (
              <MealPlanSubscriberCard
                key={plan.id || plan.code}
                plan={plan}
                usage={usage}
                programConfig={programConfig}
                activeTiers={activeTiers}
                brandSlug={brandSlug}
                saving={saving}
                copiedCode={copiedCode}
                onQuickTemplateChange={onQuickTemplateChange}
                onTogglePaymentStatus={onTogglePaymentStatus}
                onQuickSoupChange={onQuickSoupChange}
                onAdjustUsedCredit={onAdjustUsedCredit}
                onRenewPlan={onRenewPlan}
                onCopyVipLink={onCopyVipLink}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
