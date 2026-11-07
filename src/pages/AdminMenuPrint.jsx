import React from 'react';
import { createPortal } from 'react-dom';
import { useAdminMenuPrintData } from '../hooks/print/useAdminMenuPrintData';
import PrintPageHeader from '../components/admin/print/PrintPageHeader';
import PrintConfigSidebar from '../components/admin/print/PrintConfigSidebar';
import PrintDocumentPreview from '../components/admin/print/PrintDocumentPreview';
import PrintMenuSheet from '../components/admin/print/PrintMenuSheet';

export default function AdminMenuPrint() {
  const {
    planInfo,
    printTier,
    isUnlimited,
    canPrintFree,
    remainingFreeFaces,
    template,
    setTemplate,
    columns,
    setColumns,
    density,
    setDensity,
    categories,
    selectedCategoryIds,
    toggleCategory,
    selectAllCategories,
    deselectAllCategories,
    showDescriptions,
    setShowDescriptions,
    showQr,
    setShowQr,
    showExtrasNote,
    setShowExtrasNote,
    zoom,
    setZoom,
    brandName,
    brandLogo,
    primaryColor,
    brandAddress,
    brandPhone,
    menuUrl,
    filteredCategories,
    allFilteredProducts,
    estimatedPages,
    productsByCategory,
    handlePrint,
    handleRequestFaceViaWhatsApp,
  } = useAdminMenuPrintData();

  const sheetProps = {
    brandLogo,
    brandName,
    primaryColor,
    brandAddress,
    brandPhone,
    menuUrl,
    filteredCategories,
    template,
    columns,
    density,
    showDescriptions,
    showQr,
    showExtrasNote,
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 p-4 sm:p-6 lg:p-8">
      {/* ─── ESTILOS MAESTROS DE IMPRESIÓN (Arquitectura de Portal Aislado) ─── */}
      <style>{`
        /* En pantalla, el portal de impresión está completamente oculto */
        @media screen {
          #aluna-print-portal {
            display: none !important;
          }
        }

        /* Al imprimir (Ctrl + P o clic en botón) */
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          /* 1. Ocultar absolutamente toda la aplicación de pantalla */
          #root, #modal-root, .no-print {
            display: none !important;
          }

          /* 2. Resetear body y html para permitir paginación infinita */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            background: #ffffff !important;
            color: #1a1a1a !important;
            overflow: visible !important;
            font-family: 'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 3. Mostrar única y exclusivamente el portal de impresión */
          #aluna-print-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
          }

          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .break-inside-auto {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          .break-after-avoid {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      {/* ─── ENCABEZADO DE LA SECCIÓN ─── */}
      <PrintPageHeader
        planInfo={planInfo}
        printTier={printTier}
        isUnlimited={isUnlimited}
        canPrintFree={canPrintFree}
        remainingFreeFaces={remainingFreeFaces}
      />

      {/* ─── GRID PRINCIPAL: CONTROLES A LA IZQUIERDA / HOJA A LA DERECHA ─── */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <PrintConfigSidebar
          template={template}
          setTemplate={setTemplate}
          columns={columns}
          setColumns={setColumns}
          density={density}
          setDensity={setDensity}
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          filteredCategoriesCount={filteredCategories.length}
          productsByCategory={productsByCategory}
          onToggleCategory={toggleCategory}
          onSelectAllCategories={selectAllCategories}
          onDeselectAllCategories={deselectAllCategories}
          showDescriptions={showDescriptions}
          setShowDescriptions={setShowDescriptions}
          showQr={showQr}
          setShowQr={setShowQr}
          showExtrasNote={showExtrasNote}
          setShowExtrasNote={setShowExtrasNote}
          canPrintFree={canPrintFree}
          printTier={printTier}
          planInfo={planInfo}
          onPrint={handlePrint}
          onRequestFaceViaWhatsApp={handleRequestFaceViaWhatsApp}
        />

        <PrintDocumentPreview
          zoom={zoom}
          setZoom={setZoom}
          allFilteredProductsCount={allFilteredProducts.length}
          estimatedPages={estimatedPages}
          sheetProps={sheetProps}
        />
      </div>

      {/* ─── PORTAL DE IMPRESIÓN DIRECTO ─── */}
      {createPortal(
        <div id="aluna-print-portal">
          <PrintMenuSheet isForPrint={true} {...sheetProps} />
        </div>,
        document.body
      )}
    </div>
  );
}
