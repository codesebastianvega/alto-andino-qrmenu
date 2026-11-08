import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpgradeStore } from './upgrade/hooks/useUpgradeStore';
import UpgradeHeader from './upgrade/subcomponents/UpgradeHeader';
import UpgradeCategoryBar from './upgrade/subcomponents/UpgradeCategoryBar';
import UpgradeProductGrid from './upgrade/subcomponents/UpgradeProductGrid';
import UpgradeCartSidebar from './upgrade/subcomponents/UpgradeCartSidebar';

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentPlanSlug 
}) {
  const {
    selectedCategory,
    setSelectedCategory,
    currency,
    setCurrency,
    billingCycle,
    setBillingCycle,
    cartItems,
    isCartOpenMobile,
    setIsCartOpenMobile,
    effectiveCurrentPlanSlug,
    activeBrand,
    getDisplayPrice,
    getAnnualPrice,
    handleToggleCart,
    handleRemoveFromCart,
    filteredProducts,
    cartSummary,
    handleCheckoutWhatsApp
  } = useUpgradeStore({ currentPlanSlug });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] w-screen h-screen bg-[#F8FAFC] flex flex-col overflow-hidden font-sans text-gray-900"
        >
          {/* Header */}
          <UpgradeHeader
            activeBrand={activeBrand}
            currency={currency}
            setCurrency={setCurrency}
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            cartCount={cartSummary.count}
            isCartOpenMobile={isCartOpenMobile}
            setIsCartOpenMobile={setIsCartOpenMobile}
            onClose={onClose}
          />

          {/* Barra de Categorías */}
          <UpgradeCategoryBar
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            effectiveCurrentPlanSlug={effectiveCurrentPlanSlug}
          />

          {/* Cuerpo: Catálogo + Sidebar de Carrito */}
          <div className="flex-1 flex overflow-hidden">
            <UpgradeProductGrid
              filteredProducts={filteredProducts}
              effectiveCurrentPlanSlug={effectiveCurrentPlanSlug}
              cartItems={cartItems}
              billingCycle={billingCycle}
              getDisplayPrice={getDisplayPrice}
              getAnnualPrice={getAnnualPrice}
              onToggleCart={handleToggleCart}
            />

            <UpgradeCartSidebar
              isCartOpenMobile={isCartOpenMobile}
              setIsCartOpenMobile={setIsCartOpenMobile}
              cartSummary={cartSummary}
              billingCycle={billingCycle}
              currency={currency}
              onRemoveFromCart={handleRemoveFromCart}
              onCheckout={handleCheckoutWhatsApp}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
