import React from 'react';
import {
  Layout,
  Columns,
  FileText,
  Layers,
  Settings2,
  Printer,
  MessageCircle,
  Eye,
} from 'lucide-react';
import { formatCOP } from '../../../utils/money';

export default function PrintConfigSidebar({
  template,
  setTemplate,
  columns,
  setColumns,
  density,
  setDensity,
  categories,
  selectedCategoryIds,
  filteredCategoriesCount,
  productsByCategory,
  onToggleCategory,
  onSelectAllCategories,
  onDeselectAllCategories,
  showDescriptions,
  setShowDescriptions,
  showQr,
  setShowQr,
  showExtrasNote,
  setShowExtrasNote,
  canPrintFree,
  printTier,
  planInfo,
  onPrint,
  onRequestFaceViaWhatsApp,
}) {
  return (
    <div className="lg:col-span-4 space-y-5 no-print">
      {/* Card: Estilos de Plantilla */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
          <Layout size={14} /> Estilo de Plantilla
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setTemplate('visual')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              template === 'visual'
                ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="font-extrabold text-xs mb-1">Visual con Fotos</div>
            <div
              className={`text-[10px] leading-relaxed ${
                template === 'visual' ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              Con fotos a color de cada plato. Ideal para vitrinas, delivery y Rappi.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTemplate('bistro')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              template === 'bistro'
                ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="font-extrabold text-xs mb-1">Bistró Clásico</div>
            <div
              className={`text-[10px] leading-relaxed ${
                template === 'bistro' ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              Tipográfico elegante sin fotos. Máximo rendimiento de espacio en papel.
            </div>
          </button>
        </div>

        {/* Selector de Columnas */}
        <div className="pt-3 border-t border-neutral-100">
          <div className="text-[11px] font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
            <Columns size={13} /> Distribución en la Hoja:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setColumns(1)}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                columns === 1
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              1 Columna (Amplio)
            </button>
            <button
              type="button"
              onClick={() => setColumns(2)}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                columns === 2
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              2 Columnas (Bistró París ⭐)
            </button>
          </div>
        </div>

        {/* Selector de Densidad / Tamaño */}
        <div className="pt-3 border-t border-neutral-100 mt-3">
          <div className="text-[11px] font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
            <FileText size={13} /> Densidad de Texto:
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: 'compact', label: 'Compacto' },
              { key: 'normal', label: 'Normal' },
              { key: 'spacious', label: 'Espacioso' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setDensity(item.key)}
                className={`py-1.5 text-[11px] font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                  density === item.key
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card: Filtro de Categorías */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Layers size={14} /> Categorías ({filteredCategoriesCount}/{categories.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAllCategories}
              className="text-[11px] font-bold text-neutral-900 hover:underline cursor-pointer"
            >
              Todas
            </button>
            <span className="text-neutral-300">•</span>
            <button
              type="button"
              onClick={onDeselectAllCategories}
              className="text-[11px] font-bold text-neutral-500 hover:underline cursor-pointer"
            >
              Ninguna
            </button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const isSelected = selectedCategoryIds.includes(cat.id);
            const count = (productsByCategory[cat.slug] || []).length;
            return (
              <label
                key={cat.id}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleCategory(cat.id)}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="text-[10px] font-medium text-neutral-400">{count} platos</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Card: Elementos a mostrar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <Settings2 size={14} /> Opciones de Visualización
        </h3>

        <label className="flex items-center justify-between text-xs font-bold text-neutral-700 cursor-pointer">
          <span>Mostrar descripciones de ingredientes</span>
          <input
            type="checkbox"
            checked={showDescriptions}
            onChange={(e) => setShowDescriptions(e.target.checked)}
            className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
        </label>

        <label className="flex items-center justify-between text-xs font-bold text-neutral-700 cursor-pointer">
          <span>Incluir Código QR de la carta digital</span>
          <input
            type="checkbox"
            checked={showQr}
            onChange={(e) => setShowQr(e.target.checked)}
            className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
        </label>

        <label className="flex items-center justify-between text-xs font-bold text-neutral-700 cursor-pointer">
          <span>Nota de empaque / garantía de frescura</span>
          <input
            type="checkbox"
            checked={showExtrasNote}
            onChange={(e) => setShowExtrasNote(e.target.checked)}
            className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
        </label>
      </div>

      {/* Card: Acción de Exportación y Cobro */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
          Exportar Carta (A4)
        </h3>

        {canPrintFree ? (
          <div>
            <button
              type="button"
              onClick={onPrint}
              className="w-full bg-neutral-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 text-sm cursor-pointer"
            >
              <Printer size={18} />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <p className="text-[11px] text-neutral-500 text-center mt-2">
              Se abrirá el cuadro de diálogo para guardar el PDF completo con todas las páginas sin cortes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onRequestFaceViaWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-98 text-sm cursor-pointer"
            >
              <MessageCircle size={18} />
              <span>Activar Cara ({formatCOP(printTier.pricePerFace)}) vía WhatsApp</span>
            </button>
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 text-[11px] text-neutral-600 leading-relaxed">
              💡 <strong>¿Cómo funciona?</strong> Al dar clic, se abrirá un chat directo con administración de Aluna para activar tu cara en 2 minutos mediante Nequi o Bancolombia.
            </div>
            <button
              type="button"
              onClick={onPrint}
              className="w-full border border-neutral-300 text-neutral-700 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-neutral-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye size={14} />
              <span>Ver Prueba de Impresión (Borrador)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
