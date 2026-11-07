import { Link } from 'react-router-dom';
import { PageHeader, PrimaryButton } from '../ui';
import { AlertTriangle, Printer } from 'lucide-react';

export default function ProductsHeader({
  productsCount,
  maxProducts,
  isAtLimit,
  isTrialActive,
  isWithinProductLimit,
  planName,
  onOpenDailySpecial,
  onCreateProduct
}) {
  return (
    <>
      <PageHeader
        badge="Administración"
        title="Productos"
        subtitle="Gestiona el catálogo de tu menú digital."
      >
        <div className="flex flex-row items-center justify-between gap-3 w-full sm:w-auto sm:justify-start">
          <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-gray-500 shadow-sm italic flex flex-col items-start sm:items-end shrink-0">
            <span className="text-[8px] text-gray-400 leading-none mb-0.5">Cupo de Catálogo</span>
            <span className={`text-[10px] leading-none ${isAtLimit ? 'text-orange-600' : 'text-gray-900'}`}>
              {productsCount} / {maxProducts} PRODS
            </span>
          </div>
          
          <button
            type="button"
            onClick={onOpenDailySpecial}
            className="flex items-center gap-1.5 py-2.5 px-3.5 sm:py-3 sm:px-4 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Configurar Almuerzos de Hoy y Menú del Día"
          >
            <span className="text-base">🍱</span>
            <span className="hidden sm:inline">Almuerzos & Menú del Día</span>
            <span className="sm:hidden">Almuerzos</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('aluna:action', { detail: { target: 'menu_print' } }));
            }}
            className="flex items-center gap-1.5 py-2.5 px-3.5 sm:py-3 sm:px-4 text-xs font-bold rounded-xl border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 shadow-xs transition-colors shrink-0"
            title="Generador de Carta Imprimible y PDF para Rappi / DiDi"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Imprimir Carta</span>
            <span className="sm:hidden">PDF</span>
          </button>
          
          <PrimaryButton 
            onClick={onCreateProduct} 
            disabled={isAtLimit}
            className="flex-1 sm:flex-initial py-2.5 px-4 text-xs sm:text-sm sm:py-3 sm:px-6 shadow-xl"
          >
            {isAtLimit ? 'Límite alcanzado' : '+ Nuevo Producto'}
          </PrimaryButton>
        </div>
      </PageHeader>

      {/* Product Limit Banner */}
      {!isTrialActive && !isWithinProductLimit && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100 rounded-[2rem] p-6 mb-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-500 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Límite de productos alcanzado
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Has alcanzado el límite de productos de tu plan <span className="font-bold text-orange-600 uppercase">{planName}</span>. 
                Mejora tu plan para seguir expandiendo tu menú.
              </p>
            </div>
          </div>
          <Link 
            to="/admin/settings?tab=plan"
            className="px-6 py-2.5 bg-gray-900 text-white text-[13px] font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md shrink-0"
          >
            Ver Planes
          </Link>
        </div>
      )}
    </>
  );
}
