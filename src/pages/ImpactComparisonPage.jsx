import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImpactCalculator } from '../components/impact-comparison/hooks/useImpactCalculator';
import { useKpiSlider } from '../components/impact-comparison/hooks/useKpiSlider';
import { KPIS } from '../components/impact-comparison/data/impactComparisonData';

import ImpactHeader from '../components/impact-comparison/subcomponents/ImpactHeader';
import ImpactHeroSection from '../components/impact-comparison/subcomponents/ImpactHeroSection';
import ImpactKpisSection from '../components/impact-comparison/subcomponents/ImpactKpisSection';
import ImpactShowcaseSection from '../components/impact-comparison/subcomponents/ImpactShowcaseSection';
import ImpactRoiSection from '../components/impact-comparison/subcomponents/ImpactRoiSection';
import ImpactPlansSection from '../components/impact-comparison/subcomponents/ImpactPlansSection';
import ImpactMatrixSection from '../components/impact-comparison/subcomponents/ImpactMatrixSection';
import ImpactFooter from '../components/impact-comparison/subcomponents/ImpactFooter';

export default function ImpactComparisonPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Mode: 'split' | 'alto-andino' | 'boku'
  const [activeView, setActiveView] = useState('split');

  // Mobile Table Comparison View Toggle: 'pdf' | 'boku'
  const [mobileTableTab, setMobileTableTab] = useState('pdf');

  // Mobile KPI Slider State & Ref
  const { kpiScrollRef, activeKpiIndex, handleKpiScroll, scrollToKpi } = useKpiSlider(KPIS.length);

  // Interactive ROI Calculator State & Math
  const {
    dailyOrders,
    setDailyOrders,
    ticketBase,
    setTicketBase,
    timeframe,
    setTimeframe,
    math
  } = useImpactCalculator(40, 22000);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-[#D4A853] selection:text-black">
      {/* Top Brand Bar */}
      <ImpactHeader onGoBack={handleGoBack} />

      {/* Hero Section with Ambient Glows & View Switcher */}
      <ImpactHeroSection activeView={activeView} setActiveView={setActiveView} />

      {/* Main KPI Cards Section */}
      <ImpactKpisSection
        activeView={activeView}
        kpiScrollRef={kpiScrollRef}
        activeKpiIndex={activeKpiIndex}
        handleKpiScroll={handleKpiScroll}
        scrollToKpi={scrollToKpi}
      />

      {/* Visual Product Comparison Section */}
      <ImpactShowcaseSection activeView={activeView} setActiveView={setActiveView} />

      {/* Interactive ROI Calculator Section */}
      <ImpactRoiSection
        dailyOrders={dailyOrders}
        setDailyOrders={setDailyOrders}
        ticketBase={ticketBase}
        setTicketBase={setTicketBase}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        math={math}
      />

      {/* Commercial Packages Proposal */}
      <ImpactPlansSection />

      {/* Comparison Matrix Table */}
      <ImpactMatrixSection
        activeView={activeView}
        mobileTableTab={mobileTableTab}
        setMobileTableTab={setMobileTableTab}
      />

      {/* Floating CTA Footer */}
      <ImpactFooter onGoBack={handleGoBack} />
    </div>
  );
}
