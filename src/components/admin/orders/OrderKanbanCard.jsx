import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Icon } from '@iconify-icon/react';
import { OrderTimer } from './OrderTimer';
import OrderTimingBreakdown from './OrderTimingBreakdown';
import { getOrderSchedule } from '../../../utils/orderTiming';
import { parsePaymentMethod, getGoogleMapsUrl, resolveOrderItemName } from '../../../utils/formatters';

export const getFulfillmentLabel = (type) => {
  switch (type) {
    case 'dine_in': return { text: 'EN MESA', icon: 'heroicons:hand-raised', color: 'bg-emerald-100 text-emerald-700' };
    case 'takeaway': return { text: 'PARA LLEVAR', icon: 'heroicons:shopping-bag', color: 'bg-blue-100 text-blue-700' };
    case 'delivery': return { text: 'DOMICILIO', icon: 'heroicons:truck', color: 'bg-purple-100 text-purple-700' };
    default: return { text: type, icon: 'heroicons:question-mark-circle', color: 'bg-gray-100 text-gray-700' };
  }
};

export const OrderKanbanCard = ({
  order,
  index,
  isMerging,
  mergeSourceOrder,
  handleMergeOrders,
  onSelectOrder,
  onOpenAddition,
  restaurantSettings
}) => {
  const fl = getFulfillmentLabel(order.fulfillment_type);
  const schedule = getOrderSchedule(order, Date.now(), restaurantSettings?.target_prep_time_mins || 15);

  return (
    <Draggable key={order.id} draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => { 
            if (isMerging) {
              handleMergeOrders(mergeSourceOrder, order);
            } else {
              onSelectOrder(order); 
            }
          }}
          className={`bg-white p-4 rounded-xl shadow-xs border transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-3.5 ${
            snapshot.isDragging ? 'shadow-2xl ring-4 ring-emerald-500/20 scale-102 rotate-1 z-50' : 'active:scale-[0.98]'
          } ${
            order?.fulfillment_type === 'dine_in' 
              ? 'border-emerald-200/70 hover:border-emerald-400' 
              : 'border-slate-200/80 hover:border-emerald-300'
          } ${
            snapshot.isCombiningWith ? 'bg-emerald-50 border-emerald-500 border-2' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col">
                <span className={`text-xl font-black leading-tight truncate group-hover:text-emerald-800 transition-colors ${
                  order?.fulfillment_type === 'dine_in' ? 'text-emerald-900' : 'text-gray-900'
                }`}>
                  {order?.fulfillment_type === 'dine_in' 
                    ? (order?.restaurant_tables?.table_number ? `Mesa ${order.restaurant_tables.table_number}` : 'Mesa ?')
                    : (order?.customer_name || 'Sin nombre')}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest bg-gray-50 px-1.5 py-0.5 rounded">
                    #{order?.id?.slice(0, 4).toUpperCase()}
                  </span>
                  {order?.fulfillment_type === 'dine_in' && order?.customer_name && (
                    <span className="text-[10px] text-gray-400 font-medium truncate">• {order?.customer_name}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <OrderTimer order={order} />
              {order.fulfillment_type === 'dine_in' && (
                <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">MESA</span>
              )}
              {order.status === 'on_the_way' && (
                <span className="text-[8px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">EN CAMINO</span>
              )}
            </div>
          </div>

          {schedule && <div className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-2 text-[11px] text-sky-800">
            <span className="font-bold">Programado: {new Date(schedule.at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {schedule.label}</span>
            {['new', 'waiting_payment'].includes(order.status) && <span className="block text-[10px] mt-0.5">Preparar desde {new Date(schedule.preparationAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}. Inicia cocina cuando se empiece realmente.</span>}
          </div>}
          <OrderTimingBreakdown order={order} compact />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs border border-black/5 ${fl.color}`}>
              <Icon icon={fl.icon} />
              {fl.text}
            </span>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              {order?.order_items?.length || 0} ítems
            </span>
            {order.bar_status === 'ready' && (
              <span className="text-[9px] font-black text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                🍸 Bebidas listas
              </span>
            )}
            {order.kitchen_status === 'ready' && (
              <span className="text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                🍳 Cocina lista
              </span>
            )}
          </div>
          
          {/* Chip Método de Pago */}
          {(() => {
            const pm = parsePaymentMethod(order.payment_method, order.payment_status);
            return (
              <div className={`mt-2 flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-black ${pm.bg} ${pm.text} ${pm.border}`}>
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <Icon icon={pm.icon} className="text-sm shrink-0" />
                  <span className="truncate" title={pm.fullText || pm.label}>{pm.label}</span>
                </div>
                {order.payment_status === 'paid' ? (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                    Pagado
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 border border-amber-300/60 shrink-0">
                    Cobrar
                  </span>
                )}
              </div>
            );
          })()}

          {/* Dirección de Entrega y Botón Maps */}
          {order.delivery_address && (
            <div 
              className="mt-1.5 flex items-center justify-between gap-1.5 px-2.5 py-1 bg-rose-50/70 border border-rose-100 rounded-lg text-[11px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Icon icon="heroicons:map-pin" className="text-rose-500 text-xs shrink-0" />
                <span className="truncate font-semibold text-gray-800" title={order.delivery_address}>
                  {order.delivery_address}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {order.customer_phone && (
                  <a
                    href={`tel:${order.customer_phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[10px] transition-colors shadow-2xs cursor-pointer"
                    title="Llamar al cliente"
                  >
                    <Icon icon="heroicons:phone" className="text-xs text-emerald-600" />
                    <span>Llamar</span>
                  </a>
                )}
                <a
                  href={getGoogleMapsUrl(order.delivery_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-[10px] transition-colors shadow-2xs cursor-pointer"
                  title="Abrir dirección en Google Maps"
                >
                  <Icon icon="solar:map-point-bold" className="text-xs text-rose-600" />
                  <span>Maps</span>
                </a>
              </div>
            </div>
          )}

          {/* Indicador de Pago / Saldo */}
          {order?.payment_status !== 'paid' && order?.status !== 'cancelled' && (
            <div className={`flex flex-col gap-1.5 px-3 py-2 rounded-lg border transition-colors ${
              (restaurantSettings?.payment_requirement_stage === 'pre_preparation' && order?.status === 'new') ||
              (restaurantSettings?.payment_requirement_stage === 'pre_delivery' && order?.status === 'ready')
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-rose-50/40 border-rose-100 text-rose-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon icon="heroicons:banknotes" className="text-sm" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {order?.paid_amount > 0 ? 'Falta Saldo' : 'Pago Pendiente'}
                  </span>
                </div>
                <span className="text-xs font-black">
                  {order?.paid_amount > 0 
                    ? `$${(order.total_amount - order.paid_amount).toLocaleString()}` 
                    : `$${Number(order?.total_amount || 0).toLocaleString()}`}
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-2 mt-1">
            {order.order_items?.slice(0, 2).map(item => (
              <div key={item.id} className="text-[13px] text-gray-600 truncate flex items-center gap-2">
                <span className="font-black text-emerald-700 bg-emerald-50 w-6 h-6 flex items-center justify-center rounded-lg text-[10px] shrink-0">
                  {item.quantity}x
                </span>
                <span className="font-medium truncate">{resolveOrderItemName(item)}</span>
              </div>
            ))}
            {order.order_items?.length > 2 && (
              <div className="text-[10px] text-gray-400 font-bold pl-8">
                +{order.order_items.length - 2} productos más...
              </div>
            )}
          </div>

          {/* Pie de Tarjeta: Total y Botón + Adición */}
          <div className="pt-2.5 mt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-black text-gray-900">
              ${Number(order?.total_amount || 0).toLocaleString()}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAddition(order);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200/80 transition-colors cursor-pointer shadow-2xs"
              title="Agregar producto o adición a este pedido"
            >
              <Icon icon="solar:cart-plus-bold" className="text-xs text-amber-700" />
              <span>+ Adición</span>
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default OrderKanbanCard;
