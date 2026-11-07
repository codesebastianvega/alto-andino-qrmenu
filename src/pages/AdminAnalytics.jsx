import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAnalyticsData } from '../hooks/analytics/useAdminAnalyticsData';
import AnalyticsHeader from '../components/admin/analytics/AnalyticsHeader';
import AnalyticsResumenTab from '../components/admin/analytics/AnalyticsResumenTab';
import AnalyticsInsightsTab from '../components/admin/analytics/AnalyticsInsightsTab';
import AnalyticsOperationsTab from '../components/admin/analytics/AnalyticsOperationsTab';
import AnalyticsPrintReport from '../components/admin/analytics/AnalyticsPrintReport';
import CustomerDirectory from '../components/admin/CustomerDirectory';
import AdminHeatmaps from '../components/admin/AdminHeatmaps';
import BulkCostEditor from '../components/admin/BulkCostEditor';

class AnalyticsTabBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, info) {
    console.error('AdminAnalytics tab render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Vista temporalmente no disponible</p>
          <p className="mt-2 text-sm font-medium text-amber-800/80">
            Hubo un problema renderizando esta gráfica. Cambia de pestaña o recarga el panel.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminAnalytics() {
  const {
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
    activeBrand,
    planDetails,
    formatCurrency,
    formatCompactCurrency,
    fetchData,
    handleQuickCostUpdate,
    handleBulkSave,
    handleSmartExport,
    // Memoized metrics
    biStats,
    stats,
    bottleneckStats,
    bcgData,
    growthContribution,
    paretoData,
    leakageAudit,
    topProducts,
    categoryStats,
    channelStats,
    tableStats,
    paymentStats,
    hourlyStats,
    peakHour,
    heatmapStats,
    dayOfWeekStats,
    analyticsSummary,
    smartRecommendations,
    categoryPopularity,
    hourlyPerformance
  } = useAdminAnalyticsData();

  return (
    <div className="p-4 md:p-12 max-w-[1600px] mx-auto min-h-screen mesh-gradient-bg">
      {/* ── Header & Navigation ── */}
      <AnalyticsHeader 
        dateRange={dateRange}
        setDateRange={setDateRange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* ── Loading Skeleton / Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AnalyticsTabBoundary resetKey={`${activeTab}-${dateRange}`}>
                {activeTab === 'resumen' && (
                  <AnalyticsResumenTab 
                    planDetails={planDetails}
                    activeBrand={activeBrand}
                    integrityStats={integrityStats}
                    allProducts={allProducts}
                    setShowBulkEditor={setShowBulkEditor}
                    stats={stats}
                    biStats={biStats}
                    advancedData={advancedData}
                    peakHour={peakHour}
                    isReady={isReady}
                    hourlyStats={hourlyStats}
                    analyticsSummary={analyticsSummary}
                    data={data}
                    formatCompactCurrency={formatCompactCurrency}
                    formatCurrency={formatCurrency}
                    setActiveTab={setActiveTab}
                    dayOfWeekStats={dayOfWeekStats}
                    channelStats={channelStats}
                    heatmapStats={heatmapStats}
                    categoryStats={categoryStats}
                    paymentStats={paymentStats}
                    topProducts={topProducts}
                    tableStats={tableStats}
                  />
                )}

                {activeTab === 'analitica' && (
                  <AnalyticsInsightsTab 
                    growthContribution={growthContribution}
                    smartRecommendations={smartRecommendations}
                    setShowBulkEditor={setShowBulkEditor}
                    setActiveTab={setActiveTab}
                    biStats={biStats}
                    formatCurrency={formatCurrency}
                    formatCompactCurrency={formatCompactCurrency}
                    leakageAudit={leakageAudit}
                    bcgData={bcgData}
                    isReady={isReady}
                    editingProductId={editingProductId}
                    setEditingProductId={setEditingProductId}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    handleQuickCostUpdate={handleQuickCostUpdate}
                    isSavingCost={isSavingCost}
                    paretoType={paretoType}
                    setParetoType={setParetoType}
                    paretoData={paretoData}
                    hourlyPerformance={hourlyPerformance}
                    categoryPopularity={categoryPopularity}
                  />
                )}

                {activeTab === 'operaciones' && (
                  <AnalyticsOperationsTab 
                    data={data}
                    formatCurrency={formatCurrency}
                    biStats={biStats}
                    stats={stats}
                    bottleneckStats={bottleneckStats}
                    dateRange={dateRange}
                    handleSmartExport={handleSmartExport}
                  />
                )}

                {activeTab === 'crm' && (
                  <CustomerDirectory />
                )}

                {activeTab === 'heatmaps' && (
                  <AdminHeatmaps 
                    activeBrand={activeBrand} 
                    orders={data.orders} 
                    events={data.events}
                    formatCurrency={formatCurrency}
                    onRefresh={fetchData}
                  />
                )}
              </AnalyticsTabBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Bulk Cost Editor Modal ── */}
      <AnimatePresence>
        {showBulkEditor && (
          <BulkCostEditor 
            products={allProducts}
            onSave={handleBulkSave}
            onCancel={() => setShowBulkEditor(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Executive BI Printable Report ── */}
      <AnalyticsPrintReport 
        activeBrand={activeBrand}
        dateRange={dateRange}
        biStats={biStats}
        formatCurrency={formatCurrency}
        bcgData={bcgData}
        leakageAudit={leakageAudit}
      />
    </div>
  );
}
