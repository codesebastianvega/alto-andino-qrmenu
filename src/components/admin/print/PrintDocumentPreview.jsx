import React from 'react';
import PrintMenuSheet from './PrintMenuSheet';

export default function PrintDocumentPreview({
  zoom,
  setZoom,
  allFilteredProductsCount,
  estimatedPages,
  sheetProps,
}) {
  return (
    <div className="lg:col-span-8 flex flex-col items-center w-full min-w-0">
      {/* Barra de control de Zoom y Contador de Páginas */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-[210mm] mb-3 px-2 no-print gap-2">
        <div className="flex items-center gap-2 bg-neutral-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xs">
          <span>📄 {allFilteredProductsCount} platos</span>
          <span className="text-neutral-400">•</span>
          <span className="text-amber-300 font-extrabold">
            ~{estimatedPages} {estimatedPages === 1 ? 'página' : 'páginas'} A4
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-xs text-xs font-bold text-neutral-600">
          <span>Zoom:</span>
          <button
            onClick={() => setZoom(0.7)}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              zoom === 0.7 ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
            }`}
          >
            70%
          </button>
          <button
            onClick={() => setZoom(0.85)}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              zoom === 0.85 ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
            }`}
          >
            85%
          </button>
          <button
            onClick={() => setZoom(1)}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              zoom === 1 ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
            }`}
          >
            100%
          </button>
        </div>
      </div>

      {/* CONTENEDOR ESCALADO DE LA HOJA A4 (SOLO PARA PANTALLA) */}
      <div className="w-full flex justify-center overflow-x-auto pb-16">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            width: '210mm',
            minHeight: '297mm',
          }}
          className="transition-transform duration-200 origin-top shrink-0"
        >
          <PrintMenuSheet isForPrint={false} {...sheetProps} />
        </div>
      </div>
    </div>
  );
}
