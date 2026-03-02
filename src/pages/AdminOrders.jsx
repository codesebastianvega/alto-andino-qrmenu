import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { PageHeader } from '../components/admin/ui/PageHeader';
import { Icon } from '@iconify-icon/react';
import toast from 'react-hot-toast';

// Estados permitidos
const ORDER_STATUSES = [
  { id: 'new', label: 'Nuevo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'preparing', label: 'Preparando', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'ready', label: 'Listo', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'delivered', label: 'Entregado', color: 'bg-gray-100 text-gray-800 border-gray-200' }
];

// Función para calcular colores del semáforo:
function getTimerColor(createdAt) {
  const diffMinutes = Math.floor((new Date() - new Date(createdAt)) / 60000);
  if (diffMinutes >= 20) return 'bg-red-500 text-white'; // Peligro (+20 min)
  if (diffMinutes >= 10) return 'bg-yellow-500 text-white'; // Advertencia (10-20 min)
  return 'bg-emerald-500 text-white'; // Normal (0-10 min)
}

function OrderTimer({ createdAt, status }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    if (status === 'delivered') return;
    
    const updateTimer = () => {
      setMins(Math.floor((new Date() - new Date(createdAt)) / 60000));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (status === 'delivered') return null;

  const colorClass = getTimerColor(createdAt);
  
  return (
    <div className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm ${colorClass}`}>
      <Icon icon="heroicons:clock" className="text-[14px]" />
      {mins} min
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant_tables ( id, table_number ),
          order_items (
            id, quantity, unit_price, modifiers, notes,
            products ( id, name, category_id )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
      toast.error('No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Suscripción de Realtime para KDS
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime Order Event:', payload);
          // Recargar todos los pedidos cuando hay cambios para asegurar consistencia
          // con las tablas relacionadas (order_items etc).
          // En un refactor futuro se podría mutar el estado local optimísticamente
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
           console.log('Realtime Order Item Event:', payload);
           fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const payload = { status: newStatus };
      if (newStatus === 'ready') payload.ready_at = new Date().toISOString();
      if (newStatus === 'delivered') payload.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Estado actualizado');
      fetchOrders(); // Reload optimista o completo (supabase realtime ya debería llamar)
    } catch (err) {
      console.error('Error actualizando pedido', err);
      toast.error('Error al actualizar');
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      <PageHeader
        title="Kitchen Display System"
        subtitle="Visualiza y gestiona los pedidos en tiempo real"
        icon="heroicons:queue-list"
        actions={
          <button onClick={fetchOrders} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm">
             <Icon icon="heroicons:arrow-path" className="text-xl" />
          </button>
        }
      />

      {loading && orders.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 items-start">
          {ORDER_STATUSES.map(statusCol => {
            const colOrders = statusCol.id !== 'delivered' && statusCol.id !== 'cancelled'
               ? orders.filter(o => o.status === statusCol.id).sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
               // Only show last 10 delivered inside 'delivered' column
               : orders.filter(o => o.status === statusCol.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

            return (
              <div key={statusCol.id} className="flex flex-col gap-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 min-h-[500px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
                  <h3 className="font-bold text-gray-700">{statusCol.label}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusCol.color} bg-white opacity-80`}>
                    {colOrders.length}
                  </span>
                </div>

                {colOrders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center italic mt-10">Sin pedidos</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {colOrders.map(order => (
                      <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                        
                        {/* Top bar info */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xl font-black text-gray-800">
                              #{order.id.slice(0, 4).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1.5 opacity-80">
                               {order.origin === 'table' ? (
                                  <span className="inline-flex items-center text-xs font-bold bg-[#A8B28B]/20 text-[#2f4131] px-2 py-1 rounded-md">
                                    <Icon icon="heroicons:map-pin" className="mr-1" />
                                    Mesa {order.restaurant_tables?.table_number || 'N/A'}
                                  </span>
                               ) : (
                                  <span className="inline-flex items-center text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-md">
                                    <Icon icon="logos:whatsapp-icon" className="mr-1" />
                                    Para Llevar
                                  </span>
                               )}
                            </div>
                          </div>
                          
                          <OrderTimer createdAt={order.created_at} status={order.status} />
                        </div>

                        {/* Items List */}
                        <div className="space-y-2 mb-4 bg-gray-50 rounded-lg p-3">
                          {order.order_items?.map(item => (
                            <div key={item.id} className="flex gap-2 text-sm text-gray-700">
                              <span className="font-bold shrink-0">{item.quantity}x</span>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{item.products?.name || 'Producto Elminado'}</span>
                                {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                                  <span className="text-xs text-gray-500 mt-0.5 leading-snug">
                                    {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                  </span>
                                )}
                                {item.notes && (
                                  <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md inline-block w-fit mt-1 italic">
                                    "{item.notes}"
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Actions mapping to NEXT status */}
                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          {order.status === 'new' && (
                            <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                              A Cocina <Icon icon="heroicons:fire" />
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                              Marcar Listo <Icon icon="heroicons:check-badge" />
                            </button>
                          )}
                           {order.status === 'ready' && (
                            <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                              Entregar a Mesa <Icon icon="heroicons:truck" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
