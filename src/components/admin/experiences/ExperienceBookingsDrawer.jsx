import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function ExperienceBookingsDrawer({
  isOpen,
  bookings,
  loading,
  onClose,
  onTogglePaymentStatus,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-end z-50">
      <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-gray-900">Reservas</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-2xl" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4131]"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Icon icon="heroicons:ticket" className="text-4xl mb-3" />
            <p className="font-medium">Sin reservas aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{b.customer_name}</p>
                    {b.customer_phone && (
                      <p className="text-xs text-gray-500">{b.customer_phone}</p>
                    )}
                    {b.customer_email && (
                      <p className="text-xs text-gray-500">{b.customer_email}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        b.status === 'confirmed'
                          ? 'bg-green-50 text-green-600'
                          : b.status === 'cancelled'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {b.status === 'confirmed'
                        ? 'Confirmada'
                        : b.status === 'cancelled'
                        ? 'Cancelada'
                        : 'Completada'}
                    </span>
                    <button
                      onClick={() => onTogglePaymentStatus(b.id, b.payment_status)}
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full cursor-pointer ${
                        b.payment_status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      } transition-colors`}
                    >
                      {b.payment_status === 'paid' ? 'Pagada' : 'Pendiente'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    <Icon icon="heroicons:users" className="mr-1 inline" />
                    {b.guests} persona{b.guests > 1 ? 's' : ''}
                  </span>
                  <span>
                    <Icon icon="heroicons:calendar" className="mr-1 inline" />
                    {new Date(b.selected_date).toLocaleDateString('es-CO')}
                  </span>
                </div>
                {b.notes && (
                  <p className="text-xs text-gray-400 mt-2 italic">"{b.notes}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
