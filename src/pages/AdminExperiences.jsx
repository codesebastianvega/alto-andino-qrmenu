import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { useExperiences } from '../hooks/useExperiences';

const TYPE_LABELS = {
  event: { label: 'Evento', icon: 'heroicons:sparkles', color: 'text-purple-600 bg-purple-50' },
  workshop: { label: 'Taller', icon: 'heroicons:wrench-screwdriver', color: 'text-blue-600 bg-blue-50' },
  tasting: { label: 'Cata', icon: 'heroicons:beaker', color: 'text-amber-600 bg-amber-50' },
  tour: { label: 'Tour', icon: 'heroicons:map', color: 'text-emerald-600 bg-emerald-50' },
  dinner: { label: 'Cena Temática', icon: 'heroicons:fire', color: 'text-red-600 bg-red-50' },
  premium: { label: 'Premium', icon: 'heroicons:star', color: 'text-yellow-600 bg-yellow-50' },
};

const EMPTY_FORM = {
  title: '', short_description: '', description: '', type: 'event',
  price: '', capacity: 10, duration_minutes: 60, image_url: '',
  includes: [], location: '', is_active: true, dates: [],
};

export default function AdminExperiences() {
  const {
    experiences, loading, createExperience, updateExperience, deleteExperience, toggleActive,
    fetchBookings, fetchAllBookings, updateBooking,
  } = useExperiences();

  const [activeTab, setActiveTab] = useState('experiencias'); // 'experiencias' | 'leads'
  const [allLeads, setAllLeads] = useState([]);
  const [loadingAllLeads, setLoadingAllLeads] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [includeInput, setIncludeInput] = useState('');
  // dates editing
  const [dateInput, setDateInput] = useState({ date: '', start_time: '', end_time: '' });
  // bookings drawer
  const [selectedExpId, setSelectedExpId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (activeTab === 'leads') {
      loadAllLeads();
    }
  }, [activeTab]);

  const loadAllLeads = async () => {
    setLoadingAllLeads(true);
    const { data } = await fetchAllBookings();
    setAllLeads(data);
    setLoadingAllLeads(false);
  };

  const openModal = (exp = null) => {
    if (exp) {
      setEditingExp(exp);
      setForm({
        title: exp.title || '',
        short_description: exp.short_description || '',
        description: exp.description || '',
        type: exp.type || 'event',
        price: exp.price || '',
        capacity: exp.capacity || 10,
        duration_minutes: exp.duration_minutes || 60,
        image_url: exp.image_url || '',
        includes: exp.includes || [],
        location: exp.location || '',
        is_active: exp.is_active !== false,
        dates: exp.dates || [],
      });
    } else {
      setEditingExp(null);
      setForm(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price) };
    let result;
    if (editingExp) {
      result = await updateExperience(editingExp.id, payload);
    } else {
      result = await createExperience(payload);
    }
    setSaving(false);
    if (!result.error) setIsModalOpen(false);
  };

  const handleDelete = async (id, title) => {
    if (confirm(`¿Eliminar "${title}"? Se borrarán también las reservas.`)) {
      await deleteExperience(id);
    }
  };

  const addInclude = () => {
    if (includeInput.trim()) {
      setForm(f => ({ ...f, includes: [...f.includes, includeInput.trim()] }));
      setIncludeInput('');
    }
  };

  const removeInclude = (idx) => {
    setForm(f => ({ ...f, includes: f.includes.filter((_, i) => i !== idx) }));
  };

  const addDate = () => {
    if (dateInput.date && dateInput.start_time && dateInput.end_time) {
      setForm(f => ({
        ...f,
        dates: [...f.dates, { ...dateInput, spots_left: f.capacity }],
      }));
      setDateInput({ date: '', start_time: '', end_time: '' });
    }
  };

  const removeDate = (idx) => {
    setForm(f => ({ ...f, dates: f.dates.filter((_, i) => i !== idx) }));
  };

  const openBookings = async (expId) => {
    setSelectedExpId(expId);
    setLoadingBookings(true);
    const { data } = await fetchBookings(expId);
    setBookings(data);
    setLoadingBookings(false);
  };

  const togglePaymentStatus = async (bookingId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await updateBooking(bookingId, { payment_status: newStatus });
    if (activeTab === 'leads') {
      setAllLeads(prev => prev.map(b => b.id === bookingId ? { ...b, payment_status: newStatus } : b));
    }
    if (selectedExpId) {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, payment_status: newStatus } : b));
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 border-l-4 border-[#2f4131] pl-4">EXPERIENCIAS</h1>
          <p className="text-gray-500 mt-1 font-medium pl-4">Catas, talleres, cenas temáticas y más</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#2f4131] hover:bg-[#1a251b] text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <Icon icon="heroicons:plus" className="text-xl" /> Nueva Experiencia
        </button>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('experiencias')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'experiencias' ? 'bg-white text-[#2f4131] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Icon icon="heroicons:sparkles" /> Experiencias
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'leads' ? 'bg-white text-[#2f4131] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Icon icon="heroicons:users" /> Todos los Leads
        </button>
      </div>

      {activeTab === 'leads' ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loadingAllLeads ? (
            <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4131]"></div></div>
          ) : allLeads.length === 0 ? (
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
                  {allLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{lead.customer_name}</p>
                        {lead.customer_email && <p className="text-xs text-gray-500">{lead.customer_email}</p>}
                        {lead.customer_phone && <p className="text-xs text-gray-500">{lead.customer_phone}</p>}
                      </td>
                      <td className="p-4 max-w-[200px]">
                        <p className="font-bold text-gray-700 text-sm truncate" title={lead.experiences?.title}>{lead.experiences?.title}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <p><Icon icon="heroicons:users" className="inline mr-1" />{lead.guests} personas</p>
                        <p><Icon icon="heroicons:calendar" className="inline mr-1" />{new Date(lead.selected_date).toLocaleDateString('es-CO')}</p>
                        {lead.notes && <p className="text-xs text-gray-400 italic mt-1 line-clamp-1" title={lead.notes}>"{lead.notes}"</p>}
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-gray-400">Creada: {new Date(lead.created_at).toLocaleDateString('es-CO')}</p>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => togglePaymentStatus(lead.id, lead.payment_status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${lead.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'} transition-colors`}
                        >
                          {lead.payment_status === 'paid' ? 'Pagada' : 'Pendiente'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          lead.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                          lead.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {lead.status === 'confirmed' ? 'Confirmada' : lead.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : experiences.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-100 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Sin experiencias aún</h2>
          <p className="text-gray-500">Crea tu primera experiencia para empezar a recibir reservas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {experiences.map(exp => {
            const typeInfo = TYPE_LABELS[exp.type] || TYPE_LABELS.event;
            const nextDate = exp.dates?.[0];
            return (
              <div key={exp.id} className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${!exp.is_active ? 'opacity-60' : ''}`}>
                {/* Image */}
                <div className="h-44 bg-gradient-to-br from-[#2f4131] to-[#4a6741] relative flex items-center justify-center overflow-hidden">
                  {exp.image_url ? (
                    <img src={exp.image_url} alt={exp.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon icon={typeInfo.icon} className="text-6xl text-white/30" />
                  )}
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeInfo.color}`}>
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
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{exp.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{exp.short_description}</p>

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
                      <span className="ml-auto font-bold text-[#2f4131]">{nextDate.spots_left} libres</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xl font-black text-[#2f4131]">{formatCurrency(exp.price)}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openBookings(exp.id)} className="p-2 rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Ver reservas">
                        <Icon icon="heroicons:ticket" className="text-lg" />
                      </button>
                      <button onClick={() => openModal(exp)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" title="Editar">
                        <Icon icon="heroicons:pencil-square" className="text-lg" />
                      </button>
                      <button onClick={() => toggleActive(exp.id, exp.is_active)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" title={exp.is_active ? 'Desactivar' : 'Activar'}>
                        <Icon icon={exp.is_active ? 'heroicons:eye' : 'heroicons:eye-slash'} className="text-lg" />
                      </button>
                      <button onClick={() => handleDelete(exp.id, exp.title)} className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Eliminar">
                        <Icon icon="heroicons:trash" className="text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create/Edit Modal ──────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-6 max-w-lg w-full shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-900">{editingExp ? 'Editar' : 'Nueva'} Experiencia</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <Icon icon="heroicons:x-mark" className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Título</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700" />
              </div>

              {/* Short description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Descripción Corta</label>
                <input type="text" value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })}
                  placeholder="Una línea para la tarjeta"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Descripción Completa</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700 resize-none" />
              </div>

              {/* Type + Price row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Precio (COP)</label>
                  <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700" />
                </div>
              </div>

              {/* Capacity + Duration row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Capacidad</label>
                  <input type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Duración (min)</label>
                  <input type="number" min={15} step={15} value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700" />
                </div>
              </div>

              {/* Location + Image */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Ubicación</label>
                  <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Ej: Terraza 2do piso"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">URL Imagen</label>
                  <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700" />
                </div>
              </div>

              {/* Includes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">¿Qué Incluye?</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={includeInput} onChange={e => setIncludeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInclude(); } }}
                    placeholder="Ej: Copa de bienvenida"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700 text-sm" />
                  <button type="button" onClick={addInclude} className="bg-[#7db87a] text-white px-3 rounded-xl font-bold text-sm hover:bg-[#6aa669]">+</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.includes.map((item, i) => (
                    <span key={i} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      {item}
                      <button type="button" onClick={() => removeInclude(i)} className="text-emerald-400 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fechas Programadas</label>
                <div className="flex gap-2 mb-2">
                  <input type="date" value={dateInput.date} onChange={e => setDateInput({ ...dateInput, date: e.target.value })}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium text-gray-700 text-sm" />
                  <input type="time" value={dateInput.start_time} onChange={e => setDateInput({ ...dateInput, start_time: e.target.value })}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium text-gray-700 text-sm w-28" />
                  <input type="time" value={dateInput.end_time} onChange={e => setDateInput({ ...dateInput, end_time: e.target.value })}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium text-gray-700 text-sm w-28" />
                  <button type="button" onClick={addDate} className="bg-[#7db87a] text-white px-3 rounded-xl font-bold text-sm hover:bg-[#6aa669]">+</button>
                </div>
                <div className="space-y-1">
                  {form.dates.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl text-sm">
                      <span className="font-medium text-gray-700">
                        <Icon icon="heroicons:calendar" className="mr-1 text-[#7db87a]" />
                        {d.date} · {d.start_time} – {d.end_time}
                      </span>
                      <button type="button" onClick={() => removeDate(i)} className="text-gray-400 hover:text-red-500 text-lg">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={saving}
                  className="w-full bg-[#4a6741] text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-[#3d5536] transition-colors">
                  {saving ? 'Guardando...' : 'Guardar Experiencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Bookings Drawer ──────────────────────────────────────── */}
      {selectedExpId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-gray-900">Reservas</h2>
              <button onClick={() => setSelectedExpId(null)} className="text-gray-400 hover:text-gray-900">
                <Icon icon="heroicons:x-mark" className="text-2xl" />
              </button>
            </div>

            {loadingBookings ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4131]"></div></div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Icon icon="heroicons:ticket" className="text-4xl mb-3" />
                <p className="font-medium">Sin reservas aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="border border-gray-100 rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{b.customer_name}</p>
                        {b.customer_phone && <p className="text-xs text-gray-500">{b.customer_phone}</p>}
                        {b.customer_email && <p className="text-xs text-gray-500">{b.customer_email}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          b.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                          b.status === 'cancelled' ? 'bg-red-50 text-red-500' :
                          'bg-gray-100 text-gray-600'
                        }`}>{b.status === 'confirmed' ? 'Confirmada' : b.status === 'cancelled' ? 'Cancelada' : 'Completada'}</span>
                        <button
                          onClick={() => togglePaymentStatus(b.id, b.payment_status)}
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          } transition-colors`}
                        >
                          {b.payment_status === 'paid' ? 'Pagada' : 'Pendiente'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span><Icon icon="heroicons:users" className="mr-1" />{b.guests} persona{b.guests > 1 ? 's' : ''}</span>
                      <span><Icon icon="heroicons:calendar" className="mr-1" />{new Date(b.selected_date).toLocaleDateString('es-CO')}</span>
                    </div>
                    {b.notes && <p className="text-xs text-gray-400 mt-2 italic">"{b.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
