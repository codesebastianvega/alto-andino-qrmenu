import React from 'react';
import { useMenuHero } from './menu-hero/hooks/useMenuHero';
import HeroGuideFab from './menu-hero/subcomponents/HeroGuideFab';
import HeroHeaderBrand from './menu-hero/subcomponents/HeroHeaderBrand';
import HeroCardsDuo from './menu-hero/subcomponents/HeroCardsDuo';
import HeroSearchBar from './menu-hero/subcomponents/HeroSearchBar';
import HeroCategoryPills from './menu-hero/subcomponents/HeroCategoryPills';
import HeroPromoBanner from './menu-hero/subcomponents/HeroPromoBanner';
import HeroFoodGuideModal from './menu-hero/subcomponents/HeroFoodGuideModal';

export default function MenuHero({
  query,
  setQuery,
  activeCategory,
  setActiveCategory,
  categories = [],
  onOpenCart,
  onInstallPWA,
  isPWAInstalled
}) {
  const {
    user,
    greeting,
    homeSettings,
    storeStatusInfo,
    effectiveBrand,
    brandName,
    logoUrl,
    isLightLogo,
    primaryColor,
    accentColor,
    heroBg,
    locationLabel,
    locationHint,
    menuBannerError,
    setMenuBannerError,
    bannerProduct,
    handleBannerClick,
    featuredButtonLabel,
    handleScrollToFeatured,
    foodGuide
  } = useMenuHero({ categories, setActiveCategory });

  return (
    <div className="w-full flex justify-center mb-6">
      <HeroGuideFab
        instantProduct={foodGuide.instantProduct}
        storeStatusInfo={storeStatusInfo}
        fabPosition={foodGuide.fabPosition}
        primaryColor={primaryColor}
        onPointerDown={foodGuide.handleFabPointerDown}
        onPointerMove={foodGuide.handleFabPointerMove}
        onPointerUp={foodGuide.handleFabPointerUp}
        onPointerCancel={foodGuide.handleFabPointerCancel}
        onClick={foodGuide.handleFabClick}
      />

      <div className="w-full relative z-10 flex flex-col items-start">
        <HeroHeaderBrand
          primaryColor={primaryColor}
          accentColor={accentColor}
          heroBg={heroBg}
          isLightLogo={isLightLogo}
          logoUrl={logoUrl}
          brandName={brandName}
          locationLabel={locationLabel}
          locationHint={locationHint}
          homeSettings={homeSettings}
          effectiveBrand={effectiveBrand}
          onOpenCart={onOpenCart}
          handleScrollToFeatured={handleScrollToFeatured}
          featuredButtonLabel={featuredButtonLabel}
        />

        <HeroCardsDuo
          onOpenCart={onOpenCart}
          onInstallPWA={onInstallPWA}
          isPWAInstalled={isPWAInstalled}
          instantProduct={foodGuide.instantProduct}
          storeStatusInfo={storeStatusInfo}
          primaryColor={primaryColor}
          accentColor={accentColor}
          greeting={greeting}
          onOpenGuide={foodGuide.openGuide}
        />

        <HeroSearchBar query={query} setQuery={setQuery} />

        <HeroCategoryPills
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          primaryColor={primaryColor}
        />

        <HeroPromoBanner
          homeSettings={homeSettings}
          bannerProduct={bannerProduct}
          menuBannerError={menuBannerError}
          setMenuBannerError={setMenuBannerError}
          onBannerClick={handleBannerClick}
        />
      </div>

      <HeroFoodGuideModal
        guideOpen={foodGuide.guideOpen}
        setGuideOpen={foodGuide.setGuideOpen}
        greeting={greeting}
        user={user}
        primaryColor={primaryColor}
        accentColor={accentColor}
        guideProgressTotal={foodGuide.guideProgressTotal}
        guideProgressIndex={foodGuide.guideProgressIndex}
        suggestedProduct={foodGuide.suggestedProduct}
        isGuideThinking={foodGuide.isGuideThinking}
        currentStep={foodGuide.currentStep}
        chooseGuideOption={foodGuide.chooseGuideOption}
        thinkingMessage={foodGuide.thinkingMessage}
        guideMessage={foodGuide.guideMessage}
        guideAnswers={foodGuide.guideAnswers}
        handleQuickView={foodGuide.handleQuickView}
        resetGuide={foodGuide.resetGuide}
        anotherSuggestion={foodGuide.anotherSuggestion}
        generateSuggestion={foodGuide.generateSuggestion}
        candidates={foodGuide.candidates}
      />
    </div>
  );
}
