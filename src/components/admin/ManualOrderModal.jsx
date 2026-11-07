import React from 'react';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { useManualOrderCatalog } from './manual-order/hooks/useManualOrderCatalog';
import { useManualOrderCustomer } from './manual-order/hooks/useManualOrderCustomer';
import { useManualOrderCart } from './manual-order/hooks/useManualOrderCart';
import ManualOrderHeader from './manual-order/subcomponents/ManualOrderHeader';
import ManualOrderCatalogColumn from './manual-order/subcomponents/ManualOrderCatalogColumn';
import ManualOrderCustomerSection from './manual-order/subcomponents/ManualOrderCustomerSection';
import ManualOrderTimingSection from './manual-order/subcomponents/ManualOrderTimingSection';
import ManualOrderItemsList from './manual-order/subcomponents/ManualOrderItemsList';
import ManualOrderPaymentSection from './manual-order/subcomponents/ManualOrderPaymentSection';
import ManualOrderSummaryFooter from './manual-order/subcomponents/ManualOrderSummaryFooter';
import ManualOrderModifierWizard from './manual-order/subcomponents/ManualOrderModifierWizard';

export default function ManualOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  brandId: propBrandId,
  locationId,
  restaurantSettings: propRestaurantSettings
}) {
  const { activeBrand, profile } = useAuth();
  const brandId = propBrandId || activeBrand?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const menuData = useMenuData();
  const {
    restaurantSettings: menuSettings,
    rawModifierGroups = [],
    getModifiers
  } = menuData || {};

  const restaurantSettings = propRestaurantSettings || menuSettings || {};

  // 1. Catalog Hook
  const catalog = useManualOrderCatalog({
    isOpen,
    brandId,
    locationId,
    restaurantSettings,
    menuData
  });

  // 2. Customer Hook
  const customer = useManualOrderCustomer({
    isOpen,
    brandId
  });

  // 3. Cart & Submission Hook
  const cart = useManualOrderCart({
    isOpen,
    brandId,
    locationId,
    selectedLocationId: catalog.selectedLocationId,
    locationsList: catalog.locationsList,
    restaurantSettings,
    dailySpecialData: catalog.dailySpecialData,
    rawModifierGroups,
    getModifiers,
    digitalAccountsList: catalog.digitalAccountsList,
    selectedDigitalAccountId: catalog.selectedDigitalAccountId,
    splitDigitalMethod: catalog.splitDigitalMethod,
    customerName: customer.customerName,
    customerPhone: customer.customerPhone,
    deliveryAddress: customer.deliveryAddress,
    deliveryFee: catalog.deliveryFee,
    orderNotes: customer.orderNotes,
    fulfillmentType: customer.fulfillmentType,
    timingMode: customer.timingMode,
    scheduledTime: customer.scheduledTime,
    onOrderCreated,
    onClose
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-800">
        
        {/* Header */}
        <ManualOrderHeader
          entryFlow={cart.entryFlow}
          setEntryFlow={cart.setEntryFlow}
          setPrintKitchenTicket={cart.setPrintKitchenTicket}
          setIsPaid={cart.setIsPaid}
          onClose={onClose}
        />

        {/* Content Body: Two columns (Left: Catalog, Right: Customer & Order Summary) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          
          {/* Left Column: Products Selector (7 cols) */}
          <ManualOrderCatalogColumn
            searchTerm={catalog.searchTerm}
            setSearchTerm={catalog.setSearchTerm}
            categories={catalog.categories}
            selectedCategory={catalog.selectedCategory}
            setSelectedCategory={catalog.setSelectedCategory}
            dailySpecialData={catalog.dailySpecialData}
            catalogProducts={catalog.catalogProducts}
            loadingCatalog={catalog.loadingCatalog}
            filteredProducts={catalog.filteredProducts}
            handleSelectProduct={cart.handleSelectProduct}
          />

          {/* Right Column: Customer Details, Timing, Items Summary (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between bg-neutral-50/50 overflow-y-auto max-h-[75vh]">
            <div className="space-y-4">
              
              {/* Flow Explanation Banner if completed */}
              {cart.entryFlow === 'completed' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                  <Icon icon="heroicons:check-circle" className="text-base text-emerald-600 shrink-0" />
                  <span>
                    <strong>Modo Histórico:</strong> Este pedido ya fue entregado. Se sumará a las ventas de hoy y descontará los ingredientes del inventario sin sonar la alarma en cocina.
                  </span>
                </div>
              )}

              {/* Customer Info Box */}
              <ManualOrderCustomerSection
                fulfillmentType={customer.fulfillmentType}
                setFulfillmentType={customer.setFulfillmentType}
                customerName={customer.customerName}
                setCustomerName={customer.setCustomerName}
                customerPhone={customer.customerPhone}
                setCustomerPhone={customer.setCustomerPhone}
                deliveryAddress={customer.deliveryAddress}
                setDeliveryAddress={customer.setDeliveryAddress}
                deliveryFee={catalog.deliveryFee}
                setDeliveryFee={catalog.setDeliveryFee}
                customerSuggestions={customer.customerSuggestions}
                showSuggestions={customer.showSuggestions}
                setShowSuggestions={customer.setShowSuggestions}
                handleSelectSuggestion={customer.handleSelectSuggestion}
              />

              {/* Timing Box */}
              <ManualOrderTimingSection
                timingMode={customer.timingMode}
                setTimingMode={customer.setTimingMode}
                scheduledTime={customer.scheduledTime}
                setScheduledTime={customer.setScheduledTime}
              />

              {/* Items in Cart */}
              <ManualOrderItemsList
                orderItems={cart.orderItems}
                setOrderItems={cart.setOrderItems}
                handleUpdateItemQty={cart.handleUpdateItemQty}
                handleEditItem={cart.handleEditItem}
                handleRemoveItem={cart.handleRemoveItem}
              />

              {/* Payment Status and Method */}
              <ManualOrderPaymentSection
                isPaid={cart.isPaid}
                setIsPaid={cart.setIsPaid}
                activePaymentMethods={catalog.activePaymentMethods}
                paymentMethod={cart.paymentMethod}
                setPaymentMethod={cart.setPaymentMethod}
                cashTendered={cart.cashTendered}
                setCashTendered={cart.setCashTendered}
                grandTotal={cart.grandTotal}
                splitCashAmount={cart.splitCashAmount}
                setSplitCashAmount={cart.setSplitCashAmount}
                splitDigitalAmount={cart.splitDigitalAmount}
                setSplitDigitalAmount={cart.setSplitDigitalAmount}
                digitalAccountsList={catalog.digitalAccountsList}
                selectedDigitalAccountId={catalog.selectedDigitalAccountId}
                setSelectedDigitalAccountId={catalog.setSelectedDigitalAccountId}
                setSplitDigitalMethod={catalog.setSplitDigitalMethod}
                splitDigitalMethod={catalog.splitDigitalMethod}
                pendingType={cart.pendingType}
                setPendingType={cart.setPendingType}
                customerName={customer.customerName}
              />
            </div>

            {/* Bottom Actions & Totals */}
            <ManualOrderSummaryFooter
              orderItems={cart.orderItems}
              itemsSubtotal={cart.itemsSubtotal}
              fulfillmentType={customer.fulfillmentType}
              activeDeliveryFee={cart.activeDeliveryFee}
              grandTotal={cart.grandTotal}
              printKitchenTicket={cart.printKitchenTicket}
              setPrintKitchenTicket={cart.setPrintKitchenTicket}
              isSubmitting={cart.isSubmitting}
              entryFlow={cart.entryFlow}
              handleCreateOrder={cart.handleCreateOrder}
            />
          </div>
        </div>

        {/* Modal Configurator for Dishes with Modifiers */}
        <ManualOrderModifierWizard
          configuringProduct={cart.configuringProduct}
          setConfiguringProduct={cart.setConfiguringProduct}
          selectedModifiers={cart.selectedModifiers}
          setSelectedModifiers={cart.setSelectedModifiers}
          itemKitchenNotes={cart.itemKitchenNotes}
          setItemKitchenNotes={cart.setItemKitchenNotes}
          modalDishLivePrice={cart.modalDishLivePrice}
          handleConfirmConfiguredProduct={cart.handleConfirmConfiguredProduct}
        />
      </div>
    </div>
  );
}
