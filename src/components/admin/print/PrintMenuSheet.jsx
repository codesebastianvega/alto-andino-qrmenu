import React from 'react';
import * as QRCodePkg from 'react-qr-code';
import { formatCOP } from '../../../utils/money';

const QRCodeComponent =
  QRCodePkg.QRCode && (typeof QRCodePkg.QRCode === 'function' || QRCodePkg.QRCode.$$typeof)
    ? QRCodePkg.QRCode
    : QRCodePkg.default &&
      (typeof QRCodePkg.default === 'function' || QRCodePkg.default.$$typeof)
    ? QRCodePkg.default
    : typeof QRCodePkg === 'function' || QRCodePkg.$$typeof
    ? QRCodePkg
    : null;

export default function PrintMenuSheet({
  isForPrint = false,
  brandLogo,
  brandName,
  primaryColor = '#BC0E0E',
  brandAddress,
  brandPhone,
  menuUrl,
  filteredCategories = [],
  template = 'bistro',
  columns = 2,
  density = 'compact',
  showDescriptions = true,
  showQr = true,
  showExtrasNote = true,
}) {
  return (
    <div
      style={{
        width: isForPrint ? '100%' : '210mm',
        minHeight: isForPrint ? '0' : '297mm',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif",
      }}
      className={
        isForPrint
          ? 'bg-white text-neutral-900 block'
          : 'p-8 sm:p-10 shadow-2xl rounded-sm border border-neutral-200 bg-white block'
      }
    >
      {/* ─── ENCABEZADO DE LA CARTA ─── */}
      <header
        style={{ borderBottomColor: primaryColor }}
        className="flex justify-between items-center pb-3 border-b-2 mb-4 break-inside-avoid"
      >
        <div className="flex items-center gap-3.5">
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={brandName}
              crossOrigin="anonymous"
              className="w-14 h-14 object-contain rounded-xl border border-neutral-200 p-1 bg-white"
            />
          ) : (
            <div
              style={{ backgroundColor: primaryColor }}
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-xl"
            >
              {brandName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1
              style={{ color: primaryColor }}
              className="text-2xl font-black tracking-tight leading-none"
            >
              {brandName}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-1">
              Menú de Selección Oficial
            </p>
          </div>
        </div>

        <div className="text-right text-[10px] text-neutral-600 leading-tight">
          <div className="font-bold text-neutral-900">{brandAddress}</div>
          {brandPhone && (
            <div>
              Tel / Pedidos: <strong>{brandPhone}</strong>
            </div>
          )}
          <div>
            Moneda: <strong>Pesos Colombianos (COP)</strong>
          </div>
        </div>
      </header>

      {/* ─── CONTENIDO DE CATEGORÍAS Y PLATOS ─── */}
      <div className="space-y-4">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="mb-4 break-inside-auto">
            {/* Título de categoría */}
            <div
              className="flex items-center justify-between bg-neutral-50 border-l-4 px-3 py-1.5 rounded-r-md mb-2.5 break-after-avoid"
              style={{ borderLeftColor: primaryColor }}
            >
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                {cat.name}
              </h2>
              <span className="text-[9px] font-semibold text-neutral-400">
                {cat.items.length} opciones
              </span>
            </div>

            {/* Platos según plantilla */}
            {template === 'visual' ? (
              <div
                className={columns === 2 ? 'columns-2 gap-3 [column-fill:_auto]' : 'space-y-2.5'}
              >
                {cat.items.map((p) => (
                  <div
                    key={p.id}
                    className={`inline-block w-full rounded-xl border border-neutral-200/90 bg-white break-inside-avoid ${
                      density === 'compact'
                        ? 'p-1.5 mb-2'
                        : density === 'spacious'
                        ? 'p-3 mb-3'
                        : 'p-2 mb-2.5'
                    }`}
                  >
                    <div className="flex gap-2.5">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          crossOrigin="anonymous"
                          loading="eager"
                          className="w-16 h-16 object-cover rounded-lg shrink-0 border border-neutral-100 bg-neutral-50"
                        />
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-baseline gap-1">
                            <h4
                              className={`font-extrabold text-neutral-900 leading-tight truncate ${
                                density === 'compact'
                                  ? 'text-[11px]'
                                  : density === 'spacious'
                                  ? 'text-[12.5px]'
                                  : 'text-[11.5px]'
                              }`}
                            >
                              {p.name}
                            </h4>
                            <span
                              style={{ color: primaryColor }}
                              className={`font-extrabold shrink-0 ${
                                density === 'compact' ? 'text-[11px]' : 'text-[11.5px]'
                              }`}
                            >
                              {formatCOP(p.price)}
                            </span>
                          </div>
                          {showDescriptions && p.description && (
                            <p
                              className={`text-neutral-500 leading-tight line-clamp-2 mt-0.5 ${
                                density === 'compact' ? 'text-[8.5px]' : 'text-[9px]'
                              }`}
                            >
                              {p.description}
                            </p>
                          )}
                        </div>
                        {p.tags?.[0] && (
                          <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 mt-0.5">
                            • {p.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Plantilla Bistró (Minimalista) */
              <div
                className={columns === 2 ? 'columns-2 gap-6 [column-fill:_auto]' : 'space-y-1.5'}
              >
                {cat.items.map((p) => (
                  <div
                    key={p.id}
                    className={`inline-block w-full border-b border-neutral-100 break-inside-avoid ${
                      density === 'compact'
                        ? 'pb-1 mb-1'
                        : density === 'spacious'
                        ? 'pb-2 mb-2'
                        : 'pb-1.5 mb-1.5'
                    }`}
                  >
                    <div className="flex justify-between items-baseline">
                      <h4
                        className={`font-bold text-neutral-900 ${
                          density === 'compact'
                            ? 'text-[11px]'
                            : density === 'spacious'
                            ? 'text-[13px]'
                            : 'text-xs'
                        }`}
                      >
                        {p.name}
                      </h4>
                      <div className="flex-1 border-b border-dotted border-neutral-300 mx-2" />
                      <span
                        style={{ color: primaryColor }}
                        className={`font-black shrink-0 ${
                          density === 'compact'
                            ? 'text-[11px]'
                            : density === 'spacious'
                            ? 'text-[13px]'
                            : 'text-xs'
                        }`}
                      >
                        {formatCOP(p.price)}
                      </span>
                    </div>
                    {showDescriptions && p.description && (
                      <p
                        className={`text-neutral-500 leading-tight mt-0.5 ${
                          density === 'compact'
                            ? 'text-[8.5px]'
                            : density === 'spacious'
                            ? 'text-[10px]'
                            : 'text-[9.5px]'
                        }`}
                      >
                        {p.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-neutral-400 text-xs">
            Selecciona al menos una categoría con productos para previsualizar.
          </div>
        )}
      </div>

      {/* ─── NOTA DE EMPAQUE / CALIDAD ─── */}
      {showExtrasNote && (
        <div className="mt-5 p-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 text-center break-inside-avoid">
          <p className="text-[9.5px] text-neutral-600 font-medium">
            ✓ Todos nuestros platos son elaborados al momento con ingredientes frescos
            seleccionados. Empaque hermético de alta calidad apto para delivery seguro.
          </p>
        </div>
      )}

      {/* ─── FOOTER CON QR Y VERIFICACIÓN ─── */}
      <footer className="pt-3 border-t border-neutral-200 flex justify-between items-center mt-6 break-inside-avoid">
        <div className="text-[9px] text-neutral-500">
          <div>
            <strong>{brandName}</strong> • Catálogo oficial sincronizado en tiempo real.
          </div>
          <div className="text-[8px] text-neutral-400 mt-0.5">
            Precios vigentes en pesos colombianos (COP). Impreso vía Aluna QR Menu.
          </div>
        </div>

        {showQr && QRCodeComponent && (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[8.5px] font-black uppercase tracking-wider text-neutral-800">
                Pide desde tu celular
              </div>
              <div className="text-[7.5px] text-neutral-400">
                Escanea para ver menú interactivo
              </div>
            </div>
            <div className="p-1 bg-white border border-neutral-200 rounded-lg">
              <QRCodeComponent value={menuUrl} size={38} level="M" />
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
