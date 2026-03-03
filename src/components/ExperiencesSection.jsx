import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from './Toast';

const TYPE_ICONS = {
  event: 'heroicons:sparkles',
  workshop: 'heroicons:wrench-screwdriver',
  tasting: 'heroicons:beaker',
  tour: 'heroicons:map',
  dinner: 'heroicons:fire',
  premium: 'heroicons:star',
};

import { useMenuData } from '../context/MenuDataContext';

export default function ExperiencesSection() {
  const { experiences, loading } = useMenuData();
  const [selectedExp, setSelectedExp] = useState(null);
  const [bookingForm, setBookingForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', guests: 1, selected_date: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleOpen = (e) => {
      setSelectedExp(e.detail);
    };
    window.addEventListener('aa:openExperience', handleOpen);
    return () => window.removeEventListener('aa:openExperience', handleOpen);
  }, []);

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.selected_date) {
      toast.error('Selecciona una fecha');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('experience_bookings').insert([{
      experience_id: selectedExp.id,
      ...bookingForm,
    }]);
    setSubmitting(false);
    if (error) {
      toast.error('Error al reservar. Intenta de nuevo.');
    } else {
      setSuccess(true);
    }
  };

  const closeModal = () => {
    setSelectedExp(null);
    setSuccess(false);
    setBookingForm({ customer_name: '', customer_phone: '', customer_email: '', guests: 1, selected_date: '', notes: '' });
  };

  if (loading || experiences.length === 0) return null;

  return (
    <section className="mt-10 mb-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-[#2f4131] flex items-center justify-center">
          <Icon icon="heroicons:sparkles" className="text-white text-lg" />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900 leading-tight">Experiencias</h2>
          <p className="text-[11px] text-gray-500 font-medium">Reserva catas, talleres y eventos únicos</p>
        </div>
      </div>

      {/* Cards */}
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {experiences.map(exp => {
          const nextDate = exp.dates?.[0];
          return (
            <div
              key={exp.id}
              onClick={() => setSelectedExp(exp)}
              className="group flex-shrink-0 w-[280px] sm:w-[320px] h-[360px] snap-start relative rounded-3xl overflow-hidden shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] bg-[#2f4131]"
            >
              {exp.image_url ? (
                <img src={exp.image_url} alt={exp.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2f4131] to-[#4a6741]">
                  <Icon icon={TYPE_ICONS[exp.type] || TYPE_ICONS.event} className="text-7xl text-white/10" />
                </div>
              )}
              
              {/* Grandient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-end">
                {/* Header info (duration/capacity) */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 text-[10px] text-white/90 font-medium">
                    <span className="flex items-center gap-1"><Icon icon="heroicons:clock" /> {exp.duration_minutes}m</span>
                    <span className="flex items-center gap-1"><Icon icon="heroicons:users" /> {exp.capacity}</span>
                  </div>
                  {nextDate && (
                    <div className="bg-[#7db87a]/90 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <Icon icon="heroicons:calendar" /> {nextDate.date}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                  <h3 className="text-white font-black text-xl leading-tight mb-2 drop-shadow-md">{exp.title}</h3>
                  <p className="text-sm text-white/80 line-clamp-2 mb-4 leading-relaxed opacity-0 transition-opacity duration-300 group-hover:opacity-100">{exp.short_description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-black text-white">{formatCurrency(exp.price)}</span>
                    <div className="bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-[#2f4131] font-bold text-xs px-4 py-2 rounded-full transition-colors flex items-center gap-2">
                      Ver detalle <Icon icon="heroicons:arrow-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Detail + Booking Modal ─── */}
      {selectedExp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center" onClick={closeModal}>
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {success ? (
              /* Success State */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="heroicons:check" className="text-3xl text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">¡Reserva Confirmada!</h3>
                <p className="text-gray-500 text-sm mb-6">Te hemos registrado para <strong>{selectedExp.title}</strong>. Te contactaremos pronto con los detalles.</p>
                <button onClick={closeModal} className="bg-[#2f4131] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#1a251b] transition-colors">
                  Perfecto
                </button>
              </div>
            ) : (
              <>
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-[#2f4131] to-[#4a6741] relative overflow-hidden">
                  {selectedExp.image_url ? (
                    <img src={selectedExp.image_url} alt={selectedExp.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon icon={TYPE_ICONS[selectedExp.type] || TYPE_ICONS.event} className="text-7xl text-white/20" />
                    </div>
                  )}
                  <button onClick={closeModal} className="absolute top-3 right-3 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm">
                    <Icon icon="heroicons:x-mark" className="text-lg" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-black text-xl leading-tight">{selectedExp.title}</h3>
                    <div className="flex items-center gap-3 text-white/70 text-xs mt-1.5 font-medium">
                      <span className="flex items-center gap-1"><Icon icon="heroicons:clock" /> {selectedExp.duration_minutes} min</span>
                      <span className="flex items-center gap-1"><Icon icon="heroicons:users" /> {selectedExp.capacity} cupos</span>
                      {selectedExp.location && <span className="flex items-center gap-1"><Icon icon="heroicons:map-pin" /> {selectedExp.location}</span>}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-[#2f4131]">{formatCurrency(selectedExp.price)}</span>
                    <span className="text-xs text-gray-400 font-bold">por persona</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedExp.description}</p>

                  {/* Includes */}
                  {selectedExp.includes?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Incluye</h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        {selectedExp.includes.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <Icon icon="heroicons:check-circle" className="text-emerald-500 text-base flex-shrink-0" />
                            <span className="font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking Form */}
                  <form onSubmit={handleBooking} className="space-y-3 border-t border-gray-100 pt-5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reservar Ahora</h4>

                    {/* Date selection */}
                    {selectedExp.dates?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {selectedExp.dates.map((d, i) => (
                          <button
                            key={i} type="button"
                            onClick={() => setBookingForm({ ...bookingForm, selected_date: `${d.date}T${d.start_time}` })}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                              bookingForm.selected_date === `${d.date}T${d.start_time}`
                                ? 'bg-[#2f4131] text-white border-[#2f4131]'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#7db87a]'
                            }`}
                          >
                            {d.date} · {d.start_time}
                          </button>
                        ))}
                      </div>
                    )}

                    <input type="text" required placeholder="Tu nombre completo"
                      value={bookingForm.customer_name}
                      onChange={e => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="tel" placeholder="WhatsApp / Teléfono"
                        value={bookingForm.customer_phone}
                        onChange={e => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium"
                      />
                      <input type="number" min={1} max={selectedExp.capacity} required placeholder="# Personas"
                        value={bookingForm.guests}
                        onChange={e => setBookingForm({ ...bookingForm, guests: Number(e.target.value) })}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium"
                      />
                    </div>
                    <input type="email" placeholder="Email (opcional)"
                      value={bookingForm.customer_email}
                      onChange={e => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium"
                    />
                    <textarea rows={2} placeholder="Notas o restricciones alimentarias (opcional)"
                      value={bookingForm.notes}
                      onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium resize-none"
                    />

                    <button type="submit" disabled={submitting}
                      className="w-full bg-[#4a6741] text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-[#3d5536] transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Reservando...' : (
                        <>
                          <Icon icon="heroicons:ticket" /> Confirmar Reserva
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
