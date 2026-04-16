import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { toast as toastFn } from '../components/Toast';
import { 
  PrimaryButton, SecondaryButton, Badge, Modal, ModalHeader 
} from '../components/admin/ui';
import { 
  Loader2, Sparkles, MapPin, Clock, UtensilsCrossed, PhoneCall, Plus, 
  Users, CheckCircle2, LayoutGrid, Timer, Coffee, PhoneForwarded,
  ArrowRight, Activity, TrendingUp, ShoppingBag, Bike
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminWaiter() {
  const { profile, activeBrand } = useAuth();
  const { staffList } = useStaff();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState([]);
  const [tableToConfirm, setTableToConfirm] = useState(null);

  const activeStaff = useMemo(() => staffList.filter(s => s.role === 'waiter' || s.role === 'admin'), [staffList]);

  useEffect(() => {
    if (profile?.brand_id) {
      fetchTables();
      fetchActiveOrders();

      // Real-time subscriptions
      const tablesChannel = supabase
        .channel('tables-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables', filter: `brand_id=eq.${profile.brand_id}` }, () => {
          fetchTables();
        })
        .subscribe();

      const ordersChannel = supabase
        .channel('orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `brand_id=eq.${profile.brand_id}` }, () => {
          fetchActiveOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(tablesChannel);
        supabase.removeChannel(ordersChannel);
      };
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
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, table_id, created_at, customer_name, fulfillment_type')
        .eq('brand_id', profile.brand_id)
        .in('status', ['new', 'preparing', 'ready']);
      
      if (error) throw error;
      setActiveOrders(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTable = (table) => {
    const isOccupied = activeOrders.some(o => o.table_id === table.id);
    if (isOccupied) {
      setTableToConfirm(table);
      return;
    }
    proceedWithTable(table);
  };

  const proceedWithTable = (table) => {
    sessionStorage.setItem("aa_current_mesa", table.table_number);
    sessionStorage.setItem("aa_current_table_id", table.id);
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
    if (!order) return { 
      label: 'Disponible', 
      variant: 'green',
      dot: 'bg-emerald-500', 
      bg: 'bg-emerald-50/10' 
    };
    
    const statusMap = {
      'new': { label: 'Nuevo', variant: 'blue', dot: 'bg-blue-500', bg: 'bg-blue-50/10' },
      'preparing': { label: 'En Cocina', variant: 'amber', dot: 'bg-amber-500', bg: 'bg-amber-50/10' },
      'ready': { label: 'Listo', variant: 'indigo', dot: 'bg-indigo-500', bg: 'bg-indigo-50/10' }
    };
    
    return statusMap[order.status] || { label: 'Ocupada', variant: 'gray', dot: 'bg-gray-400', bg: 'bg-gray-50' };
  };

  const getTimeOccupied = (createdAt) => {
    if (!createdAt) return null;
    const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
    return diff > 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff} min`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-[#2f4131]" />
        </motion.div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando Sistema...</p>
      </div>
    );
  }

  const freeTablesCount = tables.filter(t => !activeOrders.some(o => o.table_id === t.id)).length;
  const occupiedTablesCount = tables.length - freeTablesCount;
  const externalOrders = activeOrders.filter(o => !o.table_id);
  const takeawayCount = externalOrders.filter(o => o.fulfillment_type === 'takeaway').length;
  const deliveryCount = externalOrders.filter(o => o.fulfillment_type === 'delivery').length;

  return (
    <div className="p-4 md:p-8 max-w-[1500px] mx-auto space-y-6 selection:bg-[#2f4131]/20 min-h-screen">
      
      {/* HEADER POS COMPACTO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/70 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/50 shadow-xl shadow-gray-200/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
             <Activity className="text-[#2f4131] w-4 h-4" />
             <h3 className="text-[9px] font-black text-[#2f4131] uppercase tracking-[0.4em]">Operations Center</h3>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-none flex items-center gap-3">
            Gestión de Piso
            <span className="text-gray-300 font-light text-xl">|</span>
            <span className="text-gray-400 text-lg lg:text-xl font-bold">{activeBrand?.name}</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex gap-3">
              <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100/50 flex flex-col items-center min-w-[80px]">
                 <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Libres</span>
                 <span className="text-xl font-black text-emerald-800 leading-none" style={{ fontFamily: 'Outfit' }}>{freeTablesCount}</span>
              </div>
              <div className="bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100/50 flex flex-col items-center min-w-[80px]">
                 <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Ocupadas</span>
                 <span className="text-xl font-black text-amber-800 leading-none" style={{ fontFamily: 'Outfit' }}>{occupiedTablesCount}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-6">
        {/* LADO IZQUIERDO: GRID DE MESAS COMPACTO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <LayoutGrid size={18} className="text-[#2f4131]" />
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Mapa del Salón</h4>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black text-gray-400 bg-white/80 p-2 rounded-full border border-gray-100 shadow-sm px-4">
               <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> DISPONIBLE</div>
               <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> EN SERVICIO</div>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {tables.length === 0 ? (
                <div className="col-span-full bg-white/40 backdrop-blur-xl border-2 border-dashed border-gray-100 rounded-3xl p-20 text-center">
                  <UtensilsCrossed size={40} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Sin mesas</p>
                </div>
              ) : tables.map((table) => {
                const status = getTableStatus(table.id);
                const order = activeOrders.find(o => o.table_id === table.id);
                
                return (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`group relative bg-white border rounded-[2rem] p-5 text-left transition-all hover:border-[#2f4131] shadow-lg shadow-gray-200/20 hover:shadow-[#2f4131]/5 active:scale-[0.98] overflow-hidden ${
                      order ? 'border-amber-100 bg-amber-50/10' : 'border-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                       <Badge variant={status.variant}>{status.label}</Badge>
                       {order && (
                         <div className="flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                           <Timer size={12} className="text-amber-500" />
                           <span className="text-[9px] font-black text-gray-800" style={{ fontFamily: 'Outfit' }}>{getTimeOccupied(order.created_at)}</span>
                         </div>
                       )}
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Mesa</span>
                      <h3 className="text-4xl font-black text-gray-900 group-hover:text-[#2f4131] transition-colors tracking-tighter" style={{ fontFamily: 'Outfit' }}>
                        {table.table_number < 10 ? `0${table.table_number}` : table.table_number}
                      </h3>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      {order ? (
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Cliente</span>
                           <span className="text-[11px] font-black text-gray-900 truncate max-w-[100px]">{order.customer_name || 'Comensal'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Sala Lista</span>
                        </div>
                      )}
                      
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                         order ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-300 group-hover:bg-[#2f4131] group-hover:text-white group-hover:rotate-45'
                      }`}>
                        {order ? <Coffee size={18} /> : <Plus size={18} />}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* LADO DERECHO: ACCIONES COMPACTAS */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <Sparkles size={16} className="text-[#2f4131]" />
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Acciones Rápidas</h4>
           </div>

           {/* Banner: Pedido para Llevar */}
           <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleManualOrder('takeaway')}
              className="w-full bg-[#2f4131] rounded-[2rem] p-5 text-white flex items-center gap-4 group transition-all shadow-xl shadow-[#2f4131]/20 overflow-hidden relative"
           >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700 blur-xl" />
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                 <ShoppingBag size={20} className="text-white" />
              </div>
              <div className="text-left relative z-10">
                 <h4 className="text-lg font-black leading-tight" style={{ fontFamily: 'Outfit' }}>Para Llevar</h4>
                 <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest">Pedido en counter</p>
              </div>
              <ArrowRight size={18} className="ml-auto text-white/40 group-hover:text-white transition-colors" />
           </motion.button>

           {/* Banner: Domicilio */}
           <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleManualOrder('delivery')}
              className="w-full bg-white rounded-[2rem] p-5 border border-gray-100 flex items-center gap-4 group transition-all shadow-lg shadow-gray-200/40 overflow-hidden relative"
           >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shrink-0">
                 <Bike size={20} className="text-indigo-600" />
              </div>
              <div className="text-left">
                 <h4 className="text-lg font-black text-gray-900 leading-tight" style={{ fontFamily: 'Outfit' }}>Domicilio</h4>
                 <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Nueva entrega externa</p>
              </div>
              <ArrowRight size={18} className="ml-auto text-gray-200 group-hover:text-indigo-600 transition-colors" />
           </motion.button>

           {/* Metrics Card Compacto */}
           <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-gray-200/30 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600" />
                    <h4 className="font-black text-gray-900 uppercase tracking-widest text-[9px]">Status Operativo</h4>
                 </div>
                 <span className="text-[8px] font-black text-[#2f4131] bg-[#2f4131]/5 px-2 py-0.5 rounded-full uppercase">Live</span>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2">
                       <Users size={16} className="text-gray-400" />
                       <span className="text-[10px] font-black text-gray-500 uppercase">Staff</span>
                    </div>
                    <span className="font-black text-gray-900" style={{ fontFamily: 'Outfit' }}>{activeStaff.length} Activos</span>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex flex-col">
                       <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Pa' Llevar</span>
                       <span className="text-xl font-black text-blue-900" style={{ fontFamily: 'Outfit' }}>{takeawayCount}</span>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col">
                       <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1">Domicilios</span>
                       <span className="text-xl font-black text-indigo-900" style={{ fontFamily: 'Outfit' }}>{deliveryCount}</span>
                    </div>
                 </div>

                 <div className="p-4 bg-[#2f4131]/5 rounded-2xl border border-[#2f4131]/10">
                    <p className="text-[11px] text-[#2f4131]/80 leading-relaxed font-bold italic">
                      "Personaliza el servicio preguntando el nombre del cliente."
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>


      {/* MODAL DE CONFIRMACIÓN COMPACTO */}
      <AnimatePresence>
        {tableToConfirm && (
          <Modal onClose={() => setTableToConfirm(null)}>
            <ModalHeader 
              title="Cuenta en Curso" 
              subtitle={`Mesa ${tableToConfirm.table_number} activa.`}
              onClose={() => setTableToConfirm(null)} 
            />
            <div className="p-6">
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-start gap-4 mb-6">
                 <div className="bg-white p-2 rounded-xl text-amber-600 shadow-sm border border-amber-100 shrink-0">
                    <Coffee size={24} />
                 </div>
                 <p className="text-sm text-amber-900/80 font-medium leading-relaxed">
                   Esta mesa ya tiene productos. ¿Deseas <strong>acceder para agregar más</strong>?
                 </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setTableToConfirm(null)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200"
                >
                  Volver
                </button>
                <button 
                  onClick={() => {
                    const t = tableToConfirm;
                    setTableToConfirm(null);
                    proceedWithTable(t);
                  }}
                  className="flex-[2] py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
}

