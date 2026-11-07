import React from 'react';
import { PrimaryButton, SecondaryButton } from '../components/admin/ui';
import { Table, QrCode, Layers, Plus, Printer } from 'lucide-react';
import { useAdminTablesData } from '../hooks/tables/useAdminTablesData';
import TablesMetricsCards from '../components/admin/tables/TablesMetricsCards';
import TablesListTable from '../components/admin/tables/TablesListTable';
import MarketingCampaignQrsTab from '../components/admin/tables/MarketingCampaignQrsTab';
import TableFormModal from '../components/admin/tables/TableFormModal';
import AreasManagerModal from '../components/admin/tables/AreasManagerModal';
import CampaignQrModal from '../components/admin/tables/CampaignQrModal';
import PrintSheetModal from '../components/admin/tables/PrintSheetModal';

export default function AdminTables({ isEmbedded = false }) {
  const {
    activeBrand,
    locations,
    isAllLocations,
    tables,
    loadingTables,
    tableMetrics,
    activeTab,
    setActiveTab,
    marketingMetrics,
    areas,
    isFormOpen,
    setIsFormOpen,
    editingTable,
    tableForm,
    setTableForm,
    isSubmittingTable,
    modalTab,
    setModalTab,
    isAreaModalOpen,
    setIsAreaModalOpen,
    newAreaName,
    setNewAreaName,
    isSubmittingArea,
    isBulkCreating,
    isPrintSheetOpen,
    setIsPrintSheetOpen,
    isCampaignQrModalOpen,
    setIsCampaignQrModalOpen,
    campaignChannel,
    setCampaignChannel,
    campaignCustomName,
    setCampaignCustomName,
    handleBulkCreateTables,
    handleCreateArea,
    handleDeleteArea,
    openCreate,
    openEdit,
    openQr,
    handleSaveTable,
    handleDeleteTable,
    toggleTableActive,
    getTableUrl,
    handleCopyUrl,
    handleDownloadQr,
    handleDownloadAnyQr
  } = useAdminTablesData();

  if (loadingTables) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        Cargando…
      </div>
    );
  }

  return (
    <div className={isEmbedded ? "" : "p-8 max-w-7xl mx-auto space-y-6"}>
      {/* ── Header Principal (Modo Independiente) ── */}
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-xl shadow-gray-200/40 mb-8">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-[#2f4131]" />
                <h3 className="text-[10px] font-black text-[#2f4131] uppercase tracking-[0.3em]">Negocio / Activos</h3>
             </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gestión de Mesas</h2>
            <p className="text-xs text-gray-400 font-medium">Controla tus ubicaciones físicas y descarga sus códigos QR únicos.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto flex-wrap">
            <SecondaryButton onClick={() => setIsPrintSheetOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 whitespace-nowrap">
              <Printer size={16} />
              Imprimir QRs
            </SecondaryButton>
            <SecondaryButton onClick={() => setIsCampaignQrModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 whitespace-nowrap">
              <QrCode size={16} />
              QRs Volantes & Redes
            </SecondaryButton>
            <SecondaryButton onClick={() => setIsAreaModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5">
              <Layers size={16} />
              Gestionar Salones
            </SecondaryButton>
            <PrimaryButton onClick={openCreate} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 shadow-lg shadow-[#2f4131]/20">
              <Plus size={18} />
              Nueva Mesa
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ── Header Reducido (Modo Embebido en Configuración) ── */}
      {isEmbedded && (
        <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200/50">
           <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight italic">Listado de Mesas</h2>
           </div>
           <div className="flex gap-2">
             <SecondaryButton onClick={() => setIsAreaModalOpen(true)} className="px-4 py-2 text-xs rounded-xl">Salones</SecondaryButton>
             <PrimaryButton onClick={openCreate} className="px-6 py-2 text-xs rounded-xl">+ Nueva mesa</PrimaryButton>
           </div>
        </div>
      )}

      {/* ── Selector de Pestañas: Mesas Físicas vs QRs de Redes ── */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl w-fit border border-gray-200/60 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'tables'
              ? 'bg-white text-gray-950 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Table className="w-4 h-4 text-[#2f4131]" />
          <span>Mesas del Salón ({tables.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('marketing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'marketing'
              ? 'bg-white text-gray-950 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>QRs de Redes & Campañas</span>
        </button>
      </div>

      {/* ── Contenido de Pestañas ── */}
      {activeTab === 'tables' ? (
        <>
          <TablesMetricsCards tableMetrics={tableMetrics} />
          <TablesListTable
            tables={tables}
            tableMetrics={tableMetrics}
            isAllLocations={isAllLocations}
            isBulkCreating={isBulkCreating}
            handleBulkCreateTables={handleBulkCreateTables}
            toggleTableActive={toggleTableActive}
            openQr={openQr}
            openEdit={openEdit}
            handleDeleteTable={handleDeleteTable}
          />
        </>
      ) : (
        <MarketingCampaignQrsTab
          activeBrand={activeBrand}
          marketingMetrics={marketingMetrics}
          setIsCampaignQrModalOpen={setIsCampaignQrModalOpen}
          handleDownloadAnyQr={handleDownloadAnyQr}
        />
      )}

      {/* ── Modales Especializados ── */}
      <TableFormModal
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        editingTable={editingTable}
        modalTab={modalTab}
        setModalTab={setModalTab}
        tableForm={tableForm}
        setTableForm={setTableForm}
        isSubmittingTable={isSubmittingTable}
        handleSaveTable={handleSaveTable}
        isAllLocations={isAllLocations}
        locations={locations}
        areas={areas}
        getTableUrl={getTableUrl}
        handleDownloadQr={handleDownloadQr}
        handleCopyUrl={handleCopyUrl}
      />

      <AreasManagerModal
        isAreaModalOpen={isAreaModalOpen}
        setIsAreaModalOpen={setIsAreaModalOpen}
        handleCreateArea={handleCreateArea}
        handleDeleteArea={handleDeleteArea}
        newAreaName={newAreaName}
        setNewAreaName={setNewAreaName}
        isSubmittingArea={isSubmittingArea}
        areas={areas}
        isAllLocations={isAllLocations}
        locations={locations}
        tableForm={tableForm}
        setTableForm={setTableForm}
      />

      <CampaignQrModal
        isCampaignQrModalOpen={isCampaignQrModalOpen}
        setIsCampaignQrModalOpen={setIsCampaignQrModalOpen}
        campaignChannel={campaignChannel}
        setCampaignChannel={setCampaignChannel}
        campaignCustomName={campaignCustomName}
        setCampaignCustomName={setCampaignCustomName}
        activeBrand={activeBrand}
      />

      <PrintSheetModal
        isPrintSheetOpen={isPrintSheetOpen}
        setIsPrintSheetOpen={setIsPrintSheetOpen}
        tables={tables}
        getTableUrl={getTableUrl}
        activeBrand={activeBrand}
      />
    </div>
  );
}
