import React, { useState, useMemo } from 'react';
import { useCRM } from '../../hooks/useCRM';
import { 
  Users, Search, Filter, MessageSquare, Phone, 
  ChevronRight, Calendar, DollarSign, TrendingUp,
  Star, Clock, Zap, Ghost, MinusCircle, ExternalLink,
  ArrowUpRight, AlertCircle, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerProfileModal from './CustomerProfileModal';

const SEGMENTS = {
  frecuente: { label: 'Frecuente', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Star },
  recurrente: { label: 'Recurrente', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: TrendingUp },
  nuevo: { label: 'Nuevo', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Zap },
  dormido: { label: 'Dormido', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Clock },
  perdido: { label: 'Perdido', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Ghost },
  prospecto: { label: 'Prospecto', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: Users },
  ocasional: { label: 'Ocasional', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: MinusCircle },
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl ${className}`}>
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <GlassCard className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color.bg}`}>
        <Icon className={`w-6 h-6 ${color.text}`} />
      </div>
      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
        <ArrowUpRight className="w-3 h-3" />
        LIVE
      </div>
    </div>
    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">{label}</p>
    <p className="text-3xl font-black text-white mt-1">{value}</p>
  </GlassCard>
);

export default function CustomerDirectory() {
  const { customers, stats, loading, refresh } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = 
        (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm);
      const matchesFilter = filterSegment === 'all' || c.segment === filterSegment;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
  }, [customers, searchTerm, filterSegment]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: 0 
  }).format(val);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <Users className="w-12 h-12 text-gray-700 mb-4" />
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Cargando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Clientes" 
          value={stats.totalCustomers} 
          icon={Users} 
          color={{ text: 'text-blue-400', bg: 'bg-blue-500/10' }} 
        />
        <StatCard 
          label="Valor de Vida (LTV)" 
          value={formatCurrency(stats.totalLTV)} 
          icon={DollarSign} 
          color={{ text: 'text-emerald-400', bg: 'bg-emerald-500/10' }} 
        />
        <StatCard 
          label="Activos (30d)" 
          value={stats.activeCustomers} 
          icon={Zap} 
          color={{ text: 'text-yellow-400', bg: 'bg-yellow-500/10' }} 
        />
        <StatCard 
          label="Ticket Promedio" 
          value={formatCurrency(stats.avgLTV)} 
          icon={TrendingUp} 
          color={{ text: 'text-purple-400', bg: 'bg-purple-500/10' }} 
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
          <input 
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar w-full md:w-auto">
          <button 
            onClick={() => setFilterSegment('all')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filterSegment === 'all' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            Todos
          </button>
          {Object.entries(SEGMENTS).map(([key, cfg]) => (
            <button 
              key={key}
              onClick={() => setFilterSegment(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterSegment === key ? `${cfg.bg} ${cfg.color} border-2 border-current` : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Grid/Table */}
      <GlassCard className="overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Segmento</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Pedidos</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">LTV</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Última Visita</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.map((customer) => {
                const seg = SEGMENTS[customer.segment];
                return (
                  <tr 
                    key={customer.phone}
                    className="group hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${seg.bg} flex items-center justify-center border ${seg.border}`}>
                          <span className={`text-[13px] font-black ${seg.color}`}>
                            {customer.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm tracking-tight">{customer.name || 'Sin nombre'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span className="text-[11px] text-gray-500 font-medium">{customer.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${seg.bg} ${seg.color} border ${seg.border}`}>
                        <seg.icon className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-tight">{seg.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white font-black text-sm">{customer.ordersCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-black text-sm">{formatCurrency(customer.ltv)}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Avg: {formatCurrency(customer.avgTicket)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-300 text-xs font-medium">
                          {new Date(customer.lastVisit).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold">
                          Hace {customer.daysSinceLastVisit} días
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-white/5 border border-white/10">
                        <Users className="w-8 h-8 text-gray-700" />
                      </div>
                      <p className="text-gray-500 font-bold uppercase text-[11px] tracking-widest">No se encontraron clientes</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Customer Profile Modal */}
      <CustomerProfileModal 
        isOpen={!!selectedCustomer}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
