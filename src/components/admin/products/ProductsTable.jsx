import { TableContainer, Th, Badge } from '../ui';
import { formatCOP } from '../../../utils/money';
import AAImage from '../../ui/AAImage';
import { STOCK_BADGE } from '../../../hooks/products/useAdminProductsPageData';

export default function ProductsTable({
  filtered,
  recipes,
  locationFilter,
  confirmDelete,
  setConfirmDelete,
  handleDelete,
  handleEdit,
  toggleStock,
  toggleActive,
  getVisibilityStatus,
  search,
  catFilter,
  attrFilter,
  marginFilter
}) {
  return (
    <div className="hidden md:block">
      <TableContainer>
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Producto</Th>
              <Th>Categoría</Th>
              <Th>Precio / Margen</Th>
              <Th>Stock</Th>
              <Th>Estado</Th>
              <Th>Receta</Th>
              <Th>Atributos</Th>
              {locationFilter !== 'all' && <Th>Menú Público</Th>}
              <Th>Actualizado</Th>
              <Th right>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((product, idx) => {
              const stock   = STOCK_BADGE[product.stock_status] || STOCK_BADGE.out;
              const recipe  = recipes.find(r => r.id === product.recipe_id);
              const catName = product.category?.name || product.categories?.name;
              const isDelConf = confirmDelete === product.id;

              // Inline delete confirmation row
              if (isDelConf) return (
                <tr key={product.id}>
                  <td colSpan={locationFilter !== 'all' ? 11 : 10} className="px-5 py-3 bg-red-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-red-700">
                        ¿Eliminar <strong>"{product.name}"</strong>? Esta acción no se puede deshacer.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[12px] font-semibold hover:bg-red-700 transition-all">
                          Eliminar
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[12px] font-semibold hover:bg-gray-50 transition-all">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );

              return (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3.5 text-xs text-gray-400 font-medium">#{idx + 1}</td>
                  
                  {/* Name and Image */}
                  <td className="px-5 py-3.5 min-w-[300px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                        <AAImage src={product.image_url} alt={product.name} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</span>
                        <span className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{product.description || 'Sin descripción'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category & Subcategory */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[12px] font-semibold text-gray-700 px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">
                        {catName || 'Sin cat.'}
                      </span>
                      {product.subcategory && (
                        <span className="text-[10px] font-semibold text-blue-600 px-2 py-0.5 bg-blue-50/70 rounded-md border border-blue-100/70">
                          {product.subcategory}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Precio, Costo & Margen (3 en 1) */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {(() => {
                      const locPrice = (locationFilter !== 'all') 
                        ? product.location_product_prices?.find(lp => lp.location_id === locationFilter)?.price 
                        : null;
                      
                      const displayPrice = locPrice !== null && locPrice !== undefined ? locPrice : product.price;
                      const isOverridden = locPrice !== null && locPrice !== undefined;

                      const hasMargin = product.cost > 0 && product.price > 0;
                      const margin = hasMargin ? ((product.price - product.cost) / product.price) * 100 : 0;
                      const marginColor = margin >= 45 
                        ? 'text-green-700 bg-green-50 border-green-200' 
                        : margin >= 25 
                          ? 'text-orange-700 bg-orange-50 border-orange-200' 
                          : 'text-red-700 bg-red-50 border-red-200';

                      return (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-gray-900 tabular-nums">
                              {formatCOP(displayPrice)}
                            </span>
                            {hasMargin && (
                              <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-extrabold tabular-nums border ${marginColor}`}>
                                {margin.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                            <span>Costo:</span>
                            <span className="text-gray-600 font-semibold tabular-nums">
                              {product.cost > 0 ? formatCOP(product.cost) : '—'}
                            </span>
                            {isOverridden && (
                              <span className="text-[9px] font-bold text-blue-500 uppercase ml-1">Sede</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Stock */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <button 
                      onClick={() => toggleStock(product.id, product.stock_status)}
                      className="group/stock active:scale-95 transition-all"
                    >
                      <Badge variant={stock.variant}>{stock.label}</Badge>
                    </button>
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <button onClick={() => toggleActive(product.id, product.is_active)}>
                      <Badge variant={product.is_active ? 'green' : 'red'}>
                        {product.is_active ? 'Activo' : 'Oculto'}
                      </Badge>
                    </button>
                  </td>

                  {/* Receta */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {recipe ? (
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-teal-600">{recipe.name}</span>
                        <span className="text-[10px] text-gray-400">Vinculado</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic">Sin receta</span>
                    )}
                  </td>

                  {/* Atributos */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {product.station === 'bar' ? (
                        <span title="Estación: Barra (BDS)" className="w-6 h-6 flex items-center justify-center bg-cyan-50 text-cyan-600 rounded-lg border border-cyan-200 shadow-xs cursor-help transition-transform hover:scale-110">
                          <span className="text-[12px]">🍸</span>
                        </span>
                      ) : (product.station === 'none' || product.requires_kitchen === false) ? (
                        <span title="Salida Directa (Sin Estación)" className="w-6 h-6 flex items-center justify-center bg-slate-50 text-slate-500 rounded-lg border border-slate-200 shadow-xs cursor-help transition-transform hover:scale-110">
                          <span className="text-[12px]">⚡</span>
                        </span>
                      ) : (
                        <span title="Estación: Cocina (KDS)" className="w-6 h-6 flex items-center justify-center bg-orange-50 text-orange-600 rounded-lg border border-orange-200 shadow-xs cursor-help transition-transform hover:scale-110">
                          <span className="text-[12px]">🍳</span>
                        </span>
                      )}
                      {product.is_upsell && (
                        <span title="Sugerido para Upsell" className="w-6 h-6 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg border border-amber-100 shadow-xs cursor-help transition-transform hover:scale-110">
                          <span className="text-[12px]">✨</span>
                        </span>
                      )}
                      {product.packaging_fee > 0 && (
                        <span title={`Costo de empaque: ${formatCOP(product.packaging_fee)}`} className="w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg border border-gray-100 shadow-xs cursor-help transition-transform hover:scale-110">
                          <span className="text-[12px]">📦</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Menú Público — Visibility Helper */}
                  {locationFilter !== 'all' && (() => {
                    const vis = getVisibilityStatus(product);
                    const Icon = vis.icon;
                    return (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          title={vis.label}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${vis.color}`}
                        >
                          {Icon && <Icon size={13} strokeWidth={2.5} />}
                          {vis.label}
                        </span>
                      </td>
                    );
                  })()}

                  {/* Actualizado */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-[11px] text-gray-500 font-medium">
                      {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '—'}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 min-w-[120px]">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar producto"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar producto"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filtered.length === 0 && (
              <tr>
                <td colSpan={locationFilter !== 'all' ? 11 : 10} className="px-5 py-16 text-center text-gray-400 text-sm font-medium">
                  {search || catFilter !== 'all' || attrFilter !== 'all' || marginFilter !== 'all'
                    ? 'Sin resultados para los filtros actuales.'
                    : 'Aún no hay productos. Crea el primero.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
