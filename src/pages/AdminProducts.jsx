import { useState, useEffect } from 'react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useCategories } from '../hooks/useCategories';
import { useAdminRecipes } from '../hooks/useAdminRecipes';
import { formatCOP } from '../utils/money';
import ProductForm from '../components/admin/ProductForm';
import {
  PageHeader, PrimaryButton, Badge,
  TableContainer, Th, SearchInput, SelectInput
} from '../components/admin/ui';

const STOCK_BADGE = {
  in:  { label: 'Disponible', variant: 'green' },
  low: { label: 'Stock bajo', variant: 'amber' },
  out: { label: 'Agotado',    variant: 'red'   },
};

export default function AdminProducts() {
  const { products, loading: loadingProd, createProduct, updateProduct, deleteProduct, toggleActive, toggleStock } = useAdminProducts();
  const { categories, loading: loadingCats } = useCategories();
  const { recipes, fetchRecipes } = useAdminRecipes();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  if (loadingProd || loadingCats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        Cargando productos…
      </div>
    );
  }

  const filtered = products.filter(p => {
    if (p.is_addon) return false;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || p.category_id === catFilter;
    return matchSearch && matchCat;
  });

  const handleEdit   = (p) => { setEditingProduct(p); setIsFormOpen(true); setConfirmDelete(null); };
  const handleCreate = ()  => { setEditingProduct(null); setIsFormOpen(true); setConfirmDelete(null); };
  const handleDelete = async (id) => {
    await deleteProduct(id);
    setConfirmDelete(null);
  };
  const handleSave = async (data) => {
    const ok = editingProduct
      ? await updateProduct(editingProduct.id, data)
      : await createProduct(data);
    if (ok) { setIsFormOpen(false); setEditingProduct(null); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        badge="Carta"
        title="Productos"
        subtitle={`${filtered.length} de ${products.filter(p => !p.is_addon).length} productos`}
      >
        <PrimaryButton onClick={handleCreate}>+ Nuevo producto</PrimaryButton>
      </PageHeader>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="md:col-span-2">
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
          />
        </div>
        <SelectInput value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectInput>
      </div>

      {/* Table */}
      <TableContainer>
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              <Th>Producto</Th>
              <Th>Categoría</Th>
              <Th>Precio</Th>
              <Th>Stock</Th>
              <Th>Receta</Th>
              <Th>Estado</Th>
              <Th right>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(product => {
              const stock   = STOCK_BADGE[product.stock_status] || STOCK_BADGE.out;
              const recipe  = recipes.find(r => r.id === product.recipe_id);
              const catName = product.category?.name || product.categories?.name;
              const isDelConf = confirmDelete === product.id;

              // Inline delete confirmation row
              if (isDelConf) return (
                <tr key={product.id}>
                  <td colSpan={7} className="px-5 py-3 bg-red-50">
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
                <tr key={product.id} className="group hover:bg-gray-50/60 transition-colors">
                  {/* Producto */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {product.image_url ? (
                          <>
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                            <span className="text-base hidden items-center justify-center w-full h-full">🍽</span>
                          </>
                        ) : (
                          <span className="text-base">🍽</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</p>
                        {product.description && (
                          <p className="text-[12px] text-gray-400 font-medium truncate max-w-[180px] mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Categoría */}
                  <td className="px-5 py-3.5">
                    <Badge variant="gray">{catName || '—'}</Badge>
                  </td>

                  {/* Precio */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCOP(product.price)}</p>
                    {product.cost > 0 && (
                      <p className="text-[11px] text-gray-400 font-medium tabular-nums mt-0.5">
                        Costo {formatCOP(product.cost)}
                      </p>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleStock(product.id, product.stock_status)}
                      title="Click para cambiar disponibilidad"
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all hover:opacity-70 active:scale-95 cursor-pointer ${
                        stock.variant === 'green'  ? 'bg-green-50 text-green-700 border-green-100' :
                        stock.variant === 'amber'  ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                     'bg-red-50 text-red-600 border-red-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        stock.variant === 'green' ? 'bg-green-500' :
                        stock.variant === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                      }`}/>
                      {stock.label}
                    </button>
                  </td>

                  {/* Receta */}
                  <td className="px-5 py-3.5">
                    {recipe ? (
                      <Badge variant="indigo">{recipe.name}</Badge>
                    ) : (
                      <span className="text-[12px] text-gray-300 font-medium">—</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(product.id, product.is_active)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all hover:opacity-80 ${
                        product.is_active
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(product.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="px-5 py-16 text-center text-gray-400 text-sm font-medium">
                  {search || catFilter !== 'all'
                    ? 'Sin resultados para los filtros actuales.'
                    : 'Aún no hay productos. Crea el primero.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>

      {/* Form modal */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          recipes={recipes}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}
