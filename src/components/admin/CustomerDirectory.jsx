import React, { useState, useMemo } from 'react';
import { useCRM } from '../../hooks/useCRM';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Search, Filter, MessageSquare, Phone, 
  ChevronRight, Calendar, DollarSign, TrendingUp,
  Star, Clock, Zap, Ghost, MinusCircle, ExternalLink,
  ArrowUpRight, AlertCircle, ShoppingBag, MapPin,
  AlertTriangle, Tag, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerProfileModal from './CustomerProfileModal';

const SEGMENT_CONFIG = {
  friccion: { 
    label: 'Cancelados / Fricción', 
    color: 'text-rose-700', 
    bg: 'bg-rose-50', 
    border: 'border-rose-200', 
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: AlertTriangle 
  },
  vip: { 
    label: 'VIP', 
    color: 'text-amber-800', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200', 
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: Star 
  },
  frecuente: { 
    label: 'Frecuente', 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: TrendingUp 
  },
  nuevo: { 
    label: 'Nuevo', 
    color: 'text-blue-700', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Zap 
  },
  dormido: { 
    label: 'Inactivo (+21d)', 
    color: 'text-orange-700', 
    bg: 'bg-orange-50', 
    border: 'border-orange-200', 
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: Clock 
  },
  perdido: { 
    label: 'Perdido (+45d)', 
    color: 'text-gray-700', 
    bg: 'bg-gray-100', 
    border: 'border-gray-300', 
    badgeBg: 'bg-gray-200 text-gray-800 border-gray-300',
    icon: Ghost 
  },
  prospecto: { 
    label: 'Prospecto', 
    color: 'text-indigo-700', 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-200', 
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: Users 
  },
  ocasional: { 
    label: 'Ocasional', 
    color: 'text-gray-700', 
    bg: 'bg-gray-50', 
    border: 'border-gray-200', 
    badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: MinusCircle 
  },
};

export default function CustomerDirectory() {
  const { 
    customers, 
    archivedCustomers = [],
    stats, 
    loading, 
    refresh,
    updateCustomerStage,
    toggleArchiveCustomer,
    settleCustomerOrder
  } = useCRM();
  const { activeBrand } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'archived'
  const [openStageMenuKey, setOpenStageMenuKey] = useState(null);

  const brandName = activeBrand?.name || 'Boku Bento';

  const sourceList = viewMode === 'archived' ? archivedCustomers : customers;

  const filteredCustomers = useMemo(() => {
    return sourceList.filter(c => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (c.name?.toLowerCase() || '').includes(term) || 
        (c.address?.toLowerCase() || '').includes(term) ||
        (c.favoriteProduct?.toLowerCase() || '').includes(term) ||
        (c.phone || '').includes(searchTerm);
      
      let matchesFilter = true;
      if (filterSegment === 'friccion') {
        matchesFilter = c.segment === 'friccion';
      } else if (filterSegment === 'whales' || filterSegment === 'vip') {
        matchesFilter = c.isWhale || c.segment === 'vip';
      } else if (filterSegment === 'frecuente') {
        matchesFilter = c.segment === 'frecuente' || c.ordersCount >= 2;
      } else if (filterSegment === 'dormido') {
        matchesFilter = c.segment === 'dormido' || c.segment === 'perdido';
      } else if (filterSegment !== 'all') {
        matchesFilter = c.segment === filterSegment;
      }
      
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (filterSegment === 'all' || filterSegment === 'friccion') {
        if (a.hasCancelled && !b.hasCancelled) return -1;
        if (!a.hasCancelled && b.hasCancelled) return 1;
      }
      return new Date(b.lastVisit) - new Date(a.lastVisit);
    });
  }, [sourceList, searchTerm, filterSegment]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: 0 
  }).format(val);

  const sendDirectWhatsApp = (customer, e) => {
    if (e) e.stopPropagation();
    const phone = (customer.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert('Este cliente no tiene número de teléfono registrado.');
      return;
    }
    const firstName = customer.name?.split(' ')[0] || 'Hola';

    let message = '';
    if (customer.hasCancelled || customer.segment === 'friccion') {
      const dish = customer.favoriteProduct && customer.favoriteProduct !== 'Sin preferencia'
        ? ` tu ${customer.favoriteProduct}` 
        : ' tu pedido';
      const reasonDetail = customer.lastCancellationReason 
        ? ` por el inconveniente con tu pedido ("${customer.lastCancellationReason}")` 
        : ' por la cancelación de tu pedido';

      message = `Hola ${firstName}! 👋 Te saludamos del equipo de ${brandName}.

Queremos pedirte una sincera disculpa${reasonDetail}. Para nosotros tu experiencia es lo más importante y lamentamos mucho no haberte podido atender como mereces.

Para compensarte y que no te quedes con las ganas de disfrutar${dish}, te dejamos un descuento especial del 15% en tu próximo pedido usando el código DISCULPABOKU desde nuestro menú:
https://aluna-qrmenu.vercel.app/boku-bento/?src=recuperacion

¡Esperamos tener la oportunidad de atenderte pronto! 🍱✨`;
    } else if (customer.isWhale || customer.segment === 'vip') {
      message = `Hola ${firstName}! ⭐ Como uno de nuestros clientes más especiales en ${brandName}, queríamos saludarte y agradecerte por tu preferencia constante. ¡Esperamos verte pronto! 🍱`;
    } else {
      message = `Hola ${firstName}! 👋 Te saludamos de ${brandName}. ¿Qué tal estuvo tu experiencia con nosotros? ¡Nos encantaría saber cómo podemos hacer tu próximo pedido aún más delicioso! 🍱`;
    }

    const url = `https://wa.me/57${phone.slice(-10)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const navigateToPromotions = () => {
    window.location.hash = '#admin?page=promotions';
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse bg-white rounded-2xl border border-gray-100">
        <Users className="w-12 h-12 text-gray-400 mb-4 animate-bounce" />
        <p className="text-gray-600 font-bold uppercase text-xs tracking-widest">Cargando base de datos de clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Alerta Destacada si hay clientes con pedidos cancelados */}
      {stats.frictionCustomers > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-white border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black text-rose-900">
                {stats.frictionCustomers} {stats.frictionCustomers === 1 ? 'cliente con pedido cancelado requiere atención' : 'clientes con pedidos cancelados requieren atención'}
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                No dejes que se vayan a la competencia. Envíales un mensaje de disculpa y un cupón de compensación por WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setFilterSegment('friccion')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              Ver Afectados ({stats.frictionCustomers})
            </button>
            <button
              onClick={navigateToPromotions}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Abrir módulo de cupones y descuentos"
            >
              <Tag className="w-3.5 h-3.5" />
              Crear Cupón
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas Ejecutivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clientes */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Total Clientes</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalCustomers}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">En agenda y base de datos</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* LTV Total */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Valor de Vida (LTV)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(stats.totalLTV)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Ventas totales acumuladas</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Clientes en Fricción / Cancelados */}
        <div 
          onClick={() => setFilterSegment('friccion')}
          className={`cursor-pointer bg-white border rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:border-rose-300 ${
            stats.frictionCustomers > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-gray-200/90'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Cancelados / Fricción</p>
              {stats.frictionCustomers > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <p className={`text-2xl font-black mt-1 ${stats.frictionCustomers > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {stats.frictionCustomers}
            </p>
            <p className="text-[11px] text-rose-500 font-bold mt-0.5">
              {stats.frictionCustomers > 0 ? 'Requieren recuperación urgente' : 'Cero cancelaciones'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
            stats.frictionCustomers > 0 ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-gray-50 text-gray-400 border-gray-100'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Ticket Promedio</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{formatCurrency(stats.avgLTV)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Por cliente recurrente</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
        {/* Búsqueda */}
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
          <input 
            type="text"
            placeholder="Buscar por nombre, teléfono, plato o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-gray-900 text-xs font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
          />
        </div>

        {/* Tabs de Filtro */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar w-full md:w-auto">
          <button 
            onClick={() => setFilterSegment('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterSegment === 'all' 
                ? 'bg-gray-900 text-white shadow-xs' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({customers.length})
          </button>

          {stats.frictionCustomers > 0 && (
            <button 
              onClick={() => setFilterSegment('friccion')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                filterSegment === 'friccion' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              🚨 Cancelados ({stats.frictionCustomers})
            </button>
          )}

          <button 
            onClick={() => setFilterSegment('whales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterSegment === 'whales' 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            VIPs ({customers.filter(c => c.isWhale || c.segment === 'vip').length})
          </button>

          <button 
            onClick={() => setFilterSegment('frecuente')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterSegment === 'frecuente' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Frecuentes ({customers.filter(c => c.ordersCount >= 2).length})
          </button>

          <button 
            onClick={() => setFilterSegment('dormido')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterSegment === 'dormido' 
                ? 'bg-orange-500 text-white shadow-xs' 
                : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Inactivos (+21d)
          </button>

          <button 
            onClick={() => setFilterSegment('prospecto')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterSegment === 'prospecto' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Prospectos
          </button>

          {archivedCustomers.length > 0 && (
            <button 
              type="button"
              onClick={() => {
                setViewMode(viewMode === 'archived' ? 'active' : 'archived');
                setFilterSegment('all');
              }}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'archived' 
                  ? 'bg-rose-900 text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{viewMode === 'archived' ? '← Volver a Clientes Activos' : `Archivados / Pruebas (${archivedCustomers.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla Principal de Clientes */}
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-wider">
                <th className="px-5 py-3.5">Cliente & Ubicación</th>
                <th className="px-5 py-3.5">Historial & Gustos</th>
                <th className="px-5 py-3.5">Estado & Salud</th>
                <th className="px-5 py-3.5 text-center">Pedidos</th>
                <th className="px-5 py-3.5">Ventas Totales (LTV)</th>
                <th className="px-5 py-3.5">Última Visita</th>
                <th className="px-5 py-3.5 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => {
                const seg = SEGMENT_CONFIG[customer.segment] || SEGMENT_CONFIG.ocasional;
                const isFriction = customer.segment === 'friccion';
                
                return (
                  <tr 
                    key={customer.phone || customer.key || customer.name}
                    className={`group hover:bg-gray-50/80 transition-all cursor-pointer ${
                      isFriction ? 'bg-rose-50/30' : ''
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* Cliente & Ubicación */}
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-2xl ${seg.bg} flex items-center justify-center border ${seg.border} shadow-2xs`}>
                            <span className={`text-sm font-black ${seg.color}`}>
                              {customer.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          {customer.isWhale && (
                            <div className="absolute -top-1 -right-1 bg-amber-400 text-black rounded-full p-0.5 border border-white shadow-xs" title="Cliente Whale (Top 20% ventas)">
                              <Star className="w-2.5 h-2.5 fill-current" />
                            </div>
                          )}
                          {isFriction && (
                            <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 border border-white shadow-xs" title="Tiene pedidos cancelados">
                              <AlertTriangle className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-gray-900 font-bold text-sm tracking-tight truncate max-w-[220px]">
                              {customer.name}
                            </p>
                            {customer.isWhale && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-full font-black uppercase">
                                VIP
                              </span>
                            )}
                          </div>
                          
                          {/* Dirección / Ubicación si existe */}
                          {customer.address ? (
                            <div className="flex items-center gap-1 mt-0.5 text-gray-500 text-xs truncate max-w-[250px]" title={customer.address + (customer.deliveryNotes ? ` (${customer.deliveryNotes})` : '')}>
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{customer.address}</span>
                              {customer.deliveryNotes && (
                                <span className="text-[10px] text-gray-400 truncate">· {customer.deliveryNotes}</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-0.5 text-gray-400 text-xs">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="font-mono text-[11px]">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Historial & Gustos (Reemplaza RFM incomprensible) */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {/* Conteo de entregados vs cancelados */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {customer.cancelledCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black">
                              {customer.ordersCount} entregado{customer.ordersCount !== 1 ? 's' : ''} · {customer.cancelledCount} cancelado{customer.cancelledCount !== 1 ? 's' : ''}
                            </span>
                          ) : customer.ordersCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              {customer.ordersCount} entregado{customer.ordersCount !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                              Sin compras aún
                            </span>
                          )}
                        </div>

                        {/* Plato de preferencia o interés */}
                        {customer.favoriteProduct && customer.favoriteProduct !== 'Sin preferencia' && (
                          <div className="flex items-center gap-1 text-gray-700 text-xs font-semibold truncate" title={`Plato de interés: ${customer.favoriteProduct}`}>
                            <ShoppingBag className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{customer.favoriteProduct}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Estado & Salud (con selector interactivo directo en tabla) */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1 relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenStageMenuKey(openStageMenuKey === customer.key ? null : customer.key)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                            isFriction ? 'bg-rose-100 text-rose-800 border-rose-300' : seg.badgeBg
                          }`}
                          title="Clic para cambiar estado en el CRM"
                        >
                          {isFriction ? <AlertTriangle className="w-3 h-3 text-rose-600" /> : <seg.icon className="w-3 h-3" />}
                          <span>{isFriction ? 'Cancelado' : seg.label}</span>
                          <ChevronRight className={`w-3 h-3 transition-transform ${openStageMenuKey === customer.key ? 'rotate-90' : ''}`} />
                        </button>

                        {customer.lastCancellationReason && isFriction && (
                          <span className="text-[10px] text-rose-700 font-medium italic truncate max-w-[180px]" title={`Motivo: ${customer.lastCancellationReason}`}>
                            "{customer.lastCancellationReason}"
                          </span>
                        )}

                        {openStageMenuKey === customer.key && (
                          <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 z-50 space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider px-2 py-1">Cambiar Estado:</p>
                            {Object.entries(SEGMENT_CONFIG).map(([stgKey, cfg]) => {
                              const IconComponent = cfg.icon;
                              return (
                                <button
                                  key={stgKey}
                                  type="button"
                                  onClick={() => {
                                    updateCustomerStage(customer.key, stgKey);
                                    setOpenStageMenuKey(null);
                                  }}
                                  className={`w-full px-2 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between text-left transition-colors cursor-pointer ${
                                    stgKey === customer.segment ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <IconComponent className="w-3 h-3" />
                                    <span>{cfg.label}</span>
                                  </span>
                                  {stgKey === customer.segment && <Check className="w-3 h-3 text-emerald-600" />}
                                </button>
                              );
                            })}
                            <div className="pt-1 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={() => {
                                  toggleArchiveCustomer(customer.key);
                                  setOpenStageMenuKey(null);
                                }}
                                className="w-full px-2 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{customer.isArchived ? 'Restaurar al CRM' : 'Descartar / Archivar'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Pedidos Completados */}
                    <td className="px-5 py-4 text-center">
                      <span className={`font-black text-sm ${customer.ordersCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {customer.ordersCount}
                      </span>
                    </td>

                    {/* LTV Total */}
                    <td className="px-5 py-4">
                      <p className="text-gray-900 font-black text-sm">{formatCurrency(customer.ltv)}</p>
                      {customer.ordersCount > 1 && (
                        <p className="text-[10px] text-gray-400 font-medium">Prom: {formatCurrency(customer.avgTicket)}</p>
                      )}
                    </td>

                    {/* Última Visita */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-800 text-xs font-semibold">
                          {new Date(customer.lastVisit).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {customer.daysSinceLastVisit === 0 ? 'Hoy' : `Hace ${customer.daysSinceLastVisit} días`}
                        </span>
                      </div>
                    </td>

                    {/* Acción Rápida (WhatsApp / Recuperar) */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {viewMode === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => toggleArchiveCustomer(customer.key)}
                            className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer"
                          >
                            Restaurar
                          </button>
                        ) : (
                          <>
                            {isFriction ? (
                              <button 
                                onClick={(e) => sendDirectWhatsApp(customer, e)}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all hover:scale-105"
                                title="Enviar disculpa y cupón de compensación por WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Recuperar
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => sendDirectWhatsApp(customer, e)}
                                className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 transition-all"
                                title="Escribir por WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              type="button"
                              onClick={() => toggleArchiveCustomer(customer.key)}
                              className="p-2 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all"
                              title="Descartar / Archivar cliente de prueba"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setSelectedCustomer(customer)}
                              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
                              title="Ver detalle del cliente"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-gray-300" />
                      <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">No se encontraron clientes con este filtro</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Modal */}
      <CustomerProfileModal 
        isOpen={!!selectedCustomer}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        brandName={brandName}
        onNavigateToPromotions={navigateToPromotions}
        onSettleOrder={async (orderId, method, options = {}) => {
          await settleCustomerOrder(orderId, method, options);
          await refresh();
          // Also update selectedCustomer in state so modal refreshes immediately
          setSelectedCustomer(prev => {
            if (!prev) return null;
            const updatedPending = (prev.pendingOrders || []).filter(o => o.id !== orderId);
            const settledAmt = prev.pendingOrders?.find(o => o.id === orderId)?.total_amount || 0;
            return {
              ...prev,
              pendingOrders: updatedPending,
              totalOwed: Math.max(0, (prev.totalOwed || 0) - Number(settledAmt)),
              orderHistory: (prev.orderHistory || []).map(o => o.id === orderId ? { ...o, payment_status: 'paid', payment_method: options.isHistorical ? `${method} (Ajuste Histórico)` : method } : o)
            };
          });
        }}
        onUpdateStage={(custKey, newStg) => {
          updateCustomerStage(custKey, newStg);
          setSelectedCustomer(prev => prev ? { ...prev, segment: newStg } : null);
        }}
        onArchiveCustomer={(custKey) => {
          toggleArchiveCustomer(custKey);
          setSelectedCustomer(null);
        }}
      />
    </div>
  );
}
