import React, { useState } from 'react';

export const FiadosCarteraModal = ({
  isOpen,
  onClose,
  pendingFiadosList,
  totalCarteraAmount,
  onSelectOrder,
  onSendWhatsAppCobro,
  onSettleFiadoOrder
}) => {
  const [settlingFiadoOrder, setSettlingFiadoOrder] = useState(null);
  const [fiadoPaymentMethod, setFiadoPaymentMethod] = useState('efectivo');

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md" onClick={onClose} />
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[88vh] border border-gray-100 z-10">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-amber-50/50 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs">
                🤝
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <span>Cartera de Fiados & Cuentas por Cobrar</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-black">
                    {pendingFiadosList.length}
                  </span>
                </h3>
                <p className="text-xs text-amber-900 font-medium">
                  Total por cobrar en la calle: <strong className="text-amber-950 font-black">${totalCarteraAmount.toLocaleString()}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center border border-gray-200 transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar bg-gray-50/40">
            {pendingFiadosList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-bold text-gray-400">¡Al día! No hay cuentas por cobrar ni fiados pendientes.</p>
              </div>
            ) : (
              pendingFiadosList.map(order => {
                const cleanCustName = (order.customer_name || 'Cliente').replace(/\[\s*🤝?\s*FIADO[^\]]*\]/gi, '').trim();
                const cleanNotes = (order.delivery_notes || '').replace(/\[\s*🤝?\s*FIADO[^\]]*\]/gi, '').trim();
                return (
                  <div 
                    key={order.id}
                    className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-400 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-gray-900">
                            #{order.id.slice(-4).toUpperCase()}
                          </span>
                          <span className="font-black text-sm text-gray-900">
                            {cleanCustName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                            {order.status === 'delivered' ? 'Entregado' : order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} • {order.fulfillment_type === 'delivery' ? '🛵 Domicilio' : '🛍️ Para Llevar / Mostrador'}
                          {order.customer_phone && ` • 📱 ${order.customer_phone}`}
                        </p>
                        {order.delivery_address && (
                          <p className="text-xs text-gray-600 mt-1 font-medium">
                            📍 {order.delivery_address}
                          </p>
                        )}
                        {cleanNotes && (
                          <p className="text-xs text-gray-500 italic mt-0.5">
                            📝 {cleanNotes}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-amber-950">
                          ${Number(order.total_amount || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider">
                          Por Cobrar
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                      {order.order_items?.map((it, idx) => (
                        <span key={idx} className="text-[11px] font-medium bg-gray-50 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200">
                          {it.quantity}x {it.products?.name}
                        </span>
                      ))}
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectOrder(order);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        👁️ Ver Comanda
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSendWhatsAppCobro(order)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          📱 WhatsApp
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettlingFiadoOrder(order)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          💰 Cobrar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de selección de bolsillo de pago para Fiados */}
      {settlingFiadoOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSettlingFiadoOrder(null)} />
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                  💰
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    Registrar Cobro
                  </h4>
                  <p className="text-xs font-bold text-emerald-700">
                    ${Number(settlingFiadoOrder.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettlingFiadoOrder(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                ¿A qué bolsillo ingresa el dinero?
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'efectivo', label: 'Efectivo (Gaveta física)' },
                  { id: 'nequi', label: 'Nequi / Bre-B' },
                  { id: 'daviplata', label: 'Daviplata' },
                  { id: 'bancolombia', label: 'Bancolombia QR / Transf.' },
                  { id: 'datafono', label: 'Datáfono / Bold' }
                ].map(m => {
                  const isSel = fiadoPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFiadoPaymentMethod(m.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isSel ? 'border-gray-900 bg-gray-900 text-white shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <span>{m.label}</span>
                      {isSel && <span className="text-emerald-400 font-black">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSettlingFiadoOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onSettleFiadoOrder(settlingFiadoOrder.id, fiadoPaymentMethod);
                  setSettlingFiadoOrder(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FiadosCarteraModal;
