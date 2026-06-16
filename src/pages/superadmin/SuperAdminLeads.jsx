import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, Mail, MessageSquare, Phone, Plus, RefreshCw, Search, Store, Target, Trash2, UserRound } from 'lucide-react';
import { supabase } from '../../config/supabase';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  { value: 'contacted', label: 'Contactado', tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'demo_scheduled', label: 'Demo agendada', tone: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { value: 'converted', label: 'Convertido', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { value: 'lost', label: 'Perdido', tone: 'bg-gray-100 text-gray-600 border-gray-200' },
];

const SOURCE_LABELS = {
  landing_page: 'Landing',
  contact_page: 'Contacto',
  demo_request: 'Demo',
  manual: 'Manual',
  whatsapp: 'WhatsApp',
};

const EMPTY_FORM = {
  name: '',
  restaurant_name: '',
  email: '',
  phone: '',
  city: '',
  business_type: '',
  plan_interest: '',
  message: '',
  notes: '',
  status: 'new',
  source: 'manual',
};

const statusMeta = (status) => STATUS_OPTIONS.find(option => option.value === status) || STATUS_OPTIONS[0];

const formatDate = (date) => {
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export default function SuperAdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: leadsError } = await supabase
        .from('leads')
        .select('id, created_at, updated_at, name, email, phone, restaurant_name, city, business_type, plan_interest, message, notes, status, source, next_follow_up_at, lost_reason, brand_id')
        .is('brand_id', null)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching Aluna leads:', err);
      setError(err.message || 'No se pudieron cargar los leads.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      const haystack = [
        lead.name,
        lead.email,
        lead.phone,
        lead.restaurant_name,
        lead.city,
        lead.business_type,
        lead.plan_interest,
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && matchesSource && (!term || haystack.includes(term));
    });
  }, [leads, search, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter(lead => ['contacted', 'demo_scheduled', 'converted'].includes(lead.status)).length;
    const demos = leads.filter(lead => lead.status === 'demo_scheduled').length;
    const converted = leads.filter(lead => lead.status === 'converted').length;
    const dueFollowUps = leads.filter((lead) => {
      if (!lead.next_follow_up_at || lead.status === 'converted' || lead.status === 'lost') return false;
      return new Date(lead.next_follow_up_at) <= new Date();
    }).length;

    return { total, contacted, demos, converted, dueFollowUps };
  }, [leads]);

  const sources = useMemo(() => {
    return [...new Set(leads.map(lead => lead.source).filter(Boolean))].sort();
  }, [leads]);

  const updateLead = async (id, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setLeads(prev => prev.map(lead => (lead.id === id ? { ...lead, ...data } : lead)));
    } catch (err) {
      console.error('Error updating lead:', err);
      alert(`No se pudo actualizar el lead: ${err.message}`);
    }
  };

  const createLead = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        restaurant_name: form.restaurant_name.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        business_type: form.business_type.trim() || null,
        plan_interest: form.plan_interest.trim() || null,
        message: form.message.trim() || null,
        notes: form.notes.trim() || null,
        brand_id: null,
      };

      const { data, error: createError } = await supabase
        .from('leads')
        .insert(payload)
        .select()
        .single();

      if (createError) throw createError;
      setLeads(prev => [data, ...prev]);
      setForm(EMPTY_FORM);
      setShowCreate(false);
    } catch (err) {
      console.error('Error creating lead:', err);
      setError(err.message || 'No se pudo crear el lead.');
    } finally {
      setSaving(false);
    }
  };

  const deleteLead = async (lead) => {
    if (!window.confirm(`Eliminar el lead de ${lead.name || lead.email}?`)) return;
    try {
      const { error: deleteError } = await supabase.from('leads').delete().eq('id', lead.id);
      if (deleteError) throw deleteError;
      setLeads(prev => prev.filter(item => item.id !== lead.id));
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert(`No se pudo eliminar el lead: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Cargando leads comerciales...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500 mb-2">Pipeline comercial</p>
          <h1 className="text-3xl text-[#1A1A1A] font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Leads de Aluna
          </h1>
          <p className="text-sm text-gray-500 mt-1">Prospectos interesados en comprar la plataforma.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchLeads} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold">
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button onClick={() => setShowCreate(prev => !prev)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 text-sm font-semibold">
            <Plus size={16} />
            Nuevo lead
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Metric title="Total" value={stats.total} icon={Target} tone="bg-slate-900 text-white" />
        <Metric title="Contactados" value={stats.contacted} icon={MessageSquare} tone="bg-blue-50 text-blue-700" />
        <Metric title="Demos" value={stats.demos} icon={CalendarClock} tone="bg-indigo-50 text-indigo-700" />
        <Metric title="Convertidos" value={stats.converted} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        <Metric title="Seguimientos" value={stats.dueFollowUps} icon={Clock3} tone="bg-amber-50 text-amber-700" />
      </div>

      {showCreate && (
        <form onSubmit={createLead} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Nombre" value={form.name} onChange={value => setForm({ ...form, name: value })} required />
            <Input label="Restaurante" value={form.restaurant_name} onChange={value => setForm({ ...form, restaurant_name: value })} />
            <Input label="Correo" type="email" value={form.email} onChange={value => setForm({ ...form, email: value })} required />
            <Input label="Telefono" value={form.phone} onChange={value => setForm({ ...form, phone: value })} />
            <Input label="Ciudad" value={form.city} onChange={value => setForm({ ...form, city: value })} />
            <Input label="Tipo de negocio" value={form.business_type} onChange={value => setForm({ ...form, business_type: value })} />
            <Input label="Plan de interes" value={form.plan_interest} onChange={value => setForm({ ...form, plan_interest: value })} />
            <Select label="Estado" value={form.status} onChange={value => setForm({ ...form, status: value })} options={STATUS_OPTIONS} />
            <Input label="Fuente" value={form.source} onChange={value => setForm({ ...form, source: value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Textarea label="Mensaje" value={form.message} onChange={value => setForm({ ...form, message: value })} />
            <Textarea label="Notas internas" value={form.notes} onChange={value => setForm({ ...form, notes: value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancelar</button>
            <button disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar lead'}</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative min-w-[280px] flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por restaurante, contacto, correo, telefono..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white">
            <option value="all">Todos los estados</option>
            {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white">
            <option value="all">Todas las fuentes</option>
            {sources.map(source => <option key={source} value={source}>{SOURCE_LABELS[source] || source}</option>)}
          </select>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No hay leads con estos filtros.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLeads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} updateLead={updateLead} deleteLead={deleteLead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ title, value, icon: Icon, tone }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function LeadRow({ lead, updateLead, deleteLead }) {
  const meta = statusMeta(lead.status);
  const whatsappHref = lead.phone ? `https://wa.me/${lead.phone.replace(/[^\d]/g, '')}` : null;

  return (
    <div className="p-5 hover:bg-gray-50/60 transition-colors">
      <div className="flex flex-col xl:flex-row xl:items-start gap-4 justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${meta.tone}`}>{meta.label}</span>
            <span className="text-xs font-bold text-gray-400 uppercase">{SOURCE_LABELS[lead.source] || lead.source || 'Sin fuente'}</span>
            <span className="text-xs text-gray-400">{formatDate(lead.created_at)}</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Store size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-gray-900 text-lg leading-tight">{lead.restaurant_name || 'Restaurante sin nombre'}</h3>
              <p className="text-sm text-gray-600 font-semibold mt-1">{lead.name || 'Contacto sin nombre'}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                {lead.email && <span className="inline-flex items-center gap-1"><Mail size={12} />{lead.email}</span>}
                {lead.phone && <span className="inline-flex items-center gap-1"><Phone size={12} />{lead.phone}</span>}
                {lead.city && <span className="inline-flex items-center gap-1"><UserRound size={12} />{lead.city}</span>}
                {lead.plan_interest && <span className="inline-flex items-center gap-1"><Target size={12} />{lead.plan_interest}</span>}
              </div>
            </div>
          </div>
          {(lead.message || lead.notes) && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {lead.message && <TextBlock label="Mensaje" text={lead.message} />}
              {lead.notes && <TextBlock label="Notas internas" text={lead.notes} accent />}
            </div>
          )}
        </div>

        <div className="w-full xl:w-[360px] grid grid-cols-1 gap-2">
          <select value={lead.status || 'new'} onChange={(event) => updateLead(lead.id, { status: event.target.value })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold bg-white">
            {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input type="datetime-local" value={lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toISOString().slice(0, 16) : ''} onChange={(event) => updateLead(lead.id, { next_follow_up_at: event.target.value ? new Date(event.target.value).toISOString() : null })} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white" />
          <textarea defaultValue={lead.notes || ''} onBlur={(event) => { if ((lead.notes || '') !== event.target.value) updateLead(lead.id, { notes: event.target.value || null }); }} rows={2} placeholder="Notas internas..." className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white resize-none" />
          <div className="flex gap-2">
            {lead.email && <a href={`mailto:${lead.email}`} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"><Mail size={14} />Email</a>}
            {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100"><MessageSquare size={14} />WhatsApp</a>}
            <button onClick={() => deleteLead(lead)} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextBlock({ label, text, accent = false }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
      <p className={`text-[10px] uppercase tracking-widest font-black mb-1 ${accent ? 'text-indigo-400' : 'text-gray-400'}`}>{label}</p>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
