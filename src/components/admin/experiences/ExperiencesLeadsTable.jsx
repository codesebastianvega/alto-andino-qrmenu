import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function ExperiencesLeadsTable({
  leads,
  loading,
  onTogglePaymentStatus,
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4131]"></div>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Icon icon="heroicons:ticket" className="text-5xl mb-4" />
          <p className="font-medium">Ouch. Aún no hay reservas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-100">
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold max-w-[200px]">Experiencia</th>
                <th className="p-4 font-bold">Detalles</th>
                <th className="p-4 font-bold">Reserva</th>
                <th className="p-4 font-bold text-center">Pago</th>
                <th className="p-4 font-bold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{lead.customer_name}</p>
                    {lead.customer_email && (
                      <p className="text-xs text-gray-500">{lead.customer_email}</p>
                    )}
                    {lead.customer_phone && (
                      <p className="text-xs text-gray-500">{lead.customer_phone}</p>
                    )}
                  </td>
                  <td className="p-4 max-w-[200px]">
                    <p
                      className="font-bold text-gray-700 text-sm truncate"
                      title={lead.experiences?.title}
                    >
                      {lead.experiences?.title}
                    </p>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <p>
                      <Icon icon="heroicons:users" className="inline mr-1" />
                      {lead.guests} personas
                    </p>
                    <p>
                      <Icon icon="heroicons:calendar" className="inline mr-1" />
                      {new Date(lead.selected_date).toLocaleDateString('es-CO')}
                    </p>
                    {lead.notes && (
                      <p
                        className="text-xs text-gray-400 italic mt-1 line-clamp-1"
                        title={lead.notes}
                      >
                        "{lead.notes}"
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-gray-400">
                      Creada: {new Date(lead.created_at).toLocaleDateString('es-CO')}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onTogglePaymentStatus(lead.id, lead.payment_status)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer ${
                        lead.payment_status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      } transition-colors`}
                    >
                      {lead.payment_status === 'paid' ? 'Pagada' : 'Pendiente'}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        lead.status === 'confirmed'
                          ? 'bg-green-50 text-green-600'
                          : lead.status === 'cancelled'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {lead.status === 'confirmed'
                        ? 'Confirmada'
                        : lead.status === 'cancelled'
                        ? 'Cancelada'
                        : 'Completada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
