import { Icon } from '@iconify-icon/react';
import { formatCOP } from '../../../utils/money';

export default function MustTrySectionCard({
  data,
  setData,
  mustTrySearch,
  setMustTrySearch,
  mustTryCategory,
  setMustTryCategory,
  allCategories = [],
  filteredProducts = [],
  toggleMustTryProduct,
  handleAddItem,
  handleRemoveItem,
  handleChangeItem
}) {
  return (
    <div className="space-y-5 mt-5">
      {/* FAVORITOS DE LA COMUNIDAD (MUST TRY) */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Favoritos de la Comunidad</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  (data.featured_items?.length || 0) >= 8 ? 'bg-amber-100 text-amber-700' : 'bg-[#2f4131]/10 text-[#2f4131]'
                }`}>
                  {data.featured_items?.length || 0} / 8 Seleccionados
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Gestiona los platos que aparecen en la sección destacada de la Landing Page.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">Título Sección:</span>
              <input
                value={data.featured_items_title || ''}
                onChange={(e) => setData({ ...data, featured_items_title: e.target.value })}
                placeholder="Ej. Must Try"
                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 min-w-[120px]"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={mustTrySearch}
                onChange={(e) => setMustTrySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 placeholder:text-gray-400"
              />
            </div>
            <select
              value={mustTryCategory}
              onChange={(e) => setMustTryCategory(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 min-w-[150px] cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected List - Horizontal Scroll */}
        {data.featured_items?.length > 0 && (
          <div className="bg-gray-50/30 border-b border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Orden de Visualización:</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {data.featured_items.map((item, idx) => (
                <div key={item.product_id} className="relative shrink-0 group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#2f4131]/20 bg-white">
                    <img src={item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMustTryProduct({ id: item.product_id })}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Icon icon="heroicons:x-mark" className="text-[10px] block" />
                  </button>
                  <span className="absolute -bottom-1 -right-1 bg-[#2f4131] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid for Selection */}
        <div className="p-5 overflow-y-auto max-h-[400px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400">
              <Icon icon="heroicons:magnifying-glass" className="text-3xl mb-2 mx-auto" />
              <p className="text-sm">No se encontraron productos con esos filtros.</p>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const isSelected = data.featured_items?.some(item => item.product_id === prod.id);
              const isAtLimit = (data.featured_items?.length || 0) >= 8 && !isSelected;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isAtLimit && toggleMustTryProduct(prod)}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#2f4131] bg-[#2f4131]/5 shadow-sm'
                      : isAtLimit
                        ? 'opacity-40 border-gray-100 bg-gray-50/50 cursor-not-allowed'
                        : 'border-gray-200/70 hover:border-gray-300 hover:bg-gray-50/50 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin foto</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#2f4131]' : 'text-gray-900'}`}>{prod.name}</p>
                    <p className="text-[10px] text-gray-400">{prod.categories?.name || 'General'}</p>
                    <p className="text-xs font-black text-gray-700 mt-0.5">{formatCOP(prod.price)}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors shrink-0 ${
                    isSelected ? 'bg-[#2f4131] text-white' : 'border border-gray-300 text-transparent'
                  }`}>
                    <Icon icon="heroicons:check" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* REVIEWS / TESTIMONIOS */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Testimonios de Clientes</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Reseñas y testimonios de tus clientes.</p>
          </div>
          <button
            type="button"
            onClick={() => handleAddItem('reviews', { name: '', role: '', text: '', rating: 5, img: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-[#2f4131] text-white rounded-xl text-xs font-bold hover:bg-[#243420] transition-colors cursor-pointer"
          >
            <Icon icon="heroicons:plus" /> Agregar Reseña
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 gap-4">
          {data.reviews?.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Icon icon="heroicons:chat-bubble-left-right" className="text-3xl mb-1 mx-auto" />
              <p className="text-xs font-medium">No hay reseñas aún.</p>
            </div>
          )}
          {data.reviews?.map((rev, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2f4131]/10 overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold text-[#2f4131]">
                  {rev.img ? (
                    <img src={rev.img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    rev.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={rev.name}
                      onChange={(e) => handleChangeItem('reviews', idx, 'name', e.target.value)}
                      placeholder="Nombre"
                      className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10"
                    />
                    <input
                      value={rev.role}
                      onChange={(e) => handleChangeItem('reviews', idx, 'role', e.target.value)}
                      placeholder="Rol (ej. Foodie)"
                      className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10"
                    />
                  </div>
                  <textarea
                    value={rev.text}
                    onChange={(e) => handleChangeItem('reviews', idx, 'text', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 resize-none"
                    placeholder="Testimonio..."
                    rows={1}
                  />
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleChangeItem('reviews', idx, 'rating', star)}
                          className={`text-base transition-colors cursor-pointer ${star <= (rev.rating || 5) ? 'text-[#E6B05C]' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <input
                      value={rev.img}
                      onChange={(e) => handleChangeItem('reviews', idx, 'img', e.target.value)}
                      placeholder="URL avatar (opcional)"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#2f4131]/10"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('reviews', idx)}
                      className="text-red-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer"
                    >
                      <Icon icon="heroicons:trash" className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
