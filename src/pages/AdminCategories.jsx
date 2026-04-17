import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useCategories } from '../hooks/useCategories';
import { usePlan } from '../hooks/usePlan';
import CategoryForm from '../components/admin/CategoryForm';
import AdminAllergens from './AdminAllergens';
import {
  PageHeader, PrimaryButton, Badge,
  TableContainer, Th, SearchInput, Switch, SelectInput
} from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';

export default function AdminCategories() {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory, updateCategoryOrders } = useCategories();
  const { withinLimit, maxCategories } = usePlan();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'allergens'

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    if (search) return; // Prevent reordering if there's a filter

    const newCategories = Array.from(categories);
    const [reorderedItem] = newCategories.splice(result.source.index, 1);
    newCategories.splice(result.destination.index, 0, reorderedItem);

    await updateCategoryOrders(newCategories);
  };

  const handleCreate  = () => { setEditingCategory(null); setIsFormOpen(true); };
  const handleEdit    = (cat) => { setEditingCategory(cat); setIsFormOpen(true); };
  const handleDelete  = async (id) => { await deleteCategory(id); setConfirmDeleteId(null); };

  const handleSave = async (data) => {
    const result = editingCategory
      ? await updateCategory(editingCategory.id, data)
      : await createCategory(data);
    if (result?.success) { setIsFormOpen(false); setEditingCategory(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );
  if (error)   return (
    <div className="p-8 text-red-500 text-sm font-medium">Error cargando categorías: {error}</div>
  );

  const isAtLimit = !withinLimit('max_categories', categories.length);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="p-4 sm:p-8 w-full space-y-6">
      <PageHeader
        badge="Administración"
        title="Categorías y Etiquetas"
        subtitle="Organiza tu menú y define etiquetas de dieta o alérgenos."
      >
        {activeTab === 'categories' && (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {maxCategories && (
              <div className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 italic">
                Categorías: <span className={isAtLimit ? 'text-orange-600' : 'text-gray-900'}>{categories.length} / {maxCategories}</span>
              </div>
            )}
            <PrimaryButton 
              onClick={handleCreate} 
              disabled={isAtLimit}
              className="w-full sm:w-auto"
            >
              {isAtLimit ? 'Límite alcanzado' : '+ Nueva Categoría'}
            </PrimaryButton>
          </div>
        )}
      </PageHeader>

      {/* Tabs Switcher — Bento Style */}
      <div className="flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-2xl w-fit mb-2">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'categories' 
              ? 'bg-white text-[#2f4131] shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Categorías
        </button>
        <button
          onClick={() => setActiveTab('allergens')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'allergens' 
              ? 'bg-white text-[#2f4131] shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Dietas y Alérgenos
        </button>
      </div>

      {activeTab === 'categories' ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex-1 w-full max-w-sm">
              <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar categoría…" />
            </div>
          </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <TableContainer>
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <Th className="w-12 text-center">≡</Th>
                <Th>Imagen</Th>
                <Th>Nombre / Slug</Th>
                <Th>Productos</Th>
                <Th>Subcats</Th>
                <Th>Diseño / Vista</Th>
                <Th>Actualización</Th>
                <Th>Hero</Th>
                <Th>Estado</Th>
                <Th right>Acciones</Th>
              </tr>
            </thead>
            <Droppable droppableId="categories-list">
              {(provided) => (
                <tbody 
                  className="divide-y divide-gray-50"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {filtered.map((cat, index) => (
                    <Draggable 
                      key={cat.id} 
                      draggableId={cat.id.toString()} 
                      index={index}
                      isDragDisabled={!!search}
                    >
                      {(provided, snapshot) => (
                        <tr 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group hover:bg-gray-50/60 transition-colors ${snapshot.isDragging ? 'bg-white shadow-lg ring-1 ring-black/5 z-50 relative' : ''}`}
                          style={provided.draggableProps.style}
                        >
                          <td 
                            className="px-5 py-3.5 w-12 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                            {...provided.dragHandleProps}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="12" r="1"></circle>
                              <circle cx="9" cy="5" r="1"></circle>
                              <circle cx="9" cy="19" r="1"></circle>
                              <circle cx="15" cy="12" r="1"></circle>
                              <circle cx="15" cy="5" r="1"></circle>
                              <circle cx="15" cy="19" r="1"></circle>
                            </svg>
                          </td>
                          {confirmDeleteId === cat.id ? (
                            <td colSpan={6} className="px-5 py-3 bg-red-50">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-red-700">¿Eliminar la categoría <strong>"{cat.name}"</strong>?</p>
                                <div className="flex gap-2">
                                  <button onClick={() => handleDelete(cat.id)}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[12px] font-semibold hover:bg-red-700 transition-all">
                                    Eliminar
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(null)}
                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[12px] font-semibold hover:bg-gray-50 transition-all">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="px-5 py-3.5">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center text-xl">
                                  {cat.image_url ? (
                                    <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : cat.icon || '📁'}
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <Icon icon="heroicons:folder" className="text-gray-400 text-sm" />
                                      <span className="text-sm font-extrabold text-gray-900 leading-tight">{cat.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter mt-1 bg-gray-50 w-fit px-1.5 rounded">{cat.slug}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex flex-col gap-1.5 min-w-[100px]">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">
                                      {cat.active_products || 0} / {cat.total_products || 0}
                                    </span>
                                    <Badge variant={(cat.active_products || 0) > 0 ? 'green' : 'gray'}>
                                      Activos
                                    </Badge>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                                    <div 
                                      className="h-full bg-green-500 transition-all duration-500" 
                                      style={{ width: `${cat.total_products > 0 ? (cat.active_products / cat.total_products) * 100 : 0}%` }}
                                    />
                                    <div 
                                      className="h-full bg-gray-300 transition-all duration-500" 
                                      style={{ width: `${cat.total_products > 0 ? ((cat.total_products - cat.active_products) / cat.total_products) * 100 : 0}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {(cat.visibility_config?.subcategories || []).slice(0, 3).map((sub, i) => (
                                    <Badge key={i} variant="blue" className="!text-[9px] !px-1.5 !py-0.5 !font-bold">
                                      {sub}
                                    </Badge>
                                  ))}
                                  {(cat.visibility_config?.subcategories || []).length > 3 && (
                                    <Badge variant="gray" className="!text-[9px] !px-1.5 !py-0.5 !font-bold">
                                      +{(cat.visibility_config.subcategories.length - 3)}
                                    </Badge>
                                  )}
                                  {(!cat.visibility_config?.subcategories || cat.visibility_config.subcategories.length === 0) && (
                                    <span className="text-[10px] text-gray-300 italic font-medium">Sin subcat.</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 min-w-[140px]">
                                <SelectInput 
                                  value={cat.visibility_config?.section_type || 'standard'}
                                  onChange={(e) => updateCategory(cat.id, { 
                                    visibility_config: { 
                                      ...(cat.visibility_config || {}), 
                                      section_type: e.target.value 
                                    } 
                                  })}
                                  className="!py-1.5 !rounded-lg !text-[12px]"
                                >
                                  <option value="standard">Estándar</option>
                                  <option value="grid">Grid (Ample)</option>
                                  <option value="grid-compact">Grid Compacto</option>
                                  <option value="horizontal-slider">Slider Horizontal</option>
                                  <option value="bento-grid">Bento Grid (Moderno)</option>
                                  <option value="masonry">Pinterest / Masonry</option>
                                  <option value="list-minimal">Lista Minimal</option>
                                  <option value="simple-list">Lista Simple</option>
                                </SelectInput>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-medium text-gray-600">
                                    {cat.updated_at ? new Date(cat.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '---'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 italic">
                                    {cat.updated_at ? new Date(cat.updated_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <button 
                                  onClick={() => updateCategory(cat.id, { 
                                    visibility_config: { 
                                      ...(cat.visibility_config || {}), 
                                      is_hero: !cat.visibility_config?.is_hero 
                                    } 
                                  })}
                                  className={`p-1.5 rounded-lg transition-all ${cat.visibility_config?.is_hero ? 'bg-amber-50 text-amber-500' : 'text-gray-300 hover:text-gray-400'}`}
                                >
                                  <Icon icon={cat.visibility_config?.is_hero ? "heroicons:star-20-solid" : "heroicons:star"} className="text-xl" />
                                </button>
                              </td>
                              <td className="px-5 py-3.5">
                                <Switch 
                                  checked={cat.is_active !== false} 
                                  onChange={(val) => updateCategory(cat.id, { is_active: val })}
                                />
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(cat)}
                                    className="px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                    Configurar
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(cat.id)}
                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                                    <Icon icon="heroicons:trash" className="text-lg" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-14 text-center text-sm text-gray-400 font-medium">
                      {search ? 'Sin resultados.' : 'No hay categorías aún.'}
                    </td></tr>
                  )}
                </tbody>
              )}
            </Droppable>
          </table>
        </TableContainer>
      </DragDropContext>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <AdminAllergens />
        </div>
      )}

      {isFormOpen && (
        <CategoryForm category={editingCategory} onSave={handleSave} onCancel={() => { setIsFormOpen(false); setEditingCategory(null); }} />
      )}
    </div>
  );
}
