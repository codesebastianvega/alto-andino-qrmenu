import { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { Icon } from '@iconify-icon/react';
import { InsumosTab } from '../components/admin/inventory/InsumosTab';
import { CategoriasTab } from '../components/admin/inventory/CategoriasTab';
import { ProveedoresTab } from '../components/admin/inventory/ProveedoresTab';
import { ListaComprasTab } from '../components/admin/inventory/ListaComprasTab';

const TABS = [
  { id: 'inventario', label: 'Inventario', icon: 'heroicons:archive-box' },
  { id: 'categorias', label: 'Categorías', icon: 'heroicons:tag' },
  { id: 'proveedores', label: 'Proveedores', icon: 'heroicons:truck' },
  { id: 'lista_compras', label: 'Lista de Compras', icon: 'heroicons:shopping-cart' },
];

export default function AdminModifiers() {
  const { activeLocationId } = useLocation();
  const [activeTab, setActiveTab] = useState('inventario');
  const { ingredients, fetchIngredients } = useAdminIngredients();

  useEffect(() => {
    fetchIngredients(activeLocationId);
  }, [activeLocationId, fetchIngredients]);

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Tabs Menu */}
      <div className="flex flex-row overflow-x-auto scrollbar-hide flex-nowrap bg-slate-100 p-1 mb-6 rounded-xl w-full sm:w-fit mx-auto border border-slate-200/80 shadow-2xs sticky top-4 z-40">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Icon icon={tab.icon} className={activeTab === tab.id ? 'text-emerald-700' : 'text-slate-400'} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inventario' && <InsumosTab activeLocationId={activeLocationId} />}
      {activeTab === 'categorias' && <CategoriasTab ingredients={ingredients} />}
      {activeTab === 'proveedores' && <ProveedoresTab ingredients={ingredients} />}
      {activeTab === 'lista_compras' && <ListaComprasTab activeLocationId={activeLocationId} />}
    </div>
  );
}
