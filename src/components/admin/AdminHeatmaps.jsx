import { useHeatmapsData } from './heatmaps/hooks/useHeatmapsData';
import HeatmapsHeader from './heatmaps/subcomponents/HeatmapsHeader';
import CampaignQrDrawer from './heatmaps/subcomponents/CampaignQrDrawer';
import HeatmapsKpisBar from './heatmaps/subcomponents/HeatmapsKpisBar';
import HeatmapsGeoSection from './heatmaps/subcomponents/HeatmapsGeoSection';
import HeatmapsAttribution from './heatmaps/subcomponents/HeatmapsAttribution';
import TableBreakdownModal from './heatmaps/subcomponents/TableBreakdownModal';
import ChannelQrModal from './heatmaps/subcomponents/ChannelQrModal';
import TrafficExclusionCard from './heatmaps/subcomponents/TrafficExclusionCard';
import ClarityApiCard from './heatmaps/subcomponents/ClarityApiCard';

export default function AdminHeatmaps({
  activeBrand,
  orders = [],
  events = [],
  formatCurrency = (val) => `$${val?.toLocaleString('es-CO') || 0}`,
  onRefresh,
}) {
  const {
    brandSlug,
    clarityBaseUrl,
    baseUrl,
    showQrDrawer,
    setShowQrDrawer,
    selectedChannel,
    setSelectedChannel,
    customCampaignName,
    setCustomCampaignName,
    copiedLink,
    generatedCampaignUrl,
    clarityToken,
    setClarityToken,
    isSyncingApi,
    lastSyncTime,
    isClearing,
    showTableModal,
    setShowTableModal,
    selectedChannelForModal,
    setSelectedChannelForModal,
    isRefreshing,
    behaviorMetrics,
    tableBreakdown,
    clarityApiInsights,
    handleRefreshData,
    handleSyncClarityApi,
    handleClearTestAnalytics,
    handleSaveToken,
    handleCopyLink,
    handleDownloadQrPng,
    handleDownloadChannelQr,
  } = useHeatmapsData({
    activeBrand,
    orders,
    events,
    onRefresh,
  });

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Compacto & Barra de Acciones Rápidas */}
      <HeatmapsHeader
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        handleRefreshData={handleRefreshData}
        showQrDrawer={showQrDrawer}
        onToggleQrDrawer={() => setShowQrDrawer((prev) => !prev)}
        clarityBaseUrl={clarityBaseUrl}
      />

      {/* 2. Creador de QR Plegable */}
      <CampaignQrDrawer
        show={showQrDrawer}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        customCampaignName={customCampaignName}
        setCustomCampaignName={setCustomCampaignName}
        generatedCampaignUrl={generatedCampaignUrl}
        copiedLink={copiedLink}
        handleCopyLink={handleCopyLink}
        handleDownloadQrPng={handleDownloadQrPng}
      />

      {/* 3. Tarjetas de Métricas Clave Reales */}
      <HeatmapsKpisBar behaviorMetrics={behaviorMetrics} />

      {/* 4. Ubicaciones Geográficas Reales & Desglose de Canales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <HeatmapsGeoSection
          clarityApiInsights={clarityApiInsights}
          lastSyncTime={lastSyncTime}
          handleSyncClarityApi={handleSyncClarityApi}
          isSyncingApi={isSyncingApi}
        />

        <HeatmapsAttribution
          channels={behaviorMetrics.channels}
          baseUrl={baseUrl}
          brandSlug={brandSlug}
          isClearing={isClearing}
          handleClearTestAnalytics={handleClearTestAnalytics}
          onOpenTableModal={() => setShowTableModal(true)}
          onSelectChannelForModal={(ch) => setSelectedChannelForModal(ch)}
        />
      </div>

      {/* Modal Desglose Inteligente de Mesas */}
      <TableBreakdownModal
        show={showTableModal}
        onClose={() => setShowTableModal(false)}
        tableBreakdown={tableBreakdown}
      />

      {/* Modal Visualizador & Descarga de QR por Canal */}
      <ChannelQrModal
        channel={selectedChannelForModal}
        onClose={() => setSelectedChannelForModal(null)}
        baseUrl={baseUrl}
        brandSlug={brandSlug}
        brandName={activeBrand?.name}
        handleDownloadChannelQr={handleDownloadChannelQr}
      />

      {/* 5. Exclusión de Dispositivos del Equipo & Reset de Pruebas */}
      <TrafficExclusionCard
        baseUrl={baseUrl}
        brandSlug={brandSlug}
        isClearing={isClearing}
        handleClearTestAnalytics={handleClearTestAnalytics}
      />

      {/* 6. Conexión con Microsoft Clarity Data API (Token Oficial) */}
      <ClarityApiCard
        clarityToken={clarityToken}
        setClarityToken={setClarityToken}
        lastSyncTime={lastSyncTime}
        isSyncingApi={isSyncingApi}
        handleSyncClarityApi={handleSyncClarityApi}
        handleSaveToken={handleSaveToken}
      />
    </div>
  );
}
