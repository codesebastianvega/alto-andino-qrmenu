import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { translateGroup } from '../utils/formatters';
import { useMenuData } from '../context/MenuDataContext';
import ExperiencesSection from '../components/ExperiencesSection';
import PromoBannerCarousel from '../components/PromoBannerCarousel';

const STATUS_STEPS = {
  cancelled: { label: 'Cancelado', icon: 'heroicons:x-circle', color: 'text-red-500', bg: 'bg-red-50' },
  waiting_payment: { label: 'Esperando Pago', icon: 'heroicons:banknotes', color: 'text-orange-500', bg: 'bg-orange-50' },
  new: { label: 'Recibido', icon: 'heroicons:document-text', color: 'text-blue-500', bg: 'bg-blue-50' },
  preparing: { label: 'En Cocina', icon: 'heroicons:fire', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ready: { label: 'Listo', icon: 'heroicons:check-badge', color: 'text-green-500', bg: 'bg-green-50' },
  delivered: { label: 'Entregado', icon: 'heroicons:home', color: 'text-gray-500', bg: 'bg-gray-50' }
};

export default function OrderStatus({ orderId }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { banners, experiences } = useMenuData();

  useEffect(() => {
    fetchOrder();

    // Suscripción a cambios en esta orden específica
    const channel = supabase.channel(`order_status_${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(name, price)
        `)
        .eq('order_id', orderId);
        
      if (itemsError) throw itemsError;

      setOrder(orderData);
      setItems(itemsData);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("No pudimos cargar la información del pedido. Verifica que el enlace sea correcto.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar tu pedido?")) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled', 
          cancelled_by: 'customer',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // La suscripción de realtime actualizará el estado automáticamente
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("No se pudo cancelar el pedido. Por favor contacta al local.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <Icon icon="heroicons:exclamation-circle" className="text-6xl text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Pedido no encontrado</h2>
        <p className="text-gray-500 mb-8">{error || "El pedido no existe o fue eliminado."}</p>
        <button onClick={() => window.location.href = '/'} className="btn-primary px-8">Volver al menú</button>
      </div>
    );
  }

  const currentStep = STATUS_STEPS[order.status] || STATUS_STEPS.new;

  const isTakeawayOrDelivery = order.fulfillment_type === 'takeaway' || order.fulfillment_type === 'delivery';
  
  // Create WhatsApp message for payment
  const whatsappNumber = "573138830171"; // Reemplaza con número real del local
  const wppMessage = encodeURIComponent(`Hola! Acabo de hacer el pedido #${order.id.slice(0,4).toUpperCase()}. Envío mi comprobante de pago.`);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Encabezado */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
        <button onClick={() => window.location.href = '/'} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
          <Icon icon="heroicons:arrow-left" className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900 leading-tight">Pedido #{order.id.slice(0, 4).toUpperCase()}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 
            {order.fulfillment_type === 'dine_in' ? ' Consumo en local' : 
             order.fulfillment_type === 'takeaway' ? ' Para llevar' : ' Domicilio'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        
        {/* Banner de Estado Principal */}
        <div className={`${currentStep.bg} rounded-3xl p-6 text-center border-2 border-white shadow-sm relative overflow-hidden`}>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/40 rounded-full blur-xl"></div>
          <Icon icon={currentStep.icon} className={`text-6xl ${currentStep.color} mb-3 relative z-10 scale-animation`} />
          <h2 className={`text-3xl font-black text-gray-900 relative z-10`}>{currentStep.label}</h2>
          
          {order.status === 'waiting_payment' && isTakeawayOrDelivery && (
            <div className="mt-4 text-left bg-white/80 p-4 rounded-2xl relative z-10">
              <p className="font-bold text-gray-800 mb-2">Paso obligatorio:</p>
              <p className="text-gray-600 text-sm mb-4">Para iniciar la preparación de tu pedido, necesitamos confirmar el pago. Por favor envíanos el comprobante por WhatsApp.</p>
              <a 
                href={`https://wa.me/${whatsappNumber}?text=${wppMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
              >
                <Icon icon="mdi:whatsapp" className="text-xl" /> Enviar Comprobante
              </a>
            </div>
          )}

          {order.status === 'preparing' && (
            <p className="text-gray-600 mt-2 relative z-10">Tus alimentos están siendo preparados con mucha dedicación.</p>
          )}

          {order.status === 'ready' && (
            <p className="text-gray-800 font-bold mt-2 relative z-10">
              {order.fulfillment_type === 'dine_in' ? '¡Tu comida va en camino a tu mesa!' : 
               order.fulfillment_type === 'takeaway' ? '¡Tu pedido está listo para recoger!' : 
               '¡Tu pedido está listo y será enviado pronto!'}
            </p>
          )}

          {(order.status === 'waiting_payment' || order.status === 'new') && (
            <button 
              onClick={handleCancelOrder}
              className="mt-6 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <Icon icon="heroicons:x-mark" /> Cancelar Pedido
            </button>
          )}
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Icon icon="heroicons:shopping-bag" className="text-gray-400" /> Resumen
          </h3>
          
          <div className="space-y-4 mb-6">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-start gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-gray-600 text-sm shrink-0">
                    {item.quantity}x
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 line-clamp-2">{item.product?.name || 'Producto eliminado'}</h4>
                    {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {Object.entries(item.modifiers).map(([cat, val]) => `${translateGroup(cat)}: ${val}`).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="font-bold text-gray-900">
                  ${(item.unit_price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="text-gray-500 font-medium">Total Pagado</span>
            <span className="text-2xl font-black text-[#2f4131]">${order.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Feed Original (Mientras Esperas) */}
        <div className="mt-8">
          <h3 className="font-bold text-gray-900 mb-4 px-2 tracking-tight">Cosas Interesantes Mientras Esperas</h3>
          {(banners?.length > 0 || experiences?.length > 0) && (
            <div className="space-y-4">
              {banners?.length > 0 && <PromoBannerCarousel />}
              {experiences?.length > 0 && <ExperiencesSection />}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
