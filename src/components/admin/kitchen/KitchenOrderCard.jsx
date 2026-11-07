import { Icon } from '@iconify-icon/react';
import TicketTimer from './TicketTimer';
import { printThermalDocument } from '../../../utils/thermalPrint';
import { resolveOrderItemName } from '../../../utils/formatters';
import { isBarItem, isKitchenItem } from '../../../utils/kdsHelpers';

export default function KitchenOrderCard({
  order,
  isDark,
  stationFilter,
  restaurantSettings,
  activeBrand,
  updatingStatus,
  onOpenDishRecipe,
  onMarkAsPreparing,
  onMarkAsReady
}) {
  const itemsToShow = order.order_items?.filter(it => {
    if (stationFilter === 'kitchen') return isKitchenItem(it);
    if (stationFilter === 'bar') return isBarItem(it);
    return true;
  }) || [];

  const otherItemsCount = (order.order_items || []).length - itemsToShow.length;
  if (itemsToShow.length === 0) return null;

  const isPreparing = order.status === 'preparing';

  return (
    <div 
      className={`flex flex-col rounded-xl border transition-all overflow-hidden ${
        isDark 
          ? `bg-[#111827] ${isPreparing ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/20' : 'border-gray-800'}`
          : `bg-white ${isPreparing ? 'border-emerald-400 shadow-md ring-1 ring-emerald-400/20' : 'border-slate-200 shadow-xs'}`
      }`}
    >
      {/* Top Status Stripe */}
      <div className={`h-1.5 w-full ${isPreparing ? 'bg-emerald-500' : isDark ? 'bg-blue-500' : 'bg-slate-800'}`} />

      {/* Ticket Header */}
      <div className={`p-3.5 pb-2.5 border-b ${
        isDark ? 'border-gray-800/80 bg-gray-900/60' : 'border-slate-100 bg-slate-50/70'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {order.fulfillment_type === 'dine_in' ? (
              <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-white shadow-2xs'
              }`}>
                Mesa {order.restaurant_tables?.table_number || '?'}
              </span>
            ) : order.fulfillment_type === 'takeaway' ? (
              <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-900 border border-blue-200'
              }`}>
                Llevar
              </span>
            ) : (
              <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}>
                Domicilio
              </span>
            )}

            <span className={`font-mono text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>
              #{order.id.slice(0, 4)}
            </span>

            {stationFilter === 'kitchen' && otherItemsCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                isDark 
                  ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50' 
                  : 'text-cyan-800 bg-cyan-50 border-cyan-200'
              }`}>
                🍸 +{otherItemsCount} bar
              </span>
            )}
            {stationFilter === 'kitchen' && order.bar_status === 'ready' && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isDark
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse'
                  : 'bg-teal-50 text-teal-800 border border-teal-200'
              }`}>
                🍸 BEBIDAS YA LISTAS
              </span>
            )}
            {stationFilter === 'kitchen' && order.bar_status === 'preparing' && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isDark
                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                🍸 Barra preparando
              </span>
            )}
            {stationFilter === 'bar' && otherItemsCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                isDark 
                  ? 'text-orange-400 bg-orange-950/60 border-orange-800/50' 
                  : 'text-orange-800 bg-orange-50 border-orange-200'
              }`}>
                🍳 +{otherItemsCount} cocina
              </span>
            )}
          </div>

          <TicketTimer 
            createdAt={order.created_at} 
            scheduledTime={order.scheduled_time} 
            isDark={isDark} 
            targetMins={restaurantSettings?.target_prep_time_mins || 15} 
          />
        </div>

        {order.customer_name && (
          <p className={`text-xs font-medium truncate mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Cliente: <span className={isDark ? 'text-gray-200 font-bold' : 'text-slate-800 font-bold'}>{order.customer_name}</span>
          </p>
        )}
      </div>

      {/* Ticket Items List */}
      <div className={`p-3.5 space-y-2.5 flex-1 min-h-[140px] max-h-[46vh] overflow-y-auto ${
        isDark ? 'bg-[#111827]' : 'bg-white'
      }`}>
        {itemsToShow.map((item, idx) => (
          <div key={idx} className={`flex items-start gap-2.5 py-1 border-b last:border-0 ${
            isDark ? 'border-gray-800/40' : 'border-slate-100'
          }`}>
            <span className={`w-6 h-6 rounded font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
              isDark ? 'bg-gray-800 text-white' : 'bg-slate-900 text-white'
            }`}>
              {item.quantity}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-1">
                <p 
                  onClick={() => onOpenDishRecipe(item)}
                  className={`text-sm font-bold uppercase leading-tight truncate cursor-pointer hover:underline flex items-center gap-1 ${
                    isDark ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-indigo-600'
                  }`}
                  title="Toca para ver ficha técnica y gramajes"
                >
                  <span>{resolveOrderItemName(item)}</span>
                  <Icon icon="heroicons:information-circle" className="text-xs opacity-60" />
                </p>
                {stationFilter === 'all' && (
                  <span className={`text-[9px] font-bold px-1 rounded uppercase shrink-0 border ${
                    isBarItem(item) 
                      ? (isDark ? 'text-cyan-400 bg-cyan-950 border-cyan-800' : 'text-cyan-800 bg-cyan-50 border-cyan-200')
                      : (isDark ? 'text-orange-400 bg-orange-950 border-orange-800' : 'text-orange-800 bg-orange-50 border-orange-200')
                  }`}>
                    {isBarItem(item) ? 'Bar' : 'Cocina'}
                  </span>
                )}
              </div>

              {/* Modificadores */}
              {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(item.modifiers).filter(([group]) => !group.startsWith('_')).map(([group, choice]) => {
                    const formatted = Array.isArray(choice) ? choice.join(', ') : (typeof choice === 'object' && choice ? (choice.name || JSON.stringify(choice)) : choice);
                    return (
                      <span key={group} className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        isDark ? 'text-amber-300 bg-amber-950/40 border-amber-800/60' : 'text-amber-950 bg-amber-50 border-amber-200'
                      }`}>
                        <span className="opacity-75">{group}:</span> {formatted}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Notas de Ítem */}
              {item.notes && (
                <div className={`mt-1 text-xs rounded px-2 py-0.5 border ${
                  isDark 
                    ? 'text-rose-300 bg-rose-950/40 border-rose-900/50' 
                    : 'text-amber-900 bg-amber-50 border-amber-200 font-medium'
                }`}>
                  ⚠️ {item.notes}
                </div>
              )}
            </div>
          </div>
        ))}

        {order.notes && (
          <div className={`text-xs rounded p-2 mt-2 border ${
            isDark 
              ? 'text-blue-300 bg-blue-950/30 border-blue-900/40' 
              : 'text-slate-700 bg-slate-50 border-slate-200'
          }`}>
            <span className="font-bold">Nota General:</span> {order.notes}
          </div>
        )}
      </div>

      {/* Ticket Action Footer */}
      <div className={`p-2.5 pt-2 border-t flex items-center gap-2 ${
        isDark ? 'border-gray-800/80 bg-gray-900/40' : 'border-slate-100 bg-slate-50/80'
      }`}>
        {restaurantSettings?.kitchen_print_enabled && (
          <button
            onClick={() => printThermalDocument({ order, type: 'kitchen', width: restaurantSettings?.thermal_paper_width || '80', businessName: activeBrand?.name, business: activeBrand })}
            title="Imprimir comanda térmica"
            className={`h-9 px-2.5 rounded-lg border flex items-center justify-center transition-all ${
              isDark 
                ? 'border-gray-800 hover:border-gray-700 bg-gray-800/60 text-gray-300 hover:text-white' 
                : 'border-slate-200 hover:bg-white text-slate-600 shadow-2xs'
            }`}
          >
            <Icon icon="solar:printer-2-linear" className="text-base" />
          </button>
        )}

        {order.status === 'new' ? (
          <button
            onClick={() => onMarkAsPreparing(order.id)}
            disabled={updatingStatus === order.id}
            className={`flex-1 h-9 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
              isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : 'Iniciar Preparación'}
          </button>
        ) : (
          <button
            onClick={() => onMarkAsReady(order.id)}
            disabled={updatingStatus === order.id}
            className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {updatingStatus === order.id ? <Icon icon="line-md:loading-loop" /> : 'Marcar Listo ✓'}
          </button>
        )}
      </div>
    </div>
  );
}
