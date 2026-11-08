import React from 'react';
import UpgradeBanner from './UpgradeBanner';
import UpgradeProductCard from './UpgradeProductCard';

export default function UpgradeProductGrid({
  filteredProducts,
  effectiveCurrentPlanSlug,
  cartItems,
  billingCycle,
  getDisplayPrice,
  getAnnualPrice,
  onToggleCart
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Banner de Bienvenida al Marketplace */}
      <UpgradeBanner />

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
        {filteredProducts.map(product => (
          <UpgradeProductCard
            key={product.id}
            product={product}
            effectiveCurrentPlanSlug={effectiveCurrentPlanSlug}
            isInCart={cartItems.has(product.id)}
            billingCycle={billingCycle}
            getDisplayPrice={getDisplayPrice}
            getAnnualPrice={getAnnualPrice}
            onToggleCart={onToggleCart}
          />
        ))}
      </div>
    </div>
  );
}
