import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';

export default function AdminModifiers() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    group: '',
    is_active: true
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch Products to show relationships
      const { data: prods } = await supabase.from('products').select('name, modifier_groups');
      setAllProducts(prods || []);

      const { data, error } = await supabase
        .from('modifiers')
        .select('group')
        .order('group');
      
      if (error) throw error;
      
      const uniqueGroups = [...new Set(data.map(d => d.group))];
      setGroups(uniqueGroups);
      if (uniqueGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(uniqueGroups[0]);
      }
    } catch (err) {
      console.error(err);
      toast('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchItems(selectedGroup);
    } else {
      setItems([]);
    }
  }, [selectedGroup]);

  const fetchItems = async (group) => {
    const { data, error } = await supabase
      .from('modifiers')
      .select('*')
      .eq('group', group)
      .order('name');
    if (!error) setItems(data);
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price,
        group: item.group,
        is_active: item.is_active
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: 0,
        group: selectedGroup || '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('modifiers')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast('Modificador actualizado');
      } else {
        const { error } = await supabase
          .from('modifiers')
          .insert([formData]);
        if (error) throw error;
        toast('Modificador creado');
      }
      setIsModalOpen(false);
      fetchInitialData(); // Refresh groups
      if (formData.group) fetchItems(formData.group);
    } catch (err) {
      toast('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este modificador?')) return;
    try {
      const { error } = await supabase.from('modifiers').delete().eq('id', id);
      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
      toast('Eliminado correctamente');
    } catch (err) {
      toast('Error al eliminar');
    }
  };

  const handleToggleActive = async (item) => {
    const { error } = await supabase
      .from('modifiers')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    
    if (!error) {
      setItems(items.map(i => i.id === item.id ? { ...i, is_active: !item.is_active } : i));
      toast('Estado actualizado');
    }
  };

  const linkedProducts = allProducts.filter(p => p.modifier_groups?.includes(selectedGroup));

  if (loading && groups.length === 0) {
    return (
      <div className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">
        Cargando Experiencias...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
           <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              ✨ Módulo de Personalización
           </div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Insumos</h2>
           <p className="text-gray-500 font-medium">Configura ingredientes, adicionales y experiencias de armado.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-8 py-4 bg-[#2f4131] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-900/20 hover:scale-105 active:scale-95 transition-all"
        >
          + Nuevo Insumo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Experience Sidebar */}
        <div className="space-y-6">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Experiencias de Armado</h3>
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 space-y-1">
              {groups.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${
                    selectedGroup === group 
                      ? 'bg-[#2f4131] text-white shadow-xl shadow-green-900/20' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{group}</span>
                  {selectedGroup === group && <span className="text-xs">→</span>}
                </button>
              ))}
              {groups.length === 0 && (
                <p className="p-4 text-xs text-center text-gray-400 italic">No hay grupos creados</p>
              )}
            </div>
          </div>

          {selectedGroup && (
            <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
               <h4 className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-3">Productos Vinculados</h4>
               <div className="flex flex-wrap gap-2">
                  {linkedProducts.map(p => (
                    <span key={p.name} className="px-3 py-1 bg-white text-orange-900 rounded-lg text-[10px] font-bold shadow-sm">{p.name}</span>
                  ))}
                  {linkedProducts.length === 0 && (
                    <p className="text-[10px] text-orange-600 font-medium">Sin vinculaciones aún</p>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Modifiers List */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
               <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">
                 Items de: <span className="text-[#2f4131]">{selectedGroup || 'Selecciona un grupo'}</span>
               </h3>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{items.length} Insumos</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre del Insumo</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo Adicional</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-600 font-medium">
                  {items.map(item => (
                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                         <div className="font-black text-gray-900 text-base">{item.name}</div>
                      </td>
                      <td className="px-8 py-6">
                        {item.price > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg font-black text-xs">
                             +{item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Base Incluida</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleToggleActive(item)}
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                            item.is_active 
                              ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' 
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {item.is_active ? 'Activo' : 'Oculto'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                        No hay insumos en este grupo
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
             <div className="px-10 py-8 bg-[#2f4131] text-white">
                <h3 className="text-2xl font-black tracking-tight">{editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                <p className="text-white/60 text-sm font-medium">Completa los detalles del ingrediente o adicional.</p>
             </div>
             
             <form onSubmit={handleSave} className="p-10 space-y-6">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre del Insumo</label>
                   <input 
                     required
                     type="text" 
                     className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                     placeholder="Ej: Extra de Proteína"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Grupo / Experiencia</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                        placeholder="Ej: bowl-extras"
                        value={formData.group}
                        onChange={e => setFormData({...formData, group: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio Adicional</label>
                      <input 
                        type="number" 
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                      />
                   </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                   <input 
                     type="checkbox" 
                     id="is_active"
                     className="w-5 h-5 rounded-lg border-gray-200 text-[#2f4131] focus:ring-[#2f4131]"
                     checked={formData.is_active}
                     onChange={e => setFormData({...formData, is_active: e.target.checked})}
                   />
                   <label htmlFor="is_active" className="text-sm font-bold text-gray-700">Insumo Activo y Visible</label>
                </div>

                <div className="pt-6 flex gap-3">
                   <button 
                     type="button"
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-200 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit"
                     className="flex-2 px-10 py-4 bg-[#2f4131] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-900/20 hover:scale-105 active:scale-95 transition-all"
                   >
                     {editingItem ? 'Guardar Cambios' : 'Crear Insumo'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
