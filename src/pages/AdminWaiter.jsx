import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import { 
  PrimaryButton, SecondaryButton, Badge, Modal, ModalHeader 
} from '../components/admin/ui';
import { 
  Loader2, Sparkles, MapPin, Clock, UtensilsCrossed, PhoneCall, Plus 
} from 'lucide-react';


const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminWaiter() {
  const { profile, activeBrand } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState([]);
  const [tableToConfirm, setTableToConfirm] = useState(null);


  useEffect(() => {
    if (profile?.brand_id) {
      fetchTables();
      fetchActiveOrders();
    }
  }, [profile?.brand_id]);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('brand_id', profile.brand_id)
        .order('table_number');
      
      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrders = async () => {
    // Buscamos órdenes activas (no entregadas ni canceladas) para marcar mesas ocupadas
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, table_id')
        .eq('brand_id', profile.brand_id)
        .in('status', ['new', 'preparing', 'ready'])
        .not('table_id', 'is', null);
      
      if (error) throw error;
      setActiveOrders(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTable = (table) => {
    // Check if table is occupied
    const isOccupied = activeOrders.some(o => o.table_id === table.id);
    
    if (isOccupied) {
      setTableToConfirm(table);
      return;
    }

    proceedWithTable(table);
  };

  const proceedWithTable = (table) => {
    sessionStorage.setItem("aa_current_mesa", table.table_number);
    sessionStorage.setItem("aa_current_table_id", table.id); // Add table ID for more robust lookups
    sessionStorage.setItem("aa_pos_mode", "true");
    sessionStorage.removeItem("aa_manual_type");
    window.location.hash = "#menu";
  };

  const handleManualOrder = (type = 'takeaway') => {
    sessionStorage.removeItem("aa_current_mesa");
    sessionStorage.setItem("aa_manual_type", type);
    sessionStorage.setItem("aa_pos_mode", "true");
    window.location.hash = "#menu";
  };


  const getTableStatus = (tableId) => {
    const order = activeOrders.find(o => o.table_id === tableId);
    if (!order) return { label: 'Libre', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' };
    
    const statusMap = {
      'new': { label: 'Nuevo Pedido', color: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500' },
      'preparing': { label: 'En Cocina', color: 'bg-orange-50 text-orange-600 border-orange-100', dot: 'bg-orange-500' },
      'ready': { label: 'Listo p/ Entregar', color: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' }
    };
    
    return statusMap[order.status] || { label: 'Ocupada', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
        <p className="text-sm font-medium text-gray-400">Cargando mapa de mesas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 selection:bg-brand-primary/20">
      
      {/* HEADER POS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-brand-primary w-5 h-5" />
            <h3 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">Punto de Venta / POS</h3>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Toma de Pedidos</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Gestiona las mesas del local y pedidos externos en tiempo real.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
           <button 
             onClick={() => handleManualOrder('takeaway')}
             className="flex-1 md:flex-none flex items-center justify-center gap-2.5 bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95"
           >
             <PhoneCall size={20} />
             <span>Pedido Manual</span>
           </button>
        </div>
      </div>

      {/* GRID DE MESAS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <UtensilsCrossed size={18} className="text-gray-400" />
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Mapa de Mesas</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {tables.length === 0 ? (
            <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-3xl p-20 text-center">
              <p className="text-gray-400 font-medium">No hay mesas configuradas. Ve a "Mesas y QRs" para crearlas.</p>
            </div>
          ) : tables.map((table) => {
            const status = getTableStatus(table.id);
            return (
              <button
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`group relative bg-white border rounded-[2rem] p-6 text-left transition-all hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/5 active:scale-95 overflow-hidden ${
                  activeOrders.some(o => o.table_id === table.id)
                    ? 'border-gray-100 bg-gray-50/50 grayscale-[0.3]' 
                    : 'border-transparent shadow-sm'
                }`}
              >
                {/* Indicador de Status */}
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider border-l border-b ${status.color}`}>
                  {status.label}
                </div>

                <div className="mt-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mesa</div>
                  <div className="text-4xl font-black text-gray-900 group-hover:text-brand-primary transition-colors">
                    {table.table_number}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
                    <span className="text-[11px] font-bold text-gray-400">En vivo</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                    <Plus size={18} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* QUICK ACTIONS / TOOLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
               <MapPin className="mb-4 opacity-50" size={32} />
               <h4 className="text-xl font-black mb-2">Pedidos a Domicilio</h4>
               <p className="text-sm text-white/70 font-medium mb-6 leading-relaxed">Toma órdenes recibidas por teléfono o redes sociales y asocialas a un repartidor.</p>
               <button 
                 onClick={() => handleManualOrder('delivery')}
                 className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors"
               >
                 Iniciar Domicilio
               </button>
            </div>
         </div>

         <div className="bg-white border border-gray-100 rounded-[2rem] p-8 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <Clock size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-tight italic">Recordatorio</h4>
                  <p className="text-xs text-gray-500 font-medium">Recuerda siempre verificar el nombre del cliente en pedidos manuales.</p>
               </div>
            </div>
         </div>
      </div>


      {/* MODAL DE CONFIRMACIÓN MESA OCUPADA */}
      {tableToConfirm && (
        <Modal onClose={() => setTableToConfirm(null)}>
          <ModalHeader 
            title="Mesa Ocupada" 
            subtitle={`La mesa ${tableToConfirm.table_number} tiene un pedido activo.`}
            onClose={() => setTableToConfirm(null)} 
          />
          <div className="p-7">
            <p className="text-sm text-gray-600 leading-relaxed mb-8">
              Esta mesa ya tiene consumos registrados. ¿Deseas <strong>agregar más productos</strong> a la cuenta existente o prefieres cancelar?
            </p>
            <div className="flex gap-3 justify-end">
              <SecondaryButton onClick={() => setTableToConfirm(null)}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={() => {
                const t = tableToConfirm;
                setTableToConfirm(null);
                proceedWithTable(t);
              }}>
                Continuar y Agregar
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
