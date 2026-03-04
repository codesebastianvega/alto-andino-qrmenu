import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_ICONS = {
  event: 'heroicons:sparkles',
  workshop: 'heroicons:wrench-screwdriver',
  tasting: 'heroicons:beaker',
  tour: 'heroicons:map',
  dinner: 'heroicons:fire',
  premium: 'heroicons:star',
};

import { useMenuData } from '../context/MenuDataContext';

export default function ExperiencesSection({ variant = "slider", hideHeader = false }) {
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
    <section className={hideHeader ? "" : "mt-10 mb-6"}>
      {/* Section Header */}
      {!hideHeader && (
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-[#2f4131] flex items-center justify-center">
            <Icon icon="heroicons:sparkles" className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">Experiencias</h2>
            <p className="text-[11px] text-gray-500 font-medium">Reserva catas, talleres y eventos únicos</p>
          </div>
        </div>
      )}

      {/* Cards container */}
      <div className={variant === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
        : "flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-1 px-1"}>
        {experiences.map((exp, idx) => {
          const nextDate = exp.dates?.[0];
          return (
              <div
                key={exp.id}
                onClick={() => setSelectedExp(exp)}
                className={`group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all border border-black/5 flex flex-col cursor-pointer ${variant === 'slider' ? 'flex-shrink-0 w-[280px] sm:w-[320px] snap-start' : 'w-full'}`}
              >
                <div className="w-full h-56 md:h-64 mb-5 overflow-hidden rounded-[1.5rem] relative">
                  {exp.image_url ? (
                    <img src={exp.image_url} alt={exp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2f4131] to-[#4a6741]">
                      <Icon icon={TYPE_ICONS[exp.type] || TYPE_ICONS.event} className="text-5xl text-white/20" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Date Pill over image */}
                  {nextDate && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                      <Icon icon="heroicons:calendar" className="text-[#E6B05C] text-sm" />
                       <span className="text-[10px] font-bold tracking-widest text-[#1A1A1A]">{nextDate.date}</span>
                    </div>
                  )}
                  
                   {/* Status Tag dummy */}
                   <div className="absolute top-4 left-4 bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                    {exp.type || "Evento"}
                  </div>
                </div>
                
                <div className="px-4 pb-4 flex flex-col flex-1">
                  <h3 className="font-extrabold text-xl mb-3 text-[#1A1A1A] group-hover:text-[#E6B05C] transition-colors line-clamp-2">{exp.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-black/50 mb-6">
                    <div className="flex items-center gap-1.5"><Icon icon="heroicons:clock" className="text-sm" /> <span>{exp.duration_minutes}m</span></div>
                    <div className="flex items-center gap-1.5"><Icon icon="heroicons:users" className="text-sm" /> <span>Aforo: {exp.capacity}</span></div>
                  </div>

                  <div className="mt-auto flex justify-between items-center border-t border-black/5 pt-4">
                    <span className="font-extrabold text-2xl text-[#1A1A1A]">{formatCurrency(exp.price)}</span>
                    <div className="w-10 h-10 rounded-full bg-[#E6B05C] text-[#1A1A1A] flex items-center justify-center hover:scale-110 hover:bg-[#1A1A1A] hover:text-white transition-all shadow-lg shadow-[#E6B05C]/30">
                      <Icon icon="heroicons:arrow-right" className="text-lg" />
                    </div>
                  </div>
                </div>
              </div>
          );
        })}
      </div>

      {/* ─── Detail + Booking Modal ─── */}
      <AnimatePresence>
        {selectedExp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4" 
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl md:max-w-4xl lg:max-w-5xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative max-h-[90vh] md:max-h-[85vh] flex flex-col md:flex-row"
              onClick={e => e.stopPropagation()}
            >
              {success ? (
                /* Success State */
                <div className="p-10 text-center flex flex-col items-center justify-center w-full min-h-[400px]">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner mx-auto">
                    <Icon icon="heroicons:check" className="text-4xl text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1A1A1A] mb-3">¡Reserva Confirmada!</h3>
                  <p className="text-black/50 text-sm mb-8 leading-relaxed max-w-xs mx-auto">Te hemos registrado para <strong className="text-black">{selectedExp.title}</strong>. Te contactaremos pronto con los detalles para tu pago.</p>
                  <button onClick={closeModal} className="bg-[#1A1A1A] text-white font-bold px-8 py-4 rounded-full hover:bg-[#2a2a2a] transition-all shadow-lg w-full max-w-xs mx-auto block">
                    Perfecto
                  </button>
                </div>
              ) : (
                <>
                  {/* Left Column: Immersive Image Header */}
                  <div className="h-56 sm:h-72 md:h-auto md:w-2/5 lg:w-1/2 bg-[#1A2421] relative overflow-hidden shrink-0 flex flex-col justify-end">
                    <button onClick={closeModal} className="md:hidden absolute top-5 right-5 z-20 bg-black/20 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-md border border-white/20 hover:bg-black/40 transition-colors shadow-lg">
                      <Icon icon="heroicons:x-mark" className="text-lg" />
                    </button>

                    {selectedExp.image_url ? (
                      <img src={selectedExp.image_url} alt={selectedExp.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A2421] to-[#2f4131]">
                        <Icon icon={TYPE_ICONS[selectedExp.type] || TYPE_ICONS.event} className="text-7xl text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 md:from-black/80 md:via-black/20 md:to-transparent" />
                    
                    <div className="relative p-6 sm:p-8 md:p-10 z-10 w-full">
                      {/* Status Label */}
                      <div className="inline-flex glass-panel bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/20">
                        {selectedExp.type || "Evento"}
                      </div>
                      <h3 className="text-white font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-tight mb-4">{selectedExp.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-white/80 text-xs font-medium">
                        <span className="flex items-center gap-1.5"><Icon icon="heroicons:clock" className="text-base text-[#E6B05C]" /> {selectedExp.duration_minutes} min</span>
                        <span className="flex items-center gap-1.5"><Icon icon="heroicons:users" className="text-base text-[#E6B05C]" /> {selectedExp.capacity} cupos</span>
                        {selectedExp.location && <span className="flex items-center gap-1.5"><Icon icon="heroicons:map-pin" className="text-base text-[#E6B05C]" /> {selectedExp.location}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scrollable details and form */}
                  <div className="md:w-3/5 lg:w-1/2 overflow-y-auto overflow-x-hidden scrollbar-hide flex-shrink min-h-0 relative pb-28 md:pb-0">
                    <button onClick={closeModal} className="hidden md:flex flex-shrink-0 absolute top-5 right-5 z-20 bg-black/5 text-[#1A1A1A] rounded-full w-8 h-8 items-center justify-center hover:bg-black/10 transition-colors">
                      <Icon icon="heroicons:x-mark" className="text-lg" />
                    </button>

                    <div className="p-6 md:p-8 lg:p-10 space-y-8 bg-white min-h-full">
                      {/* Price header */}
                      <div className="flex items-center justify-between pb-6 border-b border-black/5">
                        <div>
                          <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1">Inversión</p>
                          <span className="text-3xl font-black text-[#1A1A1A]">{formatCurrency(selectedExp.price)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-1">Cupos Disp.</span>
                          <span className="bg-[#E6B05C]/20 text-[#a37633] px-3 py-1 rounded-md text-sm font-bold">{selectedExp.capacity} left</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-3">Sobre la experiencia</h4>
                        <p className="text-sm text-[#1A1A1A]/70 leading-relaxed font-medium">{selectedExp.description}</p>
                      </div>

                      {/* Includes */}
                      {selectedExp.includes?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-3">¿Qué incluye?</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedExp.includes.map((item, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-sm text-[#1A1A1A]/80 font-medium bg-[#FAFAFA] p-3 rounded-xl border border-black/5">
                                <Icon icon="heroicons:check-circle" className="text-[#E6B05C] text-lg flex-shrink-0" />
                                <span className="leading-tight">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Booking Form */}
                      <div className="bg-[#FAFAFA] rounded-[2rem] p-6 sm:p-8 border border-black/5">
                        <h4 className="text-lg font-extrabold text-[#1A1A1A] mb-1">Reserva tu lugar</h4>
                        <p className="text-xs text-black/50 font-medium mb-6">Completa tus datos para pre-reservar tu cupo.</p>
                        
                        <form onSubmit={handleBooking} className="space-y-4">
                          {/* Date selection */}
                          {selectedExp.dates?.length > 0 && (
                            <div className="space-y-2 mb-2">
                              <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">FECHAS DISPONIBLES</label>
                              <div className="flex gap-2 flex-wrap">
                                {selectedExp.dates.map((d, i) => {
                                  const val = `${d.date}T${d.start_time}`;
                                  const isSelected = bookingForm.selected_date === val;
                                  return (
                                    <button
                                      key={i} type="button"
                                      onClick={() => setBookingForm({ ...bookingForm, selected_date: val })}
                                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                        isSelected
                                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md'
                                          : 'bg-white text-black/60 border-black/10 hover:border-[#E6B05C] hover:text-[#1A1A1A]'
                                      }`}
                                    >
                                      {d.date} • {d.start_time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <input type="text" required placeholder="Tu nombre completo"
                            value={bookingForm.customer_name}
                            onChange={e => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#E6B05C] focus:border-[#E6B05C] font-medium transition-all"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input type="tel" placeholder="WhatsApp / Teléfono"
                              value={bookingForm.customer_phone}
                              onChange={e => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                              className="bg-white border border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#E6B05C] focus:border-[#E6B05C] font-medium transition-all"
                            />
                            <input type="number" min={1} max={selectedExp.capacity} required placeholder="# Personas"
                              value={bookingForm.guests}
                              onChange={e => setBookingForm({ ...bookingForm, guests: Number(e.target.value) })}
                              className="bg-white border border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#E6B05C] focus:border-[#E6B05C] font-medium transition-all"
                            />
                          </div>
                          <input type="email" placeholder="Email (opcional)"
                            value={bookingForm.customer_email}
                            onChange={e => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#E6B05C] focus:border-[#E6B05C] font-medium transition-all"
                          />
                          <textarea rows={2} placeholder="Notas o restricciones alimentarias (opcional)"
                            value={bookingForm.notes}
                            onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#E6B05C] focus:border-[#E6B05C] font-medium transition-all resize-none"
                          />

                          <button type="submit" disabled={submitting}
                            className="w-full bg-[#E6B05C] text-[#1A1A1A] font-extrabold py-4 rounded-full disabled:opacity-50 hover:bg-[#1A1A1A] hover:text-white transition-all text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(230,176,92,0.3)] hover:shadow-[0_8px_20px_rgba(26,26,26,0.2)] mt-2"
                          >
                            {submitting ? 'Reservando...' : (
                              <>
                                Confirmar Reserva <Icon icon="heroicons:arrow-right" className="text-lg" />
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
