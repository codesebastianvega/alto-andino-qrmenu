import { formatCOP } from '../../../utils/money';
import { DragHandle } from './ProductsFilterToolbar';
import { STOCK_BADGE } from '../../../hooks/products/useAdminProductsPageData';

export default function ProductsReorderView({
  categories,
  catFilter,
  orderedList,
  dragIdx,
  overIdx,
  handleDragStart,
  handleDragEnter,
  handleDragEnd,
  exitReorderMode,
  saveOrder
}) {
  const catName = categories.find(c => c.id === catFilter)?.name || 'Categoría';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Ordenar productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Arrastra para reordenar — <strong>{catName}</strong></p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exitReorderMode}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={saveOrder}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            Guardar orden
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {orderedList.map((product, idx) => (
          <div
            key={product.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-grab active:cursor-grabbing select-none transition-all ${
              dragIdx === idx ? 'opacity-40 scale-[0.98]' : ''
            } ${overIdx === idx && dragIdx !== idx ? 'bg-blue-50/60 border-blue-200' : 'hover:bg-gray-50/60'}`}
          >
            {/* Drag handle */}
            <span className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <DragHandle />
            </span>

            {/* Position number */}
            <span className="text-[11px] text-gray-300 font-bold w-5 text-center tabular-nums shrink-0">
              {idx + 1}
            </span>

            {/* Image */}
            <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base">🍽</span>
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              <p className="text-[11px] text-gray-400 font-medium tabular-nums">{formatCOP(product.price)}</p>
            </div>

            {/* Stock badge */}
            {(() => {
              const stock = STOCK_BADGE[product.stock_status] || STOCK_BADGE.out;
              return (
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  stock.variant === 'green'  ? 'bg-green-50 text-green-700 border-green-100' :
                  stock.variant === 'amber'  ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                               'bg-red-50 text-red-600 border-red-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    stock.variant === 'green' ? 'bg-green-500' :
                    stock.variant === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                  }`}/>
                  {stock.label}
                </span>
              );
            })()}
          </div>
        ))}
        {orderedList.length === 0 && (
          <p className="text-center text-sm text-gray-400 font-medium py-12">
            No hay productos en esta categoría.
          </p>
        )}
      </div>
    </div>
  );
}
