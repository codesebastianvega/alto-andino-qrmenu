import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useCategories } from '../hooks/useCategories';
import CategoryForm from '../components/admin/CategoryForm';
import {
  PageHeader, PrimaryButton, Badge,
  TableContainer, Th, SearchInput
} from '../components/admin/ui';

export default function AdminCategories() {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory, updateCategoryOrders } = useCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState('');

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

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        badge="Carta"
        title="Categorías"
        subtitle={`${categories.length} categorías del menú`}
      >
        <PrimaryButton onClick={handleCreate}>+ Nueva categoría</PrimaryButton>
      </PageHeader>

      <div className="mb-5 max-w-sm">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar categoría…" />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <TableContainer>
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <Th className="w-12 text-center">≡</Th>
                <Th>Orden</Th>
                <Th>Categoría</Th>
                <Th>Slug</Th>
                <Th>Ícono</Th>
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
                              <td className="px-5 py-3.5 text-sm text-gray-400 font-medium tabular-nums">{cat.sort_order || 0}</td>
                              <td className="px-5 py-3.5">
                                <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="font-mono text-[12px] text-gray-400">{cat.slug}</span>
                              </td>
                              <td className="px-5 py-3.5 text-xl">{cat.icon}</td>
                              <td className="px-5 py-3.5">
                                <Badge variant={cat.is_active !== false ? 'green' : 'gray'}>
                                  {cat.is_active !== false ? 'Activa' : 'Inactiva'}
                                </Badge>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(cat)}
                                    className="px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                    Editar
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(cat.id)}
                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                    </svg>
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

      {isFormOpen && (
        <CategoryForm category={editingCategory} onSave={handleSave} onCancel={() => { setIsFormOpen(false); setEditingCategory(null); }} />
      )}
    </div>
  );
}
