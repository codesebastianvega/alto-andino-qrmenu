import React from 'react';
import { Icon } from '@iconify-icon/react';
import { getGoogleMapsUrl, getWazeUrl } from '@/utils/formatters';

export default function OrderDetailDeliveryCard({
  selectedOrder,
  onCustomerArrivalAlert,
  onSendDriverLink
}) {
  if (!selectedOrder?.delivery_address && selectedOrder?.fulfillment_type !== 'delivery') {
    return null;
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Icon icon="heroicons:map-pin" className="text-rose-500 text-sm" />
          Dirección de Entrega
        </p>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 uppercase">
          Domicilio
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-bold text-gray-900 leading-snug break-words">
          {selectedOrder.delivery_address || 'Sin dirección registrada'}
        </p>
        {selectedOrder.delivery_notes && (
          <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 mt-1">
            📝 <strong>Nota de Entrega:</strong> {selectedOrder.delivery_notes}
          </div>
        )}
      </div>

      {selectedOrder.delivery_address && (
        <>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={getGoogleMapsUrl(selectedOrder.delivery_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Abrir ubicación en Google Maps"
            >
              <Icon icon="logos:google-maps" className="text-base" />
              <span>Google Maps</span>
            </a>
            <a
              href={getWazeUrl(selectedOrder.delivery_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Navegar en Waze"
            >
              <Icon icon="solar:routing-2-bold" className="text-base text-cyan-600" />
              <span>Waze</span>
            </a>
          </div>

          {/* Contacto Directo: Llamada y Aviso de Llegada */}
          {selectedOrder.customer_phone && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Llamada telefónica inmediata al cliente"
              >
                <Icon icon="heroicons:phone" className="text-base text-emerald-600" />
                <span>Llamar Cliente</span>
              </a>

              <button
                type="button"
                onClick={onCustomerArrivalAlert}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Avisar que ya llegó el domiciliario por WhatsApp"
              >
                <Icon icon="solar:bell-bing-bold" className="text-base text-amber-600" />
                <span>🔔 ¡Ya Llegué!</span>
              </button>
            </div>
          )}

          {/* Asignar y Enviar al Domiciliario */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onSendDriverLink}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              title="Enviar comanda completa y enlace de entrega al domiciliario por WhatsApp"
            >
              <Icon icon="solar:scooter-bold-duotone" className="text-base text-emerald-400" />
              <span>📲 Enviar a Domiciliario (App de Entrega)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
