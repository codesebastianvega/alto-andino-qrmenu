import React from 'react';
import { Icon } from '@iconify-icon/react';
import { TYPE_LABELS, formatCurrency } from '../../../hooks/experiences/useAdminExperiencesData';

export default function ExperiencesCardsGrid({
  experiences,
  onOpenBookings,
  onEditExperience,
  onToggleActive,
  onDeleteExperience,
}) {
  if (experiences.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 border border-gray-100 text-center">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Sin experiencias aún</h2>
        <p className="text-gray-500">Crea tu primera experiencia para empezar a recibir reservas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {experiences.map((exp) => {
        const typeInfo = TYPE_LABELS[exp.type] || TYPE_LABELS.event;
        const nextDate = exp.dates?.[0];

        return (
          <div
            key={exp.id}
            className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${
              !exp.is_active ? 'opacity-60' : ''
            }`}
          >
            {/* Image */}
            <div className="h-44 bg-gradient-to-br from-[#2f4131] to-[#4a6741] relative flex items-center justify-center overflow-hidden">
              {exp.image_url ? (
                <img
                  src={exp.image_url}
                  alt={exp.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon icon={typeInfo.icon} className="text-6xl text-white/30" />
              )}
              <span
                className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeInfo.color}`}
              >
                {typeInfo.label}
              </span>
              {!exp.is_active && (
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-white">
                  Inactiva
                </span>
              )}
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                {exp.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {exp.short_description}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Icon icon="heroicons:clock" /> {exp.duration_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Icon icon="heroicons:users" /> {exp.capacity} cupos
                </span>
                {exp.location && (
                  <span className="flex items-center gap-1">
                    <Icon icon="heroicons:map-pin" /> {exp.location}
                  </span>
                )}
              </div>

              {nextDate && (
                <div className="bg-gray-50 px-3 py-2 rounded-xl mb-4 text-xs font-medium text-gray-600 flex items-center gap-2">
                  <Icon icon="heroicons:calendar" className="text-[#7db87a]" />
                  Próxima: {nextDate.date} · {nextDate.start_time} – {nextDate.end_time}
                  <span className="ml-auto font-bold text-[#2f4131]">
                    {nextDate.spots_left} libres
                  </span>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between">
                <span className="text-xl font-black text-[#2f4131]">
                  {formatCurrency(exp.price)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenBookings(exp.id)}
                    className="p-2 rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Ver reservas"
                  >
                    <Icon icon="heroicons:ticket" className="text-lg" />
                  </button>
                  <button
                    onClick={() => onEditExperience(exp)}
                    className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Icon icon="heroicons:pencil-square" className="text-lg" />
                  </button>
                  <button
                    onClick={() => onToggleActive(exp.id, exp.is_active)}
                    className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    title={exp.is_active ? 'Desactivar' : 'Activar'}
                  >
                    <Icon
                      icon={exp.is_active ? 'heroicons:eye' : 'heroicons:eye-slash'}
                      className="text-lg"
                    />
                  </button>
                  <button
                    onClick={() => onDeleteExperience(exp.id, exp.title)}
                    className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Icon icon="heroicons:trash" className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
