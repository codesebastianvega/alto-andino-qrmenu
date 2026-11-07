import { useState, useMemo } from 'react';
import { useIngredientCategories } from '../../../hooks/useIngredientCategories';
import { TextInput, PrimaryButton } from '../ui';
import { Icon } from '@iconify-icon/react';

export function CategoriasTab({ ingredients = [] }) {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useIngredientCategories();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );

  const getCategoryCount = (catId) => ingredients.filter(i => i.category_id === catId).length;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const ok = await createCategory(newName.trim());
    if (ok) setNewName('');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) return;
    const ok = await updateCategory(editingId, editingName.trim());
    if (ok) setEditingId(null);
  };

  if (loading && !categories.length) {
    return (
      <div className="py-16 text-center text-sm text-gray-400 font-medium tracking-widest uppercase">
        Cargando categorías…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Create Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">Categorías de Insumos</h2>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            Organiza tus insumos para clasificar compras, reportes y mermas de almacén.
          </p>

          <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Nueva Categoría</h3>
            <div className="space-y-2.5">
              <TextInput
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej. Proteínas, Lácteos..."
                className="bg-slate-50 border-slate-200 focus:bg-white text-xs"
              />
              <PrimaryButton onClick={handleCreate} className="w-full justify-center text-xs h-9">
                Crear Categoría
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-2xs border border-slate-200/90">
            <div className="relative flex-1">
              <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
              />
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              {filtered.length} Categorías
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((cat) => {
              const itemCount = getCategoryCount(cat.id);
              const isEditing = editingId === cat.id;
              const isDeleting = confirmDelete === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isEditing ? 'border-emerald-500 bg-emerald-50/20 shadow-2xs' :
                    isDeleting ? 'border-rose-300 bg-rose-50/40 shadow-2xs' :
                    'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2.5 animate-fade-in">
                      <TextInput
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                        className="bg-white text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    <div className="text-center space-y-2.5 animate-fade-in">
                      <p className="text-xs font-bold text-rose-800">¿Eliminar "{cat.name}"?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteCategory(cat.id).then(() => setConfirmDelete(null))}
                          className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-2xs"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <Icon icon="heroicons:tag" className="text-base" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingId(cat.id); setEditingName(cat.name); setConfirmDelete(null); }}
                            title="Editar categoría"
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200/80 bg-white transition-colors shadow-2xs"
                          >
                            <Icon icon="heroicons:pencil-square" className="text-sm" />
                          </button>
                          <button
                            onClick={() => { setConfirmDelete(cat.id); setEditingId(null); }}
                            title="Eliminar categoría"
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200/80 bg-white transition-colors shadow-2xs"
                          >
                            <Icon icon="heroicons:trash" className="text-sm" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{cat.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-semibold text-slate-600 rounded-md uppercase tracking-wider border border-slate-200/60">
                          {itemCount} {itemCount === 1 ? 'Insumo' : 'Insumos'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Icon icon="heroicons:tag" className="text-3xl text-slate-300 mb-2 mx-auto" />
                <p className="text-xs font-medium text-slate-400">No se encontraron categorías</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
