/* @refresh reset */
import React, { useEffect, useRef, useState } from "react";
import Portal from "./Portal";
import { Icon } from "@iconify-icon/react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useMenuData } from "@/context/MenuDataContext";
import { getProductImage } from "@/utils/images";
import { useDIYModifierSteps } from "./diy-modal/hooks/useDIYModifierSteps";
import { useDIYPricingAndCart } from "./diy-modal/hooks/useDIYPricingAndCart";
import DIYHeroColumn from "./diy-modal/subcomponents/DIYHeroColumn";
import DIYMobileHeader from "./diy-modal/subcomponents/DIYMobileHeader";
import DIYStepperPills from "./diy-modal/subcomponents/DIYStepperPills";
import DIYLiveSummaryTray from "./diy-modal/subcomponents/DIYLiveSummaryTray";
import DIYIngredientGrid from "./diy-modal/subcomponents/DIYIngredientGrid";
import DIYStickyFooter from "./diy-modal/subcomponents/DIYStickyFooter";

export default function DIYProductModal({ open: isOpen, product, onClose, onAdd }) {
  useLockBodyScroll(isOpen);

  const menuData = useMenuData();
  const modalRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Selections per group: groupName -> array of item ids (can contain duplicates for multi-portions)
  const [selections, setSelections] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showLiveTray, setShowLiveTray] = useState(true);

  // Always reset selections and step when modal opens or product changes
  const productId = product?.id ?? null;
  useEffect(() => {
    if (isOpen) {
      setSelections({});
      setCurrentStep(0);
    }
  }, [isOpen, productId]);

  // Derived values
  const title = product?.title || product?.name || "Arma tu Propio Bowl";
  const subtitle = product?.subtitle || product?.description || product?.desc || "";
  const image = product ? getProductImage(product) : null;
  const isScheduleRestricted = product?.is_schedule_available === false && !product?.is_plan_bowl;
  const scheduleNotice = product?.schedule_label || "Fuera de horario de servicio";

  // Step & modifier resolution hook
  const {
    groups,
    steps,
    currentStepGroups,
    nextStepGroup,
    currentProgressPercent
  } = useDIYModifierSteps({
    product,
    menuData,
    selections,
    currentStep
  });

  // Pricing, live summary, selection stepper & cart logic hook
  const {
    finalPrice,
    totalSelectedCount,
    liveSelectedChips,
    isCurrentStepValid,
    handleIncrement,
    handleDecrement,
    handleCardClick,
    handleClose,
    handleNext,
    handlePrev
  } = useDIYPricingAndCart({
    product,
    groups,
    steps,
    currentStep,
    setCurrentStep,
    selections,
    setSelections,
    isScheduleRestricted,
    scheduleNotice,
    scrollContainerRef,
    onAdd,
    onClose
  });

  if (!isOpen || !product || groups.length === 0) return null;

  return (
    <Portal>
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" onClick={handleClose} />

        {/* Modal Container */}
        <div ref={modalRef} tabIndex={-1} className="pointer-events-auto relative z-[110] w-full max-w-md md:max-w-5xl focus-visible:outline-none">
          <div className="relative bg-[#fcfcfd] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[94vh] md:h-[88vh] rounded-t-[32px] sm:rounded-[36px] border border-white/20">
            {/* Close Button Floating */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md z-30 transition-all border border-white/20 shadow-lg active:scale-90 cursor-pointer"
            >
              <Icon icon="heroicons:x-mark" className="text-xl font-bold" />
            </button>

            {/* DESKTOP LEFT COLUMN: Hero Cover */}
            <DIYHeroColumn
              title={title}
              subtitle={subtitle}
              image={image}
              finalPrice={finalPrice}
              totalSelectedCount={totalSelectedCount}
            />

            {/* RIGHT COLUMN: Interactive Stepper */}
            <div className="flex-1 flex flex-col overflow-hidden w-full md:w-7/12 bg-[#f8f9fa] relative">
              {/* MOBILE COMPACT HEADER */}
              <DIYMobileHeader
                title={title}
                image={image}
                currentStep={currentStep}
                totalSteps={steps.length}
                finalPrice={finalPrice}
                currentProgressPercent={currentProgressPercent}
                isScheduleRestricted={isScheduleRestricted}
                scheduleNotice={scheduleNotice}
              />

              {/* STEPPER PILLS HEADER */}
              <DIYStepperPills
                steps={steps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                selections={selections}
              />

              {/* LIVE BOWL SUMMARY TRAY */}
              <DIYLiveSummaryTray
                liveSelectedChips={liveSelectedChips}
                totalSelectedCount={totalSelectedCount}
                showLiveTray={showLiveTray}
                setShowLiveTray={setShowLiveTray}
                handleDecrement={handleDecrement}
              />

              {/* MAIN INTERACTIVE INGREDIENT CARDS AREA */}
              <DIYIngredientGrid
                currentStepGroups={currentStepGroups}
                selections={selections}
                scrollContainerRef={scrollContainerRef}
                handleCardClick={handleCardClick}
                handleIncrement={handleIncrement}
                handleDecrement={handleDecrement}
              />

              {/* STICKY BOTTOM ACTION BAR */}
              <DIYStickyFooter
                finalPrice={finalPrice}
                currentStep={currentStep}
                totalSteps={steps.length}
                nextStepGroup={nextStepGroup}
                isCurrentStepValid={isCurrentStepValid()}
                isScheduleRestricted={isScheduleRestricted}
                scheduleNotice={scheduleNotice}
                handlePrev={handlePrev}
                handleNext={handleNext}
              />
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
