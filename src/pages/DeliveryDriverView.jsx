import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { 
  parsePaymentMethod, 
  getGoogleMapsUrl, 
  getWazeUrl, 
  normalizeWhatsAppNumber 
} from '../utils/formatters';
import soundService from '../utils/soundService';

export default function DeliveryDriverView({ orderId }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`driver_order_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          brands:brand_id (name, logo_url),
          locations:location_id (name, address, phone)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (name, price)
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder(orderData);
      setItems(itemsData || []);
    } catch (err) {
      console.error('Error al cargar comanda de entrega:', err);
      setError('No se pudo cargar la orden. Verifica que el enlace sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!order) return;
    try {
      setUpdating(true);
      const updatePayload = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      if (newStatus === 'delivered') {
        updatePayload.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (error) throw error;

      setOrder(prev => ({ ...prev, ...updatePayload }));
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 50, 150]);
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Hubo un error al actualizar el estado: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const toggleCheckItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 animate-bounce">
          <Icon icon="solar:scooter-bold-duotone" className="text-3xl text-emerald-400" />
        </div>
        <p className="text-sm font-bold text-slate-300">Cargando datos de entrega...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <Icon icon="solar:danger-triangle-bold" className="text-4xl text-rose-400 mb-3" />
        <h2 className="text-lg font-black mb-2">Pedido No Encontrado</h2>
        <p className="text-xs text-slate-400 mb-6">{error || 'El pedido no existe o ha expirado.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs border border-slate-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const brandName = order.brands?.name || 'Boku Bento';
  const shortId = order.id ? order.id.slice(0, 4).toUpperCase() : '----';
  const cleanPhone = (order.customer_phone || '').replace(/\D/g, '');
  const waNumber = normalizeWhatsAppNumber(cleanPhone);
  const pm = parsePaymentMethod(order.payment_method, order.payment_status);

  // Mensaje precargado para "¡Ya Llegué / Estoy Afuera!"
  const arrivedMessage = `🛵 ¡Hola ${order.customer_name || ''}! Soy el repartidor de ${brandName}.\n\nYa me encuentro afuera de tu dirección (*${order.delivery_address || ''}*) con tu pedido #${shortId} caliente y listo.\n\n¿Podrías salir a recibirlo, por favor? ¡Muchas gracias! 🙌`;
  const waArrivedUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(arrivedMessage)}` : '#';

  // Mensaje precargado general de contacto
  const standardMessage = `Hola ${order.customer_name || ''}, te saluda tu domiciliario de ${brandName} por tu pedido #${shortId}.`;
  const waStandardUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(standardMessage)}` : '#';

  const isDelivered = order.status === 'delivered';
  const isOnTheWay = order.status === 'on_table';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Barra Superior Rider */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Icon icon="solar:scooter-bold-duotone" className="text-xl" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 block leading-tight">
              Modo Repartidor
            </span>
            <h1 className="text-sm font-black text-white leading-tight">
              {brandName} · #{shortId}
            </h1>
          </div>
        </div>

        <div>
          {isDelivered ? (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase">
              ✅ Entregado
            </span>
          ) : isOnTheWay ? (
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-black uppercase flex items-center gap-1 animate-pulse">
              🛵 En Camino
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase">
              ⏳ Listo para salir
            </span>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4 pb-28">

        {/* Banner de Estado Entregado */}
        {isDelivered && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-center space-y-1">
            <Icon icon="solar:check-circle-bold" className="text-3xl text-emerald-400 mx-auto" />
            <h3 className="text-base font-black text-emerald-200">¡Entrega Completada!</h3>
            <p className="text-xs text-emerald-400/80">Este pedido ya fue registrado como entregado al cliente.</p>
          </div>
        )}

        {/* 1. HERO CARD: Dirección de Entrega & Cliente */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Cliente
              </span>
              <h2 className="text-xl font-black text-white leading-tight break-words">
                {order.customer_name || 'Cliente sin nombre'}
              </h2>
            </div>
            {cleanPhone && (
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg shrink-0 border border-slate-700">
                {order.customer_phone}
              </span>
            )}
          </div>

          {/* Dirección Gigante */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase">
              <Icon icon="heroicons:map-pin" className="text-base shrink-0" />
              <span>Dirección de Destino:</span>
            </div>
            <p className="text-lg font-black text-white leading-snug break-words">
              {order.delivery_address || 'Sin dirección registrada'}
            </p>

            {order.delivery_notes && (
              <div className="mt-2 pt-2 border-t border-slate-700 flex items-start gap-2 text-amber-300 text-xs font-semibold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <Icon icon="solar:notes-bold" className="text-base shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase text-[10px] block">Nota para entrega:</span>
                  <span>{order.delivery_notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Navegación GPS (Maps y Waze) */}
          {order.delivery_address && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href={getGoogleMapsUrl(order.delivery_address)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-sm transition-all active:scale-95"
              >
                <Icon icon="logos:google-maps" className="text-xl shrink-0" />
                <span>Google Maps</span>
              </a>
              <a
                href={getWazeUrl(order.delivery_address)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-sm transition-all active:scale-95"
              >
                <Icon icon="solar:routing-2-bold" className="text-xl shrink-0 text-cyan-400" />
                <span>Waze</span>
              </a>
            </div>
          )}
        </div>

        {/* 2. ACCIONES RÁPIDAS CON EL CLIENTE (BOTONES GIGANTES DE CONTACTO) */}
        {cleanPhone && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 block">
              Contacto Inmediato con el Cliente
            </span>

            {/* BOTÓN 1: ¡YA LLEGUÉ / ESTOY AFUERA! (SÚPER DESTACADO) */}
            <a
              href={waArrivedUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate([100, 50, 100]);
                }
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-base shadow-lg shadow-emerald-950/40 border border-emerald-400/30 active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon icon="solar:bell-bing-bold" className="text-2xl animate-bounce" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight">¡YA LLEGUÉ / ESTOY AFUERA!</span>
                  <span className="text-xs font-semibold text-emerald-100/90 block">Avisar por WhatsApp en 1 toque</span>
                </div>
              </div>
              <Icon icon="solar:arrow-right-bold" className="text-xl shrink-0" />
            </a>

            {/* BOTÓN 2 Y 3: LLAMADA TELEFÓNICA DIRECTA Y WHATSAPP NORMAL */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center justify-center gap-2.5 py-3.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 active:scale-95 transition-all shadow-md"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Icon icon="heroicons:phone" className="text-lg" />
                </div>
                <span>Llamar Directo</span>
              </a>

              <a
                href={waStandardUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 py-3.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-700 active:scale-95 transition-all shadow-md"
              >
                <div className="h-8 w-8 rounded-lg bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
                  <Icon icon="logos:whatsapp-icon" className="text-base" />
                </div>
                <span>Chat WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* 3. COBRO Y FINANZAS (CERO DUDAS PARA EL DOMICILIARIO) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Instrucción de Cobro
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
              order.payment_status === 'paid'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {order.payment_status === 'paid' ? 'Pagado' : 'Cobrar contra entrega'}
            </span>
          </div>

          {order.payment_status === 'paid' ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-black text-sm">
                <Icon icon="solar:check-circle-bold" className="text-lg" />
                <span>PEDIDO YA PAGADO</span>
              </div>
              <p className="text-xs text-slate-300">
                El cliente ya canceló por transferencia o anticipado. <strong>No debes cobrar dinero en efectivo.</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Total a Cobrar:</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ${Number(order.total_amount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">Método de pago:</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <Icon icon={pm.icon} className="text-emerald-400" />
                    {pm.shortLabel}
                  </span>
                </div>

                {pm.type === 'cash' && pm.detail && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs">
                    {pm.tendered && (
                      <div className="flex justify-between font-bold text-slate-300">
                        <span>Cliente paga con:</span>
                        <span className="text-white">{pm.tendered}</span>
                      </div>
                    )}
                    {pm.change && (
                      <div className="flex justify-between font-black text-amber-300 text-sm pt-1 border-t border-amber-500/20">
                        <span>Debes entregar vuelto:</span>
                        <span className="bg-amber-400/20 px-2 py-0.5 rounded-md text-amber-200">{pm.change}</span>
                      </div>
                    )}
                  </div>
                )}

                {pm.type === 'card' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 font-bold flex items-center gap-2">
                    <Icon icon="heroicons:credit-card" className="text-base shrink-0" />
                    <span>Llevar datáfono para cobro con tarjeta.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. CHECKLIST DE PRODUCTOS (REVISAR ANTES DE SALIR) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Icon icon="solar:checklist-minimalistic-bold" className="text-emerald-400 text-sm" />
              Verificar Comanda ({items.length} ítems)
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Toca para marcar</span>
          </div>

          <div className="space-y-2">
            {items.map((it) => {
              const isChecked = Boolean(checkedItems[it.id]);
              const name = it.products?.name || it.name || 'Producto';
              return (
                <div
                  key={it.id}
                  onClick={() => toggleCheckItem(it.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                    isChecked
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                      {it.quantity}x
                    </span>
                    <span className={`text-xs font-bold truncate ${isChecked ? 'line-through text-slate-400' : ''}`}>
                      {name}
                    </span>
                  </div>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isChecked ? 'bg-emerald-500 text-slate-950 font-black' : 'border border-slate-600'
                  }`}>
                    {isChecked && <Icon icon="solar:check-read-bold" className="text-sm" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* BARRA FLOTANTE DE CONTROL DE ENTREGA */}
      {!isDelivered && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          <div className="max-w-lg mx-auto flex items-center gap-2.5">
            {!isOnTheWay && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus('on_table')}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 disabled:opacity-50"
              >
                <Icon icon="solar:scooter-bold-duotone" className="text-lg" />
                <span>{updating ? 'Actualizando...' : '🛵 Salir a Entregar'}</span>
              </button>
            )}

            <button
              type="button"
              disabled={updating}
              onClick={() => {
                if (window.confirm('¿Confirmas que entregaste el pedido al cliente con éxito?')) {
                  handleUpdateStatus('delivered');
                }
              }}
              className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                isOnTheWay
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <Icon icon="solar:check-circle-bold" className="text-lg" />
              <span>{updating ? 'Guardando...' : '✅ Marcar como Entregado'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
