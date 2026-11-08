import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocations } from '../../context/LocationContext';
import { usePlan } from '../usePlan';
import {
  formatCurrency,
  formatCompact,
  formatCompactCurrency
} from './analyticsFormatters';
import {
  computeBiStats,
  computeBottleneckStats,
  computeBcgMatrix,
  computeGrowthContribution,
  computeParetoData,
  computeLeakageAudit,
  computeProspectStats,
  computeCategoryStats,
  computeChannelStats,
  computeTableStats,
  computePaymentStats,
  computeHourlyStats,
  computePeakHour,
  computeHeatmapStats,
  computeDayOfWeekStats,
  computeProductProfitability,
  computeAnalyticsSummary,
  generateSmartRecommendations,
  computeCategoryPopularity,
  computeHourlyPerformance
} from './analyticsCalculations';
import { useAnalyticsFetcher } from './useAnalyticsFetcher';
import { useAnalyticsMutations } from './useAnalyticsMutations';

export function useAdminAnalyticsData() {
  const [editingProductId, setEditingProductId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingCost, setIsSavingCost] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('resumen');
  const [paretoType, setParetoType] = useState('revenue');
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { activeBrand } = useAuth();
  const { activeLocationId, isAllLocations } = useLocations();
  const activeBrandId = activeBrand?.id;
  const planDetails = usePlan(activeBrandId);

  // Motor de Fetching concurrente
  const {
    loading,
    isReady,
    data,
    prevData,
    allProducts,
    advancedData,
    integrityStats,
    fetchData
  } = useAnalyticsFetcher({
    activeBrandId,
    dateRange,
    activeLocationId,
    isAllLocations
  });

  // Mutaciones de datos
  const {
    handleUpdateLeadStatus,
    handleQuickCostUpdate,
    handleBulkSave,
    handleSmartExport,
    handleDeleteLead
  } = useAnalyticsMutations({
    fetchData,
    editingProductId,
    setEditingProductId,
    editValue,
    setEditValue,
    isSavingCost,
    setIsSavingCost,
    setShowBulkEditor
  });

  // Métricas Calculadas (Memoizadas)
  const biStats = useMemo(() => computeBiStats(data, prevData), [data, prevData]);
  const stats = useMemo(() => biStats.current, [biStats]);
  const bottleneckStats = useMemo(() => computeBottleneckStats(data?.orders), [data?.orders]);
  const bcgData = useMemo(() => computeBcgMatrix(data?.orders), [data?.orders]);
  const growthContribution = useMemo(
    () => computeGrowthContribution(data?.orders, prevData?.orders),
    [data?.orders, prevData?.orders]
  );
  const paretoData = useMemo(() => computeParetoData(data?.orders, paretoType), [data?.orders, paretoType]);
  const leakageAudit = useMemo(() => computeLeakageAudit(data?.orders), [data?.orders]);
  const prospectStats = useMemo(() => computeProspectStats(data?.leads, prevData?.leads), [data?.leads, prevData?.leads]);

  const productPerformance = useMemo(
    () => [...bcgData.items].sort((a, b) => b.revenue - a.revenue),
    [bcgData.items]
  );
  const topProducts = useMemo(
    () => [...bcgData.items].sort((a, b) => b.units - a.units).slice(0, 5),
    [bcgData.items]
  );

  const categoryStats = useMemo(() => computeCategoryStats(data?.orders), [data?.orders]);
  const channelStats = useMemo(() => computeChannelStats(data?.orders), [data?.orders]);
  const tableStats = useMemo(() => computeTableStats(data?.orders), [data?.orders]);
  const paymentStats = useMemo(
    () => computePaymentStats(data?.orders, data?.payments, data?.paymentMethods),
    [data?.orders, data?.payments, data?.paymentMethods]
  );

  const hourlyStats = useMemo(() => computeHourlyStats(data?.orders), [data?.orders]);
  const peakHour = useMemo(() => computePeakHour(hourlyStats), [hourlyStats]);
  const heatmapStats = useMemo(() => computeHeatmapStats(data?.orders), [data?.orders]);
  const dayOfWeekStats = useMemo(() => computeDayOfWeekStats(data?.orders), [data?.orders]);

  const productProfitability = useMemo(() => computeProductProfitability(data?.orders), [data?.orders]);
  const analyticsSummary = useMemo(() => computeAnalyticsSummary(data, stats), [data, stats]);
  const smartRecommendations = useMemo(
    () => generateSmartRecommendations(bcgData, growthContribution),
    [bcgData, growthContribution]
  );
  const categoryPopularity = useMemo(() => computeCategoryPopularity(data?.orders), [data?.orders]);
  const hourlyPerformance = useMemo(() => computeHourlyPerformance(data?.orders), [data?.orders]);

  return {
    editingProductId,
    setEditingProductId,
    editValue,
    setEditValue,
    isSavingCost,
    isReady,
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    paretoType,
    setParetoType,
    advancedData,
    integrityStats,
    showBulkEditor,
    setShowBulkEditor,
    allProducts,
    loading,
    data,
    prevData,
    activeBrand,
    activeBrandId,
    activeLocationId,
    isAllLocations,
    planDetails,
    selectedCustomer,
    setSelectedCustomer,
    formatCurrency,
    formatCompact,
    formatCompactCurrency,
    fetchData,
    handleUpdateLeadStatus,
    handleQuickCostUpdate,
    handleBulkSave,
    handleSmartExport,
    handleDeleteLead,
    // Memoized metrics
    biStats,
    stats,
    bottleneckStats,
    bcgData,
    growthContribution,
    paretoData,
    leakageAudit,
    prospectStats,
    productPerformance,
    topProducts,
    categoryStats,
    channelStats,
    tableStats,
    paymentStats,
    hourlyStats,
    peakHour,
    heatmapStats,
    dayOfWeekStats,
    productProfitability,
    analyticsSummary,
    smartRecommendations,
    categoryPopularity,
    hourlyPerformance
  };
}
