import { Badge } from '../ui';
import { formatCOP } from '../../../utils/money';
import AAImage from '../../ui/AAImage';
import { STOCK_BADGE } from '../../../hooks/products/useAdminProductsPageData';

export default function ProductsMobileCards({
  filtered,
  confirmDelete,
  setConfirmDelete,
  handleDelete,
  handleEdit,
  toggleStock,
  toggleActive
}) {
  return (
    <div className="md:hidden flex flex-col gap-4">
      {filtered.map((product) => {
        const stock = STOCK_BADGE[product.stock_status] || STOCK_BADGE.out;
        const catName = product.category?.name || product.categories?.name;
        const isDelConf = confirmDelete === product.id;

        // Vista de confirmación de eliminación en móvil
        if (isDelConf) return (
          <div key={product.id} className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col gap-3">
            <p className="text-sm font-bold text-red-700">¿Eliminar "{product.name}"? No se puede deshacer.</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleDelete(product.id)} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase">Eliminar</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-xs font-black uppercase">Cancelar</button>
            </div>
          </div>
        );

        // Tarjeta Premium de Producto
        return (
          <div key={product.id} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col gap-3 relative overflow-hidden">
            {/* Header de Tarjeta: Info Principal */}
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shrink-0 bg-gray-50 flex items-center justify-center">
                <AAImage src={product.image_url} alt={product.name} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">{catName || 'Sin cat.'}</p>
                <h4 className="text-base font-black text-gray-900 leading-tight truncate">{product.name}</h4>
                <p className="text-sm font-black text-emerald-600 mt-0.5">{formatCOP(product.price)}</p>
              </div>
              {/* Botones de acción arriba a la derecha */}
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => handleEdit(product)} className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-500 rounded-lg border border-gray-100 active:scale-95" title="Editar producto">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button onClick={() => setConfirmDelete(product.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg border border-red-100 active:scale-95" title="Eliminar producto">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            {/* Footer de Tarjeta: Toggles Rápidos (Stock y Estado) */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <button onClick={() => toggleStock(product.id, product.stock_status)} className="active:scale-95 transition-transform">
                <Badge variant={stock.variant}>{stock.label}</Badge>
              </button>
              
              <button onClick={() => toggleActive(product.id, product.is_active)} className="active:scale-95 transition-transform">
                <Badge variant={product.is_active ? 'green' : 'red'}>
                  {product.is_active ? 'Activo (Visible)' : 'Oculto'}
                </Badge>
              </button>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sin resultados</p>
        </div>
      )}
    </div>
  );
}
