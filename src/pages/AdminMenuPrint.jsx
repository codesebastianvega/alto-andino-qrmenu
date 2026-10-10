import React, { useState, useMemo, useRef } from 'react';
import { 
  Printer, Download, Sparkles, CheckCircle2, MessageCircle, 
  Layers, Palette, Layout, Settings2, Eye, ShieldCheck, 
  HelpCircle, AlertCircle, ArrowUpRight, Smartphone, QrCode
} from 'lucide-react';
import * as QRCodePkg from 'react-qr-code';
import { useAuth } from '../context/AuthContext';

const QRCodeComponent = 
  (QRCodePkg.QRCode && (typeof QRCodePkg.QRCode === 'function' || QRCodePkg.QRCode.$$typeof)) ? QRCodePkg.QRCode :
  (QRCodePkg.default && (typeof QRCodePkg.default === 'function' || QRCodePkg.default.$$typeof)) ? QRCodePkg.default :
  (typeof QRCodePkg === 'function' || QRCodePkg.$$typeof) ? QRCodePkg : null;
import { useMenuData } from '../context/MenuDataContext';
import { formatCOP } from '../utils/money';
import { PRINT_LIMITS_BY_PLAN, PLAN_LABELS } from '../config/plans';

const ALUNA_ADMIN_WHATSAPP = '573222285900';

export default function AdminMenuPrint() {
  const { activeBrand, activePlan } = useAuth();
  const { 
    categories = [], 
    productsByCategory = {}, 
    restaurantSettings, 
    locations = [] 
  } = useMenuData();

  // 1. Identificar plan y cupo
  const planSlug = activeBrand?.plan_slug || activePlan?.slug || 'emprendedor';
  const planInfo = PLAN_LABELS[planSlug] || PLAN_LABELS.emprendedor;
  const printTier = PRINT_LIMITS_BY_PLAN[planSlug] || PRINT_LIMITS_BY_PLAN.emprendedor;
  const isUnlimited = printTier.quota === -1;

  // Estado de simulación de caras usadas (en producción se lee de DB; por ahora dejamos 1 cara disponible en planes con cuota)
  const [facesUsedThisMonth] = useState(0);
  const remainingFreeFaces = isUnlimited ? 999 : Math.max(0, printTier.quota - facesUsedThisMonth);
  const canPrintFree = isUnlimited || remainingFreeFaces > 0;

  // 2. Opciones de configuración de la carta
  const [template, setTemplate] = useState('visual'); // 'visual' | 'bistro'
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => 
    categories.map(c => c.id)
  );
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showExtrasNote, setShowExtrasNote] = useState(true);
  const [zoom, setZoom] = useState(0.85); // Escala para vista previa en pantalla

  const printAreaRef = useRef(null);

  // Datos de marca
  const brandName = restaurantSettings?.business_name || activeBrand?.name || 'Mi Restaurante';
  const brandLogo = restaurantSettings?.logo_url || activeBrand?.logo_url;
  const primaryColor = restaurantSettings?.primary_color || '#BC0E0E';
  const mainLocation = locations.find(l => l.is_main) || locations[0];
  const brandAddress = mainLocation?.address || 'Sede Principal';
  const brandPhone = restaurantSettings?.whatsapp_number_orders || mainLocation?.phone || activeBrand?.phone || '';
  const brandSlug = activeBrand?.slug || 'menu';
  const menuUrl = `https://aluna-qrmenu.vercel.app/${brandSlug}`;

  // Categorías y platos filtrados
  const filteredCategories = useMemo(() => {
    return categories
      .filter(c => selectedCategoryIds.includes(c.id))
      .map(c => ({
        ...c,
        items: productsByCategory[c.slug] || []
      }))
      .filter(c => c.items.length > 0);
  }, [categories, selectedCategoryIds, productsByCategory]);

  const allFilteredProducts = useMemo(() => {
    return filteredCategories.flatMap(c => c.items);
  }, [filteredCategories]);

  // Manejar selección de categorías
  const toggleCategory = (id) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategoryIds(categories.map(c => c.id));
  };

  // Acción para imprimir / guardar en PDF nativo
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Checkout directo hacia administración de Aluna
  const handleRequestFaceViaWhatsApp = () => {
    const costText = formatCOP(printTier.pricePerFace);
    const message = `Hola Aluna Administración 👋\n\nQuiero activar una *Cara Imprimible (PDF Alta Resolución)* para mi restaurante *${brandName}*.\n\n• Plan actual: *${planInfo.name}*\n• Tarifa por cara: *${costText}*\n• Restaurante: *${brandName}* (ID: ${activeBrand?.id?.slice(0, 8) || 'N/A'})\n\n¿Me comparten por favor los datos de transferencia (Nequi / Bancolombia) para proceder con el pago y activar la exportación?`;
    
    const waUrl = `https://wa.me/${ALUNA_ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 p-4 sm:p-6 lg:p-8">
      {/* ─── ESTILOS DE IMPRESIÓN A4 NATIVOS ─── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-sheet, #printable-sheet * {
            visibility: visible;
          }
          #printable-sheet {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 8mm 12mm;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ─── ENCABEZADO DE LA SECCIÓN ─── */}
      <div className="max-w-[1600px] mx-auto mb-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-neutral-900 text-white">
                Módulo Oficial
              </span>
              <span className="text-xs font-bold text-neutral-500">
                Plan {planInfo.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Generador de Carta Imprimible (PDF)
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium">
              Exporta tu carta en alta resolución para imprenta, afiches de mesa, volantes y plataformas de delivery (Rappi / DiDi).
            </p>
          </div>

          {/* Estado de cuota / Caras */}
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 p-3 rounded-xl shrink-0">
            {isUnlimited ? (
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <Sparkles size={18} className="text-amber-500 shrink-0" />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-800">Caras Ilimitadas</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Incluido en tu Plan {planInfo.name}</div>
                </div>
              </div>
            ) : canPrintFree ? (
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-800">
                    {remainingFreeFaces} cara disponible este mes
                  </div>
                  <div className="text-[10px] text-neutral-500 font-normal">Incluida en tu suscripción</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <Layers size={18} className="text-amber-600 shrink-0" />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-neutral-900">
                    {formatCOP(printTier.pricePerFace)} por cara
                  </div>
                  <div className="text-[10px] text-neutral-500 font-normal">Tarifa con descuento Plan {planInfo.name}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── GRID PRINCIPAL: CONTROLES A LA IZQUIERDA / HOJA A LA DERECHA ─── */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL DE CONFIGURACIÓN (COL 4) */}
        <div className="lg:col-span-4 space-y-5 no-print">
          
          {/* Card: Estilos de Plantilla */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Layout size={14} /> Estilo de Plantilla
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTemplate('visual')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  template === 'visual'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="font-extrabold text-xs mb-1">Visual con Fotos</div>
                <div className={`text-[10px] leading-relaxed ${template === 'visual' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  Con fotos a color de cada plato. Ideal para vitrinas, delivery y Rappi.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('bistro')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  template === 'bistro'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="font-extrabold text-xs mb-1">Bistró Clásico</div>
                <div className={`text-[10px] leading-relaxed ${template === 'bistro' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  Tipográfico elegante sin fotos. Ideal para mesa, cafés y gastrobares.
                </div>
              </button>
            </div>
          </div>

          {/* Card: Filtro de Categorías */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Layers size={14} /> Categorías a Incluir
              </h3>
              <button
                type="button"
                onClick={selectAllCategories}
                className="text-[11px] font-bold text-neutral-900 hover:underline"
              >
                Seleccionar todas
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map(cat => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                const count = (productsByCategory[cat.slug] || []).length;
                return (
                  <label 
                    key={cat.id}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isSelected ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span>{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-medium text-neutral-400">
                      {count} platos
                    </span>
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
                  onClick={handlePrint}
                  className="w-full bg-neutral-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 text-sm"
                >
                  <Printer size={18} />
                  <span>Imprimir / Guardar en PDF</span>
                </button>
                <p className="text-[11px] text-neutral-500 text-center mt-2">
                  Se abrirá el cuadro de diálogo oficial para guardar en PDF o imprimir en alta resolución.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleRequestFaceViaWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-98 text-sm"
                >
                  <MessageCircle size={18} />
                  <span>Activar Cara ({formatCOP(printTier.pricePerFace)}) vía WhatsApp</span>
                </button>
                <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 text-[11px] text-neutral-600 leading-relaxed">
                  💡 <strong>¿Cómo funciona?</strong> Al dar clic, se abrirá un chat directo con administración de Aluna para activar tu cara en 2 minutos mediante Nequi o Bancolombia.
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full border border-neutral-300 text-neutral-700 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-neutral-50 flex items-center justify-center gap-1.5"
                >
                  <Eye size={14} />
                  <span>Ver Prueba de Impresión (Borrador)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PREVISUALIZACIÓN HOJA A4 (COL 8) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          
          {/* Barra de control de Zoom */}
          <div className="flex items-center gap-2 mb-3 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-xs text-xs font-bold text-neutral-600 no-print">
            <span>Zoom:</span>
            <button 
              onClick={() => setZoom(0.7)} 
              className={`px-2 py-0.5 rounded ${zoom === 0.7 ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'}`}
            >
              70%
            </button>
            <button 
              onClick={() => setZoom(0.85)} 
              className={`px-2 py-0.5 rounded ${zoom === 0.85 ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'}`}
            >
              85%
            </button>
            <button 
              onClick={() => setZoom(1)} 
              className={`px-2 py-0.5 rounded ${zoom === 1 ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'}`}
            >
              100%
            </button>
          </div>

          {/* CONTENEDOR ESCALADO DE LA HOJA A4 */}
          <div 
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top center',
              width: '210mm',
              minHeight: '297mm'
            }}
            className="transition-transform duration-200 origin-top"
          >
            {/* HOJA A4 IMPRIMIBLE */}
            <div 
              id="printable-sheet"
              ref={printAreaRef}
              style={{
                width: '210mm',
                minHeight: '297mm',
                backgroundColor: '#ffffff',
                color: '#1a1a1a',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
              }}
              className="p-8 sm:p-10 shadow-2xl rounded-sm border border-neutral-200 flex flex-col justify-between"
            >
              <div>
                {/* ─── ENCABEZADO DE LA CARTA ─── */}
                <header 
                  style={{ borderBottomColor: primaryColor }}
                  className="flex justify-between items-center pb-3 border-b-2 mb-4"
                >
                  <div className="flex items-center gap-3.5">
                    {brandLogo ? (
                      <img 
                        src={brandLogo} 
                        alt={brandName} 
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
                    {brandPhone && <div>Tel / Pedidos: <strong>{brandPhone}</strong></div>}
                    <div>Moneda: <strong>Pesos Colombianos (COP)</strong></div>
                  </div>
                </header>

                {/* ─── CONTENIDO DE CATEGORÍAS Y PLATOS ─── */}
                <div className="space-y-4">
                  {filteredCategories.map(cat => (
                    <div key={cat.id}>
                      {/* Título de categoría */}
                      <div className="flex items-center justify-between bg-neutral-50 border-l-4 px-3 py-1.5 rounded-r-md mb-2.5" style={{ borderLeftColor: primaryColor }}>
                        <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                          {cat.name}
                        </h2>
                        <span className="text-[9px] font-semibold text-neutral-400">
                          {cat.items.length} opciones
                        </span>
                      </div>

                      {/* Platos según plantilla */}
                      {template === 'visual' ? (
                        <div className="grid grid-cols-2 gap-2.5">
                          {cat.items.map(p => (
                            <div 
                              key={p.id}
                              className="flex gap-2.5 p-2 rounded-xl border border-neutral-200/90 bg-white"
                            >
                              {p.image_url && (
                                <img 
                                  src={p.image_url} 
                                  alt={p.name} 
                                  className="w-16 h-16 object-cover rounded-lg shrink-0 border border-neutral-100 bg-neutral-50"
                                />
                              )}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-baseline gap-1">
                                    <h4 className="text-[11.5px] font-extrabold text-neutral-900 leading-tight truncate">
                                      {p.name}
                                    </h4>
                                    <span 
                                      style={{ color: primaryColor }}
                                      className="text-[11.5px] font-extrabold shrink-0"
                                    >
                                      {formatCOP(p.price)}
                                    </span>
                                  </div>
                                  {showDescriptions && p.description && (
                                    <p className="text-[9px] text-neutral-500 leading-tight line-clamp-2 mt-1">
                                      {p.description}
                                    </p>
                                  )}
                                </div>
                                {p.tags?.[0] && (
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
                                    • {p.tags[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Plantilla Bistró (Minimalista) */
                        <div className="space-y-2">
                          {cat.items.map(p => (
                            <div key={p.id} className="pb-1.5 border-b border-neutral-100 last:border-b-0">
                              <div className="flex justify-between items-baseline">
                                <h4 className="text-xs font-bold text-neutral-900">
                                  {p.name}
                                </h4>
                                <div className="flex-1 border-b border-dotted border-neutral-300 mx-2" />
                                <span style={{ color: primaryColor }} className="text-xs font-black">
                                  {formatCOP(p.price)}
                                </span>
                              </div>
                              {showDescriptions && p.description && (
                                <p className="text-[9.5px] text-neutral-500 leading-tight mt-0.5">
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
                  <div className="mt-4 p-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 text-center">
                    <p className="text-[9.5px] text-neutral-600 font-medium">
                      ✓ Todos nuestros platos son elaborados al momento con ingredientes frescos seleccionados. Empaque hermético de alta calidad apto para delivery seguro.
                    </p>
                  </div>
                )}
              </div>

              {/* ─── FOOTER CON QR Y VERIFICACIÓN ─── */}
              <footer className="pt-3 border-t border-neutral-200 flex justify-between items-center mt-6">
                <div className="text-[9px] text-neutral-500">
                  <div><strong>{brandName}</strong> • Catálogo oficial sincronizado en tiempo real.</div>
                  <div className="text-[8px] text-neutral-400 mt-0.5">Precios vigentes en pesos colombianos (COP). Impreso vía Aluna QR Menu.</div>
                </div>

                {showQr && QRCodeComponent && (
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[8.5px] font-black uppercase tracking-wider text-neutral-800">
                        Pide desde tu celular
                      </div>
                      <div className="text-[7.5px] text-neutral-400">Escanea para ver menú interactivo</div>
                    </div>
                    <div className="p-1 bg-white border border-neutral-200 rounded-lg">
                      <QRCodeComponent 
                        value={menuUrl} 
                        size={38}
                        level="M"
                      />
                    </div>
                  </div>
                )}
              </footer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
