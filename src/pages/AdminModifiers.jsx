import { useState, useEffect, useMemo } from 'react';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useIngredientCategories } from '../hooks/useIngredientCategories';

export default function AdminModifiers() {
  const { 
    ingredients, 
    loading, 
    fetchIngredients, 
    createIngredient, 
    updateIngredient, 
    deleteIngredient 
  } = useAdminIngredients();
  
  const { 
    categories: ingredientCategories, 
    createCategory, 
    deleteCategory 
  } = useIngredientCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    purchase_price: 0,
    purchase_unit: 'Unidad',
    purchase_quantity: 1,
    usage_unit: 'unidad',
    stock_current: 0,
    stock_min: 0,
    selling_price: 0,
    is_modifier: false,
    category_id: '',
    is_active: true
  });

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const categoriesList = useMemo(() => {
    return ['all', ...ingredientCategories.map(c => c.id)];
  }, [ingredientCategories]);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (ing.sku && ing.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || ing.category_id === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchTerm, filterCategory]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        sku: item.sku || '',
        selling_price: item.selling_price || 0,
        is_modifier: item.is_modifier || false,
        category_id: item.category_id || '',
        purchase_price: item.purchase_price || 0,
        purchase_unit: item.purchase_unit || 'Unidad',
        purchase_quantity: item.purchase_quantity || 1,
        usage_unit: item.usage_unit || 'unidad',
        stock_current: item.stock_current || 0,
        stock_min: item.stock_min || 0,
        is_active: item.is_active
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        purchase_price: 0,
        purchase_unit: 'Unidad',
        purchase_quantity: 1,
        usage_unit: 'unidad',
        stock_current: 0,
        stock_min: 0,
        selling_price: 0,
        is_modifier: false,
        category_id: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let result;
    if (editingItem) {
      result = await updateIngredient(editingItem.id, formData);
    } else {
      result = await createIngredient(formData);
    }
    
    if (result) {
      setIsModalOpen(false);
    }
  };

  const calculatedUnitCost = useMemo(() => {
    const price = parseFloat(formData.purchase_price) || 0;
    const qty = parseFloat(formData.purchase_quantity) || 1;
    return price / qty;
  }, [formData.purchase_price, formData.purchase_quantity]);

  if (loading && ingredients.length === 0) {
    return (
      <div className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">
        Cargando Inventario...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
           <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              📦 Gestión de Inventario
           </div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Inventario de Insumos</h2>
           <p className="text-gray-500 font-medium text-sm">Controla tus compras, costos unitarios y existencias en tiempo real.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => setIsCatModalOpen(true)}
            className="px-6 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            📂 Categorías
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="px-8 py-4 bg-[#2f4131] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            + Agregar Nuevo Insumo
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm font-bold text-sm focus:ring-2 focus:ring-[#2f4131]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg">🔍</span>
        </div>
        <div>
          <select 
            className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm font-bold text-sm focus:ring-2 focus:ring-[#2f4131] outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Todas las Categorías</option>
            {ingredientCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end px-4">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
             {filteredIngredients.length} Insumos Registrados
           </span>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Insumo / Detalle</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría / SKU</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo Unidad</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio Venta (Público)</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Inventario</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-600 font-medium">
              {filteredIngredients.map(item => (
                <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                     <div className="font-black text-gray-900 text-base">{item.name}</div>
                     <div className="text-[10px] text-gray-400 font-bold uppercase">{item.usage_unit ? `Uso por ${item.usage_unit}` : 'Unidad general'}</div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-black uppercase tracking-widest">
                          {ingredientCategories.find(c => c.id === item.category_id)?.name || 'Sin Cat.'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{item.sku || '--'}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg font-black text-xs">
                       ${(item.unit_cost || 0).toLocaleString()}
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    {item.is_modifier ? (
                      <div className="flex flex-col gap-1">
                        <div className="text-gray-900 font-bold">${(item.selling_price || 0).toLocaleString()}</div>
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded w-max">Publicado como Extra</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 italic text-xs">Solo uso interno</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                     <div className="flex flex-col items-center gap-1">
                        <div className={`text-sm font-black ${item.stock_current <= item.stock_min ? 'text-red-500' : 'text-gray-900'}`}>
                           {item.stock_current} {item.usage_unit}
                        </div>
                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full ${item.stock_current <= item.stock_min ? 'bg-red-500' : 'bg-green-500'}`}
                             style={{ width: `${Math.min(100, (item.stock_current / (item.stock_min || 1)) * 50)}%` }}
                           />
                        </div>
                     </div>
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
                        onClick={() => deleteIngredient(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredIngredients.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-gray-400 italic">
                    No se encontraron insumos con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 my-auto">
             <div className="px-10 py-8 bg-[#2f4131] text-white">
                <div className="flex justify-between items-center">
                   <div>
                      <h3 className="text-2xl font-black tracking-tight">{editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                      <p className="text-white/60 text-sm font-medium">Define costos de compra y unidades de medida.</p>
                   </div>
                   <div className="text-right">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Costo Unitario Calc.</span>
                      <span className="text-3xl font-black text-green-400">${calculatedUnitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                   </div>
                </div>
             </div>
             
             <form onSubmit={handleSave} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre del Insumo</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                        placeholder="Ej: Salmón Fresh Grade A"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>

                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">SKU / Código</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                        placeholder="AL-INV-001"
                        value={formData.sku}
                        onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                      />
                   </div>

                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoría</label>
                      <select 
                        required
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
                        value={formData.category_id}
                        onChange={e => setFormData({...formData, category_id: e.target.value})}
                      >
                        <option value="">Seleccionar...</option>
                        {ingredientCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                   </div>

                   {/* Pricing Section */}
                   <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                      <div className="md:col-span-3">
                         <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">Calculadora de Conversión (Compra vs Uso)</h4>
                      </div>
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio de Compra</label>
                         <input 
                           type="number" 
                           className="w-full px-6 py-4 bg-white border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                           value={formData.purchase_price}
                           onChange={e => setFormData({...formData, purchase_price: Number(e.target.value)})}
                         />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Unidad Compra</label>
                         <input 
                           type="text" 
                           className="w-full px-6 py-4 bg-white border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                           placeholder="Litro, Caja, Kg"
                           value={formData.purchase_unit}
                           onChange={e => setFormData({...formData, purchase_unit: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cantidad en Compra</label>
                         <input 
                           type="number" 
                           className="w-full px-6 py-4 bg-white border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                           value={formData.purchase_quantity}
                           onChange={e => setFormData({...formData, purchase_quantity: Number(e.target.value)})}
                         />
                      </div>
                      <div className="md:col-span-3 text-[10px] text-blue-600 font-medium italic">
                         * Si compraste 1 {formData.purchase_unit} por ${formData.purchase_price} y trae {formData.purchase_quantity} unidades/ml/gr, cada unidad cuesta ${calculatedUnitCost.toFixed(2)}.
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Unidad de Uso (Recetas)</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                        placeholder="ml, gr, oz"
                        value={formData.usage_unit}
                        onChange={e => setFormData({...formData, usage_unit: e.target.value})}
                      />
                   </div>

                   {/* External / Adiciones Toggle */}
                   <div className="md:col-span-2 p-6 bg-orange-50/50 rounded-3xl border border-orange-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-1">Configuración como Adición/Extra</h4>
                        <p className="text-[10px] text-orange-600 font-medium">¿Este insumo puede ser comprado por el cliente como adicional?</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {formData.is_modifier && (
                          <div className="text-right">
                             <label className="block text-[9px] font-black uppercase text-orange-400">Precio Venta</label>
                             <input 
                              type="number"
                              className="w-24 bg-white border-orange-200 rounded-lg text-sm font-bold p-1 text-orange-900"
                              value={formData.selling_price}
                              onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})}
                             />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, is_modifier: !formData.is_modifier})}
                          className={`w-12 h-6 rounded-full transition-all relative ${formData.is_modifier ? 'bg-orange-500' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_modifier ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stock Actual</label>
                         <input 
                           type="number" 
                           className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                           value={formData.stock_current}
                           onChange={e => setFormData({...formData, stock_current: Number(e.target.value)})}
                         />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stock Min.</label>
                         <input 
                           type="number" 
                           className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-red-500"
                           value={formData.stock_min}
                           onChange={e => setFormData({...formData, stock_min: Number(e.target.value)})}
                         />
                      </div>
                   </div>
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

      {/* Modal Categorías */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 bg-black/60">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
             <div className="px-8 py-6 bg-[#2f4131] text-white flex justify-between items-center">
                <h3 className="text-xl font-black">Categorías de Insumos</h3>
                <button onClick={() => setIsCatModalOpen(false)} className="text-white/40 hover:text-white">✕</button>
             </div>
             <div className="p-8 space-y-6">
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Nueva categoría..."
                     className="flex-1 px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm"
                     value={newCatName}
                     onChange={e => setNewCatName(e.target.value)}
                   />
                   <button 
                     onClick={async () => {
                        if (newCatName) {
                           await createCategory(newCatName);
                           setNewCatName('');
                        }
                     }}
                     className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 font-black uppercase tracking-widest text-[10px]"
                   >
                     Añadir
                   </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                   {ingredientCategories.map(cat => (
                     <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-all">
                        <span className="font-bold text-gray-700">{cat.name}</span>
                        <button 
                          onClick={() => deleteCategory(cat.id)}
                          className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                          Eliminar
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
