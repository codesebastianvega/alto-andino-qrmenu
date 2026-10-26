import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { Icon } from '@iconify-icon/react';
import { toast } from '../components/Toast';
import { getGoogleMapsUrl, getWazeUrl, normalizeWhatsAppNumber } from '../utils/formatters';

const VEHICLES = [
  { id: 'moto', label: 'Motocicleta', icon: 'solar:scooter-bold-duotone', emoji: '🛵' },
  { id: 'bici', label: 'Bicicleta', icon: 'solar:bicycle-bold-duotone', emoji: '🚲' },
  { id: 'carro', label: 'Automóvil', icon: 'solar:car-bold-duotone', emoji: '🚗' },
  { id: 'a_pie', label: 'A pie / Caminando', icon: 'solar:walking-bold-duotone', emoji: '🚶' }
];

export default function AdminDeliveryDrivers() {
  const { activeBrand, profile } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const effectiveBrand = activeBrand || brandFromContext;
  const brandId = effectiveBrand?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'deliveries'

  // Modal Crear / Editar Domiciliario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: 'moto',
    plate: '',
    notes: '',
    is_active: true
  });

  // Pedidos a domicilio de hoy para el monitor
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedDriverForDispatch, setSelectedDriverForDispatch] = useState({});

  useEffect(() => {
    if (brandId) {
      loadDrivers();
      loadTodayDeliveryOrders();
    }
  }, [brandId]);

  // Cargar Domiciliarios desde brands.config
  const loadDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('config')
        .eq('id', brandId)
        .single();

      if (error) throw error;

      let list = data?.config?.delivery_drivers || [];
      // Si está vacío en DB, chequear copia local
      if (list.length === 0) {
        const local = localStorage.getItem(`aluna_drivers_${brandId}`);
        if (local) {
          try { list = JSON.parse(local); } catch (e) {}
        }
      }

      setDrivers(list);
    } catch (err) {
      console.warn('Error cargando domiciliarios de Supabase, usando respaldo local:', err);
      const local = localStorage.getItem(`aluna_drivers_${brandId}`);
      if (local) {
        try { setDrivers(JSON.parse(local)); } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar pedidos a domicilio activos de hoy
  const loadTodayDeliveryOrders = async () => {
    try {
      setLoadingOrders(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, status, created_at, total_amount, payment_status, payment_method,
          customer_name, customer_phone, delivery_address, delivery_notes
        `)
        .eq('brand_id', brandId)
        .eq('fulfillment_type', 'delivery')
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveryOrders(data || []);
    } catch (err) {
      console.error('Error cargando pedidos a domicilio:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Guardar en Supabase y respaldo local
  const persistDrivers = async (newList) => {
    setDrivers(newList);
    localStorage.setItem(`aluna_drivers_${brandId}`, JSON.stringify(newList));

    try {
      setSaving(true);
      const { data: currentBrand } = await supabase
        .from('brands')
        .select('config')
        .eq('id', brandId)
        .single();

      const updatedConfig = {
        ...(currentBrand?.config || {}),
        delivery_drivers: newList
      };

      const { error } = await supabase
        .from('brands')
        .update({ config: updatedConfig })
        .eq('id', brandId);

      if (error) throw error;
      toast.success('Flota de domiciliarios sincronizada.');
    } catch (err) {
      console.error('Error sincronizando domiciliarios con Supabase:', err);
      toast.error('Guardado en este navegador (error de sincronización en red).');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      vehicle: 'moto',
      plate: '',
      notes: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      vehicle: driver.vehicle || 'moto',
      plate: driver.plate || '',
      notes: driver.notes || '',
      is_active: driver.is_active ?? true
    });
    setIsModalOpen(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Ingresa el nombre del domiciliario.');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Ingresa el número de WhatsApp para poder despacharle pedidos.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    let updatedList = [];

    if (editingDriver) {
      updatedList = drivers.map(d => d.id === editingDriver.id ? {
        ...d,
        ...formData,
        phone: cleanPhone,
        updated_at: new Date().toISOString()
      } : d);
    } else {
      const newDriver = {
        id: `drv_${Date.now()}`,
        ...formData,
        phone: cleanPhone,
        created_at: new Date().toISOString()
      };
      updatedList = [newDriver, ...drivers];
    }

    await persistDrivers(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteDriver = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${name} de la lista de domiciliarios?`)) return;
    const filtered = drivers.filter(d => d.id !== id);
    await persistDrivers(filtered);
  };

  const handleToggleActive = async (driver) => {
    const updated = drivers.map(d => d.id === driver.id ? { ...d, is_active: !d.is_active } : d);
    await persistDrivers(updated);
  };

  // Despacho de pedido hacia un domiciliario específico por WhatsApp
  const handleDispatchOrder = (order, driver) => {
    if (!driver || !driver.phone) {
      toast.error('Selecciona un domiciliario con número de WhatsApp registrado.');
      return;
    }

    const brandName = effectiveBrand?.name || 'Boku Bento';
    const shortNum = `#${order.id.slice(0, 4).toUpperCase()}`;
    const driverUrl = `${window.location.origin}/domi/${order.id}`;
    const cleanDriverPhone = normalizeWhatsAppNumber(driver.phone);

    const message = `🛵 *NUEVO DOMICILIO ASIGNADO - ${brandName}*\n\nHola ${driver.name}! Tienes una nueva entrega:\n\n📦 *Pedido:* ${shortNum}\n👤 *Cliente:* ${order.customer_name || 'Sin nombre'}\n📞 *Teléfono Cliente:* ${order.customer_phone || 'Sin registrar'}\n📍 *Dirección:* ${order.delivery_address || 'Sin dirección'}\n${order.delivery_notes ? `📝 *Nota:* ${order.delivery_notes}\n` : ''}💰 *Cobro:* ${order.payment_status === 'paid' ? '✅ YA PAGADO (No cobrar dinero)' : `$${Number(order.total_amount || 0).toLocaleString()} (${order.payment_method || 'Efectivo'})`}\n\n📲 *Abre tu App de Entrega con el mapa y llamada aquí:*\n${driverUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(driverUrl);
    }
    toast.success(`Abriendo WhatsApp de ${driver.name} con la orden #${shortNum}...`);
    window.open(`https://wa.me/${cleanDriverPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // KPIs
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.is_active).length;
  const inRouteOrders = deliveryOrders.filter(o => o.status === 'on_table').length;
  const deliveredOrders = deliveryOrders.filter(o => o.status === 'delivered').length;

  return (
    <div className="p-4 sm:p-8 max-w-[1500px] mx-auto space-y-6 animate-fadeUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-widest uppercase bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
              <Icon icon="solar:scooter-bold-duotone" className="text-sm" />
              Operaciones de Entrega
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Gestión de Domiciliarios
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Administra tus repartidores, envía despachos en 1 clic y monitorea las entregas del día.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadTodayDeliveryOrders}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            title="Recargar entregas de hoy"
          >
            <Icon icon="solar:refresh-bold" className={`text-base ${loadingOrders ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Icon icon="solar:user-plus-bold" className="text-base text-emerald-400" />
            <span>+ Registrar Domiciliario</span>
          </button>
        </div>
      </div>

      {/* Barra de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Flota Total</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{totalDrivers}</span>
            <span className="text-xs text-gray-500 font-bold">repartidores</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">En Turno / Activos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{activeDrivers}</span>
            <span className="text-xs text-emerald-600 font-bold">disponibles</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-2xs">
          <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block mb-1">En Ruta Ahora (Hoy)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-700">{inRouteOrders}</span>
            <span className="text-xs text-purple-600 font-bold">en camino</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Entregados Hoy</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{deliveredOrders}</span>
            <span className="text-xs text-gray-500 font-bold">finalizados</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'fleet'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon icon="solar:users-group-two-rounded-bold" className="text-base" />
          <span>Flota de Repartidores ({totalDrivers})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'deliveries'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon icon="solar:scooter-bold-duotone" className="text-base" />
          <span>Monitor de Entregas Hoy ({deliveryOrders.length})</span>
          {inRouteOrders > 0 && (
            <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping"></span>
          )}
        </button>
      </div>

      {/* TAB 1: FLOTA DE REPARTIDORES */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
              <Icon icon="solar:refresh-bold" className="animate-spin text-lg" />
              <span>Cargando flota de repartidores...</span>
            </div>
          ) : drivers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-3xl">
                🛵
              </div>
              <h3 className="text-base font-black text-gray-800">No tienes domiciliarios registrados aún</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Registra a tus repartidores (con su número de WhatsApp) para poder despacharles pedidos con un solo clic y que ellos tengan la ruta en GPS y llamada rápida al cliente.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Icon icon="solar:user-plus-bold" className="text-emerald-400" />
                <span>Registrar Primer Domiciliario</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map(driver => {
                const vehicle = VEHICLES.find(v => v.id === driver.vehicle) || VEHICLES[0];
                const cleanPhone = (driver.phone || '').replace(/\D/g, '');
                const waNumber = normalizeWhatsAppNumber(cleanPhone);

                return (
                  <div
                    key={driver.id}
                    className={`bg-white rounded-3xl border p-5 shadow-2xs transition-all space-y-4 ${
                      driver.is_active ? 'border-gray-200/90' : 'border-gray-200/50 opacity-60 bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-2xl shrink-0">
                          {vehicle.emoji}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-gray-900 truncate leading-snug">
                            {driver.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                              {vehicle.label}
                            </span>
                            {driver.plate && (
                              <span className="text-[10px] font-black text-gray-700 uppercase bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                {driver.plate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(driver)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                          driver.is_active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                        title="Alternar estado activo/inactivo"
                      >
                        {driver.is_active ? '🟢 Activo' : '⚪ Libre'}
                      </button>
                    </div>

                    {/* Teléfono y WhatsApp */}
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon icon="heroicons:phone" className="text-gray-400 text-sm" />
                        <span className="font-bold text-gray-700">{driver.phone}</span>
                      </div>
                      {waNumber && (
                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors shadow-2xs"
                          title="Chatear con el repartidor"
                        >
                          <Icon icon="logos:whatsapp-icon" className="text-xs" />
                          <span>Chat</span>
                        </a>
                      )}
                    </div>

                    {driver.notes && (
                      <p className="text-[11px] text-gray-500 italic px-1 line-clamp-2">
                        "{driver.notes}"
                      </p>
                    )}

                    {/* Acciones de Tarjeta */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(driver)}
                        className="text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Icon icon="solar:pen-bold" className="text-sm" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDriver(driver.id, driver.name)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" className="text-sm" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MONITOR DE ENTREGAS HOY */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="py-16 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
              <Icon icon="solar:refresh-bold" className="animate-spin text-lg" />
              <span>Cargando entregas del día...</span>
            </div>
          ) : deliveryOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-2">
              <Icon icon="solar:box-minimalistic-bold" className="text-4xl text-gray-300 mx-auto" />
              <h3 className="text-sm font-black text-gray-800">No hay pedidos de domicilio registrados hoy</h3>
              <p className="text-xs text-gray-400">Cuando un cliente ordene a domicilio, aparecerá aquí para ser despachado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveryOrders.map(order => {
                const shortNum = `#${order.id.slice(0, 4).toUpperCase()}`;
                const isDelivered = order.status === 'delivered';
                const isOnTheWay = order.status === 'on_table';
                const selectedDriverId = selectedDriverForDispatch[order.id] || (drivers[0]?.id || '');
                const targetDriver = drivers.find(d => d.id === selectedDriverId);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900 text-base">{shortNum}</span>
                        <span className="text-xs text-gray-400 font-semibold">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {isDelivered ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            ✅ Entregado
                          </span>
                        ) : isOnTheWay ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase animate-pulse">
                            🛵 En Camino
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                            ⏳ Por despachar
                          </span>
                        )}

                        <span className="text-xs font-black text-gray-800 ml-auto sm:ml-0">
                          ${Number(order.total_amount || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-gray-700 font-bold flex items-center gap-2">
                        <Icon icon="heroicons:user" className="text-gray-400" />
                        <span>{order.customer_name || 'Cliente sin nombre'}</span>
                        {order.customer_phone && (
                          <span className="text-gray-400 font-normal">({order.customer_phone})</span>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 flex items-start gap-1.5">
                        <Icon icon="heroicons:map-pin" className="text-rose-500 text-sm shrink-0 mt-0.5" />
                        <span className="font-semibold break-words">
                          {order.delivery_address || 'Sin dirección'}
                        </span>
                        {order.delivery_address && (
                          <a
                            href={getGoogleMapsUrl(order.delivery_address)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-black text-blue-600 hover:underline shrink-0 ml-1"
                          >
                            [Maps]
                          </a>
                        )}
                      </div>

                      {order.delivery_notes && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                          📝 {order.delivery_notes}
                        </p>
                      )}
                    </div>

                    {/* Acciones de Despacho */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      {/* Enlace para abrir la vista del domiciliario */}
                      <a
                        href={`/domi/${order.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                        title="Ver app del repartidor para este pedido"
                      >
                        <Icon icon="solar:eye-bold" className="text-sm" />
                        <span>Ver App Repartidor</span>
                      </a>

                      {/* Selector de Domiciliario y Botón de Despacho */}
                      {drivers.length > 0 && !isDelivered && (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedDriverId}
                            onChange={(e) => setSelectedDriverForDispatch(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 bg-white focus:outline-none"
                          >
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} {d.is_active ? '(Activo)' : ''}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDispatchOrder(order, targetDriver)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            title="Despachar pedido por WhatsApp al repartidor"
                          >
                            <Icon icon="logos:whatsapp-icon" className="text-sm" />
                            <span>Despachar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR / EDITAR DOMICILIARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-zoomIn">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
                  🛵
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 leading-tight">
                    {editingDriver ? 'Editar Domiciliario' : 'Registrar Nuevo Domiciliario'}
                  </h3>
                  <span className="text-xs text-gray-400">Datos para asignación y envío de pedidos</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="solar:close-circle-bold" className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Gonzalo Repartidor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-gray-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                  Celular / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 3001234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-gray-900 transition-colors"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Indispensable para enviarle la comanda y enlace de entrega por WhatsApp con 1 clic.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                    Vehículo
                  </label>
                  <select
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none bg-white"
                  >
                    {VEHICLES.map(v => (
                      <option key={v.id} value={v.id}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                    Placa (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: ABC-12D"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 uppercase focus:outline-none focus:border-gray-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                  Notas / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej: Turno de 11am a 4pm, mensajería de confianza"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="driver_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="driver_active" className="text-xs font-bold text-gray-700 select-none cursor-pointer">
                  Activo para recibir domicilios
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingDriver ? 'Actualizar Domiciliario' : 'Guardar Domiciliario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
